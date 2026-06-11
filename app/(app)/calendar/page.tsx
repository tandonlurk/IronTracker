import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import WorkoutCalendar from "@/components/WorkoutCalendar";
import Link from "next/link";
import { formatRelativeDate, formatDuration, formatWeight } from "@/lib/utils";
import { Trash2 } from "lucide-react";
import { redirect } from "next/navigation";

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const session = await auth();
  const userId = session!.user!.id!;
  const { page = "1" } = await searchParams;

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { unitSystem: true } });
  const unit = (user?.unitSystem ?? "lbs") as "lbs" | "kg";

  // All workouts for calendar dots
  const allWorkouts = await prisma.workout.findMany({
    where: { userId },
    select: { id: true, name: true, date: true, _count: { select: { sets: true } } },
    orderBy: { date: "desc" },
  });

  // Group by date for calendar
  const dayMap: Record<string, { id: string; name: string; setCount: number }[]> = {};
  for (const w of allWorkouts) {
    const d = new Date(w.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (!dayMap[key]) dayMap[key] = [];
    dayMap[key].push({ id: w.id, name: w.name, setCount: w._count.sets });
  }
  const calendarDays = Object.entries(dayMap).map(([date, workouts]) => ({ date, workouts }));

  // Paginated history list
  const limit = 15;
  const offset = (parseInt(page) - 1) * limit;

  const [workouts, total] = await Promise.all([
    prisma.workout.findMany({
      where: { userId },
      include: { sets: { include: { exercise: { select: { name: true } } } } },
      orderBy: { date: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.workout.count({ where: { userId } }),
  ]);

  const totalPages = Math.ceil(total / limit);
  const currentPage = parseInt(page);

  const thisMonth = new Date().getMonth();
  const thisMonthCount = allWorkouts.filter((w) => new Date(w.date).getMonth() === thisMonth).length;

  async function deleteWorkout(formData: FormData) {
    "use server";
    const wId = formData.get("id") as string;
    const { auth: serverAuth } = await import("@/auth");
    const s = await serverAuth();
    if (!s?.user?.id) return;
    const { prisma: db } = await import("@/lib/prisma");
    await db.workout.delete({ where: { id: wId } });
    redirect("/calendar");
  }

  return (
    <div className="flex flex-col gap-6 px-4 pt-10 pb-4">
      {/* Calendar section */}
      <div>
        <div className="mb-3">
          <h1 className="text-2xl font-bold">Calendar</h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            {thisMonthCount} workouts this month · {total} total
          </p>
        </div>
        <div className="card">
          <WorkoutCalendar days={calendarDays} />
        </div>
      </div>

      {/* History section */}
      <div>
        <h2 className="font-semibold text-base mb-3">History</h2>

        {workouts.length === 0 ? (
          <div className="card text-center py-10" style={{ color: "var(--muted)" }}>
            <p className="text-2xl mb-2">🏋️</p>
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
                        <span>·</span>
                        <span>{formatWeight(totalVolumeKg, unit)} vol</span>
                        {w.duration && (
                          <>
                            <span>·</span>
                            <span>{formatDuration(w.duration)}</span>
                          </>
                        )}
                      </div>
                      {exercises.length > 0 && (
                        <p className="text-xs mt-1.5 truncate" style={{ color: "var(--muted)" }}>
                          {exercises.slice(0, 4).join(" · ")}
                          {exercises.length > 4 ? ` +${exercises.length - 4}` : ""}
                        </p>
                      )}
                    </div>
                    <form action={deleteWorkout}>
                      <input type="hidden" name="id" value={w.id} />
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

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-3">
            {currentPage > 1 && (
              <Link
                href={`/calendar?page=${currentPage - 1}`}
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
                href={`/calendar?page=${currentPage + 1}`}
                className="px-4 py-2 rounded-lg text-sm"
                style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}
              >
                Next
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
