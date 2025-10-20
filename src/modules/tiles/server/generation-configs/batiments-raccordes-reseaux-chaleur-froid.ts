import { downloadJSONAndTransformToMultipleGeoJSON } from '@/modules/tiles/server/generation-strategies';

type DonneesBrutes = {
  ID: string;
  OPERATEUR: string;
  IRIS: string;
  IRIS_LIBELLE: string;
  FILIERE: 'C' | 'F' | 'NA';
  LAMBERT_93_X: number | 'secret' | 'nd';
  LAMBERT_93_Y: number | 'secret' | 'nd';
  ADRESSE: string;
  NOM_COMMUNE: string;
  CODE_GRAND_SECTEUR: 'A' | 'I' | 'R' | 'T' | 'X';
  CONSO: number | 'secret' | 'nd';
  PDL: number | 'secret' | 'nd';
  ANNEE: string;
};

export const downloadBatimentsRaccordesReseauxChaleurFroidJSON = downloadJSONAndTransformToMultipleGeoJSON<DonneesBrutes>({
  layerConfigs: [
    {
      layerName: 'batiments_raccordes_reseaux_chaleur',
      mapFilterFeature: (item, { convertLambert93ToWGS84 }) => {
        // Skip items with invalid coordinates or wrong filiere
        if (item.FILIERE !== 'C' || [item.LAMBERT_93_X, item.LAMBERT_93_Y].some((coord) => ['secret', 'nd'].some((v) => v === coord))) {
          return null;
        }

        return formatFeature(item, convertLambert93ToWGS84);
      },
    },
    {
      layerName: 'batiments_raccordes_reseaux_froid',
      mapFilterFeature: (item, { convertLambert93ToWGS84 }) => {
        // Skip items with invalid coordinates or wrong filiere
        if (item.FILIERE !== 'F' || [item.LAMBERT_93_X, item.LAMBERT_93_Y].some((coord) => ['secret', 'nd'].some((v) => v === coord))) {
          return null;
        }
        return formatFeature(item, convertLambert93ToWGS84);
      },
    },
  ],
  url: 'https://data.statistiques.developpement-durable.gouv.fr/dido/api/v1/datafiles/49ec6b39-cf3b-4280-b25e-2a19f5dc0cfa/json?millesime=2024-09',
});

function nullIfNdSecret(value: any): string | null {
  return value === 'nd' || value === 'secret' ? null : value;
}

const formatFeature = (item: DonneesBrutes, convertLambert93ToWGS84: (coords: [number, number]) => [number, number]) => ({
  geometry: {
    coordinates: convertLambert93ToWGS84([item.LAMBERT_93_X as number, item.LAMBERT_93_Y as number]),
    type: 'Point' as const,
  },
  properties: {
    adresse: nullIfNdSecret(item.ADRESSE),
    annee: item.ANNEE,
    code_grand_secteur: item.CODE_GRAND_SECTEUR,
    conso: typeof item.CONSO === 'number' ? item.CONSO : null,
    filiere: item.FILIERE,
    id_reseau: item.ID !== 'NA' ? item.ID : null,
    nom_commune: item.NOM_COMMUNE,
    operateur: item.OPERATEUR,
  },
  type: 'Feature' as const,
});
