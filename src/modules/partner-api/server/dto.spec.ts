import { describe, expect, it } from 'vitest';

import type { AirtableLegacyRecord } from '@/modules/demands/types';
import type { TestCase } from '@/tests/trpc-helpers';
import { DEMANDE_STATUS } from '@/types/enum/DemandSatus';

import { toDemandeStatut, zDemande } from '../schema';
import { type DemandRow, toDemandDTO } from './dto';

const legacy = {
  Adresse: '12 rue des Lilas',
  'Code Postal': '93200',
  'Date de la demande': '2026-06-01',
  Departement: 'Seine-Saint-Denis',
  'Distance au réseau': 85,
  'en PDP': 'Non',
  'Gestionnaire Logement': 50,
  Latitude: 48.936,
  Logement: 42,
  Longitude: 2.357,
  Mail: 'claire@example.fr',
  'Mode de chauffage': 'Gaz',
  Nom: 'Martin',
  Prénom: 'Claire',
  Region: 'Île-de-France',
  Status: DEMANDE_STATUS.RECONTACTED,
  Structure: 'Copropriété',
  'Surface en m2': 3100,
  'Type de chauffage': 'Collectif',
  Téléphone: '0601020304',
  Ville: 'Saint-Denis',
  Éligibilité: true,
  Établissement: null,
} as unknown as AirtableLegacyRecord;

const baseRow: DemandRow = {
  comment_gestionnaire: 'RDV planifié',
  commune_code: '93066',
  created_at: new Date('2026-06-01T09:12:03Z'),
  departement_code: '93',
  id: '11111111-1111-4111-8111-111111111111',
  legacy_values: legacy,
  network_gestionnaire: 'Coriance',
  network_id: 1234,
  network_maitre_ouvrage: 'Ville de Saint-Denis',
  network_name: 'Réseau de Saint-Denis',
  network_sncu_id: '7501C',
  network_type: 'reseau_de_chaleur',
  region_code: '11',
  updated_at: new Date('2026-06-04T15:20:11Z'),
};

describe('toDemandDTO', () => {
  it('maps a demand row to the full partner DTO', () => {
    expect(toDemandDTO(baseRow)).toEqual({
      batiment: {
        energie_chauffage: 'Gaz',
        etablissement: null,
        nombre_logements: 50,
        surface_m2: 3100,
        type_chauffage: 'Collectif',
        type_structure: 'Copropriété',
      },
      commentaire: 'RDV planifié',
      contact: { email: 'claire@example.fr', nom: 'Martin', prenom: 'Claire', telephone: '0601020304' },
      date_creation: '2026-06-01T00:00:00.000Z',
      date_modification: '2026-06-04T15:20:11.000Z',
      eligibilite: { dans_pdp: false, distance_reseau_m: 85 },
      id: '11111111-1111-4111-8111-111111111111',
      localisation: {
        adresse: '12 rue des Lilas',
        code_postal: '93200',
        commune_code: '93066',
        commune_label: 'Saint-Denis',
        departement_code: '93',
        departement_label: 'Seine-Saint-Denis',
        latitude: 48.936,
        longitude: 2.357,
        region_code: '11',
        region_label: 'Île-de-France',
      },
      reseau: {
        gestionnaire: 'Coriance',
        id_fcu: 1234,
        identifiant_sncu: '7501C',
        maitre_ouvrage: 'Ville de Saint-Denis',
        nom: 'Réseau de Saint-Denis',
        type: 'reseau_de_chaleur',
      },
      statut: DEMANDE_STATUS.RECONTACTED,
    });
  });

  it('produces a payload that conforms to the zDemande contract', () => {
    expect(() => zDemande.parse(toDemandDTO(baseRow))).not.toThrow();
  });

  it('falls back to "Logement" when no gestionnaire correction', () => {
    const dto = toDemandDTO({ ...baseRow, legacy_values: { ...legacy, 'Gestionnaire Logement': undefined } });
    expect(dto.batiment.nombre_logements).toBe(42);
  });

  it('falls back date_creation to created_at when "Date de la demande" is absent', () => {
    const dto = toDemandDTO({ ...baseRow, legacy_values: { ...legacy, 'Date de la demande': '' } });
    expect(dto.date_creation).toBe('2026-06-01T09:12:03.000Z');
  });

  it('defaults an empty/absent status to the initial value', () => {
    expect(toDemandDTO({ ...baseRow, legacy_values: { ...legacy, Status: '' } }).statut).toBe(DEMANDE_STATUS.TO_PROCESS);
  });
});

describe('toDemandeStatut', () => {
  const cases: TestCase<string, DEMANDE_STATUS>[] = [
    { expectedOutput: DEMANDE_STATUS.VOTED, input: DEMANDE_STATUS.VOTED, label: 'libellé connu → renvoyé tel quel' },
    { expectedOutput: DEMANDE_STATUS.TO_PROCESS, input: '', label: 'libellé vide → statut par défaut' },
    { expectedOutput: DEMANDE_STATUS.TO_PROCESS, input: 'valeur inconnue', label: 'libellé inconnu → statut par défaut' },
  ];
  it.each(cases)('$label', ({ input, expectedOutput }) => {
    expect(toDemandeStatut(input)).toBe(expectedOutput);
  });
});
