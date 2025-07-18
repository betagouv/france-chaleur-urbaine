import Tag from '@codegouvfr/react-dsfr/Tag';
import React from 'react';

import Button from '@/components/ui/Button';
import Tooltip from '@/components/ui/Tooltip';
import { type NetworkSummary } from '@/types/Summary/Network';
import { isDefined } from '@/utils/core';
import { prettyFormatNumber } from '@/utils/strings';

import { defineLayerPopup, ifHoverElse, type MapSourceLayersSpecification } from './common';
import { buildFiltreGestionnaire, buildFiltreIdentifiantReseau, buildReseauxDeChaleurFilters } from './filters';

const Popup = defineLayerPopup<NetworkSummary>((reseauDeChaleur, { Property, Title, TwoColumns }, { hasRole, mapEventBus, pathname }) => {
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
          linkProps={{ href: `/reseaux/${reseauDeChaleur['Identifiant reseau']}`, target: '_blank', rel: 'noopener noreferrer' }}
        >
          Voir la fiche du réseau
        </Button>
      )}
    </>
  );
});

export const reseauDeChaleurClasseColor = '#0D543F';
export const reseauDeChaleurNonClasseColor = '#48A21A';

export const reseauxDeChaleurLayersSpec = [
  {
    sourceId: 'network',
    source: {
      type: 'vector',
      tiles: ['/api/map/network/{z}/{x}/{y}'],
      maxzoom: 14,
    },
    layers: [
      {
        id: 'reseauxDeChaleur-avec-trace',
        type: 'line',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': ['case', ['boolean', ['get', 'reseaux classes']], reseauDeChaleurClasseColor, reseauDeChaleurNonClasseColor],
          'line-width': ifHoverElse(3, 2),
          'line-opacity': ['interpolate', ['linear'], ['zoom'], 11, 0.75, 15, 1],
        },
        filter: (config) => [
          'all',
          ['==', ['get', 'has_trace'], true],
          ...buildReseauxDeChaleurFilters(config.reseauxDeChaleur),
          ...buildFiltreGestionnaire(config.filtreGestionnaire),
          ...buildFiltreIdentifiantReseau(config.filtreIdentifiantReseau),
        ],
        isVisible: (config) => config.reseauxDeChaleur.show,
        popup: Popup,
      },
      {
        id: 'reseauxDeChaleur-sans-trace',
        type: 'circle',
        paint: {
          'circle-stroke-color': [
            'case',
            ['boolean', ['get', 'reseaux classes']],
            reseauDeChaleurClasseColor,
            reseauDeChaleurNonClasseColor,
          ],
          'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 5, 2, 8, 2, 9, 3, 15, 4],
          'circle-color': '#fff',
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 0, 9, ifHoverElse(6, 4), 15, ifHoverElse(12, 10)],
        },
        filter: (config) => [
          'all',
          ['==', ['get', 'has_trace'], false],
          ...buildReseauxDeChaleurFilters(config.reseauxDeChaleur),
          ...buildFiltreGestionnaire(config.filtreGestionnaire),
          ...buildFiltreIdentifiantReseau(config.filtreIdentifiantReseau),
        ],
        isVisible: (config) => config.reseauxDeChaleur.show,
        popup: Popup,
      },
    ],
  },
] as const satisfies ReadonlyArray<MapSourceLayersSpecification>;
