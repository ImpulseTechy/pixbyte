/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useState, useEffect, useRef } from "react";
import { OLEDAnimation } from "@/data/animations";
import OLEDCanvas from "./OLEDCanvas";
import { useSerial } from "@/context/SerialContext";

interface Props {
  animation: OLEDAnimation;
  size: number;
}

export default function RightPanel({ animation, size }: Props) {
  const [activeCodeTab, setActiveCodeTab] = useState<
    "arduino_c++" | "micropython"
  >("arduino_c++");
  const [copied, setCopied] = useState(false);
  const [terminalOpen, setTerminalOpen] = useState(false);

  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [microPythonModalOpen, setMicroPythonModalOpen] = useState(false);

  const [prereqCollapsed, setPrereqCollapsed] = useState(false);
  const [prereqErrorHighlight, setPrereqErrorHighlight] = useState<
    number | null
  >(null);
  const [prereqSuccessFlash, setPrereqSuccessFlash] = useState(false);

  const {
    connectionState,
    logs,
    clearLogs,
    hasMicroPython,
    runAnimationOnDevice,
    stopAnimation,
    addLog,
    isAnimationRunning,
  } = useSerial();
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const codeEl = document.getElementById("code-output-scroll");
    if (codeEl) codeEl.scrollTop = 0;
  }, [animation, activeCodeTab, size]);

  useEffect(() => {
    const saved = localStorage.getItem("prereq_collapsed");
    if (saved === "true") {
      setPrereqCollapsed(true);
    }
  }, []);

  useEffect(() => {
    if (logs.length === 0) return;
    const lastLog = logs[logs.length - 1];

    // Check for raw REPL error
    if (lastLog.includes("raw REPL not detected")) {
      setPrereqErrorHighlight(1);
      setPrereqCollapsed(false);
      localStorage.setItem("prereq_collapsed", "false");
    }
    // Check for ssd1306 module missing
    else if (lastLog.includes("ImportError") && lastLog.includes("ssd1306")) {
      setPrereqErrorHighlight(2);
      setPrereqCollapsed(false);
      localStorage.setItem("prereq_collapsed", "false");
    }
    // Check for I2C and Wiring issues (OSError typically with I2C or ENODEV)
    else if (
      lastLog.includes("OSError") &&
      (lastLog.includes("I2C") ||
        lastLog.includes("ENODEV") ||
        lastLog.includes("19") ||
        lastLog.includes("I2C bus error"))
    ) {
      setPrereqErrorHighlight(3);
      setPrereqCollapsed(false);
      localStorage.setItem("prereq_collapsed", "false");
    }
    // Check for success
    else if (lastLog.includes("animation running ✓")) {
      setPrereqSuccessFlash(true);
      setTimeout(() => setPrereqSuccessFlash(false), 2000);
      setPrereqErrorHighlight(null);
    }
  }, [logs]);

  const togglePrereq = () => {
    const newState = !prereqCollapsed;
    setPrereqCollapsed(newState);
    localStorage.setItem("prereq_collapsed", newState.toString());
  };

  const downloadSsd1306 = () => {
    const link = document.createElement("a");
    link.href = "/ssd1306.py";
    link.download = "ssd1306.py";
    link.click();
  };

  useEffect(() => {
    if (terminalOpen && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, terminalOpen]);

  const handleCopy = () => {
    const code =
      activeCodeTab === "arduino_c++"
        ? animation.getArduinoCode(size)
        : animation.getMicroPythonCode(size);

    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const handleDownload = () => {
    const code = animation.getMicroPythonCode(size);
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "main.py";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const togglePreview = async () => {
    if (isAnimationRunning) {
      await stopAnimation();
    } else {
      setTerminalOpen(true);
      const codeStr = animation.getMicroPythonCode(size);
      await runAnimationOnDevice(codeStr);
    }
  };

  const isConnected = connectionState === "CONNECTED";
  const runTooltip = !isConnected
    ? "// connect esp32 to enable"
    : "// connect esp32 · requires micropython";
  const flashTooltip = "// download .ino · open in arduino ide";

  const codeToShow =
    activeCodeTab === "arduino_c++"
      ? animation.getArduinoCode(size)
      : animation.getMicroPythonCode(size);

  const codeLines = codeToShow.split("\n");

  return (
    <div className="flex flex-col h-full w-full lg:w-[48%] bg-bg lg:relative absolute bottom-0 z-20 border-t lg:border-t-0 lg:border-l border-border p-4 overflow-y-auto space-y-4 max-h-[60vh] lg:max-h-full shadow-2xl lg:shadow-none">
      {/* MicroPython Alert */}
      {isConnected && !hasMicroPython && (
        <div className="w-full bg-yellow/15 border border-yellow text-yellow text-xs px-4 py-2 flex items-center justify-between">
          <span>
            {
              "// ⚠ micropython not detected on this device · flash micropython first"
            }
          </span>
          <a
            href="https://micropython.org/download/ESP32_GENERIC"
            target="_blank"
            className="underline hover:text-white"
          >
            download
          </a>
        </div>
      )}

      {/* SECTION 1: OLED Preview */}
      <section className="flex flex-col">
        <div className="text-dim text-xs mb-2 mt-2">{"//"} preview</div>
        <OLEDCanvas
          animation={animation}
          size={size}
          scale={4}
          showCounter={true}
        />
      </section>

      {/* SECTION 2: Action Buttons */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full max-w-[512px] mx-auto">
        <button
          disabled={!isConnected}
          title={runTooltip}
          onClick={togglePreview}
          className={`px-3 py-2 border transition-colors text-[10px] sm:text-xs uppercase ${
            isAnimationRunning
              ? "border-red text-red hover:bg-red/10 cursor-pointer"
              : isConnected
                ? "border-accent text-accent hover:bg-accent/10 cursor-pointer"
                : "border-dim text-dim disabled:opacity-50 disabled:cursor-not-allowed"
          }`}
        >
          {isAnimationRunning ? "⏹ stop_preview" : "▶ run_on_device"}
        </button>
        <button
          title={flashTooltip}
          onClick={() => setDownloadModalOpen(true)}
          className="px-3 py-2 border transition-colors text-[10px] sm:text-xs uppercase border-accent text-accent hover:bg-accent/10 cursor-pointer"
        >
          ↓ download & flash
        </button>
        <button
          onClick={handleCopy}
          className="px-3 py-2 border border-accent text-accent hover:bg-accent/10 transition-colors text-[10px] sm:text-xs uppercase cursor-pointer"
        >
          📋 copy_code
        </button>
        <button
          onClick={() => {
            const isPy = activeCodeTab === "micropython";
            const code = isPy
              ? animation.getMicroPythonCode(size)
              : animation.getArduinoCode(size);
            const blob = new Blob([code], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = isPy ? "main.py" : `${animation.name}.ino`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }}
          className="px-3 py-2 border border-accent text-accent hover:bg-accent/10 transition-colors text-[10px] sm:text-xs uppercase cursor-pointer flex flex-col justify-center items-center"
        >
          <span>↓ download</span>
          <span className="text-[8px] opacity-75">
            {activeCodeTab === "micropython" ? ".py" : ".ino"}
          </span>
        </button>
      </section>

      {/* SECTION 2.5: Prerequisites Card */}
      <section className="w-full max-w-[512px] mx-auto bg-surface border border-border mt-4 font-mono text-[11px]">
        <div
          onClick={togglePrereq}
          className={`flex items-center justify-between p-2 cursor-pointer hover:bg-white/5 transition-colors ${!prereqCollapsed ? "border-b border-border" : ""}`}
        >
          <div className="text-text">
            <span className="text-dim">{"// "}</span>run_on_device · setup
            required
          </div>
          <div className="text-dim">{prereqCollapsed ? "[▶]" : "[▼]"}</div>
        </div>

        {!prereqCollapsed && (
          <div className="p-4 pt-2 flex flex-col space-y-4">
            {/* Step 1 */}
            <div
              className={`flex flex-col space-y-1 transition-colors ${
                prereqErrorHighlight === 1
                  ? "bg-red/10 border-l-[3px] border-red pl-2 -ml-[3px]"
                  : prereqSuccessFlash
                    ? "bg-green/10 border-l-[3px] border-green pl-2 -ml-[3px]"
                    : ""
              }`}
            >
              <div className="text-text mt-1">
                <span className="text-accent pr-1">①</span> flash micropython
                firmware to your esp32
              </div>
              <a
                href="https://micropython.org/download/ESP32_GENERIC/"
                target="_blank"
                rel="noreferrer"
                className="w-fit mt-1 px-[10px] py-1 border border-accent text-accent hover:bg-accent/10 transition-colors uppercase cursor-pointer block text-center"
              >
                [↓ download micropython]
              </a>
              <div className="text-dim">
                {"// one-time setup · takes ~2 min"}
                {prereqErrorHighlight === 1 && (
                  <span className="text-red ml-2">
                    · micropython not found on device
                  </span>
                )}
              </div>
            </div>

            {/* Step 2 */}
            <div
              className={`flex flex-col space-y-1 transition-colors ${
                prereqErrorHighlight === 2
                  ? "bg-red/10 border-l-[3px] border-red pl-2 -ml-[3px]"
                  : prereqSuccessFlash
                    ? "bg-green/10 border-l-[3px] border-green pl-2 -ml-[3px]"
                    : ""
              }`}
            >
              <div className="text-text mt-1">
                <span className="text-accent pr-1">②</span> upload ssd1306.py to
                your board
              </div>
              <button
                onClick={downloadSsd1306}
                className="w-fit mt-1 px-[10px] py-1 border border-accent border-solid text-accent hover:bg-accent/10 transition-colors uppercase cursor-pointer bg-transparent text-left"
              >
                [↓ download ssd1306.py]
              </button>
              <div className="text-dim">
                {"// place in /lib folder on your esp32"}
                {prereqErrorHighlight === 2 && (
                  <span className="text-red ml-2">
                    · ssd1306.py not found on device
                  </span>
                )}
              </div>
            </div>

            {/* Step 3 */}
            <div
              className={`flex flex-col space-y-1 transition-colors ${
                prereqErrorHighlight === 3
                  ? "bg-red/10 border-l-[3px] border-red pl-2 -ml-[3px]"
                  : prereqSuccessFlash
                    ? "bg-green/10 border-l-[3px] border-green pl-2 -ml-[3px]"
                    : ""
              }`}
            >
              <div className="text-text mt-1">
                <span className="text-accent pr-1">③</span> wire your oled
                display
              </div>
              <div className="text-text ml-5 leading-tight mt-1">
                SDA → <span className="text-accent">GPIO21</span> · SCL →{" "}
                <span className="text-accent">GPIO22</span>
                <br />
                VCC → <span className="text-accent">3.3V</span> · GND →{" "}
                <span className="text-accent">GND</span>
              </div>
              {prereqErrorHighlight === 3 && (
                <div className="text-red mt-1">
                  {"// oled not detected · check wiring"}
                </div>
              )}
            </div>

            <div className="text-green pt-3 border-t border-border mt-3 leading-tight">
              {"// arduino_c++ tab works without any of this"}
              <br />
              {"// copy code → arduino ide → upload directly"}
            </div>
          </div>
        )}
      </section>

      {/* SECTION 3: Code Output */}
      <section className="flex-1 flex flex-col min-h-[300px] w-full max-w-[512px] mx-auto">
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

        <div className="flex-1 bg-code-bg border border-border relative flex flex-col p-4 overflow-hidden">
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 z-10 bg-code-bg text-dim hover:text-accent transition-colors text-xs px-2 py-1 border border-border hover:border-accent"
          >
            {copied ? '{"// copied!"}' : "[copy]"}
          </button>

          <div
            id="code-output-scroll"
            className="overflow-auto h-full hide-scrollbar flex"
          >
            <pre className="text-sm font-mono flex pb-4">
              <div className="text-dim pr-4 text-right select-none border-r border-border/30 mr-4 flex flex-col justify-start">
                {codeLines.map((_, i) => (
                  <span key={i}>{i + 1}</span>
                ))}
              </div>
              <code className="text-text whitespace-pre">{codeToShow}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* SECTION 4: Serial Terminal Panel */}
      <section className="w-full max-w-[512px] mx-auto flex flex-col mt-auto pb-4">
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
                if (log === "[[MIP_INSTALL_BUTTON]]") {
                  return null;
                }

                let colorClass = "";
                if (
                  log.includes("adjusting address") ||
                  log.includes("warning")
                )
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

      {/* MicroPython Guided Setup Modal */}
      {microPythonModalOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-bg/80 backdrop-blur-sm p-4">
          <div className="bg-surface border border-border w-full max-w-md shadow-2xl font-mono text-sm flex flex-col p-6 space-y-6">
            <div className="text-yellow text-xs">
              {"// micropython_required"}
            </div>

            <p className="text-text leading-relaxed text-xs">
              run_on_device streams live animation to your
              <br />
              esp32 using micropython repl.
              <br />
              <br />
              your esp32 needs micropython firmware first.
              <br />
              this is a one-time setup, takes ~2 minutes.
            </p>

            <div className="flex flex-col space-y-3">
              <a
                href="https://micropython.org/download/ESP32_GENERIC"
                target="_blank"
                rel="noreferrer"
                className="w-full text-center px-4 py-3 border border-border text-dim hover:border-accent hover:text-accent transition-colors text-xs uppercase block"
              >
                [→ download micropython for esp32]
              </a>
              <a
                href="https://micropython.org/download/ESP32_GENERIC/#installation"
                target="_blank"
                rel="noreferrer"
                className="w-full text-center px-4 py-3 border border-border text-dim hover:border-accent hover:text-accent transition-colors text-xs uppercase block"
              >
                [→ how to flash micropython]
              </a>
            </div>

            <div className="text-dim text-xs opacity-75">
              {"// after flashing, come back and click"}
              <br />
              {"// run_on_device again"}
            </div>

            <button
              onClick={() => setMicroPythonModalOpen(false)}
              className="w-full px-4 py-3 border border-dim text-dim hover:text-text text-xs uppercase"
            >
              [got it · close]
            </button>
          </div>
        </div>
      )}

      {/* Download & Flash Modal */}
      {downloadModalOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-bg/80 backdrop-blur-sm p-4">
          <div className="bg-surface border border-border w-full max-w-lg shadow-2xl font-mono text-sm flex flex-col p-6 space-y-6">
            <div className="text-dim text-xs">
              {"// get_code_on_your_esp32"}
            </div>

            <p className="text-text text-xs">choose your method:</p>

            {/* Option A */}
            <div className="border border-border p-4 flex flex-col space-y-4">
              <div className="text-accent text-xs">
                OPTION A · arduino ide (recommended)
              </div>
              <ul className="text-dim text-xs space-y-2">
                <li>1. click download below</li>
                <li>2. open .ino file in arduino ide</li>
                <li>3. select your board: ESP32 Dev Module</li>
                <li>4. select port and upload</li>
              </ul>
              <button
                onClick={() => {
                  const code = animation.getArduinoCode(size);
                  const blob = new Blob([code], { type: "text/plain" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${animation.name}.ino`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
                className="w-full px-4 py-3 border border-accent text-accent hover:bg-accent/10 transition-colors text-xs uppercase"
              >
                [↓ download {animation.name}.ino]
              </button>
            </div>

            {/* Option B */}
            <div className="border border-border p-4 flex flex-col space-y-4">
              <div className="text-accent text-xs">
                OPTION B · micropython (run_on_device)
              </div>
              <p className="text-dim text-xs leading-relaxed">
                if you have micropython installed,
                <br />
                use run_on_device to stream animation
                <br />
                live — no upload needed.
              </p>
              <button
                onClick={() => {
                  setDownloadModalOpen(false);
                  togglePreview();
                }}
                className="w-full px-4 py-3 border border-border text-text hover:border-accent hover:text-accent transition-colors text-xs uppercase"
              >
                [→ use run_on_device instead]
              </button>
            </div>

            <button
              onClick={() => setDownloadModalOpen(false)}
              className="w-full px-4 py-3 bg-transparent text-dim hover:text-text transition-colors text-xs uppercase"
            >
              [close]
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
