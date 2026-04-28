import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { createHash } from "crypto";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { animations } from "@/data/animations";
import { incrementViews, getCounters, formatCount } from "@/lib/kv";
import AnimationDetail from "./AnimationDetail";

export const revalidate = 60;
// Counters change per-request; force dynamic so each load increments + reads
// fresh values. Static params still pre-build the routes for SEO.
export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return animations.map((anim) => ({ slug: anim.id }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const anim = animations.find((a) => a.id === params.slug);
  if (!anim) return { title: "not_found · 0x1306" };

  const delay = Math.round(1000 / anim.fps);
  const description = `// ${anim.name} · ${anim.totalFrames} frames · ${delay}ms · ${anim.category} · oled animation for esp32`;
  const title = `${anim.name} · 0x1306 oled animation`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `/a/${anim.id}`,
      images: [`/a/${anim.id}/opengraph-image`],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`/a/${anim.id}/opengraph-image`],
    },
  };
}

function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

export default async function AnimationPage({
  params,
}: {
  params: { slug: string };
}) {
  const anim = animations.find((a) => a.id === params.slug);
  if (!anim) notFound();

  // Server-side view tracking with IP debounce (graceful fallback if KV down)
  try {
    const h = headers();
    const ip =
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      h.get("x-real-ip") ||
      "anon";
    await incrementViews(anim.id, hashIp(ip));
  } catch {
    // ignore — tracking must never break the page
  }

  const counters = await getCounters(anim.id);

  return (
    <div className="flex flex-col min-h-screen bg-bg text-text selection:bg-accent/30 selection:text-text">
      <Navbar />
      <main className="flex-1">
        <AnimationDetail
          animationId={anim.id}
          initialViews={formatCount(counters.views)}
          initialRuns={formatCount(counters.runs)}
        />
      </main>
      <Footer />
    </div>
  );
}
