import { createClient } from '@supabase/supabase-js';
import { env } from './env';

// ─── Database schema type ─────────────────────────────────────────────────────
// Structured to match Supabase CLI output exactly so the generic constraint
// `Schema extends GenericSchema` resolves correctly in @supabase/supabase-js.
//
// Key patterns required by the library:
//  • Row/Insert/Update must be inline object types (not interface references)
//  • Empty Views/Functions must use `{ [_ in never]: never }`, NOT Record<string, never>

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          clerk_id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          stripe_customer_id: string | null;
          subscription_status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | null;
          subscription_tier: 'free' | 'pro' | 'enterprise' | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          clerk_id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          stripe_customer_id?: string | null;
          subscription_status?: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | null;
          subscription_tier?: 'free' | 'pro' | 'enterprise' | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          clerk_id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          stripe_customer_id?: string | null;
          subscription_status?: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | null;
          subscription_tier?: 'free' | 'pro' | 'enterprise' | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      documents: {
        Row: {
          id: string;
          owner_id: string;
          title: string;
          content: string | null;
          pinecone_namespace: string;
          created_at: string;
          updated_at?: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          title: string;
          content?: string | null;
          pinecone_namespace: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          title?: string;
          content?: string | null;
          pinecone_namespace?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
  };
};

// ─── Helper types (re-exported for use elsewhere) ─────────────────────────────

export type Profile  = Database['public']['Tables']['profiles']['Row'];
export type Document = Database['public']['Tables']['documents']['Row'];

// ─── Browser client (uses anon key, respects RLS) ─────────────────────────────

export const supabase = createClient<Database>(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ─── Server/admin client (bypasses RLS — only use in server actions / API routes) ──

export const supabaseAdmin = createClient<Database>(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
