import { inngest } from '../client';
import { prisma } from '@/lib/db';
import * as Sentry from '@sentry/nextjs';

export const ingestRSS = inngest.createFunction(
  {
    id: 'ingest-rss',
    name: 'Ingest RSS Feed',
    retries: 2,
  },
  { event: 'ingest/rss' },
  async ({ event, step }) => {
    const { workspaceId, sourceId } = event.data;
    
    // Get source details
    const source = await step.run('get-source', async () => {
      return await prisma.source.findUnique({
        where: { id: sourceId },
      });
    });

    if (!source || source.type !== 'rss' || !source.url || !source.enabled) {
      throw new Error('Invalid RSS source');
    }

    // Fetch RSS feed
    const feedItems = await step.run('fetch-rss', async () => {
      try {
        // In production, use a proper RSS parser like rss-parser
        // For now, we'll return a placeholder
        return [] as Array<{ url: string; title: string }>;
      } catch (error) {
        Sentry.captureException(error, {
          tags: { step: 'fetch-rss' },
          extra: { sourceId, url: source.url },
        });
        throw error;
      }
    });

    // Queue individual ingest jobs for each feed item
    await step.run('queue-ingest-jobs', async () => {
      const jobs = feedItems.map((item) => 
        inngest.send({
          name: 'ingest/web',
          data: {
            url: item.url,
            workspaceId,
            userId: 'system', // RSS ingests are system-initiated
            sourceId,
          },
        })
      );
      
      await Promise.all(jobs);
    });

    return { processed: feedItems.length };
  }
);


