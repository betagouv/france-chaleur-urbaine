import { createTable } from 'src/db/airtable';
import { KnownAirtableBase, knownAirtableBases } from './bases';

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
      type: 'dateTime',
      options: {
        timeZone: 'Europe/Paris',
        dateFormat: {
          name: 'european',
        },
        timeFormat: {
          format: 'HH:mm',
          name: '24hour',
        },
      },
    },
    {
      name: 'type',
      type: 'singleSelect',
      options: {
        choices: [{ name: 'collectivite' }, { name: 'exploitant' }],
      },
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
      type: 'checkbox',
      options: {
        color: 'blueBright',
        icon: 'check',
      },
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
      name: 'informationsFiche',
      type: 'multilineText',
    },
    {
      name: 'fichiers',
      type: 'multipleAttachments',
    },
  ]);

  console.info('Table created');
}
