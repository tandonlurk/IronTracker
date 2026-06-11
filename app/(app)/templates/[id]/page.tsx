import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import TemplateEditor from "@/components/TemplateEditor";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { notFound } from "next/navigation";

export default async function EditTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = session!.user!.id!;
  const { id } = await params;

  const template = await prisma.workoutTemplate.findFirst({
    where: { id, userId },
    include: {
      exercises: {
        include: { exercise: { select: { id: true, name: true } } },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!template) notFound();

  const initialExercises = template.exercises.map((e) => ({
    name: e.exercise.name,
    sets: e.sets,
    repRange: e.repRange,
  }));

  return (
    <div className="flex flex-col gap-5 px-4 pt-10 pb-6">
      <div className="flex items-center gap-3">
        <Link href="/templates" style={{ color: "var(--muted)" }}>
          <ChevronLeft size={22} />
        </Link>
        <h1 className="text-2xl font-bold">Edit Template</h1>
      </div>
      <TemplateEditor
        templateId={id}
        initialName={template.name}
        initialExercises={initialExercises}
      />
    </div>
  );
}
