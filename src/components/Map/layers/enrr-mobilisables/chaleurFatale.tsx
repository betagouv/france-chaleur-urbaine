import { type MapConfiguration } from '@/components/Map/map-configuration';
import { type MapLayerSpecification, type PopupHandler } from '@/components/Map/map-layers';
import Text from '@/components/ui/Text';

import { ifHoverElse, type LayerSymbolSpecification, type MapSourceLayersSpecification, type PopupStyleHelpers } from '../common';

export const enrrMobilisablesChaleurFataleLayerSymbols = [
  {
    key: 'enrr_mobilisables_datacenter',
    url: '/icons/enrr_mobilisables_datacenter.png',
  },
  {
    key: 'enrr_mobilisables_industrie',
    url: '/icons/enrr_mobilisables_industrie.png',
  },
  {
    key: 'enrr_mobilisables_installations_electrogenes',
    url: '/icons/enrr_mobilisables_installations_electrogenes.png',
  },
  {
    key: 'enrr_mobilisables_stations_epuration',
    url: '/icons/enrr_mobilisables_stations_epuration.png',
  },
  {
    key: 'enrr_mobilisables_unites_incineration',
    url: '/icons/enrr_mobilisables_unites_incineration.png',
  },
] as const satisfies ReadonlyArray<LayerSymbolSpecification>;

type EnrrMobilisablesChaleurFataleImage = (typeof enrrMobilisablesChaleurFataleLayerSymbols)[number]['key'];

type ChaleurFataleLayerConf<LayerId = string> = {
  id: LayerId;
  iconImage: EnrrMobilisablesChaleurFataleImage;
  featureType: string;
  layerConfKey: keyof MapConfiguration['enrrMobilisablesChaleurFatale'];
  popup: PopupHandler;
};

const layersConf = [
  {
    id: 'enrrMobilisables-stations-d-epuration',
    iconImage: 'enrr_mobilisables_stations_epuration',
    featureType: 'stations_d_epuration',
    layerConfKey: 'showStationsDEpuration',
    popup: PopupStationsDEpuration,
  },
  {
    id: 'enrrMobilisables-datacenter',
    iconImage: 'enrr_mobilisables_datacenter',
    featureType: 'datacenter',
    layerConfKey: 'showDatacenters',
    popup: PopupDatacenter,
  },
  {
    id: 'enrrMobilisables-industrie',
    iconImage: 'enrr_mobilisables_industrie',
    featureType: 'industrie',
    layerConfKey: 'showIndustrie',
    popup: PopupIndustrie,
  },
  {
    id: 'enrrMobilisables-installations-electrogenes',
    iconImage: 'enrr_mobilisables_installations_electrogenes',
    featureType: 'installations_electrogenes',
    layerConfKey: 'showInstallationsElectrogenes',
    popup: PopupInstallationElectrogene,
  },
  {
    id: 'enrrMobilisables-unites-d-incineration',
    iconImage: 'enrr_mobilisables_unites_incineration',
    featureType: 'unites_d_incineration',
    layerConfKey: 'showUnitesDIncineration',
    popup: PopupUniteDIncineration,
  },
] as const satisfies ReadonlyArray<ChaleurFataleLayerConf>;

export const enrrMobilisablesChaleurFataleLayersSpec = [
  {
    sourceId: 'enrrMobilisables',
    source: {
      type: 'vector',
      tiles: ['/api/map/enrrMobilisables/{z}/{x}/{y}'],
      promoteId: 'GmlID',
    },

    // the source contains one layer that contains all features
    // we know the kind of one feature using the GmlID (e.g. datacenter.1)
    // we have 5 layers, one for each kind of features to simplify show/hide code
    layers: layersConf.flatMap((conf) => buildLayerAndHoverLayer(conf)),
  },
] as const satisfies ReadonlyArray<MapSourceLayersSpecification>;

/**
 * Pour chaque layer, construit 2 couches identiques, une pour voir les données,
 * l'autre pour afficher la feature survolée (icone plus grande)
 */
function buildLayerAndHoverLayer<LayerId extends string>(
  conf: ChaleurFataleLayerConf<LayerId>
): readonly [MapLayerSpecification<LayerId>, MapLayerSpecification<`${LayerId}-hover`>] {
  return [
    {
      id: conf.id,
      type: 'symbol',
      layout: {
        'icon-image': conf.iconImage,
        'icon-overlap': 'always',
        'icon-size': ['interpolate', ['linear'], ['zoom'], 5, 0.6, 10, 1],
      },
      paint: {
        // display all features except the hovered one
        'icon-opacity': ifHoverElse(0, 1),
      },
      filter: () => ['in', conf.featureType, ['get', 'GmlID']],
      isVisible: (config) => config.enrrMobilisablesChaleurFatale.show && config.enrrMobilisablesChaleurFatale[conf.layerConfKey],
      popup: conf.popup,
    },
    {
      id: `${conf.id}-hover`,
      type: 'symbol',
      layout: {
        'icon-image': conf.iconImage,
        'icon-overlap': 'always',
        'icon-size': ['interpolate', ['linear'], ['zoom'], 5, 0.8, 10, 1.2], // + 0.2
      },
      paint: {
        // only display the hovered feature
        'icon-opacity': ifHoverElse(1, 0),
      },
      filter: () => ['in', conf.featureType, ['get', 'GmlID']],
      isVisible: (config) => config.enrrMobilisablesChaleurFatale.show && config.enrrMobilisablesChaleurFatale[conf.layerConfKey],
      unselectable: true,
    },
  ] as const satisfies ReadonlyArray<MapLayerSpecification>;
}

export interface Datacenter {
  GmlID: string;
  'db_gd5kj.hsu_pnjyu.datacenter_datacenter.fid': number;
  id: string;
  com_nom: string;
  nom: string;
  categorie: string;
  qualite_xy: string;
  source: string;
}

const qualiteToLabel = {
  1: '', // exact
  2: 'Localisation à la parcelle',
  3: 'Localisation au quartier',
  4: "Localisation à l'IRIS",
  5: 'Localisation à la commune',
} as const;

const QualiteLabel = ({ value }: { value: string | number }) => (
  <Text fontStyle="italic">{qualiteToLabel[`${value}`[0] as unknown as keyof typeof qualiteToLabel] ?? ''}</Text>
);

function PopupDatacenter(datacenter: Datacenter, { Property, Title, TwoColumns }: PopupStyleHelpers) {
  return (
    <>
      <Title subtitle="Datacenter">{datacenter.nom}</Title>
      <TwoColumns>
        <Property label="Catégorie" value={datacenter.categorie} />
        <Property label="Commune" value={datacenter.com_nom} />
        <Property label="Identifiant national" value={datacenter.id} />
        <Property label="Source" value="Cerema" />
        <QualiteLabel value={datacenter.qualite_xy} />
      </TwoColumns>
    </>
  );
}

export interface Industrie {
  GmlID: string; // computed with a script
  fid: number;
  comm_bt: string;
  quali_xy: number;
  potbas_ht: number;
  source: string;
  pothaut_bt: number;
  nom_commun: string;
  nom_etabli: string;
  pothaut_ht: number;
  type_act: string;
  comm_ht: string;
  commentair: string;
  potbas_bt: number;
}

function PopupIndustrie(industrie: Industrie, { Property, Title, TwoColumns }: PopupStyleHelpers) {
  return (
    <>
      <Title subtitle="Industrie">{industrie.nom_etabli}</Title>
      <TwoColumns>
        <Property label="Activité" value={industrie.type_act} />
        <Property label="Potentiel minimal de chaleur valorisable (BT)" value={industrie.potbas_bt} unit="MWh/an" />
        <Property label="Potentiel maximale de chaleur valorisable (BT)" value={industrie.pothaut_bt} unit="MWh/an" />
        <Property label="Potentiel minimal de chaleur valorisable (HT)" value={industrie.potbas_ht} unit="MWh/an" />
        <Property label="Potentiel maximale de chaleur valorisable (HT)" value={industrie.pothaut_ht} unit="MWh/an" />
        <Property label="Source" value={industrie.source} />
        <QualiteLabel value={industrie.quali_xy} />
      </TwoColumns>
    </>
  );
}

export interface InstallationElectrogene {
  GmlID: string;
  'db_gd5kj.hsu_pnjyu.installations_electrogenes_installations_electrogene.fid': number;
  id: string;
  com_nom: string;
  nom_inst: string;
  type_inst: string;
  qualite_xy: string;
}

function PopupInstallationElectrogene(
  installationElectrogene: InstallationElectrogene,
  { Property, Title, TwoColumns }: PopupStyleHelpers
) {
  return (
    <>
      <Title subtitle="Installation électrogène">{installationElectrogene.nom_inst}</Title>
      <TwoColumns>
        <Property label="Type" value={installationElectrogene.type_inst} />
        <Property label="Commune" value={installationElectrogene.com_nom} />
        <Property label="Source" value="Cerema" />
        <QualiteLabel value={installationElectrogene.qualite_xy} />
      </TwoColumns>
    </>
  );
}

export interface StationDEpuration {
  GmlID: string;
  'db_gd5kj.hsu_pnjyu.stations_d_epuration_stations_d_epuration.fid': number;
  id_unique: string;
  com_nom: string;
  step_nom: string;
  exploitant: string;
  capa_eh: number;
  debit_m3j: number;
  en_mwh_an: number;
}

function PopupStationsDEpuration(stationDEpuration: StationDEpuration, { Property, Title, TwoColumns }: PopupStyleHelpers) {
  return (
    <>
      <Title subtitle="Station d'épuration">{stationDEpuration.step_nom}</Title>
      <TwoColumns>
        <Property label="Débit entrant" value={stationDEpuration.debit_m3j} unit="m³/j" />
        <Property label="Capacité" value={stationDEpuration.capa_eh} unit="équivalent-habitants" />
        <Property label="Exploitant" value={stationDEpuration.exploitant} />
        <Property label="Commune" value={stationDEpuration.com_nom} />
        <Property label="Source" value="Cerema" />
      </TwoColumns>
    </>
  );
}

export interface UniteDIncineration {
  GmlID: string; // computed with a script
  fid: number;
  nom_comm: string;
  max_prd_cr: number;
  insee_com: number;
  min_prd_cr: number;
  dep: string;
  max_prd: number;
  code_dep: number;
  nom_inst: string;
  min_prd: number;
  type_inst: string;
  comt: string;
  info: string;
}

function PopupUniteDIncineration(uniteDIncineration: UniteDIncineration, { Property, Title, TwoColumns }: PopupStyleHelpers) {
  return (
    <>
      <Title subtitle="Unité d'incinération">{uniteDIncineration.nom_inst}</Title>
      <TwoColumns>
        <Property label="Type" value={uniteDIncineration.type_inst} />
        <Property label="Potentiel minimal de chaleur valorisable" value={uniteDIncineration.min_prd_cr} unit="MWh/an" />
        <Property label="Potentiel maximal de chaleur valorisable" value={uniteDIncineration.max_prd_cr} unit="MWh/an" />
        <Property label="Commune" value={uniteDIncineration.nom_comm} />
        <Property label="Source" value={uniteDIncineration.info} />
      </TwoColumns>
    </>
  );
}
