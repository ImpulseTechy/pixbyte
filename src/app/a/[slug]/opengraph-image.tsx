import { ImageResponse } from "next/og";
import { animations } from "@/data/animations";

// Image metadata
export const runtime = "nodejs";
export const alt = "0x1306 oled animation";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Color tokens — kept in sync with src/app/globals.css
const BG = "#060810";
const ACCENT = "#58a6ff";
const TEXT = "#c9d1d9";
const DIM = "#484f58";
const BORDER = "#21262d";

export default async function OGImage({
  params,
}: {
  params: { slug: string };
}) {
  const animation = animations.find((a) => a.id === params.slug);

  // Render frame 0 to a PNG data URL using node-canvas
  let frameDataUrl: string | null = null;
  let frameWidth = 64;
  let frameHeight = 64;

  if (animation) {
    try {
      const { createCanvas } = await import("canvas");
      const isRobotEyes = animation.category === "robot_eyes";
      const renderSize = isRobotEyes
        ? 64
        : animation.supportedSizes[animation.supportedSizes.length - 1];
      frameWidth = isRobotEyes ? 128 : renderSize;
      frameHeight = isRobotEyes ? 64 : renderSize;

      const canvas = createCanvas(frameWidth, frameHeight);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ctx = canvas.getContext("2d") as any;
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, frameWidth, frameHeight);
      ctx.imageSmoothingEnabled = false;

      animation.drawFrame(ctx, 0, renderSize);

      const buf = canvas.toBuffer("image/png");
      frameDataUrl = `data:image/png;base64,${buf.toString("base64")}`;
    } catch (e) {
      console.error("[og] drawFrame failed:", e);
      frameDataUrl = null;
    }
  }

  const fontFamily =
    '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace';
  const delay = animation ? Math.round(1000 / animation.fps) : 0;

  // Aspect-preserving scaled size for the rendered frame.
  // Constrain so total layout fits within 630px tall:
  //   top brand (48) + padding (80) + frame+padding+border + margin + name (48)
  //   + meta (22) + footer (32) ≈ 230 fixed → frame area ≤ ~300
  const targetMaxW = 460; // wide displays (robot eyes 128:64)
  const targetMaxH = 280;
  const scale = Math.min(
    targetMaxW / frameWidth,
    targetMaxH / frameHeight,
  );
  const displayW = Math.round(frameWidth * scale);
  const displayH = Math.round(frameHeight * scale);

  const name = animation?.name ?? "not_found";
  const metaLine = animation
    ? `// ${animation.totalFrames} frames · ${delay}ms · ${animation.category}`
    : "// 404";
  const creatorLine = animation
    ? `// by ${animation.creator ?? "0x1306"}`
    : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: BG,
          fontFamily,
          color: TEXT,
          display: "flex",
          flexDirection: "column",
          padding: "40px 56px",
        }}
      >
        {/* Top: brand row */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: "16px",
            height: "48px",
          }}
        >
          <div
            style={{
              color: ACCENT,
              fontSize: 36,
              fontWeight: 700,
              display: "flex",
            }}
          >
            0x1306
          </div>
          <div style={{ color: DIM, fontSize: 18, display: "flex" }}>
            // oled animation tool for esp32
          </div>
        </div>

        {/* Middle: frame + name + meta */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            flexGrow: 1,
          }}
        >
          {frameDataUrl ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#000000",
                border: `1px solid ${BORDER}`,
                padding: "16px",
                marginBottom: "24px",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={frameDataUrl}
                alt={name}
                width={displayW}
                height={displayH}
                style={{ display: "flex" }}
              />
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                width: 320,
                height: 200,
                background: "#000000",
                border: `1px solid ${BORDER}`,
                marginBottom: "28px",
                alignItems: "center",
                justifyContent: "center",
                color: DIM,
                fontSize: 14,
              }}
            >
              {"// preview unavailable"}
            </div>
          )}

          <div
            style={{
              color: TEXT,
              fontSize: 40,
              display: "flex",
              marginBottom: "8px",
            }}
          >
            {`// ${name}`}
          </div>
          <div style={{ color: DIM, fontSize: 20, display: "flex" }}>
            {metaLine}
          </div>
        </div>

        {/* Bottom: footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            height: "32px",
          }}
        >
          <div style={{ color: DIM, fontSize: 18, display: "flex" }}>
            {"// oled animations for esp32 · pixbyte"}
          </div>
          <div style={{ color: DIM, fontSize: 18, display: "flex" }}>
            {creatorLine}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
