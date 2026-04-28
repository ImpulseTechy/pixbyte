import { notFound } from "next/navigation";
import { animations } from "@/data/animations";
import EmbedPlayer from "./EmbedPlayer";

export const revalidate = 60;

export function generateStaticParams() {
  return animations.map((anim) => ({ slug: anim.id }));
}

export const metadata = {
  robots: { index: false, follow: false },
};

export default function EmbedPage({
  params,
}: {
  params: { slug: string };
}) {
  const anim = animations.find((a) => a.id === params.slug);
  if (!anim) notFound();
  return <EmbedPlayer animationId={anim.id} />;
}
