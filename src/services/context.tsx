import React from 'react';

import { type AdminService } from './admin';
import { type DemandsService } from './demands';
import { type ExportService } from './export';
import { type HeatNetworkService } from './heatNetwork';
import { type NetworksService } from './networks';
import { type PasswordService } from './password';
import { type SuggestionService } from './suggestion';

type ServiceContextProps = {
  suggestionService: SuggestionService;
  heatNetworkService: HeatNetworkService;
  demandsService: DemandsService;
  passwordService: PasswordService;
  adminService: AdminService;
  networksService: NetworksService;
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
