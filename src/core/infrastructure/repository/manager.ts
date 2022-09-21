import { faker } from '@faker-js/faker';
import db from 'src/db';
import base, { FieldSet, QueryParams } from 'src/db/airtable';
import { Demand } from 'src/types/Summary/Demand';

type UserType = {
  gestionnaire: string;
};

const getUser = (email: string) =>
  db('users').select(['gestionnaire']).where({ email }).first();

const toggleAnonymousValue =
  (isDemoUser?: boolean, user?: UserType) =>
  (value: string, fakeValue: string) => {
    if (isDemoUser) return fakeValue;
    if (user) return value;
    return;
  };

const tableNameFcuDemands = 'FCU - Utilisateurs';

export const getGestionnaire = (demand: Demand): string | null => {
  if (demand.Ville === 'Paris') {
    return 'Paris';
  }

  return null;
};

export const getDemands = async (email?: string): Promise<Demand[] | null> => {
  const user: UserType | undefined = email && (await getUser(email));
  const isDemoUser = user && user.gestionnaire === 'DEMO';
  const queryOptions: QueryParams<FieldSet> = {
    ...(user && {
      filterByFormula: `Gestionnaire="${
        isDemoUser ? 'Paris' : user.gestionnaire
      }"`,
    }),
    sort: [{ field: 'Date demandes', direction: 'desc' }],
  };
  const getComputedValue = toggleAnonymousValue(isDemoUser, user);
  const records = await base(tableNameFcuDemands).select(queryOptions).all();

  return records.map((record) => {
    const {
      Nom: fieldLastname,
      Prénom: fieldFirsname,
      Mail: fieldMail,
      Téléphone: fieldPhone,
      ...fields
    } = record.fields;

    const Nom = getComputedValue(
      fieldLastname as string,
      faker.name.lastName()
    );
    const Prénom = getComputedValue(
      fieldFirsname as string,
      faker.name.firstName()
    );
    const Mail = getComputedValue(fieldMail as string, faker.internet.email());
    const Téléphone = getComputedValue(
      fieldPhone as string,
      faker.phone.number('0#########')
    );

    return { id: record.id, ...fields, Nom, Prénom, Mail, Téléphone } as Demand;
  });
};

export const getDemand = async (
  email: string,
  demandId: string
): Promise<Demand | null> => {
  const user: UserType = await getUser(email);
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
