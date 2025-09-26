import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ path: '.env.local' });
dotenv.config();

/**
 * Parse environment variables with Zod v4 compatible schema
 * Replaces znv functionality with native Zod v4 implementation
 */
function parseEnv<T extends Record<string, z.ZodType>>(
  env: Record<string, string | undefined>,
  schema: T
): { [K in keyof T]: z.infer<T[K]> } {
  const result: Record<string, unknown> = {};

  for (const [key, zodSchema] of Object.entries(schema)) {
    const envValue = env[key];

    try {
      if (envValue === undefined) {
        // Let Zod handle defaults and optional values
        result[key] = zodSchema.parse(undefined);
      } else {
        // Transform string environment values for different types
        let parsedValue: unknown = envValue;

        // Simple heuristic: try to detect boolean and number types by attempting parsing
        // If parsing fails, Zod will provide the appropriate error
        if (envValue === 'true' || envValue === 'false' || envValue === '1' || envValue === '0') {
          try {
            // Try parsing as boolean first
            const boolValue = envValue === 'true' || envValue === '1';
            const testResult = zodSchema.safeParse(boolValue);
            if (testResult.success) {
              parsedValue = boolValue;
            }
          } catch {
            // If boolean parsing fails, keep original string value
          }
        }

        // Try number parsing for numeric strings
        if (typeof parsedValue === 'string' && /^\d+$/.test(parsedValue)) {
          try {
            const numValue = Number(parsedValue);
            const testResult = zodSchema.safeParse(numValue);
            if (testResult.success) {
              parsedValue = numValue;
            }
          } catch {
            // If number parsing fails, keep original string value
          }
        }

        result[key] = zodSchema.parse(parsedValue);
      }
    } catch (error) {
      throw new Error(`Environment variable ${key}: ${error instanceof Error ? error.message : 'Invalid value'}`);
    }
  }

  return result as { [K in keyof T]: z.infer<T[K]> };
}

const serverConfigSchema = {
  AIRTABLE_BASE: z.string(),
  AIRTABLE_KEY_API: z.string(),
  DATABASE_URL: z.string(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  IS_REVIEW_APP: z.boolean().default(false),
  GITHUB_CI: z.boolean().default(false),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  API_ADRESSE_URL: z.string().default('https://api-adresse.data.gouv.fr/'),
  CLOCK_CRONS_ENABLE: z.boolean().default(true),
  CLOCK_JOBS_PROCESSOR_ENABLE: z.boolean().default(true),
  LOG_SQL_QUERIES: z.boolean().default(false),
  DATA_GOUV_FR_API_URL: z.string().default('https://www.data.gouv.fr/api/1'),
  DATA_GOUV_FR_API_KEY: z.string().optional(),
  DATA_GOUV_FR_DATASET_ID: z.string().optional(),
  PIPEDRIVE_BASE_URL: z.string().default('https://api.pipedrive.com/v1'),
  PIPEDRIVE_API_KEY: z.string().optional(),
  USE_DOCKER_GEO_COMMANDS: z.boolean().default(false),
};

export const serverConfig = parseEnv(process.env, serverConfigSchema);

export type ServerConfig = z.infer<z.ZodObject<typeof serverConfigSchema>>;
