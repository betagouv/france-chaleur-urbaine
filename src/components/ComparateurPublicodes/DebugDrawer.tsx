import { DottedName } from '@betagouv/france-chaleur-urbaine-publicodes';
import Button from '@codegouvfr/react-dsfr/Button';
import Table from '@codegouvfr/react-dsfr/Table';
import { Drawer, Tooltip, tooltipClasses, TooltipProps } from '@mui/material';
import { utils } from 'publicodes';
import { useState } from 'react';
import styled from 'styled-components';

import Box from '@components/ui/Box';
import Heading from '@components/ui/Heading';
import Icon from '@components/ui/Icon';
import Link from '@components/ui/Link';
import { formatUnit } from '@helpers/publicodes/usePublicodesEngine';
import { clientConfig } from 'src/client-config';

import { modesDeChauffage } from './modes-de-chauffage';
import { type SimulatorEngine } from './useSimulatorEngine';

type DebugDrawerProps = {
  engine: SimulatorEngine;
};

const RuleTooltip = styled(({ className, ...props }: TooltipProps) => <Tooltip {...props} classes={{ popper: className }} />)({
  [`& .${tooltipClasses.tooltip}`]: {
    maxWidth: 'none',
  },
});
const RuleLink = styled(Link)`
  &[target='_blank']::after {
    display: none !important;
  }
`;
const ScrollDrawer = styled(Drawer)`
  & .MuiPaper-root {
    max-width: 100%;
  }
`;
const DebugTable = styled(Table)`
  max-width: 100%;
  overflow-x: auto;

  th:first-child,
  td:first-child {
    position: sticky;
    left: 0;
    z-index: 1;
    background-color: var(--background-alt-grey);
  }

  tbody tr:nth-child(odd) td:first-child {
    background-color: white;
  }
`;

const modesDeChauffageSansGroupeFroid = modesDeChauffage.filter((m) => m.label !== 'Groupe froid');

const DebugDrawer = ({ engine }: DebugDrawerProps) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const serializedSituation = encodeURIComponent(JSON.stringify(engine.getSituation()));

  const roundNumber = (key: DottedName) => {
    const node = engine.getNode(key);
    const value = Math.round(node.nodeValue as number);
    const unit = node.unit ? formatUnit(node.unit) : '';
    return (
      <RuleTooltip title={key}>
        <Box textWrap="nowrap" justifyContent="space-between" display="flex" alignItems="center">
          <span>
            <strong>{value}</strong> <small style={{ color: 'grey' }}>{unit}</small>
          </span>
          <RuleLink
            variant="tertiaryNoOutline"
            href={`${clientConfig.publicodesDocumentationURL}/doc/${utils.encodeRuleName(key)}?situation=${serializedSituation}`}
            isExternal
            px="1w"
          >
            <Icon name="fr-icon-article-line" />
          </RuleLink>
        </Box>
      </RuleTooltip>
    );
  };
  const number = (key: DottedName) => {
    const node = engine.getNode(key);
    const value = Math.round((node.nodeValue as number) * 1000) / 1000;
    const unit = node.unit ? formatUnit(node.unit) : '';
    return (
      <RuleTooltip title={key}>
        <Box textWrap="nowrap" justifyContent="space-between" display="flex" alignItems="center">
          <span>
            <strong>{value}</strong> <small style={{ color: 'grey' }}>{unit}</small>
          </span>
          <RuleLink
            variant="tertiaryNoOutline"
            href={`${clientConfig.publicodesDocumentationURL}/doc/${utils.encodeRuleName(key)}?situation=${serializedSituation}`}
            isExternal
            px="1w"
          >
            <Icon name="fr-icon-article-line" />
          </RuleLink>
        </Box>
      </RuleTooltip>
    );
  };
  const bool = (key: DottedName) => {
    return (
      <RuleTooltip title={key}>
        <Box textWrap="nowrap">
          {engine.getField(key) ? 'oui' : 'non'}{' '}
          <RuleLink
            variant="tertiaryNoOutline"
            href={`${clientConfig.publicodesDocumentationURL}/doc/${utils.encodeRuleName(key)}?situation=${serializedSituation}`}
            isExternal
            px="1w"
          >
            <Icon name="fr-icon-article-line" />
          </RuleLink>
        </Box>
      </RuleTooltip>
    );
  };

  return (
    <>
      <FloatingButton
        onClick={() => setDrawerOpen(true)}
        iconId="ri-table-2"
        style={{ top: '40%', width: '100px', right: '-30px', background: 'grey' }}
      >
        DEBUG
      </FloatingButton>

      <ScrollDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} anchor="right">
        <Button onClick={() => setDrawerOpen(false)}>Fermer</Button>
        {drawerOpen && (
          <Box px="3w" maxWidth="100%">
            <Heading size="h2">Bilan 1an</Heading>

            <DebugTable
              caption="Bilan à 1 an par lgt type / tertiaire chauffage"
              headers={[
                'Installation',
                'P1 abo',
                'P1 conso chaud',
                "P1'",
                'P1 ECS',
                'P1 conso froid',
                'P2',
                'P3',
                'P4',
                'P4 moins aides',
                'Aides',
                'Total sans aides',
                'Total avec aides',
              ]}
              data={modesDeChauffageSansGroupeFroid.map((m) => [
                m.label,
                roundNumber(`Bilan x ${m.coutPublicodeKey} . P1abo`),
                roundNumber(`Bilan x ${m.coutPublicodeKey} . P1conso`),
                roundNumber(`Bilan x ${m.coutPublicodeKey} . P1prime`),
                roundNumber(`Bilan x ${m.coutPublicodeKey} . P1ECS`),
                roundNumber(`Bilan x ${m.coutPublicodeKey} . P1Consofroid`),
                roundNumber(`Bilan x ${m.coutPublicodeKey} . P2`),
                roundNumber(`Bilan x ${m.coutPublicodeKey} . P3`),
                roundNumber(`Bilan x ${m.coutPublicodeKey} . P4`),
                roundNumber(`Bilan x ${m.coutPublicodeKey} . P4 moins aides`),
                roundNumber(`Bilan x ${m.coutPublicodeKey} . aides`),
                roundNumber(`Bilan x ${m.coutPublicodeKey} . total sans aides`),
                roundNumber(`Bilan x ${m.coutPublicodeKey} . total avec aides`),
              ])}
            />

            <Heading size="h2">Calculs économiques</Heading>

            <DebugTable
              caption="Coût d'achat du combustible"
              headers={['Paramètres', 'Part abonnement', 'Part consommation', 'Heures creuses']}
              data={[
                [
                  'Chaleur (RCU)',
                  number("Calcul Eco . Coût d'achat du combustible . Chaleur RCU x Part abonnement"),
                  number("Calcul Eco . Coût d'achat du combustible . Chaleur RCU x Part consommation"),
                ],
                [
                  'Froid (RFU)',
                  number("Calcul Eco . Coût d'achat du combustible . Froid RFU x Part abonnement"),
                  number("Calcul Eco . Coût d'achat du combustible . Froid RFU x Part consommation"),
                ],
                [
                  'Electricité indiv',
                  number("Calcul Eco . Coût d'achat du combustible . Electricité indiv x Part abonnement"),
                  number("Calcul Eco . Coût d'achat du combustible . Electricité indiv x Part consommation HP"),
                  number("Calcul Eco . Coût d'achat du combustible . Electricité indiv x Part consommation HC"),
                ],
                [
                  'Electricité coll',
                  number("Calcul Eco . Coût d'achat du combustible . Electricité coll x Part abonnement"),
                  number("Calcul Eco . Coût d'achat du combustible . Electricité coll x Part consommation"),
                ],
                [
                  'Gaz individuel',
                  number("Calcul Eco . Coût d'achat du combustible . Gaz indiv x Part abonnement"),
                  number("Calcul Eco . Coût d'achat du combustible . Gaz indiv x Part consommation"),
                ],
                [
                  'Gaz collectif',
                  number("Calcul Eco . Coût d'achat du combustible . Gaz coll x Part abonnement"),
                  number("Calcul Eco . Coût d'achat du combustible . Gaz coll x Part consommation"),
                ],
                ['Granulés', '-', number("Calcul Eco . Coût d'achat du combustible . Granulés x Part consommation")],
                ['Fioul', '-', number("Calcul Eco . Coût d'achat du combustible . Fioul x Part consommation")],
              ]}
            />

            <DebugTable
              caption="P4 - Investissement total (sans aide) €TTC"
              headers={[
                'Installation',
                'Investissement équipement total (€)',
                'Investissement équipement par lgt type / tertiaire (€)',
                'Investissement ballon ECS à accumulation (€)',
                'Investissement ballon ECS solaire (panneau inclus) (€)',
                'Total investissement avec ballon  ECS à accumulation (€)',
                'Total investissement ballon ECS solaire (panneaux inclus) (€)',
              ]}
              data={modesDeChauffageSansGroupeFroid.map((m) => [
                m.label,
                roundNumber(`Calcul Eco . ${m.coutPublicodeKey} . Investissement équipement Total`),
                roundNumber(`Calcul Eco . ${m.coutPublicodeKey} . Investissement équipement par logement type tertiaire`),
                roundNumber(`Calcul Eco . ${m.coutPublicodeKey} . Investissement ballon ECS à accumulation`),
                roundNumber(`Calcul Eco . ${m.coutPublicodeKey} . Investissement ballon ECS solaire panneau inclus`),
                roundNumber(`Calcul Eco . ${m.coutPublicodeKey} . Total investissement avec ballon ECS à accumulation`),
                roundNumber(`Calcul Eco . ${m.coutPublicodeKey} . Total investissement ballon ECS solaire panneaux`),
              ])}
            />

            <DebugTable
              caption="P1 - Coût du combustible par lgt type / tertiaire"
              headers={[
                'Installation',
                'Coût du combustible abonnement (P1 abo) €TTC/an',
                'Coût du combustible consommation (P1 conso) €TTC/an',
                "Coût électricité auxilliaire (P1') €TTC/an",
                'Coût combustible pour ballon ECS à accumulation (P1 ECS) €TTC/an',
                'Coût combustible pour ballon ECS solaire (P1 ECS) €TTC/an',
              ]}
              data={modesDeChauffageSansGroupeFroid.map((m) => [
                m.label,
                roundNumber(`Calcul Eco . ${m.coutPublicodeKey} . Coût du combustible abonnement`),
                roundNumber(`Calcul Eco . ${m.coutPublicodeKey} . Coût du combustible consommation`),
                roundNumber(`Calcul Eco . ${m.coutPublicodeKey} . Coût électricité auxiliaire`),
                roundNumber(`Calcul Eco . ${m.coutPublicodeKey} . Coût combustible pour ballon ECS à accumulation`),
                roundNumber(`Calcul Eco . ${m.coutPublicodeKey} . Coût combustible pour ballon ECS solaire`),
              ])}
            />

            <DebugTable
              caption="P2, P3 - Coût de l'entretien"
              headers={[
                'Installation',
                'Petit entretien (P2) €TTC/an',
                'Gros entretien (P3) €TTC/an',
                'Par logement/tertiaire - Petit entretien (P2) €TTC/an',
                'Par logement/tertiaire - Gros entretien (P3) €TTC/an',
              ]}
              data={modesDeChauffageSansGroupeFroid.map((m) => [
                m.label,
                roundNumber(`Calcul Eco . P2 P3 Coût de l'entretien . ${m.coutPublicodeKey} . petit entretien P2`),
                roundNumber(`Calcul Eco . P2 P3 Coût de l'entretien . ${m.coutPublicodeKey} . gros entretien P3`),
                roundNumber(`Calcul Eco . P2 P3 Coût de l'entretien . ${m.coutPublicodeKey} . petit entretien P2 par logement tertiaire`),
                roundNumber(`Calcul Eco . P2 P3 Coût de l'entretien . ${m.coutPublicodeKey} . gros entretien P3 par logement tertiaire`),
              ])}
            />

            <DebugTable
              caption="Montant des aides par logement/tertiaire"
              headers={['Installation', "Ma prime renov' (€)", 'Coup de pouce (€)', 'CEE (€)', 'Coût total des aides (€)']}
              data={[
                ...modesDeChauffageSansGroupeFroid.map((m) => [
                  m.label,
                  roundNumber(`Calcul Eco . Montant des aides par logement tertiaire . ${m.coutPublicodeKey} . Ma prime renov'`),
                  roundNumber(`Calcul Eco . Montant des aides par logement tertiaire . ${m.coutPublicodeKey} . Coup de pouce`),
                  roundNumber(`Calcul Eco . Montant des aides par logement tertiaire . ${m.coutPublicodeKey} . CEE`),
                  roundNumber(`Calcul Eco . Montant des aides par logement tertiaire . ${m.coutPublicodeKey} . Total`),
                ]),
                [
                  'Panneau solaire thermique pour production ECS',
                  roundNumber(
                    "Calcul Eco . Montant des aides par logement tertiaire . Panneau solaire thermique pour production ECS . Ma prime renov'"
                  ),
                  roundNumber(
                    'Calcul Eco . Montant des aides par logement tertiaire . Panneau solaire thermique pour production ECS . Coup de pouce'
                  ),
                  roundNumber(
                    'Calcul Eco . Montant des aides par logement tertiaire . Panneau solaire thermique pour production ECS . CEE'
                  ),
                  roundNumber(
                    'Calcul Eco . Montant des aides par logement tertiaire . Panneau solaire thermique pour production ECS . Total'
                  ),
                ],
              ]}
            />

            <Heading size="h2">Calculs techniques</Heading>

            <DebugTable
              caption="Puissance totale des installations"
              headers={[
                'Installation',
                'Production eau chaude sanitaire ?',
                'Puissance nécessaire équipement chauffage (kW)',
                'Puissance nécessaire pour ECS avec équipement (kW)',
                'Puissance nécessaire pour refroidissement équipement  (kW)',
                'Puissance équipement (kW)',
                'Gamme de puissance existante (kW)',
              ]}
              // impossible de factoriser encore car certaines règles n'existent pas
              // data={modesDeChauffageSansGroupeFroid.map((m) => [
              //   m.label,
              //   roundNumber(`Installation x ${m.emissionsCO2PublicodesKey} . puissance nécessaire équipement chauffage`),
              //   roundNumber(`Installation x ${m.emissionsCO2PublicodesKey} . puissance nécessaire pour ECS avec équipement`),
              //   roundNumber(`Installation x ${m.emissionsCO2PublicodesKey} . puissance nécessaire pour refroidissement équipement`),
              //   roundNumber(`Installation x ${m.emissionsCO2PublicodesKey} . puissance équipement`),
              //   roundNumber(`Installation x ${m.emissionsCO2PublicodesKey} . gamme de puissance existante`),
              // ])}
              data={[
                [
                  'Réseaux de chaleur',
                  bool('Installation x Réseaux de chaleur x Collectif . production eau chaude sanitaire'),
                  roundNumber('Installation x Réseaux de chaleur x Collectif . puissance nécessaire équipement chauffage'),
                  roundNumber('Installation x Réseaux de chaleur x Collectif . puissance nécessaire pour ECS avec équipement'),
                  '',
                  roundNumber('Installation x Réseaux de chaleur x Collectif . puissance équipement'),
                  roundNumber('Installation x Réseaux de chaleur x Collectif . gamme de puissance existante'),
                ],
                [
                  'Réseaux de froid',
                  bool('Installation x Réseaux de froid x Collectif . production eau chaude sanitaire'),
                  '',
                  '',
                  roundNumber('Installation x Réseaux de froid x Collectif . puissance nécessaire pour refroidissement équipement'),
                  roundNumber('Installation x Réseaux de froid x Collectif . puissance équipement'),
                  roundNumber('Installation x Réseaux de froid x Collectif . gamme de puissance existante'),
                ],
                [
                  'Poêle à granulés indiv',
                  bool('Installation x Poêle à granulés indiv x Individuel . production eau chaude sanitaire'),
                  roundNumber('Installation x Poêle à granulés indiv x Individuel . puissance nécessaire équipement chauffage'),
                  '',
                  '',
                  roundNumber('Installation x Poêle à granulés indiv x Individuel . puissance équipement'),
                  roundNumber('Installation x Poêle à granulés indiv x Individuel . gamme de puissance existante'),
                ],
                [
                  'Chaudière à granulés coll',
                  bool('Installation x Chaudière à granulés coll x Collectif . production eau chaude sanitaire'),
                  roundNumber('Installation x Chaudière à granulés coll x Collectif . puissance nécessaire équipement chauffage'),
                  roundNumber('Installation x Chaudière à granulés coll x Collectif . puissance nécessaire pour ECS avec équipement'),
                  '',
                  roundNumber('Installation x Chaudière à granulés coll x Collectif . puissance équipement'),
                  roundNumber('Installation x Chaudière à granulés coll x Collectif . gamme de puissance existante'),
                ],
                [
                  'Gaz indiv avec cond',
                  bool('Installation x Gaz indiv avec cond x Individuel . production eau chaude sanitaire'),
                  roundNumber('Installation x Gaz indiv avec cond x Individuel . puissance nécessaire équipement chauffage'),
                  roundNumber('Installation x Gaz indiv avec cond x Individuel . puissance nécessaire pour ECS avec équipement'),
                  '',
                  roundNumber('Installation x Gaz indiv avec cond x Individuel . puissance équipement'),
                  roundNumber('Installation x Gaz indiv avec cond x Individuel . gamme de puissance existante'),
                ],
                [
                  'Gaz indiv sans cond',
                  bool('Installation x Gaz indiv sans cond x Individuel . production eau chaude sanitaire'),
                  roundNumber('Installation x Gaz indiv sans cond x Individuel . puissance nécessaire équipement chauffage'),
                  roundNumber('Installation x Gaz indiv sans cond x Individuel . puissance nécessaire pour ECS avec équipement'),
                  '',
                  roundNumber('Installation x Gaz indiv sans cond x Individuel . puissance équipement'),
                  roundNumber('Installation x Gaz indiv sans cond x Individuel . gamme de puissance existante'),
                ],
                [
                  'Gaz coll avec cond',
                  bool('Installation x Gaz coll avec cond x Collectif . production eau chaude sanitaire'),
                  roundNumber('Installation x Gaz coll avec cond x Collectif . puissance nécessaire équipement chauffage'),
                  roundNumber('Installation x Gaz coll avec cond x Collectif . puissance nécessaire pour ECS avec équipement'),
                  '',
                  roundNumber('Installation x Gaz coll avec cond x Collectif . puissance équipement'),
                  roundNumber('Installation x Gaz coll avec cond x Collectif . gamme de puissance existante'),
                ],
                [
                  'Gaz coll sans cond',
                  bool('Installation x Gaz coll sans cond x Collectif . production eau chaude sanitaire'),
                  roundNumber('Installation x Gaz coll sans cond x Collectif . puissance nécessaire équipement chauffage'),
                  roundNumber('Installation x Gaz coll sans cond x Collectif . puissance nécessaire pour ECS avec équipement'),
                  '',
                  roundNumber('Installation x Gaz coll sans cond x Collectif . puissance équipement'),
                  roundNumber('Installation x Gaz coll sans cond x Collectif . gamme de puissance existante'),
                ],
                [
                  'Fioul indiv',
                  bool('Installation x Fioul indiv x Individuel . production eau chaude sanitaire'),
                  roundNumber('Installation x Fioul indiv x Individuel . puissance nécessaire équipement chauffage'),
                  roundNumber('Installation x Fioul indiv x Individuel . puissance nécessaire pour ECS avec équipement'),
                  '',
                  roundNumber('Installation x Fioul indiv x Individuel . puissance équipement'),
                  roundNumber('Installation x Fioul indiv x Individuel . gamme de puissance existante'),
                ],
                [
                  'Fioul coll',
                  bool('Installation x Fioul coll x Collectif . production eau chaude sanitaire'),
                  roundNumber('Installation x Fioul coll x Collectif . puissance nécessaire équipement chauffage'),
                  roundNumber('Installation x Fioul coll x Collectif . puissance nécessaire pour ECS avec équipement'),
                  '',
                  roundNumber('Installation x Fioul coll x Collectif . puissance équipement'),
                  roundNumber('Installation x Fioul coll x Collectif . gamme de puissance existante'),
                ],
                [
                  'PAC air/air indiv',
                  bool('Installation x PAC air-air x Individuel . production eau chaude sanitaire'),
                  roundNumber('Installation x PAC air-air x Individuel . puissance nécessaire équipement chauffage'),
                  '',
                  roundNumber('Installation x PAC air-air x Individuel . puissance nécessaire pour refroidissement équipement'),
                  roundNumber('Installation x PAC air-air x Individuel . puissance équipement'),
                  roundNumber('Installation x PAC air-air x Individuel . gamme de puissance existante'),
                ],
                [
                  'PAC air/air collectif/tertiaire',
                  bool('Installation x PAC air-air x Collectif . production eau chaude sanitaire'),
                  roundNumber('Installation x PAC air-air x Collectif . puissance nécessaire équipement chauffage'),
                  '',
                  roundNumber('Installation x PAC air-air x Collectif . puissance nécessaire pour refroidissement équipement'),
                  roundNumber('Installation x PAC air-air x Collectif . puissance équipement'),
                  roundNumber('Installation x PAC air-air x Collectif . gamme de puissance existante'),
                ],
                [
                  'PAC eau/eau indiv',
                  bool('Installation x PAC eau-eau x Individuel . production eau chaude sanitaire'),
                  roundNumber('Installation x PAC eau-eau x Individuel . puissance nécessaire équipement chauffage'),
                  roundNumber('Installation x PAC eau-eau x Individuel . puissance nécessaire pour ECS avec équipement'),
                  '',
                  roundNumber('Installation x PAC eau-eau x Individuel . puissance équipement'),
                  roundNumber('Installation x PAC eau-eau x Individuel . gamme de puissance existante'),
                ],
                [
                  'PAC eau/eau collectif/tertiaire',
                  bool('Installation x PAC eau-eau x Collectif . production eau chaude sanitaire'),
                  roundNumber('Installation x PAC eau-eau x Collectif . puissance nécessaire équipement chauffage'),
                  roundNumber('Installation x PAC eau-eau x Collectif . puissance nécessaire pour ECS avec équipement'),
                  '',
                  roundNumber('Installation x PAC eau-eau x Collectif . puissance équipement'),
                  roundNumber('Installation x PAC eau-eau x Collectif . gamme de puissance existante'),
                ],
                [
                  'PAC air/eau indiv',
                  bool('Installation x PAC air-eau x Individuel . production eau chaude sanitaire'),
                  roundNumber('Installation x PAC air-eau x Individuel . puissance nécessaire équipement chauffage'),
                  roundNumber('Installation x PAC air-eau x Individuel . puissance nécessaire pour ECS avec équipement'),
                  roundNumber('Installation x PAC air-eau x Individuel . puissance nécessaire pour refroidissement équipement'),
                  roundNumber('Installation x PAC air-eau x Individuel . puissance équipement'),
                  roundNumber('Installation x PAC air-eau x Individuel . gamme de puissance existante'),
                ],
                [
                  'PAC air/eau collectif/tertiaire',
                  bool('Installation x PAC air-eau x Collectif . production eau chaude sanitaire'),
                  roundNumber('Installation x PAC air-eau x Collectif . puissance nécessaire équipement chauffage'),
                  roundNumber('Installation x PAC air-eau x Collectif . puissance nécessaire pour ECS avec équipement'),
                  roundNumber('Installation x PAC air-eau x Collectif . puissance nécessaire pour refroidissement équipement'),
                  roundNumber('Installation x PAC air-eau x Collectif . puissance équipement'),
                  roundNumber('Installation x PAC air-eau x Collectif . gamme de puissance existante'),
                ],
                [
                  'Radiateur électrique',
                  bool('Installation x Radiateur électrique x Individuel . production eau chaude sanitaire'),
                  roundNumber('Installation x Radiateur électrique x Individuel . puissance nécessaire équipement chauffage'),
                  '',
                  '',
                  roundNumber('Installation x Radiateur électrique x Individuel . puissance équipement'),
                  roundNumber('Installation x Radiateur électrique x Individuel . gamme de puissance existante'),
                ],
              ]}
            />

            <DebugTable
              caption="Si besoins équipements ECS différenciés"
              headers={[
                'Installation',
                "Besoin d'installation supplémentaire pour produire l'ECS ?",
                'Volume du ballon ECS (L)',
                "Consommation d'électricité (kWh/an)",
                "Appoint d'éléctricité (kWh/an)",
              ]}
              data={modesDeChauffageSansGroupeFroid.map((m) => [
                m.label,
                bool(`Installation x ${m.emissionsCO2PublicodesKey} . besoin d'installation supplémentaire pour produire l'ECS`),
                roundNumber(`Installation x ${m.emissionsCO2PublicodesKey} . volume du ballon ECS`),
                roundNumber(`Installation x ${m.emissionsCO2PublicodesKey} . consommation d'électricité chauffe-eau électrique`),
                roundNumber(`Installation x ${m.emissionsCO2PublicodesKey} . appoint d'électricité chauffe-eau solaire`),
              ])}
            />

            <DebugTable
              caption="Bilan par lgt / tertiaire"
              headers={[
                'Installation',
                'Consommation combustible chaleur',
                'Consommation combustible froid',
                'Consommation auxiliaire (kWh elec/an)',
              ]}
              data={modesDeChauffageSansGroupeFroid.map((m) => [
                m.label,
                roundNumber(`Installation x ${m.emissionsCO2PublicodesKey} . consommation combustible chaleur`),
                roundNumber(`Installation x ${m.emissionsCO2PublicodesKey} . consommation combustible froid`),
                roundNumber(`Installation x ${m.emissionsCO2PublicodesKey} . consommation auxiliaire`),
              ])}
            />

            <DebugTable
              caption="Bilan des consommations par lgt / tertiaire"
              headers={[
                'Installation',
                'Consommation combustible hors électricité',
                "Consommation d'électricité lié au chauffage/refroidissement et à la production d'ECS (kWh/an)",
              ]}
              data={modesDeChauffageSansGroupeFroid.map((m) => [
                m.label,
                roundNumber(`Installation x ${m.emissionsCO2PublicodesKey} . consommation combustible hors électricité`),
                roundNumber(
                  `Installation x ${m.emissionsCO2PublicodesKey} . consommation d'électricité lié au chauffage-refroidissement et à la production d'ECS`
                ),
              ])}
            />

            <Heading size="h2">Calculs environnementaux</Heading>

            <DebugTable
              caption="Calculs environnementaux"
              headers={[
                'Installation',
                "Besoin d'installation supplémentaire pour produire l'ECS ?",
                'Scope 1 - Besoin de chauffage et ECS si même équipement (kgCO2 équ.)',
                'Scope 2 - Auxiliaires et combustible électrique (kgCO2 équ.)',
                'Scope 2 - Ecs solaire thermique',
                'Scope 2 - Eau chaude sanitaire avec ballon électrique',
                'Scope 2 - Total',
                'Scope 3',
                'Total des émissions',
              ]}
              data={modesDeChauffageSansGroupeFroid.map((m) => [
                m.label,
                bool(`Installation x ${m.emissionsCO2PublicodesKey} . besoin d'installation supplémentaire pour produire l'ECS`),
                roundNumber(`env . Installation x ${m.emissionsCO2PublicodesKey} . besoins de chauffage et ECS si même équipement`),
                roundNumber(`env . Installation x ${m.emissionsCO2PublicodesKey} . auxiliaires et combustible électrique`),
                roundNumber(`env . Installation x ${m.emissionsCO2PublicodesKey} . ECS solaire thermique`),
                roundNumber(`env . Installation x ${m.emissionsCO2PublicodesKey} . ECS avec ballon électrique`),
                roundNumber(`env . Installation x ${m.emissionsCO2PublicodesKey} . Scope 2`),
                roundNumber(`env . Installation x ${m.emissionsCO2PublicodesKey} . Scope 3`),
                roundNumber(`env . Installation x ${m.emissionsCO2PublicodesKey} . Total`),
              ])}
            />
          </Box>
        )}
      </ScrollDrawer>
    </>
  );
};
export default DebugDrawer;

export const FloatingButton = styled(Button)`
  position: fixed;
  right: -80px;
  transform: rotate(-90deg);
  justify-content: center;
  width: 200px;
  top: 60%;
  box-shadow: -2px 0 5px rgba(0, 0, 0, 0.5);
  transition: right 0.3s ease;
`;
