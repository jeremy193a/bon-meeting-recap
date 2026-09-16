import 'dotenv/config';
import path from 'node:path';

export interface AppConfig {
  readonly port: number;
  readonly host: string;
  readonly geminiApiKey: string | null;
  readonly geminiModel: string;
  readonly dataDir: string;
  readonly uploadsDir: string;
}

const rootDir = process.cwd();

export const config: AppConfig = {
  port: Number(process.env.PORT ?? 3300),
  host: process.env.HOST ?? '0.0.0.0',
  geminiApiKey: process.env.GEMINI_API_KEY ?? null,
  geminiModel: process.env.GEMINI_MODEL ?? 'gemini-3.6-flash',
  dataDir: path.resolve(rootDir, 'data', 'meetings'),
  uploadsDir: path.resolve(rootDir, 'data', 'uploads'),
} as const;
