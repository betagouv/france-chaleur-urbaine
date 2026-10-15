import type { z } from 'zod';

import type { BANAddressFeature } from '@/modules/ban/types';
import type { Context } from '@/modules/config/server/context-builder';
import { serverConfig } from '@/server/config';
import { getEligilityStatus } from '@/server/services/addresseInformation';
import { fetchJSON } from '@/utils/network';

import type { zCcrtDemandId } from '../constants';
import { ensureCcrtDemandAccess } from './ccrt-access';
import { getNetworkEligibilityCoordinates } from './network-eligibility-coordinates';
import { getBatEnrBatimentDetails } from './service';

/**
 * Reads the saved building's heat-network eligibility without ranking or persisting heating solutions.
 */
export const getCcrtHeatNetworkEligibility = async (ctx: Context, input: z.infer<typeof zCcrtDemandId>) => {
  const demand = await ensureCcrtDemandAccess(ctx, input.demandId);
  const [searchResult, building] = await Promise.all([
    fetchJSON<{ features: BANAddressFeature[] }>(`${serverConfig.banApiBaseUrl}search`, { params: { limit: 1, q: demand.address } }),
    demand.batiment_construction_id ? getBatEnrBatimentDetails({ batiment_construction_id: demand.batiment_construction_id }) : undefined,
  ]);
  const address = searchResult.features[0];
  if (!address) {
    return null;
  }
  const coordinates = getNetworkEligibilityCoordinates(
    { lat: address.geometry.coordinates[1], lon: address.geometry.coordinates[0] },
    building
  );
  const eligibility = await getEligilityStatus(coordinates.lat, coordinates.lon);
  return { coordinates, distance: eligibility.distance, isEligible: eligibility.isEligible };
};
