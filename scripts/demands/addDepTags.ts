import * as demandsService from '@/modules/demands/server/demands-service';
import { kdb } from '@/server/db/kysely';

const updateDemands = async () => {
  try {
    const demands = (await kdb.selectFrom('demands').selectAll().execute()).map(({ id, airtable_legacy_values }) => ({
      fields: airtable_legacy_values,
      id,
    }));

    await Promise.all(
      demands
        .filter((demand: any) => demand.fields?.Departement?.includes('Puy-de-Dôme'))
        .map(async (demand) => {
          const gestionnaires = demand.fields.Gestionnaires as [string];
          if (gestionnaires) {
            gestionnaires.push('ADUHME');
            await demandsService.update(demand.id, { Gestionnaires: gestionnaires });
          }
        })
    );
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
};

updateDemands();
