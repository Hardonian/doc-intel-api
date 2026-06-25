
/**
 * Cloudflare Workers API for Document Intelligence / RAG
 * Free tier: 100K req/day
 */

import { Router } from 'itty-router';

const router = Router();

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { 'Content-Type': 'application/json' },
  });
}

function error(message, status = 400) {
  return json({ error: message }, status);
}

router.get('/health', () => json({
  status: 'ok', service: 'doc-intel-api', version: '0.1.0',
  timestamp: new Date().toISOString(),
}));

router.post('/api/v1/documents', async (request, env) => {
  const body = await request.json();
  const { filename, file_type } = body;
  if (!filename) return error('filename is required');

  const result = await env.DB.prepare(
    `INSERT INTO documents (filename, file_type, status) VALUES (?, ?, 'processing')`
  ).bind(filename, file_type || 'unknown').run();

  return json({ document_id: result.meta.last_row_id, filename, status: 'processing' });
});

router.get('/api/v1/documents', async (request, env) => {
  const result = await env.DB.prepare(
    'SELECT * FROM documents ORDER BY created_at DESC LIMIT 50'
  ).all();
  return json({ documents: result.results });
});

router.post('/api/v1/query', async (request, env) => {
  const body = await request.json();
  const { query } = body;
  if (!query) return error('query is required');

  const start = Date.now();
  const keywords = query.toLowerCase().split(' ').filter(w => w.length > 3);
  let results = [];

  if (keywords.length > 0) {
    const allChunks = await env.DB.prepare('SELECT id, document_id, content FROM chunks').all();
    results = allChunks.results
      .map(c => ({ ...c, score: keywords.filter(k => c.content.toLowerCase().includes(k)).length }))
      .filter(c => c.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }

  return json({ query, results, latency_ms: Date.now() - start, model: 'local' });
});

router.get('/api/v1/stats', async (request, env) => {
  const docs = await env.DB.prepare('SELECT COUNT(*) as count FROM documents').first();
  const chunks = await env.DB.prepare('SELECT COUNT(*) as count FROM chunks').first();
  const queries = await env.DB.prepare('SELECT COUNT(*) as count FROM queries').first();
  return json({ documents: docs.count, chunks: chunks.count, queries: queries.count });
});

router.post('/api/v1/webhook/github', async (request, env) => {
  const event = request.headers.get('x-github-event');
  const payload = await request.json();
  if (event === 'push') return json({ status: 'received', repo: payload.repository?.full_name });
  return json({ status: 'ignored', event });
});

async function handleCron(event, env) {
  const pending = await env.DB.prepare("SELECT * FROM documents WHERE status = 'pending'").all();
  for (const doc of pending.results) {
    await env.DB.prepare("UPDATE documents SET status = 'completed' WHERE id = ?").bind(doc.id).run();
  }
  return json({ processed: pending.results.length });
}

router.all('*', () => error('Not found', 404));

export default {
  async fetch(request, env, ctx) { return router.fetch(request, env, ctx); },
  async scheduled(event, env, ctx) { ctx.waitUntil(handleCron(event, env)); },
};
