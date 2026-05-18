import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, '..', 'dist');

// Serve static files first
export default async function handler(req, res) {
  const url = new URL(req.url ?? '/', `http://${req.headers?.host ?? 'localhost'}`);
  const pathname = url.pathname;

  // Try to serve static files
  if (!pathname.startsWith('/api')) {
    const staticPath = path.join(distDir, 'client', pathname === '/' ? 'index.html' : pathname);
    
    if (fs.existsSync(staticPath) && fs.statSync(staticPath).isFile()) {
      const content = fs.readFileSync(staticPath);
      res.setHeader('Content-Type', getContentType(staticPath));
      res.end(content);
      return;
    }

    // Default to index.html for SPA routing
    if (pathname !== '/index.html' && pathname !== '/' && !pathname.includes('.')) {
      const indexPath = path.join(distDir, 'client', 'index.html');
      if (fs.existsSync(indexPath)) {
        const content = fs.readFileSync(indexPath);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(content);
        return;
      }
    }
  }

  // Handle API requests with TanStack Start server
  try {
    const { default: handler } = await import('../dist/server/index.js');
    await handler(req, res);
  } catch (error) {
    console.error('Server error:', error);
    res.statusCode = 500;
    res.end('Internal Server Error');
  }
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const types = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
  };
  return types[ext] || 'application/octet-stream';
}
