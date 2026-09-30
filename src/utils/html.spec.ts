import { describe, expect, it } from 'vitest';

import type { TestCase } from '@/tests/trpc-helpers';

import { escapeHtml } from './html';

describe('escapeHtml', () => {
  const testCases: TestCase<string, string>[] = [
    {
      expectedOutput: '&lt;a href=&quot;https://evil&quot;&gt;cliquez&lt;/a&gt;',
      input: '<a href="https://evil">cliquez</a>',
      label: 'escapes tags and quotes',
    },
    { expectedOutput: 'Bonjour &amp; bienvenue', input: 'Bonjour & bienvenue', label: 'escapes ampersands' },
    { expectedOutput: 'l&#39;adresse', input: "l'adresse", label: 'escapes single quotes' },
    { expectedOutput: 'Texte simple, 12 rue de la Paix', input: 'Texte simple, 12 rue de la Paix', label: 'leaves plain text untouched' },
    { expectedOutput: '', input: '', label: 'empty string' },
  ];

  it.each(testCases)('$label', ({ input, expectedOutput }) => {
    expect(escapeHtml(input)).toStrictEqual(expectedOutput);
  });
});
