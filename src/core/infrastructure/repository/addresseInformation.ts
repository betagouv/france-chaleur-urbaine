import db from 'src/db';
import { EXPORT_FORMAT } from 'src/types/enum/ExportFormat';
import XLSX from 'xlsx';
import inZDP from './zdp';

const isOnAnIRISNetwork = async (
  lat: number,
  lon: number
): Promise<boolean> => {
  const result = await db('network_iris')
    .where(
      db.raw(`ST_INTERSECTS(
      ST_Transform('SRID=4326;POINT(${lon} ${lat})'::geometry, 2154),
      ST_Transform(geom, 2154)
    )
  `)
    )
    .first();

  return !!result;
};

export const closestNetwork = async (
  lat: number,
  lon: number
): Promise<{
  distance: number;
  date?: Date;
  'Identifiant reseau': string;
  'Taux EnR&R': number;
}> => {
  const network = await db('reseaux_de_chaleur')
    .select(
      db.raw(
        `ST_Distance(
          ST_Transform('SRID=4326;POINT(${lon} ${lat})'::geometry, 2154),
          ST_Transform(geom, 2154)
        ) as distance, date, "Identifiant reseau", "Taux EnR&R"`
      )
    )
    .orderBy('distance')
    .first();

  return network;
};

export const getConso = async (
  lat: number,
  lon: number
): Promise<{ conso_nb: number; rownum: string } | null> => {
  const result = await db('donnees_de_consos')
    .select('rownum', 'conso_nb')
    .where(
      db.raw(`
        ST_INTERSECTS(
          ST_Transform('SRID=4326;POINT(${lon} ${lat})'::geometry, 2154),
          ST_BUFFER(ST_Transform(geom, 2154), 3.5)
        )
      `)
    )
    .first();
  return result;
};

export const getConsoById = async (
  id: string
): Promise<{ conso_nb: number; rownum: string } | null> => {
  const result = await db('donnees_de_consos')
    .select('rownum', 'conso_nb')
    .where('rownum', id)
    .first();
  return result;
};

export const getNbLogement = async (
  lat: number,
  lon: number
): Promise<{ nb_logements: number; fid: string } | null> => {
  const region = await db('regions')
    .select('bnb_nom')
    .where(
      db.raw(`
      ST_Intersects(
        ST_Transform(geom, 2154),
        ST_Transform('SRID=4326;POINT(${lon} ${lat})'::geometry, 2154)
        )
    `)
    )
    .first();
  const result = await db(region.bnb_nom)
    .select(
      'fid',
      db.raw(`
        CASE
          WHEN cerffo2020_nb_log ISNULL 
            THEN anarnc202012_nb_log
          WHEN cerffo2020_nb_log < 1 
            THEN anarnc202012_nb_log
          ELSE cerffo2020_nb_log
        END as nb_logements
      `)
    )
    .where(
      db.raw(`
        ST_INTERSECTS(
          ST_Transform('SRID=4326;POINT(${lon} ${lat})'::geometry, 2154),
          ST_BUFFER(ST_Transform(geom_adresse, 2154), 3.5)
        )
      `)
    )
    .first();
  return result;
};

export const getNbLogementById = async (
  id: string,
  lat: number,
  lon: number
): Promise<{ nb_logements: number; fid: string } | null> => {
  const region = await db('regions')
    .select('bnb_nom')
    .where(
      db.raw(`
      ST_Intersects(
        ST_Transform(geom, 2154),
        ST_Transform('SRID=4326;POINT(${lon} ${lat})'::geometry, 2154)
        )
    `)
    )
    .first();

  const result = await db(region.bnb_nom)
    .select(
      'fid',
      db.raw(`
        CASE
          WHEN cerffo2020_nb_log ISNULL 
            THEN anarnc202012_nb_log
          WHEN cerffo2020_nb_log < 1 
            THEN anarnc202012_nb_log
          ELSE cerffo2020_nb_log
        END as nb_logements
      `)
    )
    .where('fid', id)
    .first();
  return result;
};

const THRESHOLD = parseInt(process.env.NEXT_THRESHOLD || '0', 10);

const headers = [
  'Adresse',
  'Adresse testée',
  "Indice de fiabilité de l'adresse testée",
  'Bâtiment potentiellement raccordable',
  'Distance au réseau (m) si < 1000 m',
  "Tracé non disponible mais présence d'un réseau dans la zone",
  'PDP (périmètre de développement prioritaire)',
  'Identifiant du réseau le plus proche',
  'Taux EnR&R du réseau le plus proche',
];

const legend = [
  ['Adresse', 'Adresse reçue par France Chaleur Urbaine'],
  ['Adresse testée', 'Adresse testée par France Chaleur Urbaine'],
  [
    "Indice de fiabilité de l'adresse testée",
    "Min = 0 , Max = 1, Cet indice traduit la correspondance entre l'adresse renseignée par l'utilisateur et celle effectivement testée",
  ],
  [
    'Bâtiment potentiellement raccordable',
    "Résultat compilant distance au réseau et présence d'un réseau dans la zone",
  ],
  ['Distance au réseau (m) si < 1000 m', 'Distance au réseau le plus proche'],
  [
    "Tracé non disponible mais présence d'un réseau dans la zone",
    "Lorsque nous ne disposons pas de tracé d'un réseau à proximité de l'adresse testée, nous vérifions s'il existe une consommation de chaleur sur un réseau dans le quartier (données à l'iris mise à disposition par le MTE). Le cas échéant, c'est qu'il existe un réseau à proximité",
  ],
  [
    'PDP (périmètre de développement prioritaire)',
    "Si l'adresse est comprise dans un PDP, son raccordement peut être obligatoire (valable pour les nouveaux bâtiments ou ceux renouvelant leur installation de chauffage au-dessus d'une certaine puissance)",
  ],
];

export const getExport = (addresses: any[]) => {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(
    [headers].concat(
      addresses.map((address) => [
        address.address,
        address.label,
        address.score,
        address.isEligible ? 'Oui' : 'Non',
        address.distance,
        address.isEligible && address.isBasedOnIris ? 'Oui' : 'Non',
        address.inZDP ? 'Oui' : 'Non',
        address.id,
        address.tauxENRR,
      ])
    )
  );
  XLSX.utils.book_append_sheet(wb, ws, 'Résultats');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(legend), 'Légende');
  return XLSX.write(wb, { bookType: EXPORT_FORMAT.XLSX, type: 'base64' });
};

export const getElibilityStatus = async (
  lat: number,
  lon: number
): Promise<{
  isEligible: boolean;
  distance: number | null;
  inZDP: boolean;
  isBasedOnIris: boolean;
  futurNetwork: boolean;
  id: string | null;
  tauxENRR: number | null;
}> => {
  const zdpPromise = inZDP(lat, lon);
  const irisNetwork = isOnAnIRISNetwork(lat, lon);

  const network = await closestNetwork(lat, lon);
  if (network.distance !== null && Number(network.distance) < 1000) {
    return {
      isEligible: Number(network.distance) <= THRESHOLD,
      distance: Math.round(network.distance),
      inZDP: await zdpPromise,
      isBasedOnIris: false,
      futurNetwork: network.date !== null,
      id: network['Identifiant reseau'],
      tauxENRR: network['Taux EnR&R'],
    };
  }
  const isEligible = await irisNetwork;
  return {
    isEligible,
    distance: null,
    inZDP: await zdpPromise,
    isBasedOnIris: true,
    futurNetwork: false,
    id: null,
    tauxENRR: null,
  };
};
