import Fastify from 'fastify';
import fstatic from '@fastify/static';
import { config } from './config.js';
import { apiRoutes } from './routes/api.js';
import { takeSnapshot } from './services/portfolio.js';

const app = Fastify({ logger: true });

// Static Asset Delivery
app.register(fstatic, { root: config.webDir });

// REST API & SSE Event Stream
app.register(apiRoutes);

// Initial State Snapshot
takeSnapshot();

// Start Server Listener
try {
  await app.listen({ port: config.port, host: config.host });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
