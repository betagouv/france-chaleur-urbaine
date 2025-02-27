import { faker } from '@faker-js/faker';
import { type User } from 'next-auth';
import { v4 as uuidv4 } from 'uuid';

import db from '@/server/db';
import base from '@/server/db/airtable';
import { sendNewDemands, sendOldDemands, sendRelanceMail } from '@/server/email';
import { logger } from '@/server/helpers/logger';
import { invalidPermissionsError } from '@/server/helpers/server';
import { Airtable } from '@/types/enum/Airtable';
import { type Demand } from '@/types/Summary/Demand';
import { type User as FullUser } from '@/types/User';

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
      filterByFormula: `{Gestionnaires validés} = TRUE()`,
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

  const startTime = Date.now();

  // Build filter formula based on user role and gestionnaires
  let filterFormula = '';
  if (user.role === 'admin') {
    filterFormula = '';
  } else if (user.role === 'demo') {
    filterFormula = `REGEX_MATCH({Gestionnaires}, "(\\A|, )Paris(\\z|, )")`;
  } else if (user.role === 'gestionnaire') {
    const regexPattern = user.gestionnaires.join('|');
    filterFormula = `REGEX_MATCH({Gestionnaires}, "(\\A|, )(${regexPattern})(\\z|, )")`;
  }

  const records = await base(Airtable.UTILISATEURS)
    .select({
      filterByFormula: filterFormula,
      sort: [{ field: 'Date demandes', direction: 'desc' }],
    })
    .all();

  logger.info('airtable.getDemands', {
    recordsCount: records.length,
    tagsCounts: user.gestionnaires.length,
    duration: Date.now() - startTime,
  });

  return user.role === 'demo'
    ? records.map(
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
    : records.map((record) => ({ id: record.id, ...record.fields }) as Demand);
};

const getDemand = async (user: User, demandId: string): Promise<Demand> => {
  const record = await base(Airtable.UTILISATEURS).find(demandId);
  const gestionnaires = record.get('Gestionnaires') as string[];
  if (user.role !== 'admin' && !gestionnaires.some((gestionnaire) => user.gestionnaires?.includes(gestionnaire))) {
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

const groupDemands = (demands: Demand[]): Record<string, Demand[]> => {
  const groupedDemands: Record<string, Demand[]> = {};
  demands
    .filter((demand) => demand.Gestionnaires)
    .forEach((demand) =>
      demand.Gestionnaires.forEach((gestionnaire) => {
        if (groupedDemands[gestionnaire]) {
          groupedDemands[gestionnaire].push(demand);
        } else {
          groupedDemands[gestionnaire] = [demand];
        }
      })
    );
  return groupedDemands;
};

const groupUsers = (users: FullUser[], extraFilter: (user: FullUser) => boolean): Record<string, string[]> => {
  const groupedUsers: Record<string, string[]> = {};
  users
    .filter((user) => user.email.includes('@'))
    .filter(extraFilter)
    .forEach((user) => {
      user.gestionnaires.forEach((gestionnaire) => {
        if (groupedUsers[gestionnaire]) {
          groupedUsers[gestionnaire].push(user.email);
        } else {
          groupedUsers[gestionnaire] = [user.email];
        }
      });
    });
  return groupedUsers;
};

const newDemands = async (users: FullUser[]) => {
  const sent: string[] = [];
  const groupedUsers = groupUsers(users, (user) => user.receive_new_demands);

  const demands = await getAllNewDemands();
  const groupedDemands = groupDemands(demands);

  for (const gestionnaire in groupedDemands) {
    const gestionnaireUsers = groupedUsers[gestionnaire] || [];
    for (let i = 0; i < gestionnaireUsers.length; i++) {
      const email = gestionnaireUsers[i];
      if (!sent.includes(email)) {
        await sendNewDemands(email, groupedDemands[gestionnaire].length);
        sent.push(email);
      }
      if (process.env.NEXT_PUBLIC_MOCK_USER_CREATION !== 'true') {
        await Promise.all(
          groupedDemands[gestionnaire].map((demand) =>
            base(Airtable.UTILISATEURS).update(demand.id, {
              'Notification envoyé': new Date().toDateString(),
            })
          )
        );
      }
    }
  }

  console.log(`${sent.length} email(s) envoyé(s) pour les nouvelles demandes.`);
};

const oldDemands = async (users: FullUser[]) => {
  const sent: string[] = [];
  const groupedUsers = groupUsers(users, (user) => user.receive_old_demands);
  const demands = await getAllStaledDemandsSince(-7);
  const groupedDemands = groupDemands(demands);

  for (const gestionnaire in groupedDemands) {
    const gestionnaireUsers = groupedUsers[gestionnaire] || [];
    for (let i = 0; i < gestionnaireUsers.length; i++) {
      const email = gestionnaireUsers[i];
      if (!sent.includes(email)) {
        await sendOldDemands(email);
        sent.push(email);
      }
    }
  }

  console.log(`${sent.length} email(s) envoyé(s) pour les vieilles demandes.`);
};

export const weeklyOldManagerMail = async () => {
  const users: FullUser[] = await db('users')
    .where('active', true)
    .select('gestionnaires', 'email', 'receive_new_demands', 'receive_old_demands');

  await oldDemands(users);
};

export const dailyNewManagerMail = async () => {
  const users: FullUser[] = await db('users')
    .where('active', true)
    .select('gestionnaires', 'email', 'receive_new_demands', 'receive_old_demands');

  await newDemands(users);
};

export const updateRelanceAnswer = async (id: string, relanced: boolean) => {
  const demand = await getToRelanceDemand(id);
  if (demand) {
    await base(Airtable.UTILISATEURS).update(demand.id, {
      'Recontacté par le gestionnaire': relanced ? 'Oui' : 'Non',
    });
  }
};

export const dailyRelanceMail = async () => {
  const demands = await getAllToRelanceDemands();
  for (let i = 0; i < demands.length; i++) {
    const demand = demands[i];
    const relanced = demand['Relance envoyée'];
    const uuid = uuidv4();
    await base(Airtable.UTILISATEURS).update(demand.id, {
      [relanced ? 'Seconde relance envoyée' : 'Relance envoyée']: new Date().toDateString(),
      'Relance ID': uuid,
    });
    await sendRelanceMail(demand, uuid);
  }
};
