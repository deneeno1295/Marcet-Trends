import { auth } from '@clerk/nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { prisma, setRLSContext } from '@/lib/db';
import { getLLM } from '@/lib/llm';
import { checkRateLimit, dropRateLimiter } from '@/lib/rate-limit';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import TurndownService from 'turndown';
import * as Sentry from '@sentry/nextjs';

const turndownService = new TurndownService();

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check rate limit
    const rateLimitResult = await checkRateLimit(dropRateLimiter, userId);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          limit: rateLimitResult.limit,
          reset: new Date(rateLimitResult.reset).toISOString(),
        },
        { status: 429 }
      );
    }

    await setRLSContext(userId);

    // Get workspace
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

    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Fetch and extract content
    const response = await fetch(url);
    const html = await response.text();

    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article || !article.content) {
      return NextResponse.json(
        { error: 'Failed to extract content from URL' },
        { status: 400 }
      );
    }

    // Convert HTML to markdown
    const contentMd = turndownService.turndown(article.content);
    const title = article.title || url.split('/').pop() || 'Untitled';

    // Generate summary and tags
    const llm = getLLM();
    const [summary, tags] = await Promise.all([
      llm.summarize(contentMd),
      llm.tag(contentMd),
    ]);

    return NextResponse.json({
      title,
      contentMd,
      summary,
      tags,
    });
  } catch (error: any) {
    Sentry.captureException(error, {
      tags: { endpoint: 'drop' },
      extra: { slug: params.slug },
    });

    return NextResponse.json(
      { error: error.message || 'Failed to process content' },
      { status: 500 }
    );
  }
}

