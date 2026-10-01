import { distance } from '@turf/distance';
import { point } from '@turf/helpers';
import { z } from 'zod';

import { kdb, sql } from '@/server/db/kysely';
import { fetchJSON } from '@/utils/network';

const RNIC_RESOURCE_DATA_URL = 'https://tabular-api.data.gouv.fr/api/resources/3ea8e2c3-0038-464a-b17e-cd5c91f65ce2/data/';
const RNIC_RESULT_COLUMNS = [
  'numero_immatriculation',
  'nom_usage_copropriete',
  'siret_representant_legal',
  'longitude',
  'latitude',
] as const;
const RNIC_COORDINATE_LOOKUP_RADIUS_METERS = 120;

const zRnicRow = z.object({
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  nom_usage_copropriete: z.string().nullable().optional(),
  numero_immatriculation: z.string().nullable().optional(),
  siret_representant_legal: z.string().nullable().optional(),
});

const zRnicDataResponse = z.object({
  data: z.array(zRnicRow),
});

type RnicRow = z.infer<typeof zRnicRow>;

type Coordinates = {
  lat: number;
  lon: number;
};

type RnicCandidate = {
  distanceMeters: number;
  nomCopropriete: string;
  row: RnicRow;
};

export type RnicCopropriete = {
  nomCopropriete: string;
  numeroImmatriculation: string | null;
  siretRepresentantLegal: string | null;
};

/**
 * Finds the closest RNIC co-ownership record from the selected BatEnR building coordinates.
 * RNIC does not expose BDNB/BatEnR construction identifiers.
 */
export async function getRnicCoproprieteByBatimentConstructionId(
  batimentConstructionId: string | null | undefined
): Promise<RnicCopropriete | null> {
  if (!batimentConstructionId) {
    return null;
  }

  const coordinates = await getBatimentCoordinates(batimentConstructionId);

  if (!coordinates) {
    return null;
  }

  return getBestRnicMatch(await searchRnicRowsByCoordinates(coordinates), coordinates);
}

const getBatimentCoordinates = async (batimentConstructionId: string): Promise<Coordinates | null> => {
  const batiment = await kdb
    .selectFrom('bdnb_batenr')
    .select((eb) => [
      sql<number | null>`
        CASE
          WHEN ${eb.ref('bdnb_batenr.geom')} IS NULL OR ST_IsEmpty(${eb.ref('bdnb_batenr.geom')})
            THEN NULL
          ELSE ST_X(ST_Transform(ST_PointOnSurface(${eb.ref('bdnb_batenr.geom')}), 4326))
        END
      `.as('lon'),
      sql<number | null>`
        CASE
          WHEN ${eb.ref('bdnb_batenr.geom')} IS NULL OR ST_IsEmpty(${eb.ref('bdnb_batenr.geom')})
            THEN NULL
          ELSE ST_Y(ST_Transform(ST_PointOnSurface(${eb.ref('bdnb_batenr.geom')}), 4326))
        END
      `.as('lat'),
    ])
    .where('bdnb_batenr.batiment_construction_id', '=', batimentConstructionId)
    .executeTakeFirst();

  return batiment ? getCoordinates(batiment) : null;
};

const searchRnicRowsByCoordinates = async (coordinates: Coordinates) => {
  const METERS_PER_DEGREE = 111_320;
  const latitudeDelta = RNIC_COORDINATE_LOOKUP_RADIUS_METERS / METERS_PER_DEGREE;
  const longitudeDegreeMeters = METERS_PER_DEGREE * Math.cos((coordinates.lat * Math.PI) / 180);
  const longitudeDelta = RNIC_COORDINATE_LOOKUP_RADIUS_METERS / Math.max(longitudeDegreeMeters, 1);

  return fetchRnicRows({
    latitude__greater: coordinates.lat - latitudeDelta,
    latitude__less: coordinates.lat + latitudeDelta,
    longitude__greater: coordinates.lon - longitudeDelta,
    longitude__less: coordinates.lon + longitudeDelta,
    page_size: 100,
  });
};

const fetchRnicRows = async (params: Record<string, number | string>) => {
  const response = await fetchJSON<unknown>(RNIC_RESOURCE_DATA_URL, {
    params: {
      columns: RNIC_RESULT_COLUMNS.join(','),
      ...params,
    },
  });

  return zRnicDataResponse.parse(response).data;
};

const getBestRnicMatch = (rows: RnicRow[], buildingCoordinates: Coordinates): RnicCopropriete | null => {
  const candidates = rows.flatMap((row): RnicCandidate[] => {
    const nomCopropriete = getCleanString(row.nom_usage_copropriete);
    const rowCoordinates = getCoordinates(row);

    if (!nomCopropriete || !rowCoordinates) {
      return [];
    }

    const distanceMeters = distance(
      point([buildingCoordinates.lon, buildingCoordinates.lat]),
      point([rowCoordinates.lon, rowCoordinates.lat]),
      {
        units: 'meters',
      }
    );

    return distanceMeters <= RNIC_COORDINATE_LOOKUP_RADIUS_METERS
      ? [
          {
            distanceMeters,
            nomCopropriete,
            row,
          },
        ]
      : [];
  });
  const bestCandidate = candidates.sort(compareRnicCandidates)[0];

  return bestCandidate
    ? {
        nomCopropriete: bestCandidate.nomCopropriete,
        numeroImmatriculation: getCleanString(bestCandidate.row.numero_immatriculation),
        siretRepresentantLegal: getCleanString(bestCandidate.row.siret_representant_legal),
      }
    : null;
};

function compareRnicCandidates(leftCandidate: RnicCandidate, rightCandidate: RnicCandidate) {
  const distanceDiff = leftCandidate.distanceMeters - rightCandidate.distanceMeters;

  if (distanceDiff !== 0) {
    return distanceDiff;
  }

  return (
    Number(getCleanString(rightCandidate.row.siret_representant_legal) !== null) -
    Number(getCleanString(leftCandidate.row.siret_representant_legal) !== null)
  );
}

function getCoordinates(value: { lat?: number | null; latitude?: number | null; lon?: number | null; longitude?: number | null }) {
  const latitude = value.lat ?? value.latitude;
  const longitude = value.lon ?? value.longitude;

  return latitude !== undefined &&
    latitude !== null &&
    longitude !== undefined &&
    longitude !== null &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude)
    ? { lat: latitude, lon: longitude }
    : null;
}

function getCleanString(value: string | null | undefined) {
  const cleanValue = value?.trim();

  return cleanValue ? cleanValue : null;
}
