import type { User } from 'next-auth';

import type { BatchDemandContactInfo, CreateBatchDemandInput, DemandCompanyType } from '@/modules/demands/constants';
import type { StructureType } from '@/modules/users/constants';
import { kdb, sql } from '@/server/db/kysely';
import { getDetailedEligibilityStatus } from '@/server/services/addresseInformation';
import type { AvailableStructure } from '@/types/AddressData';

import { createDemand } from './creation-user';

type BatchDemandResolvedContact = BatchDemandContactInfo & {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  structure: string;
};

/**
 * users.structure_type (id technique) → valeurs du formulaire demande (structure + type de structure),
 * que formatDataToLegacyAirtable convertit ensuite en label canonique
 * (Copropriété, Maison individuelle, Tertiaire, Bailleur social, Autre).
 */
const structureTypeToDemandContact: Record<StructureType, { structure: NonNullable<AvailableStructure>; companyType?: DemandCompanyType }> =
  {
    alec: { structure: 'Autre' },
    autre: { structure: 'Autre' },
    bailleur_social: { companyType: 'Bailleur social', structure: 'Tertiaire' },
    bureau_etudes: { companyType: "Bureau d'études ou AMO", structure: 'Tertiaire' },
    ccrt: { structure: 'Autre' },
    collectivite: { structure: 'Tertiaire' },
    gestionnaire_parc_tertiaire: { companyType: 'Gestionnaire de parc tertiaire', structure: 'Tertiaire' },
    gestionnaire_reseaux: { structure: 'Autre' },
    mandataire_cee: { companyType: 'Mandataire / délégataire CEE', structure: 'Tertiaire' },
    syndic_copropriete: { companyType: 'Syndic de copropriété', structure: 'Tertiaire' },
  };

const getBatchDemandContactFromUser = async (userId: string): Promise<BatchDemandResolvedContact> => {
  const userContact = await kdb
    .selectFrom('users')
    .select(['email', 'first_name', 'last_name', 'phone', 'structure_name', 'structure_type'])
    .where('id', '=', userId)
    .executeTakeFirstOrThrow();

  const { structure, companyType } = structureTypeToDemandContact[userContact.structure_type ?? 'autre'];

  return {
    company: userContact.structure_name || '',
    companyType: companyType ?? '',
    demandArea: undefined,
    demandCompanyName: '',
    demandCompanyType: '',
    email: userContact.email,
    firstName: userContact.first_name || '',
    lastName: userContact.last_name || '',
    nbLogements: undefined,
    phone: userContact.phone || '',
    structure,
  };
};

/**
 * Create multiple demands from test addresses
 * User info is fetched from the users table, unless an admin provides explicit contact data.
 * @param input - Batch demand creation input with addresses, optional contact data and heating type
 * @param currentUser - Current authenticated user creating the demands
 * @returns Array of objects with addressId and demandId for each created demand
 */
export const createBatchDemands = async (
  input: CreateBatchDemandInput,
  currentUser: Pick<User, 'id' | 'role'>
): Promise<Array<{ addressId: string; demandId: string }>> => {
  const { addresses } = input;
  const demandOwnerUserId = currentUser.role === 'admin' && input.contact ? undefined : currentUser.id;
  const contact = currentUser.role === 'admin' && input.contact ? input.contact : await getBatchDemandContactFromUser(currentUser.id);

  const results = await Promise.all(
    addresses.map(async (addressData) => {
      const testAddress = await kdb
        .selectFrom('pro_eligibility_tests_addresses')
        .select(['ban_address', 'demand_id', sql<GeoJSON.Point>`ST_AsGeoJSON(st_transform(geom, 4326))::json`.as('geom')])
        .where('id', '=', addressData.addressId)
        .executeTakeFirst();

      if (testAddress?.demand_id) {
        return { addressId: addressData.addressId, demandId: testAddress.demand_id };
      }

      const coords = {
        lat: testAddress?.geom?.coordinates[1] as number,
        lon: testAddress?.geom?.coordinates[0] as number,
      };
      const eligibility = await getDetailedEligibilityStatus(coords.lat, coords.lon);

      const result = await createDemand(
        {
          address: testAddress?.ban_address || '',
          city: eligibility.commune.nom || '',
          commentUser: input.commentUser,
          company: contact.company,
          companyType: contact.companyType,
          coords,
          demandArea: contact.demandArea,
          demandCompanyName: contact.demandCompanyName,
          demandCompanyType: contact.demandCompanyType,
          department: eligibility.departement.nom as string,
          eligibility: {
            distance: eligibility.distance,
            inPDP: !!eligibility.pdp?.id_fcu,
            isEligible: eligibility.eligible,
          },
          email: contact.email,
          firstName: contact.firstName,
          heatingEnergy: addressData.heatingEnergy,
          heatingType: addressData.heatingType,
          lastName: contact.lastName,
          nbLogements: contact.nbLogements,
          phone: contact.phone,
          // le libellé BAN se termine par "<code postal> <ville>"
          postcode: testAddress?.ban_address?.match(/\b\d{5}\b/g)?.at(-1) ?? '',
          region: eligibility.region.nom as string,
          structure: contact.structure,
          termOfUse: true,
        },
        { pro_eligibility_tests_addresse_id: addressData.addressId, userId: demandOwnerUserId }
      );
      return { addressId: addressData.addressId, demandId: result.id };
    })
  );
  return results;
};
