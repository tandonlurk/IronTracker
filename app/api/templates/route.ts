import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
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

  const template = await prisma.workoutTemplate.create({
    data: {
      userId: session.user.id,
      name,
      exercises: {
        create: exercises.map((e: { exerciseId: string; order: number; sets: number }) => ({
          exerciseId: e.exerciseId,
          order: e.order,
          sets: e.sets,
        })),
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
