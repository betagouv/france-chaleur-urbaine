import type z from 'zod';

/**
 * Parse environment variables with Zod v4 compatible schema
 * Replaces znv functionality with native Zod v4 implementation
 */
export function parseEnv<T extends Record<string, z.ZodType>>(
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
