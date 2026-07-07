import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { type DocSearchDocument, extractPlainText } from '../search-extract';

const contentDir = resolve(process.cwd(), 'src/modules/doc/content');
const outFile = resolve(process.cwd(), 'src/modules/doc/search-index.generated.ts');

/**
 * Builds the doc search documents from the MDX content files (Node-only, uses fs).
 * Shared by the CLI command that writes the index and by the freshness test,
 * so the generated index and the check can never disagree.
 */
export function buildDocSearchDocuments(): DocSearchDocument[] {
  return readdirSync(contentDir)
    .filter((file) => file.endsWith('.mdx'))
    .sort()
    .map((file) => {
      const raw = readFileSync(`${contentDir}/${file}`, 'utf8');
      const slug = file.replace(/\.mdx$/, '');
      const title = (raw.match(/^#\s+(.+)$/m)?.[1] ?? slug).trim();
      return { slug, text: extractPlainText(raw), title };
    });
}

/** Regenerates src/modules/doc/search-index.generated.ts. Returns the number of documents written. */
export function writeDocSearchIndex(): number {
  const documents = buildDocSearchDocuments();
  const content = `// Généré par la commande CLI \`pnpm doc:build-search-index\` — ne pas éditer à la main.
// À régénérer après toute modification de src/modules/doc/content/*.mdx.
import type { DocSearchDocument } from './search-extract';

export const docSearchDocuments: DocSearchDocument[] = ${JSON.stringify(documents, null, 2)};
`;
  writeFileSync(outFile, content);
  return documents.length;
}
