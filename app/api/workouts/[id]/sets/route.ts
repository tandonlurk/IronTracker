import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: workoutId } = await params;
  const body = await req.json();
  const { exerciseId, setNumber, reps, weight, rpe } = body;

  const set = await prisma.workoutSet.create({
    data: { workoutId, exerciseId, setNumber, reps, weight, rpe },
    include: { exercise: { select: { id: true, name: true } } },
  });

  return NextResponse.json(set, { status: 201 });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const setId = searchParams.get("setId");
  if (!setId) return NextResponse.json({ error: "setId required" }, { status: 400 });

  await prisma.workoutSet.delete({ where: { id: setId } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const setId = searchParams.get("setId");
  if (!setId) return NextResponse.json({ error: "setId required" }, { status: 400 });

  const body = await req.json();
  const set = await prisma.workoutSet.update({
    where: { id: setId },
    data: { reps: body.reps, weight: body.weight },
  });

  return NextResponse.json(set);
}

// Returns last performance for each exercise for the user
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const exerciseId = searchParams.get("exerciseId");
  if (!exerciseId) return NextResponse.json([]);

  const lastSets = await prisma.workoutSet.findMany({
    where: {
      exerciseId,
      workout: { userId: session.user.id },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { workout: { select: { date: true } } },
  });

  return NextResponse.json(lastSets);
}
