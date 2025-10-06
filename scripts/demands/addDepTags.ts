import base from '@/server/db/airtable';
import { Airtable } from '@/types/enum/Airtable';

const updateDemands = async () => {
  try {
    const demands = await base(Airtable.DEMANDES).select().all();
    await Promise.all(
      demands
        .filter((demand: any) => demand.get('Departement')?.includes('Puy-de-Dôme'))
        .map(async (demand) => {
          const gestionnaires = demand.get('Gestionnaires') as [string];
          if (gestionnaires) {
            gestionnaires.push('ADUHME');
            await base(Airtable.DEMANDES).update(
              demand.id,
              {
                Gestionnaires: gestionnaires,
              },
              { typecast: true }
            );
          }
        })
    );
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
};

updateDemands();
