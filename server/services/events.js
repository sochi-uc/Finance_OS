import { db } from '../db.js';
import { takeSnapshot } from './portfolio.js';

const clients = new Set();

/**
 * Register a Server-Sent Events (SSE) subscriber
 */
export function registerSSEClient(req, rep) {
  rep.hijack();
  rep.raw.writeHead(200, {
    'content-type': 'text/event-stream',
    'cache-control': 'no-cache',
    'connection': 'keep-alive',
  });
  rep.raw.write('retry: 2000\n\n');
  clients.add(rep.raw);

  const heartbeat = setInterval(() => {
    rep.raw.write(': hb\n\n');
  }, 25000);

  req.raw.on('close', () => {
    clearInterval(heartbeat);
    clients.delete(rep.raw);
  });
}

/**
 * Broadcast an event payload to all active SSE subscribers
 */
export function broadcastSSE(payload = Date.now()) {
  const msg = `data: ${payload}\n\n`;
  for (const client of clients) {
    try {
      client.write(msg);
    } catch {
      clients.delete(client);
    }
  }
}

/**
 * Record a state mutation event, update monthly snapshot, and notify clients
 */
export function commitEvent(actor, summary) {
  const now = new Date();
  const ts = now.toISOString();

  db.prepare('insert into events(ts,actor,summary) values(?,?,?)').run(ts, actor, summary);
  takeSnapshot(now);
  broadcastSSE(Date.now());
}
