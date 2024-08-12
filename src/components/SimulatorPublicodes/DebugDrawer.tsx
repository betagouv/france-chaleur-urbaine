import { DottedName } from '@betagouv/france-chaleur-urbaine-publicodes';
import Button from '@codegouvfr/react-dsfr/Button';
import Table from '@codegouvfr/react-dsfr/Table';
import { Drawer } from '@mui/material';
import { useState } from 'react';
import styled from 'styled-components';

import Heading from '@components/ui/Heading';
import { formatUnit } from '@helpers/publicodes/usePublicodesEngine';

import { type SimulatorEngine } from './useSimulatorEngine';

type DebugDrawerProps = {
  engine: SimulatorEngine;
};

const DebugDrawer = ({ engine }: DebugDrawerProps) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const number = (key: DottedName) => {
    const node = engine.getNode(key);
    const value = Math.round(node.nodeValue as number);
    const unit = node.unit ? formatUnit(node.unit) : '';
    return `${value} ${unit}`;
  };
  const bool = (key: DottedName) => {
    return `${engine.getField(key) ? 'oui' : 'non'}`;
  };

  return (
    <>
      <FloatingButton onClick={() => setDrawerOpen(true)} iconId="ri-arrow-up-fill">
        DEBUG
      </FloatingButton>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} anchor="right">
        <Button onClick={() => setDrawerOpen(false)}>Fermer</Button>

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
              number('Installation x Réseaux de chaleur x Collectif . puissance nécessaire équipement chauffage'),
              number('Installation x Réseaux de chaleur x Collectif . puissance nécessaire pour ECS avec équipement'),
              '',
              number('Installation x Réseaux de chaleur x Collectif . puissance équipement'),
              number('Installation x Réseaux de chaleur x Collectif . gamme de puissance existante'),
            ],
            [
              'Réseaux de froid',
              bool('Installation x Réseaux de froid x Collectif . production eau chaude sanitaire'),
              '',
              '',
              number('Installation x Réseaux de froid x Collectif . puissance nécessaire pour refroidissement équipement'),
              number('Installation x Réseaux de froid x Collectif . puissance équipement'),
              number('Installation x Réseaux de froid x Collectif . gamme de puissance existante'),
            ],
            [
              'Poêle à granulés indiv',
              bool('Installation x Poêle à granulés indiv x Individuel . production eau chaude sanitaire'),
              number('Installation x Poêle à granulés indiv x Individuel . puissance nécessaire équipement chauffage'),
              '',
              '',
              number('Installation x Poêle à granulés indiv x Individuel . puissance équipement'),
              number('Installation x Poêle à granulés indiv x Individuel . gamme de puissance existante'),
            ],
            [
              'Chaudière à granulés coll',
              bool('Installation x Chaudière à granulés coll x Collectif . production eau chaude sanitaire'),
              number('Installation x Chaudière à granulés coll x Collectif . puissance nécessaire équipement chauffage'),
              number('Installation x Chaudière à granulés coll x Collectif . puissance nécessaire pour ECS avec équipement'),
              '',
              number('Installation x Chaudière à granulés coll x Collectif . puissance équipement'),
              number('Installation x Chaudière à granulés coll x Collectif . gamme de puissance existante'),
            ],
            [
              'Gaz indiv avec cond',
              bool('Installation x Gaz indiv avec cond x Individuel . production eau chaude sanitaire'),
              number('Installation x Gaz indiv avec cond x Individuel . puissance nécessaire équipement chauffage'),
              number('Installation x Gaz indiv avec cond x Individuel . puissance nécessaire pour ECS avec équipement'),
              '',
              number('Installation x Gaz indiv avec cond x Individuel . puissance équipement'),
              number('Installation x Gaz indiv avec cond x Individuel . gamme de puissance existante'),
            ],
            [
              'Gaz indiv sans cond',
              bool('Installation x Gaz indiv sans cond x Individuel . production eau chaude sanitaire'),
              number('Installation x Gaz indiv sans cond x Individuel . puissance nécessaire équipement chauffage'),
              number('Installation x Gaz indiv sans cond x Individuel . puissance nécessaire pour ECS avec équipement'),
              '',
              number('Installation x Gaz indiv sans cond x Individuel . puissance équipement'),
              number('Installation x Gaz indiv sans cond x Individuel . gamme de puissance existante'),
            ],
            [
              'Gaz coll avec cond',
              bool('Installation x Gaz coll avec cond x Collectif . production eau chaude sanitaire'),
              number('Installation x Gaz coll avec cond x Collectif . puissance nécessaire équipement chauffage'),
              number('Installation x Gaz coll avec cond x Collectif . puissance nécessaire pour ECS avec équipement'),
              '',
              number('Installation x Gaz coll avec cond x Collectif . puissance équipement'),
              number('Installation x Gaz coll avec cond x Collectif . gamme de puissance existante'),
            ],
            [
              'Gaz coll sans cond',
              bool('Installation x Gaz coll sans cond x Collectif . production eau chaude sanitaire'),
              number('Installation x Gaz coll sans cond x Collectif . puissance nécessaire équipement chauffage'),
              number('Installation x Gaz coll sans cond x Collectif . puissance nécessaire pour ECS avec équipement'),
              '',
              number('Installation x Gaz coll sans cond x Collectif . puissance équipement'),
              number('Installation x Gaz coll sans cond x Collectif . gamme de puissance existante'),
            ],
            [
              'Fioul indiv ',
              bool('Installation x Fioul indiv x Individuel . production eau chaude sanitaire'),
              number('Installation x Fioul indiv x Individuel . puissance nécessaire équipement chauffage'),
              number('Installation x Fioul indiv x Individuel . puissance nécessaire pour ECS avec équipement'),
              '',
              number('Installation x Fioul indiv x Individuel . puissance équipement'),
              number('Installation x Fioul indiv x Individuel . gamme de puissance existante'),
            ],
            [
              'Fioul coll',
              bool('Installation x Fioul coll x Collectif . production eau chaude sanitaire'),
              number('Installation x Fioul coll x Collectif . puissance nécessaire équipement chauffage'),
              number('Installation x Fioul coll x Collectif . puissance nécessaire pour ECS avec équipement'),
              '',
              number('Installation x Fioul coll x Collectif . puissance équipement'),
              number('Installation x Fioul coll x Collectif . gamme de puissance existante'),
            ],
            [
              'PAC air/air indiv',
              bool('Installation x PAC air-air x Individuel . production eau chaude sanitaire'),
              number('Installation x PAC air-air x Individuel . puissance nécessaire équipement chauffage'),
              '',
              number('Installation x PAC air-air x Individuel . puissance nécessaire pour refroidissement équipement'),
              number('Installation x PAC air-air x Individuel . puissance équipement'),
              number('Installation x PAC air-air x Individuel . gamme de puissance existante'),
            ],
            [
              'PAC air/air collectif/tertiaire',
              bool('Installation x PAC air-air x Collectif . production eau chaude sanitaire'),
              number('Installation x PAC air-air x Collectif . puissance nécessaire équipement chauffage'),
              '',
              number('Installation x PAC air-air x Collectif . puissance nécessaire pour refroidissement équipement'),
              number('Installation x PAC air-air x Collectif . puissance équipement'),
              number('Installation x PAC air-air x Collectif . gamme de puissance existante'),
            ],
            [
              'PAC eau/eau indiv',
              bool('Installation x PAC eau glycolée-eau capteurs verticaux x Individuel . production eau chaude sanitaire'),
              number('Installation x PAC eau glycolée-eau capteurs verticaux x Individuel . puissance nécessaire équipement chauffage'),
              number('Installation x PAC eau glycolée-eau capteurs verticaux x Individuel . puissance nécessaire pour ECS avec équipement'),
              '',
              number('Installation x PAC eau glycolée-eau capteurs verticaux x Individuel . puissance équipement'),
              number('Installation x PAC eau glycolée-eau capteurs verticaux x Individuel . gamme de puissance existante'),
            ],
            [
              'PAC eau/eau collectif/tertiaire',
              bool('Installation x PAC eau-eau champs de sondes x Collectif . production eau chaude sanitaire'),
              number('Installation x PAC eau-eau champs de sondes x Collectif . puissance nécessaire équipement chauffage'),
              number('Installation x PAC eau-eau champs de sondes x Collectif . puissance nécessaire pour ECS avec équipement'),
              '',
              number('Installation x PAC eau-eau champs de sondes x Collectif . puissance équipement'),
              number('Installation x PAC eau-eau champs de sondes x Collectif . gamme de puissance existante'),
            ],
            [
              'PAC air/eau indiv',
              bool('Installation x PAC air-eau x Individuel . production eau chaude sanitaire'),
              number('Installation x PAC air-eau x Individuel . puissance nécessaire équipement chauffage'),
              number('Installation x PAC air-eau x Individuel . puissance nécessaire pour ECS avec équipement'),
              number('Installation x PAC air-eau x Individuel . puissance nécessaire pour refroidissement équipement'),
              number('Installation x PAC air-eau x Individuel . puissance équipement'),
              number('Installation x PAC air-eau x Individuel . gamme de puissance existante'),
            ],
            [
              'PAC air/eau collectif/tertiaire',
              bool('Installation x PAC air-eau x Collectif . production eau chaude sanitaire'),
              number('Installation x PAC air-eau x Collectif . puissance nécessaire équipement chauffage'),
              number('Installation x PAC air-eau x Collectif . puissance nécessaire pour ECS avec équipement'),
              number('Installation x PAC air-eau x Collectif . puissance nécessaire pour refroidissement équipement'),
              number('Installation x PAC air-eau x Collectif . puissance équipement'),
              number('Installation x PAC air-eau x Collectif . gamme de puissance existante'),
            ],
            [
              'Radiateur électrique',
              bool('Installation x Radiateur électrique x Individuel . production eau chaude sanitaire'),
              number('Installation x Radiateur électrique x Individuel . puissance nécessaire équipement chauffage'),
              '',
              '',
              number('Installation x Radiateur électrique x Individuel . puissance équipement'),
              number('Installation x Radiateur électrique x Individuel . gamme de puissance existante'),
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
              number('Installation x Réseaux de chaleur x Collectif . consommation combustible chaleur'),
              '',
              number('Installation x Réseaux de chaleur x Collectif . consommation auxilliaire'),
            ],
            [
              'Réseaux de froid',
              '',
              number('Installation x Réseaux de froid x Collectif . consommation combustible froid'),
              number('Installation x Réseaux de froid x Collectif . consommation auxilliaire'),
            ],
            [
              'Poêle à granulés indiv',
              number('Installation x Poêle à granulés indiv x Individuel . consommation combustible chaleur'),
              '',
              '',
            ],
            [
              'Chaudière à granulés coll',
              number('Installation x Chaudière à granulés coll x Collectif . consommation combustible chaleur'),
              '',
              number('Installation x Chaudière à granulés coll x Collectif . consommation auxilliaire'),
            ],
            [
              'Gaz indiv avec cond',
              number('Installation x Gaz indiv avec cond x Individuel . consommation combustible chaleur'),
              '',
              number('Installation x Gaz indiv avec cond x Individuel . consommation auxilliaire'),
            ],
            [
              'Gaz indiv sans cond',
              number('Installation x Gaz indiv sans cond x Individuel . consommation combustible chaleur'),
              '',
              number('Installation x Gaz indiv sans cond x Individuel . consommation auxilliaire'),
            ],
            [
              'Gaz coll avec cond',
              number('Installation x Gaz coll avec cond x Collectif . consommation combustible chaleur'),
              '',
              number('Installation x Gaz coll avec cond x Collectif . consommation auxilliaire'),
            ],
            [
              'Gaz coll sans cond',
              number('Installation x Gaz coll sans cond x Collectif . consommation combustible chaleur'),
              '',
              number('Installation x Gaz coll sans cond x Collectif . consommation auxilliaire'),
            ],
            [
              'Fioul indiv ',
              number('Installation x Fioul indiv x Individuel . consommation combustible chaleur'),
              '',
              number('Installation x Fioul indiv x Individuel . consommation auxilliaire'),
            ],
            [
              'Fioul coll',
              number('Installation x Fioul coll x Collectif . consommation combustible chaleur'),
              '',
              number('Installation x Fioul coll x Collectif . consommation auxilliaire'),
            ],
            [
              'PAC air/air indiv',
              number('Installation x PAC air-air x Individuel . consommation combustible chaleur'),
              number('Installation x PAC air-air x Individuel . consommation combustible froid'),
              number('Installation x PAC air-air x Individuel . consommation auxilliaire'),
            ],
            [
              'PAC air/air collectif/tertiaire',
              number('Installation x PAC air-air x Collectif . consommation combustible chaleur'),
              number('Installation x PAC air-air x Collectif . consommation combustible froid'),
              number('Installation x PAC air-air x Collectif . consommation auxilliaire'),
            ],
            [
              'PAC eau/eau indiv',
              number('Installation x PAC eau glycolée-eau capteurs verticaux x Individuel . consommation combustible chaleur'),
              '',
              number('Installation x PAC eau glycolée-eau capteurs verticaux x Individuel . consommation auxilliaire'),
            ],
            [
              'PAC eau/eau collectif/tertiaire',
              number('Installation x PAC eau-eau champs de sondes x Collectif . consommation combustible chaleur'),
              number('Installation x PAC eau-eau champs de sondes x Collectif . consommation combustible froid'),
              number('Installation x PAC eau-eau champs de sondes x Collectif . consommation auxilliaire'),
            ],
            [
              'PAC air/eau indiv',
              number('Installation x PAC air-eau x Individuel . consommation combustible chaleur'),
              number('Installation x PAC air-eau x Individuel . consommation combustible froid'),
              number('Installation x PAC air-eau x Individuel . consommation auxilliaire'),
            ],
            [
              'PAC air/eau collectif/tertiaire',
              number('Installation x PAC air-eau x Collectif . consommation combustible chaleur'),
              number('Installation x PAC air-eau x Collectif . consommation combustible froid'),
              number('Installation x PAC air-eau x Collectif . consommation auxilliaire'),
            ],
            ['Radiateur électrique', number('Installation x Radiateur électrique x Individuel . consommation combustible chaleur'), '', ''],
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
              number('Installation x Réseaux de chaleur x Collectif . consommation combustible hors électricité'),
              number(
                "Installation x Réseaux de chaleur x Collectif . consommation d'électricité lié au chauffage-refroidissement et à la production d'ECS"
              ),
            ],
            [
              'Réseaux de froid',
              number('Installation x Réseaux de froid x Collectif . consommation combustible hors électricité'),
              number(
                "Installation x Réseaux de froid x Collectif . consommation d'électricité lié au chauffage-refroidissement et à la production d'ECS"
              ),
            ],
            [
              'Poêle à granulés indiv',
              number('Installation x Poêle à granulés indiv x Individuel . consommation combustible hors électricité'),
              number(
                "Installation x Poêle à granulés indiv x Individuel . consommation d'électricité lié au chauffage-refroidissement et à la production d'ECS"
              ),
            ],
            [
              'Chaudière à granulés coll',
              number('Installation x Chaudière à granulés coll x Collectif . consommation combustible hors électricité'),
              number(
                "Installation x Chaudière à granulés coll x Collectif . consommation d'électricité lié au chauffage-refroidissement et à la production d'ECS"
              ),
            ],
            [
              'Gaz indiv avec cond',
              number('Installation x Gaz indiv avec cond x Individuel . consommation combustible hors électricité'),
              number(
                "Installation x Gaz indiv avec cond x Individuel . consommation d'électricité lié au chauffage-refroidissement et à la production d'ECS"
              ),
            ],
            [
              'Gaz indiv sans cond',
              number('Installation x Gaz indiv sans cond x Individuel . consommation combustible hors électricité'),
              number(
                "Installation x Gaz indiv sans cond x Individuel . consommation d'électricité lié au chauffage-refroidissement et à la production d'ECS"
              ),
            ],
            [
              'Gaz coll avec cond',
              number('Installation x Gaz coll avec cond x Collectif . consommation combustible hors électricité'),
              number(
                "Installation x Gaz coll avec cond x Collectif . consommation d'électricité lié au chauffage-refroidissement et à la production d'ECS"
              ),
            ],
            [
              'Gaz coll sans cond',
              number('Installation x Gaz coll sans cond x Collectif . consommation combustible hors électricité'),
              number(
                "Installation x Gaz coll sans cond x Collectif . consommation d'électricité lié au chauffage-refroidissement et à la production d'ECS"
              ),
            ],
            [
              'Fioul indiv ',
              number('Installation x Fioul indiv x Individuel . consommation combustible hors électricité'),
              number(
                "Installation x Fioul indiv x Individuel . consommation d'électricité lié au chauffage-refroidissement et à la production d'ECS"
              ),
            ],
            [
              'Fioul coll',
              number('Installation x Fioul coll x Collectif . consommation combustible hors électricité'),
              number(
                "Installation x Fioul coll x Collectif . consommation d'électricité lié au chauffage-refroidissement et à la production d'ECS"
              ),
            ],
            [
              'PAC air/air indiv',
              '',
              number(
                "Installation x PAC air-air x Individuel . consommation d'électricité lié au chauffage-refroidissement et à la production d'ECS"
              ),
            ],
            [
              'PAC air/air collectif/tertiaire',
              '',
              number(
                "Installation x PAC air-air x Collectif . consommation d'électricité lié au chauffage-refroidissement et à la production d'ECS"
              ),
            ],
            [
              'PAC eau/eau indiv',
              '',
              number(
                "Installation x PAC eau glycolée-eau capteurs verticaux x Individuel . consommation d'électricité lié au chauffage-refroidissement et à la production d'ECS"
              ),
            ],
            [
              'PAC eau/eau collectif/tertiaire',
              '',
              number(
                "Installation x PAC eau-eau champs de sondes x Collectif . consommation d'électricité lié au chauffage-refroidissement et à la production d'ECS"
              ),
            ],
            [
              'PAC air/eau indiv',
              '',
              number(
                "Installation x PAC air-eau x Individuel . consommation d'électricité lié au chauffage-refroidissement et à la production d'ECS"
              ),
            ],
            [
              'PAC air/eau collectif/tertiaire',
              '',
              number(
                "Installation x PAC air-eau x Collectif . consommation d'électricité lié au chauffage-refroidissement et à la production d'ECS"
              ),
            ],
            [
              'Radiateur électrique',
              '',
              number(
                "Installation x Radiateur électrique x Individuel . consommation d'électricité lié au chauffage-refroidissement et à la production d'ECS"
              ),
            ],
          ]}
        />

        <Table
          caption="Calculs environnementaux"
          headers={[
            'Installations',
            "Besoin d'installation supplémentaire pour produire l'ECS ?",
            // 'Combustible utilisé',
            'Scope 1 - Besoin de chauffage (kgCO2 équ.)',
            "Scope 1 - Besoin d'ecs (kgCO2 équ.)",
            'Scope 2 - Auxiliaires et combustible électrique (kgCO2 équ.)',
            'Scope 2 - Ecs solaire thermique',
            'Scope 2 - Eau chaude sanitaire avec ballon électrique',
            'Scope 3',
          ]}
          data={[
            [
              'Réseaux de chaleur',
              bool("Installation x Réseaux de chaleur x Collectif . besoin d'installation supplémentaire pour produire l'ECS"),
              number('env . Installation x Réseaux de chaleur x Collectif . besoins de chauffage'),
              number("env . Installation x Réseaux de chaleur x Collectif . besoins d'ECS"),
              number('env . Installation x Réseaux de chaleur x Collectif . auxiliaires et combustible électrique'),
              number('env . Installation x Réseaux de chaleur x Collectif . ECS solaire thermique'),
              number('env . Installation x Réseaux de chaleur x Collectif . ECS avec ballon électrique'),
              number('env . Installation x Réseaux de chaleur x Collectif . Scope 3'),
            ],
            [
              'Réseaux de froid',
              bool("Installation x Réseaux de froid x Collectif . besoin d'installation supplémentaire pour produire l'ECS"),
              number('env . Installation x Réseaux de froid x Collectif . besoins de chauffage'),
              number("env . Installation x Réseaux de froid x Collectif . besoins d'ECS"),
              number('env . Installation x Réseaux de froid x Collectif . auxiliaires et combustible électrique'),
              number('env . Installation x Réseaux de froid x Collectif . ECS solaire thermique'),
              number('env . Installation x Réseaux de froid x Collectif . ECS avec ballon électrique'),
              number('env . Installation x Réseaux de froid x Collectif . Scope 3'),
            ],
            [
              'Poêle à granulés indiv',
              bool("Installation x Poêle à granulés indiv x Individuel . besoin d'installation supplémentaire pour produire l'ECS"),
              number('env . Installation x Poêle à granulés indiv x Individuel . besoins de chauffage'),
              number("env . Installation x Poêle à granulés indiv x Individuel . besoins d'ECS"),
              number('env . Installation x Poêle à granulés indiv x Individuel . auxiliaires et combustible électrique'),
              number('env . Installation x Poêle à granulés indiv x Individuel . ECS solaire thermique'),
              number('env . Installation x Poêle à granulés indiv x Individuel . ECS avec ballon électrique'),
              number('env . Installation x Poêle à granulés indiv x Individuel . Scope 3'),
            ],
            [
              'Chaudière à granulés coll',
              bool("Installation x Chaudière à granulés coll x Collectif . besoin d'installation supplémentaire pour produire l'ECS"),
              number('env . Installation x Chaudière à granulés coll x Collectif . besoins de chauffage'),
              number("env . Installation x Chaudière à granulés coll x Collectif . besoins d'ECS"),
              number('env . Installation x Chaudière à granulés coll x Collectif . auxiliaires et combustible électrique'),
              number('env . Installation x Chaudière à granulés coll x Collectif . ECS solaire thermique'),
              number('env . Installation x Chaudière à granulés coll x Collectif . ECS avec ballon électrique'),
              number('env . Installation x Chaudière à granulés coll x Collectif . Scope 3'),
            ],
            [
              'Gaz indiv avec cond',
              bool("Installation x Gaz indiv avec cond x Individuel . besoin d'installation supplémentaire pour produire l'ECS"),
              number('env . Installation x Gaz indiv avec cond x Individuel . besoins de chauffage'),
              number("env . Installation x Gaz indiv avec cond x Individuel . besoins d'ECS"),
              number('env . Installation x Gaz indiv avec cond x Individuel . auxiliaires et combustible électrique'),
              number('env . Installation x Gaz indiv avec cond x Individuel . ECS solaire thermique'),
              number('env . Installation x Gaz indiv avec cond x Individuel . ECS avec ballon électrique'),
              number('env . Installation x Gaz indiv avec cond x Individuel . Scope 3'),
            ],
            [
              'Gaz indiv sans cond',
              bool("Installation x Gaz indiv sans cond x Individuel . besoin d'installation supplémentaire pour produire l'ECS"),
              number('env . Installation x Gaz indiv sans cond x Individuel . besoins de chauffage'),
              number("env . Installation x Gaz indiv sans cond x Individuel . besoins d'ECS"),
              number('env . Installation x Gaz indiv sans cond x Individuel . auxiliaires et combustible électrique'),
              number('env . Installation x Gaz indiv sans cond x Individuel . ECS solaire thermique'),
              number('env . Installation x Gaz indiv sans cond x Individuel . ECS avec ballon électrique'),
              number('env . Installation x Gaz indiv sans cond x Individuel . Scope 3'),
            ],
            [
              'Gaz coll avec cond',
              bool("Installation x Gaz coll avec cond x Collectif . besoin d'installation supplémentaire pour produire l'ECS"),
              number('env . Installation x Gaz coll avec cond x Collectif . besoins de chauffage'),
              number("env . Installation x Gaz coll avec cond x Collectif . besoins d'ECS"),
              number('env . Installation x Gaz coll avec cond x Collectif . auxiliaires et combustible électrique'),
              number('env . Installation x Gaz coll avec cond x Collectif . ECS solaire thermique'),
              number('env . Installation x Gaz coll avec cond x Collectif . ECS avec ballon électrique'),
              number('env . Installation x Gaz coll avec cond x Collectif . Scope 3'),
            ],
            [
              'Gaz coll sans cond',
              bool("Installation x Gaz coll sans cond x Collectif . besoin d'installation supplémentaire pour produire l'ECS"),
              number('env . Installation x Gaz coll sans cond x Collectif . besoins de chauffage'),
              number("env . Installation x Gaz coll sans cond x Collectif . besoins d'ECS"),
              number('env . Installation x Gaz coll sans cond x Collectif . auxiliaires et combustible électrique'),
              number('env . Installation x Gaz coll sans cond x Collectif . ECS solaire thermique'),
              number('env . Installation x Gaz coll sans cond x Collectif . ECS avec ballon électrique'),
              number('env . Installation x Gaz coll sans cond x Collectif . Scope 3'),
            ],
            [
              'Fioul indiv ',
              bool("Installation x Fioul indiv x Individuel . besoin d'installation supplémentaire pour produire l'ECS"),
              number('env . Installation x Fioul indiv x Individuel . besoins de chauffage'),
              number("env . Installation x Fioul indiv x Individuel . besoins d'ECS"),
              number('env . Installation x Fioul indiv x Individuel . auxiliaires et combustible électrique'),
              number('env . Installation x Fioul indiv x Individuel . ECS solaire thermique'),
              number('env . Installation x Fioul indiv x Individuel . ECS avec ballon électrique'),
              number('env . Installation x Fioul indiv x Individuel . Scope 3'),
            ],
            [
              'Fioul coll',
              bool("Installation x Fioul coll x Collectif . besoin d'installation supplémentaire pour produire l'ECS"),
              number('env . Installation x Fioul coll x Collectif . besoins de chauffage'),
              number("env . Installation x Fioul coll x Collectif . besoins d'ECS"),
              number('env . Installation x Fioul coll x Collectif . auxiliaires et combustible électrique'),
              number('env . Installation x Fioul coll x Collectif . ECS solaire thermique'),
              number('env . Installation x Fioul coll x Collectif . ECS avec ballon électrique'),
              number('env . Installation x Fioul coll x Collectif . Scope 3'),
            ],
            [
              'PAC air/air indiv',
              bool("Installation x PAC air-air x Individuel . besoin d'installation supplémentaire pour produire l'ECS"),
              number('env . Installation x PAC air-air x Individuel . besoins de chauffage'),
              number("env . Installation x PAC air-air x Individuel . besoins d'ECS"),
              number('env . Installation x PAC air-air x Individuel . auxiliaires et combustible électrique'),
              number('env . Installation x PAC air-air x Individuel . ECS solaire thermique'),
              number('env . Installation x PAC air-air x Individuel . ECS avec ballon électrique'),
              number('env . Installation x PAC air-air x Individuel . Scope 3'),
            ],
            [
              'PAC air/air collectif/tertiaire',
              bool("Installation x PAC air-air x Collectif . besoin d'installation supplémentaire pour produire l'ECS"),
              number('env . Installation x PAC air-air x Collectif . besoins de chauffage'),
              number("env . Installation x PAC air-air x Collectif . besoins d'ECS"),
              number('env . Installation x PAC air-air x Collectif . auxiliaires et combustible électrique'),
              number('env . Installation x PAC air-air x Collectif . ECS solaire thermique'),
              number('env . Installation x PAC air-air x Collectif . ECS avec ballon électrique'),
              number('env . Installation x PAC air-air x Collectif . Scope 3'),
            ],
            [
              'PAC eau/eau indiv',
              bool(
                "Installation x PAC eau glycolée-eau capteurs verticaux x Individuel . besoin d'installation supplémentaire pour produire l'ECS"
              ),
              number('env . Installation x PAC eau-eau x Individuel . besoins de chauffage'),
              number("env . Installation x PAC eau-eau x Individuel . besoins d'ECS"),
              number('env . Installation x PAC eau-eau x Individuel . auxiliaires et combustible électrique'),
              number('env . Installation x PAC eau-eau x Individuel . ECS solaire thermique'),
              number('env . Installation x PAC eau-eau x Individuel . ECS avec ballon électrique'),
              number('env . Installation x PAC eau-eau x Individuel . Scope 3'),
            ],
            [
              'PAC eau/eau collectif/tertiaire',
              bool("Installation x PAC eau-eau champs de sondes x Collectif . besoin d'installation supplémentaire pour produire l'ECS"),
              number('env . Installation x PAC eau-eau x Collectif . besoins de chauffage'),
              number("env . Installation x PAC eau-eau x Collectif . besoins d'ECS"),
              number('env . Installation x PAC eau-eau x Collectif . auxiliaires et combustible électrique'),
              number('env . Installation x PAC eau-eau x Collectif . ECS solaire thermique'),
              number('env . Installation x PAC eau-eau x Collectif . ECS avec ballon électrique'),
              number('env . Installation x PAC eau-eau x Collectif . Scope 3'),
            ],
            [
              'PAC air/eau indiv',
              bool("Installation x PAC air-eau x Individuel . besoin d'installation supplémentaire pour produire l'ECS"),
              number('env . Installation x PAC air-eau x Individuel . besoins de chauffage'),
              number("env . Installation x PAC air-eau x Individuel . besoins d'ECS"),
              number('env . Installation x PAC air-eau x Individuel . auxiliaires et combustible électrique'),
              number('env . Installation x PAC air-eau x Individuel . ECS solaire thermique'),
              number('env . Installation x PAC air-eau x Individuel . ECS avec ballon électrique'),
              number('env . Installation x PAC air-eau x Individuel . Scope 3'),
            ],
            [
              'PAC air/eau collectif/tertiaire',
              bool("Installation x PAC air-eau x Collectif . besoin d'installation supplémentaire pour produire l'ECS"),
              number('env . Installation x PAC air-eau x Collectif . besoins de chauffage'),
              number("env . Installation x PAC air-eau x Collectif . besoins d'ECS"),
              number('env . Installation x PAC air-eau x Collectif . auxiliaires et combustible électrique'),
              number('env . Installation x PAC air-eau x Collectif . ECS solaire thermique'),
              number('env . Installation x PAC air-eau x Collectif . ECS avec ballon électrique'),
              number('env . Installation x PAC air-eau x Collectif . Scope 3'),
            ],
            [
              'Radiateur électrique',
              bool("Installation x Radiateur électrique x Individuel . besoin d'installation supplémentaire pour produire l'ECS"),
              number('env . Installation x Radiateur électrique x Individuel . besoins de chauffage'),
              number("env . Installation x Radiateur électrique x Individuel . besoins d'ECS"),
              number('env . Installation x Radiateur électrique x Individuel . auxiliaires et combustible électrique'),
              number('env . Installation x Radiateur électrique x Individuel . ECS solaire thermique'),
              number('env . Installation x Radiateur électrique x Individuel . ECS avec ballon électrique'),
              number('env . Installation x Radiateur électrique x Individuel . Scope 3'),
            ],
          ]}
        />
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
