import 'dotenv/config';
import path from 'node:path';

export interface AppConfig {
  readonly port: number;
  readonly host: string;
  readonly geminiApiKey: string | null;
  readonly geminiModel: string;
  readonly dataDir: string;
  readonly uploadsDir: string;
  readonly usersDir: string;
  readonly odooBaseUrl: string;
  readonly odooDb: string;
  readonly odooProdBaseUrl: string;
  readonly odooProdDb: string;
  readonly odooEngineDir: string;
  readonly odooPythonBin: string;
  readonly sessionSecret: string;
}

const rootDir = process.cwd();

export const config: AppConfig = {
  port: Number(process.env.PORT ?? 3300),
  host: process.env.HOST ?? '0.0.0.0',
  geminiApiKey: process.env.GEMINI_API_KEY ?? null,
  geminiModel: process.env.GEMINI_MODEL ?? 'gemini-3.6-flash',
  dataDir: path.resolve(rootDir, 'data', 'meetings'),
  uploadsDir: path.resolve(rootDir, 'data', 'uploads'),
  usersDir: path.resolve(rootDir, 'data', 'users'),
  odooBaseUrl: process.env.ODOO_BASE_URL ?? 'https://skillbon.odoo.com',
  odooDb: process.env.ODOO_DB ?? 'skillbon',
  odooProdBaseUrl: process.env.ODOO_PROD_BASE_URL ?? 'https://bonario-vietnam.odoo.com',
  odooProdDb: process.env.ODOO_PROD_DB ?? 'bonario-vietnam',
  odooEngineDir: process.env.ODOO_ENGINE_DIR ?? path.resolve(rootDir, '..', 'excel-to-odoo-project'),
  odooPythonBin: process.env.ODOO_PYTHON_BIN ?? 'uv',
  sessionSecret: process.env.SESSION_SECRET ?? 'bonario-recap-secret-salt-2026',
} as const;
