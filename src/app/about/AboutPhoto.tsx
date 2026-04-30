"use client";

import { useState } from "react";

export default function AboutPhoto() {
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;
  return (
    <div className="border border-border bg-surface inline-block">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/about-photo.jpg"
        alt="// portrait"
        onError={() => setHidden(true)}
        className="block max-w-full h-auto"
        style={{ maxWidth: 320 }}
      />
    </div>
  );
}
