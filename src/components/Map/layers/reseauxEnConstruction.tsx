import Tag from '@codegouvfr/react-dsfr/Tag';

import Tooltip from '@/components/ui/Tooltip';
import { type FuturNetworkSummary } from '@/types/Summary/FuturNetwork';

import { defineLayerPopup, ifHoverElse, type MapSourceLayersSpecification } from './common';
import { buildFiltreGestionnaire } from './filters';

const Popup = defineLayerPopup<FuturNetworkSummary>(
  (reseauEnConstruction, { Property, Title, TwoColumns }, { hasRole, mapEventBus, pathname }) => {
    let tags: string[] = [];

    try {
      tags = JSON.parse(reseauEnConstruction.tags);
    } catch {
      tags = ["Tags non affichables, veuillez contacter l'équipe"];
    }
    return (
      <>
        <Title title={`ID FCU: ${reseauEnConstruction.id_fcu}`}>{reseauEnConstruction.nom_reseau ?? 'Réseau en construction'}</Title>
        <TwoColumns>
          <Property label="Gestionnaire" value={reseauEnConstruction.gestionnaire} />
          <Property label="Mise en service" value={reseauEnConstruction.mise_en_service} />
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
      </>
    );
  }
);

export const reseauxEnConstructionColor = '#DA5DD5';
export const reseauxEnConstructionOpacity = 0.47;

export const reseauxEnConstructionLayersSpec = [
  {
    sourceId: 'futurNetwork',
    source: {
      type: 'vector',
      tiles: ['/api/map/futurNetwork/{z}/{x}/{y}'],
      maxzoom: 14,
    },
    layers: [
      {
        id: 'reseauxEnConstruction-zone',
        'source-layer': 'futurOutline',
        type: 'fill',
        paint: {
          'fill-color': reseauxEnConstructionColor,
          'fill-opacity': ifHoverElse(reseauxEnConstructionOpacity + 0.1, reseauxEnConstructionOpacity),
        },
        filter: (config) => ['all', ['==', ['get', 'is_zone'], true], ...buildFiltreGestionnaire(config.filtreGestionnaire)],
        isVisible: (config) => config.reseauxEnConstruction,
        popup: Popup,
      },
      {
        id: 'reseauxEnConstruction-trace',
        'source-layer': 'futurOutline',
        type: 'line',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': reseauxEnConstructionColor,
          'line-opacity': ['interpolate', ['linear'], ['zoom'], 11, 0.75, 15, 1],
          'line-width': ifHoverElse(3, 2),
        },
        filter: (config) => ['all', ['==', ['get', 'is_zone'], false], ...buildFiltreGestionnaire(config.filtreGestionnaire)],
        isVisible: (config) => config.reseauxEnConstruction,
        popup: Popup,
      },
    ],
  },
] as const satisfies ReadonlyArray<MapSourceLayersSpecification>;
