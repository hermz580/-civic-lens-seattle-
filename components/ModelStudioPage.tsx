import React, { useState } from 'react';
import { 
  type AISettings, 
  type AIProviderType, 
  AI_PRESETS, 
  type AIProviderPreset,
  type ModelCategory 
} from '../types';

interface ModelStudioPageProps {
  settings: AISettings;
  onSaveSettings: (newSettings: AISettings) => void;
  onNavigateToWatch: () => void;
}

const CATEGORIES: ModelCategory[] = [
  'All',
  'Nous Research (Hermes 3)',
  'Google Gemini',
  'Open Source / Groq',
  'Local / Ollama',
  'DeepSeek',
  'OpenRouter (Anthropic/Meta/Mistral)',
  'OpenAI',
  'Custom'
];

export const ModelStudioPage: React.FC<ModelStudioPageProps> = ({
  settings,
  onSaveSettings,
  onNavigateToWatch
}) => {
  const [activeCategory, setActiveCategory] = useState<ModelCategory>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [selectedPresetId, setSelectedPresetId] = useState<string>(() => {
    const matched = AI_PRESETS.find(p => p.provider === settings.provider && p.modelId === settings.modelId);
    return matched ? matched.id : (settings.provider === 'custom' ? 'custom-endpoint' : 'gemini-3.7-flash');
  });

  const [provider, setProvider] = useState<AIProviderType>(settings.provider || 'gemini');
  const [modelId, setModelId] = useState<string>(settings.modelId || 'gemini-3.7-flash');
  const [customModelId, setCustomModelId] = useState<string>(settings.customModelId || '');
  const [apiKey, setApiKey] = useState<string>(settings.apiKey || '');
  const [baseUrl, setBaseUrl] = useState<string>(settings.baseUrl || '');
  const [temperature, setTemperature] = useState<number>(settings.temperature ?? 0.2);
  const [showKey, setShowKey] = useState<boolean>(false);
  const [testStatus, setTestStatus] = useState<{ loading: boolean; message: string; success?: boolean } | null>(null);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  const handleSelectPreset = (preset: AIProviderPreset) => {
    setSelectedPresetId(preset.id);
    setProvider(preset.provider);
    setModelId(preset.modelId);
    if (preset.defaultBaseUrl) {
      setBaseUrl(preset.defaultBaseUrl);
    }
    setTestStatus(null);
    setSaveSuccessNotice(null);
  };

  const handleSave = () => {
    const effectiveModel = provider === 'custom' ? (customModelId.trim() || 'custom-model') : modelId;
    const updated: AISettings = {
      provider,
      modelId: effectiveModel,
      customModelId: customModelId.trim(),
      apiKey: apiKey.trim(),
      baseUrl: baseUrl.trim(),
      temperature
    };
    onSaveSettings(updated);
    setSaveSuccessNotice(`Active model updated to ${effectiveModel} (${provider.toUpperCase()})`);
    setTimeout(() => {
      setSaveSuccessNotice(null);
    }, 4000);
  };

  const handleTestConnection = async () => {
    setTestStatus({ loading: true, message: 'Testing connection to model endpoint...' });
    setSaveSuccessNotice(null);
    try {
      if (provider === 'gemini') {
        const { GoogleGenAI } = await import('@google/genai');
        const key = apiKey.trim() || process.env.GEMINI_API_KEY || process.env.API_KEY;
        if (!key) throw new Error('No Gemini API key specified or found in environment.');
        const ai = new GoogleGenAI({ apiKey: key });
        const res = await ai.models.generateContent({
          model: modelId,
          contents: 'Say "OK" in 1 word.',
        });
        setTestStatus({
          loading: false,
          success: true,
          message: `Connected successfully to ${modelId}! Response: "${res.text?.trim() || 'OK'}"`
        });
      } else {
        const targetUrl = baseUrl.trim() || AI_PRESETS.find(p => p.provider === provider)?.defaultBaseUrl || 'https://api.openai.com/v1';
        const endpoint = targetUrl.replace(/\/+$/, '') + (targetUrl.endsWith('/chat/completions') ? '' : '/chat/completions');
        
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (apiKey.trim()) headers['Authorization'] = `Bearer ${apiKey.trim()}`;
        if (provider === 'openrouter') {
          headers['HTTP-Referer'] = 'https://seattlewatch.app';
          headers['X-Title'] = 'Seattle Community Watch';
        }

        const effectiveTargetModel = provider === 'custom' ? (customModelId.trim() || 'custom-model') : modelId;
        const res = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: effectiveTargetModel,
            messages: [{ role: 'user', content: 'Reply with "OK" only.' }],
            max_tokens: 10
          })
        });

        if (!res.ok) {
          const errBody = await res.text();
          throw new Error(`HTTP ${res.status}: ${errBody.slice(0, 150)}`);
        }

        const data = await res.json();
        const reply = data.choices?.[0]?.message?.content || 'OK';
        setTestStatus({
          loading: false,
          success: true,
          message: `Connected successfully to ${effectiveTargetModel}! Response: "${reply.trim()}"`
        });
      }
    } catch (err: any) {
      setTestStatus({
        loading: false,
        success: false,
        message: `Connection failed: ${err.message || 'Check endpoint URL, model ID, and API key.'}`
      });
    }
  };

  const filteredPresets = AI_PRESETS.filter(preset => {
    const matchesCategory = activeCategory === 'All' || preset.category === activeCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      preset.name.toLowerCase().includes(q) || 
      preset.modelId.toLowerCase().includes(q) || 
      preset.description.toLowerCase().includes(q) ||
      preset.category.toLowerCase().includes(q) ||
      preset.provider.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  const currentActivePreset = AI_PRESETS.find(
    p => p.provider === settings.provider && p.modelId === settings.modelId
  );
  const activeDisplayName = settings.provider === 'custom'
    ? (settings.customModelId || 'Custom Endpoint')
    : (currentActivePreset?.name || settings.modelId);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Page Header */}
      <div className="bg-gray-850 border border-gray-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-black uppercase tracking-wider rounded-full">
                AI Engine & Provider Studio
              </span>
              <span className="px-3 py-1 bg-purple-500/20 text-purple-400 border border-purple-500/30 text-xs font-black uppercase tracking-wider rounded-full">
                Nous & Open Weights Supported
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              Choose & Configure Your AI Model
            </h2>
            <p className="text-sm text-gray-400 max-w-2xl leading-relaxed">
              Seamlessly power Seattle Community Watch with <strong>Nous Research (Hermes 3 405B/70B/8B)</strong>, 
              <strong> Google Gemini</strong>, <strong>Groq LPUs</strong>, <strong>Local Ollama</strong>, 
              <strong> DeepSeek R1/V3</strong>, <strong>Claude</strong>, <strong>OpenAI</strong>, or any custom OpenAI-compatible endpoint.
            </p>
          </div>

          <button
            onClick={onNavigateToWatch}
            className="self-start md:self-center flex items-center gap-2 px-5 py-3 rounded-2xl bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 font-bold text-xs shadow-md transition-all group"
          >
            <span>Back to Live Watch</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Live Active Status Bar */}
        <div className="mt-6 pt-6 border-t border-gray-800/80 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-900/80 p-3.5 rounded-2xl border border-gray-800">
            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider block mb-1">Active Model</span>
            <div className="text-sm font-bold text-white truncate flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="truncate">{activeDisplayName}</span>
            </div>
          </div>
          
          <div className="bg-gray-900/80 p-3.5 rounded-2xl border border-gray-800">
            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider block mb-1">Active Provider</span>
            <div className="text-sm font-bold text-blue-400 uppercase font-mono truncate">
              {settings.provider}
            </div>
          </div>

          <div className="bg-gray-900/80 p-3.5 rounded-2xl border border-gray-800">
            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider block mb-1">Grounding & Capabilities</span>
            <div className="text-sm font-bold text-gray-300 truncate">
              {settings.provider === 'gemini' ? 'Live Web Grounding' : 'Structured Prompting'}
            </div>
          </div>

          <div className="bg-gray-900/80 p-3.5 rounded-2xl border border-gray-800">
            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider block mb-1">Temperature Setting</span>
            <div className="text-sm font-bold text-purple-400 font-mono">
              {settings.temperature ?? 0.2}
            </div>
          </div>
        </div>
      </div>

      {saveSuccessNotice && (
        <div className="bg-emerald-950/80 border border-emerald-500/60 p-4 rounded-2xl flex items-center justify-between gap-3 text-emerald-200 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-xs font-bold">{saveSuccessNotice}</span>
          </div>
          <button 
            onClick={onNavigateToWatch}
            className="text-xs font-bold bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-xl transition-colors"
          >
            Launch Search & Map →
          </button>
        </div>
      )}

      {/* Main Studio 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Preset Catalog & Filter (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs font-black text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">1</span>
              <span>Select Model Preset</span>
            </div>
            
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search models (e.g. Nous, Groq, 405B)..."
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors pl-8"
              />
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-1.5 p-1 bg-gray-800/70 rounded-2xl border border-gray-750">
            {CATEGORIES.map(cat => {
              const isNous = cat.includes('Nous');
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeCategory === cat
                      ? (isNous ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' : 'bg-blue-600 text-white shadow-md')
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-750'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Preset Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto pr-1">
            {filteredPresets.map(preset => {
              const isSelected = selectedPresetId === preset.id;
              const isNous = preset.category.includes('Nous');
              
              return (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className={`text-left p-4 rounded-2xl border transition-all flex flex-col justify-between relative group ${
                    isSelected
                      ? (isNous 
                          ? 'bg-purple-950/40 border-purple-500 ring-2 ring-purple-500/50 shadow-xl' 
                          : 'bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/50 shadow-xl')
                      : 'bg-gray-800/70 border-gray-700/70 hover:bg-gray-800 hover:border-gray-600'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className="text-xs font-black text-white group-hover:text-blue-300 transition-colors leading-tight">
                        {preset.name}
                      </span>
                      {preset.badge && (
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider flex-shrink-0 ${
                          isNous ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}>
                          {preset.badge}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-[11px] text-gray-400 line-clamp-2 mb-3 leading-relaxed">
                      {preset.description}
                    </p>
                  </div>
                  
                  <div className="pt-2 border-t border-gray-700/50 flex items-center justify-between text-[10px]">
                    <code className="font-mono text-gray-400 truncate max-w-[150px]">{preset.modelId}</code>
                    <span className="font-bold text-gray-500 uppercase">{preset.provider}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {filteredPresets.length === 0 && (
            <div className="p-8 text-center bg-gray-800/40 rounded-2xl border border-gray-700 text-gray-400 text-xs">
              No models match your search query "{searchQuery}". You can select "Custom" to enter any model name.
            </div>
          )}

        </div>

        {/* Right Column: Configuration & Test Bench (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          
          <div className="text-xs font-black text-gray-300 uppercase tracking-wider flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">2</span>
            <span>Provider Configuration</span>
          </div>

          <div className="bg-gray-850 border border-gray-750 rounded-3xl p-6 shadow-2xl space-y-5">
            
            {/* Target Model Banner */}
            <div className="p-3.5 bg-gray-900 rounded-2xl border border-gray-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Selected Engine</span>
                <span className="text-xs font-bold text-white font-mono">{modelId}</span>
              </div>
              <span className="text-[10px] px-2 py-1 bg-gray-800 text-gray-300 rounded font-mono uppercase font-bold">
                {provider}
              </span>
            </div>

            {/* API Key */}
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5">
                API Key {provider === 'ollama' ? '(Optional for Local)' : provider === 'gemini' ? '(Optional if configured in environment)' : '(Required)'}
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={
                    provider === 'gemini' 
                      ? 'Using environment GEMINI_API_KEY (or enter custom key)' 
                      : provider === 'ollama'
                      ? 'No key needed for local Ollama'
                      : `Enter ${provider.toUpperCase()} API key`
                  }
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors pr-12 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs font-semibold"
                >
                  {showKey ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {/* Model Identifier (Custom Override) */}
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5">
                Model Identifier
              </label>
              {provider === 'custom' ? (
                <input
                  type="text"
                  value={customModelId}
                  onChange={(e) => setCustomModelId(e.target.value)}
                  placeholder="e.g. nousresearch/hermes-3-llama-3.1-405b"
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors font-mono"
                />
              ) : (
                <input
                  type="text"
                  value={modelId}
                  onChange={(e) => setModelId(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors font-mono"
                />
              )}
            </div>

            {/* Base URL */}
            {provider !== 'gemini' && (
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">
                  Base Endpoint URL
                </label>
                <input
                  type="text"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://openrouter.ai/api/v1"
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors font-mono"
                />
                <p className="text-[10px] text-gray-500 mt-1">
                  Works with OpenRouter (<code className="text-gray-400">https://openrouter.ai/api/v1</code>), Ollama (<code className="text-gray-400">http://localhost:11434/v1</code>), Groq, Together, etc.
                </p>
              </div>
            )}

            {/* Temperature Slider */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-gray-300">
                  Temperature: <span className="text-blue-400 font-mono">{temperature}</span>
                </label>
                <span className="text-[10px] text-gray-400">0.0 (Strict) - 1.0 (Creative)</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer h-2 bg-gray-700 rounded-lg appearance-none"
              />
            </div>

            {/* Test Connection Button & Status */}
            <div className="pt-2 space-y-3">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testStatus?.loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-750 border border-gray-700 rounded-xl text-xs font-bold text-gray-200 transition-all disabled:opacity-50"
              >
                {testStatus?.loading ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Testing Endpoint & API Key...</span>
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Test Model Connection</span>
                  </>
                )}
              </button>

              {testStatus && (
                <div className={`text-xs font-medium p-3 rounded-xl border leading-relaxed ${
                  testStatus.success 
                    ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300' 
                    : testStatus.loading 
                    ? 'bg-gray-900 border-gray-700 text-gray-300' 
                    : 'bg-red-950/60 border-red-500/50 text-red-300'
                }`}>
                  {testStatus.message}
                </div>
              )}
            </div>

            {/* Save Button */}
            <div className="pt-2 border-t border-gray-800 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleSave}
                className="w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-xl shadow-blue-600/25 transition-all flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Activate & Apply Model</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setProvider('gemini');
                  setModelId('gemini-3.7-flash');
                  setSelectedPresetId('gemini-3.7-flash');
                  setApiKey('');
                  setBaseUrl('');
                  setCustomModelId('');
                  setTemperature(0.2);
                  setTestStatus(null);
                }}
                className="text-[11px] text-gray-500 hover:text-gray-300 text-center py-1 transition-colors"
              >
                Reset to Default (Gemini 3.7 Flash)
              </button>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
