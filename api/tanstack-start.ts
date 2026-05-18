// Import from the built server entry point
// Use dynamic import with proper error handling for production deployment
let serverEntry: any;

async function getServerEntry() {
  if (!serverEntry) {
    try {
      // Try importing from dist (built output)
      serverEntry = await import('../dist/server/index.js');
    } catch (error) {
      console.error('Failed to import from dist:', error);
      throw new Error(`Cannot load server entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  return serverEntry;
}

// Vercel Serverless Functions (Node runtime). Use very lightweight typings
// to avoid requiring @vercel/node types.
export default async function handler(req: any, res: any) {
  try {
    // Get the server entry
    const entry = await getServerEntry();
    
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

    const response: Response = await (entry as any).fetch(request, undefined, undefined);

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
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
