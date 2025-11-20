export interface GeneratedImage {
  id: string;
  imageUrl: string;
  prompt: string;
  customLabel?: string;
  timestamp: number;
}

export interface MockupPreset {
  id: string;
  label: string;
  icon: string;
  prompt: string;
}

export interface AppConfig {
  appName: string;
  appDescription: string;
  logoUrl: string;
  editorPrompts: string[];
  mockupPresets: MockupPreset[];
  welcomeMessage: string;
  adminPin: string;
  geminiApiKey?: string; // Added API Key support
}