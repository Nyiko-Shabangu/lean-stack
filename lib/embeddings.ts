import OpenAI from 'openai';
import { env } from './env';

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;

export { EMBEDDING_DIMENSIONS };

/**
 * Generate an embedding vector for a single string.
 * text-embedding-3-small is cheap (~$0.02 / 1M tokens) and works well for RAG.
 */
export async function embed(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text.replace(/\n/g, ' '), // newlines hurt embedding quality
  });

  return response.data[0].embedding;
}

/**
 * Batch-embed multiple strings in a single API call (up to 2048 inputs).
 * Use this when ingesting documents to avoid N API calls.
 */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts.map(t => t.replace(/\n/g, ' ')),
  });

  // API returns results in the same order as input
  return response.data
    .sort((a, b) => a.index - b.index)
    .map(item => item.embedding);
}
