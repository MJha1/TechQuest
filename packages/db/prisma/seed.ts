/**
 * Seeds the launch missions + badges into the database. Content lives in
 * ./content.ts; this file only writes it. Idempotent: missions are upserted by
 * slug and their steps are fully rebuilt each run, so it is safe to re-run.
 */
import { PrismaClient } from "@prisma/client";
import { missions, badges } from "./content.js";

const prisma = new PrismaClient();

async function main() {
  // Badges (upsert by slug), then remove any that are no longer defined.
  for (const badge of badges) {
    await prisma.badge.upsert({
      where: { slug: badge.slug },
      update: {
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        criteria: badge.criteria,
      },
      create: badge,
    });
  }
  await prisma.badge.deleteMany({
    where: { slug: { notIn: badges.map((b) => b.slug) } },
  });

  // Missions + steps (rebuild steps each run for idempotency).
  for (const mission of missions) {
    const { steps, ...missionData } = mission;

    const saved = await prisma.mission.upsert({
      where: { slug: mission.slug },
      update: {
        title: missionData.title,
        subtitle: missionData.subtitle,
        concept: missionData.concept,
        description: missionData.description,
        order: missionData.order,
        estimatedMinutes: missionData.estimatedMinutes,
      },
      create: {
        slug: missionData.slug,
        title: missionData.title,
        subtitle: missionData.subtitle,
        concept: missionData.concept,
        description: missionData.description,
        order: missionData.order,
        estimatedMinutes: missionData.estimatedMinutes,
      },
    });

    await prisma.missionStep.deleteMany({ where: { missionId: saved.id } });

    await prisma.missionStep.createMany({
      data: steps.map((step, index) => ({
        missionId: saved.id,
        order: index + 1,
        type: step.type,
        title: step.title,
        content: step.content,
        xpReward: step.xpReward ?? 10,
      })),
    });

    // eslint-disable-next-line no-console
    console.log(`Seeded mission '${saved.slug}' with ${steps.length} steps.`);
  }

  const missionCount = await prisma.mission.count();
  const stepCount = await prisma.missionStep.count();
  const badgeCount = await prisma.badge.count();
  // eslint-disable-next-line no-console
  console.log(`Done: ${missionCount} missions, ${stepCount} steps, ${badgeCount} badges.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

