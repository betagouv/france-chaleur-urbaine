import { getCommunePotentiel } from '@core/infrastructure/repository/communeAPotentiel';
import { AirtableDB } from 'src/db/airtable';

/**
 * Complète l'onglet airtable FCU - Formulaire communes sans reseau avec le type, nombre de zones, besoins en chauffage et ECS.
 *
 * Pour lancer : `yarn tsx scripts/airtable/ajout-infos-communes-sans-reseau.ts`
 */
async function main() {
  try {
    await AirtableDB('FCU - Formulaire communes sans reseau')
      .select()
      .eachPage(async (records, fetchNextPage) => {
        await Promise.all(
          records.map(async (record) => {
            const codeInsee = record.get('CodeInsee') as string;

            const commune = await getCommunePotentiel(codeInsee);
            if (!commune) {
              return;
            }
            console.log('maj commune', codeInsee);
            await AirtableDB('FCU - Formulaire communes sans reseau').update(record.id, {
              Type: commune.type,
              NbZonesFortPotentiel: commune.zonesAFortPotentiel.nb,
              BesoinsEnChauffageZonesFortPotentiel: commune.zonesAFortPotentiel.chauffage,
              BesoinsEnECSZonesFortPotentiel: commune.zonesAFortPotentiel.ecs,
              NbZonesPotentiel: commune.zonesAPotentiel.nb,
              BesoinsEnChauffageZonesPotentiel: commune.zonesAPotentiel.chauffage,
              BesoinsEnECSZonesPotentiel: commune.zonesAPotentiel.ecs,
            });
          })
        );

        fetchNextPage();
      });
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
