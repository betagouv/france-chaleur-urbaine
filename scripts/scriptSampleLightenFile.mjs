import fs from 'fs';

const sample2 = {
  // Conso Gaz
  type: 'Feature',
  geometry: {
    type: 'Point',
    coordinates: [2.2402730000000006, 48.5851199999857],
  },
  properties: {
    id: 187358,
    operateur: 'GRDF',
    code_eic: '17X100A100A00028',
    annee: 2020,
    filiere: 'G',
    iris_code: '910210103',
    iris_libelle: 'Sud',
    adresse: '2 ROUTE D EGLY',
    code_insee: 91021,
    nom_commune: 'ARPAJON',
    code_grand_secteur: 'T',
    conso: 212.06067,
    pdl: 1,
    latitude: 48.58512,
    longitude: 2.240273,
    result_label: '2 Route d’Egly 91290 Arpajon',
    result_score: 0.76,
    result_type: 'housenumber',
    result_id: '91021_0370_00002',
    result_housenumber: '2',
    result_name: 'Route d’Egly',
    result_street: null,
    result_postcode: 91290,
    result_city: 'Arpajon',
    result_context: '91, Essonne, Île-de-France',
    result_citycode: 91021,
    result_oldcitycode: null,
    result_oldcity: null,
    result_district: null,
  },
};

const sample1 = {
  // Copro
  type: 'Feature',
  geometry: {
    type: 'Point',
    coordinates: [2.4418290000000002, 48.63327899998581],
  },
  properties: {
    id: 12537,
    epci: '200059228',
    commune: '91228',
    numero_immatriculation: 'AA6723787',
    type_syndic: 'non connu',
    administration_provisioire: 'non connu',
    syndic_provisoire: 'non connu',
    identification_representant_legal: 'non connu',
    code_ape: 'non connu',
    commune_representant_legal: 'non connu',
    mandat: 'Pas de mandat en cours',
    date_fin_mandat: '2021-09-30',
    nom_usage_copropriete: 'SDC MOSAIQUE',
    adresse_reference: '93 bd decauville 91000 Évry',
    adresse_complementaire_1: null,
    adresse_complementaire_2: null,
    adresse_complementaire_3: null,
    nb_adresse_complementaire: 0,
    code_insee: null,
    prefixe: null,
    section: null,
    parcelle: null,
    code_insee_1: null,
    prefixe_1: null,
    section_1: null,
    parcelle_1: null,
    code_insee_2: null,
    prefixe_2: null,
    section_2: null,
    parcelle_2: null,
    nb_parcelle: 0,
    date_reglement_copropriete: '2021/09/30',
    residence_service: 'non',
    syndicat_cooperatif: 'non',
    syndic_principal_secondaire: 'oui',
    numero_identification_syndicat_principal: null,
    nb_asl: 0,
    nb_aful: 0,
    nb_union_syndic: 0,
    nb_lot: 60,
    nb_lot_habitation_bureau_commerce: 30,
    nb_lot_habitation: 30,
    nb_lot_stationnement: 0,
    nb_arrete_code_sante_publique: 0,
    nb_arrete_peril: 0,
    nb_arrete_equipement: 0,
    mandat_ad_hoc: 'non',
    ordonnance_carence: '2021/09/30',
    premier_exercice_comptable: 'non',
    date_debut_exercice_compable: '2021/09/30',
    date_fin_exercice_compable: '2021/09/30',
    date_assemblee_generale_comptes: '0036/03/13',
    charges_courantes: 48058,
    charges_eceptionnelles: 0,
    montant_dette_remuneration_autre: 7254,
    montant_du_coproprietaire: 17,
    nb_coproprietaire_debiteur_sup300: 3,
    montant_fonds_travaux: 5498,
    presence_personnel: 'non',
    periode_construction: 'DE_1961_A_1974',
    annee_achevement_construction: 1974,
    a: 0,
    b: 0,
    c: 0,
    d: 0,
    e: 0,
    f: 0,
    g: 0,
    non_determine: 1,
    type_chauffage: 'collectif',
    chauffage_urbain: 'non',
    energie_utilisee: 'gaz_naturel',
    nb_ascenceur: 1,
    identifiant_ign: null,
  },
};

function readJsonFile(filepath, debug = '') {
  debug &&
    console.info(
      'JsonFile system reading...',
      typeof debug === 'string' ? `[${debug}]` : '',
      `(${filepath})`
    );
  const rawdata = fs.readFileSync(filepath).toString();
  debug && console.info('Convert string to Json ...');
  const data = JSON.parse(rawdata);
  debug && console.info('File read.');

  // Filter =>
  const energyOK = ['fioul_domestique', 'gaz_naturel', 'gaz_propane_butane'];
  console.log('data.features.length =>', data.features.length);
  const newFeatures = data.features.filter(
    ({ geometry, properties }) =>
      !!geometry && energyOK.includes(properties?.energie_utilisee)
  );
  console.log('newFeatures.length =>', newFeatures.length);
  data.features = newFeatures;

  fs.writeFileSync('registre_copro.lightten.geojson', JSON.stringify(data));
  return data;
}

// export default readJsonFile;

const file = 'public/geojson/registre_copro.geojson.backUp';
readJsonFile(file, true);
