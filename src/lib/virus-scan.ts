import { createConnection } from 'node:net';
import { Readable } from 'node:stream';

export interface ScanResult {
  clean: boolean;
  virusName?: string;
  error?: string;
  scanned: boolean;
}

const CLAMAV_HOST = process.env.CLAMAV_HOST || 'localhost';
const CLAMAV_PORT = parseInt(process.env.CLAMAV_PORT || '3310', 10);
const SCAN_TIMEOUT = parseInt(process.env.CLAMAV_TIMEOUT || '30000', 10);

function clamavPing(): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = createConnection({ host: CLAMAV_HOST, port: CLAMAV_PORT, timeout: 5000 }, () => {
      socket.write('PING\n');
    });

    const timer = setTimeout(() => {
      socket.destroy();
      resolve(false);
    }, 5000);

    socket.on('data', (data: Buffer) => {
      clearTimeout(timer);
      socket.destroy();
      resolve(data.toString().trim() === 'PONG');
    });

    socket.on('error', () => {
      clearTimeout(timer);
      resolve(false);
    });
  });
}

function clamavScanStream(stream: Readable): Promise<ScanResult> {
  return new Promise((resolve) => {
    const socket = createConnection({
      host: CLAMAV_HOST,
      port: CLAMAV_PORT,
      timeout: SCAN_TIMEOUT,
    }, () => {
      socket.write('zINSTREAM\0');
      stream.on('data', (chunk: Buffer) => {
        const size = Buffer.alloc(4);
        size.writeUInt32BE(chunk.length, 0);
        socket.write(Buffer.concat([size, chunk]));
      });
      stream.on('end', () => {
        const terminator = Buffer.alloc(4, 0);
        socket.write(terminator);
      });
    });

    const timer = setTimeout(() => {
      socket.destroy();
      resolve({
        clean: false,
        scanned: false,
        error: 'ClamAV scan timeout',
      });
    }, SCAN_TIMEOUT);

    let response = '';

    socket.on('data', (data: Buffer) => {
      response += data.toString();
    });

    socket.on('end', () => {
      clearTimeout(timer);
      const trimmed = response.trim();

      if (trimmed.startsWith('stream: ') && trimmed.endsWith(' OK')) {
        resolve({ clean: true, scanned: true });
      } else if (trimmed.includes('FOUND')) {
        const parts = trimmed.split(': ');
        const virusName = parts.length > 1 ? parts[parts.length - 1].replace(' FOUND', '') : 'Unknown';
        resolve({ clean: false, scanned: true, virusName });
      } else if (trimmed.includes('ERROR')) {
        resolve({ clean: false, scanned: false, error: trimmed });
      } else {
        resolve({ clean: false, scanned: false, error: `Unexpected response: ${trimmed}` });
      }
    });

    socket.on('error', (err) => {
      clearTimeout(timer);
      resolve({ clean: false, scanned: false, error: err.message });
    });
  });
}

export interface VirusScanner {
  isAvailable(): Promise<boolean>;
  scanBuffer(buffer: Buffer, options?: { failClosed?: boolean }): Promise<ScanResult>;
  ping(): Promise<boolean>;
}

export function createVirusScanner(): VirusScanner {
  return {
    async isAvailable(): Promise<boolean> {
      try {
        return await clamavPing();
      } catch {
        return false;
      }
    },

    async ping(): Promise<boolean> {
      return this.isAvailable();
    },

    async scanBuffer(buffer: Buffer, options?: { failClosed?: boolean }): Promise<ScanResult> {
      try {
        const available = await clamavPing();
        if (!available) {
          if (options?.failClosed) {
            return {
              clean: false,
              scanned: false,
              error: 'ClamAV daemon not available — blocking upload (fail-closed mode)',
            };
          }
          return {
            clean: true,
            scanned: false,
            error: 'ClamAV daemon not available — skipping scan',
          };
        }

        const stream = Readable.from(buffer);
        return await clamavScanStream(stream);
      } catch (err) {
        if (options?.failClosed) {
          return {
            clean: false,
            scanned: false,
            error: err instanceof Error ? err.message : 'Unknown scan error',
          };
        }
        return {
          clean: true,
          scanned: false,
          error: err instanceof Error ? err.message : 'Unknown scan error',
        };
      }
    },
  };
}

export const virusScanner = createVirusScanner();
