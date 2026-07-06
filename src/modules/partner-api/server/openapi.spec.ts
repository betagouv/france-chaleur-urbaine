import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { renderOpenApiYaml } from './openapi';

describe('openapi spec generation', () => {
  it('public/openapi-schema.yaml is up to date — run `pnpm cli openapi:generate` if this fails', () => {
    const committed = readFileSync(join(process.cwd(), 'public', 'openapi-schema.yaml'), 'utf8');
    expect(renderOpenApiYaml()).toBe(committed);
  });
});
