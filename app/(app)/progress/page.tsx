import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { kgToLbs, parseWeightToKg } from "@/lib/utils";
import { redirect } from "next/navigation";
import ProgressChart from "@/components/ProgressChart";
import BodyDiagram from "@/components/BodyDiagram";
import { Target, Trash2 } from "lucide-react";

function e1rmOf(weight: number, reps: number) {
  return reps === 1 ? weight : weight * (1 + reps / 30);
}

export default async function ProgressPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { unitSystem: true },
  });
  const unit = (user?.unitSystem ?? "lbs") as "lbs" | "kg";

  // Weekly volume for last 8 weeks
  const eightWeeksAgo = new Date();
  eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);

  const allSets = await prisma.workoutSet.findMany({
    where: { workout: { userId }, createdAt: { gte: eightWeeksAgo } },
    select: { weight: true, reps: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  // Group by week
  const weeklyVolume: Record<string, number> = {};
  for (const s of allSets) {
    const d = new Date(s.createdAt);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const key = weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    weeklyVolume[key] = (weeklyVolume[key] ?? 0) + s.weight * s.reps;
  }

  const volumeData = Object.entries(weeklyVolume).map(([date, kg]) => ({
    date,
    value: unit === "lbs" ? Math.round(kgToLbs(kg)) : Math.round(kg),
  }));

  // PRs for top exercises
  const topExerciseSets = await prisma.workoutSet.findMany({
    where: { workout: { userId } },
    include: { exercise: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });

  // Compute best e1RM per exercise
  const exercisePRs: Record<string, { name: string; weight: number; reps: number; e1rm: number; history: { date: string; value: number }[] }> = {};
  for (const s of topExerciseSets) {
    const e1rm = e1rmOf(s.weight, s.reps);
    if (!exercisePRs[s.exerciseId]) {
      exercisePRs[s.exerciseId] = { name: s.exercise.name, weight: s.weight, reps: s.reps, e1rm, history: [] };
    } else if (e1rm > exercisePRs[s.exerciseId].e1rm) {
      exercisePRs[s.exerciseId] = { ...exercisePRs[s.exerciseId], weight: s.weight, reps: s.reps, e1rm };
    }
  }

  const prs = Object.values(exercisePRs)
    .sort((a, b) => b.e1rm - a.e1rm)
    .slice(0, 8);

  // Total stats
  const totalWorkouts = await prisma.workout.count({ where: { userId } });
  const totalSets = await prisma.workoutSet.count({ where: { workout: { userId } } });
  const totalVolumeKg = allSets.reduce((s, x) => s + x.weight * x.reps, 0);

  function fw(kg: number) {
    if (unit === "lbs") return `${Math.round(kgToLbs(kg)).toLocaleString()} lbs`;
    return `${Math.round(kg).toLocaleString()} kg`;
  }

  // ── Goals ──
  const goals = await prisma.goal.findMany({
    where: { userId },
    include: { exercise: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });

  const loggedExerciseRows = await prisma.workoutSet.findMany({
    where: { workout: { userId } },
    select: { exercise: { select: { id: true, name: true } } },
    distinct: ["exerciseId"],
  });
  const loggedExercises = loggedExerciseRows
    .map((r) => r.exercise)
    .sort((a, b) => a.name.localeCompare(b.name));

  const goalExerciseIds = new Set(goals.map((g) => g.exerciseId));
  const availableExercises = loggedExercises.filter((e) => !goalExerciseIds.has(e.id));

  // ── Muscle coverage from saved templates ──
  const templates = await prisma.workoutTemplate.findMany({
    where: { userId },
    include: {
      exercises: {
        include: { exercise: { select: { muscles: true, musclesSec: true } } },
      },
    },
  });

  const muscleScores: Record<string, number> = {};
  for (const t of templates) {
    for (const te of t.exercises) {
      for (const m of te.exercise.muscles) muscleScores[m] = (muscleScores[m] ?? 0) + 1;
      for (const m of te.exercise.musclesSec) muscleScores[m] = (muscleScores[m] ?? 0) + 0.5;
    }
  }
  const maxScore = Math.max(1, ...Object.values(muscleScores));
  const muscleHeatmap: Record<string, number> = {};
  for (const [m, score] of Object.entries(muscleScores)) muscleHeatmap[m] = score / maxScore;

  async function addGoal(formData: FormData) {
    "use server";
    const exerciseId = formData.get("exerciseId") as string;
    const targetWeightRaw = parseFloat(formData.get("targetWeight") as string);
    const targetReps = Math.max(1, parseInt(formData.get("targetReps") as string) || 1);
    if (!exerciseId || !targetWeightRaw) return;

    const { auth: serverAuth } = await import("@/auth");
    const s = await serverAuth();
    if (!s?.user?.id) return;
    const { prisma: db } = await import("@/lib/prisma");

    const u = await db.user.findUnique({ where: { id: s.user.id }, select: { unitSystem: true } });
    const goalUnit = (u?.unitSystem ?? "lbs") as "lbs" | "kg";
    const targetWeight = parseWeightToKg(targetWeightRaw, goalUnit);

    await db.goal.upsert({
      where: { userId_exerciseId: { userId: s.user.id, exerciseId } },
      update: { targetWeight, targetReps },
      create: { userId: s.user.id, exerciseId, targetWeight, targetReps },
    });
    redirect("/progress");
  }

  async function deleteGoal(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    const { auth: serverAuth } = await import("@/auth");
    const s = await serverAuth();
    if (!s?.user?.id) return;
    const { prisma: db } = await import("@/lib/prisma");
    await db.goal.deleteMany({ where: { id, userId: s.user.id } });
    redirect("/progress");
  }

  return (
    <div className="flex flex-col gap-5 px-4 pt-10 pb-4">
      <h1 className="text-2xl font-bold">Progress</h1>

      {/* Overview cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Workouts", value: totalWorkouts.toString() },
          { label: "Total Sets", value: totalSets.toLocaleString() },
          { label: "Vol (8w)", value: fw(totalVolumeKg) },
        ].map(({ label, value }) => (
          <div key={label} className="card flex flex-col items-center gap-1 py-3">
            <span className="text-lg font-bold">{value}</span>
            <span className="text-[11px] text-center" style={{ color: "var(--muted)" }}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Weekly volume chart */}
      <div className="card">
        <h3 className="font-semibold mb-4">Weekly Volume</h3>
        <ProgressChart data={volumeData} unit={unit} />
      </div>

      {/* Goals */}
      <div>
        <h2 className="font-semibold text-base mb-3">Goals</h2>

        {goals.length > 0 && (
          <div className="flex flex-col gap-2 mb-3">
            {goals.map((g) => {
              const current = exercisePRs[g.exerciseId]?.e1rm ?? 0;
              const target = e1rmOf(g.targetWeight, g.targetReps);
              const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
              return (
                <div key={g.id} className="card">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium">{g.exercise.name}</p>
                      <p className="text-xs" style={{ color: "var(--muted)" }}>
                        Goal: {fw(g.targetWeight)} × {g.targetReps}
                      </p>
                    </div>
                    <form action={deleteGoal}>
                      <input type="hidden" name="id" value={g.id} />
                      <button type="submit" className="p-2 rounded-lg" style={{ color: "var(--muted)" }}>
                        <Trash2 size={15} />
                      </button>
                    </form>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--surface2)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, background: "var(--accent)", transition: "width 0.3s" }}
                    />
                  </div>
                  <p className="text-xs mt-1.5" style={{ color: "var(--muted)" }}>
                    {pct}% · current best ~{fw(current)} e1RM
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {loggedExercises.length === 0 ? (
          <div className="card text-center py-8" style={{ color: "var(--muted)" }}>
            <p>Log some workouts, then come back to set goals for your lifts.</p>
          </div>
        ) : availableExercises.length > 0 ? (
          <form action={addGoal} className="card flex flex-col gap-3">
            <span className="font-medium text-sm">Set a New Goal</span>
            <select name="exerciseId" className="input text-sm" required defaultValue="">
              <option value="" disabled>
                Choose a lift...
              </option>
              {availableExercises.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 flex-1">
                <span className="text-xs whitespace-nowrap" style={{ color: "var(--muted)" }}>
                  Target ({unit})
                </span>
                <input
                  type="number"
                  name="targetWeight"
                  step="0.5"
                  min="0"
                  required
                  className="input text-sm text-center"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: "var(--muted)" }}>
                  Reps
                </span>
                <input
                  type="number"
                  name="targetReps"
                  defaultValue={1}
                  min="1"
                  max="20"
                  className="input text-sm text-center"
                  style={{ width: "56px" }}
                />
              </div>
            </div>
            <button type="submit" className="btn-secondary">
              <Target size={16} />
              Add Goal
            </button>
          </form>
        ) : null}
      </div>

      {/* Muscle coverage */}
      <div>
        <h2 className="font-semibold text-base mb-3">Muscle Coverage</h2>
        {templates.length === 0 ? (
          <div className="card text-center py-8" style={{ color: "var(--muted)" }}>
            <p>Save a workout template to see which muscles your routine covers.</p>
          </div>
        ) : (
          <div className="card flex flex-col items-center">
            <p className="text-xs mb-4 self-start" style={{ color: "var(--muted)" }}>
              Based on exercises in your saved workouts. Red areas aren&apos;t programmed yet.
            </p>
            <BodyDiagram heatmap={muscleHeatmap} />
          </div>
        )}
      </div>

      {/* Personal Records */}
      <div>
        <h2 className="font-semibold text-base mb-3">Personal Records (e1RM)</h2>
        {prs.length === 0 ? (
          <div className="card text-center py-8" style={{ color: "var(--muted)" }}>
            <p>Log some workouts to see your PRs here.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {prs.map(({ name, weight, reps, e1rm }) => (
              <div
                key={name}
                className="card flex items-center justify-between"
              >
                <div>
                  <p className="font-medium">{name}</p>
                  <p className="text-sm" style={{ color: "var(--muted)" }}>
                    {fw(weight)} × {reps}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold" style={{ color: "var(--accent)" }}>
                    {fw(e1rm)}
                  </p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>
                    e1RM
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
