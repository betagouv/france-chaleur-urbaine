import base from '../src/db/airtable';

export const updateUsers = async () => {
  const gestionnaires = await base('FCU - Tags gestionnaires').select().all();
  for (let i = 0; i < gestionnaires.length; i++) {
    const gestionnaire = gestionnaires[i];
    const tag = gestionnaire.get('Nom tag');
    if (!tag) {
      continue;
    }
    for (let j = 1; j < 10; j++) {
      const email = gestionnaire.get(`Email ${j}`) as string;
      if (email) {
        await base('FCU - Gestionnaires').create(
          {
            Email: email.trim(),
            Gestionnaire: tag,
            'Nouvelle demande':
              gestionnaire.get('Email C (nouvelle demande)') === true,
            Relance: gestionnaire.get('Email D (relance)') === true,
          },
          { typecast: true }
        );
      }
    }
  }
};

updateUsers();
