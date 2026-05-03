import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('--- ITQAN ERP BOOTSTRAP ---');
console.log('Node Version:', process.version);
console.log('Current Dir:', process.cwd());
console.log('Entry Dir:', __dirname);

try {
  const bundlePath = path.join(__dirname, 'dist-server', 'index.cjs');
  console.log('Loading bundled server logic from:', bundlePath);
  await import(bundlePath);
  console.log('Server module loaded successfully.');
} catch (err) {
  console.error('FATAL: Failed to load server module:', err);
  process.exit(1);
}
