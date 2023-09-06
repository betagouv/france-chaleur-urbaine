import base from '../src/db/airtable';
import { Airtable } from '../src/types/enum/Airtable';

const toIgnore: Record<string, string[]> = {
  '3303C': ['NoRC'],
  '4247C': ['NoRC'],
  '4405C': ['Engie_Nantes', 'ENGIE', 'IDEX', 'Idex_Nantes'],
  '5414C': ['UEM_Metz'],
  '6725C': ['ENGIE', 'NoRC'],
  '7501C': [
    'Coriance',
    'Coriance_IDF',
    'IDEX_Clichy-la-Garenne',
    'SIPPEREC',
    'ALEC_MVE',
    'SMIREC',
    'ENGIE',
    'ENGIE_IDF',
    'IDEX',
    'IDEX_IDF',
    'IDEX_Levallois-Perret',
    'NoRC',
    'IDEX_Boulogne-Billancourt',
  ],
  '9219C': ['ENGIE_Meudon'],
  '9236C': ['SIPPEREC_BLR', 'SOCACHAL'],
  '9404C': ['NoRC'],
  '9422C': ['SOCACHAL', 'Dalkia', 'Dalkia_IDF'],
};

const dalkiaNetworks: Record<string, string[]> = {
  '7319C': ['Dalkia_centre-est'],
  '3806C': ['Dalkia_centre-est'],
  '7402C': ['Dalkia_centre-est'],
  '7104C': ['Dalkia_centre-est'],
  '6304C': ['Dalkia_centre-est'],
  '0106C': ['Dalkia_centre-est'],
  '0101C': ['Dalkia_centre-est'],
  '3803C': ['Dalkia_centre-est'],
  '6904C': ['Dalkia_centre-est'],
  '6306C': ['Dalkia_centre-est'],
  '7408C': ['Dalkia_centre-est'],
  '0307C': ['Dalkia_centre-est'],
  '3814C': ['Dalkia_centre-est'],
  '5803C': ['Dalkia_centre-est'],
  '2106C': ['Dalkia_centre-est'],
  '7410C': ['Dalkia_centre-est'],
  '6918C': ['Dalkia_centre-est'],
  '0702C': ['Dalkia_centre-est'],
  '2604C': ['Dalkia_centre-est'],
  '7412C': ['Dalkia_centre-est'],
  '5802C': ['Dalkia_centre-est'],
  '0302C': ['Dalkia_centre-est'],
  '7423C': ['Dalkia_centre-est'],
  '4207C': ['Dalkia_centre-est'],
  '6307C': ['Dalkia_centre-est'],
  '4214C': ['Dalkia_centre-est'],
  '0105C': ['Dalkia_centre-est'],
  '4202C': ['Dalkia_centre-est'],
  '4204C': ['Dalkia_centre-est'],
  '6901C': ['Dalkia_centre-est'],
  '4210C': ['Dalkia_centre-est'],
  '7411C': ['Dalkia_centre-est'],
  '7407C': ['Dalkia_centre-est'],
  '7318C': ['Dalkia_centre-est'],
  '6906C': ['Dalkia_centre-est'],
  '6905C': ['Dalkia_centre-est'],
  '3813C': ['Dalkia_centre-est'],
};

const getGestionnairesPerNetwork = async () => {
  const demands = await base(Airtable.UTILISATEURS).select().all();
  const networks = dalkiaNetworks;
  demands.forEach((demand) => {
    const network = demand.get('Identifiant réseau') as string;
    const gestionnaires = demand.get('Gestionnaires') as string[];
    if (network && gestionnaires) {
      const city = demand.get('Ville');
      const filteredGestionnaires = gestionnaires.filter(
        (gestionnaire) => gestionnaire !== city
      );
      if (networks[network]) {
        networks[network] = networks[network].concat(filteredGestionnaires);
      } else if (filteredGestionnaires.length > 0) {
        networks[network] = filteredGestionnaires;
      }
    }
  });

  Object.keys(toIgnore).forEach(
    (key) =>
      (networks[key] = networks[key].filter(
        (gestionnaire) => !toIgnore[key].includes(gestionnaire)
      ))
  );

  Object.keys(networks)
    .sort()
    .forEach((network) => {
      console.log(
        `'${network}': [ '${[...new Set(networks[network])].join("', '")}' ],`
      );
    });
  process.exit(0);
};

if (process.argv.length !== 2) {
  console.info(
    'Usage: export NODE_PATH=./ && npx ts-node scripts/getGestionnairesPerNetwork.ts'
  );
  process.exit(1);
}

getGestionnairesPerNetwork();
