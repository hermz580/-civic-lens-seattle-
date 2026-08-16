import React, { useState, useCallback, useEffect } from 'react';
import { searchForIncidents } from './services/geminiService';
import { 
  type SearchResult, 
  type Alert, 
  type Location, 
  type ReportMode, 
  type Language,
  type AISettings,
  DEFAULT_AI_SETTINGS,
  AI_PRESETS
} from './types';
import * as alertService from './services/alertService';
import LoadingSpinner from './components/LoadingSpinner';
import CrimeReport from './components/CrimeReport';
import SourceLinks from './components/SourceLinks';
import SearchForm from './components/SearchForm';
import MapComponent from './components/MapComponent';
import InsightReport from './components/InsightReport';
import AlertsManager from './components/AlertsManager';
import { ModelStudioPage } from './components/ModelStudioPage';

const POLLING_INTERVAL = 5 * 60 * 1000;

export type AppView = 'watch' | 'studio' | 'alerts';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('watch');
  const [mode, setMode] = useState<ReportMode>('crime');
  const [query, setQuery] = useState<string>('');
  const [language, setLanguage] = useState<Language>('English');
  const [category, setCategory] = useState<string>('All');
  
  const [aiSettings, setAiSettings] = useState<AISettings>(() => {
    try {
      const saved = localStorage.getItem('emerald_ai_settings');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_AI_SETTINGS;
  });

  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchArea, setSearchArea] = useState<any | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>(() => alertService.getAlerts());
  const [isAlertManagerOpen, setIsAlertManagerOpen] = useState(false);
  const [liveLocations, setLiveLocations] = useState<Location[]>([]);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const crimeCategories = ['All', 'Theft', 'Assault', 'Burglary', 'Robbery', 'Vandalism', 'Drug-related'];
  const goodDeedCategories = ['All', 'Community Service', 'Donation', 'Rescue', 'Volunteering', 'Local Hero', 'Events'];
  const languages: Language[] = ['English', 'Spanish', 'Vietnamese', 'Chinese', 'Somali'];

  const currentCategories = mode === 'crime' ? crimeCategories : goodDeedCategories;
  const theme = {
      titleGradient: mode === 'crime' ? 'from-red-500 to-orange-500' : 'from-emerald-400 to-sky-400',
      color: mode === 'crime' ? 'red' : 'green'
  };

  const handleSaveAISettings = (newSettings: AISettings) => {
    setAiSettings(newSettings);
    try {
      localStorage.setItem('emerald_ai_settings', JSON.stringify(newSettings));
    } catch (e) {
      console.error(e);
    }
  };

  const currentPreset = AI_PRESETS.find(
    p => p.provider === aiSettings.provider && p.modelId === aiSettings.modelId
  );

  const displayModelName = aiSettings.provider === 'custom'
    ? (aiSettings.customModelId || 'Custom Endpoint')
    : currentPreset?.name || aiSettings.modelId;

  const isNousModel = currentPreset?.category?.includes('Nous') || aiSettings.modelId?.toLowerCase().includes('nous') || aiSettings.modelId?.toLowerCase().includes('hermes');

  useEffect(() => {
    setQuery(''); 
    setCategory('All');
    setSearchResult(null);
    setLiveLocations([]);
    setCapturedImage(null);
  }, [mode]);

  useEffect(() => {
    const checkAlerts = async () => {
      const activeAlerts = alertService.getAlerts().filter(a => a.isActive);
      if (activeAlerts.length === 0) return;
      
      let newLocs: Location[] = [];
      for (const alert of activeAlerts) {
        try {
          const res = await searchForIncidents(`recent ${alert.mode}`, 'All', alert.mode, alert.area, undefined, 'English', aiSettings);
          if (res.locations) newLocs.push(...res.locations);
          if (res.report && res.report !== alert.lastResultHash) {
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(`Update: ${alert.name}`, { body: res.insight });
            }
            alertService.updateAlert({ ...alert, lastResultHash: res.report, lastChecked: Date.now() });
          }
        } catch (e: any) { 
          console.error(e);
        }
      }
      setLiveLocations(newLocs);
    };
    const interval = setInterval(checkAlerts, POLLING_INTERVAL);
    checkAlerts();
    return () => clearInterval(interval);
  }, [aiSettings]);

  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() && !capturedImage) {
      setError('Enter a search or upload an image.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await searchForIncidents(query, category, mode, searchArea, capturedImage || undefined, language, aiSettings);
      setSearchResult(result);
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : 'Error fetching data.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [query, category, searchArea, mode, capturedImage, language, aiSettings]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans selection:bg-blue-500/30 flex flex-col">
      
      {/* Top Main Navigation Bar (Clean z-index 30 - never blocked by map) */}
      <header className="sticky top-0 z-30 bg-gray-900/95 backdrop-blur-xl border-b border-gray-800 shadow-xl">
        <div className="container mx-auto px-4 py-3 max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Logo & Subtitle */}
          <div className="flex items-center gap-3">
            <div 
              onClick={() => setCurrentView('watch')}
              className="cursor-pointer flex items-center gap-2 group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 via-purple-600 to-blue-600 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293A1 1 0 002 4v10a1 1 0 00.293.707L6 18.414V5.586L3.707 3.293zM17.707 5.293L14 1.586v12.828l3.707 3.707A1 1 0 0019 17.414V7.414a1 1 0 00-.293-.707l-1-1.414z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h1 className="text-base font-black text-white tracking-tight uppercase group-hover:text-blue-400 transition-colors">
                  Seattle Watch
                </h1>
                <p className="text-[10px] text-gray-400 font-medium">
                  Civic Safety & Community Intel
                </p>
              </div>
            </div>
          </div>

          {/* Primary View Navigation Tabs */}
          <nav className="flex items-center gap-1.5 p-1 bg-gray-800/90 rounded-full border border-gray-700 shadow-inner">
            <button
              onClick={() => setCurrentView('watch')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all ${
                currentView === 'watch'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-gray-750'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              <span>Watch & Map</span>
            </button>

            <button
              onClick={() => setCurrentView('studio')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all relative ${
                currentView === 'studio'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-gray-750'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isNousModel ? 'bg-purple-400 animate-pulse' : 'bg-emerald-400 animate-pulse'}`}></span>
              <span>AI Model Studio</span>
              {isNousModel && (
                <span className="text-[9px] px-1 py-0.2 rounded bg-purple-900/60 text-purple-200 border border-purple-400/40">
                  Nous
                </span>
              )}
            </button>

            <button
              onClick={() => setIsAlertManagerOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider text-gray-400 hover:text-white hover:bg-gray-750 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
              </svg>
              <span>Alerts ({alerts.filter(a => a.isActive).length})</span>
            </button>
          </nav>

          {/* Quick Active Model Pill & Language */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentView('studio')}
              className="flex items-center gap-2 bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-gray-600 rounded-full px-3 py-1.5 text-xs text-gray-200 shadow-sm transition-all group"
              title="Click to open full AI Model Studio Page"
            >
              <span className={`w-2 h-2 rounded-full ${isNousModel ? 'bg-purple-400 animate-pulse' : 'bg-emerald-400 animate-pulse'}`}></span>
              <span className="truncate max-w-[120px] font-bold text-[11px]">{displayModelName}</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-700 font-mono uppercase text-gray-300 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                {aiSettings.provider}
              </span>
            </button>

            <select 
              value={language} 
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="bg-gray-800 text-xs font-bold border border-gray-700 rounded-full px-3 py-1.5 focus:outline-none cursor-pointer text-gray-300"
            >
              {languages.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 container mx-auto px-4 py-6 max-w-5xl">
        
        {/* VIEW 1: LIVE WATCH & INTEL FEED */}
        {currentView === 'watch' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            {/* Header Title & Mode Switcher */}
            <div className="text-center py-4 space-y-4">
              <h2 className={`text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r ${theme.titleGradient} tracking-tighter`}>
                SEATTLE COMMUNITY WATCH
              </h2>
              
              <div className="flex flex-wrap justify-center items-center gap-3">
                <div className="bg-gray-800/90 p-1 rounded-full flex relative shadow-xl border border-gray-700">
                  <button 
                    onClick={() => setMode('crime')} 
                    className={`relative z-10 px-6 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all ${mode === 'crime' ? 'text-white' : 'text-gray-400 hover:text-gray-200'}`}
                  >
                    CRIME WATCH
                  </button>
                  <button 
                    onClick={() => setMode('good_deed')} 
                    className={`relative z-10 px-6 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all ${mode === 'good_deed' ? 'text-white' : 'text-gray-400 hover:text-gray-200'}`}
                  >
                    COMMUNITY HEROES
                  </button>
                  <div className={`absolute top-1 bottom-1 rounded-full transition-all duration-300 ${mode === 'crime' ? 'bg-red-600 left-1 w-1/2' : 'bg-emerald-600 left-1/2 w-1/2 -translate-x-1'}`}></div>
                </div>

                <button
                  onClick={() => setCurrentView('studio')}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-blue-400 px-3 py-1.5 rounded-full bg-gray-800/60 border border-gray-750 transition-colors"
                >
                  <span>Engine: <strong>{displayModelName}</strong></span>
                  <span className="text-blue-400 font-bold">Change →</span>
                </button>
              </div>
            </div>

            {/* Error Notification */}
            {error && (
              <div className="bg-red-950/80 border border-red-500/60 text-red-200 p-4 rounded-2xl flex items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-xs font-medium">{error}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setCurrentView('studio')}
                    className="text-xs bg-red-800 hover:bg-red-700 px-3 py-1.5 rounded-xl text-white font-bold transition-colors"
                  >
                    AI Settings
                  </button>
                  <button onClick={() => setError(null)} className="text-red-300 hover:text-white p-1">
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* Search Input Box */}
            <div className="bg-gray-850/95 border border-gray-750 p-4 rounded-3xl shadow-2xl">
              <SearchForm 
                query={query} setQuery={setQuery} 
                category={category} setCategory={setCategory}
                categories={currentCategories}
                handleSearch={handleSearch} isLoading={isLoading}
                themeColor={theme.color}
                onImageCapture={setCapturedImage}
                capturedImage={capturedImage}
              />
            </div>

            {/* Interactive Map Section (Isolated z-index) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  <span className="text-xs font-black uppercase tracking-wider text-gray-300">
                    Live Seattle Incident & Community Heatmap
                  </span>
                </div>
                <span className="text-[11px] text-gray-400">
                  Draw polygons on map to filter search area or trigger automated alerts
                </span>
              </div>

              <MapComponent 
                locations={[...(searchResult?.locations || []), ...liveLocations]} 
                onAreaChange={setSearchArea} 
                mode={mode} 
              />
            </div>

            {/* Loading Indicator */}
            {isLoading && <LoadingSpinner />}

            {/* Search Result Cards */}
            {searchResult && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* Engine Attribution Bar */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-gray-800/80 border border-gray-700/80 rounded-2xl text-xs text-gray-300">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>Processed via <strong className="text-white font-mono">{searchResult.modelUsed || displayModelName}</strong> ({searchResult.providerUsed || aiSettings.provider})</span>
                  </div>
                  <button 
                    onClick={() => setCurrentView('studio')}
                    className="text-blue-400 hover:text-blue-300 font-bold text-xs underline"
                  >
                    Open Model Studio →
                  </button>
                </div>

                <InsightReport 
                  insight={searchResult.insight} 
                  sentimentScore={searchResult.sentimentScore} 
                  mode={mode} 
                />
                
                <CrimeReport 
                  report={searchResult.report} 
                  details={searchResult.details} 
                  title={mode === 'crime' ? 'Verified Seattle Intel Report' : 'Community Good Deeds & Hero Highlights'}
                  themeColor={theme.color}
                />

                <SourceLinks sources={searchResult.sources} />
              </div>
            )}

          </div>
        )}

        {/* VIEW 2: DEDICATED AI MODEL STUDIO PAGE */}
        {currentView === 'studio' && (
          <ModelStudioPage
            settings={aiSettings}
            onSaveSettings={handleSaveAISettings}
            onNavigateToWatch={() => setCurrentView('watch')}
          />
        )}

      </main>

      {/* Geofence Alerts Modal */}
      {isAlertManagerOpen && (
        <AlertsManager
          isOpen={isAlertManagerOpen} 
          onClose={() => setIsAlertManagerOpen(false)}
          alerts={alerts}
          onAlertsChange={(a) => { 
            alertService.saveAlerts(a); 
            setAlerts(a); 
          }}
          crimeCategories={crimeCategories.filter(c => c !== 'All')}
          goodDeedCategories={goodDeedCategories.filter(c => c !== 'All')}
          currentArea={searchArea}
        />
      )}

      {/* Persistent Footer */}
      <footer className="mt-auto py-6 border-t border-gray-800 text-center text-xs text-gray-500">
        <p>Seattle Community Watch • Universal AI Inference Engine • Powered by Nous Research, Gemini, Groq, Ollama & Open Models</p>
      </footer>

    </div>
  );
};

export default App;
