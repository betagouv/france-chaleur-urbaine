import { type BusinessRuleId, businessRules } from '@/modules/app/business-rules';

export type DocSearchDocument = { slug: string; title: string; text: string };

/**
 * Turns raw MDX documentation into plain searchable text: strips ESM imports,
 * Mermaid diagrams, inventory components and markdown syntax, and resolves
 * `<Rule id="…" />` to its displayed value so thresholds (e.g. "500 m") stay searchable.
 * Pure (no fs) so it can be shared by the generator, the freshness test and any client code.
 */
export function extractPlainText(rawMdx: string): string {
  return rawMdx
    .replace(/^import\s.*$/gm, '') // ESM import lines
    .replace(/<Mermaid[\s\S]*?\/>/g, ' ') // Mermaid diagram blocks
    .replace(/<(?:EmailsInventory|CronsInventory|DemandStatuses|EventsInventory)\s*\/>/g, ' ') // generated inventories
    .replace(/<Rule\s+id="([^"]+)"\s*\/>/g, (_match, id: string) => businessRules[id as BusinessRuleId]?.display ?? '') // Rule → its value
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // markdown links → text
    .replace(/^\s*-{3,}\s*$/gm, ' ') // horizontal rules / table separators
    .replace(/[#*`>|]/g, ' ') // heading / bold / code / blockquote / table markers
    .replace(/\s+/g, ' ') // collapse whitespace
    .trim();
}
