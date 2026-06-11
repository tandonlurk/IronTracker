import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Trash2, Pencil, Play, BookMarked } from "lucide-react";

export default async function TemplatesPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const templates = await prisma.workoutTemplate.findMany({
    where: { userId },
    include: {
      exercises: {
        include: { exercise: { select: { name: true } } },
        orderBy: { order: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  async function deleteTemplate(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    const { auth: serverAuth } = await import("@/auth");
    const s = await serverAuth();
    if (!s?.user?.id) return;
    const { prisma: db } = await import("@/lib/prisma");
    await db.workoutTemplate.delete({ where: { id } });
    redirect("/templates");
  }

  return (
    <div className="flex flex-col gap-5 px-4 pt-10 pb-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Templates</h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            {templates.length} saved workout{templates.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/templates/new"
          className="w-10 h-10 flex items-center justify-center rounded-xl"
          style={{ background: "var(--accent)", color: "var(--background)" }}
        >
          <Plus size={20} />
        </Link>
      </div>

      {templates.length === 0 ? (
        <div
          className="card flex flex-col items-center text-center gap-3 py-12"
          style={{ color: "var(--muted)" }}
        >
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: "var(--surface2)" }}
          >
            <BookMarked size={22} style={{ color: "var(--foreground)" }} />
          </div>
          <div>
            <p className="font-medium" style={{ color: "var(--foreground)" }}>
              No templates yet
            </p>
            <p className="text-sm mt-1">Save your go-to workouts to start them instantly.</p>
          </div>
          <Link href="/templates/new" className="btn-primary mt-1" style={{ width: "auto", padding: "10px 20px" }}>
            <Plus size={16} />
            New Template
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {templates.map((t) => (
            <div key={t.id} className="card">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{t.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                    {t.exercises.length} exercise{t.exercises.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-0.5">
                  <Link
                    href={`/templates/${t.id}`}
                    className="p-2 rounded-lg"
                    style={{ color: "var(--muted)" }}
                  >
                    <Pencil size={15} />
                  </Link>
                  <form action={deleteTemplate}>
                    <input type="hidden" name="id" value={t.id} />
                    <button type="submit" className="p-2 rounded-lg" style={{ color: "var(--muted)" }}>
                      <Trash2 size={15} />
                    </button>
                  </form>
                </div>
              </div>

              {t.exercises.length > 0 && (
                <p className="text-xs mb-3 truncate" style={{ color: "var(--muted)" }}>
                  {t.exercises.map((e) => `${e.exercise.name} (${e.sets}×${e.repRange})`).join(" · ")}
                </p>
              )}

              <Link
                href={`/workout?template=${t.id}`}
                className="btn-primary py-2.5 text-sm"
              >
                <Play size={14} />
                Start Workout
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
