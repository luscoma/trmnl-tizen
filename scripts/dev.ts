import { spawn } from 'bun';

const apiKey = Bun.env.API_KEY ?? '';

spawn(
  ['bun', 'build', 'src/app.tsx',
   '--outdir', 'viewer/js',
   '--entry-naming', 'bundle.[ext]',
   '--format', 'iife',
   '--target', 'browser',
   '--define', 'CONFIG_SIMULATE_TIZEN=true',
   '--define', `CONFIG_API_KEY=${JSON.stringify(apiKey)}`,
   '--watch'],
  { stdout: 'inherit', stderr: 'inherit' },
);

const port = parseInt(Bun.env.PORT ?? '3000');

const server = Bun.serve({
  port,
  async fetch(req) {
    const url  = new URL(req.url);
    const path = url.pathname === '/' ? '/index.html' : url.pathname;
    const file = Bun.file(`./viewer${path}`);
    if (await file.exists()) return new Response(file);
    return new Response('Not found', { status: 404 });
  },
});

console.log(`Dev server running at http://localhost:${server.port}`);
