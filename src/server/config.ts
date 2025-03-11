import dotenv from 'dotenv';
import { parseEnv } from 'znv';
import { z } from 'zod';

dotenv.config({ path: '.env.local' });
dotenv.config();

const serverConfigSchema = {
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  IS_REVIEW_APP: z.boolean().default(false),
  GITHUB_CI: z.boolean().default(false),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  API_ADRESSE_URL: z.string().default('https://api-adresse.data.gouv.fr/'),
  CLOCK_CRONS_ENABLE: z.boolean().default(true),
  CLOCK_JOBS_PROCESSOR_ENABLE: z.boolean().default(true),
  LOG_SQL_QUERIES: z.boolean().default(false),
};

export const serverConfig = parseEnv(process.env, serverConfigSchema);

export type ServerConfig = z.infer<z.ZodObject<typeof serverConfigSchema>>;
