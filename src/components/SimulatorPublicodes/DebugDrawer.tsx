import { DottedName } from '@betagouv/france-chaleur-urbaine-publicodes';
import Button from '@codegouvfr/react-dsfr/Button';
import Table from '@codegouvfr/react-dsfr/Table';
import { Drawer } from '@mui/material';
import { useState } from 'react';
import styled from 'styled-components';

import { type SimulatorEngine } from './useSimulatorEngine';

type DebugDrawerProps = {
  engine: SimulatorEngine;
};

const DebugDrawer = ({ engine }: DebugDrawerProps) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const number = (key: DottedName) => {
    return Math.round(engine.getField(key) as number);
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
              'RCU',
              bool("Installation x Réseaux de chaleur x Collectif . besoin d'installation supplémentaire pour produire l'ECS"),
              number('env . Installation x Réseaux de chaleur x Collectif . besoins de chauffage'),
              number("env . Installation x Réseaux de chaleur x Collectif . besoins d'ECS"),
              number('env . Installation x Réseaux de chaleur x Collectif . auxiliaires et combustible électrique'),
              number('env . Installation x Réseaux de chaleur x Collectif . ECS solaire thermique'),
              number('env . Installation x Réseaux de chaleur x Collectif . ECS avec ballon électrique'),
              number('env . Installation x Réseaux de chaleur x Collectif . Scope 3'),
            ],
            [
              'RFU',
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
