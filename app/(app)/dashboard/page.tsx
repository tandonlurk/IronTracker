import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatRelativeDate, formatDuration, formatWeight } from "@/lib/utils";
import { Plus, Flame, Trophy, TrendingUp } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, unitSystem: true },
  });

  const unit = (user?.unitSystem ?? "lbs") as "lbs" | "kg";

  const recentWorkouts = await prisma.workout.findMany({
    where: { userId },
    include: {
      sets: { include: { exercise: { select: { name: true } } } },
    },
    orderBy: { date: "desc" },
    take: 5,
  });

  const totalWorkouts = await prisma.workout.count({ where: { userId } });
  const totalSets = await prisma.workoutSet.count({ where: { workout: { userId } } });

  // Volume this week
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const weekSets = await prisma.workoutSet.findMany({
    where: { workout: { userId }, createdAt: { gte: weekStart } },
    select: { weight: true, reps: true },
  });
  const weekVolumeKg = weekSets.reduce((sum, s) => sum + s.weight * s.reps, 0);

  const firstName = user?.name?.split(" ")[0] ?? "Athlete";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="flex flex-col gap-5 px-4 pt-12 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            {greeting},
          </p>
          <h1 className="text-2xl font-bold">{firstName}</h1>
        </div>
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold"
          style={{ background: "var(--accent)", boxShadow: "0 0 16px var(--accent-glow)" }}
        >
          {firstName[0]}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Flame, label: "Workouts", value: totalWorkouts },
          { icon: TrendingUp, label: "Total Sets", value: totalSets },
          {
            icon: Trophy,
            label: `Vol (${unit})`,
            value:
              unit === "lbs"
                ? Math.round(weekVolumeKg * 2.2046).toLocaleString()
                : Math.round(weekVolumeKg).toLocaleString(),
          },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="card flex flex-col items-center gap-1 py-4">
            <Icon size={18} style={{ color: "var(--accent)" }} />
            <span className="text-xl font-bold">{value}</span>
            <span className="text-[11px]" style={{ color: "var(--muted)" }}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Start workout CTA */}
      <Link href="/workout" className="btn-primary">
        <Plus size={20} />
        Start Workout
      </Link>

      {/* Recent workouts */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-base">Recent Workouts</h2>
          <Link href="/history" className="text-sm" style={{ color: "var(--accent)" }}>
            See all
          </Link>
        </div>

        {recentWorkouts.length === 0 ? (
          <div
            className="card text-center py-10"
            style={{ color: "var(--muted)" }}
          >
            <p className="text-3xl mb-2">🏋️</p>
            <p className="font-medium">No workouts yet</p>
            <p className="text-sm mt-1">Start your first session above!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {recentWorkouts.map((w) => {
              const exercises = [...new Set(w.sets.map((s) => s.exercise.name))];
              const totalVolumeKg = w.sets.reduce((sum, s) => sum + s.weight * s.reps, 0);
              return (
                <Link key={w.id} href={`/workout/${w.id}`} className="card block">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold">{w.name}</span>
                    <span className="text-xs" style={{ color: "var(--muted)" }}>
                      {formatRelativeDate(w.date)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm" style={{ color: "var(--muted)" }}>
                    <span>{w.sets.length} sets</span>
                    <span>•</span>
                    <span>{formatWeight(totalVolumeKg, unit)} vol</span>
                    {w.duration && (
                      <>
                        <span>•</span>
                        <span>{formatDuration(w.duration)}</span>
                      </>
                    )}
                  </div>
                  {exercises.length > 0 && (
                    <p className="text-xs mt-2 truncate" style={{ color: "var(--muted)" }}>
                      {exercises.slice(0, 3).join(" · ")}
                      {exercises.length > 3 ? ` +${exercises.length - 3}` : ""}
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
