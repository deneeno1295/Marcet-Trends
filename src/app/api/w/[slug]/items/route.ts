import { auth } from '@clerk/nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { prisma, setRLSContext } from '@/lib/db';
import { getLLM } from '@/lib/llm';
import { inngest } from '@/lib/inngest/client';
import * as Sentry from '@sentry/nextjs';

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await setRLSContext(userId);

    const workspace = await prisma.workspace.findUnique({
      where: { slug: params.slug },
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const items = await prisma.item.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        tags: {
          include: { tag: true },
        },
        people: {
          include: { person: true },
        },
        trends: {
          include: { trend: true },
        },
      },
    });

    return NextResponse.json(items);
  } catch (error: any) {
    Sentry.captureException(error);
    return NextResponse.json(
      { error: 'Failed to fetch items' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await setRLSContext(userId);

    const workspace = await prisma.workspace.findUnique({
      where: { slug: params.slug },
      include: {
        memberships: {
          where: { userId },
        },
      },
    });

    if (!workspace || workspace.memberships.length === 0) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const membership = workspace.memberships[0];
    if (!['OWNER', 'ADMIN', 'EDITOR'].includes(membership.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { url, title, contentMd, summary, tags, peopleIds, trendIds } = await req.json();

    // Generate embedding
    const llm = getLLM();
    const embeddingArray = await llm.embed(contentMd);
    const embedding = Buffer.from(new Float32Array(embeddingArray).buffer);

    // Get or create tags
    const tagRecords = await Promise.all(
      (tags || []).map(async (tagName: string) => {
        return await prisma.tag.upsert({
          where: { name: tagName.toLowerCase() },
          create: { name: tagName.toLowerCase() },
          update: {},
        });
      })
    );

    // Create item
    const item = await prisma.item.create({
      data: {
        workspaceId: workspace.id,
        title,
        rawUrl: url,
        contentMd,
        summary,
        embedding: embedding as any,
        score: 10,
        createdById: userId,
        tags: {
          create: tagRecords.map((tag) => ({ tagId: tag.id })),
        },
      },
      include: {
        tags: {
          include: { tag: true },
        },
      },
    });

    // Associate with people if provided
    if (peopleIds && Array.isArray(peopleIds)) {
      await prisma.itemPerson.createMany({
        data: peopleIds.map((personId: string) => ({
          itemId: item.id,
          personId,
          relevance: 1,
        })),
      });
    }

    // Associate with trends if provided
    if (trendIds && Array.isArray(trendIds)) {
      await prisma.itemTrend.createMany({
        data: trendIds.map((trendId: string) => ({
          itemId: item.id,
          trendId,
          momentum: 1,
        })),
      });
    }

    return NextResponse.json(item, { status: 201 });
  } catch (error: any) {
    Sentry.captureException(error);
    return NextResponse.json(
      { error: error.message || 'Failed to create item' },
      { status: 500 }
    );
  }
}


