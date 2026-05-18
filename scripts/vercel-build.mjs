import fs from 'fs';
import path from 'path';

// Create Vercel output structure for "Custom Output" deployments.
// Vercel expects:
// - index.html to exist at /.vercel/output/index.html
// - API function at /.vercel/output/functions/api/server.js (when routing dest is /api/server.js)
const outputDir = '.vercel/output';
const functionsDir = path.join(outputDir, 'functions');
const apiDir = path.join(functionsDir, 'api');

// Create directories
fs.mkdirSync(apiDir, { recursive: true });

// Copy client files to output root so /index.html exists
if (fs.existsSync('dist/client')) {
  fs.cpSync('dist/client', outputDir, { recursive: true });
}

// Copy server entry point and place it exactly where routes.json expects it
const serverIndex = path.join('dist', 'server', 'index.js');
const serverDest = path.join(apiDir, 'server.js');

if (!fs.existsSync(serverIndex)) {
  throw new Error(`Expected server entry at ${serverIndex} but it was not found.`);
}

fs.copyFileSync(serverIndex, serverDest);

// Create config.json for Vercel
const config = {
  version: 3,
  routes: [
    {
      src: '^/api/(.*)$',
      dest: '/api/server.js',
    },
    {
      src: '.*',
      dest: '/index.html',
    },
  ],
};

fs.writeFileSync(path.join(outputDir, 'config.json'), JSON.stringify(config, null, 2));

console.log('✓ Vercel output prepared (fixed layout)');

