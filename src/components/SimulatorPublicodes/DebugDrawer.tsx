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
`;

const DebugDrawer = ({ engine }: DebugDrawerProps) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const roundNumber = (key: DottedName) => {
    const node = engine.getNode(key);
    const value = Math.round(node.nodeValue as number);
    const unit = node.unit ? formatUnit(node.unit) : '';
    return (
      <RuleTooltip title={key}>
        <Box textWrap="nowrap">
          {value} {unit}{' '}
          <RuleLink variant="tertiaryNoOutline" href={`http://localhost:5173/doc/${utils.encodeRuleName(key)}`} isExternal px="1w">
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
        <Box textWrap="nowrap">
          {value} {unit}{' '}
          <RuleLink variant="tertiaryNoOutline" href={`http://localhost:5173/doc/${utils.encodeRuleName(key)}`} isExternal px="1w">
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
          <RuleLink variant="tertiaryNoOutline" href={`http://localhost:5173/doc/${utils.encodeRuleName(key)}`} isExternal px="1w">
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
                'P1 conso',
                "P1'",
                'P1 ECS',
                'P2',
                'P3',
                'P4',
                'P4 moins aides',
                'Aides',
                'Total sans aides',
                'Total avec aides',
              ]}
              data={[
                [
                  'Réseaux de chaleur',
                  roundNumber('Calcul Eco . Réseaux de chaleur . Coût du combustible abonnement'),
                  roundNumber('Calcul Eco . Réseaux de chaleur . Coût du combustible consommation'),
                  roundNumber('Calcul Eco . Réseaux de chaleur . Coût électricité auxiliaire'),
                  roundNumber('Calcul Eco . Réseaux de chaleur . Coût combustible pour ballon ECS à accumulation'),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . Réseaux de chaleur . petit entretien P2"),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . Réseaux de chaleur . gros entretien P3"),
                  roundNumber('Bilan x Réseaux de chaleur . P4'),
                  roundNumber('Bilan x Réseaux de chaleur . P4 moins aides'),
                  roundNumber('Bilan x Réseaux de chaleur . aides'),
                  roundNumber('Bilan x Réseaux de chaleur . total sans aides'),
                  roundNumber('Bilan x Réseaux de chaleur . total avec aides'),
                ],
                [
                  'Réseaux de froid',
                  roundNumber('Calcul Eco . Réseaux de froid . Coût du combustible abonnement'),
                  roundNumber('Calcul Eco . Réseaux de froid . Coût du combustible consommation'),
                  roundNumber('Calcul Eco . Réseaux de froid . Coût électricité auxiliaire'),
                  roundNumber('Calcul Eco . Réseaux de froid . Coût combustible pour ballon ECS à accumulation'),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . Réseaux de froid . petit entretien P2"),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . Réseaux de froid . gros entretien P3"),
                  roundNumber('Bilan x Réseaux de froid . P4'),
                  roundNumber('Bilan x Réseaux de froid . P4 moins aides'),
                  roundNumber('Bilan x Réseaux de froid . aides'),
                  roundNumber('Bilan x Réseaux de froid . total sans aides'),
                  roundNumber('Bilan x Réseaux de froid . total avec aides'),
                ],
                [
                  'Poêle à granulés indiv',
                  roundNumber('Calcul Eco . Poêle à granulés indiv . Coût du combustible abonnement'),
                  roundNumber('Calcul Eco . Poêle à granulés indiv . Coût du combustible consommation'),
                  roundNumber('Calcul Eco . Poêle à granulés indiv . Coût électricité auxiliaire'),
                  roundNumber('Calcul Eco . Poêle à granulés indiv . Coût combustible pour ballon ECS à accumulation'),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . Poêle à granulés indiv . petit entretien P2"),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . Poêle à granulés indiv . gros entretien P3"),
                  roundNumber('Bilan x Poêle à granulés indiv . P4'),
                  roundNumber('Bilan x Poêle à granulés indiv . P4 moins aides'),
                  roundNumber('Bilan x Poêle à granulés indiv . aides'),
                  roundNumber('Bilan x Poêle à granulés indiv . total sans aides'),
                  roundNumber('Bilan x Poêle à granulés indiv . total avec aides'),
                ],
                [
                  'Chaudière à granulés coll',
                  roundNumber('Calcul Eco . Chaudière à granulés coll . Coût du combustible abonnement'),
                  roundNumber('Calcul Eco . Chaudière à granulés coll . Coût du combustible consommation'),
                  roundNumber('Calcul Eco . Chaudière à granulés coll . Coût électricité auxiliaire'),
                  roundNumber('Calcul Eco . Chaudière à granulés coll . Coût combustible pour ballon ECS à accumulation'),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . Chaudière à granulés coll . petit entretien P2"),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . Chaudière à granulés coll . gros entretien P3"),
                  roundNumber('Bilan x Chaudière à granulés coll . P4'),
                  roundNumber('Bilan x Chaudière à granulés coll . P4 moins aides'),
                  roundNumber('Bilan x Chaudière à granulés coll . aides'),
                  roundNumber('Bilan x Chaudière à granulés coll . total sans aides'),
                  roundNumber('Bilan x Chaudière à granulés coll . total avec aides'),
                ],
                [
                  'Gaz indiv avec cond',
                  roundNumber('Calcul Eco . Gaz indiv avec cond . Coût du combustible abonnement'),
                  roundNumber('Calcul Eco . Gaz indiv avec cond . Coût du combustible consommation'),
                  roundNumber('Calcul Eco . Gaz indiv avec cond . Coût électricité auxiliaire'),
                  roundNumber('Calcul Eco . Gaz indiv avec cond . Coût combustible pour ballon ECS à accumulation'),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . Gaz indiv avec cond . petit entretien P2"),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . Gaz indiv avec cond . gros entretien P3"),
                  roundNumber('Bilan x Gaz indiv avec cond . P4'),
                  roundNumber('Bilan x Gaz indiv avec cond . P4 moins aides'),
                  roundNumber('Bilan x Gaz indiv avec cond . aides'),
                  roundNumber('Bilan x Gaz indiv avec cond . total sans aides'),
                  roundNumber('Bilan x Gaz indiv avec cond . total avec aides'),
                ],
                [
                  'Gaz indiv sans cond',
                  roundNumber('Calcul Eco . Gaz indiv sans cond . Coût du combustible abonnement'),
                  roundNumber('Calcul Eco . Gaz indiv sans cond . Coût du combustible consommation'),
                  roundNumber('Calcul Eco . Gaz indiv sans cond . Coût électricité auxiliaire'),
                  roundNumber('Calcul Eco . Gaz indiv sans cond . Coût combustible pour ballon ECS à accumulation'),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . Gaz indiv sans cond . petit entretien P2"),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . Gaz indiv sans cond . gros entretien P3"),
                  roundNumber('Bilan x Gaz indiv sans cond . P4'),
                  roundNumber('Bilan x Gaz indiv sans cond . P4 moins aides'),
                  roundNumber('Bilan x Gaz indiv sans cond . aides'),
                  roundNumber('Bilan x Gaz indiv sans cond . total sans aides'),
                  roundNumber('Bilan x Gaz indiv sans cond . total avec aides'),
                ],
                [
                  'Gaz coll avec cond',
                  roundNumber('Calcul Eco . Gaz coll avec cond . Coût du combustible abonnement'),
                  roundNumber('Calcul Eco . Gaz coll avec cond . Coût du combustible consommation'),
                  roundNumber('Calcul Eco . Gaz coll avec cond . Coût électricité auxiliaire'),
                  roundNumber('Calcul Eco . Gaz coll avec cond . Coût combustible pour ballon ECS à accumulation'),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . Gaz coll avec cond . petit entretien P2"),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . Gaz coll avec cond . gros entretien P3"),
                  roundNumber('Bilan x Gaz coll avec cond . P4'),
                  roundNumber('Bilan x Gaz coll avec cond . P4 moins aides'),
                  roundNumber('Bilan x Gaz coll avec cond . aides'),
                  roundNumber('Bilan x Gaz coll avec cond . total sans aides'),
                  roundNumber('Bilan x Gaz coll avec cond . total avec aides'),
                ],
                [
                  'Gaz coll sans cond',
                  roundNumber('Calcul Eco . Gaz coll sans cond . Coût du combustible abonnement'),
                  roundNumber('Calcul Eco . Gaz coll sans cond . Coût du combustible consommation'),
                  roundNumber('Calcul Eco . Gaz coll sans cond . Coût électricité auxiliaire'),
                  roundNumber('Calcul Eco . Gaz coll sans cond . Coût combustible pour ballon ECS à accumulation'),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . Gaz coll sans cond . petit entretien P2"),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . Gaz coll sans cond . gros entretien P3"),
                  roundNumber('Bilan x Gaz coll sans cond . P4'),
                  roundNumber('Bilan x Gaz coll sans cond . P4 moins aides'),
                  roundNumber('Bilan x Gaz coll sans cond . aides'),
                  roundNumber('Bilan x Gaz coll sans cond . total sans aides'),
                  roundNumber('Bilan x Gaz coll sans cond . total avec aides'),
                ],
                [
                  'Fioul indiv',
                  roundNumber('Calcul Eco . Fioul indiv . Coût du combustible abonnement'),
                  roundNumber('Calcul Eco . Fioul indiv . Coût du combustible consommation'),
                  roundNumber('Calcul Eco . Fioul indiv . Coût électricité auxiliaire'),
                  roundNumber('Calcul Eco . Fioul indiv . Coût combustible pour ballon ECS à accumulation'),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . Fioul indiv . petit entretien P2"),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . Fioul indiv . gros entretien P3"),
                  roundNumber('Bilan x Fioul indiv . P4'),
                  roundNumber('Bilan x Fioul indiv . P4 moins aides'),
                  roundNumber('Bilan x Fioul indiv . aides'),
                  roundNumber('Bilan x Fioul indiv . total sans aides'),
                  roundNumber('Bilan x Fioul indiv . total avec aides'),
                ],
                [
                  'Fioul coll',
                  roundNumber('Calcul Eco . Fioul coll . Coût du combustible abonnement'),
                  roundNumber('Calcul Eco . Fioul coll . Coût du combustible consommation'),
                  roundNumber('Calcul Eco . Fioul coll . Coût électricité auxiliaire'),
                  roundNumber('Calcul Eco . Fioul coll . Coût combustible pour ballon ECS à accumulation'),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . Fioul coll . petit entretien P2"),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . Fioul coll . gros entretien P3"),
                  roundNumber('Bilan x Fioul coll . P4'),
                  roundNumber('Bilan x Fioul coll . P4 moins aides'),
                  roundNumber('Bilan x Fioul coll . aides'),
                  roundNumber('Bilan x Fioul coll . total sans aides'),
                  roundNumber('Bilan x Fioul coll . total avec aides'),
                ],
                [
                  'PAC air/air indiv',
                  roundNumber('Calcul Eco . PAC air-air indiv . Coût du combustible abonnement'),
                  roundNumber('Calcul Eco . PAC air-air indiv . Coût du combustible consommation'),
                  roundNumber('Calcul Eco . PAC air-air indiv . Coût électricité auxiliaire'),
                  roundNumber('Calcul Eco . PAC air-air indiv . Coût combustible pour ballon ECS à accumulation'),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . PAC air-air indiv . petit entretien P2"),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . PAC air-air indiv . gros entretien P3"),
                  roundNumber('Bilan x PAC air-air indiv . P4'),
                  roundNumber('Bilan x PAC air-air indiv . P4 moins aides'),
                  roundNumber('Bilan x PAC air-air indiv . aides'),
                  roundNumber('Bilan x PAC air-air indiv . total sans aides'),
                  roundNumber('Bilan x PAC air-air indiv . total avec aides'),
                ],
                [
                  'PAC air/air collectif-tertiaire',
                  roundNumber('Calcul Eco . PAC air-air coll . Coût du combustible abonnement'),
                  roundNumber('Calcul Eco . PAC air-air coll . Coût du combustible consommation'),
                  roundNumber('Calcul Eco . PAC air-air coll . Coût électricité auxiliaire'),
                  roundNumber('Calcul Eco . PAC air-air coll . Coût combustible pour ballon ECS à accumulation'),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . PAC air-air coll . petit entretien P2"),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . PAC air-air coll . gros entretien P3"),
                  roundNumber('Bilan x PAC air-air coll . P4'),
                  roundNumber('Bilan x PAC air-air coll . P4 moins aides'),
                  roundNumber('Bilan x PAC air-air coll . aides'),
                  roundNumber('Bilan x PAC air-air coll . total sans aides'),
                  roundNumber('Bilan x PAC air-air coll . total avec aides'),
                ],
                [
                  'PAC eau/eau indiv',
                  roundNumber('Calcul Eco . PAC eau-eau indiv . Coût du combustible abonnement'),
                  roundNumber('Calcul Eco . PAC eau-eau indiv . Coût du combustible consommation'),
                  roundNumber('Calcul Eco . PAC eau-eau indiv . Coût électricité auxiliaire'),
                  roundNumber('Calcul Eco . PAC eau-eau indiv . Coût combustible pour ballon ECS à accumulation'),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . PAC eau-eau indiv . petit entretien P2"),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . PAC eau-eau indiv . gros entretien P3"),
                  roundNumber('Bilan x PAC eau-eau indiv . P4'),
                  roundNumber('Bilan x PAC eau-eau indiv . P4 moins aides'),
                  roundNumber('Bilan x PAC eau-eau indiv . aides'),
                  roundNumber('Bilan x PAC eau-eau indiv . total sans aides'),
                  roundNumber('Bilan x PAC eau-eau indiv . total avec aides'),
                ],
                [
                  'PAC eau/eau collectif-tertiaire',
                  roundNumber('Calcul Eco . PAC eau-eau coll . Coût du combustible abonnement'),
                  roundNumber('Calcul Eco . PAC eau-eau coll . Coût du combustible consommation'),
                  roundNumber('Calcul Eco . PAC eau-eau coll . Coût électricité auxiliaire'),
                  roundNumber('Calcul Eco . PAC eau-eau coll . Coût combustible pour ballon ECS à accumulation'),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . PAC eau-eau coll . petit entretien P2"),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . PAC eau-eau coll . gros entretien P3"),
                  roundNumber('Bilan x PAC eau-eau coll . P4'),
                  roundNumber('Bilan x PAC eau-eau coll . P4 moins aides'),
                  roundNumber('Bilan x PAC eau-eau coll . aides'),
                  roundNumber('Bilan x PAC eau-eau coll . total sans aides'),
                  roundNumber('Bilan x PAC eau-eau coll . total avec aides'),
                ],
                [
                  'PAC air/eau indiv',
                  roundNumber('Calcul Eco . PAC air-eau indiv . Coût du combustible abonnement'),
                  roundNumber('Calcul Eco . PAC air-eau indiv . Coût du combustible consommation'),
                  roundNumber('Calcul Eco . PAC air-eau indiv . Coût électricité auxiliaire'),
                  roundNumber('Calcul Eco . PAC air-eau indiv . Coût combustible pour ballon ECS à accumulation'),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . PAC air-eau indiv . petit entretien P2"),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . PAC air-eau indiv . gros entretien P3"),
                  roundNumber('Bilan x PAC air-eau indiv . P4'),
                  roundNumber('Bilan x PAC air-eau indiv . P4 moins aides'),
                  roundNumber('Bilan x PAC air-eau indiv . aides'),
                  roundNumber('Bilan x PAC air-eau indiv . total sans aides'),
                  roundNumber('Bilan x PAC air-eau indiv . total avec aides'),
                ],
                [
                  'PAC air/eau collectif-tertiaire',
                  roundNumber('Calcul Eco . PAC air-eau coll . Coût du combustible abonnement'),
                  roundNumber('Calcul Eco . PAC air-eau coll . Coût du combustible consommation'),
                  roundNumber('Calcul Eco . PAC air-eau coll . Coût électricité auxiliaire'),
                  roundNumber('Calcul Eco . PAC air-eau coll . Coût combustible pour ballon ECS à accumulation'),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . PAC air-eau coll . petit entretien P2"),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . PAC air-eau coll . gros entretien P3"),
                  roundNumber('Bilan x PAC air-eau coll . P4'),
                  roundNumber('Bilan x PAC air-eau coll . P4 moins aides'),
                  roundNumber('Bilan x PAC air-eau coll . aides'),
                  roundNumber('Bilan x PAC air-eau coll . total sans aides'),
                  roundNumber('Bilan x PAC air-eau coll . total avec aides'),
                ],
                [
                  'Radiateur électrique',
                  roundNumber('Calcul Eco . Radiateur électrique . Coût du combustible abonnement'),
                  roundNumber('Calcul Eco . Radiateur électrique . Coût du combustible consommation'),
                  roundNumber('Calcul Eco . Radiateur électrique . Coût électricité auxiliaire'),
                  roundNumber('Calcul Eco . Radiateur électrique . Coût combustible pour ballon ECS à accumulation'),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . Radiateur électrique . petit entretien P2"),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . Radiateur électrique . gros entretien P3"),
                  roundNumber('Bilan x Radiateur électrique . P4'),
                  roundNumber('Bilan x Radiateur électrique . P4 moins aides'),
                  roundNumber('Bilan x Radiateur électrique . aides'),
                  roundNumber('Bilan x Radiateur électrique . total sans aides'),
                  roundNumber('Bilan x Radiateur électrique . total avec aides'),
                ],
              ]}
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
              data={[
                [
                  'Réseaux de chaleur',
                  roundNumber('Calcul Eco . Réseaux de chaleur . Investissement équipement Total'),
                  roundNumber('Calcul Eco . Réseaux de chaleur . Investissement équipement par logement type tertiaire'),
                  roundNumber('Calcul Eco . Réseaux de chaleur . Investissement ballon ECS à accumulation'),
                  roundNumber('Calcul Eco . Réseaux de chaleur . Investissement ballon ECS solaire panneau inclus'),
                  roundNumber('Calcul Eco . Réseaux de chaleur . Total investissement avec ballon ECS à accumulation'),
                  roundNumber('Calcul Eco . Réseaux de chaleur . Total investissement ballon ECS solaire panneaux'),
                ],
                [
                  'Réseaux de froid',
                  roundNumber('Calcul Eco . Réseaux de froid . Investissement équipement Total'),
                  roundNumber('Calcul Eco . Réseaux de froid . Investissement équipement par logement type tertiaire'),
                  roundNumber('Calcul Eco . Réseaux de froid . Investissement ballon ECS à accumulation'),
                  roundNumber('Calcul Eco . Réseaux de froid . Investissement ballon ECS solaire panneau inclus'),
                  roundNumber('Calcul Eco . Réseaux de froid . Total investissement avec ballon ECS à accumulation'),
                  roundNumber('Calcul Eco . Réseaux de froid . Total investissement ballon ECS solaire panneaux'),
                ],
                [
                  'Poêle à granulés indiv',
                  roundNumber('Calcul Eco . Poêle à granulés indiv . Investissement équipement Total'),
                  roundNumber('Calcul Eco . Poêle à granulés indiv . Investissement équipement par logement type tertiaire'),
                  roundNumber('Calcul Eco . Poêle à granulés indiv . Investissement ballon ECS à accumulation'),
                  roundNumber('Calcul Eco . Poêle à granulés indiv . Investissement ballon ECS solaire panneau inclus'),
                  roundNumber('Calcul Eco . Poêle à granulés indiv . Total investissement avec ballon ECS à accumulation'),
                  roundNumber('Calcul Eco . Poêle à granulés indiv . Total investissement ballon ECS solaire panneaux'),
                ],
                [
                  'Chaudière à granulés coll',
                  roundNumber('Calcul Eco . Chaudière à granulés coll . Investissement équipement Total'),
                  roundNumber('Calcul Eco . Chaudière à granulés coll . Investissement équipement par logement type tertiaire'),
                  roundNumber('Calcul Eco . Chaudière à granulés coll . Investissement ballon ECS à accumulation'),
                  roundNumber('Calcul Eco . Chaudière à granulés coll . Investissement ballon ECS solaire panneau inclus'),
                  roundNumber('Calcul Eco . Chaudière à granulés coll . Total investissement avec ballon ECS à accumulation'),
                  roundNumber('Calcul Eco . Chaudière à granulés coll . Total investissement ballon ECS solaire panneaux'),
                ],
                [
                  'Gaz indiv avec cond',
                  roundNumber('Calcul Eco . Gaz indiv avec cond . Investissement équipement Total'),
                  roundNumber('Calcul Eco . Gaz indiv avec cond . Investissement équipement par logement type tertiaire'),
                  roundNumber('Calcul Eco . Gaz indiv avec cond . Investissement ballon ECS à accumulation'),
                  roundNumber('Calcul Eco . Gaz indiv avec cond . Investissement ballon ECS solaire panneau inclus'),
                  roundNumber('Calcul Eco . Gaz indiv avec cond . Total investissement avec ballon ECS à accumulation'),
                  roundNumber('Calcul Eco . Gaz indiv avec cond . Total investissement ballon ECS solaire panneaux'),
                ],
                [
                  'Gaz indiv sans cond',
                  roundNumber('Calcul Eco . Gaz indiv sans cond . Investissement équipement Total'),
                  roundNumber('Calcul Eco . Gaz indiv sans cond . Investissement équipement par logement type tertiaire'),
                  roundNumber('Calcul Eco . Gaz indiv sans cond . Investissement ballon ECS à accumulation'),
                  roundNumber('Calcul Eco . Gaz indiv sans cond . Investissement ballon ECS solaire panneau inclus'),
                  roundNumber('Calcul Eco . Gaz indiv sans cond . Total investissement avec ballon ECS à accumulation'),
                  roundNumber('Calcul Eco . Gaz indiv sans cond . Total investissement ballon ECS solaire panneaux'),
                ],
                [
                  'Gaz coll avec cond',
                  roundNumber('Calcul Eco . Gaz coll avec cond . Investissement équipement Total'),
                  roundNumber('Calcul Eco . Gaz coll avec cond . Investissement équipement par logement type tertiaire'),
                  roundNumber('Calcul Eco . Gaz coll avec cond . Investissement ballon ECS à accumulation'),
                  roundNumber('Calcul Eco . Gaz coll avec cond . Investissement ballon ECS solaire panneau inclus'),
                  roundNumber('Calcul Eco . Gaz coll avec cond . Total investissement avec ballon ECS à accumulation'),
                  roundNumber('Calcul Eco . Gaz coll avec cond . Total investissement ballon ECS solaire panneaux'),
                ],
                [
                  'Gaz coll sans cond',
                  roundNumber('Calcul Eco . Gaz coll sans cond . Investissement équipement Total'),
                  roundNumber('Calcul Eco . Gaz coll sans cond . Investissement équipement par logement type tertiaire'),
                  roundNumber('Calcul Eco . Gaz coll sans cond . Investissement ballon ECS à accumulation'),
                  roundNumber('Calcul Eco . Gaz coll sans cond . Investissement ballon ECS solaire panneau inclus'),
                  roundNumber('Calcul Eco . Gaz coll sans cond . Total investissement avec ballon ECS à accumulation'),
                  roundNumber('Calcul Eco . Gaz coll sans cond . Total investissement ballon ECS solaire panneaux'),
                ],
                [
                  'Fioul indiv',
                  roundNumber('Calcul Eco . Fioul indiv . Investissement équipement Total'),
                  roundNumber('Calcul Eco . Fioul indiv . Investissement équipement par logement type tertiaire'),
                  roundNumber('Calcul Eco . Fioul indiv . Investissement ballon ECS à accumulation'),
                  roundNumber('Calcul Eco . Fioul indiv . Investissement ballon ECS solaire panneau inclus'),
                  roundNumber('Calcul Eco . Fioul indiv . Total investissement avec ballon ECS à accumulation'),
                  roundNumber('Calcul Eco . Fioul indiv . Total investissement ballon ECS solaire panneaux'),
                ],
                [
                  'Fioul coll',
                  roundNumber('Calcul Eco . Fioul coll . Investissement équipement Total'),
                  roundNumber('Calcul Eco . Fioul coll . Investissement équipement par logement type tertiaire'),
                  roundNumber('Calcul Eco . Fioul coll . Investissement ballon ECS à accumulation'),
                  roundNumber('Calcul Eco . Fioul coll . Investissement ballon ECS solaire panneau inclus'),
                  roundNumber('Calcul Eco . Fioul coll . Total investissement avec ballon ECS à accumulation'),
                  roundNumber('Calcul Eco . Fioul coll . Total investissement ballon ECS solaire panneaux'),
                ],
                [
                  'PAC air/air indiv',
                  roundNumber('Calcul Eco . PAC air-air indiv . Investissement équipement Total'),
                  roundNumber('Calcul Eco . PAC air-air indiv . Investissement équipement par logement type tertiaire'),
                  roundNumber('Calcul Eco . PAC air-air indiv . Investissement ballon ECS à accumulation'),
                  roundNumber('Calcul Eco . PAC air-air indiv . Investissement ballon ECS solaire panneau inclus'),
                  roundNumber('Calcul Eco . PAC air-air indiv . Total investissement avec ballon ECS à accumulation'),
                  roundNumber('Calcul Eco . PAC air-air indiv . Total investissement ballon ECS solaire panneaux'),
                ],
                [
                  'PAC air/air collectif/tertiaire',
                  roundNumber('Calcul Eco . PAC air-air coll . Investissement équipement Total'),
                  roundNumber('Calcul Eco . PAC air-air coll . Investissement équipement par logement type tertiaire'),
                  roundNumber('Calcul Eco . PAC air-air coll . Investissement ballon ECS à accumulation'),
                  roundNumber('Calcul Eco . PAC air-air coll . Investissement ballon ECS solaire panneau inclus'),
                  roundNumber('Calcul Eco . PAC air-air coll . Total investissement avec ballon ECS à accumulation'),
                  roundNumber('Calcul Eco . PAC air-air coll . Total investissement ballon ECS solaire panneaux'),
                ],
                [
                  'PAC eau/eau indiv',
                  roundNumber('Calcul Eco . PAC eau-eau indiv . Investissement équipement Total'),
                  roundNumber('Calcul Eco . PAC eau-eau indiv . Investissement équipement par logement type tertiaire'),
                  roundNumber('Calcul Eco . PAC eau-eau indiv . Investissement ballon ECS à accumulation'),
                  roundNumber('Calcul Eco . PAC eau-eau indiv . Investissement ballon ECS solaire panneau inclus'),
                  roundNumber('Calcul Eco . PAC eau-eau indiv . Total investissement avec ballon ECS à accumulation'),
                  roundNumber('Calcul Eco . PAC eau-eau indiv . Total investissement ballon ECS solaire panneaux'),
                ],
                [
                  'PAC eau/eau collectif/tertiaire',
                  roundNumber('Calcul Eco . PAC eau-eau coll . Investissement équipement Total'),
                  roundNumber('Calcul Eco . PAC eau-eau coll . Investissement équipement par logement type tertiaire'),
                  roundNumber('Calcul Eco . PAC eau-eau coll . Investissement ballon ECS à accumulation'),
                  roundNumber('Calcul Eco . PAC eau-eau coll . Investissement ballon ECS solaire panneau inclus'),
                  roundNumber('Calcul Eco . PAC eau-eau coll . Total investissement avec ballon ECS à accumulation'),
                  roundNumber('Calcul Eco . PAC eau-eau coll . Total investissement ballon ECS solaire panneaux'),
                ],
                [
                  'PAC air/eau indiv',
                  roundNumber('Calcul Eco . PAC air-eau indiv . Investissement équipement Total'),
                  roundNumber('Calcul Eco . PAC air-eau indiv . Investissement équipement par logement type tertiaire'),
                  roundNumber('Calcul Eco . PAC air-eau indiv . Investissement ballon ECS à accumulation'),
                  roundNumber('Calcul Eco . PAC air-eau indiv . Investissement ballon ECS solaire panneau inclus'),
                  roundNumber('Calcul Eco . PAC air-eau indiv . Total investissement avec ballon ECS à accumulation'),
                  roundNumber('Calcul Eco . PAC air-eau indiv . Total investissement ballon ECS solaire panneaux'),
                ],
                [
                  'PAC air/eau collectif/tertiaire',
                  roundNumber('Calcul Eco . PAC air-eau coll . Investissement équipement Total'),
                  roundNumber('Calcul Eco . PAC air-eau coll . Investissement équipement par logement type tertiaire'),
                  roundNumber('Calcul Eco . PAC air-eau coll . Investissement ballon ECS à accumulation'),
                  roundNumber('Calcul Eco . PAC air-eau coll . Investissement ballon ECS solaire panneau inclus'),
                  roundNumber('Calcul Eco . PAC air-eau coll . Total investissement avec ballon ECS à accumulation'),
                  roundNumber('Calcul Eco . PAC air-eau coll . Total investissement ballon ECS solaire panneaux'),
                ],
                [
                  'Radiateur électrique',
                  roundNumber('Calcul Eco . Radiateur électrique . Investissement équipement Total'),
                  roundNumber('Calcul Eco . Radiateur électrique . Investissement équipement par logement type tertiaire'),
                  roundNumber('Calcul Eco . Radiateur électrique . Investissement ballon ECS à accumulation'),
                  roundNumber('Calcul Eco . Radiateur électrique . Investissement ballon ECS solaire panneau inclus'),
                  roundNumber('Calcul Eco . Radiateur électrique . Total investissement avec ballon ECS à accumulation'),
                  roundNumber('Calcul Eco . Radiateur électrique . Total investissement ballon ECS solaire panneaux'),
                ],
              ]}
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
              data={[
                [
                  'Réseaux de chaleur',
                  roundNumber('Calcul Eco . Réseaux de chaleur . Coût du combustible abonnement'),
                  roundNumber('Calcul Eco . Réseaux de chaleur . Coût du combustible consommation'),
                  roundNumber('Calcul Eco . Réseaux de chaleur . Coût électricité auxiliaire'),
                  roundNumber('Calcul Eco . Réseaux de chaleur . Coût combustible pour ballon ECS à accumulation'),
                  roundNumber('Calcul Eco . Réseaux de chaleur . Coût combustible pour ballon ECS solaire'),
                ],
                [
                  'Réseaux de froid',
                  roundNumber('Calcul Eco . Réseaux de froid . Coût du combustible abonnement'),
                  roundNumber('Calcul Eco . Réseaux de froid . Coût du combustible consommation'),
                  roundNumber('Calcul Eco . Réseaux de froid . Coût électricité auxiliaire'),
                  roundNumber('Calcul Eco . Réseaux de froid . Coût combustible pour ballon ECS à accumulation'),
                  roundNumber('Calcul Eco . Réseaux de froid . Coût combustible pour ballon ECS solaire'),
                ],
                [
                  'Poêle à granulés indiv',
                  roundNumber('Calcul Eco . Poêle à granulés indiv . Coût du combustible abonnement'),
                  roundNumber('Calcul Eco . Poêle à granulés indiv . Coût du combustible consommation'),
                  roundNumber('Calcul Eco . Poêle à granulés indiv . Coût électricité auxiliaire'),
                  roundNumber('Calcul Eco . Poêle à granulés indiv . Coût combustible pour ballon ECS à accumulation'),
                  roundNumber('Calcul Eco . Poêle à granulés indiv . Coût combustible pour ballon ECS solaire'),
                ],
                [
                  'Chaudière à granulés coll',
                  roundNumber('Calcul Eco . Chaudière à granulés coll . Coût du combustible abonnement'),
                  roundNumber('Calcul Eco . Chaudière à granulés coll . Coût du combustible consommation'),
                  roundNumber('Calcul Eco . Chaudière à granulés coll . Coût électricité auxiliaire'),
                  roundNumber('Calcul Eco . Chaudière à granulés coll . Coût combustible pour ballon ECS à accumulation'),
                  roundNumber('Calcul Eco . Chaudière à granulés coll . Coût combustible pour ballon ECS solaire'),
                ],
                [
                  'Gaz indiv avec cond',
                  roundNumber('Calcul Eco . Gaz indiv avec cond . Coût du combustible abonnement'),
                  roundNumber('Calcul Eco . Gaz indiv avec cond . Coût du combustible consommation'),
                  roundNumber('Calcul Eco . Gaz indiv avec cond . Coût électricité auxiliaire'),
                  roundNumber('Calcul Eco . Gaz indiv avec cond . Coût combustible pour ballon ECS à accumulation'),
                  roundNumber('Calcul Eco . Gaz indiv avec cond . Coût combustible pour ballon ECS solaire'),
                ],
                [
                  'Gaz indiv sans cond',
                  roundNumber('Calcul Eco . Gaz indiv sans cond . Coût du combustible abonnement'),
                  roundNumber('Calcul Eco . Gaz indiv sans cond . Coût du combustible consommation'),
                  roundNumber('Calcul Eco . Gaz indiv sans cond . Coût électricité auxiliaire'),
                  roundNumber('Calcul Eco . Gaz indiv sans cond . Coût combustible pour ballon ECS à accumulation'),
                  roundNumber('Calcul Eco . Gaz indiv sans cond . Coût combustible pour ballon ECS solaire'),
                ],
                [
                  'Gaz coll avec cond',
                  roundNumber('Calcul Eco . Gaz coll avec cond . Coût du combustible abonnement'),
                  roundNumber('Calcul Eco . Gaz coll avec cond . Coût du combustible consommation'),
                  roundNumber('Calcul Eco . Gaz coll avec cond . Coût électricité auxiliaire'),
                  roundNumber('Calcul Eco . Gaz coll avec cond . Coût combustible pour ballon ECS à accumulation'),
                  roundNumber('Calcul Eco . Gaz coll avec cond . Coût combustible pour ballon ECS solaire'),
                ],
                [
                  'Gaz coll sans cond',
                  roundNumber('Calcul Eco . Gaz coll sans cond . Coût du combustible abonnement'),
                  roundNumber('Calcul Eco . Gaz coll sans cond . Coût du combustible consommation'),
                  roundNumber('Calcul Eco . Gaz coll sans cond . Coût électricité auxiliaire'),
                  roundNumber('Calcul Eco . Gaz coll sans cond . Coût combustible pour ballon ECS à accumulation'),
                  roundNumber('Calcul Eco . Gaz coll sans cond . Coût combustible pour ballon ECS solaire'),
                ],
                [
                  'Fioul indiv',
                  roundNumber('Calcul Eco . Fioul indiv . Coût du combustible abonnement'),
                  roundNumber('Calcul Eco . Fioul indiv . Coût du combustible consommation'),
                  roundNumber('Calcul Eco . Fioul indiv . Coût électricité auxiliaire'),
                  roundNumber('Calcul Eco . Fioul indiv . Coût combustible pour ballon ECS à accumulation'),
                  roundNumber('Calcul Eco . Fioul indiv . Coût combustible pour ballon ECS solaire'),
                ],
                [
                  'Fioul coll',
                  roundNumber('Calcul Eco . Fioul coll . Coût du combustible abonnement'),
                  roundNumber('Calcul Eco . Fioul coll . Coût du combustible consommation'),
                  roundNumber('Calcul Eco . Fioul coll . Coût électricité auxiliaire'),
                  roundNumber('Calcul Eco . Fioul coll . Coût combustible pour ballon ECS à accumulation'),
                  roundNumber('Calcul Eco . Fioul coll . Coût combustible pour ballon ECS solaire'),
                ],
                [
                  'PAC air/air indiv',
                  roundNumber('Calcul Eco . PAC air-air indiv . Coût du combustible abonnement'),
                  roundNumber('Calcul Eco . PAC air-air indiv . Coût du combustible consommation'),
                  roundNumber('Calcul Eco . PAC air-air indiv . Coût électricité auxiliaire'),
                  roundNumber('Calcul Eco . PAC air-air indiv . Coût combustible pour ballon ECS à accumulation'),
                  roundNumber('Calcul Eco . PAC air-air indiv . Coût combustible pour ballon ECS solaire'),
                ],
                [
                  'PAC air/air collectif-tertiaire',
                  roundNumber('Calcul Eco . PAC air-air coll . Coût du combustible abonnement'),
                  roundNumber('Calcul Eco . PAC air-air coll . Coût du combustible consommation'),
                  roundNumber('Calcul Eco . PAC air-air coll . Coût électricité auxiliaire'),
                  roundNumber('Calcul Eco . PAC air-air coll . Coût combustible pour ballon ECS à accumulation'),
                  roundNumber('Calcul Eco . PAC air-air coll . Coût combustible pour ballon ECS solaire'),
                ],
                [
                  'PAC eau/eau indiv',
                  roundNumber('Calcul Eco . PAC eau-eau indiv . Coût du combustible abonnement'),
                  roundNumber('Calcul Eco . PAC eau-eau indiv . Coût du combustible consommation'),
                  roundNumber('Calcul Eco . PAC eau-eau indiv . Coût électricité auxiliaire'),
                  roundNumber('Calcul Eco . PAC eau-eau indiv . Coût combustible pour ballon ECS à accumulation'),
                  roundNumber('Calcul Eco . PAC eau-eau indiv . Coût combustible pour ballon ECS solaire'),
                ],
                [
                  'PAC eau/eau collectif-tertiaire',
                  roundNumber('Calcul Eco . PAC eau-eau coll . Coût du combustible abonnement'),
                  roundNumber('Calcul Eco . PAC eau-eau coll . Coût du combustible consommation'),
                  roundNumber('Calcul Eco . PAC eau-eau coll . Coût électricité auxiliaire'),
                  roundNumber('Calcul Eco . PAC eau-eau coll . Coût combustible pour ballon ECS à accumulation'),
                  roundNumber('Calcul Eco . PAC eau-eau coll . Coût combustible pour ballon ECS solaire'),
                ],
                [
                  'PAC air/eau indiv',
                  roundNumber('Calcul Eco . PAC air-eau indiv . Coût du combustible abonnement'),
                  roundNumber('Calcul Eco . PAC air-eau indiv . Coût du combustible consommation'),
                  roundNumber('Calcul Eco . PAC air-eau indiv . Coût électricité auxiliaire'),
                  roundNumber('Calcul Eco . PAC air-eau indiv . Coût combustible pour ballon ECS à accumulation'),
                  roundNumber('Calcul Eco . PAC air-eau indiv . Coût combustible pour ballon ECS solaire'),
                ],
                [
                  'PAC air/eau collectif-tertiaire',
                  roundNumber('Calcul Eco . PAC air-eau coll . Coût du combustible abonnement'),
                  roundNumber('Calcul Eco . PAC air-eau coll . Coût du combustible consommation'),
                  roundNumber('Calcul Eco . PAC air-eau coll . Coût électricité auxiliaire'),
                  roundNumber('Calcul Eco . PAC air-eau coll . Coût combustible pour ballon ECS à accumulation'),
                  roundNumber('Calcul Eco . PAC air-eau coll . Coût combustible pour ballon ECS solaire'),
                ],
                [
                  'Radiateur électrique',
                  roundNumber('Calcul Eco . Radiateur électrique . Coût du combustible abonnement'),
                  roundNumber('Calcul Eco . Radiateur électrique . Coût du combustible consommation'),
                  roundNumber('Calcul Eco . Radiateur électrique . Coût électricité auxiliaire'),
                  roundNumber('Calcul Eco . Radiateur électrique . Coût combustible pour ballon ECS à accumulation'),
                  roundNumber('Calcul Eco . Radiateur électrique . Coût combustible pour ballon ECS solaire'),
                ],
              ]}
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
              data={[
                [
                  'Réseaux de chaleur',
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . Réseaux de chaleur . petit entretien P2"),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . Réseaux de chaleur . gros entretien P3"),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . Réseaux de chaleur . petit entretien P2 par logement tertiaire"),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . Réseaux de chaleur . gros entretien P3 par logement tertiaire"),
                ],
                [
                  'Réseaux de froid',
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . Réseaux de froid . petit entretien P2"),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . Réseaux de froid . gros entretien P3"),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . Réseaux de froid . petit entretien P2 par logement tertiaire"),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . Réseaux de froid . gros entretien P3 par logement tertiaire"),
                ],
                [
                  'Poêle à granulés indiv',
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . Poêle à granulés indiv . petit entretien P2"),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . Poêle à granulés indiv . gros entretien P3"),
                  roundNumber(
                    "Calcul Eco . P2 P3 Coût de l'entretien . Poêle à granulés indiv . petit entretien P2 par logement tertiaire"
                  ),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . Poêle à granulés indiv . gros entretien P3 par logement tertiaire"),
                ],
                [
                  'Chaudière à granulés coll',
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . Chaudière à granulés coll . petit entretien P2"),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . Chaudière à granulés coll . gros entretien P3"),
                  roundNumber(
                    "Calcul Eco . P2 P3 Coût de l'entretien . Chaudière à granulés coll . petit entretien P2 par logement tertiaire"
                  ),
                  roundNumber(
                    "Calcul Eco . P2 P3 Coût de l'entretien . Chaudière à granulés coll . gros entretien P3 par logement tertiaire"
                  ),
                ],
                [
                  'Gaz indiv avec cond',
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . Gaz indiv avec cond . petit entretien P2"),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . Gaz indiv avec cond . gros entretien P3"),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . Gaz indiv avec cond . petit entretien P2 par logement tertiaire"),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . Gaz indiv avec cond . gros entretien P3 par logement tertiaire"),
                ],
                [
                  'Gaz indiv sans cond',
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . Gaz indiv sans cond . petit entretien P2"),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . Gaz indiv sans cond . gros entretien P3"),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . Gaz indiv sans cond . petit entretien P2 par logement tertiaire"),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . Gaz indiv sans cond . gros entretien P3 par logement tertiaire"),
                ],
                [
                  'Gaz coll avec cond',
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . Gaz coll avec cond . petit entretien P2"),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . Gaz coll avec cond . gros entretien P3"),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . Gaz coll avec cond . petit entretien P2 par logement tertiaire"),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . Gaz coll avec cond . gros entretien P3 par logement tertiaire"),
                ],
                [
                  'Gaz coll sans cond',
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . Gaz coll sans cond . petit entretien P2"),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . Gaz coll sans cond . gros entretien P3"),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . Gaz coll sans cond . petit entretien P2 par logement tertiaire"),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . Gaz coll sans cond . gros entretien P3 par logement tertiaire"),
                ],
                [
                  'Fioul indiv',
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . Fioul indiv . petit entretien P2"),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . Fioul indiv . gros entretien P3"),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . Fioul indiv . petit entretien P2 par logement tertiaire"),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . Fioul indiv . gros entretien P3 par logement tertiaire"),
                ],
                [
                  'Fioul coll',
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . Fioul coll . petit entretien P2"),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . Fioul coll . gros entretien P3"),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . Fioul coll . petit entretien P2 par logement tertiaire"),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . Fioul coll . gros entretien P3 par logement tertiaire"),
                ],
                [
                  'PAC air/air indiv',
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . PAC air-air indiv . petit entretien P2"),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . PAC air-air indiv . gros entretien P3"),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . PAC air-air indiv . petit entretien P2 par logement tertiaire"),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . PAC air-air indiv . gros entretien P3 par logement tertiaire"),
                ],
                [
                  'PAC air/air collectif/tertiaire',
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . PAC air-air coll . petit entretien P2"),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . PAC air-air coll . gros entretien P3"),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . PAC air-air coll . petit entretien P2 par logement tertiaire"),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . PAC air-air coll . gros entretien P3 par logement tertiaire"),
                ],
                [
                  'PAC eau/eau indiv',
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . PAC eau-eau indiv . petit entretien P2"),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . PAC eau-eau indiv . gros entretien P3"),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . PAC eau-eau indiv . petit entretien P2 par logement tertiaire"),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . PAC eau-eau indiv . gros entretien P3 par logement tertiaire"),
                ],
                [
                  'PAC eau/eau collectif/tertiaire',
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . PAC eau-eau coll . petit entretien P2"),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . PAC eau-eau coll . gros entretien P3"),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . PAC eau-eau coll . petit entretien P2 par logement tertiaire"),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . PAC eau-eau coll . gros entretien P3 par logement tertiaire"),
                ],
                [
                  'PAC air/eau indiv',
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . PAC air-eau indiv . petit entretien P2"),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . PAC air-eau indiv . gros entretien P3"),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . PAC air-eau indiv . petit entretien P2 par logement tertiaire"),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . PAC air-eau indiv . gros entretien P3 par logement tertiaire"),
                ],
                [
                  'PAC air/eau collectif/tertiaire',
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . PAC air-eau coll . petit entretien P2"),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . PAC air-eau coll . gros entretien P3"),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . PAC air-eau coll . petit entretien P2 par logement tertiaire"),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . PAC air-eau coll . gros entretien P3 par logement tertiaire"),
                ],
                [
                  'Radiateur électrique',
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . Radiateur électrique . petit entretien P2"),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . Radiateur électrique . gros entretien P3"),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . Radiateur électrique . petit entretien P2 par logement tertiaire"),
                  roundNumber("Calcul Eco . P2 P3 Coût de l'entretien . Radiateur électrique . gros entretien P3 par logement tertiaire"),
                ],
              ]}
            />

            <DebugTable
              caption="Montant des aides par logement/tertiaire"
              headers={['Installation', "Ma prime renov' (€)", 'Coup de pouce (€)', 'CEE (€)', 'Coût total des aides (€)']}
              data={[
                [
                  'Réseaux de chaleur',
                  roundNumber("Calcul Eco . Montant des aides par logement tertiaire . Réseaux de chaleur . Ma prime renov'"),
                  roundNumber('Calcul Eco . Montant des aides par logement tertiaire . Réseaux de chaleur . Coup de pouce'),
                  roundNumber('Calcul Eco . Montant des aides par logement tertiaire . Réseaux de chaleur . CEE'),
                  roundNumber('Calcul Eco . Montant des aides par logement tertiaire . Réseaux de chaleur . Total'),
                ],
                [
                  'Réseaux de froid',
                  roundNumber("Calcul Eco . Montant des aides par logement tertiaire . Réseaux de froid . Ma prime renov'"),
                  roundNumber('Calcul Eco . Montant des aides par logement tertiaire . Réseaux de froid . Coup de pouce'),
                  roundNumber('Calcul Eco . Montant des aides par logement tertiaire . Réseaux de froid . CEE'),
                  roundNumber('Calcul Eco . Montant des aides par logement tertiaire . Réseaux de froid . Total'),
                ],
                [
                  'Poêle à granulés indiv',
                  roundNumber("Calcul Eco . Montant des aides par logement tertiaire . Poêle à granulés indiv . Ma prime renov'"),
                  roundNumber('Calcul Eco . Montant des aides par logement tertiaire . Poêle à granulés indiv . Coup de pouce'),
                  roundNumber('Calcul Eco . Montant des aides par logement tertiaire . Poêle à granulés indiv . CEE'),
                  roundNumber('Calcul Eco . Montant des aides par logement tertiaire . Poêle à granulés indiv . Total'),
                ],
                [
                  'Chaudière à granulés coll',
                  roundNumber("Calcul Eco . Montant des aides par logement tertiaire . Chaudière à granulés coll . Ma prime renov'"),
                  roundNumber('Calcul Eco . Montant des aides par logement tertiaire . Chaudière à granulés coll . Coup de pouce'),
                  roundNumber('Calcul Eco . Montant des aides par logement tertiaire . Chaudière à granulés coll . CEE'),
                  roundNumber('Calcul Eco . Montant des aides par logement tertiaire . Chaudière à granulés coll . Total'),
                ],
                [
                  'Gaz indiv avec cond',
                  roundNumber("Calcul Eco . Montant des aides par logement tertiaire . Gaz indiv avec cond . Ma prime renov'"),
                  roundNumber('Calcul Eco . Montant des aides par logement tertiaire . Gaz indiv avec cond . Coup de pouce'),
                  roundNumber('Calcul Eco . Montant des aides par logement tertiaire . Gaz indiv avec cond . CEE'),
                  roundNumber('Calcul Eco . Montant des aides par logement tertiaire . Gaz indiv avec cond . Total'),
                ],
                [
                  'Gaz indiv sans cond',
                  roundNumber("Calcul Eco . Montant des aides par logement tertiaire . Gaz indiv sans cond . Ma prime renov'"),
                  roundNumber('Calcul Eco . Montant des aides par logement tertiaire . Gaz indiv sans cond . Coup de pouce'),
                  roundNumber('Calcul Eco . Montant des aides par logement tertiaire . Gaz indiv sans cond . CEE'),
                  roundNumber('Calcul Eco . Montant des aides par logement tertiaire . Gaz indiv sans cond . Total'),
                ],
                [
                  'Gaz coll avec cond',
                  roundNumber("Calcul Eco . Montant des aides par logement tertiaire . Gaz coll avec cond . Ma prime renov'"),
                  roundNumber('Calcul Eco . Montant des aides par logement tertiaire . Gaz coll avec cond . Coup de pouce'),
                  roundNumber('Calcul Eco . Montant des aides par logement tertiaire . Gaz coll avec cond . CEE'),
                  roundNumber('Calcul Eco . Montant des aides par logement tertiaire . Gaz coll avec cond . Total'),
                ],
                [
                  'Gaz coll sans cond',
                  roundNumber("Calcul Eco . Montant des aides par logement tertiaire . Gaz coll sans cond . Ma prime renov'"),
                  roundNumber('Calcul Eco . Montant des aides par logement tertiaire . Gaz coll sans cond . Coup de pouce'),
                  roundNumber('Calcul Eco . Montant des aides par logement tertiaire . Gaz coll sans cond . CEE'),
                  roundNumber('Calcul Eco . Montant des aides par logement tertiaire . Gaz coll sans cond . Total'),
                ],
                [
                  'Fioul indiv',
                  roundNumber("Calcul Eco . Montant des aides par logement tertiaire . Fioul indiv . Ma prime renov'"),
                  roundNumber('Calcul Eco . Montant des aides par logement tertiaire . Fioul indiv . Coup de pouce'),
                  roundNumber('Calcul Eco . Montant des aides par logement tertiaire . Fioul indiv . CEE'),
                  roundNumber('Calcul Eco . Montant des aides par logement tertiaire . Fioul indiv . Total'),
                ],
                [
                  'Fioul coll',
                  roundNumber("Calcul Eco . Montant des aides par logement tertiaire . Fioul coll . Ma prime renov'"),
                  roundNumber('Calcul Eco . Montant des aides par logement tertiaire . Fioul coll . Coup de pouce'),
                  roundNumber('Calcul Eco . Montant des aides par logement tertiaire . Fioul coll . CEE'),
                  roundNumber('Calcul Eco . Montant des aides par logement tertiaire . Fioul coll . Total'),
                ],
                [
                  'PAC air/air indiv',
                  roundNumber("Calcul Eco . Montant des aides par logement tertiaire . PAC air-air indiv . Ma prime renov'"),
                  roundNumber('Calcul Eco . Montant des aides par logement tertiaire . PAC air-air indiv . Coup de pouce'),
                  roundNumber('Calcul Eco . Montant des aides par logement tertiaire . PAC air-air indiv . CEE'),
                  roundNumber('Calcul Eco . Montant des aides par logement tertiaire . PAC air-air indiv . Total'),
                ],
                [
                  'PAC air/air collectif-tertiaire',
                  roundNumber("Calcul Eco . Montant des aides par logement tertiaire . PAC air-air coll . Ma prime renov'"),
                  roundNumber('Calcul Eco . Montant des aides par logement tertiaire . PAC air-air coll . Coup de pouce'),
                  roundNumber('Calcul Eco . Montant des aides par logement tertiaire . PAC air-air coll . CEE'),
                  roundNumber('Calcul Eco . Montant des aides par logement tertiaire . PAC air-air coll . Total'),
                ],
                [
                  'PAC eau/eau indiv',
                  roundNumber("Calcul Eco . Montant des aides par logement tertiaire . PAC eau-eau indiv . Ma prime renov'"),
                  roundNumber('Calcul Eco . Montant des aides par logement tertiaire . PAC eau-eau indiv . Coup de pouce'),
                  roundNumber('Calcul Eco . Montant des aides par logement tertiaire . PAC eau-eau indiv . CEE'),
                  roundNumber('Calcul Eco . Montant des aides par logement tertiaire . PAC eau-eau indiv . Total'),
                ],
                [
                  'PAC eau/eau collectif-tertiaire',
                  roundNumber("Calcul Eco . Montant des aides par logement tertiaire . PAC eau-eau coll . Ma prime renov'"),
                  roundNumber('Calcul Eco . Montant des aides par logement tertiaire . PAC eau-eau coll . Coup de pouce'),
                  roundNumber('Calcul Eco . Montant des aides par logement tertiaire . PAC eau-eau coll . CEE'),
                  roundNumber('Calcul Eco . Montant des aides par logement tertiaire . PAC eau-eau coll . Total'),
                ],
                [
                  'PAC air/eau indiv',
                  roundNumber("Calcul Eco . Montant des aides par logement tertiaire . PAC air-eau indiv . Ma prime renov'"),
                  roundNumber('Calcul Eco . Montant des aides par logement tertiaire . PAC air-eau indiv . Coup de pouce'),
                  roundNumber('Calcul Eco . Montant des aides par logement tertiaire . PAC air-eau indiv . CEE'),
                  roundNumber('Calcul Eco . Montant des aides par logement tertiaire . PAC air-eau indiv . Total'),
                ],
                [
                  'PAC air/eau collectif-tertiaire',
                  roundNumber("Calcul Eco . Montant des aides par logement tertiaire . PAC air-eau coll . Ma prime renov'"),
                  roundNumber('Calcul Eco . Montant des aides par logement tertiaire . PAC air-eau coll . Coup de pouce'),
                  roundNumber('Calcul Eco . Montant des aides par logement tertiaire . PAC air-eau coll . CEE'),
                  roundNumber('Calcul Eco . Montant des aides par logement tertiaire . PAC air-eau coll . Total'),
                ],
                [
                  'Radiateur électrique',
                  roundNumber("Calcul Eco . Montant des aides par logement tertiaire . Radiateur électrique . Ma prime renov'"),
                  roundNumber('Calcul Eco . Montant des aides par logement tertiaire . Radiateur électrique . Coup de pouce'),
                  roundNumber('Calcul Eco . Montant des aides par logement tertiaire . Radiateur électrique . CEE'),
                  roundNumber('Calcul Eco . Montant des aides par logement tertiaire . Radiateur électrique . Total'),
                ],
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
              data={[
                [
                  'Réseaux de chaleur',
                  bool("Installation x Réseaux de chaleur x Collectif . besoin d'installation supplémentaire pour produire l'ECS"),
                  roundNumber('Installation x Réseaux de chaleur x Collectif . volume du ballon ECS'),
                  roundNumber("Installation x Réseaux de chaleur x Collectif . consommation d'électricité chauffe-eau électrique"),
                  roundNumber("Installation x Réseaux de chaleur x Collectif . appoint d'électricité chauffe-eau solaire"),
                ],
                [
                  'Réseaux de froid',
                  bool("Installation x Réseaux de froid x Collectif . besoin d'installation supplémentaire pour produire l'ECS"),
                  roundNumber('Installation x Réseaux de froid x Collectif . volume du ballon ECS'),
                  roundNumber("Installation x Réseaux de froid x Collectif . consommation d'électricité chauffe-eau électrique"),
                  roundNumber("Installation x Réseaux de froid x Collectif . appoint d'électricité chauffe-eau solaire"),
                ],
                [
                  'Poêle à granulés indiv',
                  bool("Installation x Poêle à granulés indiv x Individuel . besoin d'installation supplémentaire pour produire l'ECS"),
                  roundNumber('Installation x Poêle à granulés indiv x Individuel . volume du ballon ECS'),
                  roundNumber("Installation x Poêle à granulés indiv x Individuel . consommation d'électricité chauffe-eau électrique"),
                  roundNumber("Installation x Poêle à granulés indiv x Individuel . appoint d'électricité chauffe-eau solaire"),
                ],
                [
                  'Chaudière à granulés coll',
                  bool("Installation x Chaudière à granulés coll x Collectif . besoin d'installation supplémentaire pour produire l'ECS"),
                  roundNumber('Installation x Chaudière à granulés coll x Collectif . volume du ballon ECS'),
                  roundNumber("Installation x Chaudière à granulés coll x Collectif . consommation d'électricité chauffe-eau électrique"),
                  roundNumber("Installation x Chaudière à granulés coll x Collectif . appoint d'électricité chauffe-eau solaire"),
                ],
                [
                  'Gaz indiv avec cond',
                  bool("Installation x Gaz indiv avec cond x Individuel . besoin d'installation supplémentaire pour produire l'ECS"),
                  roundNumber('Installation x Gaz indiv avec cond x Individuel . volume du ballon ECS'),
                  roundNumber("Installation x Gaz indiv avec cond x Individuel . consommation d'électricité chauffe-eau électrique"),
                  roundNumber("Installation x Gaz indiv avec cond x Individuel . appoint d'électricité chauffe-eau solaire"),
                ],
                [
                  'Gaz indiv sans cond',
                  bool("Installation x Gaz indiv sans cond x Individuel . besoin d'installation supplémentaire pour produire l'ECS"),
                  roundNumber('Installation x Gaz indiv sans cond x Individuel . volume du ballon ECS'),
                  roundNumber("Installation x Gaz indiv sans cond x Individuel . consommation d'électricité chauffe-eau électrique"),
                  roundNumber("Installation x Gaz indiv sans cond x Individuel . appoint d'électricité chauffe-eau solaire"),
                ],
                [
                  'Gaz coll avec cond',
                  bool("Installation x Gaz coll avec cond x Collectif . besoin d'installation supplémentaire pour produire l'ECS"),
                  roundNumber('Installation x Gaz coll avec cond x Collectif . volume du ballon ECS'),
                  roundNumber("Installation x Gaz coll avec cond x Collectif . consommation d'électricité chauffe-eau électrique"),
                  roundNumber("Installation x Gaz coll avec cond x Collectif . appoint d'électricité chauffe-eau solaire"),
                ],
                [
                  'Gaz coll sans cond',
                  bool("Installation x Gaz coll sans cond x Collectif . besoin d'installation supplémentaire pour produire l'ECS"),
                  roundNumber('Installation x Gaz coll sans cond x Collectif . volume du ballon ECS'),
                  roundNumber("Installation x Gaz coll sans cond x Collectif . consommation d'électricité chauffe-eau électrique"),
                  roundNumber("Installation x Gaz coll sans cond x Collectif . appoint d'électricité chauffe-eau solaire"),
                ],
                [
                  'Fioul indiv',
                  bool("Installation x Fioul indiv x Individuel . besoin d'installation supplémentaire pour produire l'ECS"),
                  roundNumber('Installation x Fioul indiv x Individuel . volume du ballon ECS'),
                  roundNumber("Installation x Fioul indiv x Individuel . consommation d'électricité chauffe-eau électrique"),
                  roundNumber("Installation x Fioul indiv x Individuel . appoint d'électricité chauffe-eau solaire"),
                ],
                [
                  'Fioul coll',
                  bool("Installation x Fioul coll x Collectif . besoin d'installation supplémentaire pour produire l'ECS"),
                  roundNumber('Installation x Fioul coll x Collectif . volume du ballon ECS'),
                  roundNumber("Installation x Fioul coll x Collectif . consommation d'électricité chauffe-eau électrique"),
                  roundNumber("Installation x Fioul coll x Collectif . appoint d'électricité chauffe-eau solaire"),
                ],
                [
                  'PAC air/air indiv',
                  bool("Installation x PAC air-air x Individuel . besoin d'installation supplémentaire pour produire l'ECS"),
                  roundNumber('Installation x PAC air-air x Individuel . volume du ballon ECS'),
                  roundNumber("Installation x PAC air-air x Individuel . consommation d'électricité chauffe-eau électrique"),
                  roundNumber("Installation x PAC air-air x Individuel . appoint d'électricité chauffe-eau solaire"),
                ],
                [
                  'PAC air/air collectif/tertiaire',
                  bool("Installation x PAC air-air x Collectif . besoin d'installation supplémentaire pour produire l'ECS"),
                  roundNumber('Installation x PAC air-air x Collectif . volume du ballon ECS'),
                  roundNumber("Installation x PAC air-air x Collectif . consommation d'électricité chauffe-eau électrique"),
                  roundNumber("Installation x PAC air-air x Collectif . appoint d'électricité chauffe-eau solaire"),
                ],
                [
                  'PAC eau/eau indiv',
                  bool("Installation x PAC eau-eau x Individuel . besoin d'installation supplémentaire pour produire l'ECS"),
                  roundNumber('Installation x PAC eau-eau x Individuel . volume du ballon ECS'),
                  roundNumber("Installation x PAC eau-eau x Individuel . consommation d'électricité chauffe-eau électrique"),
                  roundNumber("Installation x PAC eau-eau x Individuel . appoint d'électricité chauffe-eau solaire"),
                ],
                [
                  'PAC eau/eau collectif/tertiaire',
                  bool("Installation x PAC eau-eau x Collectif . besoin d'installation supplémentaire pour produire l'ECS"),
                  roundNumber('Installation x PAC eau-eau x Collectif . volume du ballon ECS'),
                  roundNumber("Installation x PAC eau-eau x Collectif . consommation d'électricité chauffe-eau électrique"),
                  roundNumber("Installation x PAC eau-eau x Collectif . appoint d'électricité chauffe-eau solaire"),
                ],
                [
                  'PAC air/eau indiv',
                  bool("Installation x PAC air-eau x Individuel . besoin d'installation supplémentaire pour produire l'ECS"),
                  roundNumber('Installation x PAC air-eau x Individuel . volume du ballon ECS'),
                  roundNumber("Installation x PAC air-eau x Individuel . consommation d'électricité chauffe-eau électrique"),
                  roundNumber("Installation x PAC air-eau x Individuel . appoint d'électricité chauffe-eau solaire"),
                ],
                [
                  'PAC air/eau collectif/tertiaire',
                  bool("Installation x PAC air-eau x Collectif . besoin d'installation supplémentaire pour produire l'ECS"),
                  roundNumber('Installation x PAC air-eau x Collectif . volume du ballon ECS'),
                  roundNumber("Installation x PAC air-eau x Collectif . consommation d'électricité chauffe-eau électrique"),
                  roundNumber("Installation x PAC air-eau x Collectif . appoint d'électricité chauffe-eau solaire"),
                ],
                [
                  'Radiateur électrique',
                  bool("Installation x Radiateur électrique x Individuel . besoin d'installation supplémentaire pour produire l'ECS"),
                  roundNumber('Installation x Radiateur électrique x Individuel . volume du ballon ECS'),
                  roundNumber("Installation x Radiateur électrique x Individuel . consommation d'électricité chauffe-eau électrique"),
                  roundNumber("Installation x Radiateur électrique x Individuel . appoint d'électricité chauffe-eau solaire"),
                ],
              ]}
            />

            <DebugTable
              caption="Bilan par lgt / tertiaire"
              headers={[
                'Installation',
                'Consommation combustible chaleur',
                'Consommation combustible froid',
                'Consommation auxiliaire (kWh elec/an)',
              ]}
              data={[
                [
                  'Réseaux de chaleur',
                  roundNumber('Installation x Réseaux de chaleur x Collectif . consommation combustible chaleur'),
                  '',
                  roundNumber('Installation x Réseaux de chaleur x Collectif . consommation auxiliaire'),
                ],
                [
                  'Réseaux de froid',
                  '',
                  roundNumber('Installation x Réseaux de froid x Collectif . consommation combustible froid'),
                  roundNumber('Installation x Réseaux de froid x Collectif . consommation auxiliaire'),
                ],
                [
                  'Poêle à granulés indiv',
                  roundNumber('Installation x Poêle à granulés indiv x Individuel . consommation combustible chaleur'),
                  '',
                  '',
                ],
                [
                  'Chaudière à granulés coll',
                  roundNumber('Installation x Chaudière à granulés coll x Collectif . consommation combustible chaleur'),
                  '',
                  roundNumber('Installation x Chaudière à granulés coll x Collectif . consommation auxiliaire'),
                ],
                [
                  'Gaz indiv avec cond',
                  roundNumber('Installation x Gaz indiv avec cond x Individuel . consommation combustible chaleur'),
                  '',
                  roundNumber('Installation x Gaz indiv avec cond x Individuel . consommation auxiliaire'),
                ],
                [
                  'Gaz indiv sans cond',
                  roundNumber('Installation x Gaz indiv sans cond x Individuel . consommation combustible chaleur'),
                  '',
                  roundNumber('Installation x Gaz indiv sans cond x Individuel . consommation auxiliaire'),
                ],
                [
                  'Gaz coll avec cond',
                  roundNumber('Installation x Gaz coll avec cond x Collectif . consommation combustible chaleur'),
                  '',
                  roundNumber('Installation x Gaz coll avec cond x Collectif . consommation auxiliaire'),
                ],
                [
                  'Gaz coll sans cond',
                  roundNumber('Installation x Gaz coll sans cond x Collectif . consommation combustible chaleur'),
                  '',
                  roundNumber('Installation x Gaz coll sans cond x Collectif . consommation auxiliaire'),
                ],
                [
                  'Fioul indiv',
                  roundNumber('Installation x Fioul indiv x Individuel . consommation combustible chaleur'),
                  '',
                  roundNumber('Installation x Fioul indiv x Individuel . consommation auxiliaire'),
                ],
                [
                  'Fioul coll',
                  roundNumber('Installation x Fioul coll x Collectif . consommation combustible chaleur'),
                  '',
                  roundNumber('Installation x Fioul coll x Collectif . consommation auxiliaire'),
                ],
                [
                  'PAC air/air indiv',
                  roundNumber('Installation x PAC air-air x Individuel . consommation combustible chaleur'),
                  roundNumber('Installation x PAC air-air x Individuel . consommation combustible froid'),
                  roundNumber('Installation x PAC air-air x Individuel . consommation auxiliaire'),
                ],
                [
                  'PAC air/air collectif/tertiaire',
                  roundNumber('Installation x PAC air-air x Collectif . consommation combustible chaleur'),
                  roundNumber('Installation x PAC air-air x Collectif . consommation combustible froid'),
                  roundNumber('Installation x PAC air-air x Collectif . consommation auxiliaire'),
                ],
                [
                  'PAC eau/eau indiv',
                  roundNumber('Installation x PAC eau-eau x Individuel . consommation combustible chaleur'),
                  '',
                  roundNumber('Installation x PAC eau-eau x Individuel . consommation auxiliaire'),
                ],
                [
                  'PAC eau/eau collectif/tertiaire',
                  roundNumber('Installation x PAC eau-eau x Collectif . consommation combustible chaleur'),
                  roundNumber('Installation x PAC eau-eau x Collectif . consommation combustible froid'),
                  roundNumber('Installation x PAC eau-eau x Collectif . consommation auxiliaire'),
                ],
                [
                  'PAC air/eau indiv',
                  roundNumber('Installation x PAC air-eau x Individuel . consommation combustible chaleur'),
                  roundNumber('Installation x PAC air-eau x Individuel . consommation combustible froid'),
                  roundNumber('Installation x PAC air-eau x Individuel . consommation auxiliaire'),
                ],
                [
                  'PAC air/eau collectif/tertiaire',
                  roundNumber('Installation x PAC air-eau x Collectif . consommation combustible chaleur'),
                  roundNumber('Installation x PAC air-eau x Collectif . consommation combustible froid'),
                  roundNumber('Installation x PAC air-eau x Collectif . consommation auxiliaire'),
                ],
                [
                  'Radiateur électrique',
                  roundNumber('Installation x Radiateur électrique x Individuel . consommation combustible chaleur'),
                  '',
                  '',
                ],
              ]}
            />

            <DebugTable
              caption="Bilan des consommations par lgt / tertiaire"
              headers={[
                'Installation',
                'Consommation combustible hors électricité',
                "Consommation d'électricité lié au chauffage/refroidissement et à la production d'ECS (kWh/an)",
              ]}
              data={[
                [
                  'Réseaux de chaleur',
                  roundNumber('Installation x Réseaux de chaleur x Collectif . consommation combustible hors électricité'),
                  roundNumber(
                    "Installation x Réseaux de chaleur x Collectif . consommation d'électricité lié au chauffage-refroidissement et à la production d'ECS"
                  ),
                ],
                [
                  'Réseaux de froid',
                  roundNumber('Installation x Réseaux de froid x Collectif . consommation combustible hors électricité'),
                  roundNumber(
                    "Installation x Réseaux de froid x Collectif . consommation d'électricité lié au chauffage-refroidissement et à la production d'ECS"
                  ),
                ],
                [
                  'Poêle à granulés indiv',
                  roundNumber('Installation x Poêle à granulés indiv x Individuel . consommation combustible hors électricité'),
                  roundNumber(
                    "Installation x Poêle à granulés indiv x Individuel . consommation d'électricité lié au chauffage-refroidissement et à la production d'ECS"
                  ),
                ],
                [
                  'Chaudière à granulés coll',
                  roundNumber('Installation x Chaudière à granulés coll x Collectif . consommation combustible hors électricité'),
                  roundNumber(
                    "Installation x Chaudière à granulés coll x Collectif . consommation d'électricité lié au chauffage-refroidissement et à la production d'ECS"
                  ),
                ],
                [
                  'Gaz indiv avec cond',
                  roundNumber('Installation x Gaz indiv avec cond x Individuel . consommation combustible hors électricité'),
                  roundNumber(
                    "Installation x Gaz indiv avec cond x Individuel . consommation d'électricité lié au chauffage-refroidissement et à la production d'ECS"
                  ),
                ],
                [
                  'Gaz indiv sans cond',
                  roundNumber('Installation x Gaz indiv sans cond x Individuel . consommation combustible hors électricité'),
                  roundNumber(
                    "Installation x Gaz indiv sans cond x Individuel . consommation d'électricité lié au chauffage-refroidissement et à la production d'ECS"
                  ),
                ],
                [
                  'Gaz coll avec cond',
                  roundNumber('Installation x Gaz coll avec cond x Collectif . consommation combustible hors électricité'),
                  roundNumber(
                    "Installation x Gaz coll avec cond x Collectif . consommation d'électricité lié au chauffage-refroidissement et à la production d'ECS"
                  ),
                ],
                [
                  'Gaz coll sans cond',
                  roundNumber('Installation x Gaz coll sans cond x Collectif . consommation combustible hors électricité'),
                  roundNumber(
                    "Installation x Gaz coll sans cond x Collectif . consommation d'électricité lié au chauffage-refroidissement et à la production d'ECS"
                  ),
                ],
                [
                  'Fioul indiv',
                  roundNumber('Installation x Fioul indiv x Individuel . consommation combustible hors électricité'),
                  roundNumber(
                    "Installation x Fioul indiv x Individuel . consommation d'électricité lié au chauffage-refroidissement et à la production d'ECS"
                  ),
                ],
                [
                  'Fioul coll',
                  roundNumber('Installation x Fioul coll x Collectif . consommation combustible hors électricité'),
                  roundNumber(
                    "Installation x Fioul coll x Collectif . consommation d'électricité lié au chauffage-refroidissement et à la production d'ECS"
                  ),
                ],
                [
                  'PAC air/air indiv',
                  '',
                  roundNumber(
                    "Installation x PAC air-air x Individuel . consommation d'électricité lié au chauffage-refroidissement et à la production d'ECS"
                  ),
                ],
                [
                  'PAC air/air collectif/tertiaire',
                  '',
                  roundNumber(
                    "Installation x PAC air-air x Collectif . consommation d'électricité lié au chauffage-refroidissement et à la production d'ECS"
                  ),
                ],
                [
                  'PAC eau/eau indiv',
                  '',
                  roundNumber(
                    "Installation x PAC eau-eau x Individuel . consommation d'électricité lié au chauffage-refroidissement et à la production d'ECS"
                  ),
                ],
                [
                  'PAC eau/eau collectif/tertiaire',
                  '',
                  roundNumber(
                    "Installation x PAC eau-eau x Collectif . consommation d'électricité lié au chauffage-refroidissement et à la production d'ECS"
                  ),
                ],
                [
                  'PAC air/eau indiv',
                  '',
                  roundNumber(
                    "Installation x PAC air-eau x Individuel . consommation d'électricité lié au chauffage-refroidissement et à la production d'ECS"
                  ),
                ],
                [
                  'PAC air/eau collectif/tertiaire',
                  '',
                  roundNumber(
                    "Installation x PAC air-eau x Collectif . consommation d'électricité lié au chauffage-refroidissement et à la production d'ECS"
                  ),
                ],
                [
                  'Radiateur électrique',
                  '',
                  roundNumber(
                    "Installation x Radiateur électrique x Individuel . consommation d'électricité lié au chauffage-refroidissement et à la production d'ECS"
                  ),
                ],
              ]}
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
              data={[
                [
                  'Réseaux de chaleur',
                  bool("Installation x Réseaux de chaleur x Collectif . besoin d'installation supplémentaire pour produire l'ECS"),
                  roundNumber('env . Installation x Réseaux de chaleur x Collectif . besoins de chauffage et ECS si même équipement'),
                  roundNumber('env . Installation x Réseaux de chaleur x Collectif . auxiliaires et combustible électrique'),
                  roundNumber('env . Installation x Réseaux de chaleur x Collectif . ECS solaire thermique'),
                  roundNumber('env . Installation x Réseaux de chaleur x Collectif . ECS avec ballon électrique'),
                  roundNumber('env . Installation x Réseaux de chaleur x Collectif . Scope 2'),
                  roundNumber('env . Installation x Réseaux de chaleur x Collectif . Scope 3'),
                  roundNumber('env . Installation x Réseaux de chaleur x Collectif . Total'),
                ],
                [
                  'Réseaux de froid',
                  bool("Installation x Réseaux de froid x Collectif . besoin d'installation supplémentaire pour produire l'ECS"),
                  roundNumber('env . Installation x Réseaux de froid x Collectif . besoins de chauffage et ECS si même équipement'),
                  roundNumber('env . Installation x Réseaux de froid x Collectif . auxiliaires et combustible électrique'),
                  roundNumber('env . Installation x Réseaux de froid x Collectif . ECS solaire thermique'),
                  roundNumber('env . Installation x Réseaux de froid x Collectif . ECS avec ballon électrique'),
                  roundNumber('env . Installation x Réseaux de froid x Collectif . Scope 2'),
                  roundNumber('env . Installation x Réseaux de froid x Collectif . Scope 3'),
                  roundNumber('env . Installation x Réseaux de froid x Collectif . Total'),
                ],
                [
                  'Poêle à granulés indiv',
                  bool("Installation x Poêle à granulés indiv x Individuel . besoin d'installation supplémentaire pour produire l'ECS"),
                  roundNumber('env . Installation x Poêle à granulés indiv x Individuel . besoins de chauffage et ECS si même équipement'),
                  roundNumber('env . Installation x Poêle à granulés indiv x Individuel . auxiliaires et combustible électrique'),
                  roundNumber('env . Installation x Poêle à granulés indiv x Individuel . ECS solaire thermique'),
                  roundNumber('env . Installation x Poêle à granulés indiv x Individuel . ECS avec ballon électrique'),
                  roundNumber('env . Installation x Poêle à granulés indiv x Individuel . Scope 2'),
                  roundNumber('env . Installation x Poêle à granulés indiv x Individuel . Scope 3'),
                  roundNumber('env . Installation x Poêle à granulés indiv x Individuel . Total'),
                ],
                [
                  'Chaudière à granulés coll',
                  bool("Installation x Chaudière à granulés coll x Collectif . besoin d'installation supplémentaire pour produire l'ECS"),
                  roundNumber(
                    'env . Installation x Chaudière à granulés coll x Collectif . besoins de chauffage et ECS si même équipement'
                  ),
                  roundNumber('env . Installation x Chaudière à granulés coll x Collectif . auxiliaires et combustible électrique'),
                  roundNumber('env . Installation x Chaudière à granulés coll x Collectif . ECS solaire thermique'),
                  roundNumber('env . Installation x Chaudière à granulés coll x Collectif . ECS avec ballon électrique'),
                  roundNumber('env . Installation x Chaudière à granulés coll x Collectif . Scope 2'),
                  roundNumber('env . Installation x Chaudière à granulés coll x Collectif . Scope 3'),
                  roundNumber('env . Installation x Chaudière à granulés coll x Collectif . Total'),
                ],
                [
                  'Gaz indiv avec cond',
                  bool("Installation x Gaz indiv avec cond x Individuel . besoin d'installation supplémentaire pour produire l'ECS"),
                  roundNumber('env . Installation x Gaz indiv avec cond x Individuel . besoins de chauffage et ECS si même équipement'),
                  roundNumber('env . Installation x Gaz indiv avec cond x Individuel . auxiliaires et combustible électrique'),
                  roundNumber('env . Installation x Gaz indiv avec cond x Individuel . ECS solaire thermique'),
                  roundNumber('env . Installation x Gaz indiv avec cond x Individuel . ECS avec ballon électrique'),
                  roundNumber('env . Installation x Gaz indiv avec cond x Individuel . Scope 2'),
                  roundNumber('env . Installation x Gaz indiv avec cond x Individuel . Scope 3'),
                  roundNumber('env . Installation x Gaz indiv avec cond x Individuel . Total'),
                ],
                [
                  'Gaz indiv sans cond',
                  bool("Installation x Gaz indiv sans cond x Individuel . besoin d'installation supplémentaire pour produire l'ECS"),
                  roundNumber('env . Installation x Gaz indiv sans cond x Individuel . besoins de chauffage et ECS si même équipement'),
                  roundNumber('env . Installation x Gaz indiv sans cond x Individuel . auxiliaires et combustible électrique'),
                  roundNumber('env . Installation x Gaz indiv sans cond x Individuel . ECS solaire thermique'),
                  roundNumber('env . Installation x Gaz indiv sans cond x Individuel . ECS avec ballon électrique'),
                  roundNumber('env . Installation x Gaz indiv sans cond x Individuel . Scope 2'),
                  roundNumber('env . Installation x Gaz indiv sans cond x Individuel . Scope 3'),
                  roundNumber('env . Installation x Gaz indiv sans cond x Individuel . Total'),
                ],
                [
                  'Gaz coll avec cond',
                  bool("Installation x Gaz coll avec cond x Collectif . besoin d'installation supplémentaire pour produire l'ECS"),
                  roundNumber('env . Installation x Gaz coll avec cond x Collectif . besoins de chauffage et ECS si même équipement'),
                  roundNumber('env . Installation x Gaz coll avec cond x Collectif . auxiliaires et combustible électrique'),
                  roundNumber('env . Installation x Gaz coll avec cond x Collectif . ECS solaire thermique'),
                  roundNumber('env . Installation x Gaz coll avec cond x Collectif . ECS avec ballon électrique'),
                  roundNumber('env . Installation x Gaz coll avec cond x Collectif . Scope 2'),
                  roundNumber('env . Installation x Gaz coll avec cond x Collectif . Scope 3'),
                  roundNumber('env . Installation x Gaz coll avec cond x Collectif . Total'),
                ],
                [
                  'Gaz coll sans cond',
                  bool("Installation x Gaz coll sans cond x Collectif . besoin d'installation supplémentaire pour produire l'ECS"),
                  roundNumber('env . Installation x Gaz coll sans cond x Collectif . besoins de chauffage et ECS si même équipement'),
                  roundNumber('env . Installation x Gaz coll sans cond x Collectif . auxiliaires et combustible électrique'),
                  roundNumber('env . Installation x Gaz coll sans cond x Collectif . ECS solaire thermique'),
                  roundNumber('env . Installation x Gaz coll sans cond x Collectif . ECS avec ballon électrique'),
                  roundNumber('env . Installation x Gaz coll sans cond x Collectif . Scope 2'),
                  roundNumber('env . Installation x Gaz coll sans cond x Collectif . Scope 3'),
                  roundNumber('env . Installation x Gaz coll sans cond x Collectif . Total'),
                ],
                [
                  'Fioul indiv',
                  bool("Installation x Fioul indiv x Individuel . besoin d'installation supplémentaire pour produire l'ECS"),
                  roundNumber('env . Installation x Fioul indiv x Individuel . besoins de chauffage et ECS si même équipement'),
                  roundNumber('env . Installation x Fioul indiv x Individuel . auxiliaires et combustible électrique'),
                  roundNumber('env . Installation x Fioul indiv x Individuel . ECS solaire thermique'),
                  roundNumber('env . Installation x Fioul indiv x Individuel . ECS avec ballon électrique'),
                  roundNumber('env . Installation x Fioul indiv x Individuel . Scope 2'),
                  roundNumber('env . Installation x Fioul indiv x Individuel . Scope 3'),
                  roundNumber('env . Installation x Fioul indiv x Individuel . Total'),
                ],
                [
                  'Fioul coll',
                  bool("Installation x Fioul coll x Collectif . besoin d'installation supplémentaire pour produire l'ECS"),
                  roundNumber('env . Installation x Fioul coll x Collectif . besoins de chauffage et ECS si même équipement'),
                  roundNumber('env . Installation x Fioul coll x Collectif . auxiliaires et combustible électrique'),
                  roundNumber('env . Installation x Fioul coll x Collectif . ECS solaire thermique'),
                  roundNumber('env . Installation x Fioul coll x Collectif . ECS avec ballon électrique'),
                  roundNumber('env . Installation x Fioul coll x Collectif . Scope 2'),
                  roundNumber('env . Installation x Fioul coll x Collectif . Scope 3'),
                  roundNumber('env . Installation x Fioul coll x Collectif . Total'),
                ],
                [
                  'PAC air/air indiv',
                  bool("Installation x PAC air-air x Individuel . besoin d'installation supplémentaire pour produire l'ECS"),
                  roundNumber('env . Installation x PAC air-air x Individuel . besoins de chauffage et ECS si même équipement'),
                  roundNumber('env . Installation x PAC air-air x Individuel . auxiliaires et combustible électrique'),
                  roundNumber('env . Installation x PAC air-air x Individuel . ECS solaire thermique'),
                  roundNumber('env . Installation x PAC air-air x Individuel . ECS avec ballon électrique'),
                  roundNumber('env . Installation x PAC air-air x Individuel . Scope 2'),
                  roundNumber('env . Installation x PAC air-air x Individuel . Scope 3'),
                  roundNumber('env . Installation x PAC air-air x Individuel . Total'),
                ],
                [
                  'PAC air/air collectif/tertiaire',
                  bool("Installation x PAC air-air x Collectif . besoin d'installation supplémentaire pour produire l'ECS"),
                  roundNumber('env . Installation x PAC air-air x Collectif . besoins de chauffage et ECS si même équipement'),
                  roundNumber('env . Installation x PAC air-air x Collectif . auxiliaires et combustible électrique'),
                  roundNumber('env . Installation x PAC air-air x Collectif . ECS solaire thermique'),
                  roundNumber('env . Installation x PAC air-air x Collectif . ECS avec ballon électrique'),
                  roundNumber('env . Installation x PAC air-air x Collectif . Scope 2'),
                  roundNumber('env . Installation x PAC air-air x Collectif . Scope 3'),
                  roundNumber('env . Installation x PAC air-air x Collectif . Total'),
                ],
                [
                  'PAC eau/eau indiv',
                  bool("Installation x PAC eau-eau x Individuel . besoin d'installation supplémentaire pour produire l'ECS"),
                  roundNumber('env . Installation x PAC eau-eau x Individuel . besoins de chauffage et ECS si même équipement'),
                  roundNumber('env . Installation x PAC eau-eau x Individuel . auxiliaires et combustible électrique'),
                  roundNumber('env . Installation x PAC eau-eau x Individuel . ECS solaire thermique'),
                  roundNumber('env . Installation x PAC eau-eau x Individuel . ECS avec ballon électrique'),
                  roundNumber('env . Installation x PAC eau-eau x Individuel . Scope 2'),
                  roundNumber('env . Installation x PAC eau-eau x Individuel . Scope 3'),
                  roundNumber('env . Installation x PAC eau-eau x Individuel . Total'),
                ],
                [
                  'PAC eau/eau collectif/tertiaire',
                  bool("Installation x PAC eau-eau x Collectif . besoin d'installation supplémentaire pour produire l'ECS"),
                  roundNumber('env . Installation x PAC eau-eau x Collectif . besoins de chauffage et ECS si même équipement'),
                  roundNumber('env . Installation x PAC eau-eau x Collectif . auxiliaires et combustible électrique'),
                  roundNumber('env . Installation x PAC eau-eau x Collectif . ECS solaire thermique'),
                  roundNumber('env . Installation x PAC eau-eau x Collectif . ECS avec ballon électrique'),
                  roundNumber('env . Installation x PAC eau-eau x Collectif . Scope 2'),
                  roundNumber('env . Installation x PAC eau-eau x Collectif . Scope 3'),
                  roundNumber('env . Installation x PAC eau-eau x Collectif . Total'),
                ],
                [
                  'PAC air/eau indiv',
                  bool("Installation x PAC air-eau x Individuel . besoin d'installation supplémentaire pour produire l'ECS"),
                  roundNumber('env . Installation x PAC air-eau x Individuel . besoins de chauffage et ECS si même équipement'),
                  roundNumber('env . Installation x PAC air-eau x Individuel . auxiliaires et combustible électrique'),
                  roundNumber('env . Installation x PAC air-eau x Individuel . ECS solaire thermique'),
                  roundNumber('env . Installation x PAC air-eau x Individuel . ECS avec ballon électrique'),
                  roundNumber('env . Installation x PAC air-eau x Individuel . Scope 2'),
                  roundNumber('env . Installation x PAC air-eau x Individuel . Scope 3'),
                  roundNumber('env . Installation x PAC air-eau x Individuel . Total'),
                ],
                [
                  'PAC air/eau collectif/tertiaire',
                  bool("Installation x PAC air-eau x Collectif . besoin d'installation supplémentaire pour produire l'ECS"),
                  roundNumber('env . Installation x PAC air-eau x Collectif . besoins de chauffage et ECS si même équipement'),
                  roundNumber('env . Installation x PAC air-eau x Collectif . auxiliaires et combustible électrique'),
                  roundNumber('env . Installation x PAC air-eau x Collectif . ECS solaire thermique'),
                  roundNumber('env . Installation x PAC air-eau x Collectif . ECS avec ballon électrique'),
                  roundNumber('env . Installation x PAC air-eau x Collectif . Scope 2'),
                  roundNumber('env . Installation x PAC air-eau x Collectif . Scope 3'),
                  roundNumber('env . Installation x PAC air-eau x Collectif . Total'),
                ],
                [
                  'Radiateur électrique',
                  bool("Installation x Radiateur électrique x Individuel . besoin d'installation supplémentaire pour produire l'ECS"),
                  roundNumber('env . Installation x Radiateur électrique x Individuel . besoins de chauffage et ECS si même équipement'),
                  roundNumber('env . Installation x Radiateur électrique x Individuel . auxiliaires et combustible électrique'),
                  roundNumber('env . Installation x Radiateur électrique x Individuel . ECS solaire thermique'),
                  roundNumber('env . Installation x Radiateur électrique x Individuel . ECS avec ballon électrique'),
                  roundNumber('env . Installation x Radiateur électrique x Individuel . Scope 2'),
                  roundNumber('env . Installation x Radiateur électrique x Individuel . Scope 3'),
                  roundNumber('env . Installation x Radiateur électrique x Individuel . Total'),
                ],
              ]}
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
