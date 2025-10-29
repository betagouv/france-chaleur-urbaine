import { SuggestionService } from '@/services/suggestion';
import { axiosHttpClient } from './http';

export const legacyServices = {
  suggestionService: new SuggestionService(axiosHttpClient),
};
