import React, { useState } from 'react';
import { 
  type AISettings, 
  type AIProviderType, 
  AI_PRESETS, 
  type AIProviderPreset 
} from '../types';

interface ModelSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AISettings;
  onSaveSettings: (newSettings: AISettings) => void;
}

const CATEGORIES = [
  'All',
  'Google Gemini',
  'Open Source / Groq',
  'Local / Ollama',
  'OpenRouter (Anthropic/Meta/Mistral)',
  'DeepSeek',
  'OpenAI',
  'Custom'
] as const;

export const ModelSettingsModal: React.FC<ModelSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings
}) => {
  const [activeTab, setActiveTab] = useState<string>('All');
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

  if (!isOpen) return null;

  const handleSelectPreset = (preset: AIProviderPreset) => {
    setSelectedPresetId(preset.id);
    setProvider(preset.provider);
    setModelId(preset.modelId);
    if (preset.defaultBaseUrl && !baseUrl) {
      setBaseUrl(preset.defaultBaseUrl);
    } else if (preset.defaultBaseUrl) {
      setBaseUrl(preset.defaultBaseUrl);
    }
    setTestStatus(null);
  };

  const handleSave = () => {
    const updated: AISettings = {
      provider,
      modelId: provider === 'custom' ? (customModelId.trim() || 'custom-model') : modelId,
      customModelId: customModelId.trim(),
      apiKey: apiKey.trim(),
      baseUrl: baseUrl.trim(),
      temperature
    };
    onSaveSettings(updated);
    onClose();
  };

  const handleTestConnection = async () => {
    setTestStatus({ loading: true, message: 'Testing connection to model endpoint...' });
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
          message: `Connected successfully to ${modelId}! Response: ${res.text?.trim() || 'OK'}`
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

  const filteredPresets = activeTab === 'All' 
    ? AI_PRESETS 
    : AI_PRESETS.filter(p => p.category === activeTab);

  const activePreset = AI_PRESETS.find(p => p.id === selectedPresetId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-gray-900 border border-gray-700 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-gray-100">
        
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-gray-800 flex items-center justify-between bg-gray-850">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                Universal AI Model Engine
                <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-full uppercase">
                  Any Model & Provider
                </span>
              </h2>
              <p className="text-xs text-gray-400">
                Power Seattle Community Watch with Gemini, Groq, Ollama, DeepSeek, Claude, OpenAI, or any custom endpoint.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-gray-800 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Active Model Indicator Banner */}
          <div className="bg-gray-800/80 border border-gray-700/80 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></div>
              <div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Current Target Model</div>
                <div className="text-sm font-black text-white flex items-center gap-2 font-mono">
                  {provider === 'custom' ? (customModelId || 'Custom Model') : modelId}
                  <span className="text-[11px] font-sans px-2 py-0.5 rounded bg-gray-700 text-gray-300">
                    {provider.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-400 flex items-center gap-3">
              <span>Vision: <strong className={activePreset?.supportsVision !== false ? 'text-emerald-400' : 'text-gray-500'}>{activePreset?.supportsVision !== false ? 'Supported' : 'Text Only'}</strong></span>
              <span>•</span>
              <span>Grounding: <strong className={provider === 'gemini' ? 'text-blue-400' : 'text-gray-400'}>{provider === 'gemini' ? 'Google Search Live' : 'Structured Prompting'}</strong></span>
            </div>
          </div>

          {/* Categories Tab Selector */}
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">
              1. Choose a Preset or Model Family
            </div>
            <div className="flex flex-wrap gap-1.5 p-1 bg-gray-800/60 rounded-2xl border border-gray-800">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveTab(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === cat
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-750'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Model Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredPresets.map(preset => {
              const isSelected = selectedPresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className={`text-left p-3.5 rounded-2xl border transition-all flex flex-col justify-between relative group ${
                    isSelected
                      ? 'bg-blue-600/15 border-blue-500 ring-1 ring-blue-500/50 shadow-lg'
                      : 'bg-gray-800/60 border-gray-700/60 hover:bg-gray-800 hover:border-gray-600'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors truncate">
                        {preset.name}
                      </span>
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400 line-clamp-2 mb-2 leading-relaxed">
                      {preset.description}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between text-[10px] text-gray-500 pt-2 border-t border-gray-700/40">
                    <code className="font-mono text-gray-400 truncate max-w-[140px]">{preset.modelId}</code>
                    <span className="font-semibold text-gray-400">{preset.provider}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Custom & Configuration Parameters */}
          <div className="bg-gray-800/40 border border-gray-700/60 rounded-2xl p-5 space-y-4">
            <div className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center justify-between">
              <span>2. Provider Credentials & Endpoint Details</span>
              <span className="text-[11px] font-normal text-gray-400 lowercase">saved securely in local browser storage</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* API Key Field */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
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
                        ? 'No key needed for localhost:11434'
                        : `Enter ${provider.toUpperCase()} API key`
                    }
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors pr-10 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs"
                  >
                    {showKey ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {/* Model ID Field (Editable for custom or override) */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Model Identifier / Name
                </label>
                {provider === 'custom' ? (
                  <input
                    type="text"
                    value={customModelId}
                    onChange={(e) => setCustomModelId(e.target.value)}
                    placeholder="e.g. meta-llama/llama-3.3-70b-instruct, qwen-2.5-72b"
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors font-mono"
                  />
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={modelId}
                      onChange={(e) => setModelId(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors font-mono"
                    />
                  </div>
                )}
              </div>

              {/* Custom Base URL */}
              {provider !== 'gemini' && (
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    API Base Endpoint URL
                  </label>
                  <input
                    type="text"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder={activePreset?.defaultBaseUrl || 'https://api.openai.com/v1'}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors font-mono"
                  />
                  <p className="text-[10px] text-gray-500 mt-1">
                    Accepts any OpenAI-compatible API base URL (e.g. <code className="text-gray-400 font-mono">http://localhost:11434/v1</code> for Ollama, <code className="text-gray-400 font-mono">https://openrouter.ai/api/v1</code> for OpenRouter).
                  </p>
                </div>
              )}

              {/* Temperature Slider */}
              <div className="md:col-span-2">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-gray-300">
                    Temperature (Creativity vs. Precision): <strong className="text-blue-400 font-mono">{temperature}</strong>
                  </label>
                  <span className="text-[10px] text-gray-400">0.0 (Strict) to 1.0 (Creative)</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer h-1.5 bg-gray-700 rounded-lg appearance-none"
                />
              </div>

            </div>

            {/* Test Connection Button & Status Output */}
            <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testStatus?.loading}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-xl text-xs font-bold text-gray-200 transition-colors disabled:opacity-50"
              >
                {testStatus?.loading ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Testing Endpoint...</span>
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
                <div className={`text-xs font-medium px-3 py-1.5 rounded-xl border flex-1 max-w-md ${
                  testStatus.success 
                    ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300' 
                    : testStatus.loading 
                    ? 'bg-gray-800 border-gray-700 text-gray-300' 
                    : 'bg-red-950/60 border-red-500/50 text-red-300'
                }`}>
                  {testStatus.message}
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-800 bg-gray-850 flex items-center justify-between">
          <button
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
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            Reset to Default (Gemini 3.7 Flash)
          </button>
          
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition-all"
            >
              Save & Apply Model
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
