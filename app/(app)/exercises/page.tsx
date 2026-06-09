import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Search } from "lucide-react";
import { getUniqueMuscleLabels } from "@/lib/exercises-data";

const CATEGORY_COLORS: Record<string, string> = {
  compound: "#6366f1",
  isolation: "#22c55e",
  cardio: "#f59e0b",
};

const EQUIPMENT_COLORS: Record<string, string> = {
  barbell: "#6366f1",
  dumbbell: "#22c55e",
  cable: "#00d4ff",
  machine: "#f59e0b",
  bodyweight: "#ec4899",
};

export default async function ExercisesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;

  const exercises = await prisma.exercise.findMany({
    where: q ? { name: { contains: q, mode: "insensitive" } } : undefined,
    orderBy: { name: "asc" },
  });

  const categories = [...new Set(exercises.map((e) => e.category))];

  return (
    <div className="flex flex-col gap-5 px-4 pt-10 pb-4">
      <div>
        <h1 className="text-2xl font-bold mb-1">Exercises</h1>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          {exercises.length} exercises in library
        </p>
      </div>

      {/* Search */}
      <form>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }} />
          <input
            name="q"
            className="input pl-9"
            placeholder="Search exercises..."
            defaultValue={q}
          />
        </div>
      </form>

      {/* Exercise list grouped by category */}
      {categories.map((cat) => (
        <div key={cat}>
          <div className="flex items-center gap-2 mb-3">
            <span
              className="badge"
              style={{
                background: `${CATEGORY_COLORS[cat] ?? "#6b7280"}22`,
                color: CATEGORY_COLORS[cat] ?? "#6b7280",
              }}
            >
              {cat}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {exercises
              .filter((e) => e.category === cat)
              .map((ex) => (
                <Link key={ex.id} href={`/exercises/${ex.id}`} className="card block">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold"
                      style={{
                        background: `${EQUIPMENT_COLORS[ex.equipment ?? ""] ?? "#6b7280"}20`,
                        color: EQUIPMENT_COLORS[ex.equipment ?? ""] ?? "#6b7280",
                      }}
                    >
                      {ex.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{ex.name}</p>
                      <p className="text-xs truncate" style={{ color: "var(--muted)" }}>
                        {getUniqueMuscleLabels(ex.muscles).join(" · ")}
                      </p>
                    </div>
                    <span
                      className="text-xs capitalize flex-shrink-0"
                      style={{ color: "var(--muted)" }}
                    >
                      {ex.equipment}
                    </span>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      ))}

      {exercises.length === 0 && (
        <div className="card text-center py-12" style={{ color: "var(--muted)" }}>
          <p className="text-3xl mb-2">🔍</p>
          <p>No exercises found for &ldquo;{q}&rdquo;</p>
        </div>
      )}
    </div>
  );
}
