import fs from 'fs';

import db from 'src/db';

import AmorceFileReader from './AmorceFileReader';
import sousZoneClimatiques from './sous-zones-climatiques.json';
import temperaturesExterieuresDeBaseAuNiveauDeLaMer from './temperature-exterieure-de-base-au-niveau-de-la-mer.json';
import temperatureExterieureDeBase from './temperature-exterieure-de-base.json';

// Ce fichier permet de recalculer correctement les code insee, faux dans le fichier Amorce
const codesINSEEUrl =
  'https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/correspondance-code-insee-code-postal/exports/json';
const codesINSEEFilePath = './scripts/simulateur/codes-insee.json';

// Certaines valeurs du fichier amorce sont fausses, on les corrige ici
const altitudesFixes = {
  YEBLES: 90,
  'PALAVAS-LES-FLOTS': 0,
  'LES MOERES': 0,
};

// cette formule est tiré du site suivant https://www.thermexcel.com/french/energie/Calcul_deperditions_thermiques_NF_EN_12831.htm
// Il aurait été plus cohérent d'utiliser les données directement de https://www.boutique.afnor.org/Store/Preview/DisplayExtract?ProductID=36563&VersionID=6
// mais les tebleaux semblent incomplets (pas de colonne -9 et pas d'altitude supérieure à 2000m)
const getAltitudeRange = (departmentId: keyof typeof temperaturesExterieuresDeBaseAuNiveauDeLaMer, altitude: number) => {
  const temperaturesForDepartment = temperaturesExterieuresDeBaseAuNiveauDeLaMer[departmentId];
  const temperatures = temperatureExterieureDeBase[`${temperaturesForDepartment}` as keyof typeof temperatureExterieureDeBase];

  const altitudeRange = Object.keys(temperatures)
    .filter((range) => range.includes('à'))
    .find((range) => {
      const [min, max] = range.split(' à ').map(Number);
      return altitude >= min && altitude <= max;
    });
  return altitudeRange ? ((temperatures as any)[altitudeRange] as number) : undefined;
};

const upsertAndFixCity = async (city: any, { codesINSEE }: { codesINSEE: any }) => {
  const departmentId = `${city['Département']}`.padStart(2, '0') as keyof typeof temperaturesExterieuresDeBaseAuNiveauDeLaMer;
  const postalCode = `${city['Code postal']}`.padStart(5, '0');

  const cityWithCorrectInseeCode = codesINSEE.find((c: any) => c.nom_comm === city.Commune && `${c.code_dept}` === departmentId);

  if (!cityWithCorrectInseeCode) {
    console.error(`city not found ${city.Commune}`);
    console.error('city', city);
    console.error('departmentId', departmentId);
    console.error(
      'cityInCodesINSEE',
      codesINSEE.find((c: any) => c.nom_comm === city.Commune)
    );
    throw new Error(`city not found ${city.Commune}`);
  } else {
    if (`${cityWithCorrectInseeCode.postal_code}` !== postalCode) {
      console.error(`postal_code mismatch on ${city.Commune}`);
      console.error(cityWithCorrectInseeCode.postal_code, postalCode);
      console.error(city);
      console.error(cityWithCorrectInseeCode);
      throw new Error(`postal_code mismatch on ${city.Commune}`);
    }
  }

  const altitude_moyenne =
    (typeof city['Altitude moyenne'] === 'number' ? city['Altitude moyenne'] : undefined) ||
    altitudesFixes[city.Commune as keyof typeof altitudesFixes];

  const temperature_ref_altitude_moyenne = getAltitudeRange(departmentId, altitude_moyenne);

  const correctedCityData = {
    id: cityWithCorrectInseeCode.insee_com,
    code_postal: postalCode,
    commune: city.Commune,
    departement_id: departmentId,
    altitude_moyenne,
    temperature_ref_altitude_moyenne, // recalculé à la place de "T°C réf / altitude_moyenne" qui semble être faux
    source: city['Source '],
    sous_zones_climatiques: city['Sous-zones climatiques'],
  };

  try {
    await db('communes').insert(correctedCityData).onConflict('id').merge(correctedCityData);
  } catch (error: any) {
    console.error('correctedCityData', correctedCityData);
    console.error('postalCode', postalCode);
    throw error;
  }
};

const getCodesINSEE = async () => {
  if (fs.existsSync(codesINSEEFilePath)) {
    return JSON.parse(fs.readFileSync(codesINSEEFilePath, 'utf8'));
  }
  console.log(`Fetching codes insee from the web and saving it in ${codesINSEEFilePath}. This can take several minutes`);
  const response = await fetch(codesINSEEUrl);
  const data = await response.json();
  fs.writeFileSync(codesINSEEFilePath, JSON.stringify(data, null, 2));

  return data;
};

const upsertDepartments = async (departmentData: any) => {
  for (const dept of departmentData.filter((d: any) => d['Code département'] !== undefined)) {
    const departement_id = `${dept['Code département']}`.padStart(2, '0');
    const dataToInsert = {
      nom_departement: dept['Nom département'],
      id: departement_id,
      dju_chaud_moyen: dept['DJU chaud moyen'],
      dju_froid_moyen: dept['DJU froid moyen'],
      zone_climatique: dept['Zone climatique'],
      sous_zones_climatiques: sousZoneClimatiques[departement_id as keyof typeof sousZoneClimatiques],
      source: dept['Source '],
      annee: dept['Année'],
    };
    try {
      await db('departements').insert(dataToInsert).onConflict('id').merge(dataToInsert);
    } catch (error: any) {
      console.error('Error updating department:', error.toString());
      console.error(dept);
    }
  }
};

export const upsertFixedSimulateurData = async (filepath: string) => {
  // Le fichier Amorce est utilisé ici car aucun autre fichier contenant l'altitude des communes n'a été trouvé simplement
  // Dans le cas ou ce fichier serait disponible, il serait possible de s'affranchir de la dépendance à ce fichier
  // et créer des données directement à partir de celui-ci
  const reader = new AmorceFileReader(filepath);
  const departmentData = reader.getDepartementData();
  await upsertDepartments(departmentData);

  const cityData = reader.getCityData();
  const codesINSEE = await getCodesINSEE();

  let count = 0;
  const nbCities = cityData.length;
  for (const city of cityData) {
    if (count++ % 1000 === 0) {
      console.info(`Processing city ${count}/${nbCities} ${city.Commune}`);
    }
    if (city.Commune === null || city.Commune === 'FALSE' || !city.Commune) {
      console.warn(`Skipping city ${city.Commune}`);
      console.warn(city);
      continue;
    }

    try {
      await upsertAndFixCity(city, { codesINSEE });
    } catch (error: any) {
      console.error(`${count}/${nbCities} Error creating city:`, error.toString());
      console.error(city);
    }
  }
};
