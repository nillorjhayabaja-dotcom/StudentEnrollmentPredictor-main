import serverEntry from '../src/server';

// Vercel Serverless Functions (Node runtime). Use very lightweight typings
// to avoid requiring @vercel/node types.
export default async function handler(req: any, res: any) {
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
}


