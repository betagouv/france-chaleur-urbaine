import type { RuleName } from '@betagouv/france-chaleur-urbaine-publicodes';
import Button from '@codegouvfr/react-dsfr/Button';
import { useState } from 'react';
import styled from 'styled-components';

import Box from '@/components/ui/Box';
import Drawer from '@/components/ui/Drawer';
import Heading from '@/components/ui/Heading';
import Icon from '@/components/ui/Icon';
import Tooltip from '@/components/ui/Tooltip';
import TableSimple from '@/components/ui/table/TableSimple';
import { trackPostHogEvent } from '@/modules/analytics/client';
import { RuleExplanationDialog } from '@/modules/publicodes/client/RuleExplanationDialog';
import { formatUnit } from '@/modules/publicodes/format';

import { modesDeChauffage } from './mappings';
import type { SimulatorEngine } from './useSimulatorEngine';

const DebugDrawer = ({ engine }: { engine: SimulatorEngine }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Une seule dialog partagée pour toutes les valeurs du tableau (pas une par cellule)
  const [explainedRule, setExplainedRule] = useState<RuleName | null>(null);

  const roundNumber = (key: RuleName) => {
    const node = engine.getNode(key);
    const value = Math.round(node.nodeValue as number);
    const unit = node.unit ? formatUnit(node.unit) : '';
    return (
      <Tooltip title={key}>
        <div className="flex items-center gap-1">
          <strong>{value}</strong> <small className="text-faded leading-none">{unit}</small>{' '}
          <button
            type="button"
            onClick={() => setExplainedRule(key)}
            title={`Comprendre le calcul de « ${key} »`}
            className="ml-auto cursor-pointer px-0.5 text-blue-600 transition-colors hover:text-blue-800"
          >
            <Icon name="fr-icon-article-line" />
          </button>
        </div>
      </Tooltip>
    );
  };

  const number = (key: RuleName) => {
    const node = engine.getNode(key);
    const value = Math.round((node.nodeValue as number) * 1000) / 1000;
    const unit = node.unit ? formatUnit(node.unit) : '';
    return (
      <Tooltip title={key}>
        <div className="flex items-center gap-1">
          <strong>{value}</strong> <small className="text-faded leading-none">{unit}</small>{' '}
          <button
            type="button"
            onClick={() => setExplainedRule(key)}
            title={`Comprendre le calcul de « ${key} »`}
            className="ml-auto cursor-pointer px-0.5 text-blue-600 transition-colors hover:text-blue-800"
          >
            <Icon name="fr-icon-article-line" />
          </button>
        </div>
      </Tooltip>
    );
  };

  const bool = (key: RuleName) => {
    return (
      <Tooltip title={key}>
        <div className="flex items-center gap-1">
          {engine.getField(key) ? 'oui' : 'non'}{' '}
          <button
            type="button"
            onClick={() => setExplainedRule(key)}
            title={`Comprendre le calcul de « ${key} »`}
            className="ml-auto cursor-pointer px-0.5 text-blue-600 transition-colors hover:text-blue-800"
          >
            <Icon name="fr-icon-article-line" />
          </button>
        </div>
      </Tooltip>
    );
  };

  return (
    <>
      <FloatingButton
        onClick={() => {
          trackPostHogEvent('comparator:cost_detail_posts_opened', engine.getSituation());
          setDrawerOpen(true);
        }}
        iconId="ri-table-2"
        style={{ background: 'grey', right: '-30px', top: '40%', width: '100px' }}
      >
        Détails
      </FloatingButton>

      {explainedRule && (
        <RuleExplanationDialog
          engine={engine.internalEngine}
          dottedName={explainedRule}
          open
          onOpenChange={(dialogOpen) => !dialogOpen && setExplainedRule(null)}
        />
      )}

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} direction="right" full>
        {drawerOpen && (
          <Box px="3w" maxWidth="100%">
            <Heading size="h2">Bilan 1an</Heading>

            <TableSimple
              fluid
              caption="Coûts par logement / tertiaire"
              columns={[
                { accessorKey: 'installation', header: 'Installation' },
                { accessorKey: 'p1Abo', header: 'P1 abo' },
                { accessorKey: 'p1ConsoChaud', header: 'P1 conso chaud' },
                { accessorKey: 'p1Prime', header: "P1'" },
                { accessorKey: 'p1Ecs', header: 'P1 ECS' },
                { accessorKey: 'p1ConsoFroid', header: 'P1 conso froid' },
                { accessorKey: 'p2', header: 'P2' },
                { accessorKey: 'p3', header: 'P3' },
                { accessorKey: 'p4', header: 'P4' },
                { accessorKey: 'p4MoinsAides', header: 'P4 moins aides' },
                { accessorKey: 'aides', header: 'Aides' },
                { accessorKey: 'totalSansAides', header: 'Total sans aides' },
                { accessorKey: 'totalAvecAides', header: 'Total avec aides' },
              ]}
              data={modesDeChauffage.map((m) => ({
                aides: roundNumber(`${m.publicodesKey} . bilan . aides`),
                installation: m.label,
                p1Abo: roundNumber(`${m.publicodesKey} . bilan . P1abo`),
                p1ConsoChaud: roundNumber(`${m.publicodesKey} . bilan . P1conso`),
                p1ConsoFroid: roundNumber(`${m.publicodesKey} . bilan . P1Consofroid`),
                p1Ecs: roundNumber(`${m.publicodesKey} . bilan . P1ECS`),
                p1Prime: roundNumber(`${m.publicodesKey} . bilan . P1prime`),
                p2: roundNumber(`${m.publicodesKey} . bilan . P2`),
                p3: roundNumber(`${m.publicodesKey} . bilan . P3`),
                p4: roundNumber(`${m.publicodesKey} . bilan . P4`),
                p4MoinsAides: roundNumber(`${m.publicodesKey} . bilan . P4 moins aides`),
                totalAvecAides: roundNumber(`${m.publicodesKey} . bilan . total avec aides`),
                totalSansAides: roundNumber(`${m.publicodesKey} . bilan . total sans aides`),
              }))}
            />

            <Heading size="h2">Calculs économiques</Heading>

            <TableSimple
              fluid
              caption="Coût d'achat du combustible"
              columns={[
                { accessorKey: 'parametres', header: 'Paramètres' },
                { accessorKey: 'partAbonnement', header: 'Part abonnement' },
                { accessorKey: 'partConsommation', header: 'Part consommation' },
                { accessorKey: 'heuresCreuses', header: 'Heures creuses' },
              ]}
              data={[
                {
                  parametres: 'Chaleur (RCU)',
                  partAbonnement: number('combustibles . réseau de chaleur . abonnement'),
                  partConsommation: number('combustibles . réseau de chaleur . consommation'),
                },
                {
                  parametres: 'Froid (RFU)',
                  partAbonnement: number('combustibles . réseau de froid . abonnement'),
                  partConsommation: number('combustibles . réseau de froid . consommation'),
                },
                {
                  heuresCreuses: number('combustibles . électricité . consommation individuel HC'),
                  parametres: 'Electricité indiv',
                  partAbonnement: number('combustibles . électricité . abonnement individuel'),
                  partConsommation: number('combustibles . électricité . consommation individuel HP'),
                },
                {
                  parametres: 'Electricité coll',
                  partAbonnement: number('combustibles . électricité . abonnement collectif'),
                  partConsommation: number('combustibles . électricité . consommation collectif'),
                },
                {
                  parametres: 'Gaz individuel',
                  partAbonnement: number('combustibles . gaz . abonnement individuel'),
                  partConsommation: number('combustibles . gaz . consommation individuel'),
                },
                {
                  parametres: 'Gaz collectif',
                  partAbonnement: number('combustibles . gaz . abonnement collectif'),
                  partConsommation: number('combustibles . gaz . consommation collectif'),
                },
                {
                  parametres: 'Granulés',
                  partConsommation: number('combustibles . granulés . consommation'),
                },
                {
                  parametres: 'Fioul',
                  partConsommation: number('combustibles . fioul . consommation'),
                },
              ]}
            />

            <TableSimple
              fluid
              caption="P4 - Investissement total (sans aide) €TTC"
              columns={[
                { accessorKey: 'installation', header: 'Installation' },
                { accessorKey: 'investissementTotal', header: 'Investissement équipement total (€)' },
                { accessorKey: 'investissementParLogement', header: 'Investissement équipement par lgt type / tertiaire (€)' },
                { accessorKey: 'investissementBallonAccumulation', header: 'Investissement ballon ECS à accumulation (€)' },
                { accessorKey: 'investissementBallonSolaire', header: 'Investissement ballon ECS solaire (panneau inclus) (€)' },
                { accessorKey: 'totalAvecBallonAccumulation', header: 'Total investissement avec ballon ECS à accumulation (€)' },
                { accessorKey: 'totalAvecBallonSolaire', header: 'Total investissement ballon ECS solaire (panneaux inclus) (€)' },
              ]}
              data={modesDeChauffage.map((m) => ({
                installation: m.label,
                investissementBallonAccumulation: roundNumber(`${m.publicodesKey} . coûts . investissement ballon ECS`),
                investissementBallonSolaire: roundNumber(`${m.publicodesKey} . coûts . investissement chauffe-eau solaire`),
                investissementParLogement: roundNumber(`${m.publicodesKey} . coûts . investissement par logement`),
                investissementTotal: roundNumber(`${m.publicodesKey} . coûts . investissement équipement`),
                totalAvecBallonAccumulation: roundNumber(`${m.publicodesKey} . coûts . investissement total avec ballon ECS`),
                totalAvecBallonSolaire: roundNumber(`${m.publicodesKey} . coûts . investissement total avec chauffe-eau solaire`),
              }))}
            />

            <TableSimple
              fluid
              caption="P1 - Coût du combustible par lgt type / tertiaire"
              columns={[
                { accessorKey: 'installation', header: 'Installation' },
                { accessorKey: 'coutAbonnement', header: 'Coût du combustible abonnement (P1 abo) €TTC/an' },
                { accessorKey: 'coutConsommation', header: 'Coût du combustible consommation (P1 conso) €TTC/an' },
                { accessorKey: 'coutElectriciteAuxiliaire', header: "Coût électricité auxilliaire (P1') €TTC/an" },
                { accessorKey: 'coutBallonAccumulation', header: 'Coût combustible pour ballon ECS à accumulation (P1 ECS) €TTC/an' },
                { accessorKey: 'coutBallonSolaire', header: 'Coût combustible pour ballon ECS solaire (P1 ECS) €TTC/an' },
              ]}
              data={modesDeChauffage.map((m) => ({
                coutAbonnement: roundNumber(`${m.publicodesKey} . coûts . P1 abonnement`),
                coutBallonAccumulation: roundNumber(`${m.publicodesKey} . coûts . P1 ballon ECS`),
                coutBallonSolaire: roundNumber(`${m.publicodesKey} . coûts . P1 chauffe-eau solaire`),
                coutConsommation: roundNumber(`${m.publicodesKey} . coûts . P1 consommation`),
                coutElectriciteAuxiliaire: roundNumber(`${m.publicodesKey} . coûts . P1 auxiliaires`),
                installation: m.label,
              }))}
            />

            <TableSimple
              fluid
              caption="P2, P3 - Coût de l'entretien"
              columns={[
                { accessorKey: 'installation', header: 'Installation' },
                { accessorKey: 'petitEntretien', header: 'Petit entretien (P2) €TTC/an' },
                { accessorKey: 'grosEntretien', header: 'Gros entretien (P3) €TTC/an' },
                { accessorKey: 'petitEntretienParLogement', header: 'Par logement/tertiaire - Petit entretien (P2) €TTC/an' },
                { accessorKey: 'grosEntretienParLogement', header: 'Par logement/tertiaire - Gros entretien (P3) €TTC/an' },
              ]}
              data={modesDeChauffage.map((m) => ({
                grosEntretien: roundNumber(`${m.publicodesKey} . coûts . gros entretien P3`),
                grosEntretienParLogement: roundNumber(`${m.publicodesKey} . coûts . gros entretien P3 par logement tertiaire`),
                installation: m.label,
                petitEntretien: roundNumber(`${m.publicodesKey} . coûts . petit entretien P2`),
                petitEntretienParLogement: roundNumber(`${m.publicodesKey} . coûts . petit entretien P2 par logement tertiaire`),
              }))}
            />

            <TableSimple
              fluid
              caption="Montant des aides par logement/tertiaire"
              columns={[
                { accessorKey: 'installation', header: 'Installation' },
                { accessorKey: 'maPrimeRenov', header: "Ma prime renov' (€)" },
                { accessorKey: 'coupDePouce', header: 'Coup de pouce (€)' },
                { accessorKey: 'cee', header: 'CEE (€)' },
                { accessorKey: 'totalAides', header: 'Coût total des aides (€)' },
              ]}
              data={[
                ...modesDeChauffage.map((m) => ({
                  cee: roundNumber(`${m.publicodesKey} . aides . CEE`),
                  coupDePouce: roundNumber(`${m.publicodesKey} . aides . coup de pouce`),
                  installation: m.label,
                  maPrimeRenov: roundNumber(`${m.publicodesKey} . aides . ma prime rénov`),
                  totalAides: roundNumber(`${m.publicodesKey} . aides . total`),
                })),
                {
                  cee: roundNumber('ecs additionnelle . aides panneau solaire . CEE'),
                  coupDePouce: roundNumber('ecs additionnelle . aides panneau solaire . coup de pouce'),
                  installation: 'Panneau solaire thermique pour production ECS',
                  maPrimeRenov: roundNumber('ecs additionnelle . aides panneau solaire . ma prime rénov'),
                  totalAides: roundNumber('ecs additionnelle . aides panneau solaire . total'),
                },
              ]}
            />

            <Heading size="h2">Calculs techniques</Heading>

            <TableSimple
              fluid
              caption="Puissance totale des installations"
              columns={[
                { accessorKey: 'installation', header: 'Installation' },
                { accessorKey: 'productionEcs', header: 'Production eau chaude sanitaire ?' },
                { accessorKey: 'puissanceChauffage', header: 'Puissance nécessaire équipement chauffage (kW)' },
                { accessorKey: 'puissanceEcs', header: 'Puissance nécessaire pour ECS avec équipement (kW)' },
                { accessorKey: 'puissanceRefroidissement', header: 'Puissance nécessaire pour refroidissement équipement (kW)' },
                { accessorKey: 'puissanceEquipement', header: 'Puissance équipement (kW)' },
                { accessorKey: 'gammePuissance', header: 'Gamme de puissance existante (kW)' },
              ]}
              data={[
                {
                  gammePuissance: roundNumber('réseau de chaleur . installation . puissance retenue'),
                  installation: 'Réseaux de chaleur',
                  productionEcs: bool('réseau de chaleur . installation . production eau chaude sanitaire'),
                  puissanceChauffage: roundNumber('réseau de chaleur . installation . puissance chauffage'),
                  puissanceEcs: roundNumber('réseau de chaleur . installation . puissance ECS'),
                  puissanceEquipement: roundNumber('réseau de chaleur . installation . puissance équipement'),
                },
                {
                  gammePuissance: roundNumber('réseau de froid . installation . puissance retenue'),
                  installation: 'Réseaux de froid',
                  productionEcs: bool('réseau de froid . installation . production eau chaude sanitaire'),
                  puissanceEquipement: roundNumber('réseau de froid . installation . puissance équipement'),
                  puissanceRefroidissement: roundNumber('réseau de froid . installation . puissance refroidissement'),
                },
                {
                  gammePuissance: roundNumber('poêle à granulés . installation . puissance retenue'),
                  installation: 'Poêle à granulés indiv',
                  productionEcs: bool('poêle à granulés . installation . production eau chaude sanitaire'),
                  puissanceChauffage: roundNumber('poêle à granulés . installation . puissance chauffage'),
                  puissanceEquipement: roundNumber('poêle à granulés . installation . puissance équipement'),
                },
                {
                  gammePuissance: roundNumber('chaudière à granulés . installation . puissance retenue'),
                  installation: 'Chaudière à granulés coll',
                  productionEcs: bool('chaudière à granulés . installation . production eau chaude sanitaire'),
                  puissanceChauffage: roundNumber('chaudière à granulés . installation . puissance chauffage'),
                  puissanceEcs: roundNumber('chaudière à granulés . installation . puissance ECS'),
                  puissanceEquipement: roundNumber('chaudière à granulés . installation . puissance équipement'),
                },
                {
                  gammePuissance: roundNumber('gaz indiv avec cond . installation . puissance retenue'),
                  installation: 'Gaz indiv avec cond',
                  productionEcs: bool('gaz indiv avec cond . installation . production eau chaude sanitaire'),
                  puissanceChauffage: roundNumber('gaz indiv avec cond . installation . puissance chauffage'),
                  puissanceEcs: roundNumber('gaz indiv avec cond . installation . puissance ECS'),
                  puissanceEquipement: roundNumber('gaz indiv avec cond . installation . puissance équipement'),
                },
                {
                  gammePuissance: roundNumber('gaz indiv sans cond . installation . puissance retenue'),
                  installation: 'Gaz indiv sans cond',
                  productionEcs: bool('gaz indiv sans cond . installation . production eau chaude sanitaire'),
                  puissanceChauffage: roundNumber('gaz indiv sans cond . installation . puissance chauffage'),
                  puissanceEcs: roundNumber('gaz indiv sans cond . installation . puissance ECS'),
                  puissanceEquipement: roundNumber('gaz indiv sans cond . installation . puissance équipement'),
                },
                {
                  gammePuissance: roundNumber('gaz coll avec cond . installation . puissance retenue'),
                  installation: 'Gaz coll avec cond',
                  productionEcs: bool('gaz coll avec cond . installation . production eau chaude sanitaire'),
                  puissanceChauffage: roundNumber('gaz coll avec cond . installation . puissance chauffage'),
                  puissanceEcs: roundNumber('gaz coll avec cond . installation . puissance ECS'),
                  puissanceEquipement: roundNumber('gaz coll avec cond . installation . puissance équipement'),
                },
                {
                  gammePuissance: roundNumber('gaz coll sans cond . installation . puissance retenue'),
                  installation: 'Gaz coll sans cond',
                  productionEcs: bool('gaz coll sans cond . installation . production eau chaude sanitaire'),
                  puissanceChauffage: roundNumber('gaz coll sans cond . installation . puissance chauffage'),
                  puissanceEcs: roundNumber('gaz coll sans cond . installation . puissance ECS'),
                  puissanceEquipement: roundNumber('gaz coll sans cond . installation . puissance équipement'),
                },
                {
                  gammePuissance: roundNumber('fioul indiv . installation . puissance retenue'),
                  installation: 'Fioul indiv',
                  productionEcs: bool('fioul indiv . installation . production eau chaude sanitaire'),
                  puissanceChauffage: roundNumber('fioul indiv . installation . puissance chauffage'),
                  puissanceEcs: roundNumber('fioul indiv . installation . puissance ECS'),
                  puissanceEquipement: roundNumber('fioul indiv . installation . puissance équipement'),
                },
                {
                  gammePuissance: roundNumber('fioul coll . installation . puissance retenue'),
                  installation: 'Fioul coll',
                  productionEcs: bool('fioul coll . installation . production eau chaude sanitaire'),
                  puissanceChauffage: roundNumber('fioul coll . installation . puissance chauffage'),
                  puissanceEcs: roundNumber('fioul coll . installation . puissance ECS'),
                  puissanceEquipement: roundNumber('fioul coll . installation . puissance équipement'),
                },
                {
                  gammePuissance: roundNumber('PAC air-air indiv . installation . puissance retenue'),
                  installation: 'PAC air/air indiv',
                  productionEcs: bool('PAC air-air indiv . installation . production eau chaude sanitaire'),
                  puissanceChauffage: roundNumber('PAC air-air indiv . installation . puissance chauffage'),
                  puissanceEquipement: roundNumber('PAC air-air indiv . installation . puissance équipement'),
                  puissanceRefroidissement: roundNumber('PAC air-air indiv . installation . puissance refroidissement'),
                },
                {
                  gammePuissance: roundNumber('PAC air-air coll . installation . puissance retenue'),
                  installation: 'PAC air/air collectif/tertiaire',
                  productionEcs: bool('PAC air-air coll . installation . production eau chaude sanitaire'),
                  puissanceChauffage: roundNumber('PAC air-air coll . installation . puissance chauffage'),
                  puissanceEquipement: roundNumber('PAC air-air coll . installation . puissance équipement'),
                  puissanceRefroidissement: roundNumber('PAC air-air coll . installation . puissance refroidissement'),
                },
                {
                  gammePuissance: roundNumber('PAC eau-eau indiv . installation . puissance retenue'),
                  installation: 'PAC eau/eau indiv',
                  productionEcs: bool('PAC eau-eau indiv . installation . production eau chaude sanitaire'),
                  puissanceChauffage: roundNumber('PAC eau-eau indiv . installation . puissance chauffage'),
                  puissanceEcs: roundNumber('PAC eau-eau indiv . installation . puissance ECS'),
                  puissanceEquipement: roundNumber('PAC eau-eau indiv . installation . puissance équipement'),
                },
                {
                  gammePuissance: roundNumber('PAC eau-eau coll . installation . puissance retenue'),
                  installation: 'PAC eau/eau collectif/tertiaire',
                  productionEcs: bool('PAC eau-eau coll . installation . production eau chaude sanitaire'),
                  puissanceChauffage: roundNumber('PAC eau-eau coll . installation . puissance chauffage'),
                  puissanceEcs: roundNumber('PAC eau-eau coll . installation . puissance ECS'),
                  puissanceEquipement: roundNumber('PAC eau-eau coll . installation . puissance équipement'),
                },
                {
                  gammePuissance: roundNumber('PAC air-eau indiv . installation . puissance retenue'),
                  installation: 'PAC air/eau indiv',
                  productionEcs: bool('PAC air-eau indiv . installation . production eau chaude sanitaire'),
                  puissanceChauffage: roundNumber('PAC air-eau indiv . installation . puissance chauffage'),
                  puissanceEcs: roundNumber('PAC air-eau indiv . installation . puissance ECS'),
                  puissanceEquipement: roundNumber('PAC air-eau indiv . installation . puissance équipement'),
                  puissanceRefroidissement: roundNumber('PAC air-eau indiv . installation . puissance refroidissement'),
                },
                {
                  gammePuissance: roundNumber('PAC air-eau coll . installation . puissance retenue'),
                  installation: 'PAC air/eau collectif/tertiaire',
                  productionEcs: bool('PAC air-eau coll . installation . production eau chaude sanitaire'),
                  puissanceChauffage: roundNumber('PAC air-eau coll . installation . puissance chauffage'),
                  puissanceEcs: roundNumber('PAC air-eau coll . installation . puissance ECS'),
                  puissanceEquipement: roundNumber('PAC air-eau coll . installation . puissance équipement'),
                  puissanceRefroidissement: roundNumber('PAC air-eau coll . installation . puissance refroidissement'),
                },
                {
                  gammePuissance: roundNumber('radiateur électrique . installation . puissance retenue'),
                  installation: 'Radiateur électrique',
                  productionEcs: bool('radiateur électrique . installation . production eau chaude sanitaire'),
                  puissanceChauffage: roundNumber('radiateur électrique . installation . puissance chauffage'),
                  puissanceEquipement: roundNumber('radiateur électrique . installation . puissance équipement'),
                },
              ]}
            />

            <TableSimple
              fluid
              caption="Si besoins équipements ECS différenciés"
              columns={[
                { accessorKey: 'installation', header: 'Installation' },
                { accessorKey: 'besoinInstallation', header: "Besoin d'installation supplémentaire pour produire l'ECS ?" },
                { accessorKey: 'volumeBallon', header: 'Volume du ballon ECS (L)' },
                { accessorKey: 'consommationElectricite', header: "Consommation d'électricité (kWh/an)" },
                { accessorKey: 'appointElectricite', header: "Appoint d'éléctricité (kWh/an)" },
              ]}
              data={modesDeChauffage.map((m) => ({
                appointElectricite: roundNumber(`${m.publicodesKey} . installation . appoint chauffe-eau solaire`),
                besoinInstallation: bool(`${m.publicodesKey} . installation . ECS additionnelle nécessaire`),
                consommationElectricite: roundNumber(`${m.publicodesKey} . installation . consommation chauffe-eau électrique`),
                installation: m.label,
                volumeBallon: roundNumber(`${m.publicodesKey} . installation . volume du ballon ECS`),
              }))}
            />

            <TableSimple
              fluid
              caption="Bilan par lgt / tertiaire"
              columns={[
                { accessorKey: 'installation', header: 'Installation' },
                { accessorKey: 'consommationChaleur', header: 'Consommation combustible chaleur' },
                { accessorKey: 'consommationFroid', header: 'Consommation combustible froid' },
                { accessorKey: 'consommationAuxiliaire', header: 'Consommation auxiliaire (kWh elec/an)' },
              ]}
              data={modesDeChauffage.map((m) => ({
                consommationAuxiliaire: roundNumber(`${m.publicodesKey} . installation . consommation auxiliaire`),
                consommationChaleur: roundNumber(`${m.publicodesKey} . installation . consommation combustible chaleur`),
                consommationFroid: roundNumber(`${m.publicodesKey} . installation . consommation combustible froid`),
                installation: m.label,
              }))}
            />

            <TableSimple
              fluid
              caption="Bilan des consommations par lgt / tertiaire"
              columns={[
                { accessorKey: 'installation', header: 'Installation' },
                { accessorKey: 'consommationHorsElectricite', header: 'Consommation combustible hors électricité' },
                {
                  accessorKey: 'consommationElectricite',
                  header: "Consommation d'électricité lié au chauffage/refroidissement et à la production d'ECS (kWh/an)",
                },
              ]}
              data={modesDeChauffage.map((m) => ({
                consommationElectricite: roundNumber(`${m.publicodesKey} . installation . consommation électricité`),
                consommationHorsElectricite: roundNumber(`${m.publicodesKey} . installation . consommation hors électricité`),
                installation: m.label,
              }))}
            />

            <Heading size="h2">Calculs environnementaux</Heading>

            <TableSimple
              fluid
              caption="Emissions de CO2"
              columns={[
                { accessorKey: 'installation', header: 'Installation' },
                { accessorKey: 'besoinInstallation', header: "Besoin d'installation supplémentaire pour produire l'ECS ?" },
                { accessorKey: 'scope1', header: 'Scope 1 - Besoin de chauffage et ECS si même équipement (kgCO2 équ.)' },
                { accessorKey: 'scope2Auxiliaires', header: 'Scope 2 - Auxiliaires et combustible électrique (kgCO2 équ.)' },
                { accessorKey: 'scope2EcsSolaire', header: 'Scope 2 - Ecs solaire thermique' },
                { accessorKey: 'scope2EcsBallon', header: 'Scope 2 - Eau chaude sanitaire avec ballon électrique' },
                { accessorKey: 'scope2Total', header: 'Scope 2 - Total' },
                { accessorKey: 'scope3', header: 'Scope 3' },
                { accessorKey: 'total', header: 'Total des émissions' },
              ]}
              data={modesDeChauffage.map((m) => ({
                besoinInstallation: bool(`${m.publicodesKey} . installation . ECS additionnelle nécessaire`),
                installation: m.label,
                scope1: roundNumber(`${m.publicodesKey} . environnement . besoins de chauffage et ECS si même équipement`),
                scope2Auxiliaires: roundNumber(`${m.publicodesKey} . environnement . auxiliaires et combustible électrique`),
                scope2EcsBallon: roundNumber(`${m.publicodesKey} . environnement . ECS avec ballon électrique`),
                scope2EcsSolaire: roundNumber(`${m.publicodesKey} . environnement . ECS solaire thermique`),
                scope2Total: roundNumber(`${m.publicodesKey} . environnement . scope 2`),
                scope3: roundNumber(`${m.publicodesKey} . environnement . scope 3`),
                total: roundNumber(`${m.publicodesKey} . environnement . total`),
              }))}
            />
          </Box>
        )}
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
