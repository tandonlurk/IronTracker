import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import WorkoutCalendar from "@/components/WorkoutCalendar";

export default async function CalendarPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const workouts = await prisma.workout.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      date: true,
      _count: { select: { sets: true } },
    },
    orderBy: { date: "desc" },
  });

  // Group by local date string YYYY-MM-DD
  const dayMap: Record<string, { id: string; name: string; setCount: number }[]> = {};
  for (const w of workouts) {
    const d = new Date(w.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (!dayMap[key]) dayMap[key] = [];
    dayMap[key].push({ id: w.id, name: w.name, setCount: w._count.sets });
  }

  const days = Object.entries(dayMap).map(([date, workouts]) => ({ date, workouts }));

  const totalWorkouts = workouts.length;
  const thisMonth = new Date().getMonth();
  const thisMonthCount = workouts.filter((w) => new Date(w.date).getMonth() === thisMonth).length;

  return (
    <div className="flex flex-col gap-5 px-4 pt-10 pb-4">
      <div>
        <h1 className="text-2xl font-bold mb-1">Calendar</h1>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          {thisMonthCount} workouts this month · {totalWorkouts} total
        </p>
      </div>

      <div className="card">
        <WorkoutCalendar days={days} />
      </div>
    </div>
  );
}
