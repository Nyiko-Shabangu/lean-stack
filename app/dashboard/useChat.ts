'use client';

import { useState, useCallback } from 'react';
import type { Message, ChatStreamChunk } from '@/types';

interface UseChatOptions {
  documentId?: string;
}

interface UseChatReturn {
  messages: Message[];
  isStreaming: boolean;
  error: string | null;
  sendMessage: (prompt: string) => Promise<void>;
  reset: () => void;
}

/**
 * Hook that manages conversation state and streams responses from /api/ai/chat.
 *
 * Usage:
 *   const { messages, isStreaming, sendMessage } = useChat({ documentId: doc.id });
 */
export function useChat({ documentId }: UseChatOptions = {}): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (prompt: string) => {
    if (isStreaming) return;

    setError(null);
    setIsStreaming(true);

    // Build the full history synchronously BEFORE any setState calls,
    // so the fetch closure captures an up-to-date array.
    // (React state updates are async; `messages` would otherwise lag one render.)
    const userMessage: Message = { role: 'user', content: prompt };
    const updatedHistory = [...messages, userMessage];

    // Optimistically update UI
    setMessages(prev => [...prev, userMessage]);
    // Placeholder for the assistant reply we'll stream into
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          documentId,
          conversationHistory: updatedHistory, // ✅ includes the new user message
        }),
      });

      if (!res.ok) {
        const { error: apiError } = await res.json();
        throw new Error(apiError ?? `HTTP ${res.status}`);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const lines = decoder.decode(value).split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;

          let chunk: ChatStreamChunk;
          try {
            chunk = JSON.parse(line.slice(6)) as ChatStreamChunk;
          } catch {
            // Malformed chunk (e.g. truncated by a proxy) — skip and continue
            continue;
          }

          if (chunk.type === 'done') {
            break;
          }

          if (chunk.type === 'delta' && chunk.content) {
            setMessages(prev => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              updated[updated.length - 1] = {
                ...last,
                content: last.content + chunk.content,
              };
              return updated;
            });
          }

          if (chunk.type === 'error') {
            throw new Error(chunk.error);
          }
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
      // Remove the empty assistant placeholder on error
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsStreaming(false);
    }
  }, [isStreaming, messages, documentId]);

  const reset = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, isStreaming, error, sendMessage, reset };
}
