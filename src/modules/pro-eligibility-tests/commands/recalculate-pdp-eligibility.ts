#!/usr/bin/env tsx
/**
 * Script de recalcul de l'éligibilité pour toutes les adresses PDP
 *
 * Ce script recalcule l'éligibilité complète pour chaque adresse ayant
 * des entrées PDP dans son historique en appelant getDetailedEligibilityStatus.
 *
 * Plus simple et plus fiable que la correction manuelle des id_fcu.
 *
 * Usage: pnpm tsx src/modules/pro-eligibility-tests/commands/recalculate-pdp-eligibility.ts [--dry-run] [--limit N]
 */

import { sql } from 'kysely';
import { getAddressEligibilityHistoryEntry } from '@/modules/pro-eligibility-tests/server/service';
import { kdb } from '@/server/db/kysely';

const DRY_RUN = process.argv.includes('--dry-run');
const LIMIT_ARG = process.argv.find((arg) => arg.startsWith('--limit='));
const LIMIT = LIMIT_ARG ? parseInt(LIMIT_ARG.split('=')[1], 10) : undefined;

type EligibilityHistoryItem = {
  transition: string;
  eligibility: {
    type: string;
    id_sncu?: string;
    id_fcu?: string;
    nom?: string;
    distance?: number;
    communes?: string[];
    tags?: string[];
    eligible?: boolean;
    taux_enrr?: number;
    contenu_co2_acv?: number;
  };
  calculated_at: string;
};

type AddressToRecalculate = {
  id: string;
  source_address: string;
  lat: number;
  lon: number;
};

async function main() {
  console.log("🔄 Recalcul de l'éligibilité pour les adresses PDP");
  console.log(`Mode: ${DRY_RUN ? '🔍 DRY RUN (aucune modification)' : '✍️  ÉCRITURE'}`);
  if (LIMIT) {
    console.log(`Limite: ${LIMIT} adresses`);
  }
  console.log('');

  // Étape 1: Récupérer toutes les adresses PDP
  console.log('📍 Recherche des adresses PDP...');
  const addresses = await getAddressesWithPDP();
  console.log(`✅ ${addresses.length} adresses trouvées\n`);

  if (addresses.length === 0) {
    console.log('Aucune adresse PDP à recalculer.');
    return;
  }

  // Étape 2: Recalculer l'éligibilité pour chaque adresse
  console.log("🔄 Recalcul de l'éligibilité...\n");

  let processed = 0;
  let succeeded = 0;
  let failed = 0;
  let skipped = 0;

  const addressesToProcess = LIMIT ? addresses.slice(0, LIMIT) : addresses;

  for (const address of addressesToProcess) {
    processed++;
    const progress = `[${processed}/${addressesToProcess.length}]`;

    try {
      const lat = Number(address.lat);
      const lon = Number(address.lon);

      if (!lat || !lon || isNaN(lat) || isNaN(lon)) {
        console.warn(`${progress} ⚠️  Coordonnées invalides pour ${address.source_address}, ignoré`);
        skipped++;
        continue;
      }

      if (DRY_RUN) {
        console.log(`${progress} 🔍 [DRY-RUN] ${address.source_address} (${lat.toFixed(6)}, ${lon.toFixed(6)})`);
        succeeded++;
      } else {
        // Recalculer l'éligibilité en utilisant la même fonction que le reste du code
        const historyEntry = await getAddressEligibilityHistoryEntry(lat, lon);
        const newEligibility = historyEntry.eligibility;

        // Récupérer l'historique actuel
        const current = await kdb
          .selectFrom('pro_eligibility_tests_addresses')
          .select('eligibility_history')
          .where('id', '=', address.id)
          .executeTakeFirst();

        if (!current) {
          console.warn(`${progress} ⚠️  Adresse non trouvée: ${address.id}`);
          skipped++;
          continue;
        }

        const history = (current.eligibility_history as EligibilityHistoryItem[]) || [];

        // Mettre à jour toutes les entrées PDP dans l'historique
        const updatedHistory = history.map((item) => {
          if (item.eligibility?.type === 'dans_pdp_reseau_existant' || item.eligibility?.type === 'dans_pdp_reseau_futur') {
            return {
              ...item,
              calculated_at: new Date().toISOString(),
              eligibility: {
                ...item.eligibility, // Conserver tous les champs originaux
                communes: newEligibility.communes, // Mettre à jour les communes
                contenu_co2_acv: newEligibility.contenu_co2_acv, // Mettre à jour contenu CO2
                distance: newEligibility.distance, // Mettre à jour la distance
                eligible: newEligibility.eligible, // Mettre à jour eligible
                id_fcu: newEligibility.id_fcu, // Mettre à jour id_fcu (le bug principal)
                id_sncu: newEligibility.id_sncu, // Mettre à jour id_sncu
                nom: newEligibility.nom, // Mettre à jour le nom du réseau
                tags: newEligibility.tags, // Mettre à jour les tags
                taux_enrr: newEligibility.taux_enrr, // Mettre à jour taux EnR&R
                type: item.eligibility.type, // Préserver le type original (existant vs futur)
              },
            };
          }
          return item;
        });

        // Mettre à jour la base de données
        await kdb
          .updateTable('pro_eligibility_tests_addresses')
          .set({
            eligibility_history: JSON.stringify(updatedHistory) as any,
          })
          .where('id', '=', address.id)
          .execute();

        console.log(`${progress} ✅ ${address.source_address}`);
        succeeded++;
      }

      // Pause toutes les 10 adresses pour éviter de surcharger l'API
      if (processed % 10 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error(`${progress} ❌ Erreur pour ${address.source_address}:`, error);
      failed++;
    }
  }

  // Résumé
  console.log('\n📊 RÉSUMÉ:');
  console.log(`   - Total traité: ${processed}`);
  console.log(`   - Succès: ${succeeded}`);
  console.log(`   - Erreurs: ${failed}`);
  console.log(`   - Ignorés: ${skipped}`);

  if (LIMIT && addresses.length > LIMIT) {
    console.log(`\n⚠️  Seulement ${LIMIT} adresses sur ${addresses.length} ont été traitées`);
    console.log(`   Relancez sans --limit pour traiter toutes les adresses`);
  }

  if (DRY_RUN) {
    console.log('\n⚠️  Aucune modification effectuée (mode dry-run)');
    console.log('   Relancez sans --dry-run pour appliquer les changements');
  } else {
    console.log('\n✅ Recalcul terminé avec succès!');
  }
}

/**
 * Récupère toutes les adresses ayant des entrées PDP dans leur historique
 */
async function getAddressesWithPDP(): Promise<AddressToRecalculate[]> {
  const result = await sql<AddressToRecalculate>`
    SELECT DISTINCT
      peta.id,
      peta.source_address,
      ST_Y(ST_Transform(peta.geom, 4326)) as lat,
      ST_X(ST_Transform(peta.geom, 4326)) as lon
    FROM pro_eligibility_tests_addresses peta
    WHERE peta.geom IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM jsonb_array_elements(peta.eligibility_history) as history_item
        WHERE history_item->'eligibility'->>'type' IN ('dans_pdp_reseau_existant', 'dans_pdp_reseau_futur')
      )
    ORDER BY peta.id
  `.execute(kdb);

  return result.rows;
}

// Exécution
main()
  .then(() => {
    console.log('\n✨ Script terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur:', error);
    process.exit(1);
  });
