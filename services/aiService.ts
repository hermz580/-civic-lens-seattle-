import { GoogleGenAI } from "@google/genai";
import { 
  type GroundingChunk, 
  type SearchResult, 
  type Location, 
  type ReportMode, 
  type Language,
  type AISettings,
  DEFAULT_AI_SETTINGS,
  AI_PRESETS
} from '../types';

export async function searchForIncidentsWithAI(
  query: string,
  category: string,
  mode: ReportMode,
  searchArea?: any,
  imageBlob?: string,
  targetLanguage: Language = 'English',
  settings: AISettings = DEFAULT_AI_SETTINGS
): Promise<SearchResult> {
  const provider = settings.provider || 'gemini';
  const effectiveModel = (settings.provider === 'custom' || settings.modelId === 'custom' 
    ? settings.customModelId?.trim() 
    : settings.modelId) || 'gemini-3.7-flash';

  if (provider === 'gemini') {
    return searchWithGemini(query, category, mode, searchArea, imageBlob, targetLanguage, effectiveModel, settings.apiKey);
  } else {
    return searchWithOpenAICompatible(query, category, mode, searchArea, imageBlob, targetLanguage, effectiveModel, settings);
  }
}

async function searchWithGemini(
  query: string,
  category: string,
  mode: ReportMode,
  searchArea?: any,
  imageBlob?: string,
  targetLanguage: Language = 'English',
  modelId: string = 'gemini-3.7-flash',
  customApiKey?: string
): Promise<SearchResult> {
  const apiKey = customApiKey?.trim() || process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    throw new Error("No Gemini API key available. Please enter an API key in the Model Settings or set GEMINI_API_KEY.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const isCrime = mode === 'crime';
  const typeLabel = isCrime ? 'crime reports and public safety incidents' : 'good deeds, community service events, acts of kindness, and positive local news';
  const categoryFilter = category !== 'All' ? `related to "${category}"` : '';

  let locationFilter = '';
  if (searchArea) {
    const areaString = JSON.stringify(searchArea.geometry);
    locationFilter = `within the geographic area defined by this GeoJSON object: ${areaString}`;
  }

  const reportKeyDesc = isCrime 
      ? "concise, one-paragraph summary of the crime reports found in Seattle"
      : "concise, one-paragraph summary of the good deeds found in Seattle";

  const prompt = `Search for recent ${typeLabel} ${categoryFilter} in Seattle, WA ${locationFilter} matching query: "${query}". 
Focus on events and news from recent reports.

If an image is provided, analyze it as "visual evidence" and combine its details with web search results.

TRANSLATE ALL TEXT OUTPUTS TO: ${targetLanguage}.

Respond ONLY with a valid JSON object.
The JSON object must have these keys:
1. "report": A string containing a ${reportKeyDesc}.
2. "details": A string containing a detailed breakdown of events, dates, and locations.
3. "locations": An array of {lat: number, lng: number, description: string} objects for geocoding points in Seattle (latitude approx 47.5 to 47.75, longitude approx -122.45 to -122.25).
4. "insight": A deeper, analytical civic insight of 2-3 sentences.
5. "sentimentScore": An integer from 0 to 100. For crime: 0 is safe/calm, 100 is high danger/alert. For good deeds: 0 is quiet, 100 is thriving community spirit.

If no specific results are found for the exact query, provide realistic context for that area/category in Seattle with empty locations. Do not output markdown code fences or anything outside the JSON object.`;

  const contents: any[] = [{ text: prompt }];
  if (imageBlob) {
    const base64Data = imageBlob.includes(',') ? imageBlob.split(',')[1] : imageBlob;
    const mimeTypeMatch = imageBlob.match(/^data:([^;]+);base64,/);
    const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : "image/jpeg";
    contents.push({
      inlineData: {
        mimeType,
        data: base64Data
      }
    });
  }

  const response = await ai.models.generateContent({
    model: modelId,
    contents: { parts: contents },
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  const sources = (response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[]) || [];
  const textResponse = response.text || '';
  const parsed = parseAIJsonResponse(textResponse);

  return {
    ...parsed,
    sources,
    modelUsed: modelId,
    providerUsed: 'Google Gemini'
  };
}

async function searchWithOpenAICompatible(
  query: string,
  category: string,
  mode: ReportMode,
  searchArea?: any,
  imageBlob?: string,
  targetLanguage: Language = 'English',
  modelId: string = 'gpt-4o',
  settings: AISettings
): Promise<SearchResult> {
  let baseUrl = settings.baseUrl?.trim();
  if (!baseUrl) {
    const preset = AI_PRESETS.find(p => p.provider === settings.provider);
    baseUrl = preset?.defaultBaseUrl || 'https://api.openai.com/v1';
  }

  baseUrl = baseUrl.replace(/\/+$/, '');
  const endpoint = baseUrl.endsWith('/chat/completions') ? baseUrl : `${baseUrl}/chat/completions`;

  const apiKey = settings.apiKey?.trim() || '';
  if (settings.provider !== 'ollama' && !apiKey) {
    throw new Error(`API key is required for ${settings.provider.toUpperCase()}. Please click the Model settings button in the top bar to enter your key.`);
  }

  const isCrime = mode === 'crime';
  const typeLabel = isCrime ? 'crime reports and safety incidents' : 'good deeds, community mutual aid, volunteer acts, and positive community news';
  const categoryFilter = category !== 'All' ? `related to "${category}"` : '';

  let locationFilter = '';
  if (searchArea) {
    const areaString = JSON.stringify(searchArea.geometry);
    locationFilter = `within the geographic area defined by this GeoJSON: ${areaString}`;
  }

  const systemPrompt = `You are Seattle Community Watch AI, an urban civic intelligence analyst for Seattle, WA.
Provide accurate, structured information about Seattle public safety, incident reports, and community initiatives.
You must always respond with pure, valid JSON containing the exact requested keys.
Target Language: ${targetLanguage}.`;

  const userPromptText = `Analyze and report on recent Seattle ${typeLabel} ${categoryFilter} ${locationFilter} for query: "${query}".

Required Output JSON Schema:
{
  "report": "A concise, single-paragraph executive summary of events or conditions in Seattle",
  "details": "A bulleted or structured breakdown of specific incidents, dates, neighborhood context, and relevant Seattle emergency/community response",
  "locations": [
    {"lat": 47.6062, "lng": -122.3321, "description": "Specific location description in Seattle"}
  ],
  "insight": "2-3 sentences of analytical insight on safety patterns or community resilience",
  "sentimentScore": 65
}

Note:
- "sentimentScore" is 0-100 (for crime: 0=peaceful/safe, 100=critical alert; for community: 0=minimal activity, 100=exceptionally vibrant).
- Ensure coordinates in "locations" match real Seattle coordinates (latitude 47.50 to 47.75, longitude -122.45 to -122.25).
- Output valid JSON only, without markdown wrapping or conversational filler.`;

  const messages: any[] = [
    { role: "system", content: systemPrompt }
  ];

  if (imageBlob) {
    messages.push({
      role: "user",
      content: [
        { type: "text", text: userPromptText + "\n[Visual evidence is attached. Incorporate findings from the image into the report.]" },
        { 
          type: "image_url", 
          image_url: { 
            url: imageBlob.startsWith('data:') ? imageBlob : `data:image/jpeg;base64,${imageBlob}` 
          } 
        }
      ]
    });
  } else {
    messages.push({
      role: "user",
      content: userPromptText
    });
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };

  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  // OpenRouter specific headers
  if (settings.provider === 'openrouter') {
    headers["HTTP-Referer"] = "https://seattlewatch.app";
    headers["X-Title"] = "Seattle Community Watch";
  }

  const requestBody: any = {
    model: modelId,
    messages,
    temperature: settings.temperature ?? 0.2
  };

  // Only add response_format for models that reliably support json_object
  if (!modelId.includes('deepseek-r1') && !modelId.includes('o3-mini')) {
    requestBody.response_format = { type: "json_object" };
  }

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody)
    });
  } catch (netErr: any) {
    if (settings.provider === 'ollama') {
      throw new Error(`Could not connect to Ollama at ${baseUrl}. Ensure Ollama is running and accessible (e.g. OLLAMA_ORIGINS="*" ollama serve).`);
    }
    throw new Error(`Network error connecting to ${baseUrl}: ${netErr?.message || 'Failed to fetch'}`);
  }

  if (!response.ok) {
    const errText = await response.text();
    let errorDetail = errText;
    try {
      const errJson = JSON.parse(errText);
      errorDetail = errJson.error?.message || errJson.message || errText;
    } catch {
      // Use raw text
    }
    throw new Error(`${settings.provider.toUpperCase()} API Error (${response.status}): ${errorDetail}`);
  }

  const data = await response.json();
  const rawContent = data.choices?.[0]?.message?.content || '';
  const parsed = parseAIJsonResponse(rawContent);

  const sources: GroundingChunk[] = [];
  if (data.choices?.[0]?.message?.citations) {
    for (const c of data.choices[0].message.citations) {
      sources.push({ web: { uri: c.url || c, title: c.title || c.url || 'Web Source' } });
    }
  }

  return {
    ...parsed,
    sources,
    modelUsed: modelId,
    providerUsed: settings.provider.toUpperCase()
  };
}

function parseAIJsonResponse(textResponse: string): Omit<SearchResult, 'sources'> {
  let jsonText = textResponse.trim();
  
  // Remove markdown code fences if present
  if (jsonText.startsWith('```json')) {
    jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
  } else {
    const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }
  }

  try {
    const parsed = JSON.parse(jsonText);
    return {
      report: parsed.report || '',
      details: parsed.details || '',
      locations: Array.isArray(parsed.locations) ? parsed.locations : [],
      insight: parsed.insight || '',
      sentimentScore: typeof parsed.sentimentScore === 'number' ? parsed.sentimentScore : 50
    };
  } catch (e) {
    console.error("JSON parse failed, raw content:", textResponse);
    return {
      report: textResponse,
      details: '',
      locations: [],
      insight: '',
      sentimentScore: 50
    };
  }
}
