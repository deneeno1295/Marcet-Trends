import jsforce from 'jsforce';
import { prisma } from '../db';
import { env } from '../env';

export interface SalesforceConfig {
  accessToken: string;
  refreshToken: string;
  instanceUrl: string;
}

export class SalesforceClient {
  private conn: jsforce.Connection;

  constructor(config: SalesforceConfig) {
    this.conn = new jsforce.Connection({
      oauth2: {
        clientId: env.SALESFORCE_CLIENT_ID!,
        clientSecret: env.SALESFORCE_CLIENT_SECRET!,
        redirectUri: `${env.NEXT_PUBLIC_APP_URL}/api/auth/salesforce/callback`,
      },
      instanceUrl: config.instanceUrl,
      accessToken: config.accessToken,
      refreshToken: config.refreshToken,
    });
  }

  /**
   * Get Salesforce connection for a user
   */
  static async forUser(userId: string): Promise<SalesforceClient | null> {
    const account = await prisma.oAuthAccount.findFirst({
      where: {
        userId,
        provider: 'salesforce',
      },
    });

    if (!account) {
      return null;
    }

    return new SalesforceClient({
      accessToken: account.accessToken,
      refreshToken: account.refreshToken || '',
      instanceUrl: account.instanceUrl || 'https://login.salesforce.com',
    });
  }

  /**
   * Query Opportunities
   */
  async queryOpportunities(since?: Date) {
    const query = `
      SELECT Id, Name, StageName, Amount, CloseDate, Description, 
             Account.Name, Owner.Name, CreatedDate, LastModifiedDate
      FROM Opportunity
      ${since ? `WHERE LastModifiedDate >= ${since.toISOString()}` : ''}
      ORDER BY LastModifiedDate DESC
      LIMIT 100
    `;

    const result = await this.conn.query(query);
    return result.records;
  }

  /**
   * Query Cases
   */
  async queryCases(since?: Date) {
    const query = `
      SELECT Id, CaseNumber, Subject, Description, Status, Priority,
             Account.Name, Owner.Name, CreatedDate, LastModifiedDate
      FROM Case
      ${since ? `WHERE LastModifiedDate >= ${since.toISOString()}` : ''}
      ORDER BY LastModifiedDate DESC
      LIMIT 100
    `;

    const result = await this.conn.query(query);
    return result.records;
  }

  /**
   * Upsert Insights to Salesforce
   */
  async upsertInsights(insights: Array<{
    externalId: string;
    title: string;
    summary: string;
    url?: string;
    score: number;
    occurredAt: Date;
    tags: string[];
    trendNames: string[];
    personNames: string[];
  }>) {
    // Map to Salesforce custom object format
    const records = insights.map((insight) => ({
      ExternalId__c: insight.externalId,
      Title__c: insight.title,
      Summary__c: insight.summary,
      URL__c: insight.url,
      Score__c: insight.score,
      OccurredAt__c: insight.occurredAt.toISOString(),
      Tags__c: insight.tags.join(';'),
      TrendNames__c: insight.trendNames.join(';'),
      PersonNames__c: insight.personNames.join(';'),
    }));

    // Upsert using external ID
    const result = await this.conn.sobject('Insight__c').upsert(records, 'ExternalId__c');
    return result;
  }

  /**
   * Upsert Waypoints (Links) to Salesforce
   */
  async upsertWaypoints(waypoints: Array<{
    externalId: string;
    fromInsightExternalId: string;
    toInsightExternalId: string;
    relation: string;
    weight: number;
  }>) {
    const records = waypoints.map((waypoint) => ({
      ExternalId__c: waypoint.externalId,
      FromInsight__c: waypoint.fromInsightExternalId,
      ToInsight__c: waypoint.toInsightExternalId,
      Relation__c: waypoint.relation,
      Weight__c: waypoint.weight,
    }));

    const result = await this.conn.sobject('Waypoint__c').upsert(records, 'ExternalId__c');
    return result;
  }

  /**
   * Publish Platform Event for Newsletter Digest
   */
  async publishDigestEvent(digest: {
    title: string;
    audience: string;
    periodStart: Date;
    periodEnd: Date;
    htmlBody: string;
  }) {
    const result = await this.conn.sobject('Insight_Digest__e').create({
      Title__c: digest.title,
      Audience__c: digest.audience,
      PeriodStart__c: digest.periodStart.toISOString(),
      PeriodEnd__c: digest.periodEnd.toISOString(),
      HtmlBody__c: digest.htmlBody,
    });

    return result;
  }

  /**
   * Test connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.conn.identity();
      return true;
    } catch {
      return false;
    }
  }
}

