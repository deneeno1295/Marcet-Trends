import { auth } from '@clerk/nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { prisma, setRLSContext } from '@/lib/db';
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

    const newsletters = await prisma.newsletter.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(newsletters);
  } catch (error: any) {
    Sentry.captureException(error);
    return NextResponse.json(
      { error: 'Failed to fetch newsletters' },
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

    const { periodStart, periodEnd, audience, cadence } = await req.json();

    // Trigger Inngest function to generate newsletter
    await inngest.send({
      name: 'digest/generate',
      data: {
        workspaceId: workspace.id,
        periodStart,
        periodEnd,
        audience,
        cadence,
        userId,
      },
    });

    return NextResponse.json(
      { message: 'Newsletter generation started' },
      { status: 202 }
    );
  } catch (error: any) {
    Sentry.captureException(error);
    return NextResponse.json(
      { error: error.message || 'Failed to create newsletter' },
      { status: 500 }
    );
  }
}

