import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { findOrCreateExercise } from "@/lib/exercises";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const templates = await prisma.workoutTemplate.findMany({
    where: { userId: session.user.id },
    include: {
      exercises: {
        include: { exercise: { select: { id: true, name: true, equipment: true } } },
        orderBy: { order: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(templates);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, exercises } = await req.json();

  const resolvedExercises = await Promise.all(
    (exercises as { name: string; sets: number; repRange: string }[]).map(async (e, i) => {
      const exercise = await findOrCreateExercise(e.name);
      return { exerciseId: exercise.id, order: i, sets: e.sets, repRange: e.repRange };
    })
  );

  const template = await prisma.workoutTemplate.create({
    data: {
      userId: session.user.id,
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

  return NextResponse.json(template, { status: 201 });
}
