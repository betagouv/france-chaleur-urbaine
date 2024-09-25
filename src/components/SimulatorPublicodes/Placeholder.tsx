import { fr } from '@codegouvfr/react-dsfr';
import Badge from '@codegouvfr/react-dsfr/Badge';
import ToggleSwitch from '@codegouvfr/react-dsfr/ToggleSwitch';
import React from 'react';

import Accordion from '@components/ui/Accordion';
import Box from '@components/ui/Box';
import Heading from '@components/ui/Heading';
import cx from '@utils/cx';

import { Results, ResultsPlaceholder, Section, Simulator } from './SimulatorPublicodes.style';

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

const PublicodesSimulatorPlaceholder: React.FC<PublicodesSimulatorPlaceholderProps> = ({ children, className, ...props }) => {
  return (
    <div className={cx(fr.cx('fr-container'), className)} {...props}>
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
