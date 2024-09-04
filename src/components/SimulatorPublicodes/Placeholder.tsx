import { fr } from '@codegouvfr/react-dsfr';
import { Tabs } from '@codegouvfr/react-dsfr/Tabs';
import React from 'react';

import Heading from '@components/ui/Heading';
import cx from '@utils/cx';

import { Results, ResultsPlaceholder, Section, Simulator } from './SimulatorPublicodes.style';

type PublicodesSimulatorPlaceholderProps = React.HTMLAttributes<HTMLDivElement> & {};

export type TabId = 'batiment' | 'modes';

export const PublicodesSimulatorTitle = () => {
  return (
    <div>
      <Heading as="h2">Simulateur de prix et d'émissions de CO2</Heading>
      <ol>
        <li>
          Renseignez les données de votre bâtiment dans <strong>l’onglet “Bâtiment”</strong>
        </li>
        <li>
          Sélectionnez les modes de chauffages et de refroidissement que vous souhaitez comparer dans{' '}
          <strong>l’onglet “Modes de chauffage et de refroidissement”</strong>
        </li>
      </ol>
    </div>
  );
};

export const simulatorTabs = [
  {
    tabId: 'batiment',
    label: 'Bâtiment',
  },
  {
    tabId: 'modes-de-chauffage',
    label: 'Modes de chauffage et de refroidissement',
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

const PublicodesSimulatorPlaceholder: React.FC<PublicodesSimulatorPlaceholderProps> = ({ children, className, ...props }) => {
  return (
    <div className={cx(fr.cx('fr-container'), className)} {...props}>
      <Section>
        <header>
          <PublicodesSimulatorTitle />
        </header>
        <Simulator $loading={true}>
          <div>
            <Tabs
              tabs={simulatorTabs.map((tab) => ({
                tabId: tab.tabId,
                label: <small>{tab.label}</small>,
                content: <p>Chargement...</p>,
              }))}
            />
          </div>
          <Results>
            <ResultsNotAvailable />
          </Results>
        </Simulator>
      </Section>
    </div>
  );
};

export default PublicodesSimulatorPlaceholder;
