/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';
import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';

export type ConnectionState = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR';

interface SerialContextValue {
  isSupported: boolean;
  connectionState: ConnectionState;
  portInfo: { usbVendorId?: number; usbProductId?: number } | null;
  logs: string[];
  hasMicroPython: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  sendData: (data: string) => Promise<void>;
  executeRawRepl: (code: string, waitResponse?: boolean) => Promise<string>;
  clearLogs: () => void;
}

const SerialContext = createContext<SerialContextValue | null>(null);

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const SerialProvider = ({ children }: { children: ReactNode }) => {
  const [isSupported, setIsSupported] = useState(true);
  const [connectionState, setConnectionState] = useState<ConnectionState>('DISCONNECTED');
  const [portInfo, setPortInfo] = useState<{ usbVendorId?: number; usbProductId?: number } | null>(null);
  const [hasMicroPython, setHasMicroPython] = useState(false);
  const [logs, setLogs] = useState<string[]>([
    "// 0x1306.dev · interactive terminal",
    "// waiting for device connection_"
  ]);
  
  const portRef = useRef<any>(null);
  const readerRef = useRef<any>(null);
  const readBufferRef = useRef<string>("");

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsSupported('serial' in navigator);
    }
  }, []);

  const addLog = (log: string) => setLogs(prev => [...prev, log].slice(-100));
  const clearLogs = () => setLogs([]);

  const sendData = async (data: string) => {
    if (!portRef.current || !portRef.current.writable) return;
    const encoder = new TextEncoder();
    const writer = portRef.current.writable.getWriter();
    try {
      await writer.write(encoder.encode(data));
    } catch(e: any) {
       addLog(`// ERR writing: ${e.message}`);
    } finally {
      writer.releaseLock();
    }
  };

  const executeRawRepl = async (code: string, waitResponse = true): Promise<string> => {
    if (!portRef.current) throw new Error("Port closed");
    
    // Interrupt
    await sendData("\x03");
    await delay(200);

    // Enter raw REPL
    await sendData("\x01");
    await delay(100);

    // Write chunks
    const chunkSize = 256;
    for (let i = 0; i < code.length; i += chunkSize) {
      await sendData(code.substring(i, i + chunkSize));
      await delay(20);
    }

    readBufferRef.current = "";

    // Execute
    await sendData("\x04");

    if (waitResponse) {
      for (let i = 0; i < 20; i++) {
        await delay(100);
        if (readBufferRef.current.includes("OK") || readBufferRef.current.includes("Traceback") || readBufferRef.current.includes("\x04")) {
          break;
        }
      }
    }
    
    return readBufferRef.current;
  };

  const connect = async () => {
    if (!('serial' in navigator)) return;
    
    try {
      setConnectionState('CONNECTING');
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: 115200 });

      portRef.current = port;
      setPortInfo(port.getInfo());
      setConnectionState('CONNECTED');
      addLog('// system: device connected at 115200 baud');

      readLoop(port);

      // Startup micro python check
      try {
        await sendData("\x03"); // Interrupt
        await delay(200);
        const res = await executeRawRepl("import sys; print(sys.implementation.name)");
        if (res.includes("micropython")) {
          setHasMicroPython(true);
        } else {
          setHasMicroPython(false);
          addLog("// warning: micropython not detected on boot");
        }
        await sendData("\x02"); // Exit raw repl
      } catch (e) {
        setHasMicroPython(false);
      }

    } catch (err: any) {
      setConnectionState('ERROR');
      addLog(`// ERR: ${err.message || 'connection failed'}`);
    }
  };

  const disconnect = async () => {
    try {
      if (readerRef.current) {
        await readerRef.current.cancel();
      }
      if (portRef.current) {
        await portRef.current.close();
      }
    } catch(e) {
       console.error(e);
    } finally {
      portRef.current = null;
      readerRef.current = null;
      setConnectionState('DISCONNECTED');
      setPortInfo(null);
      setHasMicroPython(false);
      addLog('// system: disconnected');
    }
  };

  const readLoop = async (port: any) => {
    while (port.readable && portRef.current === port) {
      const textDecoder = new TextDecoderStream();
      const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
      const reader = textDecoder.readable.getReader();
      readerRef.current = reader;

      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          if (value) {
            readBufferRef.current += value;
            let newlineIdx;
            while ((newlineIdx = readBufferRef.current.indexOf('\n')) >= 0) {
              const line = readBufferRef.current.slice(0, newlineIdx).trim();
              if (line) addLog(line);
              readBufferRef.current = readBufferRef.current.slice(newlineIdx + 1);
            }
          }
        }
      } catch (error) {
        if (portRef.current) {
          setConnectionState('ERROR');
          addLog('// ERR: device disconnected unexpectedly');
        }
      } finally {
        readerRef.current = null;
        try {
          reader.releaseLock();
        } catch (e) {}
      }
    }
  };

  return (
    <SerialContext.Provider value={{
      isSupported,
      connectionState,
      portInfo,
      logs,
      hasMicroPython,
      connect,
      disconnect,
      sendData,
      executeRawRepl,
      clearLogs
    }}>
      {children}
    </SerialContext.Provider>
  );
};

export const useSerial = () => {
  const ctx = useContext(SerialContext);
  if (!ctx) throw new Error('useSerial must be used within SerialProvider');
  return ctx;
};
