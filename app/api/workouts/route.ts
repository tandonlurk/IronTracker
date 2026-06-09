import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit") ?? 20);
  const offset = Number(searchParams.get("offset") ?? 0);

  const workouts = await prisma.workout.findMany({
    where: { userId: session.user.id },
    include: {
      sets: {
        include: { exercise: { select: { id: true, name: true } } },
        orderBy: [{ exerciseId: "asc" }, { setNumber: "asc" }],
      },
    },
    orderBy: { date: "desc" },
    take: limit,
    skip: offset,
  });

  const total = await prisma.workout.count({ where: { userId: session.user.id } });

  return NextResponse.json({ workouts, total });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name } = body;

  const workout = await prisma.workout.create({
    data: { userId: session.user.id, name: name ?? "Workout" },
  });

  return NextResponse.json(workout, { status: 201 });
}
