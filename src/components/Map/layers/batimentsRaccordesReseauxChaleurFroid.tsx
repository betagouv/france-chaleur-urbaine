import Button from '@/components/ui/Button';
import { formatMWhAn } from '@/utils/strings';
import { type ExtractKeysOfType } from '@/utils/typescript';

import { ifHoverElse, type PopupStyleHelpers, type MapSourceLayersSpecification } from './common';
import { type MapConfiguration } from '../map-configuration';
import { type MapLayerSpecification } from '../map-layers';

export const batimentsRaccordesReseauxDeChaleurColor = '#079067';
export const batimentsRaccordesReseauxDeFroidColor = '#0094FF';

export const batimentsRaccordesReseauxChaleurFroidOpacity = 0.65;

type LayerConf<LayerId = string> = {
  id: LayerId;
  sourceLayer: string;
  iconColor: string;
  layerConfKey: ExtractKeysOfType<MapConfiguration, boolean>;
};

const layersConf = [
  {
    id: 'batimentsRaccordesReseauxChaleur',
    sourceLayer: 'batiments_raccordes_reseaux_chaleur',
    iconColor: batimentsRaccordesReseauxDeChaleurColor,
    layerConfKey: 'batimentsRaccordesReseauxChaleur',
  },
  {
    id: 'batimentsRaccordesReseauxFroid',
    sourceLayer: 'batiments_raccordes_reseaux_froid',
    iconColor: batimentsRaccordesReseauxDeFroidColor,
    layerConfKey: 'batimentsRaccordesReseauxFroid',
  },
] as const satisfies ReadonlyArray<LayerConf>;

export const batimentsRaccordesReseauxChaleurFroidLayersSpec = [
  {
    sourceId: 'batimentsRaccordesReseauxChaleurFroid',
    source: {
      type: 'vector',
      tiles: [`/api/map/batimentsRaccordesReseauxChaleurFroid/{z}/{x}/{y}`],
      minzoom: 9,
      maxzoom: 13, // 13 permet de cliquer jusqu'au zoom 20 inclus, sinon maplibre ne considère pas la feature comme cliquable
    },
    layers: layersConf.flatMap((conf) => buildLayerAndHoverLayer(conf)),
  },
] as const satisfies ReadonlyArray<MapSourceLayersSpecification>;

/**
 * Pour chaque layer, construit 2 couches identiques, une pour voir les données,
 * l'autre pour afficher la feature survolée (icone plus grande)
 */
function buildLayerAndHoverLayer<LayerId extends string>(
  conf: LayerConf<LayerId>
): readonly [MapLayerSpecification<LayerId>, MapLayerSpecification<`${LayerId}-hover`>] {
  return [
    {
      id: conf.id,
      'source-layer': conf.sourceLayer,
      minzoom: 9,
      type: 'symbol',
      layout: {
        'icon-image': 'square',
        'icon-overlap': 'always',
        'icon-size': ['interpolate', ['linear'], ['zoom'], 9, 0.1, 12, 0.5],
      },
      paint: {
        'icon-color': conf.iconColor,
        'icon-opacity': ['interpolate', ['linear'], ['zoom'], 9.2, 0, 10.5, ifHoverElse(0, batimentsRaccordesReseauxChaleurFroidOpacity)],
      },
      isVisible: (config) => config[conf.layerConfKey],
      popup: Popup,
    },
    {
      id: `${conf.id}-hover`,
      'source-layer': conf.sourceLayer,
      minzoom: 9,
      type: 'symbol',
      layout: {
        'icon-image': 'square',
        'icon-overlap': 'always',
        'icon-size': ['interpolate', ['linear'], ['zoom'], 9, 0.3, 12, 0.7], // + 0.2
      },
      paint: {
        'icon-color': conf.iconColor,
        'icon-opacity': ['interpolate', ['linear'], ['zoom'], 9.2, 0, 10.5, ifHoverElse(batimentsRaccordesReseauxChaleurFroidOpacity, 0)],
      },
      isVisible: (config) => config[conf.layerConfKey],
      unselectable: true,
    },
  ] as const satisfies ReadonlyArray<MapLayerSpecification>;
}

const secteurBatimentRaccordeToLabels = {
  A: 'Agriculture',
  I: 'Industrie',
  R: 'Résidentiel',
  T: 'Tertiaire',
};

type BatimentRaccordeReseauxChaleurFroid = {
  fid: number;
  id_reseau: string;
  filiere: 'C' | 'F';
  adresse?: string;
  code_grand_secteur: 'A' | 'I' | 'R' | 'T';
  conso?: number;
};

function Popup(
  batimentRaccordeReseauxChaleurFroid: BatimentRaccordeReseauxChaleurFroid,
  { Property, Title, TwoColumns }: PopupStyleHelpers
) {
  return (
    <>
      <Title>{batimentRaccordeReseauxChaleurFroid.adresse || 'Batiment raccordé'}</Title>
      <TwoColumns>
        <Property
          label={`Consommation de ${batimentRaccordeReseauxChaleurFroid.filiere === 'C' ? 'chaleur' : 'froid'}`}
          value={batimentRaccordeReseauxChaleurFroid.conso}
          formatter={formatMWhAn}
        />
        <Property label="Secteur" value={secteurBatimentRaccordeToLabels[batimentRaccordeReseauxChaleurFroid.code_grand_secteur]} />
        <Property label="Identifiant du réseau" value={batimentRaccordeReseauxChaleurFroid.id_reseau} />
        <Property label="Source" value="SDES pour 2023" />
      </TwoColumns>
      <Button
        priority="secondary"
        className="fr-mt-1w"
        full
        iconId="fr-icon-eye-line"
        linkProps={{ href: `/reseaux/${batimentRaccordeReseauxChaleurFroid.id_reseau}`, target: '_blank', rel: 'noopener noreferrer' }}
      >
        Voir la fiche du réseau
      </Button>
    </>
  );
}
