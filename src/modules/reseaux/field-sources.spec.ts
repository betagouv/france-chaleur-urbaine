import { describe, expect, it } from 'vitest';

import { type NetworkFieldSource, networkFieldDefinitions, networkFieldSourceDefinitions, networkFieldsBySource } from './field-sources';

describe('network field sources', () => {
  it('gives every column a non-empty label and a known source', () => {
    const invalid = Object.entries(networkFieldDefinitions).filter(
      ([, definition]) => definition.label.trim() === '' || !(definition.source in networkFieldSourceDefinitions)
    );
    expect(invalid).toStrictEqual([]);
  });

  it('keeps the admin-owned fields aligned with what the admin edit dialog writes', () => {
    expect(networkFieldsBySource('admin').sort()).toStrictEqual(
      [
        'geom',
        'geom_update',
        'gestionnaire_fcu',
        'Identifiant reseau',
        'informationsComplementaires',
        'mo_fcu',
        'nom_reseau_fcu',
        'notes',
        'organization_id',
        'ouvert_aux_raccordements',
        'reseaux classes',
        'website_gestionnaire',
      ].sort()
    );
  });

  it('plans a snake-case canonical name for every column with a legacy name', () => {
    // historical columns are dropped by the harmonisation, not renamed
    const legacyWithoutCanonical = Object.entries(networkFieldDefinitions)
      .filter(([column, definition]) => /[A-Z %&-]/.test(column) && definition.source !== 'historique')
      .filter(([, definition]) => !('canonicalName' in definition));
    expect(legacyWithoutCanonical.map(([column]) => column)).toStrictEqual([]);
    const badCanonical = Object.values(networkFieldDefinitions)
      .flatMap((definition) => ('canonicalName' in definition ? [definition.canonicalName] : []))
      .filter((name) => !/^[a-z0-9_]+$/.test(name));
    expect(badCanonical).toStrictEqual([]);
  });

  it('exposes the sources used by the imports', () => {
    const sources: NetworkFieldSource[] = ['fedene', 'sdes', 'arrete_dpe'];
    sources.forEach((source) => expect(networkFieldsBySource(source).length).toBeGreaterThan(0));
  });
});
