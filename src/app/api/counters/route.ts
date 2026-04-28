import { NextResponse } from "next/server";
import { getAllCounters } from "@/lib/kv";
import { animations } from "@/data/animations";

export const runtime = "nodejs";
// Cache-but-revalidate: keep CDN fresh-ish without hammering KV
export const revalidate = 60;

export async function GET() {
  const slugs = animations.map((a) => a.id);
  const counters = await getAllCounters(slugs);
  return NextResponse.json({ counters });
}
