import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory of this file for relative imports
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Vercel Serverless Functions (Node runtime). Use very lightweight typings
// to avoid requiring @vercel/node types.
export default async function handler(req: any, res: any) {
  try {
    // Lazy load the server entry on first request
    let serverEntry: any;
    try {
      // Try to load from the dist directory relative to the current file
      const serverPath = path.join(__dirname, '..', 'dist', 'server', 'index.js');
      serverEntry = await import(serverPath);
    } catch (importError) {
      console.error('Failed to import server from dist:', importError);
      // Fallback: try from src
      try {
        serverEntry = await import('../src/server.ts');
      } catch (fallbackError) {
        console.error('Failed to import from src:', fallbackError);
        throw new Error(`Cannot load server entry. Primary error: ${importError}`);
      }
    }

    const url = new URL(req.url ?? '/', `http://${req.headers?.host ?? 'localhost'}`);

    // TanStack Start expects a WHATWG Request.
    const body = req.method && req.method !== 'GET' && req.method !== 'HEAD' ? req.body : undefined;

    const headers: Record<string, string> = {};
    if (req.headers) {
      for (const [k, v] of Object.entries(req.headers)) {
        headers[k] = Array.isArray(v) ? v.join(',') : (v ?? '').toString();
      }
    }

    const request = new Request(url.toString(), {
      method: req.method,
      headers,
      body: body !== undefined ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
    });

    const response: Response = await (serverEntry as any).fetch(request, undefined, undefined);

    res.statusCode = response.status;
    response.headers.forEach((value: string, key: string) => {
      res.setHeader(key, value);
    });

    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      res.end(JSON.stringify(await response.json()));
    } else {
      res.end(await response.text());
    }
  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}
