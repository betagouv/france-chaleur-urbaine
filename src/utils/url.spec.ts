import { describe, expect, it } from 'vitest';

import { stripDomainFromURL } from './url';

describe('stripDomainFromURL', () => {
  describe('retourne null pour les entrées invalides', () => {
    it('retourne null pour null', () => {
      expect(stripDomainFromURL(null)).toBeNull();
    });

    it('retourne null pour une chaîne vide', () => {
      expect(stripDomainFromURL('')).toBeNull();
    });

    it('retourne null pour undefined', () => {
      expect(stripDomainFromURL(undefined as any)).toBeNull();
    });

    it('retourne null pour un chemin ne commençant pas par /', () => {
      expect(stripDomainFromURL('relative-path')).toBeNull();
      expect(stripDomainFromURL('path/to/resource')).toBeNull();
      expect(stripDomainFromURL('https://example.com/path')).toBeNull();
      expect(stripDomainFromURL('http://example.com/path')).toBeNull();
    });

    it('retourne null pour un chemin commençant par // (URL absolue)', () => {
      expect(stripDomainFromURL('//example.com/path')).toBeNull();
      expect(stripDomainFromURL('//subdomain.example.com/resource')).toBeNull();
    });
  });

  describe('conserve les chemins relatifs valides', () => {
    it('conserve un chemin simple', () => {
      expect(stripDomainFromURL('/path')).toBe('/path');
      expect(stripDomainFromURL('/resource')).toBe('/resource');
    });

    it('conserve un chemin avec plusieurs segments', () => {
      expect(stripDomainFromURL('/path/to/resource')).toBe('/path/to/resource');
      expect(stripDomainFromURL('/api/v1/users/123')).toBe('/api/v1/users/123');
    });

    it('conserve les paramètres de requête', () => {
      expect(stripDomainFromURL('/path?param=value')).toBe('/path?param=value');
      expect(stripDomainFromURL('/search?q=test&page=2')).toBe('/search?q=test&page=2');
    });

    it('conserve les fragments (hash)', () => {
      expect(stripDomainFromURL('/path#section')).toBe('/path#section');
      expect(stripDomainFromURL('/page#top')).toBe('/page#top');
    });

    it('conserve les paramètres de requête et les fragments', () => {
      expect(stripDomainFromURL('/path?param=value#section')).toBe('/path?param=value#section');
      expect(stripDomainFromURL('/search?q=test&page=2#results')).toBe('/search?q=test&page=2#results');
    });

    it('conserve la racine', () => {
      expect(stripDomainFromURL('/')).toBe('/');
    });

    it('conserve les caractères spéciaux dans le chemin', () => {
      expect(stripDomainFromURL('/path with spaces')).toBe('/path%20with%20spaces');
      expect(stripDomainFromURL('/path-with-dashes_and_underscores')).toBe('/path-with-dashes_and_underscores');
    });

    it('normalise les chemins avec des caractères encodés', () => {
      expect(stripDomainFromURL('/path%20with%20spaces')).toBe('/path%20with%20spaces');
      expect(stripDomainFromURL('/caf%C3%A9')).toBe('/caf%C3%A9');
    });
  });

  describe('gère les cas limites', () => {
    it('gère les chemins avec des points', () => {
      expect(stripDomainFromURL('/./path')).toBe('/path');
      expect(stripDomainFromURL('/../path')).toBe('/path');
      expect(stripDomainFromURL('/path/../other')).toBe('/other');
    });

    it('gère les chemins avec plusieurs slashes', () => {
      expect(stripDomainFromURL('/path//to///resource')).toBe('/path/to/resource');
    });

    it('gère les paramètres vides', () => {
      expect(stripDomainFromURL('/path?')).toBe('/path');
      expect(stripDomainFromURL('/path#')).toBe('/path');
      expect(stripDomainFromURL('/path?#')).toBe('/path');
    });
  });
});
