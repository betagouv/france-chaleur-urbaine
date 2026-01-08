import Tag from '@codegouvfr/react-dsfr/Tag';

import Accordion from '@/components/ui/Accordion';
import Button from '@/components/ui/Button';
import Tooltip from '@/components/ui/Tooltip';
import type { ReseauxDeChaleurTile } from '@/modules/tiles/server/generation-configs/reseaux-de-chaleur';
import { isDefined } from '@/utils/core';
import { prettyFormatNumber } from '@/utils/strings';

import { DownloadNetworkGeometryButton } from '../components/DownloadNetworkGeometryButton';
import { defineLayerPopup, ifHoverElse, type MapSourceLayersSpecification } from './common';
import { buildFiltreGestionnaire, buildFiltreIdentifiantReseau, buildReseauxDeChaleurFilters } from './filters';

const Popup = defineLayerPopup<ReseauxDeChaleurTile>(
  (reseauDeChaleur, { Property, Title, TwoColumns }, { hasRole, mapEventBus, pathname }) => {
    let tags: string[] = [];

    try {
      tags = JSON.parse(reseauDeChaleur.tags);
    } catch {
      tags = ["Tags non affichables, veuillez contacter l'équipe"];
    }
    return (
      <>
        <Title title={`ID FCU: ${reseauDeChaleur.id_fcu}`}>{reseauDeChaleur.nom_reseau ?? 'Réseau de chaleur'}</Title>
        <TwoColumns>
          <Property label="Identifiant" value={reseauDeChaleur['Identifiant reseau']} />
          <Property label="Gestionnaire" value={reseauDeChaleur.Gestionnaire} />
          <Property label="Taux EnR&R" value={reseauDeChaleur['Taux EnR&R']} unit="%" />
          <Property
            label="Contenu CO2 ACV"
            value={reseauDeChaleur['contenu CO2 ACV']}
            formatter={(value) => (isDefined(value) ? `${prettyFormatNumber(value * 1000)} g/kWh` : 'Non connu')}
          />
          {hasRole('admin') && ['/admin/demandes', '/admin/reseaux'].includes(pathname) && (
            <Property
              label={
                <>
                  Tags
                  <Tooltip
                    iconProps={{ className: 'fr-ml-1v' }}
                    title="Pour ajouter un tag à une demande, sélectionnez la dans la liste des demandes, puis cliquez sur un tag ci-dessous
"
                  />
                </>
              }
              value={
                tags.length === 0 ? (
                  'Aucun tag'
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Tag
                        small
                        key={tag}
                        className="cursor-pointer hover:opacity-60"
                        nativeButtonProps={{
                          onClick: (e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            mapEventBus.emit('rdc-add-tag', { tag });
                          },
                        }}
                      >
                        {tag}
                      </Tag>
                    ))}
                  </div>
                )
              }
            />
          )}
        </TwoColumns>
        {reseauDeChaleur['Identifiant reseau'] && (
          <Button
            priority="secondary"
            full
            iconId="fr-icon-eye-line"
            linkProps={{ href: `/reseaux/${reseauDeChaleur['Identifiant reseau']}`, rel: 'noopener noreferrer', target: '_blank' }}
          >
            Voir la fiche du réseau
          </Button>
        )}
        <Accordion label="Informations supplémentaires" simple small>
          <DownloadNetworkGeometryButton
            id_fcu={reseauDeChaleur.id_fcu}
            type="reseaux_de_chaleur"
            networkName={reseauDeChaleur.nom_reseau || 'reseau_de_chaleur'}
          />
        </Accordion>
      </>
    );
  }
);

export const reseauDeChaleurClasseColor = '#0D543F';
export const reseauDeChaleurNonClasseColor = '#48A21A';

export const reseauxDeChaleurLayersSpec = [
  {
    layers: [
      {
        filter: (config) => [
          'all',
          ['==', ['get', 'has_trace'], true],
          ...buildReseauxDeChaleurFilters(config.reseauxDeChaleur),
          ...buildFiltreGestionnaire(config.filtreGestionnaire),
          ...buildFiltreIdentifiantReseau(config.filtreIdentifiantReseau),
        ],
        id: 'reseauxDeChaleur-avec-trace',
        isVisible: (config) => config.reseauxDeChaleur.show,
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
        paint: {
          'line-color': ['case', ['boolean', ['get', 'reseaux classes']], reseauDeChaleurClasseColor, reseauDeChaleurNonClasseColor],
          'line-opacity': ['interpolate', ['linear'], ['zoom'], 11, 0.75, 15, 1],
          'line-width': ifHoverElse(3, 2),
        },
        popup: Popup,
        type: 'line',
      },
      {
        filter: (config) => [
          'all',
          ['==', ['get', 'has_trace'], false],
          ...buildReseauxDeChaleurFilters(config.reseauxDeChaleur),
          ...buildFiltreGestionnaire(config.filtreGestionnaire),
          ...buildFiltreIdentifiantReseau(config.filtreIdentifiantReseau),
        ],
        id: 'reseauxDeChaleur-sans-trace',
        isVisible: (config) => config.reseauxDeChaleur.show,
        paint: {
          'circle-color': '#fff',
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 0, 9, ifHoverElse(6, 4), 15, ifHoverElse(12, 10)],
          'circle-stroke-color': [
            'case',
            ['boolean', ['get', 'reseaux classes']],
            reseauDeChaleurClasseColor,
            reseauDeChaleurNonClasseColor,
          ],
          'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 5, 2, 8, 2, 9, 3, 15, 4],
        },
        popup: Popup,
        type: 'circle',
      },
    ],
    source: {
      maxzoom: 14,
      tiles: ['/api/map/reseauxDeChaleur/{z}/{x}/{y}'],
      type: 'vector',
    },
    sourceId: 'reseauxDeChaleur',
  },
] as const satisfies readonly MapSourceLayersSpecification[];
