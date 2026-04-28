"use client";

import { useMemo } from "react";
import { animations } from "@/data/animations";
import OLEDCanvas from "@/components/OLEDCanvas";

interface Props {
  animationId: string;
}

export default function EmbedPlayer({ animationId }: Props) {
  const animation = useMemo(
    () => animations.find((a) => a.id === animationId),
    [animationId],
  );

  if (!animation) {
    return (
      <div className="w-full h-screen bg-bg text-dim flex items-center justify-center text-xs font-mono">
        {"// not found"}
      </div>
    );
  }

  const size = animation.supportedSizes[animation.supportedSizes.length - 1];

  const handleClick = () => {
    if (typeof window !== "undefined") {
      window.open(`/a/${animation.id}`, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div
      onClick={handleClick}
      className="w-full h-screen bg-bg flex flex-col items-center justify-center p-2 cursor-pointer font-mono"
      title={`// open ${animation.name} on 0x1306`}
    >
      <OLEDCanvas
        animation={animation}
        size={size}
        scale={2}
        showCounter={false}
      />
      <div className="text-dim text-[10px] mt-2 hover:text-accent transition-colors">
        {"//"} {animation.name} · 0x1306.dev
      </div>
    </div>
  );
}
