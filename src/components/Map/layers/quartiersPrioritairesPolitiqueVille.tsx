import Button from '@/components/ui/Button';
import Link from '@/components/ui/Link';
import { darken } from '@/utils/color';

import { ifHoverElse, type MapSourceLayersSpecification, type PopupStyleHelpers } from './common';

export const quartiersPrioritairesPolitiqueVille2015anruColor = '#d16d26';
export const quartiersPrioritairesPolitiqueVille2024Color = '#2f5390';
export const quartiersPrioritairesPolitiqueVilleOpacity = 0.3;

export const quartiersPrioritairesPolitiqueVilleLayersSpec = [
  {
    layers: [
      {
        id: 'quartiersPrioritairesPolitiqueVille2015anru',
        isVisible: (config) => config.quartiersPrioritairesPolitiqueVille.show && config.quartiersPrioritairesPolitiqueVille.qpv2015anru,
        paint: {
          'fill-color': ifHoverElse(
            darken(quartiersPrioritairesPolitiqueVille2015anruColor, 40),
            quartiersPrioritairesPolitiqueVille2015anruColor
          ),
          'fill-opacity': quartiersPrioritairesPolitiqueVilleOpacity,
        },
        popup: Popup,
        type: 'fill',
      },
      {
        id: 'quartiersPrioritairesPolitiqueVille2015anru-contour',
        isVisible: (config) => config.quartiersPrioritairesPolitiqueVille.show && config.quartiersPrioritairesPolitiqueVille.qpv2015anru,
        paint: {
          'line-color': quartiersPrioritairesPolitiqueVille2015anruColor,
          'line-width': ifHoverElse(4, 2),
        },
        type: 'line',
        unselectable: true,
      },
    ],
    source: {
      maxzoom: 14,
      tiles: ['/api/map/quartiersPrioritairesPolitiqueVille2015anru/{z}/{x}/{y}'],
      type: 'vector',
    },
    sourceId: 'quartiersPrioritairesPolitiqueVille2015anru',
  },
  {
    layers: [
      {
        id: 'quartiersPrioritairesPolitiqueVille2024',
        isVisible: (config) => config.quartiersPrioritairesPolitiqueVille.show && config.quartiersPrioritairesPolitiqueVille.qpv2024,
        paint: {
          'fill-color': ifHoverElse(darken(quartiersPrioritairesPolitiqueVille2024Color, 40), quartiersPrioritairesPolitiqueVille2024Color),
          'fill-opacity': quartiersPrioritairesPolitiqueVilleOpacity,
        },
        popup: Popup,
        type: 'fill',
      },
      {
        id: 'quartiersPrioritairesPolitiqueVille2024-contour',
        isVisible: (config) => config.quartiersPrioritairesPolitiqueVille.show && config.quartiersPrioritairesPolitiqueVille.qpv2024,
        paint: {
          'line-color': quartiersPrioritairesPolitiqueVille2024Color,
          'line-width': ifHoverElse(4, 2),
        },
        type: 'line',
        unselectable: true,
      },
    ],
    source: {
      maxzoom: 14,
      tiles: ['/api/map/quartiersPrioritairesPolitiqueVille2024/{z}/{x}/{y}'],
      type: 'vector',
    },
    sourceId: 'quartiersPrioritairesPolitiqueVille2024',
  },
] as const satisfies readonly MapSourceLayersSpecification[];

// données 2015 adaptées pour correspondre au format 2024
type QuartierPrioritairePolitiqueVille2024 = {
  code_quartier: string;
  nom_quartier: string;
  is2015?: true;
};

function Popup(qpv: QuartierPrioritairePolitiqueVille2024, { Property, Title, TwoColumns }: PopupStyleHelpers) {
  return (
    <>
      <Title>
        QPV {qpv.is2015 ? 'NPNRU' : '2024'} : {qpv.nom_quartier}
      </Title>
      <TwoColumns>
        <Property label="Code quartier" value={qpv.code_quartier} />
        <Property
          label="Source"
          value={
            <>
              <Link href="https://www.data.gouv.fr/fr/datasets/quartiers-prioritaires-de-la-politique-de-la-ville-qpv/" isExternal>
                ANCT
              </Link>
              {qpv.is2015 && (
                <>
                  {' '}
                  -{' '}
                  <Link href="https://www.anru.fr/" isExternal>
                    ANRU
                  </Link>
                </>
              )}
            </>
          }
        />
      </TwoColumns>
      <Button
        priority="secondary"
        className="fr-mt-1w"
        full
        iconId="fr-icon-eye-line"
        linkProps={{ href: `https://sig.ville.gouv.fr/territoire/${qpv.code_quartier}`, rel: 'noopener noreferrer', target: '_blank' }}
      >
        Voir la fiche SIG-ville
      </Button>
    </>
  );
}
