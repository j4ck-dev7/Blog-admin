import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

// Define __dirname and __filename for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

globalThis.__dirname = __dirname;
globalThis.__filename = __filename;