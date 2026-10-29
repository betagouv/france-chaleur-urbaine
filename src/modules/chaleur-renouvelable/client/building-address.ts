import { searchBANAddresses } from '@/modules/ban/client';
import type { BANAddressFeature } from '@/modules/ban/types';
import { normalize } from '@/utils/strings';

/**
 * Resolves a building's recorded address without accepting fuzzy matches or a neighbouring address.
 */
export async function getBuildingAddress(
  buildingAddress: string | null,
  currentAddress: BANAddressFeature
): Promise<BANAddressFeature | undefined> {
  if (!buildingAddress?.trim()) {
    return undefined;
  }
  const normalizedAddress = normalize(buildingAddress);
  const matchesBuildingAddress = (address: BANAddressFeature) =>
    address.properties.type === 'housenumber' &&
    (normalize(address.properties.label) === normalizedAddress ||
      (address.properties.citycode === currentAddress.properties.citycode && normalize(address.properties.name) === normalizedAddress));

  if (matchesBuildingAddress(currentAddress)) {
    return currentAddress;
  }

  const features = await searchBANAddresses({
    onlyAddress: true,
    query: /\b\d{5}\b/.test(buildingAddress)
      ? buildingAddress
      : `${buildingAddress} ${currentAddress.properties.postcode} ${currentAddress.properties.city}`,
  });
  const matches = features.filter(matchesBuildingAddress);
  return matches.length === 1 ? matches[0] : undefined;
}
