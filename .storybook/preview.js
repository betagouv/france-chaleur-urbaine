import { fetchHttpClient } from '@components/lib';
import '@gouvfr/dsfr/dist/dsfr.css';
import '@gouvfr/dsfr/dist/dsfr.module.min.js';
import '@gouvfr/dsfr/dist/dsfr.nomodule.min.js';
import '@gouvfr/dsfr/dist/utility/icons/icons-system/icons-system.min.css';
import '@reach/combobox/styles.css';
import { RouterContext } from 'next/dist/shared/lib/router-context';
import {
  HeatNetworkService,
  ServicesContext,
  SuggestionService,
} from 'src/services';
import 'src/styles/globalStyle.css';

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: {
    expanded: true,
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
  nextRouter: {
    Provider: RouterContext.Provider,
  },
};

export const decorators = [
  (Story) => (
    <ServicesContext.Provider
      value={{
        suggestionService: new SuggestionService(fetchHttpClient),
        heatNetworkService: new HeatNetworkService(fetchHttpClient),
      }}
    >
      <Story />
    </ServicesContext.Provider>
  ),
];
