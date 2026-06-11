import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { findOrCreateExercise } from "@/lib/exercises";
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const template = await prisma.workoutTemplate.findFirst({
    where: { id, userId: session.user.id },
    include: {
      exercises: {
        include: { exercise: { select: { id: true, name: true, category: true, equipment: true, muscles: true } } },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!template) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(template);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { name, exercises } = await req.json();

  const resolvedExercises = await Promise.all(
    (exercises as { name: string; sets: number; repRange: string }[]).map(async (e, i) => {
      const exercise = await findOrCreateExercise(e.name);
      return { exerciseId: exercise.id, order: i, sets: e.sets, repRange: e.repRange };
    })
  );

  await prisma.workoutTemplateExercise.deleteMany({ where: { templateId: id } });

  const template = await prisma.workoutTemplate.update({
    where: { id },
    data: {
      name,
      exercises: {
        create: resolvedExercises,
      },
    },
    include: {
      exercises: {
        include: { exercise: { select: { id: true, name: true } } },
        orderBy: { order: "asc" },
      },
    },
  });

  return NextResponse.json(template);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.workoutTemplate.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
