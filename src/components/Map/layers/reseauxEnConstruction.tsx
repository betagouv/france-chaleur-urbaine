import Tag from '@codegouvfr/react-dsfr/Tag';

import Accordion from '@/components/ui/Accordion';
import Icon from '@/components/ui/Icon';
import Tooltip from '@/components/ui/Tooltip';
import type { ReseauxEnConstructionTile } from '@/modules/tiles/server/tiles.config';

import { DownloadNetworkGeometryButton } from '../components/DownloadNetworkGeometryButton';
import { defineLayerPopup, ifHoverElse, type MapSourceLayersSpecification } from './common';
import { buildFiltreGestionnaire } from './filters';

const Popup = defineLayerPopup<ReseauxEnConstructionTile>(
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
        {!reseauEnConstruction.ouvert_aux_raccordements && (
          <div className="text-sm">
            <Icon name="ri-lock-2-fill" size="sm" className="mr-1" />
            Ce réseau n'est pas ouvert aux raccordements.
          </div>
        )}
        <div className="text-sm text-gray-500">
          <Icon name="ri-alert-line" size="sm" className="mr-1" />
          Ce tracé est prévisionnel. Le gestionnaire est susceptible
          <br /> de le modifier avant sa mise en service définitive.
        </div>
        <Accordion label="Informations supplémentaires" simple small>
          <DownloadNetworkGeometryButton
            id_fcu={reseauEnConstruction.id_fcu}
            type="zones_et_reseaux_en_construction"
            networkName={reseauEnConstruction.nom_reseau || 'reseau_en_construction'}
          />
        </Accordion>
      </>
    );
  }
);

export const reseauxEnConstructionColor = '#DA5DD5';
export const reseauxEnConstructionOpacity = 0.47;

export const reseauxEnConstructionLayersSpec = [
  {
    layers: [
      {
        filter: (config) => ['all', ['==', ['get', 'is_zone'], true], ...buildFiltreGestionnaire(config.filtreGestionnaire)],
        id: 'reseauxEnConstruction-zone',
        isVisible: (config) => config.reseauxEnConstruction,
        paint: {
          'fill-color': reseauxEnConstructionColor,
          'fill-opacity': ifHoverElse(reseauxEnConstructionOpacity + 0.1, reseauxEnConstructionOpacity),
        },
        popup: Popup,
        type: 'fill',
      },
      {
        filter: (config) => ['all', ['==', ['get', 'is_zone'], false], ...buildFiltreGestionnaire(config.filtreGestionnaire)],
        id: 'reseauxEnConstruction-trace',
        isVisible: (config) => config.reseauxEnConstruction,
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
        paint: {
          'line-color': reseauxEnConstructionColor,
          'line-opacity': ['interpolate', ['linear'], ['zoom'], 11, 0.75, 15, 1],
          'line-width': ifHoverElse(3, 2),
        },
        popup: Popup,
        type: 'line',
      },
    ],
    source: { maxzoom: 14 },
    sourceId: 'reseaux-en-construction',
  },
] as const satisfies readonly MapSourceLayersSpecification[];
