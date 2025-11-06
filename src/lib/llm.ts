import OpenAI from 'openai';
import { env } from './env';

export interface LLM {
  summarize(md: string): Promise<string>;
  tag(md: string): Promise<string[]>;
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
  ner(md: string): Promise<{ people: string[]; trends: string[] }>;
}

class OpenAIProvider implements LLM {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });
  }

  async summarize(md: string): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert at summarizing content. Create concise, insightful summaries that capture key points and implications. Keep summaries under 150 words.',
        },
        {
          role: 'user',
          content: `Summarize this content:\n\n${md}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 300,
    });

    return response.choices[0]?.message?.content || '';
  }

  async tag(md: string): Promise<string[]> {
    const response = await this.client.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert at extracting relevant tags from content. Return a JSON array of 3-7 concise, lowercase tags that capture key themes, technologies, concepts, or topics. Only return the JSON array, nothing else.',
        },
        {
          role: 'user',
          content: `Extract tags from this content:\n\n${md}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 200,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content || '{"tags": []}';
    try {
      const parsed = JSON.parse(content);
      return parsed.tags || [];
    } catch {
      return [];
    }
  }

  async embed(text: string): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      dimensions: 1536,
    });

    return response.data[0]?.embedding || [];
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    // OpenAI API supports batching up to 2048 inputs
    const batchSize = 2048;
    const results: number[][] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const response = await this.client.embeddings.create({
        model: 'text-embedding-3-small',
        input: batch,
        dimensions: 1536,
      });

      results.push(...response.data.map((d) => d.embedding));
    }

    return results;
  }

  async ner(md: string): Promise<{ people: string[]; trends: string[] }> {
    const response = await this.client.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert at named entity recognition for business intelligence. Extract: 1) People (full names of individuals mentioned), 2) Trends (macro trends, technologies, movements, or emerging themes). Return a JSON object with "people" and "trends" arrays. Only return the JSON, nothing else.',
        },
        {
          role: 'user',
          content: `Extract people and trends from this content:\n\n${md}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content || '{"people": [], "trends": []}';
    try {
      const parsed = JSON.parse(content);
      return {
        people: parsed.people || [],
        trends: parsed.trends || [],
      };
    } catch {
      return { people: [], trends: [] };
    }
  }
}

// Singleton instance
let llmInstance: LLM | null = null;

export function getLLM(): LLM {
  if (!llmInstance) {
    llmInstance = new OpenAIProvider();
  }
  return llmInstance;
}

export default getLLM;

