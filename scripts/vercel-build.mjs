import fs from 'fs';
import path from 'path';

// Create Vercel output structure
const outputDir = '.vercel/output';
const functionsDir = path.join(outputDir, 'functions');
const staticDir = path.join(outputDir, 'static');

// Create directories
fs.mkdirSync(functionsDir, { recursive: true });
fs.mkdirSync(staticDir, { recursive: true });

// Copy client files to static
if (fs.existsSync('dist/client')) {
  fs.cpSync('dist/client', staticDir, { recursive: true });
}

// Create API route handler
const apiDir = path.join(functionsDir, 'api');
fs.mkdirSync(apiDir, { recursive: true });

// Copy the server entry point
if (fs.existsSync('dist/server')) {
  fs.cpSync('dist/server', path.join(apiDir, 'server'), { recursive: true });
}

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

fs.writeFileSync(
  path.join(outputDir, 'config.json'),
  JSON.stringify(config, null, 2)
);

console.log('✓ Vercel output prepared');
