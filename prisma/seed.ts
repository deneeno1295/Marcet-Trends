import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo user
  const user = await prisma.user.upsert({
    where: { email: 'demo@insightgraph.com' },
    update: {},
    create: {
      email: 'demo@insightgraph.com',
      name: 'Demo User',
    },
  });

  console.log('✅ Created demo user:', user.email);

  // Create demo workspace
  const workspace = await prisma.workspace.upsert({
    where: { slug: 'demo-workspace' },
    update: {},
    create: {
      name: 'Demo Workspace',
      slug: 'demo-workspace',
      settings: {
        theme: 'light',
      },
    },
  });

  console.log('✅ Created demo workspace:', workspace.name);

  // Create membership
  const membership = await prisma.membership.upsert({
    where: {
      userId_workspaceId: {
        userId: user.id,
        workspaceId: workspace.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      workspaceId: workspace.id,
      role: 'OWNER',
    },
  });

  console.log('✅ Created membership with role:', membership.role);

  // Create trends
  const trends = await Promise.all([
    prisma.trend.upsert({
      where: { id: `${workspace.id}-agentic-enterprise` },
      update: {},
      create: {
        id: `${workspace.id}-agentic-enterprise`,
        workspaceId: workspace.id,
        name: 'Agentic Enterprise',
        description: 'AI agents transforming enterprise workflows and decision-making',
        color: '#3b82f6',
      },
    }),
    prisma.trend.upsert({
      where: { id: `${workspace.id}-rag-observability` },
      update: {},
      create: {
        id: `${workspace.id}-rag-observability`,
        workspaceId: workspace.id,
        name: 'RAG Observability',
        description: 'Monitoring and improving Retrieval-Augmented Generation systems',
        color: '#8b5cf6',
      },
    }),
    prisma.trend.upsert({
      where: { id: `${workspace.id}-multimodal-ai` },
      update: {},
      create: {
        id: `${workspace.id}-multimodal-ai`,
        workspaceId: workspace.id,
        name: 'Multimodal AI',
        description: 'AI systems that process multiple types of data (text, image, audio)',
        color: '#ec4899',
      },
    }),
  ]);

  console.log('✅ Created trends:', trends.length);

  // Create people
  const people = await Promise.all([
    prisma.person.upsert({
      where: { id: `${workspace.id}-sam-altman` },
      update: {},
      create: {
        id: `${workspace.id}-sam-altman`,
        workspaceId: workspace.id,
        name: 'Sam Altman',
        role: 'CEO',
        org: 'OpenAI',
        bio: 'Leading the development of advanced AI systems',
      },
    }),
    prisma.person.upsert({
      where: { id: `${workspace.id}-demis-hassabis` },
      update: {},
      create: {
        id: `${workspace.id}-demis-hassabis`,
        workspaceId: workspace.id,
        name: 'Demis Hassabis',
        role: 'CEO',
        org: 'Google DeepMind',
        bio: 'Pioneering research in artificial general intelligence',
      },
    }),
    prisma.person.upsert({
      where: { id: `${workspace.id}-yann-lecun` },
      update: {},
      create: {
        id: `${workspace.id}-yann-lecun`,
        workspaceId: workspace.id,
        name: 'Yann LeCun',
        role: 'Chief AI Scientist',
        org: 'Meta',
        bio: 'Pioneer in deep learning and computer vision',
      },
    }),
    prisma.person.upsert({
      where: { id: `${workspace.id}-andrew-ng` },
      update: {},
      create: {
        id: `${workspace.id}-andrew-ng`,
        workspaceId: workspace.id,
        name: 'Andrew Ng',
        role: 'Founder',
        org: 'DeepLearning.AI',
        bio: 'Educator and entrepreneur in AI and machine learning',
      },
    }),
  ]);

  console.log('✅ Created people:', people.length);

  // Create tags
  const tags = await Promise.all([
    prisma.tag.upsert({
      where: { name: 'ai' },
      update: {},
      create: { name: 'ai' },
    }),
    prisma.tag.upsert({
      where: { name: 'machine-learning' },
      update: {},
      create: { name: 'machine-learning' },
    }),
    prisma.tag.upsert({
      where: { name: 'llm' },
      update: {},
      create: { name: 'llm' },
    }),
    prisma.tag.upsert({
      where: { name: 'agents' },
      update: {},
      create: { name: 'agents' },
    }),
    prisma.tag.upsert({
      where: { name: 'enterprise' },
      update: {},
      create: { name: 'enterprise' },
    }),
  ]);

  console.log('✅ Created tags:', tags.length);

  // Create sample items
  const sampleItems = [
    {
      title: 'GPT-4 Announces Function Calling Capabilities',
      contentMd: '# GPT-4 Function Calling\n\nOpenAI has introduced function calling for GPT-4...',
      summary: 'OpenAI introduces function calling in GPT-4, enabling more structured interactions with AI agents.',
      score: 18,
      tags: ['ai', 'llm', 'agents'],
      trendIds: [trends[0].id],
      peopleIds: [people[0].id],
    },
    {
      title: 'Enterprise Adoption of AI Agents Accelerates',
      contentMd: '# Enterprise AI Adoption\n\nCompanies are increasingly deploying AI agents...',
      summary: 'Survey shows 60% of Fortune 500 companies now using AI agents in production workflows.',
      score: 22,
      tags: ['ai', 'agents', 'enterprise'],
      trendIds: [trends[0].id],
      peopleIds: [people[3].id],
    },
    {
      title: 'New Techniques for RAG System Monitoring',
      contentMd: '# RAG Observability\n\nResearchers propose novel approaches to monitoring RAG systems...',
      summary: 'New framework enables real-time monitoring and debugging of RAG systems in production.',
      score: 15,
      tags: ['ai', 'llm', 'machine-learning'],
      trendIds: [trends[1].id],
      peopleIds: [people[2].id],
    },
    {
      title: 'Multimodal Models Achieve Human Parity in Visual Tasks',
      contentMd: '# Multimodal AI Breakthrough\n\nLatest models can now process images and text...',
      summary: 'New multimodal AI models demonstrate human-level performance on complex visual reasoning tasks.',
      score: 20,
      tags: ['ai', 'machine-learning'],
      trendIds: [trends[2].id],
      peopleIds: [people[1].id],
    },
  ];

  for (const itemData of sampleItems) {
    const item = await prisma.item.create({
      data: {
        workspaceId: workspace.id,
        title: itemData.title,
        contentMd: itemData.contentMd,
        summary: itemData.summary,
        score: itemData.score,
        occurredAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random date in last week
        tags: {
          create: itemData.tags.map((tagName) => ({
            tag: {
              connect: { name: tagName },
            },
          })),
        },
        people: {
          create: itemData.peopleIds.map((personId) => ({
            person: {
              connect: { id: personId },
            },
            relevance: 1,
          })),
        },
        trends: {
          create: itemData.trendIds.map((trendId) => ({
            trend: {
              connect: { id: trendId },
            },
            momentum: Math.random() * 2,
          })),
        },
      },
    });

    console.log('✅ Created item:', item.title);
  }

  // Create sample links
  const items = await prisma.item.findMany({
    where: { workspaceId: workspace.id },
  });

  if (items.length >= 2) {
    await prisma.link.create({
      data: {
        workspaceId: workspace.id,
        fromItemId: items[0].id,
        toItemId: items[1].id,
        relation: 'supports',
        weight: 1.5,
      },
    });

    await prisma.link.create({
      data: {
        workspaceId: workspace.id,
        fromItemId: items[1].id,
        toItemId: items[2].id,
        relation: 'relates_to',
        weight: 1,
      },
    });

    console.log('✅ Created sample links');
  }

  // Create sample newsletter
  const newsletter = await prisma.newsletter.create({
    data: {
      workspaceId: workspace.id,
      title: 'Weekly AI Pulse - Executive Brief',
      cadence: 'weekly',
      audience: 'Leadership',
      periodStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      periodEnd: new Date(),
      html: '<h1>Weekly AI Pulse</h1><p>Top insights from this week...</p>',
      meta: {
        itemsCount: items.length,
      },
    },
  });

  console.log('✅ Created sample newsletter:', newsletter.title);

  console.log('🎉 Seeding completed!');
  console.log('');
  console.log('Demo credentials:');
  console.log('  Email: demo@insightgraph.com');
  console.log('  Workspace: demo-workspace');
  console.log('');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });


