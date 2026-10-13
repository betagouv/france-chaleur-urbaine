import pg from 'pg';
import type { TestProject } from 'vitest/node';

declare module 'vitest' {
  export interface ProvidedContext {
    templateDatabaseUrl: string;
  }
}

/**
 * URL of the database used by the integration worker `poolId` (`VITEST_POOL_ID`, 1..maxWorkers).
 */
export function getWorkerDatabaseUrl(templateDatabaseUrl: string, poolId: number | string): string {
  const url = new URL(templateDatabaseUrl);
  url.pathname = `${url.pathname}_${poolId}`;
  return url.toString();
}

const OBJECT_IN_USE = '55006';

/**
 * Integration test files run in parallel, each worker on its own database: a clone of the migrated
 * test database (the template), recreated on every run. Clones are left in place after the run to
 * inspect the data of a failing test.
 */
export default async function setup(project: TestProject) {
  const templateDatabaseUrl = process.env.DATABASE_URL ?? 'postgres://fcu_test:fcu_test_pass@localhost:5433/fcu_test';
  const templateName = new URL(templateDatabaseUrl).pathname.slice(1);

  // CREATE/DROP DATABASE cannot run while connected to the target or the template
  const maintenanceUrl = new URL(templateDatabaseUrl);
  maintenanceUrl.pathname = '/postgres';
  const client = new pg.Client({ connectionString: maintenanceUrl.toString() });
  await client.connect();
  try {
    for (let poolId = 1; poolId <= project.config.maxWorkers; poolId++) {
      const workerName = new URL(getWorkerDatabaseUrl(templateDatabaseUrl, poolId)).pathname.slice(1);
      await client.query(`DROP DATABASE IF EXISTS ${client.escapeIdentifier(workerName)} WITH (FORCE)`);
      await client.query(`CREATE DATABASE ${client.escapeIdentifier(workerName)} TEMPLATE ${client.escapeIdentifier(templateName)}`);
    }
  } catch (err) {
    if (err instanceof Error && 'code' in err && err.code === OBJECT_IN_USE) {
      const { rows } = await client.query<{ application_name: string }>(
        'SELECT application_name FROM pg_stat_activity WHERE datname = $1',
        [templateName]
      );
      throw new Error(
        `Cannot clone the test database "${templateName}": other sessions are connected to it (${rows.map((row) => row.application_name || 'unknown').join(', ')}). Close them (psql, DB client, MCP…) and rerun.`,
        { cause: err }
      );
    }
    throw err;
  } finally {
    await client.end();
  }

  project.provide('templateDatabaseUrl', templateDatabaseUrl);
}
