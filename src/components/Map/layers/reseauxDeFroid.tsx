import Accordion from '@/components/ui/Accordion';
import Button from '@/components/ui/Button';
import type { ReseauxDeFroidTile } from '@/modules/tiles/server/generation-config';
import { isDefined } from '@/utils/core';
import { prettyFormatNumber } from '@/utils/strings';
import { DownloadNetworkGeometryButton } from '../components/DownloadNetworkGeometryButton';
import { ifHoverElse, type MapSourceLayersSpecification, type PopupStyleHelpers } from './common';
import { buildFiltreGestionnaire, buildFiltreIdentifiantReseau } from './filters';

export const reseauxDeFroidColor = '#0094FF';

export const reseauxDeFroidLayersSpec = [
  {
    layers: [
      {
        filter: (config) => [
          'all',
          ['==', ['get', 'has_trace'], true],
          ...buildFiltreGestionnaire(config.filtreGestionnaire),
          ...buildFiltreIdentifiantReseau(config.filtreIdentifiantReseau),
        ],
        id: 'reseauxDeFroid-avec-trace',
        isVisible: (config) => config.reseauxDeFroid,
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
        paint: {
          'line-color': reseauxDeFroidColor,
          'line-opacity': ['interpolate', ['linear'], ['zoom'], 11, 0.75, 15, 1],
          'line-width': ifHoverElse(3, 2),
        },
        popup: Popup,
        'source-layer': 'coldOutline',
        type: 'line',
      },
      {
        filter: (config) => [
          'all',
          ['==', ['get', 'has_trace'], false],
          ...buildFiltreGestionnaire(config.filtreGestionnaire),
          ...buildFiltreIdentifiantReseau(config.filtreIdentifiantReseau),
        ],
        id: 'reseauxDeFroid-sans-trace',
        isVisible: (config) => config.reseauxDeFroid,
        paint: {
          'circle-color': '#fff',
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 0, 9, ifHoverElse(6, 4), 15, ifHoverElse(12, 10)],
          'circle-stroke-color': reseauxDeFroidColor,
          'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 5, 2, 8, 2, 9, 3, 15, 4],
        },
        popup: Popup,
        'source-layer': 'coldOutline',
        type: 'circle',
      },
    ],
    source: {
      maxzoom: 14,
      tiles: ['/api/map/coldNetwork/{z}/{x}/{y}'],
      type: 'vector',
    },
    sourceId: 'coldNetwork',
  },
] as const satisfies readonly MapSourceLayersSpecification[];

function Popup(reseauDeFroid: ReseauxDeFroidTile, { Property, Title, TwoColumns }: PopupStyleHelpers) {
  return (
    <>
      <Title>{reseauDeFroid.nom_reseau ?? 'Réseau de froid'}</Title>
      <TwoColumns>
        <Property label="Identifiant" value={reseauDeFroid['Identifiant reseau']} />
        <Property label="Gestionnaire" value={reseauDeFroid.Gestionnaire} />
        <Property
          label="Contenu CO2 ACV"
          value={reseauDeFroid['contenu CO2 ACV']}
          formatter={(value) => (isDefined(value) ? `${prettyFormatNumber(value * 1000)} g/kWh` : 'Non connu')}
        />
      </TwoColumns>
      {reseauDeFroid['Identifiant reseau'] && (
        <Button
          priority="secondary"
          full
          iconId="fr-icon-eye-line"
          linkProps={{ href: `/reseaux/${reseauDeFroid['Identifiant reseau']}`, rel: 'noopener noreferrer', target: '_blank' }}
        >
          Voir la fiche du réseau
        </Button>
      )}
      <Accordion label="Informations supplémentaires" simple small>
        <DownloadNetworkGeometryButton
          id_fcu={reseauDeFroid.id_fcu}
          type="reseaux_de_froid"
          networkName={reseauDeFroid.nom_reseau || 'reseau_de_froid'}
        />
      </Accordion>
    </>
  );
}
