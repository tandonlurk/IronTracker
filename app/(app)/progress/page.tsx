import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { kgToLbs } from "@/lib/utils";
import ProgressChart from "@/components/ProgressChart";

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
    const e1rm = s.reps === 1 ? s.weight : s.weight * (1 + s.reps / 30);
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
