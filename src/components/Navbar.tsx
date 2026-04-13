'use client';
import { useState } from 'react';
import { useSerial } from '@/context/SerialContext';

export default function Navbar() {
  const { isSupported, connectionState, portInfo, connect, disconnect } = useSerial();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleChipClick = () => {
    switch (connectionState) {
      case 'DISCONNECTED':
      case 'ERROR':
        connect();
        break;
      case 'CONNECTED':
        setDropdownOpen(!dropdownOpen);
        break;
      case 'CONNECTING':
      default:
        break;
    }
  };

  const toHex = (n?: number) => (n ? n.toString(16).padStart(4, '0') : 'unknown');

  const chipContent = {
    DISCONNECTED: { icon: '○', text: 'not_connected', color: 'text-dim', border: 'border-dim/50' },
    CONNECTING:   { icon: '◌', text: 'connecting...', color: 'text-yellow animate-pulse', border: 'border-yellow/50' },
    CONNECTED:    { icon: '●', text: 'serial_device · 115200', color: 'text-green', border: 'border-green/50' },
    ERROR:        { icon: '✕', text: 'connection_failed · retry?', color: 'text-red', border: 'border-red/50' }
  }[connectionState];

  return (
    <>
      <nav className="w-full h-12 sticky top-0 bg-bg border-b border-border flex items-center justify-between px-4 z-50">
        <div className="flex items-baseline space-x-4">
          <span className="text-accent font-bold text-lg">0x1306</span>
          <span className="text-dim text-xs hidden sm:inline-block">
            {"// oled animation tool for esp32"}
          </span>
        </div>
        
        <div className="flex items-center relative">
          <button 
            onClick={handleChipClick}
            disabled={connectionState === 'CONNECTING'}
            className={`flex items-center space-x-2 border px-3 py-1 bg-surface text-xs transition-colors cursor-pointer hover:border-accent ${chipContent.color} ${chipContent.border}`}
          >
            <span>{chipContent.icon}</span>
            <span>{chipContent.text}</span>
          </button>

          {/* Connection Info Panel Dropdown */}
          {connectionState === 'CONNECTED' && dropdownOpen && (
            <div className="absolute top-10 right-0 w-64 bg-surface border border-border mt-1 p-3 z-50 shadow-2xl flex flex-col space-y-2">
              <div className="text-green text-sm flex items-center space-x-2">
                <span>●</span>
                <span>device_connected</span>
              </div>
              <div className="text-dim text-[11px] flex flex-col space-y-1 ml-1 mt-1">
                <span>{"// port: serial_device"}</span>
                <span>{"// baud: 115200"}</span>
                <span>{"// vendor: "}{toHex(portInfo?.usbVendorId)} · {"product: "}{toHex(portInfo?.usbProductId)}</span>
              </div>
              <div className="pt-2">
                <button 
                  onClick={() => {
                    disconnect();
                    setDropdownOpen(false);
                  }}
                  className="w-full border border-dim text-dim py-1 text-xs hover:text-text hover:border-text transition-colors"
                >
                  [disconnect]
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {!isSupported && (
        <div className="w-full bg-yellow/15 border-b border-yellow text-yellow text-xs px-4 py-2 flex items-center justify-center">
          {"// ⚠ web serial not supported · use chrome or edge to connect your esp32"}
        </div>
      )}
    </>
  );
}
