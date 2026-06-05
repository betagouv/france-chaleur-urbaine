import { z } from 'zod';

import { clientConfig } from '@/client-config';
import { parseEnv } from '@/utils/env';
import type { ExcludeKeys } from '@/utils/typescript';

const serverConfigSchema = {
  ADEME_CONNECT_BASE_URL: z.string().default('https://ppd-x-ademe-interne-api.de-c1.eu1.cloudhub.io/api/v1'),
  ADEME_CONNECT_CLIENT_ID: z.string().optional(),
  ADEME_CONNECT_CLIENT_SECRET: z.string().optional(),
  ADEME_CONNECT_SOURCE: z.string().default('France Chaleur Urbaine'),
  AIRTABLE_BASE: z.string(),
  AIRTABLE_KEY_API: z.string(),
  APP: z.string().optional(), // injected by Scalingo (e.g. "france-chaleur-urbaine")
  BDNB_API_BASE_URL: z.string().default('https://api.bdnb.io/v1/bdnb/donnees'),
  CLOCK_CRONS_ENABLE: z.boolean().default(true),
  CLOCK_JOBS_PROCESSOR_ENABLE: z.boolean().default(true),
  CONTAINER: z.string().optional(), // injected by Scalingo (e.g. "web-1")
  DATA_GOUV_FR_API_KEY: z.string().optional(),
  DATA_GOUV_FR_API_URL: z.string().default('https://www.data.gouv.fr/api/1'),
  DATA_GOUV_FR_DATASET_ID: z.string().optional(),
  DATABASE_URL: z.string(),
  GITHUB_CI: z.boolean().default(false),
  IS_REVIEW_APP: z.boolean().default(false),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  LOG_SQL_QUERIES: z.boolean().default(false),
  LOG_SQL_QUERIES_PRETTY: z.boolean().default(false),
  MAIL_FROM: z.string().default(`France Chaleur Urbaine <${clientConfig.noReplyEmail}>`),
  MAIL_HOST: z.string(),
  MAIL_PASS: z.string(),
  MAIL_PORT: z.number().default(587),
  MAIL_USER: z.string(),
  MATOMO_TOKEN: z.string(),
  METRICS_AUTH_TOKEN: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
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
