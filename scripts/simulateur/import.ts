import { fetchJSON } from '@utils/network';
import db from 'src/db';

import AmorceFileReader from './AmorceFileReader';
import sousZoneClimatiques from './sous-zones-climatiques.json';

const importAndFixCity = async (
  city: any,
  departement: any,
  { count, nbCities, retry }: { count: number; nbCities: number; retry: number }
) => {
  if (count % 1000 === 0) {
    console.log(`Processing city ${count}/${nbCities} ${city.Commune}`);
  }
  try {
    const postalCode = `${city['Code postal']}`.split('/')[0].padStart(5, '0');
    const cityUrl = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(`${postalCode} ${city.Commune}`)}&limit=1`;
    const cityFromApi = await fetchJSON(cityUrl);
    console.log(cityUrl);

    const cityRealId = cityFromApi?.features[0]?.properties?.citycode;

    const departement_id = `${city['Département']}`.padStart(2, '0');

    if (sousZoneClimatiques[departement_id as keyof typeof sousZoneClimatiques] !== city['Sous-zones climatiques']) {
      console.log(
        `Mismatch sous zones climatiques ${city['Sous-zones climatiques']} != ${
          sousZoneClimatiques[departement_id as keyof typeof sousZoneClimatiques]
        }`
      );
      process.exit();
    }
    const correctedCityData = {
      id: cityRealId,
      code_postal: `${city['Code postal']}`.length === 4 ? postalCode : city['Code postal'],
      commune: city.Commune,
      departement_id,
      altitude_moyenne: city['Altitude moyenne'],
      temperature_ref_altitude_moyenne: city['T°C réf / altitude_moyenne'] || 0,
      source: city['Source '],
      sous_zones_climatiques: city['Sous-zones climatiques'],
    };
    try {
      await db('communes').insert(correctedCityData).onConflict('id').merge(correctedCityData);
    } catch (error: any) {
      console.error(`${count}/${nbCities} Error updating city:`, error.toString());
      console.error(correctedCityData);
      console.error(postalCode);
      if (retry > 0) {
        console.log(`Retrying ${count}/${nbCities} ${city.Commune}`);
        await importAndFixCity(city, departement, { count, nbCities, retry: retry - 1 });
      }
    }
  } catch (error: any) {
    console.error(`${count}/${nbCities} Error updating city:`, error.toString());
    console.error(city);
    if (retry > 0) {
      console.log(`Retrying ${count}/${nbCities} ${city.Commune}`);
      await importAndFixCity(city, departement, { count, nbCities, retry: retry - 1 });
    }
  }
};

export const importAndFixSimulateurData = async (filepath: string) => {
  const reader = new AmorceFileReader(filepath);
  const departmentData = reader.getDepartementData();

  for (const dept of departmentData) {
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

  const cityData = reader.getCityData();

  let count = 0;
  for (const city of cityData) {
    count++;
    const departement = departmentData.find((d) => d['Code département'] === city['Département']);

    if (!departement) {
      throw new Error(`Departement not found ${city['Département']}`);
    }
    await importAndFixCity(city, departement, { count, nbCities: cityData.length, retry: 3 });
  }
};

export const updateSimulateurData = async (filepath: string) => {
  const reader = new AmorceFileReader(filepath);
  const departmentData = reader.getDepartementData();

  for (const dept of departmentData) {
    const dataToInsert = {
      nom_departement: dept['Nom département'],
      id: `${dept['Code département']}`.padStart(2, '0'),
      dju_chaud_moyen: dept['DJU chaud moyen'],
      dju_froid_moyen: dept['DJU froid moyen'],
      zone_climatique: dept['Zone climatique'],
      sous_zones_climatiques: sousZoneClimatiques[`${dept['Code département']}` as keyof typeof sousZoneClimatiques],
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

  const cityData = reader.getCityData();

  let count = 0;
  for (const city of cityData) {
    count++;
    if (count % 1000 === 0) {
      console.log(`Processing city ${count}/${cityData.length} ${city.Commune}`);
    }
    await db('communes')
      .update({
        commune: city.Commune,
        departement_id: `${city['Département']}`.padStart(2, '0'),
        altitude_moyenne: city['Altitude moyenne'],
        temperature_ref_altitude_moyenne: city['T°C réf / altitude_moyenne'] || 0,
        source: city['Source '],
      })
      .where({ commune: city.Commune, departement_id: city['Département'] });
  }
};
