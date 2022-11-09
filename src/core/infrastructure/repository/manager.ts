import { faker } from '@faker-js/faker';
import { User } from 'next-auth';
import base from 'src/db/airtable';
import { USER_ROLE } from 'src/types/enum/UserRole';
import { Demand } from 'src/types/Summary/Demand';
import { gestionnaires } from './gestionnaires.config';

const tableNameFcuDemands = 'FCU - Utilisateurs';

export const getAllDemands = async (): Promise<Demand[]> => {
  const records = await base(tableNameFcuDemands)
    .select({ sort: [{ field: 'Date demandes', direction: 'desc' }] })
    .all();
  return records.map(
    (record) => ({ id: record.id, ...record.fields } as Demand)
  );
};

export const getAllNewDemands = async (): Promise<Demand[]> => {
  const records = await base(tableNameFcuDemands)
    .select({
      filterByFormula: `AND(
        {Gestionnaires validés} = TRUE(),
        {Notification envoyé} = ""
        )`,
    })
    .all();
  return records.map(
    (record) => ({ id: record.id, ...record.fields } as Demand)
  );
};

export const getAllStaledDemandsSince = async (
  dateDiff: number
): Promise<Demand[]> => {
  const records = await base(tableNameFcuDemands)
    .select({
      filterByFormula: `AND(
        IS_BEFORE({Notification envoyé}, DATEADD(TODAY(), ${dateDiff}, "days")),
        OR({Status} = "", {Status} = "En attente de prise en charge")
        )`,
    })
    .all();
  return records.map(
    (record) => ({ id: record.id, ...record.fields } as Demand)
  );
};

export const getGestionnaires = (demand: Demand): string[] => {
  let city = demand.Ville;
  if (!city) {
    const address = demand.Adresse.split(' ');
    city = address[address.length - 1];
  }
  return [city].concat(gestionnaires[city] || []);
};

export const getDemands = async (user: User): Promise<Demand[] | null> => {
  if (!user) {
    return null;
  }

  const isDemoUser = user.gestionnaire === 'DEMO';
  const records = await base(tableNameFcuDemands)
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
  user: User,
  demandId: string
): Promise<Demand | null> => {
  const record = await base(tableNameFcuDemands).find(demandId);
  const gestionnaires = record.get('Gestionnaires') as string[];
  if (
    user &&
    (user.role === USER_ROLE.ADMIN || gestionnaires.includes(user.gestionnaire))
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

  const record = await base(tableNameFcuDemands)
    .update([{ id: demandId, fields: update }])
    .then((records) => records[0]);
  return { id: record.id, ...record.fields } as Demand;
};
