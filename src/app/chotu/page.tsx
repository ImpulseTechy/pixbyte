/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/no-unescaped-entities */
'use client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useSerial } from '@/context/SerialContext';
import { useState } from 'react';

export default function ChotuPage() {
  const { connectionState, hasMicroPython, sendData } = useSerial();
  const [flashProgress, setFlashProgress] = useState<'idle' | 'writing' | 'success' | 'error'>('idle');

  const handleFlash = async () => {
    setFlashProgress('writing');
    try {
      await sendData("\x03");
      await new Promise(r => setTimeout(r, 200));
      await sendData("\x01");
      await new Promise(r => setTimeout(r, 100));
      
      const setupCode = `f = open('main.py', 'w')\n`;
      await sendData(setupCode);
      await new Promise(r => setTimeout(r, 50));
      
      const dummyFirmware = `# CHOTU OPEN SOURCE V1.0\nimport machine\nfrom ssd1306 import SSD1306_I2C\ni2c = machine.I2C(0, scl=machine.Pin(22), sda=machine.Pin(21))\noled = SSD1306_I2C(128, 64, i2c)\noled.text('CHOTU V1.0', 25, 20)\noled.text('READY...', 35, 40)\noled.show()\n`;
      
      const chunkSize = 128;
      for (let i = 0; i < dummyFirmware.length; i += chunkSize) {
         let chunk = dummyFirmware.substring(i, i + chunkSize);
         chunk = chunk.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
         await sendData(`f.write("${chunk}")\n`);
         await new Promise(r => setTimeout(r, 50));
      }
      
      await sendData(`f.close()\n`);
      await new Promise(r => setTimeout(r, 50));
      await sendData("\x04"); 
      setFlashProgress('success');
    } catch(e) {
      setFlashProgress('error');
    } finally {
      try { await sendData("\x02"); } catch(e){}
    }
  };

  const isConnected = connectionState === 'CONNECTED';

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-bg text-text selection:bg-accent/30 selection:text-text">
      <Navbar />
      
      <main className="flex-1 overflow-y-auto p-4 md:p-8 font-mono">
        <div className="max-w-4xl mx-auto space-y-12 pb-12">
          
          {/* Header */}
          <header className="space-y-2">
            <h1 className="text-xl text-accent font-bold">{"// chotu — the open source indian mochi"}</h1>
            <p className="text-dim">{"// total bom cost: ₹450–600 · works on any esp32 devkit"}</p>
          </header>

          {/* BOM Table */}
          <section className="overflow-x-auto">
            <pre className="text-sm border border-border p-4 bg-surface max-w-2xl leading-relaxed">
<span className="text-dim">component              qty    price    where to buy</span>
<span className="text-border">─────────────────────────────────────────────────────</span>
esp32 devkit v1        1      ₹220     robu.in / amazon.in
ssd1306 oled 0.96"     1      ₹90      robu.in / amazon.in
5v active buzzer       1      ₹15      robu.in
push button 6mm        2      ₹5       any local shop
breadboard half size   1      ₹60      robu.in
jumper wires m-m       10     ₹30      robu.in
micro usb cable        1      ₹60      amazon.in
<span className="text-border">─────────────────────────────────────────────────────</span>
<span className="text-accent">total                                  ~₹480</span>
            </pre>
          </section>

          {/* Wiring Diagram */}
          <section className="border border-border bg-surface p-4 max-w-2xl relative overflow-hidden">
            <div className="text-dim text-xs mb-4">{"// wiring diagram"}</div>
            
            <svg viewBox="0 0 600 300" className="w-full h-auto bg-bg border border-border">
              {/* Traces */}
              <g stroke="var(--accent)" strokeWidth="2" fill="none" opacity="0.6">
                {/* OLED Traces */}
                <path d="M 120 70 L 150 70 L 150 40 L 400 40 L 400 65" /> {/* VCC -> 3.3V */}
                <path d="M 120 90 L 140 90 L 140 30 L 410 30 L 410 65" stroke="#484f58" /> {/* GND -> GND */}
                <path d="M 120 110 L 320 110 L 320 220 L 400 220" /> {/* SCL -> GPIO22 */}
                <path d="M 120 130 L 310 130 L 310 240 L 400 240" /> {/* SDA -> GPIO21 */}
                
                {/* Buzzer Traces */}
                <path d="M 100 210 L 160 210 L 160 280 L 420 280 L 420 240" /> {/* + -> GPIO25 */}
                <path d="M 100 230 L 130 230 L 130 290 L 430 290 L 430 65" stroke="#484f58" /> {/* - -> GND (shared) */}
                
                {/* Button Traces */}
                <path d="M 230 180 L 230 160 L 400 160" /> {/* Btn1 -> GPIO0 */}
                <path d="M 270 180 L 270 150 L 400 150" /> {/* Btn2 -> GPIO35 */}
              </g>

              {/* OLED Module */}
              <rect x="20" y="50" width="100" height="100" fill="#0d1117" stroke="var(--border)" />
              <rect x="30" y="70" width="80" height="40" fill="#060810" stroke="var(--border)" />
              <text x="35" y="60" fill="var(--dim)" fontSize="10" fontFamily="monospace">SSD1306</text>
              {[70, 90, 110, 130].map((y, i) => (
                <circle key={y} cx="120" cy={y} r="3" fill="#d29922" />
              ))}
              <text x="95" y="73" fill="var(--dim)" fontSize="8">VCC</text>
              <text x="95" y="93" fill="var(--dim)" fontSize="8">GND</text>
              <text x="95" y="113" fill="var(--dim)" fontSize="8">SCL</text>
              <text x="95" y="133" fill="var(--dim)" fontSize="8">SDA</text>

              {/* Buzzer */}
              <circle cx="60" cy="220" r="25" fill="#0d1117" stroke="var(--border)" />
              <circle cx="60" cy="220" r="10" fill="#060810" stroke="var(--border)" />
              <circle cx="100" cy="210" r="3" fill="#d29922" />
              <circle cx="100" cy="230" r="3" fill="#d29922" />
              <text x="105" y="213" fill="var(--dim)" fontSize="8">+</text>
              <text x="105" y="233" fill="var(--dim)" fontSize="8">-</text>

              {/* Buttons */}
              <rect x="210" y="180" width="20" height="20" fill="#0d1117" stroke="var(--border)" />
              <circle cx="220" cy="190" r="6" fill="#f85149" />
              <circle cx="230" cy="180" r="3" fill="#d29922" />

              <rect x="250" y="180" width="20" height="20" fill="#0d1117" stroke="var(--border)" />
              <circle cx="260" cy="190" r="6" fill="#3fb950" />
              <circle cx="270" cy="180" r="3" fill="#d29922" />

              {/* ESP32 Block */}
              <rect x="400" y="60" width="120" height="190" fill="#0d1117" stroke="var(--border)" />
              <rect x="440" y="30" width="40" height="30" fill="#060810" stroke="var(--border)" />
              <text x="445" y="50" fill="var(--dim)" fontSize="10">USB</text>
              <text x="455" y="150" fill="var(--dim)" fontSize="14" fontFamily="monospace" transform="rotate(90 455 150)">ESP32 DevKit</text>
              
              {/* ESP32 Pins Left */}
              {[...Array(15)].map((_, i) => (
                <circle key={i} cx="410" cy={70 + i * 11} r="2" fill="#d29922" />
              ))}
              
              {/* ESP32 Pins Right */}
              {[...Array(15)].map((_, i) => (
                <circle key={i} cx="510" cy={70 + i * 11} r="2" fill="#d29922" />
              ))}

              <text x="415" y="73" fill="var(--dim)" fontSize="8">3.3V</text>
              <text x="415" y="84" fill="var(--dim)" fontSize="8">GND</text>
              <text x="415" y="161" fill="var(--dim)" fontSize="8">IO35</text>
              <text x="415" y="172" fill="var(--dim)" fontSize="8">IO0</text>
              <text x="415" y="216" fill="var(--dim)" fontSize="8">IO25</text>
              <text x="415" y="227" fill="var(--dim)" fontSize="8">IO22</text>
              <text x="415" y="238" fill="var(--dim)" fontSize="8">IO21</text>
            </svg>
          </section>

          {/* Firmware Flash Section */}
          <section className="space-y-4">
            <div className="space-y-2">
              <div className="text-dim text-sm">{"// step 1: flash micropython to your esp32"}</div>
              <a 
                href="https://micropython.org/download/ESP32_GENERIC" 
                target="_blank" 
                rel="noreferrer"
                className="inline-block px-4 py-2 border border-dim text-accent hover:border-accent hover:bg-accent/10 transition-colors text-sm uppercase"
              >
                [↓ download micropython]
              </a>
            </div>

            <div className="space-y-2 pt-4">
              <div className="text-dim text-sm">{"// step 2: connect your esp32 and flash the chotu firmware"}</div>
              <div className="flex items-center space-x-4">
                <button 
                  onClick={handleFlash}
                  disabled={!isConnected || flashProgress === 'writing' || !hasMicroPython}
                  className="px-4 py-2 border border-accent text-accent hover:bg-accent/10 transition-colors text-sm uppercase disabled:opacity-50 disabled:border-dim disabled:text-dim disabled:cursor-not-allowed"
                >
                  [⬆ flash chotu firmware]
                </button>
                {flashProgress === 'writing' && <span className="text-dim text-sm">{"// writing main.py... [████████░░]"}</span>}
                {flashProgress === 'success' && <span className="text-green text-sm">{"// ✓ firmware written · replug esp32"}</span>}
                {flashProgress === 'error' && <span className="text-red text-sm">{"// ✕ write failed"}</span>}
              </div>
            </div>

            <div className="pt-4">
              <div className="text-dim text-sm">{"// step 3: wire it up and power on"}</div>
              <div className="text-text text-sm">{"// that's it. you're done."}</div>
            </div>
          </section>

          {/* Github Section */}
          <section className="pt-8 border-t border-border mt-8">
            <div className="text-dim text-sm mb-2">{"// chotu is open source · star it · fork it · improve it"}</div>
            <a 
              href="https://github.com/yogeshbawane/chotu" 
              target="_blank" 
              rel="noreferrer"
              className="text-accent hover:underline text-sm uppercase"
            >
              [→ github.com/yogeshbawane/chotu]
            </a>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
}
