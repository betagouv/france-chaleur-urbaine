import React from 'react';

import type { ExportService } from './export';
import type { SuggestionService } from './suggestion';

type ServiceContextProps = {
  suggestionService: SuggestionService;
  exportService: ExportService;
};
export const ServicesContext = React.createContext<ServiceContextProps | undefined>(undefined);

export const useServices = () => {
  const services = React.useContext(ServicesContext);
  if (!services) {
    throw new Error('App must be wrapped in Provider');
  }
  return services;
};
