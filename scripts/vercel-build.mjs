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
// Route rules are evaluated top-to-bottom.
//
// Goal: keep static asset requests on the client bundle,
// but send all app route requests (/, /login, /dashboard, etc.)
// through the SSR entry.
const config = {
  version: 3,
  routes: [
    {
      // API always hits the SSR handler
      src: '^/api/(.*)$',
      dest: '/api/server.js',
    },
    {
      // Serve common static asset paths directly from the copied client files
      src: '^/(assets|favicon\\.ico|robots\\.txt|manifest\\.json|.*\\.(?:js|css|map|png|jpg|jpeg|gif|svg|webp|woff2?|ttf|eot|ico))$',
      dest: '/$1',
    },
    {
      // Let the SPA index.html exist at / for direct visits.
      // NOTE: For an SSR router app, we ultimately want the SSR handler,
      // so we still route everything to the SSR handler below.
      src: '^/$',
      dest: '/api/server.js',
    },
    {
      // Catch-all: route all remaining non-asset paths to SSR.
      src: '.*',
      dest: '/api/server.js',
    },
  ],
};


fs.writeFileSync(path.join(outputDir, 'config.json'), JSON.stringify(config, null, 2));

console.log('✓ Vercel output prepared (SSR catch-all)');


