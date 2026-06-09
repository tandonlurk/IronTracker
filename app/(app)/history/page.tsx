import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatRelativeDate, formatDuration, formatWeight } from "@/lib/utils";
import { Trash2 } from "lucide-react";

export default async function HistoryPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page = "1" } = await searchParams;
  const session = await auth();
  const userId = session!.user!.id!;

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { unitSystem: true } });
  const unit = (user?.unitSystem ?? "lbs") as "lbs" | "kg";

  const limit = 20;
  const offset = (parseInt(page) - 1) * limit;

  const [workouts, total] = await Promise.all([
    prisma.workout.findMany({
      where: { userId },
      include: {
        sets: { include: { exercise: { select: { name: true } } } },
      },
      orderBy: { date: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.workout.count({ where: { userId } }),
  ]);

  const totalPages = Math.ceil(total / limit);
  const currentPage = parseInt(page);

  return (
    <div className="flex flex-col gap-5 px-4 pt-10 pb-4">
      <div>
        <h1 className="text-2xl font-bold mb-1">Workout History</h1>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          {total} workouts total
        </p>
      </div>

      {workouts.length === 0 ? (
        <div className="card text-center py-16" style={{ color: "var(--muted)" }}>
          <p className="text-3xl mb-2">🏋️</p>
          <p className="font-medium">No workouts yet</p>
          <Link href="/workout" className="text-sm mt-2 block" style={{ color: "var(--accent)" }}>
            Start your first workout
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {workouts.map((w) => {
            const exercises = [...new Set(w.sets.map((s) => s.exercise.name))];
            const totalVolumeKg = w.sets.reduce((sum, s) => sum + s.weight * s.reps, 0);
            return (
              <div key={w.id} className="card">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <Link href={`/workout/${w.id}`}>
                      <p className="font-semibold truncate">{w.name}</p>
                    </Link>
                    <p className="text-xs mb-2" style={{ color: "var(--muted)" }}>
                      {formatRelativeDate(w.date)}
                    </p>
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
                        {exercises.slice(0, 4).join(" · ")}
                        {exercises.length > 4 ? ` +${exercises.length - 4}` : ""}
                      </p>
                    )}
                  </div>
                  <form
                    action={async () => {
                      "use server";
                      const { auth: serverAuth } = await import("@/auth");
                      const s = await serverAuth();
                      if (!s?.user?.id) return;
                      const { prisma: db } = await import("@/lib/prisma");
                      await db.workout.delete({ where: { id: w.id } });
                    }}
                  >
                    <button type="submit" className="p-2 rounded-lg" style={{ color: "var(--muted)" }}>
                      <Trash2 size={16} />
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          {currentPage > 1 && (
            <Link
              href={`/history?page=${currentPage - 1}`}
              className="px-4 py-2 rounded-lg text-sm"
              style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}
            >
              Previous
            </Link>
          )}
          <span className="text-sm" style={{ color: "var(--muted)" }}>
            {currentPage} / {totalPages}
          </span>
          {currentPage < totalPages && (
            <Link
              href={`/history?page=${currentPage + 1}`}
              className="px-4 py-2 rounded-lg text-sm"
              style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
