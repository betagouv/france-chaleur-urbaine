import * as Sentry from '@sentry/nextjs';
import type { Selectable } from 'kysely';

import { demandStatusDefault, normalizeHeatingEnergy, normalizeHeatingType } from '@/modules/demands/constants';
import type { ProEligibilityTestHistoryEntry } from '@/modules/pro-eligibility-tests/types';
import { type Demands, kdb, type ProEligibilityTestsAddresses, sql } from '@/server/db/kysely';

import { getEntityFromEligibilityType } from './eligibility';

/**
 * Requête de base pour les demandes, jointe avec le test d'adresse associé (exposé comme `testAddress`).
 */
export const buildDemandQuery = () => {
  return kdb
    .selectFrom('demands')
    .innerJoin('pro_eligibility_tests_addresses', 'pro_eligibility_tests_addresses.demand_id', 'demands.id')
    .selectAll('demands')
    .select(sql.raw<Selectable<ProEligibilityTestsAddresses>>(`to_jsonb(pro_eligibility_tests_addresses)`).as('testAddress'));
};

/**
 * Récupère une demande par id avec son test d'adresse joint.
 */
export const getDemandById = async (demandId: string) => {
  return buildDemandQuery().where('demands.id', '=', demandId).executeTakeFirst();
};

/**
 * Enrichit une demande pour l'affichage côté gestionnaire :
 * normalisation du chauffage, historique d'éligibilité augmenté, flag `haut_potentiel`.
 */
export const enrichDemandForGestionnaire = <T extends Selectable<Demands>>({
  demand: { legacy_values, ...demand },
  testAddress,
}: {
  demand: T;
  testAddress: Selectable<ProEligibilityTestsAddresses> | null;
}) => {
  const history = testAddress?.eligibility_history as ProEligibilityTestHistoryEntry[] | undefined;
  const augmentedHistory = (history || []).map((entry) => {
    return {
      ...entry,
      eligibility: {
        ...entry.eligibility,
        entity: getEntityFromEligibilityType(entry.eligibility?.type),
      },
    };
  });

  const lastEligibility = augmentedHistory?.[augmentedHistory.length - 1];
  legacy_values['en PDP'] = lastEligibility?.eligibility?.type.includes('dans_pdp') ? 'Oui' : 'Non';
  legacy_values['Prise de contact'] ??= false;
  legacy_values.Status ??= demandStatusDefault;

  const rawHeatingEnergy = legacy_values['Mode de chauffage'];
  if (rawHeatingEnergy) {
    const normalizedHeatingEnergy = normalizeHeatingEnergy(rawHeatingEnergy);
    if (normalizedHeatingEnergy) {
      legacy_values['Mode de chauffage'] = normalizedHeatingEnergy;
    } else {
      Sentry.captureMessage(`Valeur "Mode de chauffage" non reconnue: "${rawHeatingEnergy}"`, {
        extra: { demandId: demand.id, rawValue: rawHeatingEnergy },
        level: 'error',
      });
    }
  }

  const rawHeatingType = legacy_values['Type de chauffage'];
  if (rawHeatingType) {
    const normalizedHeatingType = normalizeHeatingType(rawHeatingType);
    if (normalizedHeatingType) {
      legacy_values['Type de chauffage'] = normalizedHeatingType;
    } else {
      Sentry.captureMessage(`Valeur "Type de chauffage" non reconnue: "${rawHeatingType}"`, {
        extra: { demandId: demand.id, rawValue: rawHeatingType },
        level: 'error',
      });
    }
  }

  const isParis = legacy_values.Gestionnaires?.includes('Paris');
  const distanceThreshold = isParis ? 60 : 100;
  const isHautPotentiel =
    legacy_values['Type de chauffage'] === 'Collectif' &&
    ((legacy_values['Distance au réseau'] || 10000000) < distanceThreshold ||
      (legacy_values.Logement || 0) >= 100 ||
      legacy_values.Structure === 'Tertiaire');

  return {
    haut_potentiel: isHautPotentiel,
    ...legacy_values,
    ...demand,
    testAddress: {
      ...testAddress,
      eligibility: lastEligibility?.eligibility,
      eligibility_history: augmentedHistory,
    },
  };
};

/**
 * Enrichit une demande pour l'affichage côté admin :
 * idem gestionnaire + valeur par défaut sur `Relance à activer`.
 */
export const enrichDemandForAdmin = <T extends Selectable<Demands>>({
  demand,
  testAddress,
}: {
  demand: T;
  testAddress: Selectable<ProEligibilityTestsAddresses> | null;
}) => {
  const enriched = enrichDemandForGestionnaire({ demand, testAddress });
  enriched['Relance à activer'] ??= false;
  return enriched;
};

const simpleHash = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 10000;
};

/**
 * Anonymise un email (mode démo / anonymisation) en gardant un identifiant stable.
 */
export const anonymizeEmail = (email: string | undefined): string => {
  if (!email) return 'anonyme@example.com';
  const hash = simpleHash(email);
  return `utilisateur${hash}@exemple.fr`;
};

/**
 * Anonymise un nom ou prénom en gardant uniquement la première lettre.
 */
export const anonymizeName = (name: string | undefined): string => {
  if (!name) return '***';
  return `${name.charAt(0)}***`;
};

/**
 * Retourne un numéro de téléphone masqué (mode démo / anonymisation).
 */
export const anonymizePhone = (): string => {
  return '06 ** ** ** **';
};
