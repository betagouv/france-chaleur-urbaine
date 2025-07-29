import Link from '@/components/ui/Link';

import { defineLayerPopup, ifHoverElse, type MapSourceLayersSpecification } from '../common';

export const installationsGeothermieSurfaceEchangeursFermesRealiseeColor = '#b96210';
export const installationsGeothermieSurfaceEchangeursFermesDeclareeColor = '#c6c614';
export const installationsGeothermieSurfaceEchangeursFermesOpacity = 0.8;

export const installationsGeothermieSurfaceEchangeursOuvertsRealiseeColor = '#3217f0';
export const installationsGeothermieSurfaceEchangeursOuvertsDeclareeColor = '#17f0f0';
export const installationsGeothermieSurfaceEchangeursOuvertsOpacity = 0.8;

const PopupInstallationGeothermieSurface = defineLayerPopup<
  InstallationGeothermieSurfaceEchangeursFermes | InstallationGeothermieSurfaceEchangeursOuverts
>((installationGeothermieSurface, { Property, Title, TwoColumns }) => {
  return (
    <>
      <Title>Installation géothermie de surface</Title>
      <TwoColumns>
        <Property label="Nom de l'installation" value={installationGeothermieSurface.nom_instal} />
        <Property label="Catégorie réglementaire" value={installationGeothermieSurface.categ_gth} />
        <Property label="Usage(s) de l'énergie produite" value={installationGeothermieSurface.usage_gth} />
        <Property label="Nombre d'ouvrages raccordés" value={installationGeothermieSurface.nombre_ouv} />
        <Property label="Puissance thermique délivrée" value={installationGeothermieSurface.p_pac} unit="kW" />
        <Property label="Statut" value={installationGeothermieSurface.statut_inst} />
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
    </>
  );
});

export const installationsGeothermieSurfaceLayersSpec = [
  {
    sourceId: 'installationsGeothermieSurfaceEchangeursFermes',
    source: {
      type: 'vector',
      tiles: ['/api/map/installationsGeothermieSurfaceEchangeursFermes/{z}/{x}/{y}'],
      minzoom: 5,
      maxzoom: 10,
    },
    layers: [
      {
        id: 'installationsGeothermieSurfaceEchangeursFermes',
        type: 'circle',
        paint: {
          'circle-color': [
            'case',
            ['==', ['get', 'statut_inst'], 'Déclaré'],
            installationsGeothermieSurfaceEchangeursFermesDeclareeColor,
            installationsGeothermieSurfaceEchangeursFermesRealiseeColor,
          ],
          'circle-radius': ifHoverElse(10, 8),
          'circle-opacity': installationsGeothermieSurfaceEchangeursFermesOpacity,
        },
        isVisible: (config) =>
          config.geothermieSurfaceEchangeursFermes.show &&
          (config.geothermieSurfaceEchangeursFermes.showInstallationsDeclarees ||
            config.geothermieSurfaceEchangeursFermes.showInstallationsRealisees),
        filter: (config) => [
          'in',
          ['get', 'statut_inst'],
          [
            'literal',
            [
              config.geothermieSurfaceEchangeursFermes.showInstallationsDeclarees && 'Déclaré',
              config.geothermieSurfaceEchangeursFermes.showInstallationsRealisees && 'Réalisé',
            ].filter(Boolean),
          ],
        ],
        popup: PopupInstallationGeothermieSurface,
      },
    ],
  },
  {
    sourceId: 'installationsGeothermieSurfaceEchangeursOuverts',
    source: {
      type: 'vector',
      tiles: ['/api/map/installationsGeothermieSurfaceEchangeursOuverts/{z}/{x}/{y}'],
      minzoom: 5,
      maxzoom: 10,
    },
    layers: [
      {
        id: 'installationsGeothermieSurfaceEchangeursOuverts',
        type: 'circle',
        paint: {
          'circle-color': [
            'case',
            ['==', ['get', 'statut_inst'], 'Déclaré'],
            installationsGeothermieSurfaceEchangeursOuvertsDeclareeColor,
            installationsGeothermieSurfaceEchangeursOuvertsRealiseeColor,
          ],
          'circle-radius': ifHoverElse(10, 8),
          'circle-opacity': installationsGeothermieSurfaceEchangeursOuvertsOpacity,
        },
        isVisible: (config) =>
          config.geothermieSurfaceEchangeursOuverts.show &&
          (config.geothermieSurfaceEchangeursOuverts.showInstallationsDeclarees ||
            config.geothermieSurfaceEchangeursOuverts.showInstallationsRealisees),
        filter: (config) => [
          'in',
          ['get', 'statut_inst'],
          [
            'literal',
            [
              config.geothermieSurfaceEchangeursOuverts.showInstallationsDeclarees && 'Déclaré',
              config.geothermieSurfaceEchangeursOuverts.showInstallationsRealisees && 'Réalisé',
            ].filter(Boolean),
          ],
        ],
        popup: PopupInstallationGeothermieSurface,
      },
    ],
  },
] as const satisfies ReadonlyArray<MapSourceLayersSpecification>;

type InstallationGeothermieSurfaceEchangeursOuverts = {
  bss_rel: number;
  gmi_instal: null | string;
  nom_instal: null | string;
  gmi_decla: null | string;
  categ_gth: null | string;
  type_inst: 'GTH_AQUIFERE';
  proced_gth: ProcedGth | null;
  usage_gth: null | string;
  desc_inst: null | string;
  nombre_ouv: number;
  statut_inst: StatutInst;
  tvx_date: null | string;
  date_rel: string;
  p_frigo: number | null;
  cop_chaud: number | null;
  cop_froid: number | null;
  p_pac: number | null;
  num_region: string;
  num_dpt: string;
  nom_dpt: string;
  code_insee: string;
  nom_comm: string;
  x_ouv93: number;
  y_ouv93: number;
  alti_inst: number | null;
  recueil: Recueil | null;
  date_extra: '2025-07-23Z';
  puissance_calorifique: number | null;
  taux_couverture: TauxCouverture | null;
  surface: number | null;
  debit_nominal: number | null;
  volume_total: number | null;
  batiment: null | string;
};

type InstallationGeothermieSurfaceEchangeursFermes = {
  bss_rel: number;
  gmi_instal: null | string;
  nom_instal: string;
  gmi_decla: null | string;
  categ_gth: null | string;
  type_inst: 'GTH_SONDE';
  proced_gth: ProcedGth;
  usage_gth: null | string;
  desc_inst: null | string;
  nombre_ouv: number;
  l_sgv_tota: number | null;
  statut_inst: StatutInst;
  tvx_date: null | string;
  date_rel: string;
  p_frigo: number | null;
  cop_chaud: number | null;
  cop_froid: number | null;
  p_pac: number | null;
  num_region: null | string;
  num_dpt: null | string;
  nom_dpt: string | null;
  code_insee: null | string;
  nom_comm: null | string;
  x_ouv93: number;
  y_ouv93: number;
  alti_inst: number | null;
  recueil: Recueil | null;
  date_extra: '2025-07-23Z';
  puissance_calorifique: number | null;
  taux_couverture: TauxCouverture | null;
  surface: number | null;
  batiment: null | string;
};
type ProcedGth = 'sur aquifère' | 'avec sonde';

type Recueil =
  | 'BRGM'
  | 'GESFOR'
  | 'Portail GMI'
  | 'BRGM, Portail GMI'
  | 'BRGM, GESFOR'
  | 'DREAL'
  | 'Portail DUPLOS'
  | 'BRGM, DREAL'
  | 'GESFOR, Portail GMI'
  | 'Portail forage domestique'
  | 'ARS'
  | 'BRGM, Portail DUPLOS'
  | 'CONSEIL REGIONAL'
  | 'Portail DUPLOS, Portail GMI';

type StatutInst = 'Réalisé' | 'Déclaré' | 'Déclaré, Réalisé';

type TauxCouverture = 'Plus de 90%' | 'Entre 50% et 70%' | 'Entre 30% et 50%' | 'Entre 70% et 90%' | 'Moins de 30%';
