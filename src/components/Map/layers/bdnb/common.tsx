import type { SourceSpecification } from 'maplibre-gl';
import DPE from '@/components/DPE';
import type { PopupStyleHelpers } from '@/components/Map/layers/common';
import Accordion from '@/components/ui/Accordion';
import Link from '@/components/ui/Link';
import Loader from '@/components/ui/Loader';
import Tooltip from '@/components/ui/Tooltip';
import type { BdnbBatimentTile } from '@/modules/tiles/server/generation-config';
import trpc from '@/modules/trpc/client';
import { isDefined } from '@/utils/core';
import { formatTypeEnergieChauffage } from '@/utils/format';

export const bdnbBatimentsTilesSource = {
  maxzoom: 15,
  minzoom: 12, // inutile en dessous et beaucoup trop gros
  promoteId: 'batiment_groupe_id',
  tiles: ['/api/map/bdnbBatiments/{z}/{x}/{y}'],
  type: 'vector',
} as const satisfies SourceSpecification;

// Fonction wrapper qui ne peut pas utiliser de hook, le composant interne est normal et peut utiliser des hooks
export function BdnbBatimentPopup(caracteristiqueBatiment: BdnbBatimentTile, helpers: PopupStyleHelpers) {
  return <BdnbBatimentPopupContent caracteristiqueBatiment={caracteristiqueBatiment} {...helpers} />;
}

function BdnbBatimentPopupContent({
  caracteristiqueBatiment,
  Property,
  Title,
  TwoColumns,
}: {
  caracteristiqueBatiment: BdnbBatimentTile;
} & PopupStyleHelpers) {
  const {
    data: batimentDetails,
    isLoading,
    error,
  } = trpc.tiles.getBdnbBatimentDetails.useQuery({
    batiment_groupe_id: caracteristiqueBatiment.batiment_groupe_id!,
  });

  if (isLoading) {
    return <Loader />;
  }

  if (error) {
    return <div className="text-red-500">Erreur lors du chargement des détails du bâtiment</div>;
  }

  if (!batimentDetails) {
    return <div>Aucune donnée disponible pour ce bâtiment</div>;
  }

  return (
    <>
      <Title>{batimentDetails.adresse_libelle_adr_principale_ban ?? 'Adresse non connue'}</Title>
      <TwoColumns>
        <Property label="Usage" value={batimentDetails.synthese_propriete_usage} />
        <Property label="Année de construction" value={batimentDetails.ffo_bat_annee_construction} raw />
        <Property label="Nombre de logements" value={batimentDetails.ffo_bat_nb_log} />
        <Property
          label="Chauffage actuel"
          value={batimentDetails.dpe_representatif_logement_type_energie_chauffage}
          formatter={formatTypeEnergieChauffage}
        />
        <Property label="Mode de chauffage" value={batimentDetails.dpe_representatif_logement_type_installation_chauffage} />
        <Property
          label="DPE consommations énergétiques"
          value={caracteristiqueBatiment.dpe_representatif_logement_classe_bilan_dpe}
          formatter={(v) => <DPE classe={`${v}`} />}
        />
        <Property
          label="DPE émissions de gaz à effet de serre"
          value={caracteristiqueBatiment.dpe_representatif_logement_classe_emission_ges}
          formatter={(v) => <DPE classe={`${v}`} />}
        />
        <Property
          label="Surface habitable immeuble"
          value={batimentDetails.dpe_representatif_logement_surface_habitable_immeuble}
          unit="m²"
        />
        {isDefined(batimentDetails.rnc_l_nom_copro) && (
          <Property
            label="Nom copropriété"
            value={batimentDetails.rnc_l_nom_copro}
            tooltip="Donnée issue du Registre National des Copropriétés (2024t2)"
          />
        )}
        {isDefined(batimentDetails.dle_elec_multimillesime_conso_tot) && (
          <>
            <strong>
              Consommation électrique <Tooltip title="Données issues des Données Locales de l'énergie 2023" />
            </strong>{' '}
            <span />
            {batimentDetails.dle_elec_multimillesime_conso_pro != null && batimentDetails.dle_elec_multimillesime_conso_pro > 0 && (
              <Property label="Professionnel" value={batimentDetails.dle_elec_multimillesime_conso_pro} unit="kWh/an" />
            )}
            {batimentDetails.dle_elec_multimillesime_conso_res != null && batimentDetails.dle_elec_multimillesime_conso_res > 0 && (
              <Property label="Résidentiel" value={batimentDetails.dle_elec_multimillesime_conso_res} unit="kWh/an" />
            )}
            {batimentDetails.dle_elec_multimillesime_conso_pro != null &&
              batimentDetails.dle_elec_multimillesime_conso_pro > 0 &&
              batimentDetails.dle_elec_multimillesime_conso_res != null &&
              batimentDetails.dle_elec_multimillesime_conso_res > 0 && (
                <Property label="Total" value={batimentDetails.dle_elec_multimillesime_conso_tot} unit="kWh/an" />
              )}
          </>
        )}
        {isDefined(batimentDetails.dle_gaz_multimillesime_conso_tot) && (
          <>
            <strong>
              Consommation gaz <Tooltip title="Données issues des Données Locales de l'énergie 2022" />
            </strong>{' '}
            <span />
            {batimentDetails.dle_gaz_multimillesime_conso_pro != null && batimentDetails.dle_gaz_multimillesime_conso_pro > 0 && (
              <Property label="Professionnel" value={batimentDetails.dle_gaz_multimillesime_conso_pro} unit="kWh/an" />
            )}
            {batimentDetails.dle_gaz_multimillesime_conso_res != null && batimentDetails.dle_gaz_multimillesime_conso_res > 0 && (
              <Property label="Résidentiel" value={batimentDetails.dle_gaz_multimillesime_conso_res} unit="kWh/an" />
            )}
            {batimentDetails.dle_gaz_multimillesime_conso_pro != null &&
              batimentDetails.dle_gaz_multimillesime_conso_pro > 0 &&
              batimentDetails.dle_gaz_multimillesime_conso_res != null &&
              batimentDetails.dle_gaz_multimillesime_conso_res > 0 && (
                <Property label="Total" value={batimentDetails.dle_gaz_multimillesime_conso_tot} unit="kWh/an" />
              )}
          </>
        )}
        {isDefined(batimentDetails.dle_reseaux_multimillesime_conso_tot) && (
          <>
            <strong>
              Consommation réseaux <Tooltip title="Données issues des Données Locales de l'énergie 2022" />
            </strong>{' '}
            <span />
            {batimentDetails.dle_reseaux_multimillesime_conso_pro != null && batimentDetails.dle_reseaux_multimillesime_conso_pro > 0 && (
              <Property label="Professionnel" value={batimentDetails.dle_reseaux_multimillesime_conso_pro} unit="kWh/an" />
            )}
            {batimentDetails.dle_reseaux_multimillesime_conso_res != null && batimentDetails.dle_reseaux_multimillesime_conso_res > 0 && (
              <Property label="Résidentiel" value={batimentDetails.dle_reseaux_multimillesime_conso_res} unit="kWh/an" />
            )}
            {batimentDetails.dle_reseaux_multimillesime_conso_pro != null &&
              batimentDetails.dle_reseaux_multimillesime_conso_pro > 0 &&
              batimentDetails.dle_reseaux_multimillesime_conso_res != null &&
              batimentDetails.dle_reseaux_multimillesime_conso_res > 0 && (
                <Property label="Total" value={batimentDetails.dle_reseaux_multimillesime_conso_tot} unit="kWh/an" />
              )}
          </>
        )}
      </TwoColumns>

      <Accordion label="Informations supplémentaires" simple small>
        <TwoColumns>
          <Property label="ID du bâtiment" tooltip="ID du groupe de bâtiments dans la BDNB" value={batimentDetails.batiment_groupe_id} />
        </TwoColumns>

        <div className="flex gap-2 py-2">
          <Link variant="secondary" href={`https://gorenove.fr/adresse?id=${batimentDetails.batiment_groupe_id}`} isExternal>
            Go-rénov
          </Link>
          {isDefined(batimentDetails.adresse_cle_interop_adr_principale_ban) && (
            <Link
              variant="secondary"
              href={`https://adresse.data.gouv.fr/carte-base-adresse-nationale?id=${batimentDetails.adresse_cle_interop_adr_principale_ban}`}
              isExternal
            >
              Base Adresse Nationale
            </Link>
          )}
        </div>

        <strong>Constructions</strong>
        <div className="flex flex-col gap-2 py-2">
          {batimentDetails.constructions
            ?.filter((construction) => construction.rnb_id)
            .map((construction) => (
              <Link
                variant="secondary"
                href={`https://rnb.beta.gouv.fr/carte?q=${construction.rnb_id}`}
                key={construction.rnb_id}
                isExternal
              >
                Fiche RNB {construction.rnb_id}
              </Link>
            ))}
        </div>
      </Accordion>
    </>
  );
}
