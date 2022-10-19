import { faker } from '@faker-js/faker';
import db from 'src/db';
import base from 'src/db/airtable';
import { Demand } from 'src/types/Summary/Demand';
import { gestionnaires } from './gestionnaires.config';

const getUser = (email: string) =>
  db('users').select(['gestionnaire']).where({ email }).first();

const tableNameFcuDemands = 'FCU - Utilisateurs';

export const getAllDemands = async (): Promise<Demand[]> => {
  const records = await base(tableNameFcuDemands)
    .select({ sort: [{ field: 'Date demandes', direction: 'desc' }] })
    .all();
  return records.map(
    (record) => ({ id: record.id, ...record.fields } as Demand)
  );
};

export const getAllDemandsFrom = async (
  dateDiff: number
): Promise<Demand[]> => {
  const records = await base(tableNameFcuDemands)
    .select({
      sort: [{ field: 'Date demandes', direction: 'desc' }],
      filterByFormula: `IS_AFTER({Date demandes}, DATEADD(TODAY(), ${dateDiff}, "days"))`,
    })
    .all();
  return records.map((record) => record.fields as Demand);
};

export const getGestionnaires = (demand: Demand): string[] => {
  let city = demand.Ville;
  if (!city) {
    const address = demand.Adresse.split(' ');
    city = address[address.length - 1];
  }
  return [city].concat(gestionnaires[city] || []);
};

export const getDemands = async (email: string): Promise<Demand[] | null> => {
  const user = await getUser(email);

  if (!user) {
    return null;
  }

  const isDemoUser = user.gestionnaire === 'DEMO';
  const records = await base(tableNameFcuDemands)
    .select({
      sort: [{ field: 'Date demandes', direction: 'desc' }],
    })
    .all();

  const filteredRecords = records.filter((record) => {
    const gestionnaires = record.get('Gestionnaires') as string[];
    return (
      gestionnaires &&
      gestionnaires.includes(isDemoUser ? 'Paris' : user.gestionnaire)
    );
  });
  return isDemoUser
    ? filteredRecords.map(
        (record) =>
          ({
            id: record.id,
            ...record.fields,
            Nom: faker.name.lastName(),
            Prénom: faker.name.firstName(),
            Mail: faker.internet.email(),
            Téléphone: faker.phone.number('0#########'),
          } as Demand)
      )
    : filteredRecords.map(
        (record) => ({ id: record.id, ...record.fields } as Demand)
      );
};

export const getDemand = async (
  email: string,
  demandId: string
): Promise<Demand | null> => {
  const user = await getUser(email);
  const record = await base(tableNameFcuDemands).find(demandId);
  const gestionnaires = record.get('Gestionnaires') as string[];
  if (!user || !gestionnaires.includes(user.gestionnaire)) {
    return null;
  }
  return { id: record.id, ...record.fields } as Demand;
};

export const updateDemand = async (
  email: string,
  demandId: string,
  update: Partial<Demand>
): Promise<Demand | null> => {
  const demand = await getDemand(email, demandId);
  if (!demand) {
    return null;
  }

  const record = await base(tableNameFcuDemands)
    .update([{ id: demandId, fields: update }])
    .then((records) => records[0]);
  return { id: record.id, ...record.fields } as Demand;
};
