import { defineConfig } from 'vite';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const METADATA_EXPORTS = join(process.cwd(), 'metadata_exports');

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

export default defineConfig({
  root: '.',
  plugins: [
    {
      name: 'metadata-export-api',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.method !== 'POST' || !req.url?.startsWith('/api/')) {
            next();
            return;
          }
          try {
            const body = await readBody(req);
            const data = body ? JSON.parse(body) : {};
            if (req.url === '/api/session/start') {
              if (!existsSync(METADATA_EXPORTS)) mkdirSync(METADATA_EXPORTS, { recursive: true });
              const sessionId = String(Date.now());
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ sessionId }));
              return;
            }
            if (req.url === '/api/session/append' && data.sessionId != null && data.shot != null) {
              if (!existsSync(METADATA_EXPORTS)) mkdirSync(METADATA_EXPORTS, { recursive: true });
              const path = join(METADATA_EXPORTS, `session_${data.sessionId}.json`);
              let payload = { sessionId: data.sessionId, startedAt: new Date(Number(data.sessionId)).toISOString(), shots: [] };
              if (existsSync(path)) {
                payload = JSON.parse(readFileSync(path, 'utf8'));
              }
              payload.shots.push(data.shot);
              payload.updatedAt = new Date().toISOString();
              writeFileSync(path, JSON.stringify(payload, null, 2), 'utf8');
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: true }));
              return;
            }
            if (req.url === '/api/session/end' && data.sessionId != null) {
              if (!existsSync(METADATA_EXPORTS)) mkdirSync(METADATA_EXPORTS, { recursive: true });
              const path = join(METADATA_EXPORTS, `session_${data.sessionId}.json`);
              const payload = {
                sessionId: data.sessionId,
                startedAt: new Date(Number(data.sessionId)).toISOString(),
                endedAt: new Date().toISOString(),
                shots: Array.isArray(data.shots) ? data.shots : [],
                updatedAt: new Date().toISOString(),
              };
              writeFileSync(path, JSON.stringify(payload, null, 2), 'utf8');
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: true, path: `session_${data.sessionId}.json` }));
              return;
            }
          } catch (e) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: String(e?.message || e) }));
            return;
          }
          next();
        });
      },
    },
  ],
});
