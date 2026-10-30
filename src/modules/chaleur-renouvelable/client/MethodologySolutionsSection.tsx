import type { ReactNode } from 'react';

import TableBasic from '@/components/ui/TableBasic';
import { businessRules } from '@/modules/app/business-rules';

/**
 * Describes the proposed heating solutions and their conditions for each housing type.
 */
export function MethodologySolutionsSection() {
  return (
    <>
      <h2>4. Quelles solutions écologiques sont proposées ?</h2>
      <p>
        Les solutions sont présentées par type de logement et par usage : « Chauffage + eau chaude » et « Eau chaude seulement ». Elles sont
        classées par ordre de pertinence, selon la logique « ENR choix ».
      </p>
      {SOLUTION_GROUPS.map((group) => (
        <section key={group.title}>
          <h3>{group.title}</h3>
          <h4>Chauffage + eau chaude</h4>
          <SolutionsTable caption={`${group.title} : chauffage + eau chaude`} rows={group.heating} showRank={group.showHeatingRank} />
          <p>{group.heatingNote}</p>
          {group.showAltitudeRule && <p>{ALTITUDE_RULE}</p>}
          <h4>Eau chaude seulement</h4>
          <SolutionsTable caption={`${group.title} : eau chaude seulement`} rows={group.hotWater} showRank />
          {group.hotWaterNote && <p>{group.hotWaterNote}</p>}
        </section>
      ))}
      <p>
        Les solutions écartées sont présentées dans « Solutions non compatibles », avec la raison de leur exclusion. Si aucune solution
        n’est adaptée, vous êtes orienté vers un conseiller France Rénov’.
      </p>
    </>
  );
}

type SolutionsTableProps = {
  caption: string;
  rows: readonly {
    rank?: number;
    label: string;
    description: string;
    conditions: ReactNode;
  }[];
  showRank: boolean;
};

/**
 * Renders an accessible DSFR comparison table that fits both the page and the dialog.
 */
function SolutionsTable({ caption, rows, showRank }: SolutionsTableProps) {
  return (
    <TableBasic
      bordered
      noScroll
      layoutFixed
      tableClassName="w-full text-sm [&_th]:align-top [&_td]:align-top [&_th]:px-2 [&_td]:px-2 md:[&_th]:px-4 md:[&_td]:px-4"
    >
      <caption className="sr-only">{caption}</caption>
      <colgroup>
        {showRank && <col className="w-10 md:w-14" />}
        <col className="w-[45%]" />
        <col />
      </colgroup>
      <thead>
        <tr>
          {showRank && <th scope="col">Rang</th>}
          <th scope="col">Solution</th>
          <th scope="col">Conditions pour la proposer</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.label}>
            {showRank && <td className="text-center">{row.rank ?? '—'}</td>}
            <th scope="row" className="font-normal">
              <strong>{row.label}</strong> ({row.description})
            </th>
            <td>{row.conditions}</td>
          </tr>
        ))}
      </tbody>
    </TableBasic>
  );
}

const ALTITUDE_RULE = (
  <>
    La PAC air/eau et la chaudière à bois ont le même niveau de pertinence. Sous{' '}
    {businessRules.fcrHeatingModeAltitudeThresholdMeters.display} d’altitude, ou en zone de protection de l’atmosphère (PPA), la PAC air/eau
    est présentée devant la chaudière à bois. Au-dessus de {businessRules.fcrHeatingModeAltitudeThresholdMeters.display} hors zone de
    protection de l’atmosphère, la chaudière à bois passe devant. En zone de PPA et à plus de{' '}
    {businessRules.fcrHeatingModeAltitudeThresholdMeters.display} d’altitude, les deux solutions sont présentées au même niveau.
  </>
);

const INDIVIDUAL_HOT_WATER_NOTE =
  'Le chauffe-eau thermodynamique est la seule solution proposée quand l’eau chaude est individuelle : il n’est jamais affiché avec les trois autres.';

const getApartmentHotWaterSolutions = (solarOutdoorSpace: string): SolutionsTableProps['rows'] => [
  {
    conditions: `Eau chaude collective · ${solarOutdoorSpace} · couverture solaire de la toiture supérieure à ${businessRules.fcrSolarThermalMinCoveragePercent.display}`,
    description: 'capteurs en toiture qui couvrent une partie des besoins en eau chaude, avec un appoint',
    label: 'Solaire thermique',
    rank: 1,
  },
  {
    conditions: 'Eau chaude collective · jardin ou cour',
    description: 'capteurs en toiture qui alimentent une pompe à chaleur dédiée à l’eau chaude, sans unité extérieure',
    label: 'PAC sur capteurs solaires atmosphériques',
    rank: 2,
  },
  {
    conditions: 'Eau chaude collective · jardin ou cour',
    description: 'capte les calories de l’air extérieur pour chauffer l’eau',
    label: 'PAC air/eau collective dédiée à l’eau chaude',
    rank: 3,
  },
  {
    conditions: 'Eau chaude individuelle · balcon, terrasse ou jardin',
    description: 'produit l’eau chaude de chaque logement à partir de l’air extérieur',
    label: 'Chauffe-eau thermodynamique',
  },
];

const SOLUTION_GROUPS = [
  {
    heating: [
      {
        conditions: (
          <>
            Bâtiment éligible à moins de {businessRules.fcrHeatNetworkMaxDistanceMeters.display} du réseau · radiateurs à eau · aucun refus
            de raccordement identifié.{' '}
            <em>
              Mention « rafraîchissement possible » si un réseau de froid passe à moins de{' '}
              {businessRules.fcrColdNetworkMaxDistanceMeters.display}.
            </em>
          </>
        ),
        description:
          'chaleur majoritairement renouvelable et locale — biomasse, géothermie, chaleur de récupération — distribuée par un réseau géré par un service public',
        label: 'Réseau de chaleur',
        rank: 1,
      },
      {
        conditions: (
          <>
            Jardin ou cour · radiateurs à eau · zone favorable au forage (zonage GMI).{' '}
            <em>La ressource du sous-sol est indiquée à titre informatif.</em>
          </>
        ),
        description: 'capte la chaleur du sous-sol pour produire le chauffage et l’eau chaude',
        label: 'PAC géothermique',
        rank: 2,
      },
      {
        conditions: 'Jardin ou cour pour l’unité extérieure · radiateurs à eau',
        description: 'capte les calories de l’air extérieur pour produire le chauffage et l’eau chaude, en remplacement des chaudières',
        label: 'PAC air/eau collective',
        rank: 3,
      },
      {
        conditions: (
          <>
            Jardin ou cour pour le stockage du combustible · radiateurs à eau.{' '}
            <em>En zone de protection de l’atmosphère : proposée, avec la contrainte signalée.</em>
          </>
        ),
        description: 'chaudière à bûches, granulés ou plaquettes, sous réserve d’un approvisionnement local en bois',
        label: 'Chaudière à bois',
        rank: 3,
      },
      {
        conditions: 'Jardin ou cour · radiateurs à eau',
        description: 'la PAC couvre la majorité des besoins, la chaudière gaz prend le relais les jours les plus froids',
        label: 'Hybride PAC air/eau et chaudière gaz',
        rank: 4,
      },
    ],
    heatingNote:
      'La PAC air/eau et la chaudière à bois ont le même rang : la règle d’altitude décide laquelle s’affiche en premier. Un balcon ou une terrasse ne suffit pour aucune de ces solutions.',
    hotWater: getApartmentHotWaterSolutions('jardin ou cour'),
    hotWaterNote: INDIVIDUAL_HOT_WATER_NOTE,
    showAltitudeRule: true,
    showHeatingRank: true,
    title: 'Immeuble avec chauffage collectif',
  },
  {
    heating: [
      {
        conditions: 'Radiateurs à eau · eau chaude individuelle · balcon, terrasse ou jardin',
        description: 'remplace la chaudière du logement et produit le chauffage et l’eau chaude',
        label: 'PAC air/eau individuelle',
      },
      {
        conditions: 'Radiateurs électriques ou autre émetteur · balcon, terrasse ou jardin',
        description: 'chauffe et peut rafraîchir en été ; l’eau chaude est à prévoir à part',
        label: 'PAC air/air individuelle',
      },
    ],
    heatingNote:
      'Ces deux solutions s’excluent selon le type de radiateurs : elles ne sont jamais affichées ensemble, d’où l’absence de rang.',
    hotWater: getApartmentHotWaterSolutions('balcon, terrasse ou jardin'),
    hotWaterNote: INDIVIDUAL_HOT_WATER_NOTE,
    showAltitudeRule: false,
    showHeatingRank: false,
    title: 'Immeuble avec chauffage individuel',
  },
  {
    heating: [
      {
        conditions: (
          <>
            Jardin · radiateurs à eau · zone favorable au forage (zonage GMI).{' '}
            <em>La ressource du sous-sol est indiquée à titre informatif.</em>
          </>
        ),
        description: 'puise la chaleur du sol pour le chauffage et l’eau chaude, sans unité extérieure visible',
        label: 'PAC géothermique',
        rank: 1,
      },
      {
        conditions: 'Espace extérieur · radiateurs à eau',
        description: 'panneaux solaires qui produisent le chauffage et l’eau chaude, avec un appoint',
        label: 'Système solaire combiné',
        rank: 2,
      },
      {
        conditions: 'Espace extérieur · radiateurs à eau',
        description: 'remplace la chaudière et produit le chauffage et l’eau chaude à partir de l’air extérieur',
        label: 'PAC air/eau',
        rank: 3,
      },
      {
        conditions: (
          <>
            Jardin pour le stockage du combustible · radiateurs à eau.{' '}
            <em>En zone de protection de l’atmosphère : proposée, avec la contrainte signalée.</em>
          </>
        ),
        description: 'chaudière à bûches, granulés ou plaquettes',
        label: 'Chaudière à bois',
        rank: 3,
      },
      {
        conditions: (
          <>
            Espace extérieur pour stocker le bois · eau chaude indépendante du chauffage.{' '}
            <em>En zone de protection de l’atmosphère : réservé aux maisons déjà chauffées au bois.</em>
          </>
        ),
        description: 'poêle, insert ou foyer fermé, en appoint ou pour la pièce de vie',
        label: 'Poêle ou insert à bois',
        rank: 4,
      },
      {
        conditions: 'Espace extérieur · eau chaude indépendante du chauffage',
        description: 'chauffe et peut rafraîchir ; l’eau chaude est à prévoir à part',
        label: 'PAC air/air',
        rank: 5,
      },
    ],
    heatingNote: 'Même règle d’altitude que pour l’immeuble collectif entre la PAC air/eau et la chaudière à bois.',
    hotWater: [
      {
        conditions: `Eau chaude indépendante du chauffage · espace extérieur · couverture solaire de la toiture supérieure à ${businessRules.fcrSolarThermalMinCoveragePercent.display}`,
        description: 'capteurs en toiture, avec un appoint',
        label: 'Solaire thermique',
        rank: 1,
      },
      {
        conditions: 'Eau chaude indépendante du chauffage · espace extérieur',
        description: 'produit l’eau chaude à partir de l’air extérieur',
        label: 'Chauffe-eau thermodynamique',
        rank: 2,
      },
    ],
    hotWaterNote: null,
    showAltitudeRule: true,
    showHeatingRank: true,
    title: 'Maison individuelle',
  },
];
