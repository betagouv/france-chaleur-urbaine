import { createTable } from '@/server/db/airtable';

import { type KnownAirtableBase, knownAirtableBases } from './bases';

/**
 * Create new table 'FCU - Modifications réseau'
 */
export async function createModificationsReseau(base: KnownAirtableBase) {
  console.info("Creating table 'FCU - Modifications réseau'");
  await createTable(knownAirtableBases[base], 'FCU - Modifications réseau', [
    {
      name: 'idReseau',
      type: 'singleLineText',
    },
    {
      // the API doesn't support types createdTime or formula with CREATED_TIME()...
      name: 'createdAt',
      options: {
        dateFormat: {
          name: 'european',
        },
        timeFormat: {
          format: 'HH:mm',
          name: '24hour',
        },
        timeZone: 'Europe/Paris',
      },
      type: 'dateTime',
    },
    {
      name: 'type',
      options: {
        choices: [{ name: 'collectivite' }, { name: 'exploitant' }],
      },
      type: 'singleSelect',
    },
    {
      name: 'nom',
      type: 'singleLineText',
    },
    {
      name: 'prenom',
      type: 'singleLineText',
    },
    {
      name: 'structure',
      type: 'singleLineText',
    },
    {
      name: 'fonction',
      type: 'singleLineText',
    },
    {
      name: 'email',
      type: 'email',
    },
    {
      name: 'reseauClasse',
      options: {
        color: 'blueBright',
        icon: 'check',
      },
      type: 'checkbox',
    },
    {
      name: 'maitreOuvrage',
      type: 'singleLineText',
    },
    {
      name: 'gestionnaire',
      type: 'singleLineText',
    },
    {
      name: 'siteInternet',
      type: 'url',
    },
    {
      name: 'informationsComplementaires',
      type: 'multilineText',
    },
    {
      name: 'fichiers',
      type: 'multipleAttachments',
    },
  ]);

  console.info('Table created');
}
