import { ExportService } from '@/services/export';
import { HeatNetworkService } from '@/services/heatNetwork';
import { NetworksService } from '@/services/networks';
import { PasswordService } from '@/services/password';
import { SuggestionService } from '@/services/suggestion';
import { axiosHttpClient } from './http';

export const legacyServices = {
  exportService: new ExportService(axiosHttpClient),
  heatNetworkService: new HeatNetworkService(axiosHttpClient),
  networksService: new NetworksService(axiosHttpClient),
  passwordService: new PasswordService(axiosHttpClient),
  suggestionService: new SuggestionService(axiosHttpClient),
};
