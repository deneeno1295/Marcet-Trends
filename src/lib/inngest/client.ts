import { Inngest } from 'inngest';
import { env } from '../env';

export const inngest = new Inngest({
  id: 'insight-graph',
  eventKey: env.INNGEST_EVENT_KEY,
});

// Event types
export type IngestWebEvent = {
  name: 'ingest/web';
  data: {
    url: string;
    workspaceId: string;
    userId: string;
    sourceId?: string;
    peopleIds?: string[];
    trendIds?: string[];
  };
};

export type IngestRSSEvent = {
  name: 'ingest/rss';
  data: {
    workspaceId: string;
    sourceId: string;
  };
};

export type IngestSalesforceEvent = {
  name: 'ingest/salesforce';
  data: {
    workspaceId: string;
    userId: string;
    objects: string[];
  };
};

export type GenerateDigestEvent = {
  name: 'digest/generate';
  data: {
    workspaceId: string;
    periodStart: string;
    periodEnd: string;
    audience: string;
    cadence: string;
    userId: string;
  };
};

export type Events = 
  | IngestWebEvent 
  | IngestRSSEvent 
  | IngestSalesforceEvent 
  | GenerateDigestEvent;


