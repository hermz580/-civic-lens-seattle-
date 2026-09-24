
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

  // The connected Emerald workspace provides a source-backed, key-free
  // report. Explicitly configured model credentials still use the original
  // Civic Lens model-provider workflow below.
  if (!settings.apiKey?.trim() && !settings.baseUrl?.trim()) {
    const response = await fetch('/api/civic-lens/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        category,
        mode,
        searchArea,
        imageBlob,
        targetLanguage,
      }),
    });
    const payload = await response.json();
    if (!response.ok)
      throw new Error(payload.error || 'Civic sources are unavailable.');
    return payload;
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
