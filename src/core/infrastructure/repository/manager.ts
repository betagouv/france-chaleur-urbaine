import db from 'src/db';
import base from 'src/db/airtable';
import { Demand } from 'src/types/Summary/Demand';

const getUser = (email: string) =>
  db('users').select(['gestionnaire']).where({ email }).first();

const tableNameFcuDemands = 'FCU - Utilisateurs';

export const getGestionnaire = (demand: Demand): string | null => {
  if (demand.Ville === 'Paris') {
    return 'Paris';
  }

  return null;
};

export const getDemands = async (email: string): Promise<Demand[] | null> => {
  const user = await getUser(email);

  if (!user) {
    return null;
  }

  const records = await base(tableNameFcuDemands)
    .select({
      filterByFormula: `Gestionnaire="${user.gestionnaire}"`,
      sort: [{ field: 'Date demandes', direction: 'desc' }],
    })
    .all();

  return records.map(
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
