
import { searchForIncidentsWithAI } from './aiService';
import { type SearchResult, type ReportMode, type Language, type AISettings, DEFAULT_AI_SETTINGS } from '../types';

export async function searchForIncidents(
    query: string, 
    category: string, 
    mode: ReportMode, 
    searchArea?: any, 
    imageBlob?: string,
    targetLanguage: Language = 'English',
    modelIdOrSettings?: string | AISettings
): Promise<SearchResult> {
  let settings: AISettings = DEFAULT_AI_SETTINGS;
  if (typeof modelIdOrSettings === 'string') {
    settings = { ...DEFAULT_AI_SETTINGS, modelId: modelIdOrSettings };
  } else if (modelIdOrSettings) {
    settings = modelIdOrSettings;
  }

  return searchForIncidentsWithAI(
    query,
    category,
    mode,
    searchArea,
    imageBlob,
    targetLanguage,
    settings
  );
}

export { searchForIncidentsWithAI };

