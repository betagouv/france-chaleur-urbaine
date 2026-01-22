import Button from '@/components/ui/Button';

import { defineLayerPopup, ifHoverElse, type MapSourceLayersSpecification } from '../common';

export const installationsGeothermieProfondeLayerColor = '#8400a8';
export const installationsGeothermieProfondeLayerOpacity = 0.8;

const PopupInstallationGeothermieProfonde = defineLayerPopup<InstallationGeothermieProfonde>(
  (installationGeothermieProfonde, { Property, Title, TwoColumns }) => {
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
          <Property label="Source" value="BRGM" />
        </TwoColumns>
        <Button
          priority="tertiary"
          className="fr-mt-1w"
          full
          iconId="fr-icon-eye-line"
          linkProps={{
            href: `https://sybase.brgm.fr/fiche-operation/${installationGeothermieProfonde.Id_du_site}`,
            rel: 'noopener noreferrer',
            target: '_blank',
          }}
        >
          Fiche technique de l'installation
        </Button>
      </>
    );
  }
);

export const installationsGeothermieProfondeLayersSpec = [
  {
    layers: [
      {
        id: 'installations-geothermie-profonde',
        isVisible: (config) => config.geothermieProfonde.show && config.geothermieProfonde.showInstallations,
        paint: {
          'circle-color': installationsGeothermieProfondeLayerColor,
          'circle-opacity': installationsGeothermieProfondeLayerOpacity,
          'circle-radius': ifHoverElse(10, 8),
        },
        popup: PopupInstallationGeothermieProfonde,
        type: 'circle',
      },
    ],
    source: {
      maxzoom: 6,
      minzoom: 5,
      promoteId: 'gid',
    },
    sourceId: 'installations-geothermie-profonde',
  },
] as const satisfies readonly MapSourceLayersSpecification[];

// generated with pnpm cli utils:geojson-to-ts mon-fichier-source.geojson
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
