import { z } from 'zod';

import { parentLogger } from '@/server/helpers/logger';
import { fetchJSON } from '@/utils/network';

import type { FranceRenovSpace } from '../constants';

const DIRECTORY_URL =
  'https://api-lannuaire.service-public.gouv.fr/api/explore/v2.1/catalog/datasets/api-lannuaire-administration/exports/json';
const zAddress = z.object({
  code_postal: z.string(),
  latitude: z.string(),
  longitude: z.string(),
  nom_commune: z.string(),
  numero_voie: z.string(),
});
const zContact = z.array(z.object({ valeur: z.string() }));
const zDirectorySpace = z.object({
  adresse: z.string(),
  nom: z.string(),
  site_internet: z.string().nullish(),
  telephone: z.string().nullish(),
});
const directoryCache = globalThis as typeof globalThis & {
  fcuFranceRenovDirectory?: { expiresAt: number; promise: Promise<z.infer<typeof zDirectorySpace>[]> };
};

/**
 * Finds the closest geolocated advice centre; directory failures retain the national fallback.
 */
export const getNearestFranceRenovSpace = async (coordinates: { lat: number; lon: number }): Promise<FranceRenovSpace | null> => {
  try {
    if (!directoryCache.fcuFranceRenovDirectory || directoryCache.fcuFranceRenovDirectory.expiresAt < Date.now()) {
      directoryCache.fcuFranceRenovDirectory = {
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        promise: fetchJSON<unknown>(DIRECTORY_URL, {
          params: { select: 'nom,adresse,telephone,site_internet', where: 'search(pivot,"fr_renov")' },
          signal: AbortSignal.timeout(10000),
        }).then((response) => z.array(zDirectorySpace).parse(response)),
      };
    }
    const spaces = await directoryCache.fcuFranceRenovDirectory.promise;
    const candidates = spaces.flatMap((space) => {
      const addresses = z.array(zAddress).safeParse(JSON.parse(space.adresse));
      if (!addresses.success) {
        return [];
      }
      return addresses.data
        .filter((address) => address.latitude.trim() && address.longitude.trim())
        .map((address) => ({
          address,
          distance: sphericalDistance(coordinates, { lat: Number(address.latitude), lon: Number(address.longitude) }),
          space,
        }))
        .filter((candidate) => Number.isFinite(candidate.distance));
    });
    const closest = candidates.toSorted((first, second) => first.distance - second.distance)[0];
    if (!closest) {
      return null;
    }
    return {
      address: closest.address.numero_voie,
      city: closest.address.nom_commune,
      email: '',
      name: closest.space.nom,
      phone: zContact.parse(JSON.parse(closest.space.telephone || '[]'))[0]?.valeur ?? '',
      secondaryPhone: null,
      website: zContact.parse(JSON.parse(closest.space.site_internet || '[]'))[0]?.valeur ?? null,
      zipcode: closest.address.code_postal,
    };
  } catch {
    directoryCache.fcuFranceRenovDirectory = undefined;
    parentLogger.warn('France Renov directory unavailable');
    return null;
  }
};

/**
 * Angular distance suffices to rank points and remains valid in overseas territories.
 */
const sphericalDistance = (first: { lat: number; lon: number }, second: { lat: number; lon: number }) =>
  Math.sin(((second.lat - first.lat) * Math.PI) / 360) ** 2 +
  Math.cos((first.lat * Math.PI) / 180) *
    Math.cos((second.lat * Math.PI) / 180) *
    Math.sin(((second.lon - first.lon) * Math.PI) / 360) ** 2;
