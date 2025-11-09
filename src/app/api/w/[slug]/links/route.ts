import { auth } from '@clerk/nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { prisma, setRLSContext } from '@/lib/db';
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

    const links = await prisma.link.findMany({
      where: { workspaceId: workspace.id },
      include: {
        from: true,
        to: true,
      },
    });

    return NextResponse.json(links);
  } catch (error: any) {
    Sentry.captureException(error);
    return NextResponse.json(
      { error: 'Failed to fetch links' },
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

    const { fromItemId, toItemId, relation, weight } = await req.json();

    if (!fromItemId || !toItemId || !relation) {
      return NextResponse.json(
        { error: 'fromItemId, toItemId, and relation are required' },
        { status: 400 }
      );
    }

    const link = await prisma.link.create({
      data: {
        workspaceId: workspace.id,
        fromItemId,
        toItemId,
        relation,
        weight: weight || 1,
      },
      include: {
        from: true,
        to: true,
      },
    });

    return NextResponse.json(link, { status: 201 });
  } catch (error: any) {
    Sentry.captureException(error);
    return NextResponse.json(
      { error: error.message || 'Failed to create link' },
      { status: 500 }
    );
  }
}


