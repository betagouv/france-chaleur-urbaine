import { ExportService } from '@/services/export';
import { SuggestionService } from '@/services/suggestion';
import { axiosHttpClient } from './http';

export const legacyServices = {
  exportService: new ExportService(axiosHttpClient),
  suggestionService: new SuggestionService(axiosHttpClient),
};
