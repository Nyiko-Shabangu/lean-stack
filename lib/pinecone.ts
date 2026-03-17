import { Pinecone } from '@pinecone-database/pinecone';
import { env } from './env';
import { embed, embedBatch } from './embeddings';

const pc = new Pinecone({ apiKey: env.PINECONE_API_KEY });

export const index = pc.Index(env.PINECONE_INDEX);

// ─── Types ────────────────────────────────────────────────────────────────────

interface UpsertChunk {
  id: string;
  text: string;
  metadata?: Record<string, string | number | boolean>;
}

interface QueryResult {
  id: string;
  score: number;
  text: string;
  metadata: Record<string, string | number | boolean>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Upsert an array of text chunks into a namespace.
 * Chunks a document into pieces before calling this.
 *
 * @param namespace  Use documentId as the namespace for easy deletion later.
 * @param chunks     Array of { id, text, metadata }
 */
export async function upsertChunks(
  namespace: string,
  chunks: UpsertChunk[]
): Promise<void> {
  if (chunks.length === 0) return;

  const texts = chunks.map(c => c.text);
  const vectors = await embedBatch(texts);

  const records = chunks.map((chunk, i) => ({
    id: chunk.id,
    values: vectors[i],
    metadata: {
      text: chunk.text,
      namespace,
      ...chunk.metadata,
    },
  }));

  // Pinecone recommends batches of max 100 vectors
  const BATCH_SIZE = 100;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    await index.namespace(namespace).upsert(records.slice(i, i + BATCH_SIZE));
  }
}

/**
 * Query a namespace with a natural language string.
 * Returns the top-K most semantically similar chunks.
 *
 * @param namespace  The namespace (documentId) to search within.
 * @param query      The user's question.
 * @param topK       How many chunks to retrieve.
 */
export async function queryChunks(
  namespace: string,
  query: string,
  topK = 5
): Promise<QueryResult[]> {
  const vector = await embed(query);

  const response = await index.namespace(namespace).query({
    vector,
    topK,
    includeMetadata: true,
  });

  return (response.matches ?? []).map(match => ({
    id: match.id,
    score: match.score ?? 0,
    text: (match.metadata?.text as string) ?? '',
    metadata: (match.metadata ?? {}) as Record<string, string | number | boolean>,
  }));
}

/**
 * Delete all vectors in a namespace.
 * Call this when a user deletes a document.
 */
export async function deleteNamespace(namespace: string): Promise<void> {
  await index.namespace(namespace).deleteAll();
}
