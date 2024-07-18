import { faker } from '@faker-js/faker';
import { User } from 'next-auth';

import { invalidPermissionsError } from '@helpers/server';
import db from 'src/db';
import base from 'src/db/airtable';
import { Airtable } from 'src/types/enum/Airtable';
import { USER_ROLE } from 'src/types/enum/UserRole';
import { Demand } from 'src/types/Summary/Demand';

import { gestionnairesPerCity, gestionnairesPerDepartment, gestionnairesPerNetwork } from './gestionnaires.config';

export const getAllDemands = async (): Promise<Demand[]> => {
  const records = await base(Airtable.UTILISATEURS)
    .select({ sort: [{ field: 'Date demandes', direction: 'desc' }] })
    .all();
  return records.map((record) => ({ id: record.id, ...record.fields }) as Demand);
};

export const getAllNewDemands = async (): Promise<Demand[]> => {
  const records = await base(Airtable.UTILISATEURS)
    .select({
      filterByFormula: `AND(
        {Gestionnaires validés} = TRUE(),
        {Notification envoyé} = ""
        )`,
    })
    .all();
  return records.map((record) => ({ id: record.id, ...record.fields }) as Demand);
};

export const getAllToRelanceDemands = async (): Promise<Demand[]> => {
  const records = await base(Airtable.UTILISATEURS)
    .select({
      filterByFormula: `OR(
        AND(
          IS_BEFORE({Date de la demande}, DATEADD(TODAY(), -1, "months")),
          {Relance à activer} = TRUE(),
          {Recontacté par le gestionnaire} = "",
          {Relance envoyée} = ""
        ),
        AND(
          IS_BEFORE({Date de la demande}, DATEADD(TODAY(), -45, "days")),
          {Recontacté par le gestionnaire} = "",
          {Relance à activer} = TRUE(),
          {Relance envoyée} != "",
          {Seconde relance envoyée} = ""
        )
      )`,
    })
    .all();
  return records.map((record) => ({ id: record.id, ...record.fields }) as Demand);
};

export const getToRelanceDemand = async (id: string): Promise<Demand | undefined> => {
  const records = await base(Airtable.UTILISATEURS)
    .select({
      filterByFormula: `{Relance ID} = "${id}"`,
    })
    .all();
  return records.map((record) => ({ id: record.id, ...record.fields }) as Demand)[0];
};
export const getAllStaledDemandsSince = async (dateDiff: number): Promise<Demand[]> => {
  const records = await base(Airtable.UTILISATEURS)
    .select({
      filterByFormula: `AND(
        IS_BEFORE({Notification envoyé}, DATEADD(TODAY(), ${dateDiff}, "days")),
        OR({Status} = "", {Status} = "En attente de prise en charge")
        )`,
    })
    .all();
  return records.map((record) => ({ id: record.id, ...record.fields }) as Demand);
};

export const getGestionnaires = async (demand: Demand, network: string): Promise<string[]> => {
  let city = demand.Ville;
  if (!city) {
    const address = demand.Adresse.split(' ');
    city = address[address.length - 1];
  }
  let gestionnaires = [city];
  const configPerCity = gestionnairesPerCity[city];
  if (configPerCity) {
    if (!configPerCity.network || configPerCity.network === network) {
      gestionnaires = gestionnaires.concat(configPerCity.gestionnaires);
    }
  }
  const configPerNetwork = gestionnairesPerNetwork[network];
  if (configPerNetwork) {
    gestionnaires = gestionnaires.concat(configPerNetwork);
  }

  const configPerDepartment = gestionnairesPerDepartment[demand.Departement];
  if (configPerDepartment) {
    gestionnaires = gestionnaires.concat(configPerDepartment);
  }

  const apiAccounts = await db('api_accounts').select('name', 'networks');
  apiAccounts.forEach((apiAccount) => {
    if (apiAccount.networks.includes(network)) {
      gestionnaires.push(`${apiAccount.name}_${network}`);
      gestionnaires.push(apiAccount.name);
    }
  });

  return [...new Set(gestionnaires)];
};

export const getGestionnairesDemands = async (gestionnaires: string[]): Promise<Demand[]> => {
  const records = await base(Airtable.UTILISATEURS)
    .select({
      sort: [{ field: 'Date demandes', direction: 'desc' }],
    })
    .all();

  return records
    .map((record) => ({ id: record.id, ...record.fields }) as Demand)
    .filter((record) => record.Gestionnaires && record.Gestionnaires.some((gestionnaire) => gestionnaires.includes(gestionnaire)));
};

export const getDemands = async (user: User): Promise<Demand[]> => {
  if (!user || !user.gestionnaires) {
    return [];
  }

  const records = await base(Airtable.UTILISATEURS)
    .select({
      sort: [{ field: 'Date demandes', direction: 'desc' }],
    })
    .all();

  const filteredRecords =
    user.role === USER_ROLE.ADMIN
      ? records
      : records.filter((record) => {
          const gestionnaires = record.get('Gestionnaires') as string[];
          return (
            gestionnaires &&
            gestionnaires.some(
              (gestionnaire) => (user.role === USER_ROLE.DEMO && gestionnaire === 'Paris') || user.gestionnaires.includes(gestionnaire)
            )
          );
        });
  return user.role === USER_ROLE.DEMO
    ? filteredRecords.map(
        (record) =>
          ({
            id: record.id,
            ...record.fields,
            Nom: faker.person.lastName(),
            Prénom: faker.person.firstName(),
            Mail: faker.internet.email(),
            Téléphone: `0${faker.string.numeric(9)}`,
          }) as Demand
      )
    : filteredRecords.map((record) => ({ id: record.id, ...record.fields }) as Demand);
};

const getDemand = async (user: User, demandId: string): Promise<Demand> => {
  const record = await base(Airtable.UTILISATEURS).find(demandId);
  const gestionnaires = record.get('Gestionnaires') as string[];
  if (user.role !== USER_ROLE.ADMIN && !gestionnaires.some((gestionnaire) => user.gestionnaires.includes(gestionnaire))) {
    throw invalidPermissionsError;
  }
  return { id: record.id, ...record.fields } as Demand;
};

export const updateDemand = async (user: User, demandId: string, update: Partial<Demand>): Promise<Demand | null> => {
  // check permissions
  await getDemand(user, demandId);

  const [record] = await base(Airtable.UTILISATEURS).update([{ id: demandId, fields: update }]);

  // legacy check, may be obsolete as errors seem to be thrown by the Airtable API
  const error = (record as any)?.error;
  if (error) {
    throw new Error(error);
  }
  return { id: record.id, ...record.fields } as Demand;
};
