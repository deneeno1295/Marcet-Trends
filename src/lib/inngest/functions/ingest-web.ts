import { inngest } from '../client';
import { prisma } from '@/lib/db';
import { getLLM } from '@/lib/llm';
import * as Sentry from '@sentry/nextjs';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import TurndownService from 'turndown';

const turndownService = new TurndownService();

async function fetchAndExtractContent(url: string): Promise<string> {
  const response = await fetch(url);
  const html = await response.text();
  
  const dom = new JSDOM(html, { url });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();
  
  if (!article || !article.content) {
    throw new Error('Failed to extract content from URL');
  }
  
  // Convert HTML to markdown
  const markdown = turndownService.turndown(article.content);
  return markdown;
}

export const ingestWeb = inngest.createFunction(
  {
    id: 'ingest-web',
    name: 'Ingest Web Content',
    retries: 3,
  },
  { event: 'ingest/web' },
  async ({ event, step }) => {
    const { url, workspaceId, userId, sourceId, peopleIds, trendIds } = event.data;
    
    // Step 1: Fetch and extract content
    const contentMd = await step.run('fetch-content', async () => {
      try {
        return await fetchAndExtractContent(url);
      } catch (error) {
        Sentry.captureException(error, {
          tags: { step: 'fetch-content' },
          extra: { url, workspaceId },
        });
        throw error;
      }
    });

    // Step 2: Generate summary
    const summary = await step.run('generate-summary', async () => {
      const llm = getLLM();
      return await llm.summarize(contentMd);
    });

    // Step 3: Extract tags
    const tags = await step.run('extract-tags', async () => {
      const llm = getLLM();
      return await llm.tag(contentMd);
    });

    // Step 4: Generate embedding
    const embedding = await step.run('generate-embedding', async () => {
      const llm = getLLM();
      const embeddingArray = await llm.embed(contentMd);
      // Convert to Buffer for pgvector
      return Buffer.from(new Float32Array(embeddingArray).buffer);
    });

    // Step 5: NER for people and trends if not provided
    let extractedPeople: string[] = [];
    let extractedTrends: string[] = [];
    
    if (!peopleIds?.length || !trendIds?.length) {
      const nerResult = await step.run('extract-entities', async () => {
        const llm = getLLM();
        return await llm.ner(contentMd);
      });
      extractedPeople = nerResult.people;
      extractedTrends = nerResult.trends;
    }

    // Step 6: Create item and associations
    const item = await step.run('create-item', async () => {
      // Get or create tags
      const tagRecords = await Promise.all(
        tags.map(async (tagName) => {
          return await prisma.tag.upsert({
            where: { name: tagName.toLowerCase() },
            create: { name: tagName.toLowerCase() },
            update: {},
          });
        })
      );

      // Create item
      const newItem = await prisma.item.create({
        data: {
          workspaceId,
          title: url.split('/').pop() || 'Untitled',
          rawUrl: url,
          sourceId,
          contentMd,
          summary,
          embedding: embedding as any,
          score: 0,
          createdById: userId,
          tags: {
            create: tagRecords.map((tag) => ({ tagId: tag.id })),
          },
        },
      });

      // Associate with people (provided or extracted)
      if (peopleIds?.length) {
        await prisma.itemPerson.createMany({
          data: peopleIds.map((personId) => ({
            itemId: newItem.id,
            personId,
            relevance: 1,
          })),
        });
      } else if (extractedPeople.length > 0) {
        // Create or find people from NER
        for (const personName of extractedPeople) {
          const person = await prisma.person.upsert({
            where: { 
              id: `${workspaceId}-${personName.toLowerCase().replace(/\s+/g, '-')}`,
            },
            create: {
              workspaceId,
              name: personName,
            },
            update: {},
          });
          
          await prisma.itemPerson.create({
            data: {
              itemId: newItem.id,
              personId: person.id,
              relevance: 0.8,
            },
          });
        }
      }

      // Associate with trends (provided or extracted)
      if (trendIds?.length) {
        await prisma.itemTrend.createMany({
          data: trendIds.map((trendId) => ({
            itemId: newItem.id,
            trendId,
            momentum: 1,
          })),
        });
      } else if (extractedTrends.length > 0) {
        // Create or find trends from NER
        for (const trendName of extractedTrends) {
          const trend = await prisma.trend.upsert({
            where: {
              id: `${workspaceId}-${trendName.toLowerCase().replace(/\s+/g, '-')}`,
            },
            create: {
              workspaceId,
              name: trendName,
            },
            update: {},
          });
          
          await prisma.itemTrend.create({
            data: {
              itemId: newItem.id,
              trendId: trend.id,
              momentum: 1,
            },
          });
        }
      }

      return newItem;
    });

    // Step 7: Calculate score (based on recency, connections, etc.)
    await step.run('calculate-score', async () => {
      const score = 10; // Base score for new items
      await prisma.item.update({
        where: { id: item.id },
        data: { score },
      });
    });

    return { itemId: item.id };
  }
);


