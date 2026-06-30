import { logger } from "@/utils/logger";
/**
 * services/supabase-client.ts — Centralized Supabase connection
 * 
 * Single source for Supabase URL and API key.
 * All data operations go through this module.
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  logger.error("Supabase connection issue",
    '[supabase] ❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_KEY.',
    '\nCopy .env.example → .env.local and fill in your Supabase credentials.',
  );
}

export { SUPABASE_URL, SUPABASE_KEY };

export const readHeaders = () => ({
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
});

export const writeHeaders = () => ({
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'resolution=merge-duplicates',
});

/**
 * Fetch with timeout and error handling.
 */
export async function supaFetch(
  url: string,
  opts?: RequestInit,
  timeoutMs = 15000,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal });
    clearTimeout(timeout);
    return res;
  } catch (e) {
    clearTimeout(timeout);
    throw e;
  }
}

/**
 * Test connection to Supabase.
 */
export async function testConnection(): Promise<{ ok: boolean; error: string }> {
  try {
    const res = await supaFetch(
      `${SUPABASE_URL}/rest/v1/records?limit=0`,
      { headers: readHeaders() },
      10000,
    );
    if (res.ok) return { ok: true, error: '' };
    return { ok: false, error: `HTTP ${res.status}` };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Connection failed' };
  }
}
