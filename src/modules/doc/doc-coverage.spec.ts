import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { businessRules } from '@/modules/app/business-rules';
import { emails } from '@/modules/email/email.config';
import { eventTypes } from '@/modules/events/constants';

import { specificEventGroups } from './client/inventories/event-groups';

// vitest runs from the project root, so the content dir is stable relative to cwd.
const contentDir = resolve(process.cwd(), 'src/modules/doc/content');
const mdxFiles = readdirSync(contentDir).filter((file) => file.endsWith('.mdx'));
const readMdx = (file: string) => readFileSync(`${contentDir}/${file}`, 'utf8');

// Pages that are not narrative: the references inventory lists everything automatically,
// and the glossary defines terms — neither counts as "telling the story" of an object.
const NON_NARRATIVE_PAGES = new Set(['references.mdx', 'glossaire.mdx']);

const narrativeText = mdxFiles
  .filter((file) => !NON_NARRATIVE_PAGES.has(file))
  .map(readMdx)
  .join('\n');
const allMdxText = mdxFiles.map(readMdx).join('\n');

describe('documentation coverage', () => {
  // Every transactional email must be told somewhere in a narrative page (not just listed in the
  // References inventory), so adding an email without documenting its workflow turns the build red.
  const emailKeys = Object.keys(emails);
  // Emails intentionally only present in the References inventory — add a key here with a reason to exempt it.
  const EMAILS_ONLY_IN_REFERENCE: string[] = [];

  it.each(emailKeys)('email "%s" is referenced in a narrative page', (emailKey) => {
    const isCovered = narrativeText.includes(emailKey) || EMAILS_ONLY_IN_REFERENCE.includes(emailKey);
    expect(
      isCovered,
      `L'email "${emailKey}" n'est raconté dans aucune page de parcours. Documente-le ou ajoute-le à EMAILS_ONLY_IN_REFERENCE.`
    ).toBe(true);
  });

  // Every event type must match a named group in the inventory. Otherwise it lands silently in the
  // catch-all "Système" group and looks tidy while being unclassified. New system-level events must
  // be added to EXPECTED_SYSTEM_EVENTS explicitly.
  const EXPECTED_SYSTEM_EVENTS = new Set(['build_tiles', 'sync_metadata_from_airtable', 'sync_geometries_to_airtable']);

  it.each(eventTypes)('event "%s" is classified in a named group (not silently in "Système")', (eventType) => {
    const matchesNamedGroup = specificEventGroups.some((group) => group.match(eventType));
    const isCovered = matchesNamedGroup || EXPECTED_SYSTEM_EVENTS.has(eventType);
    expect(
      isCovered,
      `L'événement "${eventType}" ne correspond à aucun groupe nommé et tomberait dans « Système ». Ajoute un groupe dans event-groups.ts ou inscris-le dans EXPECTED_SYSTEM_EVENTS.`
    ).toBe(true);
  });

  // Every <Rule id="…" /> used in the MDX must reference a real business-rules key. MDX is not
  // type-checked, so this is the only guard against a typo rendering an undefined value.
  it('every <Rule id> in the docs references a valid business rule', () => {
    const usedRuleIds = [...allMdxText.matchAll(/<Rule\s+id="([^"]+)"/g)].map((match) => match[1]);
    const validRuleIds = new Set(Object.keys(businessRules));

    expect(usedRuleIds.length, 'Aucun <Rule /> trouvé dans la documentation.').toBeGreaterThan(0);
    const unknownRuleIds = [...new Set(usedRuleIds)].filter((id) => !validRuleIds.has(id));
    expect(unknownRuleIds, `Des <Rule id> pointent vers des clés inconnues de business-rules.ts : ${unknownRuleIds.join(', ')}`).toEqual(
      []
    );
  });
});
