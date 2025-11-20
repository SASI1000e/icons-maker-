
export interface GeneratedImage {
  id: string;
  imageUrl: string;
  prompt: string;
  customLabel?: string; // The editable text to display instead of raw prompt
  timestamp: number;
}

export interface AppState {
  isLoading: boolean;
  error: string | null;
  currentImage: File | null;
  currentImagePreview: string | null;
  generatedImages: GeneratedImage[];
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
  logoUrl: string; // If empty, use default icon
  editorPrompts: string[]; // The quick prompt chips
  mockupPresets: MockupPreset[]; // Dynamic mockup presets
  welcomeMessage: string; // Text displayed in empty state
  adminPin: string; // Password for admin panel
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: 'pending' | 'approved' | 'rejected';
  joinedAt: number;
}