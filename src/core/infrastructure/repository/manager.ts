import { faker } from '@faker-js/faker';
import db from 'src/db';
import base from 'src/db/airtable';
import { Demand } from 'src/types/Summary/Demand';

const getUser = (email: string) =>
  db('users').select(['gestionnaire']).where({ email }).first();

const tableNameFcuDemands = 'FCU - Utilisateurs';

export const getGestionnaires = (demand: Demand): string[] | null => {
  if (demand.Ville === 'Paris') {
    return ['VDP'];
  }

  return null;
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
      gestionnaires.includes(isDemoUser ? 'VDP' : user.gestionnaire)
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
  if (!user || record.get('Gestionnaire') !== user.gestionnaire) {
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
