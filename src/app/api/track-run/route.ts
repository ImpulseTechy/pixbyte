import { NextRequest, NextResponse } from "next/server";
import { incrementRuns } from "@/lib/kv";
import { animations } from "@/data/animations";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const slug = typeof body?.slug === "string" ? body.slug : "";
    if (!slug) {
      return NextResponse.json({ ok: false, error: "missing_slug" }, { status: 400 });
    }
    if (!animations.find((a) => a.id === slug)) {
      return NextResponse.json({ ok: false, error: "unknown_slug" }, { status: 404 });
    }
    await incrementRuns(slug);
    return NextResponse.json({ ok: true });
  } catch (e) {
    // Never fail user-facing flows on KV errors.
    return NextResponse.json({ ok: true, warning: "tracking_unavailable" });
  }
}
