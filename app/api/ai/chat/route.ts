import Anthropic from '@anthropic-ai/sdk';
import { auth } from '@clerk/nextjs/server';
import { env } from '@/lib/env';
import { queryChunks } from '@/lib/pinecone';
import { checkRateLimit } from '@/lib/redis';
import type { ChatRequest } from '@/types';

const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a helpful assistant. You answer questions based on the provided context.
If the context doesn't contain enough information to answer confidently, say so.
Be concise. Never fabricate facts not present in the context.`;

export async function POST(req: Request) {
  try {
    // ─── Auth ───────────────────────────────────────────────────────────────
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ─── Rate limiting (Node.js runtime — ioredis requires TCP sockets) ───────────
    const { allowed, resetInSeconds } = await checkRateLimit(
      `${userId}:ai`,
      20,   // 20 AI calls
      60    // per 60 seconds
    );
    const resetAt = Math.floor(Date.now() / 1000) + resetInSeconds;

    if (!allowed) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded', resetInSeconds }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': '20',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': resetAt.toString(),
            'Retry-After': resetInSeconds.toString(),
          },
        }
      );
    }

    // ─── Parse + validate body ───────────────────────────────────────────────
    const body = (await req.json()) as ChatRequest;
    const { prompt, documentId, conversationHistory = [] } = body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return Response.json({ error: 'prompt is required' }, { status: 400 });
    }

    // ─── RAG: fetch context from Pinecone ────────────────────────────────────
    let contextBlock = '';

    if (documentId) {
      const chunks = await queryChunks(documentId, prompt, 5);

      if (chunks.length > 0) {
        // Only include chunks with a reasonable similarity score
        const relevant = chunks.filter(c => c.score > 0.75);
        contextBlock = relevant
          .map((c, i) => `[Source ${i + 1}]\n${c.text}`)
          .join('\n\n');
      }
    }

    // ─── Build messages array ────────────────────────────────────────────────
    const messages: Anthropic.MessageParam[] = [
      // Inject prior turns for multi-turn conversations
      ...conversationHistory.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      {
        role: 'user',
        content: contextBlock
          ? `Context:\n${contextBlock}\n\n---\n\nQuestion: ${prompt}`
          : prompt,
      },
    ];

    // ─── Stream response ─────────────────────────────────────────────────────
    const stream = await anthropic.messages.stream({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages,
    });

    // Pipe Anthropic's stream into a ReadableStream for the response
    const readable = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          for await (const event of stream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              const chunk = JSON.stringify({
                type: 'delta',
                content: event.delta.text,
              });
              controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));
            }
          }

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
          );
        } catch (err) {
          const error = JSON.stringify({
            type: 'error',
            error: err instanceof Error ? err.message : 'Stream error',
          });
          controller.enqueue(encoder.encode(`data: ${error}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (err) {
    console.error('[AI Chat]', err);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
