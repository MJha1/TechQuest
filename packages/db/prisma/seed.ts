/**
 * Seeds the launch missions + badges into the database. Content lives in
 * ./content.ts; this file only writes it. Idempotent AND non-destructive:
 * missions are upserted by slug and each step is upserted by (missionId, order)
 * so re-running updates content in place WITHOUT deleting step rows — that keeps
 * children's per-step progress (ChildMissionStep cascades if a step is deleted).
 * Any steps beyond the current definition are pruned.
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

    // Upsert each step by its (missionId, order) slot so existing rows keep
    // their id — deleting a step would cascade-delete children's progress.
    for (const [index, step] of steps.entries()) {
      const order = index + 1;
      await prisma.missionStep.upsert({
        where: { missionId_order: { missionId: saved.id, order } },
        update: {
          type: step.type,
          title: step.title,
          content: step.content,
          xpReward: step.xpReward ?? 10,
        },
        create: {
          missionId: saved.id,
          order,
          type: step.type,
          title: step.title,
          content: step.content,
          xpReward: step.xpReward ?? 10,
        },
      });
    }

    // Prune any steps left over from a previously longer version of the mission.
    await prisma.missionStep.deleteMany({
      where: { missionId: saved.id, order: { gt: steps.length } },
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

