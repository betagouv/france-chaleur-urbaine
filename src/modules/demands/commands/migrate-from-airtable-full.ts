// @ts-nocheck
import { sql } from 'kysely';
import type { fieldLabelInformation } from '@/components/EligibilityForm/components/ContactForm';
import { getAddressEligibilityHistoryEntry } from '@/modules/pro-eligibility-tests/server/service';
import type { structureTypes } from '@/modules/users/constants';
import base from '@/server/db/airtable';
import { kdb } from '@/server/db/kysely';
import { getAddressesCoordinates } from '@/server/services/api-adresse';
import { Airtable } from '@/types/enum/Airtable';
import type { Demand } from '@/types/Summary/Demand';
import { processInParallel } from '@/utils/async';
import { isDefined } from '@/utils/core';

/************IMPORTANT NOTE *********************/
/* This is a fully working migration script */
/* It is kept there in case this works, which was quite hard , is needed to migrate legacy values once we know if we should do it */

export type AirtableLegacyRecord = Demand & {
  id: string;
  'ID BNB'?: string;
};
export const demandReferrerChoices = [
  { id: 'article', label: 'Article sur un site internet' },
  { id: 'bouche_oreille', label: 'Bouche à oreille' },
  { id: 'bureau_etude', label: "Bureau d'étude" },
  { id: 'france_renov', label: "Espace France Rénov'" },
  { id: 'flyer', label: 'Flyer' },
  { id: 'moteur_recherche', label: 'Moteur de recherche' },
  { id: 'pub_tele', label: 'Pub télé' },
  { id: 'pub_web', label: 'Pub web' },
  { id: 'services_municipaux', label: 'Services municipaux' },
  { id: 'webinaire', label: 'Webinaire' },
  { id: 'autre', label: 'Autre' },
] as const;

export type DemandReferrer = (typeof demandReferrerChoices)[number];

export const demandStatuses = [
  { id: 'attente_elements_prospect', label: "En attente d'éléments du prospect" },
  { id: 'attente_prise_en_charge', label: 'En attente de prise en charge' },
  { id: 'etude_en_cours', label: 'Étude en cours' },
  { id: 'vote_en_ag', label: 'Voté en AG' },
  { id: 'travaux_en_cours', label: 'Travaux en cours' },
  { id: 'realise', label: 'Réalisé' },
  { id: 'projet_abandonne', label: 'Projet abandonné par le prospect' },
  { id: 'non_realisable', label: 'Non réalisable' },
] as const;

export type DemandStatus = keyof typeof demandStatuses;

export const batimentModesChauffage = [
  { id: 'electricite', label: 'Électricité' },
  { id: 'gaz', label: 'Gaz' },
  { id: 'fioul', label: 'Fioul' },
  { id: 'autre', label: 'Autre' },
] as const;

export type BatimentModeChauffage = (typeof batimentModesChauffage)[number]['id'];

export const batimentTypesChauffage = [
  { id: 'individuel', label: 'Individuel' },
  { id: 'collectif', label: 'Collectif' },
  { id: 'autre', label: 'Autre' },
] as const;

export type BatimentTypeChauffage = (typeof batimentTypesChauffage)[number]['id'];

export const batimentTypes = [
  { id: 'copro', label: 'Copropriété' },
  { id: 'maison', label: 'Maison individuelle' },
  { id: 'batiment', label: 'Bâtiment tertiaire' },
  { id: 'social', label: 'Logement social' },
  { id: 'autre', label: 'Autre' },
] as const;

export type BatimentType = (typeof batimentTypes)[number]['id'];

// Helper functions to transform Airtable values
const parseAirtableDate = (dateString?: string): Date | null => {
  if (!dateString) return null;
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
};

const reverseFormatBatimentModeChauffage = (airtableValue?: string): BatimentModeChauffage => {
  switch (airtableValue) {
    case 'électricité':
    case 'Électricité':
      return 'electricite';
    case 'gaz  ':
    case 'gaz ':
    case 'gaz':
    case 'Gaz':
      return 'gaz';
    case 'Fioul':
      return 'fioul';
    case 'undefined':
    case 'Autre / Je ne sais pas':
      return 'autre';
    default:
      console.warn(`Unknown batiment mode chauffage: "${airtableValue}"`);
      return 'autre' as BatimentModeChauffage;
  }
};

const reverseFormatBatimentTypeChauffage = (airtableValue?: string): BatimentTypeChauffage => {
  switch (airtableValue) {
    case 'individuel':
    case 'Individuel':
      return 'individuel';
    case 'collectif':
    case 'Collectif':
      return 'collectif';
    case 'undefined':
    case 'autre':
      return 'autre';
    default:
      console.warn(`Unknown batiment type chauffage: "${airtableValue}"`);
      return 'autre';
  }
};

const mapReferrerToId = (airtableValue?: string): string | null => {
  if (!airtableValue) return null;

  if (airtableValue === 'Article') {
    return 'article';
  }

  // Normalize apostrophes: ' (typographic) -> ' (straight)
  const normalizedValue = airtableValue.replace(/’/g, "'");

  // Build mapping dynamically from demandReferrerChoices
  const mapping = Object.fromEntries(demandReferrerChoices.map((choice) => [choice.label, choice.id]));

  // Check for exact match first
  if (mapping[normalizedValue]) {
    return mapping[normalizedValue];
  }

  // Check if it starts with "Autre" (for "Autre: details" format)
  if (normalizedValue.match(/^Autre[:\s;-]/i)) {
    return 'autre';
  }

  throw new Error(`Unknown referrer: ${airtableValue}`);
};

const mapStatusToId = (airtableValue?: string): string | null => {
  // Build mapping dynamically from demandStatuses
  const mapping = Object.fromEntries(demandStatuses.map((status) => [status.label, status.id]));
  const normalizedValue = airtableValue?.replace(/’/g, "'") || '';

  if (!normalizedValue) {
    return 'attente_prise_en_charge';
  }

  if (!mapping[normalizedValue]) {
    throw new Error(`Unknown status: ${airtableValue}`);
  }
  return mapping[normalizedValue];
};

const mapCompanyTypeToStructureId = (airtableValue?: string): keyof typeof structureTypes | undefined => {
  if (!airtableValue) return undefined;

  // Normalize apostrophes: ' (typographic) -> ' (straight)
  const normalizedValue = airtableValue.replace(/’/g, "'");

  // Map old demandCompanyTypes to structureTypes IDs
  const companyTypeMapping: Record<(typeof fieldLabelInformation.companyType.inputs)[number]['value'], keyof typeof structureTypes> = {
    'Bailleur social': 'bailleur_social',
    "Bureau d'études ou AMO": 'bureau_etudes',
    'Gestionnaire de parc tertiaire': 'gestionnaire_parc_tertiaire',
    'Mandataire / délégataire CEE': 'mandataire_cee',
    'Syndic de copropriété': 'syndic_copropriete',
  };

  // Check mapping
  if (companyTypeMapping[normalizedValue]) {
    return companyTypeMapping[normalizedValue];
  }

  // Default to autre if no mapping found
  return undefined;
};

const mapStructureTypeToStructureId = (airtableValue?: string): keyof typeof structureTypes | undefined => {
  if (!airtableValue) return undefined;
  // Normalize apostrophes: ' (typographic) -> ' (straight)
  const normalizedValue = airtableValue.replace(/’/g, "'");

  const structureTypeMapping: Record<(typeof fieldLabelInformation.structure.inputs)[number]['value'], keyof typeof structureTypes> = {
    Tertiaire: 'gestionnaire_parc_tertiaire',
  };
  if (structureTypeMapping[normalizedValue]) {
    return structureTypeMapping[normalizedValue];
  }
  return undefined;
};

/**
 * Reverse the Airtable structure formatting logic
 * Extracts original values from Airtable transformed fields
 *
 * Returns:
 * - structure_type: User's structure type (for users table)
 * - structure_name: User's company name (for users table)
 * - batiment_type: Building's specific type (for batiment in demands)
 * - batiment_name: Building's establishment name (for batiment in demands)
 */
const reverseFormatStructure = (
  record: AirtableLegacyRecord
): {
  user_structure_type: keyof typeof structureTypes | undefined;
  user_structure_name: string;
  batiment_type: BatimentType | undefined;
  batiment_name: string;
} => {
  const airtableStructure = record.Structure;
  const airtableEtablissement = record.Établissement;
  const airtableStructureAccompagnante = record['Structure accompagnante']?.[0];
  const airtableNomStructureAccompagnante = record['Nom de la structure accompagnante'] as unknown as string;

  const user_structure_type =
    mapCompanyTypeToStructureId(airtableStructureAccompagnante) || mapStructureTypeToStructureId(airtableStructure);
  const user_structure_name = airtableNomStructureAccompagnante?.trim() ?? '';

  const batiment_name = airtableEtablissement?.trim() ?? '';
  const batiment_type = ['bureau_etudes', 'mandataire_cee'].includes(user_structure_type || '')
    ? airtableStructure === 'Copropriété'
      ? 'copro'
      : airtableStructure === 'Maison individuelle'
        ? 'maison'
        : airtableStructure === 'Tertiaire'
          ? 'batiment'
          : airtableStructure === 'Logement social'
            ? 'social'
            : 'autre'
    : undefined;

  return {
    batiment_name,
    batiment_type,
    user_structure_name,
    user_structure_type,
  };
};

const buildHistory = (record: AirtableLegacyRecord, createdAtDate: Date) => {
  const history: any[] = [];

  // Type: creation
  history.push({
    created_at: createdAtDate.toISOString(),
    type: 'creation',
  });

  // Type: validation
  // Note: "Gestionnaires validés" is a boolean in Airtable, not a date.
  // We approximate the validation date as created_at + 1 day since we don't have the actual date.
  if (record['Gestionnaires validés']) {
    const validatedAtApprox = new Date(createdAtDate);
    validatedAtApprox.setDate(validatedAtApprox.getDate() + 1);
    history.push({
      created_at: validatedAtApprox.toISOString(),
      type: 'validation',
    });
  }

  // Type: contact
  const contactedAt = parseAirtableDate(record['Recontacté par le gestionnaire'] as unknown as string);
  if (contactedAt) {
    history.push({
      created_at: contactedAt.toISOString(),
      type: 'contact',
    });
  }

  // Type: relance (first)
  const relanceDate = parseAirtableDate(record['Relance envoyée']);
  const relanceId = (record as any)['Relance ID'];
  if (relanceDate) {
    history.push({
      created_at: relanceDate.toISOString(),
      metadata: {
        comment: (record as any)['Commentaire relance'] || '',
        id: relanceId,
      },
      type: 'relance',
    });
  }

  // Type: relance (second)
  const secondRelance = (record as any)['Seconde relance envoyée'];
  if (secondRelance === true) {
    history.push({
      created_at: new Date().toISOString(), // We don't have the exact date
      metadata: {
        comment: '',
        id: relanceId,
      },
      type: 'relance',
    });
  }

  return history;
};

const buildUser = (record: AirtableLegacyRecord) => {
  const { user_structure_type, user_structure_name, batiment_type, batiment_name } = reverseFormatStructure(record);
  return {
    email: record.Mail || '',
    first_name: record.Prénom || '',
    last_name: record.Nom || '',
    phone: record.Téléphone || '',
    role:
      record.Structure === 'Maison indeviduelle' || (record.Structure === 'Copropriété' && !record['Structure accompagnante'])
        ? 'particulier'
        : 'professionnel',
    structure_name: user_structure_name,
    structure_type: user_structure_type,
  };
};

const buildBatiment = async (record: AirtableLegacyRecord) => {
  const address = record.Adresse;
  let banAddress = null;
  let banScore = null;
  let banValid = false;
  const geom = null;
  let eligibilityHistory: any[] = [];

  // Calculate BAN data and eligibility if we have coordinates
  if (record.Latitude && record.Longitude) {
    try {
      // Get BAN address (don't pass logger, let it use default)
      const banResults = await getAddressesCoordinates(`"${address}"`);
      if (banResults && banResults.length > 0) {
        const banResult = banResults[0];
        banAddress = banResult.result_label;
        banScore = isDefined(banResult.result_score) ? Math.round(banResult.result_score * 100) : null;
        banValid = banResult.result_status === 'ok';
      }
      // Get eligibility history
      const eligibilityEntry = await getAddressEligibilityHistoryEntry(record.Latitude, record.Longitude);
      eligibilityHistory = [eligibilityEntry];
      // Calculate geom - will be done by PostgreSQL
      // geom format: st_transform(st_point(longitude, latitude, 4326), 2154)
    } catch (error) {
      console.warn(`Failed to get BAN/eligibility data for ${address}:`, error);
    }
  }

  const { batiment_type, batiment_name } = reverseFormatStructure(record);

  return {
    ban_address: banAddress,
    ban_score: banScore,
    ban_valid: banValid,
    batiment_name,
    batiment_type,
    bdnb_id: (record['ID BNB'] && record['ID BNB'] !== 'undefined') || null,
    conso_gaz: record.Conso || null,
    eligibility_history: eligibilityHistory,
    geom: record.Latitude && record.Longitude ? { coordinates: [record.Longitude, record.Latitude], type: 'Point' } : null,
    mode_chauffage: reverseFormatBatimentModeChauffage(record['Mode de chauffage']),
    nb_logements: record.Logement || null,
    source_address: address,
    surface_m2: record['Surface en m2'] || null,
    type: (record.Structure === 'Maison individuelle'
      ? 'maison'
      : record.Structure === 'Copropriété'
        ? 'copropriete'
        : 'tertiaire') as BatimentType,
    type_chauffage: reverseFormatBatimentTypeChauffage(record['Type de chauffage']),
  };
};

export default async (options: { batchSize?: string; dryRun?: boolean }) => {
  const concurrency = parseInt(options.batchSize || '100', 10);
  const dryRun = options.dryRun || false;

  console.log(`Starting migration from Airtable (concurrency: ${concurrency}, dry-run: ${dryRun})...`);

  try {
    // Fetch all records from Airtable
    const records = await base(Airtable.DEMANDES).select().all();
    console.log(`Found ${records.length} records in Airtable`);

    let processed = 0;
    let inserted = 0;
    let updated = 0;
    let errors = 0;

    // Process records in parallel with concurrency control
    await processInParallel(records, concurrency, async (record) => {
      try {
        const airtableId = record.id;
        const fields = record.fields as Demand;

        // Include the id inside the airtable_legacy_values for cleaner encapsulation
        const airtableLegacyValues: AirtableLegacyRecord = {
          ...fields,
          id: airtableId,
        };

        if (dryRun) {
          processed++;
          return;
        }
        // Build new structured data
        const createdAt = parseAirtableDate(fields['Date demandes']) || new Date();

        // Note: "Gestionnaires validés" is a boolean in Airtable, not a date.
        // We approximate the validation date as created_at + 1 day since we don't have the actual date.
        let validatedAt = null;
        if (fields['Gestionnaires validés']) {
          validatedAt = new Date(createdAt);
          validatedAt.setDate(validatedAt.getDate() + 1);
        }

        const contactedAt = parseAirtableDate((fields as any)['Recontacté par le gestionnaire']);

        const commentGestionnaire = fields.Commentaire || '';
        const commentFcu = [fields.Commentaires_internes_FCU || '', (fields as any)['Commentaire FCU'] || ''].filter(Boolean).join('\n');

        const history = buildHistory(fields, createdAt);
        const user = buildUser(fields);
        const batiment = await buildBatiment(fields);

        // Find user_id if exists
        let userId = null;
        if (fields.Mail) {
          const existingUser = await kdb.selectFrom('users').select('id').where('email', '=', fields.Mail).executeTakeFirst();
          userId = existingUser?.id || null;
        }

        const status = mapStatusToId(fields.Status);
        const assignedTo = fields['Affecté à'] || null;
        const assignedToPending = fields['Gestionnaire Affecté à'] || null;

        // Handle referrer - if it contains "Autre", extract the additional info to referrer_other
        const sondageValue = (fields as any).Sondage || null;
        let referrer = null;
        let referrerOther = null;

        if (sondageValue) {
          // Sondage is an array in Airtable
          const sondageArray = Array.isArray(sondageValue) ? sondageValue : [sondageValue];

          // Check if first element is "Autre" with details in second element
          if (sondageArray.length >= 2 && sondageArray[0] === 'Autre') {
            // When array is ["Autre", "details"], store only "autre" in referrer and details in referrer_other
            referrer = JSON.stringify(['autre']);
            referrerOther = sondageArray.slice(1).join(', ');
          } else {
            // Map each value to its ID
            const mappedReferrers: string[] = [];

            for (const value of sondageArray) {
              const mappedId = mapReferrerToId(value);
              // Check if format is "Autre: details" or "Autre - details" (single string)
              const autreSeparatorMatch = value.match(/^Autre[\s:;-]+(.+)$/i);
              if (autreSeparatorMatch && autreSeparatorMatch[1]?.trim()) {
                mappedReferrers.push('autre');
                referrerOther = autreSeparatorMatch[1].trim();
              } else {
                if (mappedId) {
                  mappedReferrers.push(mappedId);
                }
              }
            }

            // Store as array
            referrer = mappedReferrers.length > 0 ? JSON.stringify(mappedReferrers) : null;
          }
        }

        const campaignKeywords = (fields as any)['Campagne keywords'] || null;
        const campaignSource = (fields as any)['Campagne source'] || null;
        const campaignMatomo = (fields as any)['Campagne matomo'] || null;

        // Check if record already exists
        const existing = await kdb
          .selectFrom('demands')
          .selectAll()
          .where(sql`airtable_legacy_values->>'id'`, '=', airtableId)
          .executeTakeFirst();

        const demandData = {
          airtable_legacy_values: airtableLegacyValues as any,
          assigned_to: assignedTo,
          assigned_to_pending: assignedToPending,
          batiment: batiment.geom
            ? JSON.stringify({
                ...batiment,
                geom: undefined, // Will be set via SQL
              })
            : JSON.stringify(batiment),
          campaign_keywords: campaignKeywords,
          campaign_matomo: campaignMatomo,
          campaign_source: campaignSource,
          comment_fcu: commentFcu,
          comment_gestionnaire: commentGestionnaire,
          contacted_at: contactedAt,
          created_at: createdAt,
          gestionnaires: fields.Gestionnaires,
          history: JSON.stringify(history),
          referrer,
          referrer_other: referrerOther,
          status,
          updated_at: new Date(),
          user: JSON.stringify(user),
          user_id: userId,
          validated_at: validatedAt,
        };

        if (existing) {
          // Update existing record
          await kdb.updateTable('demands').set(demandData).where(sql`airtable_legacy_values->>'id'`, '=', airtableId).execute();

          // Update geom if we have coordinates
          if (batiment.geom && fields.Latitude && fields.Longitude) {
            await kdb
              .updateTable('demands')
              .set({
                batiment: sql`jsonb_set(batiment, '{geom}', st_asgeojson(st_transform(st_point(${fields.Longitude}, ${fields.Latitude}, 4326), 2154))::jsonb)`,
              })
              .where(sql`airtable_legacy_values->>'id'`, '=', airtableId)
              .execute();
          }

          updated++;
        } else {
          // Insert new record
          await kdb
            .insertInto('demands')
            .values(demandData as any)
            .execute();

          // Update geom if we have coordinates
          if (batiment.geom && fields.Latitude && fields.Longitude) {
            await kdb
              .updateTable('demands')
              .set({
                batiment: sql`jsonb_set(batiment, '{geom}', st_asgeojson(st_transform(st_point(${fields.Longitude}, ${fields.Latitude}, 4326), 2154))::jsonb)`,
              })
              .where(sql`airtable_legacy_values->>'id'`, '=', airtableId)
              .execute();
          }

          inserted++;
        }

        processed++;

        // Log progress every 100 records
        if (processed % 100 === 0) {
          const progress = Math.round((processed / records.length) * 100);
          console.log(
            `Progress: ${processed}/${records.length} (${progress}%) - Inserted: ${inserted}, Updated: ${updated}, Errors: ${errors}`
          );
        }
      } catch (error) {
        console.error(`Error processing record ${record.id}:`, error);
        errors++;
        processed++;
      }
    });

    console.log('\nMigration completed!');
    console.log(`Total records: ${records.length}`);
    console.log(`Processed: ${processed}`);
    if (!dryRun) {
      console.log(`Inserted: ${inserted}`);
      console.log(`Updated: ${updated}`);
    }
    console.log(`Errors: ${errors}`);
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
};
