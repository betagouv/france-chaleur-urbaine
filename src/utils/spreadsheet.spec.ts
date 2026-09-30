import { describe, expect, it } from 'vitest';

import type { TestCase } from '@/tests/trpc-helpers';

import { escapeSpreadsheetFormula } from './spreadsheet';

describe('escapeSpreadsheetFormula', () => {
  const testCases: TestCase<unknown, unknown>[] = [
    { expectedOutput: '\'=HYPERLINK("https://evil")', input: '=HYPERLINK("https://evil")', label: 'prefixes a formula starting with =' },
    { expectedOutput: "'+1+1", input: '+1+1', label: 'prefixes +' },
    { expectedOutput: "'-1", input: '-1', label: 'prefixes -' },
    { expectedOutput: "'@SUM(A1)", input: '@SUM(A1)', label: 'prefixes @' },
    { expectedOutput: "'\tcmd", input: '\tcmd', label: 'prefixes a leading tab' },
    { expectedOutput: '12 rue de la Paix', input: '12 rue de la Paix', label: 'leaves plain text untouched' },
    { expectedOutput: 42, input: 42, label: 'leaves numbers untouched' },
    { expectedOutput: null, input: null, label: 'leaves null untouched' },
    { expectedOutput: '', input: '', label: 'leaves an empty string untouched' },
  ];

  it.each(testCases)('$label', ({ input, expectedOutput }) => {
    expect(escapeSpreadsheetFormula(input)).toStrictEqual(expectedOutput);
  });
});
