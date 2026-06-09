import { PrismaClient } from "@prisma/client";
import { EXERCISES } from "../lib/exercises-data";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding exercises...");

  for (const ex of EXERCISES) {
    await prisma.exercise.upsert({
      where: { name: ex.name },
      update: {
        category: ex.category,
        equipment: ex.equipment,
        muscles: ex.muscles,
        musclesSec: ex.musclesSec,
        description: ex.description,
      },
      create: {
        name: ex.name,
        category: ex.category,
        equipment: ex.equipment,
        muscles: ex.muscles,
        musclesSec: ex.musclesSec,
        description: ex.description,
      },
    });
  }

  console.log(`Seeded ${EXERCISES.length} exercises.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
