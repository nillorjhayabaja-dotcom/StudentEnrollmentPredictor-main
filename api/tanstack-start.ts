// Load the server entry module
// In production (Vercel), this will be the compiled/bundled version
import type { default as ServerEntry } from '../src/server';

// Dynamic import wrapper to safely load the server module
async function loadServerEntry() {
  try {
    // Try the compiled version first (used in production)
    const compiled = await import('../dist/server/index.js');
    return compiled.default;
  } catch (e) {
    // Fallback to source (shouldn't happen in production, but helps with local dev)
    const source = await import('../src/server');
    return source.default;
  }
}

// Cache the server entry
let cachedServerEntry: any = null;

async function getServerEntry() {
  if (!cachedServerEntry) {
    cachedServerEntry = await loadServerEntry();
  }
  return cachedServerEntry;
}

// Vercel Serverless Functions (Node runtime). Use very lightweight typings
// to avoid requiring @vercel/node types.
export default async function handler(req: any, res: any) {
  try {
    const serverEntry = await getServerEntry();
    
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

    const response: Response = await serverEntry.fetch(request, undefined, undefined);

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
    console.error('Handler error:', error instanceof Error ? error.message : String(error));
    console.error('Full error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
