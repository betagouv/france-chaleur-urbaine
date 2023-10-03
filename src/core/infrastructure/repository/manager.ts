import { faker } from '@faker-js/faker';
import { User } from 'next-auth';
import base from 'src/db/airtable';
import { Demand } from 'src/types/Summary/Demand';
import { Airtable } from 'src/types/enum/Airtable';
import { USER_ROLE } from 'src/types/enum/UserRole';
import {
  gestionnairesPerCity,
  gestionnairesPerNetwork,
} from './gestionnaires.config';
import db from 'src/db';

export const getAllDemands = async (): Promise<Demand[]> => {
  const records = await base(Airtable.UTILISATEURS)
    .select({ sort: [{ field: 'Date demandes', direction: 'desc' }] })
    .all();
  return records.map(
    (record) => ({ id: record.id, ...record.fields }) as Demand
  );
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
  return records.map(
    (record) => ({ id: record.id, ...record.fields }) as Demand
  );
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
  return records.map(
    (record) => ({ id: record.id, ...record.fields }) as Demand
  );
};

export const getToRelanceDemand = async (
  id: string
): Promise<Demand | undefined> => {
  const records = await base(Airtable.UTILISATEURS)
    .select({
      filterByFormula: `{Relance ID} = "${id}"`,
    })
    .all();
  return records.map(
    (record) => ({ id: record.id, ...record.fields }) as Demand
  )[0];
};
export const getAllStaledDemandsSince = async (
  dateDiff: number
): Promise<Demand[]> => {
  const records = await base(Airtable.UTILISATEURS)
    .select({
      filterByFormula: `AND(
        IS_BEFORE({Notification envoyé}, DATEADD(TODAY(), ${dateDiff}, "days")),
        OR({Status} = "", {Status} = "En attente de prise en charge")
        )`,
    })
    .all();
  return records.map(
    (record) => ({ id: record.id, ...record.fields }) as Demand
  );
};

export const getGestionnaires = async (
  demand: Demand,
  network: string
): Promise<string[]> => {
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

  const apiAccounts = await db('api_accounts').select('name', 'networks');
  apiAccounts.forEach((apiAccount) => {
    if (apiAccount.networks.includes(network)) {
      gestionnaires.push(`${apiAccount.name}_${network}`);
    }
  });

  return [...new Set(gestionnaires)];
};

export const getGestionnairesDemands = async (
  gestionnaires: string[]
): Promise<Demand[]> => {
  const records = await base(Airtable.UTILISATEURS)
    .select({
      sort: [{ field: 'Date demandes', direction: 'desc' }],
    })
    .all();

  return records
    .map((record) => ({ id: record.id, ...record.fields }) as Demand)
    .filter(
      (record) =>
        record.Gestionnaires &&
        record.Gestionnaires.some((gestionnaire) =>
          gestionnaires.includes(gestionnaire)
        )
    );
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
              (gestionnaire) =>
                (user.role === USER_ROLE.DEMO && gestionnaire === 'Paris') ||
                user.gestionnaires.includes(gestionnaire)
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
            Téléphone: faker.phone.number('0#########'),
          }) as Demand
      )
    : filteredRecords.map(
        (record) => ({ id: record.id, ...record.fields }) as Demand
      );
};

const getDemand = async (
  user: User,
  demandId: string
): Promise<Demand | null> => {
  if (
    !user ||
    (user.role !== USER_ROLE.ADMIN && user.role !== USER_ROLE.GESTIONNAIRE)
  ) {
    return null;
  }

  const record = await base(Airtable.UTILISATEURS).find(demandId);
  const gestionnaires = record.get('Gestionnaires') as string[];
  if (
    user.role === USER_ROLE.ADMIN ||
    gestionnaires.some((gestionnaire) =>
      user.gestionnaires.includes(gestionnaire)
    )
  ) {
    return { id: record.id, ...record.fields } as Demand;
  }
  return null;
};

export const updateDemand = async (
  user: User,
  demandId: string,
  update: Partial<Demand>
): Promise<Demand | null> => {
  const demand = await getDemand(user, demandId);
  if (!demand) {
    return null;
  }

  const record = await base(Airtable.UTILISATEURS)
    .update([{ id: demandId, fields: update }])
    .then((records) => records[0]);
  return { id: record.id, ...record.fields } as Demand;
};
