
export type ReportMode = 'crime' | 'good_deed';
export type Language = 'English' | 'Spanish' | 'Vietnamese' | 'Chinese' | 'Somali';

export type AIProviderType = 'gemini' | 'openrouter' | 'groq' | 'deepseek' | 'openai' | 'ollama' | 'custom';

export type ModelCategory = 
  | 'All'
  | 'Nous Research (Hermes 3)'
  | 'Google Gemini'
  | 'Open Source / Groq'
  | 'Local / Ollama'
  | 'DeepSeek'
  | 'OpenRouter (Anthropic/Meta/Mistral)'
  | 'OpenAI'
  | 'Custom';

export interface AIProviderPreset {
  id: string;
  provider: AIProviderType;
  name: string;
  modelId: string;
  category: 'Nous Research (Hermes 3)' | 'Google Gemini' | 'Open Source / Groq' | 'Local / Ollama' | 'DeepSeek' | 'OpenAI' | 'OpenRouter (Anthropic/Meta/Mistral)' | 'Custom';
  description: string;
  defaultBaseUrl?: string;
  requiresApiKey: boolean;
  supportsVision?: boolean;
  badge?: string;
}

export interface AISettings {
  provider: AIProviderType;
  modelId: string;
  customModelId?: string;
  apiKey?: string;
  baseUrl?: string;
  temperature?: number;
}

export const DEFAULT_AI_SETTINGS: AISettings = {
  provider: 'gemini',
  modelId: 'gemini-3.7-flash',
  customModelId: '',
  apiKey: '',
  baseUrl: '',
  temperature: 0.2
};

export const AI_PRESETS: AIProviderPreset[] = [
  // Nous Research (Hermes Series)
  {
    id: 'nous-hermes-3-405b',
    provider: 'openrouter',
    name: 'Nous Hermes 3 405B (Nous Research)',
    modelId: 'nousresearch/hermes-3-llama-3.1-405b',
    category: 'Nous Research (Hermes 3)',
    description: 'Nous Research\'s flagship 405B frontier model with exceptional reasoning, steering, and agentic capabilities',
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    requiresApiKey: true,
    supportsVision: false,
    badge: '405B Flagship'
  },
  {
    id: 'nous-hermes-3-70b',
    provider: 'openrouter',
    name: 'Nous Hermes 3 70B (Nous Research)',
    modelId: 'nousresearch/hermes-3-llama-3.1-70b',
    category: 'Nous Research (Hermes 3)',
    description: 'High-performance 70B instruct & reasoning model from Nous Research',
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    requiresApiKey: true,
    supportsVision: false,
    badge: 'Popular'
  },
  {
    id: 'nous-hermes-3-8b',
    provider: 'openrouter',
    name: 'Nous Hermes 3 8B (Nous Research)',
    modelId: 'nousresearch/hermes-3-llama-3.1-8b',
    category: 'Nous Research (Hermes 3)',
    description: 'Ultra-fast, lightweight Nous Hermes 3 model with strong conversational and reasoning abilities',
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    requiresApiKey: true,
    supportsVision: false,
    badge: 'Fast'
  },
  {
    id: 'nous-deephermes-3-8b',
    provider: 'openrouter',
    name: 'DeepHermes 3 8B (Nous Research)',
    modelId: 'nousresearch/deephermes-3-llama-3-8b-preview',
    category: 'Nous Research (Hermes 3)',
    description: 'Nous Research\'s experimental reasoning model with transparent chain-of-thought introspection',
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    requiresApiKey: true,
    supportsVision: false,
    badge: 'Reasoning CoT'
  },
  {
    id: 'nous-hermes-2-pro',
    provider: 'openrouter',
    name: 'Nous Hermes 2 Pro 8B (Nous Research)',
    modelId: 'nousresearch/hermes-2-pro-llama-3-8b',
    category: 'Nous Research (Hermes 3)',
    description: 'Specialized for structured JSON generation and reliable tool use',
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    requiresApiKey: true,
    supportsVision: false,
    badge: 'JSON & Tools'
  },
  {
    id: 'ollama-nous-hermes3',
    provider: 'ollama',
    name: 'Ollama: Hermes 3 (Local Nous)',
    modelId: 'hermes3',
    category: 'Nous Research (Hermes 3)',
    description: 'Run Nous Hermes 3 locally on your machine via Ollama (ollama run hermes3)',
    defaultBaseUrl: 'http://localhost:11434/v1',
    requiresApiKey: false,
    supportsVision: false,
    badge: 'Local Ollama'
  },

  // Google Gemini
  {
    id: 'gemini-3.7-flash',
    provider: 'gemini',
    name: 'Gemini 3.7 Flash',
    modelId: 'gemini-3.7-flash',
    category: 'Google Gemini',
    description: 'Fast, multimodal, with live Google Search grounding',
    requiresApiKey: false,
    supportsVision: true,
    badge: 'Live Search'
  },
  {
    id: 'gemini-2.5-pro',
    provider: 'gemini',
    name: 'Gemini 2.5 Pro',
    modelId: 'gemini-2.5-pro',
    category: 'Google Gemini',
    description: 'Deep reasoning & advanced analysis with live search grounding',
    requiresApiKey: false,
    supportsVision: true,
    badge: 'Deep Reasoning'
  },
  {
    id: 'gemini-2.5-flash',
    provider: 'gemini',
    name: 'Gemini 2.5 Flash',
    modelId: 'gemini-2.5-flash',
    category: 'Google Gemini',
    description: 'High-speed lightweight model with live search grounding',
    requiresApiKey: false,
    supportsVision: true,
    badge: 'Fast'
  },

  // Open Source via Groq (Ultra-fast)
  {
    id: 'groq-llama-3.3-70b',
    provider: 'groq',
    name: 'Llama 3.3 70B (Groq)',
    modelId: 'llama-3.3-70b-versatile',
    category: 'Open Source / Groq',
    description: 'Meta\'s premier open-weights model running at 300+ tok/s on Groq LPUs',
    defaultBaseUrl: 'https://api.groq.com/openai/v1',
    requiresApiKey: true,
    supportsVision: false,
    badge: '300 tok/s'
  },
  {
    id: 'groq-deepseek-r1',
    provider: 'groq',
    name: 'DeepSeek R1 Distill 70B (Groq)',
    modelId: 'deepseek-r1-distill-llama-70b',
    category: 'Open Source / Groq',
    description: 'Open reasoning model running at blazing speeds on Groq LPUs',
    defaultBaseUrl: 'https://api.groq.com/openai/v1',
    requiresApiKey: true,
    supportsVision: false,
    badge: 'Fast Reasoning'
  },
  {
    id: 'groq-mixtral-8x7b',
    provider: 'groq',
    name: 'Mixtral 8x7B (Groq)',
    modelId: 'mixtral-8x7b-32768',
    category: 'Open Source / Groq',
    description: 'Mistral AI\'s fast MoE model',
    defaultBaseUrl: 'https://api.groq.com/openai/v1',
    requiresApiKey: true,
    supportsVision: false,
    badge: 'MoE'
  },

  // Local / Self-Hosted (Ollama / LM Studio / vLLM)
  {
    id: 'ollama-llama3',
    provider: 'ollama',
    name: 'Ollama: Llama 3.3 (Local)',
    modelId: 'llama3.3',
    category: 'Local / Ollama',
    description: 'Local self-hosted model running on your machine (localhost:11434)',
    defaultBaseUrl: 'http://localhost:11434/v1',
    requiresApiKey: false,
    supportsVision: false,
    badge: 'Local'
  },
  {
    id: 'ollama-deepseek-r1',
    provider: 'ollama',
    name: 'Ollama: DeepSeek R1 (Local)',
    modelId: 'deepseek-r1',
    category: 'Local / Ollama',
    description: 'Local DeepSeek reasoning model running on Ollama',
    defaultBaseUrl: 'http://localhost:11434/v1',
    requiresApiKey: false,
    supportsVision: false,
    badge: 'Local CoT'
  },
  {
    id: 'ollama-mistral',
    provider: 'ollama',
    name: 'Ollama: Mistral (Local)',
    modelId: 'mistral',
    category: 'Local / Ollama',
    description: 'Local Mistral 7B running on Ollama',
    defaultBaseUrl: 'http://localhost:11434/v1',
    requiresApiKey: false,
    supportsVision: false,
    badge: 'Local'
  },

  // DeepSeek Official API
  {
    id: 'deepseek-chat',
    provider: 'deepseek',
    name: 'DeepSeek-V3 (Official)',
    modelId: 'deepseek-chat',
    category: 'DeepSeek',
    description: 'DeepSeek-V3 official 671B MoE model',
    defaultBaseUrl: 'https://api.deepseek.com/v1',
    requiresApiKey: true,
    supportsVision: false,
    badge: '671B MoE'
  },
  {
    id: 'deepseek-reasoner',
    provider: 'deepseek',
    name: 'DeepSeek-R1 (Official)',
    modelId: 'deepseek-reasoner',
    category: 'DeepSeek',
    description: 'DeepSeek-R1 reasoning model for deep chain-of-thought analysis',
    defaultBaseUrl: 'https://api.deepseek.com/v1',
    requiresApiKey: true,
    supportsVision: false,
    badge: 'Official R1'
  },

  // OpenRouter (Anthropic, Meta, Mistral, Qwen, etc.)
  {
    id: 'openrouter-claude-3.7-sonnet',
    provider: 'openrouter',
    name: 'Claude 3.7 Sonnet (OpenRouter)',
    modelId: 'anthropic/claude-3.7-sonnet',
    category: 'OpenRouter (Anthropic/Meta/Mistral)',
    description: 'Anthropic\'s flagship hybrid reasoning & vision model via OpenRouter',
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    requiresApiKey: true,
    supportsVision: true,
    badge: 'Reasoning + Vision'
  },
  {
    id: 'openrouter-claude-3.5-sonnet',
    provider: 'openrouter',
    name: 'Claude 3.5 Sonnet (OpenRouter)',
    modelId: 'anthropic/claude-3.5-sonnet',
    category: 'OpenRouter (Anthropic/Meta/Mistral)',
    description: 'Top-tier code and visual analysis model from Anthropic',
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    requiresApiKey: true,
    supportsVision: true,
    badge: 'Vision'
  },
  {
    id: 'openrouter-deepseek-r1',
    provider: 'openrouter',
    name: 'DeepSeek R1 (OpenRouter)',
    modelId: 'deepseek/deepseek-r1',
    category: 'OpenRouter (Anthropic/Meta/Mistral)',
    description: 'Full DeepSeek R1 reasoning model routed via OpenRouter',
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    requiresApiKey: true,
    supportsVision: false,
    badge: 'Open Weights'
  },
  {
    id: 'openrouter-qwen-72b',
    provider: 'openrouter',
    name: 'Qwen 2.5 72B (OpenRouter)',
    modelId: 'qwen/qwen-2.5-72b-instruct',
    category: 'OpenRouter (Anthropic/Meta/Mistral)',
    description: 'Top-tier open weights model from Alibaba',
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    requiresApiKey: true,
    supportsVision: false,
    badge: 'High Accuracy'
  },

  // OpenAI
  {
    id: 'openai-gpt-4o',
    provider: 'openai',
    name: 'GPT-4o (OpenAI)',
    modelId: 'gpt-4o',
    category: 'OpenAI',
    description: 'OpenAI\'s flagship multimodal intelligence model',
    defaultBaseUrl: 'https://api.openai.com/v1',
    requiresApiKey: true,
    supportsVision: true,
    badge: 'Multimodal'
  },
  {
    id: 'openai-gpt-4o-mini',
    provider: 'openai',
    name: 'GPT-4o Mini (OpenAI)',
    modelId: 'gpt-4o-mini',
    category: 'OpenAI',
    description: 'Fast, cost-efficient multimodal model',
    defaultBaseUrl: 'https://api.openai.com/v1',
    requiresApiKey: true,
    supportsVision: true,
    badge: 'Efficient'
  },
  {
    id: 'openai-o3-mini',
    provider: 'openai',
    name: 'o3-mini (OpenAI)',
    modelId: 'o3-mini',
    category: 'OpenAI',
    description: 'High-speed reasoning model',
    defaultBaseUrl: 'https://api.openai.com/v1',
    requiresApiKey: true,
    supportsVision: false,
    badge: 'Reasoning'
  },

  // Custom Provider
  {
    id: 'custom-endpoint',
    provider: 'custom',
    name: '⚡ Any Custom Endpoint / Model',
    modelId: 'custom-model',
    category: 'Custom',
    description: 'Connect to any OpenAI-compatible API (Nous, vLLM, Together AI, Fireworks, LM Studio, Mistral, xAI, etc.)',
    defaultBaseUrl: 'https://api.openai.com/v1',
    requiresApiKey: true,
    supportsVision: true,
    badge: 'Custom'
  }
];

export interface ModelOption {
  id: string;
  name: string;
  category?: string;
}

export const PRESET_MODELS: ModelOption[] = AI_PRESETS.map(p => ({
  id: p.id,
  name: p.name,
  category: p.category
}));

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface Location {
    lat: number;
    lng: number;
    description: string;
}

export interface SearchResult {
  report: string;
  sources: GroundingChunk[];
  locations: Location[];
  insight: string;
  details: string;
  sentimentScore: number; // 0-100
  modelUsed?: string;
  providerUsed?: string;
}

export interface Alert {
  id: string;
  name: string;
  mode: ReportMode;
  categories: string[];
  area: any; // GeoJSON feature
  isActive: boolean;
  lastChecked: number;
  lastResultHash: string | null;
}

