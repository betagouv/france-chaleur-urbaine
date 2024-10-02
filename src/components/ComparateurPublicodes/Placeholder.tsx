import { fr } from '@codegouvfr/react-dsfr';
import Alert from '@codegouvfr/react-dsfr/Alert';
import Badge from '@codegouvfr/react-dsfr/Badge';
import ToggleSwitch from '@codegouvfr/react-dsfr/ToggleSwitch';
import React from 'react';

import Accordion from '@components/ui/Accordion';
import Box from '@components/ui/Box';
import Heading from '@components/ui/Heading';
import Modal, { createModal } from '@components/ui/Modal';
import cx from '@utils/cx';

import { Results, ResultsPlaceholder, Section, Simulator } from './ComparateurPublicodes.style';

type PublicodesSimulatorPlaceholderProps = React.HTMLAttributes<HTMLDivElement> & {};

export type TabId = 'batiment' | 'modes';
export const PublicodesSimulatorTitle = () => {
  return (
    <div>
      <Heading as="h2">
        Comparateur de performances et d'émissions de CO2 <Badge severity="warning">Beta</Badge>
      </Heading>
      <ol>
        <li>
          Renseignez les données de votre bâtiment dans <strong>l’onglet “Bâtiment”</strong>
        </li>
        <li>
          Sélectionnez les modes de chauffage et de refroidissement que vous souhaitez comparer dans{' '}
          <strong>l’onglet “Modes de chauffage et de refroidissement”</strong>
        </li>
      </ol>
    </div>
  );
};
const modal = createModal({
  id: 'tool-description-modal',
  isOpenedByDefault: false,
});
export const simulatorTabs = [
  {
    tabId: 'batiment',
    label: '1. Paramètres du bâtiment',
  },
  {
    tabId: 'modes-de-chauffage',
    label: '2. Modes de chauffage et de refroidissement à comparer',
  },
  {
    tabId: 'parametres-modes-de-chauffage',
    label: '3. Paramètres des modes de chauffage et de refroidissement',
  },
] as const;

export const ResultsNotAvailable = () => (
  <ResultsPlaceholder>
    <img src="/img/simulateur_placeholder.svg" alt="" />
    <div>
      Les résultats s’afficheront ici une fois <strong>une adresse</strong> et <strong>au moins un mode de chauffage</strong> sélectionnés
    </div>
  </ResultsPlaceholder>
);

export const Disclaimer = () => {
  return (
    <>
      <Modal modal={modal} title="Description de l'outil">
        <p>
          Cet outil de comparaison permet aux utilisateurs d’évaluer différents systèmes de chauffage et de refroidissement sur trois
          aspects essentiels : technique, économique et environnemental. Grâce à une approche en coût global, l'outil analyse les
          performances des systèmes sur toute leur durée de vie, en tenant compte des coûts d'installation, d'exploitation, d'entretien,
          ainsi que des impacts environnementaux tels que les émissions de CO₂.
        </p>

        <p>
          Les utilisateurs peuvent facilement comparer plusieurs solutions grâce à des paramètres techniques prédéfinis qui incluent les
          caractéristiques du bâtiment, des usages ainsi que des équipements. Ces hypothèses sont généralistes et sont le travail de mises à
          jour régulières.
        </p>

        <p>
          Les valeurs prédéfinies incluses dans l’outil permettent de simplifier le processus de comparaison, tout en offrant la flexibilité
          de personnaliser certains paramètres pour mieux refléter les conditions réelles de chaque utilisateur.
        </p>

        <p>Deux niveaux d'utilisation sont proposés pour s’adapter à différents profils d’utilisateurs :</p>

        <ul>
          <li>
            Niveau grand public (simplifié) : conçu pour les utilisateurs non-experts, ce mode propose une interface intuitive avec des
            valeurs prédéfinies pour faciliter la comparaison. Il permet une évaluation rapide des coûts globaux et des impacts
            environnementaux sans nécessiter de connaissances techniques approfondies,
          </li>
          <li>
            Niveau technicien (avancé) : destiné aux utilisateurs plus expérimentés, ce mode offre une plus grande flexibilité en permettant
            de modifier en détail un large éventail de variables. Il permet une analyse plus fine et personnalisée des systèmes en fonction
            des spécificités du projet.
          </li>
        </ul>

        <p>
          Cet outil a également une portée pédagogique, permettant aux utilisateurs de mieux comprendre les implications techniques,
          économiques et environnementales des différentes options de chauffage et de refroidissement. Si la version avancée offre une aide
          à la décision pour les techniciens et décideurs, cet outil ne remplace pas les études de faisabilité technico-économique. Seules
          ces dernières, réalisées par des experts, peuvent offrir des incertitudes réduites et des résultats adaptés au projet.
        </p>

        <p>
          Cet outil prend la suite d'RCE33, outil développé par l'association AMORCE. Cette nouvelle version est financée par le programme
          européen Heat&Cool LIFE, piloté par la Région Sud, qui vise à développer des outils dans l'objectif de développer les réseaux de
          chaleur et de froid vertueux. L'association AMORCE pilote le projet, tandis que France Chaleur Urbaine et Elcimaï ont apporté leur
          expertise technique à sa réalisation.
        </p>
      </Modal>
      <Alert
        severity="info"
        className="fr-mt-2w"
        small
        description={
          <span className="fr-text--xs">
            Cet outil de comparaison de modes de chauffage et de refroidissement a pour objectif de comparer en quelques minutes des
            configurations de chauffage et de refroidissement sur les plans techniques, économiques et environnementaux. Il ne remplace en
            aucun cas une étude de faisabilité technico-économique et ne peut s'adapter aux situations particulières avec les hypothèses
            préconfigurées. Ces hypothèses représentent des configurations types, elles sont donc sujets à des incertitudes importantes.{' '}
            <a href="#" onClick={() => modal.open()} className="fr-link fr-text--xs">
              Voir l’explication détaillée
            </a>
          </span>
        }
      />
    </>
  );
};

const PublicodesSimulatorPlaceholder: React.FC<PublicodesSimulatorPlaceholderProps> = ({ children, className, ...props }) => {
  return (
    <div className={cx(fr.cx('fr-container'), className)} {...props}>
      <Disclaimer />
      <Section>
        <header>
          <PublicodesSimulatorTitle />
          <ToggleSwitch
            label="Mode&nbsp;avancé"
            labelPosition="left"
            inputTitle="Mode Pro"
            showCheckedHint={false}
            checked={false}
            disabled
            className={fr.cx('fr-mt-0')}
            onChange={() => {
              // Nothing to do as it's for loading state only
            }}
          />
        </header>
        <Simulator $loading={true}>
          <Box display="flex" gap="16px" flexDirection="column">
            {simulatorTabs.map((tab) => (
              <Accordion key={tab.tabId} bordered label={tab.label}>
                Chargement...
              </Accordion>
            ))}
          </Box>
          <Results>
            <ResultsNotAvailable />
          </Results>
        </Simulator>
      </Section>
    </div>
  );
};

export default PublicodesSimulatorPlaceholder;
