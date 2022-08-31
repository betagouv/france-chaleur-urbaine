import React from 'react';
import { DemandsService } from './demandsService';
import { HeatNetworkService } from './heatNetworkService';
import { PasswordService } from './passwordService';
import { SuggestionService } from './suggestionService';

type ServiceContextProps = {
  suggestionService: SuggestionService;
  heatNetworkService: HeatNetworkService;
  demandsService: DemandsService;
  passwordService: PasswordService;
};
export const ServicesContext = React.createContext<
  ServiceContextProps | undefined
>(undefined);

export const useServices = () => {
  const services = React.useContext(ServicesContext);
  if (!services) {
    throw new Error('App must be wrapped in Provider');
  }
  return services;
};
