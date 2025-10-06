import { AirtableDB } from '@/server/db/airtable';
import { getCommunePotentiel } from '@/server/services/communeAPotentiel';

/**
 * Complète l'onglet airtable FCU - Formulaire communes sans reseau avec le type, nombre de zones, besoins en chauffage et ECS.
 *
 * Pour lancer : `pnpm tsx scripts/airtable/ajout-infos-communes-sans-reseau.ts`
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
              BesoinsEnChauffageZonesFortPotentiel: commune.zonesAFortPotentiel.chauffage,
              BesoinsEnChauffageZonesPotentiel: commune.zonesAPotentiel.chauffage,
              BesoinsEnECSZonesFortPotentiel: commune.zonesAFortPotentiel.ecs,
              BesoinsEnECSZonesPotentiel: commune.zonesAPotentiel.ecs,
              NbZonesFortPotentiel: commune.zonesAFortPotentiel.nb,
              NbZonesPotentiel: commune.zonesAPotentiel.nb,
              Type: commune.type,
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
