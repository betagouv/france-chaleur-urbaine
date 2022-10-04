import { getGestionnaires } from '../src/core/infrastructure/repository/manager';
import base from '../src/db/airtable';
import { Demand } from '../src/types/Summary/Demand';

const updateGestionnaire = async () => {
  try {
    const users = await base('FCU - Utilisateurs').select().all();
    await Promise.all(
      users.map((user) => {
        let city = user.get('Ville') as string;
        if (!city) {
          const address = user.get('Adresse').split(' ');
          city = address[address.length - 1];
        }
        const existingGestionnaires = user.get('Gestionnaires') as string[];
        if (existingGestionnaires && existingGestionnaires.includes(city)) {
          return Promise.resolve();
        } else if (existingGestionnaires) {
          existingGestionnaires.push(city);
          return base('FCU - Utilisateurs').update(
            user.getId(),
            {
              Gestionnaires: existingGestionnaires,
            },
            { typecast: true }
          );
        }

        const gestionnaires = getGestionnaires(user.fields as Demand);
        return base('FCU - Utilisateurs').update(
          user.getId(),
          {
            Gestionnaires: gestionnaires,
          },
          { typecast: true }
        );
      })
    );
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
};

updateGestionnaire();
