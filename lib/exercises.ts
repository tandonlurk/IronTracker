import { prisma } from "@/lib/prisma";

// Finds an exercise by name (case-insensitive), or creates a new "custom"
// exercise if no match exists. Lets users type any exercise name into a
// template without needing it to already exist in the library.
export async function findOrCreateExercise(name: string) {
  const trimmed = name.trim();
  const existing = await prisma.exercise.findFirst({
    where: { name: { equals: trimmed, mode: "insensitive" } },
  });
  if (existing) return existing;
  return prisma.exercise.create({
    data: { name: trimmed, category: "custom", muscles: [], musclesSec: [] },
  });
}
