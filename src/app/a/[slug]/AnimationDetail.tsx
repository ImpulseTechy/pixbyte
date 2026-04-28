"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { animations } from "@/data/animations";
import OLEDCanvas from "@/components/OLEDCanvas";
import { useSerial } from "@/context/SerialContext";

interface Props {
  animationId: string;
  initialViews?: string;
  initialRuns?: string;
}

export default function AnimationDetail({
  animationId,
  initialViews = "—",
  initialRuns = "—",
}: Props) {
  const [views] = useState(initialViews);
  const [runs, setRuns] = useState(initialRuns);
  const animation = useMemo(
    () => animations.find((a) => a.id === animationId),
    [animationId],
  );

  const defaultSize = animation?.supportedSizes[animation.supportedSizes.length - 1] ?? 64;
  const [size, setSize] = useState<number>(defaultSize);
  const [activeCodeTab, setActiveCodeTab] = useState<"arduino_c++" | "micropython">("arduino_c++");
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [pageUrl, setPageUrl] = useState("");
  const [origin, setOrigin] = useState("");
  const terminalEndRef = useRef<HTMLDivElement>(null);

  const {
    connectionState,
    logs,
    clearLogs,
    runAnimationOnDevice,
    stopAnimation,
    isAnimationRunning,
  } = useSerial();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setPageUrl(window.location.href);
      setOrigin(window.location.origin);
    }
  }, []);

  useEffect(() => {
    if (terminalOpen && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, terminalOpen]);

  if (!animation) {
    return (
      <div className="p-8 text-dim text-sm">
        {"// animation not found"}
        <div className="mt-4">
          <Link href="/" className="text-accent hover:underline">
            {"// ← back to all"}
          </Link>
        </div>
      </div>
    );
  }

  const delay = Math.round(1000 / animation.fps);
  const isConnected = connectionState === "CONNECTED";

  const codeToShow =
    activeCodeTab === "arduino_c++"
      ? animation.getArduinoCode(size)
      : animation.getMicroPythonCode(size);
  const codeLines = codeToShow.split("\n");

  const handleCopy = () => {
    navigator.clipboard.writeText(codeToShow).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const togglePreview = async () => {
    if (isAnimationRunning) {
      await stopAnimation();
    } else {
      setTerminalOpen(true);
      const codeStr = animation.getMicroPythonCode(size);
      await runAnimationOnDevice(codeStr);
      // Track run (graceful fallback if endpoint missing or KV unreachable)
      try {
        await fetch("/api/track-run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug: animation.id }),
        });
        // Optimistically bump the displayed runs count so users see
        // immediate feedback (server-truth refreshes on next navigation).
        setRuns((prev) => {
          if (prev === "—") return "1";
          const n = parseInt(prev.replace(/,/g, ""), 10);
          if (Number.isNaN(n)) return prev;
          return (n + 1).toLocaleString("en-US");
        });
      } catch {
        // ignore
      }
    }
  };

  const handleDownload = (kind: "ino" | "py") => {
    const code =
      kind === "ino"
        ? animation.getArduinoCode(size)
        : animation.getMicroPythonCode(size);
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = kind === "ino" ? `${animation.name}.ino` : "main.py";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const shareText = `check out this oled animation for esp32: ${animation.name} → ${pageUrl}`;
  const encodedText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(pageUrl);
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
  const whatsappUrl = `https://wa.me/?text=${encodedText}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;

  const embedSnippet = `<iframe src="${origin}/embed/${animation.id}" width="320" height="200" frameborder="0"></iframe>`;

  const copyLink = () => {
    navigator.clipboard.writeText(pageUrl).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 1500);
    });
  };

  const copyEmbed = () => {
    navigator.clipboard.writeText(embedSnippet).then(() => {
      setEmbedCopied(true);
      setTimeout(() => setEmbedCopied(false), 1500);
    });
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Back link */}
      <Link
        href="/"
        className="text-dim hover:text-accent transition-colors text-xs inline-block"
      >
        {"// ← back to all"}
      </Link>

      {/* Heading + metadata */}
      <section>
        <h1 className="text-text text-xl">{animation.name}</h1>
        <div className="text-dim text-xs mt-1">
          {"//"} {animation.name} · by {animation.creator} ·{" "}
          {animation.totalFrames} frames · {delay}ms · {animation.category}
        </div>
        <div className="text-dim text-xs mt-1">
          {"//"} {views} views · {runs} runs
        </div>
      </section>

      {/* Preview */}
      <section className="flex flex-col">
        <div className="text-dim text-xs mb-2">{"//"} preview</div>
        <OLEDCanvas
          animation={animation}
          size={size}
          scale={6}
          showCounter={true}
        />
      </section>

      {/* Size selector */}
      {animation.supportedSizes.length > 1 && (
        <section className="flex items-center space-x-2">
          <span className="text-dim text-xs">{"//"} size</span>
          {animation.supportedSizes.map((s) => (
            <button
              key={s}
              onClick={() => setSize(s)}
              className={`px-3 py-1 text-xs border ${
                size === s
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border text-dim hover:border-accent hover:text-text"
              }`}
            >
              {s}px
            </button>
          ))}
        </section>
      )}

      {/* Action buttons */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          disabled={!isConnected}
          onClick={togglePreview}
          className={`px-3 py-2 border transition-colors text-[10px] sm:text-xs uppercase ${
            isAnimationRunning
              ? "border-red text-red hover:bg-red/10 cursor-pointer"
              : isConnected
                ? "border-accent text-accent hover:bg-accent/10 cursor-pointer"
                : "border-dim text-dim disabled:opacity-50 disabled:cursor-not-allowed"
          }`}
          title={isConnected ? "// requires micropython" : "// connect esp32 to enable"}
        >
          {isAnimationRunning ? "⏹ stop_preview" : "▶ run_on_device"}
        </button>
        <button
          onClick={() => handleDownload("ino")}
          className="px-3 py-2 border border-accent text-accent hover:bg-accent/10 transition-colors text-[10px] sm:text-xs uppercase cursor-pointer"
        >
          ↓ download .ino
        </button>
        <button
          onClick={() => handleDownload("py")}
          className="px-3 py-2 border border-accent text-accent hover:bg-accent/10 transition-colors text-[10px] sm:text-xs uppercase cursor-pointer"
        >
          ↓ download .py
        </button>
        <button
          onClick={handleCopy}
          className="px-3 py-2 border border-accent text-accent hover:bg-accent/10 transition-colors text-[10px] sm:text-xs uppercase cursor-pointer"
        >
          {copied ? "✓ copied" : "📋 copy_code"}
        </button>
      </section>

      {/* Code tabs */}
      <section className="flex flex-col">
        <div className="flex border-b border-border mb-3">
          {(["arduino_c++", "micropython"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveCodeTab(tab)}
              className={`px-4 py-2 text-sm transition-colors ${
                activeCodeTab === tab
                  ? "text-accent border-b-2 border-accent -mb-[1px]"
                  : "text-dim hover:text-text"
              }`}
            >
              {"//"} {tab}
            </button>
          ))}
        </div>
        <div className="bg-code-bg border border-border relative flex flex-col p-4 overflow-hidden">
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 z-10 bg-code-bg text-dim hover:text-accent transition-colors text-xs px-2 py-1 border border-border hover:border-accent"
          >
            {copied ? "// copied!" : "[copy]"}
          </button>
          <div className="overflow-auto max-h-[480px] hide-scrollbar flex">
            <pre className="text-sm font-mono flex pb-4">
              <div className="text-dim pr-4 text-right select-none border-r border-border/30 mr-4 flex flex-col">
                {codeLines.map((_, i) => (
                  <span key={i}>{i + 1}</span>
                ))}
              </div>
              <code className="text-text whitespace-pre">{codeToShow}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* Serial terminal */}
      <section className="flex flex-col">
        <button
          onClick={() => setTerminalOpen(!terminalOpen)}
          className="self-start text-xs text-dim hover:text-text transition-colors mb-2"
        >
          {`// serial_monitor ${terminalOpen ? "▲" : "▼"}`}
        </button>
        {terminalOpen && (
          <div className="relative w-full h-[120px] bg-black border border-border p-3 overflow-y-auto font-mono text-[11px] text-green hide-scrollbar flex flex-col">
            <button
              onClick={clearLogs}
              className="absolute top-2 right-2 text-dim hover:text-green transition-colors bg-black px-1 z-10"
            >
              [clear]
            </button>
            <div className="flex flex-col mt-1">
              {logs.map((log, i) => {
                if (log === "[[MIP_INSTALL_BUTTON]]") return null;
                let colorClass = "";
                if (log.includes("adjusting address") || log.includes("warning"))
                  colorClass = "text-yellow";
                if (log.includes("no devices found") || log.includes("ERR:"))
                  colorClass = "text-red";
                return (
                  <span key={i} className={colorClass}>
                    {log}
                  </span>
                );
              })}
              <div className="flex items-center">
                <span>&gt;</span>
                <span className="w-2 h-3 bg-green animate-pulse ml-1 inline-block"></span>
              </div>
              <div ref={terminalEndRef}></div>
            </div>
          </div>
        )}
      </section>

      {/* Share */}
      <section className="border-t border-border pt-4">
        <div className="text-dim text-xs mb-3">{"//"} share</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={copyLink}
            className="px-3 py-2 border border-accent text-accent hover:bg-accent/10 transition-colors text-[10px] sm:text-xs uppercase cursor-pointer"
          >
            {linkCopied ? "✓ copied" : "🔗 copy_link"}
          </button>
          <a
            href={linkedinUrl}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-2 border border-accent text-accent hover:bg-accent/10 transition-colors text-[10px] sm:text-xs uppercase text-center"
          >
            in linkedin
          </a>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-2 border border-accent text-accent hover:bg-accent/10 transition-colors text-[10px] sm:text-xs uppercase text-center"
          >
            ◉ whatsapp
          </a>
          <a
            href={twitterUrl}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-2 border border-accent text-accent hover:bg-accent/10 transition-colors text-[10px] sm:text-xs uppercase text-center"
          >
            x twitter
          </a>
        </div>
      </section>

      {/* Embed */}
      <section className="border-t border-border pt-4">
        <div className="text-dim text-xs mb-3">{"//"} embed</div>
        <div className="bg-code-bg border border-border p-3 relative">
          <button
            onClick={copyEmbed}
            className="absolute top-2 right-2 z-10 bg-code-bg text-dim hover:text-accent transition-colors text-xs px-2 py-1 border border-border hover:border-accent"
          >
            {embedCopied ? "// copied!" : "[copy]"}
          </button>
          <textarea
            readOnly
            value={embedSnippet}
            onClick={(e) => (e.target as HTMLTextAreaElement).select()}
            className="w-full bg-transparent text-text text-xs font-mono outline-none resize-none pr-16"
            rows={2}
          />
        </div>
        <div className="text-dim text-[10px] mt-2">
          {"//"} paste into any html · 320×200 · transparent click opens detail page
        </div>
      </section>
    </div>
  );
}
