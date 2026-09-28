import { TRPCError } from '@trpc/server';
import type { Logger } from 'winston';
import { z } from 'zod';

import { serverConfig } from '@/server/config';
import { getCommunePotentiel } from '@/server/services/communeAPotentiel';
import { fetchJSON, postFetchJSON } from '@/utils/network';

import type { CreateDemandeCommuneSansReseauInput } from '../constants';

// Destination https://grist.numerique.gouv.fr/o/fcu/pVFRPp4EHbPx/Formulaires (table « Communes sans réseau »)
const gristRecordsURL = 'https://grist.numerique.gouv.fr/api/docs/pVFRPp4EHbPx/tables/Communes_sans_reseau/records';

/** Colonnes Grist écrites par l'application. Les autres (Status, Commentaire, Email 2…) sont gérées à la main dans Grist. */
type GristCommuneSansReseauFields = {
  BesoinsEnChauffageZonesFortPotentiel: number;
  BesoinsEnChauffageZonesPotentiel: number;
  BesoinsEnECSZonesFortPotentiel: number;
  BesoinsEnECSZonesPotentiel: number;
  CodeInsee: string;
  Date_de_creation: number; // colonne Date Grist : secondes unix à minuit UTC
  Departement: string;
  Email: string;
  NbZonesFortPotentiel: number;
  NbZonesPotentiel: number;
  Type: string;
  Ville: string;
};

const zGristCommuneSansReseauRecords = z.object({
  records: z.array(
    z.object({
      fields: z.object({
        Date_de_creation: z.number().nullable(),
      }),
      id: z.number(),
    })
  ),
});

const getGristHeaders = () => {
  if (!serverConfig.GRIST_API_KEY) {
    throw new Error('GRIST_API_KEY is not configured');
  }
  return { Authorization: `Bearer ${serverConfig.GRIST_API_KEY}` };
};

/**
 * Enregistre dans Grist une demande d'accompagnement pour une commune sans réseau.
 * Les potentiels sont recalculés depuis la base, on ne fait pas confiance aux valeurs du navigateur.
 */
export const createDemandeCommuneSansReseau = async (input: CreateDemandeCommuneSansReseauInput, logger: Logger) => {
  if (serverConfig.email.notAllowed.includes(input.email)) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: serverConfig.email.notAllowedMessage });
  }

  const commune = await getCommunePotentiel(input.codeInsee);
  if (!commune) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Commune introuvable' });
  }

  const fields: GristCommuneSansReseauFields = {
    BesoinsEnChauffageZonesFortPotentiel: commune.zonesAFortPotentiel.chauffage,
    BesoinsEnChauffageZonesPotentiel: commune.zonesAPotentiel.chauffage,
    BesoinsEnECSZonesFortPotentiel: commune.zonesAFortPotentiel.ecs,
    BesoinsEnECSZonesPotentiel: commune.zonesAPotentiel.ecs,
    CodeInsee: input.codeInsee,
    Date_de_creation: new Date().setUTCHours(0, 0, 0, 0) / 1000,
    Departement: commune.insee_dep ?? '',
    Email: input.email,
    NbZonesFortPotentiel: commune.zonesAFortPotentiel.nb,
    NbZonesPotentiel: commune.zonesAPotentiel.nb,
    Type: commune.type,
    Ville: commune.nom ?? '',
  };

  if (!serverConfig.GRIST_ALLOW_WRITES) {
    logger.warn('grist writes disabled, skipping commune sans réseau record', { codeInsee: input.codeInsee });
    return;
  }

  const { records } = await postFetchJSON<{ records: { id: number }[] }>(gristRecordsURL, { records: [{ fields }] }, getGristHeaders());
  logger.info('create grist record commune sans réseau', { id: records[0]?.id });
};

/**
 * Nombre de demandes de communes sans réseau par mois (clé `YYYY-MM-01`) créées dans l'intervalle [startDate, endDate[.
 * L'API Grist ne filtre que par égalité, la table reste petite : on lit tout et on filtre ici.
 */
export const countDemandesCommunesSansReseauByMonth = async (startDate: string, endDate: string) => {
  const gristRecords = await fetchJSON(gristRecordsURL, { headers: getGristHeaders() });
  const creationDates = zGristCommuneSansReseauRecords
    .parse(gristRecords)
    .records.flatMap((record) => (record.fields.Date_de_creation === null ? [] : [new Date(record.fields.Date_de_creation * 1000)]));
  return countByMonth(creationDates, startDate, endDate);
};

/** Regroupe des dates par mois (clé `YYYY-MM-01`) en ne gardant que celles dans [startDate, endDate[. */
export const countByMonth = (dates: Date[], startDate: string, endDate: string): Record<string, number> => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return dates
    .filter((date) => date >= start && date < end)
    .reduce<Record<string, number>>((countsByMonth, date) => {
      const month = `${date.toISOString().slice(0, 7)}-01`;
      countsByMonth[month] = (countsByMonth[month] ?? 0) + 1;
      return countsByMonth;
    }, {});
};
