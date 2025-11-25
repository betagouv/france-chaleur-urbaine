import dotenv from 'dotenv';
import { z } from 'zod';
import type { clientConfig as ClientConfigType } from '@/client-config';
import { parseEnv } from '@/utils/env';
import type { ExcludeKeys } from '@/utils/typescript';

// IMPORTANT: Load .env files BEFORE requiring clientConfig
// Using require() instead of import to avoid hoisting issues
// Else process.env is not available in clientConfig
dotenv.config({ path: '.env.local' });
dotenv.config();

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { clientConfig } = require('@/client-config') as { clientConfig: typeof ClientConfigType };

const serverConfigSchema = {
  AIRTABLE_BASE: z.string(),
  AIRTABLE_KEY_API: z.string(),
  API_ADRESSE_URL: z.string().default('https://api-adresse.data.gouv.fr/'),
  CLOCK_CRONS_ENABLE: z.boolean().default(true),
  CLOCK_JOBS_PROCESSOR_ENABLE: z.boolean().default(true),
  DATA_GOUV_FR_API_KEY: z.string().optional(),
  DATA_GOUV_FR_API_URL: z.string().default('https://www.data.gouv.fr/api/1'),
  DATA_GOUV_FR_DATASET_ID: z.string().optional(),
  DATABASE_URL: z.string(),
  GITHUB_CI: z.boolean().default(false),
  IS_REVIEW_APP: z.boolean().default(false),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  LOG_SQL_QUERIES: z.boolean().default(false),
  MAIL_FROM: z.string().default('France Chaleur Urbaine <france-chaleur-urbaine@applications.developpement-durable.gouv.fr>'),
  MAIL_HOST: z.string(),
  MAIL_PASS: z.string(),
  MAIL_PORT: z.number().default(587),
  MAIL_REPLYTO: z.string().default('France Chaleur Urbaine <france-chaleur-urbaine@developpement-durable.gouv.fr>'),
  MAIL_USER: z.string(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PIPEDRIVE_API_KEY: z.string().optional(),
  PIPEDRIVE_BASE_URL: z.string().default('https://api.pipedrive.com/v1'),
  PRINT_TIPPECANOE_OUTPUT_TO_LOGS: z.boolean().default(false),
  USE_DOCKER_GEO_COMMANDS: z.boolean().default(false),
};

const onlyServerConfig = {
  email: {
    notAllowed: ['sample@tst.com', 'sample@email.tst'], // Liste des emails interdits pour les formulaires publics (spam/test)
    notAllowedMessage: 'Une erreur est survenue lors de la validation de votre demande', // Message d'erreur vague pour ne pas aider les spammeurs
  },
} satisfies ExcludeKeys<typeof clientConfig, any>;

export const serverConfig = {
  ...parseEnv(process.env, serverConfigSchema),
  ...clientConfig,
  ...onlyServerConfig,
};

export type ServerConfig = z.infer<z.ZodObject<typeof serverConfigSchema>>;
