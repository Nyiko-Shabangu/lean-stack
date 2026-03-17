// ─── Supabase DB Types ────────────────────────────────────────────────────────
// Profile and Document are derived from the Database type in lib/supabase.ts.
// Import them from there: `import type { Profile, Document } from '@/lib/supabase'`

export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'incomplete';



// ─── API Types ────────────────────────────────────────────────────────────────

export interface ChatRequest {
  prompt: string;
  documentId?: string;
  conversationHistory?: Message[];
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatStreamChunk {
  type: 'delta' | 'done' | 'error';
  content?: string;
  error?: string;
}

// ─── Rate Limit ───────────────────────────────────────────────────────────────

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
}
