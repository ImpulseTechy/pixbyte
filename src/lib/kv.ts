/**
 * Thin wrapper around @vercel/kv with graceful fallback.
 *
 * Every function below returns a benign default when KV env vars are missing
 * or when the call throws. Callers must NEVER let a KV failure crash the page.
 *
 * Required env vars (set in Vercel dashboard → Storage → KV):
 *   KV_URL
 *   KV_REST_API_URL
 *   KV_REST_API_TOKEN
 *   KV_REST_API_READ_ONLY_TOKEN
 */

import { kv } from "@vercel/kv";

const isEnabled = () =>
  Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

const VIEW_KEY = (slug: string) => `pixbyte:views:${slug}`;
const RUN_KEY = (slug: string) => `pixbyte:runs:${slug}`;
const VIEW_DEBOUNCE_KEY = (slug: string, ipHash: string, hour: number) =>
  `pixbyte:view_ip:${slug}:${ipHash}:${hour}`;

export interface Counters {
  views: number | null;
  runs: number | null;
}

/** Increment runs counter; safe under failures. */
export async function incrementRuns(slug: string): Promise<void> {
  if (!isEnabled()) return;
  try {
    await kv.incr(RUN_KEY(slug));
  } catch (e) {
    console.warn("[kv] incrementRuns failed", e);
  }
}

/**
 * Increment views with per-IP-per-hour debounce.
 * `ipHash` is a hashed/anonymized IP — caller is responsible for hashing.
 */
export async function incrementViews(
  slug: string,
  ipHash: string,
): Promise<void> {
  if (!isEnabled()) return;
  try {
    const hour = Math.floor(Date.now() / 3_600_000);
    const debounceKey = VIEW_DEBOUNCE_KEY(slug, ipHash, hour);
    // SET with NX + EX → returns "OK" if newly set, null if already exists
    const wasSet = await kv.set(debounceKey, "1", { nx: true, ex: 3600 });
    if (wasSet) {
      await kv.incr(VIEW_KEY(slug));
    }
  } catch (e) {
    console.warn("[kv] incrementViews failed", e);
  }
}

/** Fetch counters for a single slug. Returns nulls on failure. */
export async function getCounters(slug: string): Promise<Counters> {
  if (!isEnabled()) return { views: null, runs: null };
  try {
    const [views, runs] = await Promise.all([
      kv.get<number>(VIEW_KEY(slug)),
      kv.get<number>(RUN_KEY(slug)),
    ]);
    return {
      views: typeof views === "number" ? views : 0,
      runs: typeof runs === "number" ? runs : 0,
    };
  } catch (e) {
    console.warn("[kv] getCounters failed", e);
    return { views: null, runs: null };
  }
}

/** Bulk fetch counters for multiple slugs in a single round-trip. */
export async function getAllCounters(
  slugs: string[],
): Promise<Record<string, Counters>> {
  const empty: Record<string, Counters> = {};
  for (const s of slugs) empty[s] = { views: null, runs: null };
  if (!isEnabled() || slugs.length === 0) return empty;
  try {
    const keys = slugs.flatMap((s) => [VIEW_KEY(s), RUN_KEY(s)]);
    const values = await kv.mget<(number | null)[]>(...keys);
    const out: Record<string, Counters> = {};
    slugs.forEach((s, i) => {
      const v = values[i * 2];
      const r = values[i * 2 + 1];
      out[s] = {
        views: typeof v === "number" ? v : 0,
        runs: typeof r === "number" ? r : 0,
      };
    });
    return out;
  } catch (e) {
    console.warn("[kv] getAllCounters failed", e);
    return empty;
  }
}

/** Format a counter for display: 1234 → "1,234"; null → "—" */
export function formatCount(n: number | null): string {
  if (n === null || n === undefined) return "—";
  return n.toLocaleString("en-US");
}
