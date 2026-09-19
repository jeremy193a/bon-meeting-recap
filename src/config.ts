import 'dotenv/config';
import path from 'node:path';

export interface AppConfig {
  readonly port: number;
  readonly host: string;
  readonly geminiApiKey: string | null;
  readonly geminiModel: string;
  readonly agyCommand: string;
  readonly agyModel: string;
  readonly agyFallbackModel: string;
  readonly agyTimeoutMs: number;
  readonly agyMaxAttempts: number;
  readonly agyBridgeUrl: string | null;
  readonly agyBridgeToken: string | null;
  readonly agyHostDataDir: string | null;
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
  geminiApiKey: process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY ?? process.env.GEMINI_KEY ?? null,
  geminiModel: process.env.GEMINI_MODEL ?? 'gemini-3.6-flash',
  agyCommand: process.env.AGY_COMMAND ?? 'agy',
  agyModel: process.env.AGY_MODEL ?? 'gemini-3.8-flash-low',
  agyFallbackModel: process.env.AGY_FALLBACK_MODEL ?? 'gemini-3.8-flash-medium',
  agyTimeoutMs: Number(process.env.AGY_TIMEOUT_MS ?? 600_000),
  agyMaxAttempts: Number(process.env.AGY_MAX_ATTEMPTS ?? 2),
  agyBridgeUrl: process.env.AGY_BRIDGE_URL ?? null,
  agyBridgeToken: process.env.AGY_BRIDGE_TOKEN ?? null,
  agyHostDataDir: process.env.AGY_HOST_DATA_DIR ?? null,
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
