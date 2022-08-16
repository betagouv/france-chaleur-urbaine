import { getGestionnaire } from '@core/infrastructure/repository/manager';
import base from 'src/db/airtable';

const updateGestionnaire = async () => {
  try {
    const users = await base('FCU - Utilisateurs').select().all();
    await Promise.all(
      users
        .filter((user) => !user.get('Gestionnaire'))
        .filter((user) => user.get('Adresse')?.toString().includes('Paris'))
        .map((user) => {
          const gestionnaire = getGestionnaire(user.get('Adresse') as string);
          if (gestionnaire) {
            return base('FCU - Utilisateurs').update(user.getId(), {
              Gestionnaire: gestionnaire,
            });
          } else {
            return Promise.resolve();
          }
        })
    );
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
};

updateGestionnaire();
