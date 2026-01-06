import { describe, expect, it } from 'vitest';

import type { TestCase } from '@/tests/trpc-helpers';

import { stripDomainFromURL } from './url';

describe('stripDomainFromURL', () => {
  describe('retourne null pour les entrées invalides', () => {
    const testCases: TestCase<any, null>[] = [
      { expectedOutput: null, input: null, label: 'retourne null pour null' },
      { expectedOutput: null, input: '', label: 'retourne null pour une chaîne vide' },
      { expectedOutput: null, input: undefined, label: 'retourne null pour undefined' },
      { expectedOutput: null, input: 'relative-path', label: 'retourne null pour "relative-path" (ne commence pas par /)' },
      { expectedOutput: null, input: 'path/to/resource', label: 'retourne null pour "path/to/resource" (chemin relatif)' },
      { expectedOutput: null, input: 'https://example.com/path', label: 'retourne null pour "https://example.com/path" (URL absolue)' },
      { expectedOutput: null, input: 'http://example.com/path', label: 'retourne null pour "http://example.com/path" (URL absolue)' },
      { expectedOutput: null, input: '//example.com/path', label: 'retourne null pour "//example.com/path" (URL absolue //)' },
      { expectedOutput: null, input: '//subdomain.example.com/resource', label: 'retourne null pour "//subdomain.example.com/resource"' },
    ];

    it.each(testCases)('$label', ({ input, expectedOutput }) => {
      expect(stripDomainFromURL(input)).toBe(expectedOutput);
    });
  });

  describe('conserve les chemins relatifs valides', () => {
    const testCases: TestCase<string, string>[] = [
      { expectedOutput: '/path', input: '/path', label: 'conserve "/path"' },
      { expectedOutput: '/resource', input: '/resource', label: 'conserve "/resource"' },
      { expectedOutput: '/path/to/resource', input: '/path/to/resource', label: 'conserve "/path/to/resource"' },
      { expectedOutput: '/api/v1/users/123', input: '/api/v1/users/123', label: 'conserve "/api/v1/users/123"' },
      { expectedOutput: '/path?param=value', input: '/path?param=value', label: 'conserve "/path?param=value" (query params)' },
      {
        expectedOutput: '/search?q=test&page=2',
        input: '/search?q=test&page=2',
        label: 'conserve "/search?q=test&page=2" (multiple params)',
      },
      { expectedOutput: '/path#section', input: '/path#section', label: 'conserve "/path#section" (hash)' },
      { expectedOutput: '/page#top', input: '/page#top', label: 'conserve "/page#top" (hash)' },
      {
        expectedOutput: '/path?param=value#section',
        input: '/path?param=value#section',
        label: 'conserve "/path?param=value#section" (params + hash)',
      },
      {
        expectedOutput: '/search?q=test&page=2#results',
        input: '/search?q=test&page=2#results',
        label: 'conserve "/search?q=test&page=2#results"',
      },
      { expectedOutput: '/', input: '/', label: 'conserve "/" (racine)' },
      {
        expectedOutput: '/path%20with%20spaces',
        input: '/path with spaces',
        label: 'encode "/path with spaces" en "/path%20with%20spaces"',
      },
      {
        expectedOutput: '/path-with-dashes_and_underscores',
        input: '/path-with-dashes_and_underscores',
        label: 'conserve "/path-with-dashes_and_underscores"',
      },
      {
        expectedOutput: '/path%20with%20spaces',
        input: '/path%20with%20spaces',
        label: 'conserve "/path%20with%20spaces" (déjà encodé)',
      },
      { expectedOutput: '/caf%C3%A9', input: '/caf%C3%A9', label: 'conserve "/caf%C3%A9" (caractères UTF-8 encodés)' },
    ];

    it.each(testCases)('$label', ({ input, expectedOutput }) => {
      expect(stripDomainFromURL(input)).toBe(expectedOutput);
    });
  });

  describe('gère les cas limites', () => {
    const testCases: TestCase<string, string>[] = [
      { expectedOutput: '/path', input: '/./path', label: 'normalise "/./path" en "/path"' },
      { expectedOutput: '/path', input: '/../path', label: 'normalise "/../path" en "/path"' },
      { expectedOutput: '/other', input: '/path/../other', label: 'normalise "/path/../other" en "/other"' },
      { expectedOutput: '/path/to/resource', input: '/path//to///resource', label: 'normalise "/path//to///resource"' },
      { expectedOutput: '/path', input: '/path?', label: 'supprime "?" vide dans "/path?"' },
      { expectedOutput: '/path', input: '/path#', label: 'supprime "#" vide dans "/path#"' },
      { expectedOutput: '/path', input: '/path?#', label: 'supprime "?#" vides dans "/path?#"' },
    ];

    it.each(testCases)('$label', ({ input, expectedOutput }) => {
      expect(stripDomainFromURL(input)).toBe(expectedOutput);
    });
  });
});
