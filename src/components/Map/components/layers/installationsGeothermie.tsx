import Link from '@/components/ui/Link';

import { ifHoverElse, type PopupStyleHelpers, type MapSourceLayersSpecification } from './common';

export const installationsGeothermieProfondeLayerColor = '#8400a8';
export const installationsGeothermieProfondeLayerOpacity = 0.8;

export const installationsGeothermieSurfaceEchangeursFermesRealiseeColor = '#b96210';
export const installationsGeothermieSurfaceEchangeursFermesDeclareeColor = '#c6c614';
export const installationsGeothermieSurfaceEchangeursFermesOpacity = 0.8;

export const installationsGeothermieSurfaceEchangeursOuvertsRealiseeColor = '#3217f0';
export const installationsGeothermieSurfaceEchangeursOuvertsDeclareeColor = '#17f0f0';
export const installationsGeothermieSurfaceEchangeursOuvertsOpacity = 0.8;

export const installationsGeothermieLayersSpec = [
  {
    sourceId: 'installationsGeothermieProfonde',
    source: {
      type: 'vector',
      tiles: ['/api/map/installationsGeothermieProfonde/{z}/{x}/{y}'],
      minzoom: 5,
      maxzoom: 6,
      promoteId: 'gid',
    },
    layers: [
      {
        id: 'installationsGeothermieProfonde',
        type: 'circle',
        paint: {
          'circle-color': installationsGeothermieProfondeLayerColor,
          'circle-radius': ifHoverElse(10, 8),
          'circle-opacity': installationsGeothermieProfondeLayerOpacity,
        },
        isVisible: (config) => config.installationsGeothermieProfonde,
        popup: PopupInstallationGeothermieProfonde,
      },
    ],
  },
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
        isVisible: (config) => config.installationsGeothermieSurfaceEchangeursFermes,
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
        isVisible: (config) => config.installationsGeothermieSurfaceEchangeursOuverts,
        popup: PopupInstallationGeothermieSurface,
      },
    ],
  },
] as const satisfies ReadonlyArray<MapSourceLayersSpecification>;

function PopupInstallationGeothermieProfonde(
  installationGeothermieProfonde: InstallationGeothermieProfonde,
  { Property, Title, TwoColumns }: PopupStyleHelpers
) {
  return (
    <>
      <Title>{installationGeothermieProfonde.Site}</Title>
      <TwoColumns>
        <Property label="Type" value={installationGeothermieProfonde.Type_exploitation} />
        <Property label="Utilisation" value={installationGeothermieProfonde.Utilisation} />
        <Property
          label="Énergie géothermale annuelle produite "
          value={installationGeothermieProfonde.Energie_géothermale_annuelle_produite}
          unit="MWh"
        />
        <Property
          label="Nombre d'équivalents logement chauffés"
          value={installationGeothermieProfonde.Nombre_équivalents_logements_chauffés}
        />
        <div>
          <Link href={`https://sybase.brgm.fr/fiche-operation/${installationGeothermieProfonde.Id_du_site}`} isExternal>
            Fiche technique de l'installation
          </Link>
        </div>
        <Property label="Source" value="BRGM" />
      </TwoColumns>
    </>
  );
}

function PopupInstallationGeothermieSurface(
  installationGeothermieSurface: InstallationGeothermieSurfaceEchangeursFermes | InstallationGeothermieSurfaceEchangeursOuverts,
  { Property, Title, TwoColumns }: PopupStyleHelpers
) {
  return (
    <>
      <Title>{installationGeothermieSurface.nom_instal}</Title>
      <TwoColumns>
        <Property label="Catégorie réglementaire" value={installationGeothermieSurface.categ_gth} />
        <Property label="Usage(s) de l'énergie produite" value={installationGeothermieSurface.usage_gth} />
        <Property label="Nombre d'ouvrages raccordés" value={installationGeothermieSurface.nombre_ouv} />
        <Property label="Puissance thermique délivrée" value={installationGeothermieSurface.p_pac} unit="kW" />
        <Property label="Statut" value={installationGeothermieSurface.statut_inst} />
        <Property label="Source" value="BRGM" />
      </TwoColumns>
    </>
  );
}

// generated with quicktype -l ts --prefer-unions --prefer-types --prefer-const-values -o types.ts mon-fichier-source.geojson
type InstallationGeothermieProfonde = {
  gid: string;
  Id_du_site: string;
  Site: string;
  Région: Région;
  Département: string;
  nom_departemt: string;
  Commune: string;
  Bassin_sédimentaire: BassinSédimentaire;
  Type_exploitation: TypeExploitation;
  Date_début_exploitation?: Date;
  etat_operation: 'FONCTIONNEMENT';
  Utilisation?: string;
  annee?: string;
  Débit_exploitation_moyen?: string;
  Température_moyennne_réinjection_ou_rejet?: string;
  Energie_géothermale_annuelle_produite?: string;
  Nombre_équivalents_logements_chauffés?: string;
  Taux_couverture_géothermie?: string;
  Présence_PAC?: string;
  Puissance_PAC?: string;
  Puissance_max_délivrée?: string;
  Cogeneration?: Cogeneration;
  Type: 'Profonde';
  geom_2154: string;
  date_maj: Date;
  Hydrocarbures_subsitués?: string;
  Pollution_évitée?: string;
};

type BassinSédimentaire = 'Bassin Parisien' | 'Bassin Aquitain' | 'Bassin parisien' | 'Bassin du Sud-Est' | 'Fossé Rhénan';

type Cogeneration = 'non' | 'oui';

type Région = 'ILE-DE-FRANCE' | 'NOUVELLE-AQUITAINE' | 'OCCITANIE' | 'CENTRE-VAL DE LOIRE' | 'GRAND EST';

type TypeExploitation = 'triplet' | 'doublet' | 'puits unique' | 'quadruplet' | 'multiples producteurs';

type InstallationGeothermieSurfaceEchangeursOuverts = {
  bss_rel: number;
  gmi_instal: null | string;
  nom_instal: null | string;
  gmi_decla: null | string;
  categ_gth: null | string;
  type_inst: 'GTH_AQUIFERE';
  proced_gth: 'sur aquifère' | null;
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
  recueil: string | null;
  date_extra: '2024-11-30Z';
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
  proced_gth: 'avec sonde';
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
  recueil: string | null;
  date_extra: '2024-11-30Z';
  puissance_calorifique: number | null;
  taux_couverture: TauxCouverture | null;
  surface: number | null;
  batiment: null | string;
};

type StatutInst = 'Réalisé' | 'Déclaré' | 'Déclaré, Réalisé';

type TauxCouverture = 'Entre 50% et 70%' | 'Entre 30% et 50%' | 'Plus de 90%' | 'Entre 70% et 90%' | 'Moins de 30%';
