import { DottedName } from '@betagouv/france-chaleur-urbaine-publicodes';
import Button from '@codegouvfr/react-dsfr/Button';
import Table from '@codegouvfr/react-dsfr/Table';
import { Drawer, Tooltip, tooltipClasses, TooltipProps } from '@mui/material';
import { useState } from 'react';
import styled from 'styled-components';

import Box from '@components/ui/Box';
import Heading from '@components/ui/Heading';
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

const DebugDrawer = ({ engine }: DebugDrawerProps) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const roundNumber = (key: DottedName) => {
    const node = engine.getNode(key);
    const value = Math.round(node.nodeValue as number);
    const unit = node.unit ? formatUnit(node.unit) : '';
    return (
      <RuleTooltip title={key}>
        <span>
          {value} {unit}
        </span>
      </RuleTooltip>
    );
  };
  const number = (key: DottedName) => {
    const node = engine.getNode(key);
    const value = Math.round((node.nodeValue as number) * 1000) / 1000;
    const unit = node.unit ? formatUnit(node.unit) : '';
    return (
      <RuleTooltip title={key}>
        <span>
          {value} {unit}
        </span>
      </RuleTooltip>
    );
  };
  const bool = (key: DottedName) => {
    return (
      <RuleTooltip title={key}>
        <span>{engine.getField(key) ? 'oui' : 'non'}</span>
      </RuleTooltip>
    );
  };

  return (
    <>
      <FloatingButton onClick={() => setDrawerOpen(true)} iconId="ri-arrow-up-fill">
        DEBUG
      </FloatingButton>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} anchor="right">
        <Button onClick={() => setDrawerOpen(false)}>Fermer</Button>
        <Box px="3w">
          <Heading size="h2">Calculs économiques</Heading>

          <Table
            caption="Coût d'achat du combustible"
            headers={['Paramètres', 'Part abonnement', 'Part consommation']}
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
                number("Calcul Eco . Coût d'achat du combustible . Electricité indiv x Part consommation"),
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
          <Heading size="h2">Calculs techniques</Heading>

          <Table
            caption="Puissance totale des installations"
            headers={[
              'Installations',
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

          <Table
            caption="Bilan par lgt / tertiaire"
            headers={[
              'Installations',
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

          <Table
            caption="Bilan des consommations par lgt / tertiaire"
            headers={[
              'Installations',
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

          <Heading size="h2">Calculs économiques</Heading>

          <Table
            caption="P4 - Investissement total (sans aide) €TTC"
            headers={[
              'Installations',
              'Investissement équipement total (€)',
              'Investissement équipement par lgt type / tertiaire (€)',
              'Investissement ballon ECS à accumulation (€)', // inutile
              'Investissement ballon ECS solaire (panneau inclus) (€)', // inutile
              'Total investissement avec balllon  ECS à accumulation (€)',
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

          <Heading size="h2">Calculs environnementaux</Heading>

          <Table
            caption="Calculs environnementaux"
            headers={[
              'Installations',
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
                roundNumber('env . Installation x Chaudière à granulés coll x Collectif . besoins de chauffage et ECS si même équipement'),
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
      </Drawer>
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
