import { PrismaClient, Role, CostBand, ScenarioCategory, ProjectStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Admin@12345', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@smartersprint.io' },
    update: {},
    create: {
      email: 'admin@smartersprint.io',
      password: passwordHash,
      firstName: 'Sprint',
      lastName: 'Admin',
      role: Role.ADMIN,
    },
  });

  const cto = await prisma.user.upsert({
    where: { email: 'cto@smartersprint.io' },
    update: {},
    create: {
      email: 'cto@smartersprint.io',
      password: passwordHash,
      firstName: 'Cara',
      lastName: 'TO',
      role: Role.CTO,
    },
  });

  const project = await prisma.project.create({
    data: {
      name: 'Atlas Platform',
      description: 'Flagship modernization program',
      status: ProjectStatus.ACTIVE,
    },
  });

  const skillNames = ['TypeScript', 'NestJS', 'Angular', 'Postgres', 'Kubernetes', 'ML'];
  const skills = await Promise.all(
    skillNames.map((name) =>
      prisma.skill.upsert({ where: { name }, update: {}, create: { name } }),
    ),
  );

  const devs = await Promise.all(
    [
      { pseudonym: 'Falcon-1', costBand: CostBand.SENIOR, rate: 95 },
      { pseudonym: 'Falcon-2', costBand: CostBand.MID, rate: 65 },
      { pseudonym: 'Falcon-3', costBand: CostBand.JUNIOR, rate: 40 },
    ].map((d) =>
      prisma.developer.create({
        data: {
          pseudonym: d.pseudonym,
          department: 'Engineering',
          costBand: d.costBand,
          hourlyRate: d.rate,
          skills: {
            create: skills.slice(0, 3).map((s) => ({
              skillId: s.id,
              proficiency: 4,
            })),
          },
        },
      }),
    ),
  );

  const scenario = await prisma.scenario.create({
    data: {
      projectId: project.id,
      name: 'Baseline Q3',
      category: ScenarioCategory.BASELINE,
      createdBy: cto.id,
      assumptions: {
        sprintLengthDays: 14,
        velocityPerSprint: 35,
        scopeStoryPoints: 280,
        contingencyPct: 0.15,
      },
      allocations: {
        create: devs.map((d) => ({
          developerId: d.id,
          allocationPercent: 80,
          startDate: new Date(),
          endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90),
        })),
      },
    },
  });

  // eslint-disable-next-line no-console
  console.log('Seed complete', { admin: admin.email, project: project.name, scenario: scenario.id });
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
