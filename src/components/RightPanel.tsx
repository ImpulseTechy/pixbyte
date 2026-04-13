/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';
import { useState, useEffect, useRef } from 'react';
import { OLEDAnimation } from '@/data/animations';
import OLEDCanvas from './OLEDCanvas';
import { useSerial } from '@/context/SerialContext';

interface Props {
  animation: OLEDAnimation;
  size: number;
}

export default function RightPanel({ animation, size }: Props) {
  const [activeCodeTab, setActiveCodeTab] = useState<'arduino_c++' | 'micropython'>('arduino_c++');
  const [copied, setCopied] = useState(false);
  const [terminalOpen, setTerminalOpen] = useState(false);
  
  const [previewRunning, setPreviewRunning] = useState(false);
  const [flashModalOpen, setFlashModalOpen] = useState(false);
  const [flashProgress, setFlashProgress] = useState<'idle' | 'writing' | 'success' | 'error'>('idle');

  const { connectionState, logs, clearLogs, hasMicroPython, executeRawRepl, sendData } = useSerial();
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const codeEl = document.getElementById('code-output-scroll');
    if (codeEl) codeEl.scrollTop = 0;
  }, [animation, activeCodeTab, size]);

  useEffect(() => {
    if (terminalOpen && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, terminalOpen]);

  const handleCopy = () => {
    const code = activeCodeTab === 'arduino_c++' 
      ? animation.getArduinoCode(size)
      : animation.getMicroPythonCode(size);
    
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const handleDownload = () => {
    const code = animation.getMicroPythonCode(size);
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'main.py';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const togglePreview = async () => {
    if (previewRunning) {
      try {
        await sendData("\x03"); // Ctrl+C
        await new Promise(r => setTimeout(r, 100));
        await sendData("\x01"); // Ctrl+A
        await new Promise(r => setTimeout(r, 100));
        const stopCode = `
import machine
from ssd1306 import SSD1306_I2C
i2c = machine.I2C(0, scl=machine.Pin(22), sda=machine.Pin(21))
oled = SSD1306_I2C(128, 64, i2c)
oled.fill(0)
oled.show()
`;
        await sendData(stopCode);
        await new Promise(r => setTimeout(r, 50));
        await sendData("\x04"); // Ctrl+D
        await new Promise(r => setTimeout(r, 100));
        await sendData("\x02"); // Ctrl+B exit
      } catch (e) {
        console.error(e);
      } finally {
        setPreviewRunning(false);
      }
    } else {
      if (!hasMicroPython) {
        setTerminalOpen(true);
        // Error already handled / shown via context?
        return;
      }
      setPreviewRunning(true);
      try {
        const code = animation.getMicroPythonCode(size);
        const res = await executeRawRepl(code, false); // Don't wait for OK closely, just stream
        // Stream will be active in terminal
      } catch (e: any) {
        setPreviewRunning(false);
      }
    }
  };

  const handleFlash = async () => {
    setFlashProgress('writing');
    try {
      const code = animation.getMicroPythonCode(size);
      
      // Need to write file using f = open('main.py', 'w')
      // To avoid massive string chunking crashes, we will loop writes.
      await sendData("\x03");
      await new Promise(r => setTimeout(r, 200));
      await sendData("\x01");
      await new Promise(r => setTimeout(r, 100));
      
      const setupCode = `f = open('main.py', 'w')\n`;
      await sendData(setupCode);
      await new Promise(r => setTimeout(r, 50));
      
      // Send chunks as f.write()
      const chunkSize = 128;
      for (let i = 0; i < code.length; i += chunkSize) {
         let chunk = code.substring(i, i + chunkSize);
         // basic escape
         chunk = chunk.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
         await sendData(`f.write("${chunk}")\n`);
         await new Promise(r => setTimeout(r, 50));
      }
      
      await sendData(`f.close()\n`);
      await new Promise(r => setTimeout(r, 50));
      await sendData("\x04"); // Execute all the lines buffered in raw repl

      setFlashProgress('success');
    } catch(e) {
      setFlashProgress('error');
    } finally {
      // Exit raw repl
      try { await sendData("\x02"); } catch(e){}
    }
  };

  const isConnected = connectionState === 'CONNECTED';
  const disabledTitle = !isConnected ? "// connect esp32 to enable" : (!hasMicroPython ? "// micropython required" : "");

  const codeToShow = activeCodeTab === 'arduino_c++' 
    ? animation.getArduinoCode(size)
    : animation.getMicroPythonCode(size);
    
  const codeLines = codeToShow.split('\n');

  return (
    <div className="flex flex-col h-full w-full lg:w-[48%] bg-bg lg:relative absolute bottom-0 z-20 border-t lg:border-t-0 lg:border-l border-border p-4 overflow-y-auto space-y-4 max-h-[60vh] lg:max-h-full shadow-2xl lg:shadow-none">
      
      {/* MicroPython Alert */}
      {isConnected && !hasMicroPython && (
        <div className="w-full bg-yellow/15 border border-yellow text-yellow text-xs px-4 py-2 flex items-center justify-between">
          <span>{"// ⚠ micropython not detected on this device · flash micropython first"}</span>
          <a href="https://micropython.org/download/ESP32_GENERIC" target="_blank" className="underline hover:text-white">download</a>
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
          disabled={!isConnected || (!hasMicroPython && !previewRunning)}
          title={disabledTitle}
          onClick={togglePreview}
          className={`px-3 py-2 border transition-colors text-[10px] sm:text-xs uppercase ${
            previewRunning 
              ? "border-red text-red hover:bg-red/10 cursor-pointer"
              : (isConnected && hasMicroPython 
                  ? "border-accent text-accent hover:bg-accent/10 cursor-pointer" 
                  : "border-dim text-dim disabled:opacity-50 disabled:cursor-not-allowed")
          }`}
        >
          {previewRunning ? "⏹ stop_preview" : "▶ run_on_device"}
        </button>
        <button 
          disabled={!isConnected || !hasMicroPython}
          title={disabledTitle}
          onClick={() => { setFlashProgress('idle'); setFlashModalOpen(true); }}
          className={`px-3 py-2 border transition-colors text-[10px] sm:text-xs uppercase ${
            isConnected && hasMicroPython
              ? "border-accent text-accent hover:bg-accent/10 cursor-pointer" 
              : "border-dim text-dim disabled:opacity-50 disabled:cursor-not-allowed"
          }`}
        >
          ⬆ flash_firmware
        </button>
        <button 
          onClick={handleCopy}
          className="px-3 py-2 border border-accent text-accent hover:bg-accent/10 transition-colors text-[10px] sm:text-xs uppercase cursor-pointer"
        >
          📋 copy_code
        </button>
        <button 
          onClick={() => {
            const isPy = activeCodeTab === 'micropython';
            const code = isPy ? animation.getMicroPythonCode(size) : animation.getArduinoCode(size);
            const blob = new Blob([code], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = isPy ? 'main.py' : `${animation.name}.ino`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }}
          className="px-3 py-2 border border-accent text-accent hover:bg-accent/10 transition-colors text-[10px] sm:text-xs uppercase cursor-pointer flex flex-col justify-center items-center"
        >
          <span>↓ download</span>
          <span className="text-[8px] opacity-75">{activeCodeTab === 'micropython' ? '.py' : '.ino'}</span>
        </button>
      </section>

      {/* SECTION 3: Code Output */}
      <section className="flex-1 flex flex-col min-h-[300px] w-full max-w-[512px] mx-auto">
        <div className="flex border-b border-border mb-3">
          {(['arduino_c++', 'micropython'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveCodeTab(tab)}
              className={`px-4 py-2 text-sm transition-colors ${
                activeCodeTab === tab
                  ? 'text-accent border-b-2 border-accent -mb-[1px]'
                  : 'text-dim hover:text-text'
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
            {copied ? '{"// copied!"}' : '[copy]'}
          </button>
          
          <div id="code-output-scroll" className="overflow-auto h-full hide-scrollbar flex">
            <pre className="text-sm font-mono flex pb-4">
              <div className="text-dim pr-4 text-right select-none border-r border-border/30 mr-4 flex flex-col justify-start">
                {codeLines.map((_, i) => (
                  <span key={i}>{i + 1}</span>
                ))}
              </div>
              <code className="text-text whitespace-pre">
                {codeToShow}
              </code>
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
          {`// serial_monitor ${terminalOpen ? '▲' : '▼'}`}
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
              {logs.map((log, i) => (
                <span key={i}>{log}</span>
              ))}
              <div className="flex items-center">
                <span>&gt;</span>
                <span className="w-2 h-3 bg-green animate-pulse ml-1 inline-block"></span>
              </div>
              <div ref={terminalEndRef}></div>
            </div>
          </div>
        )}
      </section>

      {/* Flash Firmware Modal */}
      {flashModalOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-bg/80 backdrop-blur-sm p-4">
          <div className="bg-surface border border-border w-full max-w-sm shadow-2xl font-mono text-sm">
            <div className="border-b border-border p-3 text-dim text-xs">
              {"//"} flash_firmware
            </div>
            <div className="p-4 space-y-4 text-xs">
              <p className="text-text leading-relaxed">
                this will write main.py to your esp32.<br/>
                requires micropython already installed.<br/>
                existing main.py will be overwritten.
              </p>
              <div className="text-accent bg-accent/10 px-2 py-1 border border-accent/20">
                selected: {animation.name} · {size}px
              </div>
              
              {/* Progress Indicators */}
              <div className="h-6 flex items-center">
                {flashProgress === 'writing' && <span className="text-dim">{"// writing main.py... [████████░░] 80%"}</span>}
                {flashProgress === 'success' && <span className="text-green">{"// ✓ main.py written · replug your esp32"}</span>}
                {flashProgress === 'error' && <span className="text-red">{"// ✕ write failed · see serial monitor"}</span>}
              </div>

              {flashProgress !== 'idle' && (
                <button 
                  onClick={handleDownload}
                  className="text-dim hover:text-accent underline block"
                >
                  [↓ download main.py fallback]
                </button>
              )}
            </div>
            <div className="border-t border-border p-3 flex justify-end space-x-3">
               <button onClick={() => setFlashModalOpen(false)} className="px-4 py-2 border border-dim text-dim hover:text-text text-xs uppercase">
                 [cancel]
               </button>
               <button onClick={handleFlash} disabled={flashProgress === 'writing'} className="px-4 py-2 border border-accent text-accent hover:bg-accent/10 text-xs uppercase disabled:opacity-50">
                 [confirm_flash]
               </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
