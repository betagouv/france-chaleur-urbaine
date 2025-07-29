import Button from '@/components/ui/Button';
import Link from '@/components/ui/Link';

import { defineLayerPopup, ifHoverElse, type MapSourceLayersSpecification } from '../common';

export const ouvragesGeothermieSurfaceEchangeursFermesRealiseeColor = '#b96210';
export const ouvragesGeothermieSurfaceEchangeursFermesDeclareeColor = '#c6c614';
export const ouvragesGeothermieSurfaceEchangeursFermesOpacity = 0.7;

export const ouvragesGeothermieSurfaceEchangeursOuvertsRealiseeColor = '#3217f0';
export const ouvragesGeothermieSurfaceEchangeursOuvertsDeclareeColor = '#17f0f0';
export const ouvragesGeothermieSurfaceEchangeursOuvertsOpacity = 0.7;

const PopupOuvrageGeothermieSurface = defineLayerPopup<
  OuvrageGeothermieSurfaceEchangeursFermes | OuvrageGeothermieSurfaceEchangeursOuverts
>((ouvrageGeothermieSurface, { Property, Title, TwoColumns }) => {
  return (
    <>
      <Title>Ouvrage de géothermie de surface</Title>
      <TwoColumns>
        <Property label="Nom de l'ouvrage" value={ouvrageGeothermieSurface.nom_ouv} />
        <Property label="Nature de l'ouvrage" value={ouvrageGeothermieSurface.nature_ouv} />
        <Property label="Catégorie réglementaire" value={ouvrageGeothermieSurface.categ_gth} />
        <Property label="Identifiant BSS" value={ouvrageGeothermieSurface.bss_id} />
        <Property label="Statut" value={ouvrageGeothermieSurface.statut_bss} />
        <Property
          label="Source"
          value={
            <>
              <Link href="https://www.geothermies.fr/espace-cartographique" isExternal>
                BRGM
              </Link>{' '}
              (juillet 2025)
            </>
          }
        />
      </TwoColumns>
      {ouvrageGeothermieSurface.statut_bss === 'Réalisé' && (
        <Button
          priority="tertiary"
          className="fr-mt-1w"
          full
          iconId="fr-icon-eye-line"
          linkProps={{
            href: `http://ficheinfoterre.brgm.fr/InfoterreFiche/ficheBss.action?id=${ouvrageGeothermieSurface.bss_id}`,
            target: '_blank',
            rel: 'noopener noreferrer',
          }}
        >
          Fiche technique de l'ouvrage
        </Button>
      )}
    </>
  );
});

export const ouvragesGeothermieSurfaceLayersSpec = [
  {
    sourceId: 'ouvragesGeothermieSurfaceEchangeursFermes',
    source: {
      type: 'vector',
      tiles: ['/api/map/ouvragesGeothermieSurfaceEchangeursFermes/{z}/{x}/{y}'],
      minzoom: 5,
      maxzoom: 10,
    },
    layers: [
      {
        id: 'ouvragesGeothermieSurfaceEchangeursFermes',
        type: 'symbol',
        layout: {
          'icon-image': 'square',
          'icon-overlap': 'always',
          'icon-size': 0.5,
        },
        paint: {
          'icon-color': [
            'case',
            ['==', ['get', 'statut_bss'], 'Déclaré'],
            ouvragesGeothermieSurfaceEchangeursFermesDeclareeColor,
            ouvragesGeothermieSurfaceEchangeursFermesRealiseeColor,
          ],
          'icon-opacity': ifHoverElse(0, ouvragesGeothermieSurfaceEchangeursFermesOpacity),
        },
        isVisible: (config) =>
          config.geothermieSurfaceEchangeursFermes.show &&
          (config.geothermieSurfaceEchangeursFermes.showOuvragesDeclares || config.geothermieSurfaceEchangeursFermes.showOuvragesRealises),
        filter: (config) => [
          'in',
          ['get', 'statut_bss'],
          [
            'literal',
            [
              config.geothermieSurfaceEchangeursFermes.showOuvragesDeclares && 'Déclaré',
              config.geothermieSurfaceEchangeursFermes.showOuvragesRealises && 'Réalisé',
            ].filter(Boolean),
          ],
        ],
        popup: PopupOuvrageGeothermieSurface,
      },
      {
        id: 'ouvragesGeothermieSurfaceEchangeursFermes-hover',
        type: 'symbol',
        layout: {
          'icon-image': 'square',
          'icon-overlap': 'always',
          'icon-size': 0.7,
        },
        paint: {
          'icon-color': [
            'case',
            ['==', ['get', 'statut_bss'], 'Déclaré'],
            ouvragesGeothermieSurfaceEchangeursFermesDeclareeColor,
            ouvragesGeothermieSurfaceEchangeursFermesRealiseeColor,
          ],
          'icon-opacity': ifHoverElse(ouvragesGeothermieSurfaceEchangeursFermesOpacity, 0),
        },
        isVisible: (config) =>
          config.geothermieSurfaceEchangeursFermes.show &&
          (config.geothermieSurfaceEchangeursFermes.showOuvragesDeclares || config.geothermieSurfaceEchangeursFermes.showOuvragesRealises),
        filter: (config) => [
          'in',
          ['get', 'statut_bss'],
          [
            'literal',
            [
              config.geothermieSurfaceEchangeursFermes.showOuvragesDeclares && 'Déclaré',
              config.geothermieSurfaceEchangeursFermes.showOuvragesRealises && 'Réalisé',
            ].filter(Boolean),
          ],
        ],
        unselectable: true,
      },
    ],
  },
  {
    sourceId: 'ouvragesGeothermieSurfaceEchangeursOuverts',
    source: {
      type: 'vector',
      tiles: ['/api/map/ouvragesGeothermieSurfaceEchangeursOuverts/{z}/{x}/{y}'],
      minzoom: 5,
      maxzoom: 10,
    },
    layers: [
      {
        id: 'ouvragesGeothermieSurfaceEchangeursOuverts',
        type: 'symbol',
        layout: {
          'icon-image': 'square',
          'icon-overlap': 'always',
          'icon-size': 0.5,
        },
        paint: {
          'icon-color': [
            'case',
            ['==', ['get', 'statut_bss'], 'Déclaré'],
            ouvragesGeothermieSurfaceEchangeursOuvertsDeclareeColor,
            ouvragesGeothermieSurfaceEchangeursOuvertsRealiseeColor,
          ],
          'icon-opacity': ifHoverElse(0, ouvragesGeothermieSurfaceEchangeursOuvertsOpacity),
        },
        isVisible: (config) =>
          config.geothermieSurfaceEchangeursOuverts.show &&
          (config.geothermieSurfaceEchangeursOuverts.showOuvragesDeclares ||
            config.geothermieSurfaceEchangeursOuverts.showOuvragesRealises),
        filter: (config) => [
          'in',
          ['get', 'statut_bss'],
          [
            'literal',
            [
              config.geothermieSurfaceEchangeursOuverts.showOuvragesDeclares && 'Déclaré',
              config.geothermieSurfaceEchangeursOuverts.showOuvragesRealises && 'Réalisé',
            ].filter(Boolean),
          ],
        ],
        popup: PopupOuvrageGeothermieSurface,
      },
      {
        id: 'ouvragesGeothermieSurfaceEchangeursOuverts-hover',
        type: 'symbol',
        layout: {
          'icon-image': 'square',
          'icon-overlap': 'always',
          'icon-size': 0.7,
        },
        paint: {
          'icon-color': [
            'case',
            ['==', ['get', 'statut_bss'], 'Déclaré'],
            ouvragesGeothermieSurfaceEchangeursOuvertsDeclareeColor,
            ouvragesGeothermieSurfaceEchangeursOuvertsRealiseeColor,
          ],
          'icon-opacity': ifHoverElse(ouvragesGeothermieSurfaceEchangeursOuvertsOpacity, 0),
        },
        isVisible: (config) =>
          config.geothermieSurfaceEchangeursOuverts.show &&
          (config.geothermieSurfaceEchangeursOuverts.showOuvragesDeclares ||
            config.geothermieSurfaceEchangeursOuverts.showOuvragesRealises),
        filter: (config) => [
          'in',
          ['get', 'statut_bss'],
          [
            'literal',
            [
              config.geothermieSurfaceEchangeursOuverts.showOuvragesDeclares && 'Déclaré',
              config.geothermieSurfaceEchangeursOuverts.showOuvragesRealises && 'Réalisé',
            ].filter(Boolean),
          ],
        ],
        unselectable: true,
      },
    ],
  },
] as const satisfies ReadonlyArray<MapSourceLayersSpecification>;

type OuvrageGeothermieSurfaceEchangeursFermes = {
  code_bss: string;
  bss_id: string;
  indice_bss: string;
  gmi_decla: null | string;
  gmi_instal: null | string;
  bss_rel: null | string;
  type_rel: TypeRel | null;
  nom_rel: null | string;
  nom_ouv: null | string;
  lib_dossier: null | string;
  nature_ouv: NatureOuv;
  statut_bss: StatutBSS;
  etat_ouv: EtatOuv | null;
  fonct_ouv: FonctOuv | null;
  usage_ouv: UsageOuv | null;
  proced_gth: 'sonde';
  categ_gth: CategGth;
  date_doss: string;
  date_trav: null | string;
  prof_inves: number | null;
  num_region: string;
  num_dpt: string;
  nom_dpt: NomDpt;
  code_insee: string;
  nom_comm: string;
  x_ouv93: number;
  y_ouv93: number;
  longitude: number;
  latitude: number;
  loc_precis: LOCPrecis | null;
  alti_ouv: number | null;
  type_sonde: TypeSonde | null;
  sonde_marq: null | string;
  sonde_mod: null | string;
  sonde_diam: number | null;
  ecarteurs: Ecarteurs | null;
  fluid_type: FluidType | null;
  fluid_kg: number | null;
  cim_marque: null | string;
  cim_compos: null | string;
  tige_injec: TigeInjec | null;
  date_maj: '2025-07-26Z';
  infoterre: null | string;
  recueil: Recueil | null;
};

type OuvrageGeothermieSurfaceEchangeursOuverts = {
  code_bss: string;
  bss_id: string;
  indice_bss: string;
  gmi_decla: null | string;
  gmi_instal: null | string;
  bss_rel: null | string;
  type_rel: TypeRel | null;
  nom_rel: null | string;
  nom_ouv: null | string;
  lib_dossier: null | string;
  nature_ouv: NatureOuv;
  statut_bss: StatutBSS;
  etat_ouv: EtatOuv | null;
  fonct_ouv: FonctOuv | null;
  usage_ouv: null | string;
  proced_gth: 'aquifère';
  categ_gth: CategGth;
  date_doss: string;
  date_trav: null | string;
  prof_inves: number | null;
  prof_access: number | null;
  diam_ouv: number | null;
  num_region: string;
  num_dpt: string;
  nom_dpt: NomDpt;
  code_insee: string;
  nom_comm: string;
  x_ouv93: number;
  y_ouv93: number;
  longitude: number;
  latitude: number;
  loc_precis: LOCPrecis | null;
  alti_ouv: number | null;
  n_pt_aquif: null | string;
  temp_aquif: number | null;
  inj_date: null | string;
  inj_debit: number | null;
  inj_charge: number | null;
  inj_specif: number | null;
  cde_bdlisa: null | string;
  nom_bdlisa: null | string;
  date_maj: '2025-07-26Z';
  infoterre: null | string;
  recueil: Recueil | null;
};

type CategGth = 'Géothermie de minime importance (Textes de loi)' | 'Géothermie < 200m (avant textes de loi GMI)';

type Ecarteurs = 'N' | 'O';

type EtatOuv = 'opérationnel' | 'prévu' | 'non réalisé' | 'rebouché' | 'inconnu' | 'détruit' | 'rebouché partiellement';

type FluidType = 'Eau glycolée' | 'Eau';

type FonctOuv =
  | 'tres-basse-energie'
  | 'surveillance'
  | 'eau, tres-basse-energie'
  | 'geothermie'
  | 'eau'
  | 'exploitation'
  | 'roches-substances'
  | 'basse-energie'
  | 'geologie, tres-basse-energie';

type LOCPrecis = 'M025' | 'M100' | 'M050' | 'M010' | 'C005' | 'M020' | 'M250' | 'M001' | 'M200' | 'M080' | 'M500';

type NatureOuv = 'FORAGE' | 'SONDAGE' | 'TRANCHEE' | 'PUITS' | 'PERTE';

type NomDpt =
  | 'VAL D OISE'
  | 'AVEYRON'
  | 'GIRONDE'
  | 'ISERE'
  | 'HAUTE LOIRE'
  | 'MAINE ET LOIRE'
  | 'HAUTE SAVOIE'
  | 'SAVOIE'
  | 'TARN'
  | 'HAUTE GARONNE'
  | 'MORBIHAN'
  | 'COTES D ARMOR'
  | 'LANDES'
  | 'MANCHE'
  | 'VENDEE'
  | 'FINISTERE'
  | 'NORD'
  | 'VOSGES'
  | 'TARN ET GARONNE'
  | 'SEINE MARITIME'
  | 'ORNE'
  | 'ILLE ET VILAINE'
  | 'AUDE'
  | 'YVELINES'
  | 'LOIRE ATLANTIQUE'
  | 'GARD'
  | 'SAONE ET LOIRE'
  | 'CREUSE'
  | 'CALVADOS'
  | 'HAUTE VIENNE'
  | 'MAYENNE'
  | 'LOIRE'
  | 'BAS RHIN'
  | 'LOZERE'
  | 'DOUBS'
  | 'CHARENTE MARITIME'
  | 'AUBE'
  | 'PYRENEES ORIENTALES'
  | 'HAUT RHIN'
  | 'MEURTHE ET MOSELLE'
  | 'ESSONNE'
  | 'SEINE ET MARNE'
  | 'PYRENEES ATLANTIQUES'
  | 'COTE D OR'
  | 'HERAULT'
  | 'PUY DE DOME'
  | 'LOT'
  | 'BOUCHES DU RHONE'
  | 'EURE ET LOIR'
  | 'MARNE'
  | 'ALLIER'
  | 'RHONE'
  | 'LOIRET'
  | 'INDRE'
  | 'DEUX SEVRES'
  | 'DROME'
  | 'VAUCLUSE'
  | 'DORDOGNE'
  | 'AIN'
  | 'MOSELLE'
  | 'AISNE'
  | 'YONNE'
  | 'NIEVRE'
  | 'JURA'
  | 'PAS DE CALAIS'
  | 'HAUTES ALPES'
  | 'ALPES DE HAUTE PROVENCE'
  | 'CANTAL'
  | 'CORREZE'
  | 'MEUSE'
  | 'OISE'
  | 'ARDECHE'
  | 'LOIR ET CHER'
  | 'HAUTS DE SEINE'
  | 'VAL DE MARNE'
  | 'SOMME'
  | 'HAUTE SAONE'
  | 'PARIS'
  | 'HAUTE MARNE'
  | 'EURE'
  | 'HAUTES PYRENEES'
  | 'INDRE ET LOIRE'
  | 'ALPES MARITIMES'
  | 'SARTHE'
  | 'TERRITOIRE DE BELFORT'
  | 'ARDENNES'
  | 'ARIEGE'
  | 'GERS'
  | 'LOT ET GARONNE'
  | 'CHER'
  | 'SEINE SAINT DENIS'
  | 'VIENNE'
  | 'CHARENTE'
  | 'VAR'
  | 'ALPES-MARITIMES';

type Recueil = 'Portail GMI' | 'BRGM' | 'GESFOR' | 'DREAL' | 'Portail DUPLOS';

type StatutBSS = 'Réalisé' | 'Déclaré';

type TigeInjec = 'Perdue' | 'Retirée';

type TypeRel = 'GTH_SONDE' | 'GTH_AQUIFERE' | 'GTH_SONDE, MTUBE' | 'GEOTECHNIQUE, GTH_SONDE' | 'ADES, GTH_SONDE';

type TypeSonde = 'Indéterminé' | 'Double U' | 'Simple U' | 'Spiralée';

type UsageOuv =
  | 'geothermie-avec-sonde'
  | 'geothermie-avec-sonde, usage-inconnu'
  | 'geothermie-avec-sonde, pas-d-usage'
  | 'pas-d-usage'
  | 'usage-inconnu'
  | 'domestique, geothermie-avec-sonde'
  | 'geothermie-sur-aquifere';
