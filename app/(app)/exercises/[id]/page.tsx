import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import BodyDiagram from "@/components/BodyDiagram";
import { getUniqueMuscleLabels } from "@/lib/exercises-data";
import { formatWeight, formatDate } from "@/lib/utils";
import { ArrowLeft, TrendingUp } from "lucide-react";
import Link from "next/link";

export default async function ExerciseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const userId = session!.user!.id!;

  const exercise = await prisma.exercise.findUnique({ where: { id } });
  if (!exercise) notFound();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { unitSystem: true },
  });
  const unit = (user?.unitSystem ?? "lbs") as "lbs" | "kg";

  // Personal records — best set (1RM estimate using Epley formula)
  const allSets = await prisma.workoutSet.findMany({
    where: { exerciseId: id, workout: { userId } },
    include: { workout: { select: { date: true, name: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const bestSet = allSets.reduce<{ weight: number; reps: number; date: Date; e1rm: number } | null>(
    (best, s) => {
      const e1rm = s.reps === 1 ? s.weight : s.weight * (1 + s.reps / 30);
      if (!best || e1rm > best.e1rm) {
        return { weight: s.weight, reps: s.reps, date: s.workout.date, e1rm };
      }
      return best;
    },
    null
  );

  const primaryLabels = getUniqueMuscleLabels(exercise.muscles);
  const secondaryLabels = getUniqueMuscleLabels(exercise.musclesSec);

  return (
    <div className="flex flex-col gap-5 px-4 pt-10 pb-6">
      {/* Back nav */}
      <Link href="/exercises" className="flex items-center gap-1.5 text-sm" style={{ color: "var(--accent)" }}>
        <ArrowLeft size={16} />
        Exercises
      </Link>

      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold mb-1">{exercise.name}</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="badge"
            style={{ background: "rgba(99,102,241,0.15)", color: "var(--accent)" }}
          >
            {exercise.category}
          </span>
          {exercise.equipment && (
            <span
              className="badge"
              style={{ background: "rgba(100,100,100,0.15)", color: "var(--muted)" }}
            >
              {exercise.equipment}
            </span>
          )}
        </div>
        {exercise.description && (
          <p className="text-sm mt-3" style={{ color: "var(--muted)" }}>
            {exercise.description}
          </p>
        )}
      </div>

      {/* Muscle groups */}
      <div className="card">
        <h3 className="font-semibold mb-3">Muscles Worked</h3>
        <div className="flex flex-wrap gap-2 mb-2">
          {primaryLabels.map((m) => (
            <span
              key={m}
              className="badge"
              style={{ background: "rgba(239,68,68,0.15)", color: "var(--red)" }}
            >
              {m}
            </span>
          ))}
          {secondaryLabels.map((m) => (
            <span
              key={m}
              className="badge"
              style={{ background: "rgba(249,115,22,0.15)", color: "#f97316" }}
            >
              {m}
            </span>
          ))}
        </div>
      </div>

      {/* Body hologram */}
      <div className="card flex flex-col items-center">
        <h3 className="font-semibold mb-4 self-start">Muscle Activation</h3>
        <BodyDiagram
          primaryMuscles={exercise.muscles}
          secondaryMuscles={exercise.musclesSec}
        />
      </div>

      {/* Personal record */}
      {bestSet && (
        <div
          className="card"
          style={{ borderColor: "rgba(99,102,241,0.3)", background: "rgba(99,102,241,0.05)" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={18} style={{ color: "var(--accent)" }} />
            <h3 className="font-semibold">Personal Record</h3>
          </div>
          <div className="flex items-end gap-3">
            <div>
              <p className="text-3xl font-bold">{formatWeight(bestSet.weight, unit)}</p>
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                × {bestSet.reps} reps
              </p>
            </div>
            <div className="mb-1">
              <p className="text-sm font-medium" style={{ color: "var(--accent)" }}>
                ~{formatWeight(bestSet.e1rm, unit)} e1RM
              </p>
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                {formatDate(bestSet.date)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recent history */}
      {allSets.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3">Recent Sets</h3>
          <div className="flex flex-col gap-2">
            {allSets.slice(0, 10).map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between px-4 py-3 rounded-xl"
                style={{ background: "var(--surface)" }}
              >
                <div>
                  <span className="font-medium">{formatWeight(s.weight, unit)}</span>
                  <span className="text-sm ml-2" style={{ color: "var(--muted)" }}>
                    × {s.reps} reps
                  </span>
                </div>
                <span className="text-xs" style={{ color: "var(--muted)" }}>
                  {formatDate(s.workout.date)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {allSets.length === 0 && (
        <div className="card text-center py-8" style={{ color: "var(--muted)" }}>
          <p>No history for this exercise yet.</p>
          <Link href="/workout" className="text-sm mt-2 block" style={{ color: "var(--accent)" }}>
            Start a workout
          </Link>
        </div>
      )}
    </div>
  );
}
