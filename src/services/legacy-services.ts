import { ExportService } from '@/services/export';
import { HeatNetworkService } from '@/services/heatNetwork';
import { PasswordService } from '@/services/password';
import { SuggestionService } from '@/services/suggestion';
import { axiosHttpClient } from './http';

export const legacyServices = {
  exportService: new ExportService(axiosHttpClient),
  heatNetworkService: new HeatNetworkService(axiosHttpClient),
  passwordService: new PasswordService(axiosHttpClient),
  suggestionService: new SuggestionService(axiosHttpClient),
};
