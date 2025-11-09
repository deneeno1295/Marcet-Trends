import { inngest } from '../client';
import { prisma } from '@/lib/db';
import { getLLM } from '@/lib/llm';
import Handlebars from 'handlebars';
import * as Sentry from '@sentry/nextjs';

const DAILY_PULSE_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
    h1 { color: #1e40af; }
    .insight { margin-bottom: 20px; padding: 15px; background: #f3f4f6; border-radius: 8px; }
    .tags { margin-top: 8px; }
    .tag { display: inline-block; padding: 4px 8px; background: #e5e7eb; border-radius: 4px; margin-right: 8px; font-size: 12px; }
  </style>
</head>
<body>
  <h1>Daily Pulse - {{title}}</h1>
  <p><strong>Period:</strong> {{periodStart}} to {{periodEnd}}</p>
  
  <h2>Top Signals</h2>
  {{#each topSignals}}
  <div class="insight">
    <h3>{{this.title}}</h3>
    <p>{{this.summary}}</p>
    <div class="tags">
      {{#each this.tags}}
      <span class="tag">{{this}}</span>
      {{/each}}
    </div>
  </div>
  {{/each}}
  
  <h2>Movement</h2>
  <ul>
    {{#each movements}}
    <li>{{this}}</li>
    {{/each}}
  </ul>
  
  <h2>Watch Items</h2>
  <ul>
    {{#each watchItems}}
    <li>{{this}}</li>
    {{/each}}
  </ul>
</body>
</html>
`;

export const generateDigest = inngest.createFunction(
  {
    id: 'generate-digest',
    name: 'Generate Newsletter Digest',
    retries: 2,
  },
  { event: 'digest/generate' },
  async ({ event, step }) => {
    const { workspaceId, periodStart, periodEnd, audience, cadence, userId } = event.data;
    
    const startDate = new Date(periodStart);
    const endDate = new Date(periodEnd);

    // Step 1: Retrieve items from the period
    const items = await step.run('retrieve-items', async () => {
      return await prisma.item.findMany({
        where: {
          workspaceId,
          occurredAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { score: 'desc' },
        take: 20,
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
    });

    // Step 2: Calculate trend momentum
    const trendMomentum = await step.run('calculate-momentum', async () => {
      const trends = await prisma.trend.findMany({
        where: { workspaceId },
        include: {
          items: {
            where: {
              item: {
                occurredAt: {
                  gte: startDate,
                  lte: endDate,
                },
              },
            },
          },
        },
      });

      return trends
        .map((trend) => ({
          name: trend.name,
          count: trend.items.length,
        }))
        .filter((t) => t.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    });

    // Step 3: Generate newsletter content
    const newsletterData = await step.run('generate-content', async () => {
      const topSignals = items.slice(0, 5).map((item) => ({
        title: item.title,
        summary: item.summary || '',
        tags: item.tags.map((t) => t.tag.name),
      }));

      const movements = trendMomentum.map(
        (t) => `${t.name}: ${t.count} new mentions`
      );

      const watchItems = items
        .filter((item) => item.score > 15)
        .slice(0, 3)
        .map((item) => item.title);

      return {
        title: `${cadence === 'daily' ? 'Daily' : 'Weekly'} Pulse - ${audience}`,
        periodStart: startDate.toLocaleDateString(),
        periodEnd: endDate.toLocaleDateString(),
        topSignals,
        movements,
        watchItems,
      };
    });

    // Step 4: Render HTML
    const html = await step.run('render-html', async () => {
      try {
        const template = Handlebars.compile(DAILY_PULSE_TEMPLATE);
        return template(newsletterData);
      } catch (error) {
        Sentry.captureException(error, {
          tags: { step: 'render-html' },
          extra: { workspaceId },
        });
        throw error;
      }
    });

    // Step 5: Save newsletter
    const newsletter = await step.run('save-newsletter', async () => {
      return await prisma.newsletter.create({
        data: {
          workspaceId,
          title: newsletterData.title,
          cadence,
          audience,
          periodStart: startDate,
          periodEnd: endDate,
          html,
          createdById: userId,
          meta: {
            itemsCount: items.length,
            trendMomentum,
          },
        },
      });
    });

    return { newsletterId: newsletter.id };
  }
);


