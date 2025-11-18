import type { RuleName } from '@betagouv/france-chaleur-urbaine-publicodes';
import Button from '@codegouvfr/react-dsfr/Button';
import { utils } from 'publicodes';
import { useState } from 'react';
import styled from 'styled-components';

import { clientConfig } from '@/client-config';
import { formatUnit } from '@/components/ComparateurPublicodes/usePublicodesEngine';
import Box from '@/components/ui/Box';
import Drawer from '@/components/ui/Drawer';
import Heading from '@/components/ui/Heading';
import Icon from '@/components/ui/Icon';
import Link from '@/components/ui/Link';
import Tooltip from '@/components/ui/Tooltip';
import TableSimple from '@/components/ui/table/TableSimple';

import { modesDeChauffage } from './mappings';
import type { SimulatorEngine } from './useSimulatorEngine';

type DebugDrawerProps = {
  engine: SimulatorEngine;
};

const DebugDrawer = ({ engine }: DebugDrawerProps) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const serializedSituation = encodeURIComponent(JSON.stringify(engine.getSituation()));

  const roundNumber = (key: RuleName) => {
    const node = engine.getNode(key);
    const value = Math.round(node.nodeValue as number);
    const unit = node.unit ? formatUnit(node.unit) : '';
    return (
      <Tooltip title={key}>
        <div className="flex items-center gap-1">
          <strong>{value}</strong> <small className="text-faded leading-none">{unit}</small>{' '}
          <Link
            variant="tertiaryNoOutline"
            href={`${clientConfig.publicodesDocumentationURL}/doc/${utils.encodeRuleName(key)}?situation=${serializedSituation}`}
            isExternal
            className="reset-external px-0.5! ml-auto"
          >
            <Icon name="fr-icon-article-line" />
          </Link>
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
          <Link
            variant="tertiaryNoOutline"
            href={`${clientConfig.publicodesDocumentationURL}/doc/${utils.encodeRuleName(key)}?situation=${serializedSituation}`}
            isExternal
            className="reset-external px-0.5! ml-auto"
          >
            <Icon name="fr-icon-article-line" />
          </Link>
        </div>
      </Tooltip>
    );
  };

  const bool = (key: RuleName) => {
    return (
      <Tooltip title={key}>
        <div className="flex items-center gap-1">
          {engine.getField(key) ? 'oui' : 'non'}{' '}
          <Link
            variant="tertiaryNoOutline"
            href={`${clientConfig.publicodesDocumentationURL}/doc/${utils.encodeRuleName(key)}?situation=${serializedSituation}`}
            isExternal
            className="reset-external px-0.5! ml-auto"
          >
            <Icon name="fr-icon-article-line" />
          </Link>
        </div>
      </Tooltip>
    );
  };

  return (
    <>
      <FloatingButton
        onClick={() => setDrawerOpen(true)}
        iconId="ri-table-2"
        style={{ background: 'grey', right: '-30px', top: '40%', width: '100px' }}
      >
        Détails
      </FloatingButton>

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
                aides: roundNumber(`Bilan x ${m.coutPublicodeKey} . aides`),
                installation: m.label,
                p1Abo: roundNumber(`Bilan x ${m.coutPublicodeKey} . P1abo`),
                p1ConsoChaud: roundNumber(`Bilan x ${m.coutPublicodeKey} . P1conso`),
                p1ConsoFroid: roundNumber(`Bilan x ${m.coutPublicodeKey} . P1Consofroid`),
                p1Ecs: roundNumber(`Bilan x ${m.coutPublicodeKey} . P1ECS`),
                p1Prime: roundNumber(`Bilan x ${m.coutPublicodeKey} . P1prime`),
                p2: roundNumber(`Bilan x ${m.coutPublicodeKey} . P2`),
                p3: roundNumber(`Bilan x ${m.coutPublicodeKey} . P3`),
                p4: roundNumber(`Bilan x ${m.coutPublicodeKey} . P4`),
                p4MoinsAides: roundNumber(`Bilan x ${m.coutPublicodeKey} . P4 moins aides`),
                totalAvecAides: roundNumber(`Bilan x ${m.coutPublicodeKey} . total avec aides`),
                totalSansAides: roundNumber(`Bilan x ${m.coutPublicodeKey} . total sans aides`),
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
                  partAbonnement: number("Calcul Eco . Coût d'achat du combustible . Chaleur RCU x Part abonnement"),
                  partConsommation: number("Calcul Eco . Coût d'achat du combustible . Chaleur RCU x Part consommation"),
                },
                {
                  parametres: 'Froid (RFU)',
                  partAbonnement: number("Calcul Eco . Coût d'achat du combustible . Froid RFU x Part abonnement"),
                  partConsommation: number("Calcul Eco . Coût d'achat du combustible . Froid RFU x Part consommation"),
                },
                {
                  heuresCreuses: number("Calcul Eco . Coût d'achat du combustible . Electricité indiv x Part consommation HC"),
                  parametres: 'Electricité indiv',
                  partAbonnement: number("Calcul Eco . Coût d'achat du combustible . Electricité indiv x Part abonnement"),
                  partConsommation: number("Calcul Eco . Coût d'achat du combustible . Electricité indiv x Part consommation HP"),
                },
                {
                  parametres: 'Electricité coll',
                  partAbonnement: number("Calcul Eco . Coût d'achat du combustible . Electricité coll x Part abonnement"),
                  partConsommation: number("Calcul Eco . Coût d'achat du combustible . Electricité coll x Part consommation"),
                },
                {
                  parametres: 'Gaz individuel',
                  partAbonnement: number("Calcul Eco . Coût d'achat du combustible . Gaz indiv x Part abonnement"),
                  partConsommation: number("Calcul Eco . Coût d'achat du combustible . Gaz indiv x Part consommation"),
                },
                {
                  parametres: 'Gaz collectif',
                  partAbonnement: number("Calcul Eco . Coût d'achat du combustible . Gaz coll x Part abonnement"),
                  partConsommation: number("Calcul Eco . Coût d'achat du combustible . Gaz coll x Part consommation"),
                },
                {
                  parametres: 'Granulés',
                  partConsommation: number("Calcul Eco . Coût d'achat du combustible . Granulés x Part consommation"),
                },
                {
                  parametres: 'Fioul',
                  partConsommation: number("Calcul Eco . Coût d'achat du combustible . Fioul x Part consommation"),
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
                investissementBallonAccumulation: roundNumber(
                  `Calcul Eco . ${m.coutPublicodeKey} . Investissement ballon ECS à accumulation`
                ),
                investissementBallonSolaire: roundNumber(
                  `Calcul Eco . ${m.coutPublicodeKey} . Investissement ballon ECS solaire panneau inclus`
                ),
                investissementParLogement: roundNumber(
                  `Calcul Eco . ${m.coutPublicodeKey} . Investissement équipement par logement type tertiaire`
                ),
                investissementTotal: roundNumber(`Calcul Eco . ${m.coutPublicodeKey} . Investissement équipement Total`),
                totalAvecBallonAccumulation: roundNumber(
                  `Calcul Eco . ${m.coutPublicodeKey} . Total investissement avec ballon ECS à accumulation`
                ),
                totalAvecBallonSolaire: roundNumber(
                  `Calcul Eco . ${m.coutPublicodeKey} . Total investissement ballon ECS solaire panneaux`
                ),
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
                coutAbonnement: roundNumber(`Calcul Eco . ${m.coutPublicodeKey} . Coût du combustible abonnement`),
                coutBallonAccumulation: roundNumber(`Calcul Eco . ${m.coutPublicodeKey} . Coût combustible pour ballon ECS à accumulation`),
                coutBallonSolaire: roundNumber(`Calcul Eco . ${m.coutPublicodeKey} . Coût combustible pour ballon ECS solaire`),
                coutConsommation: roundNumber(`Calcul Eco . ${m.coutPublicodeKey} . Coût du combustible consommation`),
                coutElectriciteAuxiliaire: roundNumber(`Calcul Eco . ${m.coutPublicodeKey} . Coût électricité auxiliaire`),
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
                grosEntretien: roundNumber(`Calcul Eco . P2 P3 Coût de l'entretien . ${m.coutPublicodeKey} . gros entretien P3`),
                grosEntretienParLogement: roundNumber(
                  `Calcul Eco . P2 P3 Coût de l'entretien . ${m.coutPublicodeKey} . gros entretien P3 par logement tertiaire`
                ),
                installation: m.label,
                petitEntretien: roundNumber(`Calcul Eco . P2 P3 Coût de l'entretien . ${m.coutPublicodeKey} . petit entretien P2`),
                petitEntretienParLogement: roundNumber(
                  `Calcul Eco . P2 P3 Coût de l'entretien . ${m.coutPublicodeKey} . petit entretien P2 par logement tertiaire`
                ),
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
                  cee: roundNumber(`Calcul Eco . Montant des aides par logement tertiaire . ${m.coutPublicodeKey} . CEE`),
                  coupDePouce: roundNumber(`Calcul Eco . Montant des aides par logement tertiaire . ${m.coutPublicodeKey} . Coup de pouce`),
                  installation: m.label,
                  maPrimeRenov: roundNumber(
                    `Calcul Eco . Montant des aides par logement tertiaire . ${m.coutPublicodeKey} . Ma prime renov'`
                  ),
                  totalAides: roundNumber(`Calcul Eco . Montant des aides par logement tertiaire . ${m.coutPublicodeKey} . Total`),
                })),
                {
                  cee: roundNumber(
                    'Calcul Eco . Montant des aides par logement tertiaire . Panneau solaire thermique pour production ECS . CEE'
                  ),
                  coupDePouce: roundNumber(
                    'Calcul Eco . Montant des aides par logement tertiaire . Panneau solaire thermique pour production ECS . Coup de pouce'
                  ),
                  installation: 'Panneau solaire thermique pour production ECS',
                  maPrimeRenov: roundNumber(
                    "Calcul Eco . Montant des aides par logement tertiaire . Panneau solaire thermique pour production ECS . Ma prime renov'"
                  ),
                  totalAides: roundNumber(
                    'Calcul Eco . Montant des aides par logement tertiaire . Panneau solaire thermique pour production ECS . Total'
                  ),
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
                  gammePuissance: roundNumber('Installation x Réseaux de chaleur x Collectif . gamme de puissance existante'),
                  installation: 'Réseaux de chaleur',
                  productionEcs: bool('Installation x Réseaux de chaleur x Collectif . production eau chaude sanitaire'),
                  puissanceChauffage: roundNumber(
                    'Installation x Réseaux de chaleur x Collectif . puissance nécessaire équipement chauffage'
                  ),
                  puissanceEcs: roundNumber(
                    'Installation x Réseaux de chaleur x Collectif . puissance nécessaire pour ECS avec équipement'
                  ),
                  puissanceEquipement: roundNumber('Installation x Réseaux de chaleur x Collectif . puissance équipement'),
                },
                {
                  gammePuissance: roundNumber('Installation x Réseaux de froid x Collectif . gamme de puissance existante'),
                  installation: 'Réseaux de froid',
                  productionEcs: bool('Installation x Réseaux de froid x Collectif . production eau chaude sanitaire'),
                  puissanceEquipement: roundNumber('Installation x Réseaux de froid x Collectif . puissance équipement'),
                  puissanceRefroidissement: roundNumber(
                    'Installation x Réseaux de froid x Collectif . puissance nécessaire pour refroidissement équipement'
                  ),
                },
                {
                  gammePuissance: roundNumber('Installation x Poêle à granulés indiv x Individuel . gamme de puissance existante'),
                  installation: 'Poêle à granulés indiv',
                  productionEcs: bool('Installation x Poêle à granulés indiv x Individuel . production eau chaude sanitaire'),
                  puissanceChauffage: roundNumber(
                    'Installation x Poêle à granulés indiv x Individuel . puissance nécessaire équipement chauffage'
                  ),
                  puissanceEquipement: roundNumber('Installation x Poêle à granulés indiv x Individuel . puissance équipement'),
                },
                {
                  gammePuissance: roundNumber('Installation x Chaudière à granulés coll x Collectif . gamme de puissance existante'),
                  installation: 'Chaudière à granulés coll',
                  productionEcs: bool('Installation x Chaudière à granulés coll x Collectif . production eau chaude sanitaire'),
                  puissanceChauffage: roundNumber(
                    'Installation x Chaudière à granulés coll x Collectif . puissance nécessaire équipement chauffage'
                  ),
                  puissanceEcs: roundNumber(
                    'Installation x Chaudière à granulés coll x Collectif . puissance nécessaire pour ECS avec équipement'
                  ),
                  puissanceEquipement: roundNumber('Installation x Chaudière à granulés coll x Collectif . puissance équipement'),
                },
                {
                  gammePuissance: roundNumber('Installation x Gaz indiv avec cond x Individuel . gamme de puissance existante'),
                  installation: 'Gaz indiv avec cond',
                  productionEcs: bool('Installation x Gaz indiv avec cond x Individuel . production eau chaude sanitaire'),
                  puissanceChauffage: roundNumber(
                    'Installation x Gaz indiv avec cond x Individuel . puissance nécessaire équipement chauffage'
                  ),
                  puissanceEcs: roundNumber(
                    'Installation x Gaz indiv avec cond x Individuel . puissance nécessaire pour ECS avec équipement'
                  ),
                  puissanceEquipement: roundNumber('Installation x Gaz indiv avec cond x Individuel . puissance équipement'),
                },
                {
                  gammePuissance: roundNumber('Installation x Gaz indiv sans cond x Individuel . gamme de puissance existante'),
                  installation: 'Gaz indiv sans cond',
                  productionEcs: bool('Installation x Gaz indiv sans cond x Individuel . production eau chaude sanitaire'),
                  puissanceChauffage: roundNumber(
                    'Installation x Gaz indiv sans cond x Individuel . puissance nécessaire équipement chauffage'
                  ),
                  puissanceEcs: roundNumber(
                    'Installation x Gaz indiv sans cond x Individuel . puissance nécessaire pour ECS avec équipement'
                  ),
                  puissanceEquipement: roundNumber('Installation x Gaz indiv sans cond x Individuel . puissance équipement'),
                },
                {
                  gammePuissance: roundNumber('Installation x Gaz coll avec cond x Collectif . gamme de puissance existante'),
                  installation: 'Gaz coll avec cond',
                  productionEcs: bool('Installation x Gaz coll avec cond x Collectif . production eau chaude sanitaire'),
                  puissanceChauffage: roundNumber(
                    'Installation x Gaz coll avec cond x Collectif . puissance nécessaire équipement chauffage'
                  ),
                  puissanceEcs: roundNumber(
                    'Installation x Gaz coll avec cond x Collectif . puissance nécessaire pour ECS avec équipement'
                  ),
                  puissanceEquipement: roundNumber('Installation x Gaz coll avec cond x Collectif . puissance équipement'),
                },
                {
                  gammePuissance: roundNumber('Installation x Gaz coll sans cond x Collectif . gamme de puissance existante'),
                  installation: 'Gaz coll sans cond',
                  productionEcs: bool('Installation x Gaz coll sans cond x Collectif . production eau chaude sanitaire'),
                  puissanceChauffage: roundNumber(
                    'Installation x Gaz coll sans cond x Collectif . puissance nécessaire équipement chauffage'
                  ),
                  puissanceEcs: roundNumber(
                    'Installation x Gaz coll sans cond x Collectif . puissance nécessaire pour ECS avec équipement'
                  ),
                  puissanceEquipement: roundNumber('Installation x Gaz coll sans cond x Collectif . puissance équipement'),
                },
                {
                  gammePuissance: roundNumber('Installation x Fioul indiv x Individuel . gamme de puissance existante'),
                  installation: 'Fioul indiv',
                  productionEcs: bool('Installation x Fioul indiv x Individuel . production eau chaude sanitaire'),
                  puissanceChauffage: roundNumber('Installation x Fioul indiv x Individuel . puissance nécessaire équipement chauffage'),
                  puissanceEcs: roundNumber('Installation x Fioul indiv x Individuel . puissance nécessaire pour ECS avec équipement'),
                  puissanceEquipement: roundNumber('Installation x Fioul indiv x Individuel . puissance équipement'),
                },
                {
                  gammePuissance: roundNumber('Installation x Fioul coll x Collectif . gamme de puissance existante'),
                  installation: 'Fioul coll',
                  productionEcs: bool('Installation x Fioul coll x Collectif . production eau chaude sanitaire'),
                  puissanceChauffage: roundNumber('Installation x Fioul coll x Collectif . puissance nécessaire équipement chauffage'),
                  puissanceEcs: roundNumber('Installation x Fioul coll x Collectif . puissance nécessaire pour ECS avec équipement'),
                  puissanceEquipement: roundNumber('Installation x Fioul coll x Collectif . puissance équipement'),
                },
                {
                  gammePuissance: roundNumber('Installation x PAC air-air x Individuel . gamme de puissance existante'),
                  installation: 'PAC air/air indiv',
                  productionEcs: bool('Installation x PAC air-air x Individuel . production eau chaude sanitaire'),
                  puissanceChauffage: roundNumber('Installation x PAC air-air x Individuel . puissance nécessaire équipement chauffage'),
                  puissanceEquipement: roundNumber('Installation x PAC air-air x Individuel . puissance équipement'),
                  puissanceRefroidissement: roundNumber(
                    'Installation x PAC air-air x Individuel . puissance nécessaire pour refroidissement équipement'
                  ),
                },
                {
                  gammePuissance: roundNumber('Installation x PAC air-air x Collectif . gamme de puissance existante'),
                  installation: 'PAC air/air collectif/tertiaire',
                  productionEcs: bool('Installation x PAC air-air x Collectif . production eau chaude sanitaire'),
                  puissanceChauffage: roundNumber('Installation x PAC air-air x Collectif . puissance nécessaire équipement chauffage'),
                  puissanceEquipement: roundNumber('Installation x PAC air-air x Collectif . puissance équipement'),
                  puissanceRefroidissement: roundNumber(
                    'Installation x PAC air-air x Collectif . puissance nécessaire pour refroidissement équipement'
                  ),
                },
                {
                  gammePuissance: roundNumber('Installation x PAC eau-eau x Individuel . gamme de puissance existante'),
                  installation: 'PAC eau/eau indiv',
                  productionEcs: bool('Installation x PAC eau-eau x Individuel . production eau chaude sanitaire'),
                  puissanceChauffage: roundNumber('Installation x PAC eau-eau x Individuel . puissance nécessaire équipement chauffage'),
                  puissanceEcs: roundNumber('Installation x PAC eau-eau x Individuel . puissance nécessaire pour ECS avec équipement'),
                  puissanceEquipement: roundNumber('Installation x PAC eau-eau x Individuel . puissance équipement'),
                },
                {
                  gammePuissance: roundNumber('Installation x PAC eau-eau x Collectif . gamme de puissance existante'),
                  installation: 'PAC eau/eau collectif/tertiaire',
                  productionEcs: bool('Installation x PAC eau-eau x Collectif . production eau chaude sanitaire'),
                  puissanceChauffage: roundNumber('Installation x PAC eau-eau x Collectif . puissance nécessaire équipement chauffage'),
                  puissanceEcs: roundNumber('Installation x PAC eau-eau x Collectif . puissance nécessaire pour ECS avec équipement'),
                  puissanceEquipement: roundNumber('Installation x PAC eau-eau x Collectif . puissance équipement'),
                },
                {
                  gammePuissance: roundNumber('Installation x PAC air-eau x Individuel . gamme de puissance existante'),
                  installation: 'PAC air/eau indiv',
                  productionEcs: bool('Installation x PAC air-eau x Individuel . production eau chaude sanitaire'),
                  puissanceChauffage: roundNumber('Installation x PAC air-eau x Individuel . puissance nécessaire équipement chauffage'),
                  puissanceEcs: roundNumber('Installation x PAC air-eau x Individuel . puissance nécessaire pour ECS avec équipement'),
                  puissanceEquipement: roundNumber('Installation x PAC air-eau x Individuel . puissance équipement'),
                  puissanceRefroidissement: roundNumber(
                    'Installation x PAC air-eau x Individuel . puissance nécessaire pour refroidissement équipement'
                  ),
                },
                {
                  gammePuissance: roundNumber('Installation x PAC air-eau x Collectif . gamme de puissance existante'),
                  installation: 'PAC air/eau collectif/tertiaire',
                  productionEcs: bool('Installation x PAC air-eau x Collectif . production eau chaude sanitaire'),
                  puissanceChauffage: roundNumber('Installation x PAC air-eau x Collectif . puissance nécessaire équipement chauffage'),
                  puissanceEcs: roundNumber('Installation x PAC air-eau x Collectif . puissance nécessaire pour ECS avec équipement'),
                  puissanceEquipement: roundNumber('Installation x PAC air-eau x Collectif . puissance équipement'),
                  puissanceRefroidissement: roundNumber(
                    'Installation x PAC air-eau x Collectif . puissance nécessaire pour refroidissement équipement'
                  ),
                },
                {
                  gammePuissance: roundNumber('Installation x Radiateur électrique x Individuel . gamme de puissance existante'),
                  installation: 'Radiateur électrique',
                  productionEcs: bool('Installation x Radiateur électrique x Individuel . production eau chaude sanitaire'),
                  puissanceChauffage: roundNumber(
                    'Installation x Radiateur électrique x Individuel . puissance nécessaire équipement chauffage'
                  ),
                  puissanceEquipement: roundNumber('Installation x Radiateur électrique x Individuel . puissance équipement'),
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
                appointElectricite: roundNumber(
                  `Installation x ${m.emissionsCO2PublicodesKey} . appoint d'électricité chauffe-eau solaire`
                ),
                besoinInstallation: bool(
                  `Installation x ${m.emissionsCO2PublicodesKey} . besoin d'installation supplémentaire pour produire l'ECS`
                ),
                consommationElectricite: roundNumber(
                  `Installation x ${m.emissionsCO2PublicodesKey} . consommation d'électricité chauffe-eau électrique`
                ),
                installation: m.label,
                volumeBallon: roundNumber(`Installation x ${m.emissionsCO2PublicodesKey} . volume du ballon ECS`),
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
                consommationAuxiliaire: roundNumber(`Installation x ${m.emissionsCO2PublicodesKey} . consommation auxiliaire`),
                consommationChaleur: roundNumber(`Installation x ${m.emissionsCO2PublicodesKey} . consommation combustible chaleur`),
                consommationFroid: roundNumber(`Installation x ${m.emissionsCO2PublicodesKey} . consommation combustible froid`),
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
                consommationElectricite: roundNumber(
                  `Installation x ${m.emissionsCO2PublicodesKey} . consommation d'électricité lié au chauffage-refroidissement et à la production d'ECS`
                ),
                consommationHorsElectricite: roundNumber(
                  `Installation x ${m.emissionsCO2PublicodesKey} . consommation combustible hors électricité`
                ),
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
                besoinInstallation: bool(
                  `Installation x ${m.emissionsCO2PublicodesKey} . besoin d'installation supplémentaire pour produire l'ECS`
                ),
                installation: m.label,
                scope1: roundNumber(`env . Installation x ${m.emissionsCO2PublicodesKey} . besoins de chauffage et ECS si même équipement`),
                scope2Auxiliaires: roundNumber(
                  `env . Installation x ${m.emissionsCO2PublicodesKey} . auxiliaires et combustible électrique`
                ),
                scope2EcsBallon: roundNumber(`env . Installation x ${m.emissionsCO2PublicodesKey} . ECS avec ballon électrique`),
                scope2EcsSolaire: roundNumber(`env . Installation x ${m.emissionsCO2PublicodesKey} . ECS solaire thermique`),
                scope2Total: roundNumber(`env . Installation x ${m.emissionsCO2PublicodesKey} . Scope 2`),
                scope3: roundNumber(`env . Installation x ${m.emissionsCO2PublicodesKey} . Scope 3`),
                total: roundNumber(`env . Installation x ${m.emissionsCO2PublicodesKey} . Total`),
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
