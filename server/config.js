import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const config = {
  port: +(process.env.PORT || 8787),
  host: process.env.HOST || '0.0.0.0',
  token: process.env.API_TOKEN || '',
  rootDir: root,
  dataDir: process.env.DATA_DIR || path.join(root, 'data'),
  docsDir: path.join(root, 'docs'),
  webDir: path.join(root, 'web'),
};
