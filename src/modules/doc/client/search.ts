import { docSearchDocuments } from '../search-index.generated';

export type DocSearchResult = { slug: string; title: string; snippet: string };

const MAX_RESULTS = 8;
const SNIPPET_LENGTH = 160;

/** Lowercase + strip accents, so "reseau" matches "réseau". */
const normalize = (value: string) => value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/**
 * Ranks the documentation pages against a query (accent-insensitive, all terms must match).
 * Title matches weigh more than body matches; returns a snippet around the first match.
 */
export function searchDocs(query: string): DocSearchResult[] {
  const rawTerms = query
    .trim()
    .split(/\s+/)
    .filter((term) => term.length >= 2);
  const terms = rawTerms.map(normalize);
  if (terms.length === 0) {
    return [];
  }

  return docSearchDocuments
    .map((doc) => {
      const normalizedTitle = normalize(doc.title);
      const normalizedText = normalize(doc.text);
      const matchesAll = terms.every((term) => normalizedTitle.includes(term) || normalizedText.includes(term));
      if (!matchesAll) {
        return null;
      }
      const score = terms.reduce(
        (total, term) => total + (normalizedTitle.includes(term) ? 3 : 0) + (normalizedText.split(term).length - 1),
        0
      );
      return { doc, score };
    })
    .filter((entry): entry is { doc: (typeof docSearchDocuments)[number]; score: number } => entry !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RESULTS)
    .map(({ doc }) => ({ slug: doc.slug, snippet: makeSnippet(doc.text, rawTerms[0]), title: doc.title }));
}

function makeSnippet(text: string, firstTerm: string): string {
  const index = text.toLowerCase().indexOf(firstTerm.toLowerCase());
  const start = index < 0 ? 0 : Math.max(0, index - 40);
  const slice = text.slice(start, start + SNIPPET_LENGTH).trim();
  return `${start > 0 ? '… ' : ''}${slice}${start + SNIPPET_LENGTH < text.length ? ' …' : ''}`;
}
