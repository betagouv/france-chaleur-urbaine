import type { User } from 'next-auth';

import type { BatchDemandContactInfo, CreateBatchDemandInput } from '@/modules/demands/constants';
import { kdb, sql } from '@/server/db/kysely';
import { getDetailedEligibilityStatus } from '@/server/services/addresseInformation';

import { createDemand } from './creation-user';

type BatchDemandResolvedContact = BatchDemandContactInfo & {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  structure: string;
};

const getBatchDemandContactFromUser = async (userId: string): Promise<BatchDemandResolvedContact> => {
  const userContact = await kdb
    .selectFrom('users')
    .select(['email', 'first_name', 'last_name', 'phone', 'structure_name', 'structure_type'])
    .where('id', '=', userId)
    .executeTakeFirstOrThrow();

  return {
    company: userContact.structure_name || '',
    companyType: userContact.structure_type || '',
    demandArea: undefined,
    demandCompanyName: '',
    demandCompanyType: '',
    email: userContact.email,
    firstName: userContact.first_name || '',
    lastName: userContact.last_name || '',
    nbLogements: undefined,
    phone: userContact.phone || '',
    structure: userContact.structure_type || '',
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
          postcode: '',
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
