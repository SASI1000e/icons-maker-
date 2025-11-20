
import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppConfig } from '../types';
import { SAMPLE_PROMPTS, MOCKUP_PRESETS } from '../constants';

const DEFAULT_CONFIG: AppConfig = {
  appName: "Iconic Studio",
  appDescription: "Powered by Gemini 2.5 Flash",
  logoUrl: "",
  editorPrompts: SAMPLE_PROMPTS,
  // Initialize with all presets except 'custom' which is handled functionally
  mockupPresets: MOCKUP_PRESETS.filter(p => p.id !== 'custom'),
  welcomeMessage: "Upload an image to start designing",
  adminPin: "admin"
};

interface ConfigContextType {
  config: AppConfig;
  updateConfig: (newConfig: Partial<AppConfig>) => void;
  resetConfig: () => void;
  isAdminOpen: boolean;
  setIsAdminOpen: (isOpen: boolean) => void;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('app_config');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        // Merge with default to ensure new fields are present if schema changes
        const merged = { 
            ...DEFAULT_CONFIG, 
            ...parsed,
            mockupPresets: parsed.mockupPresets || DEFAULT_CONFIG.mockupPresets,
            welcomeMessage: parsed.welcomeMessage || DEFAULT_CONFIG.welcomeMessage,
            adminPin: parsed.adminPin || DEFAULT_CONFIG.adminPin
        };
        setConfig(merged);
      } catch (e) {
        console.error("Failed to parse config", e);
      }
    }
  }, []);

  const updateConfig = (newConfig: Partial<AppConfig>) => {
    setConfig(prev => {
      const updated = { ...prev, ...newConfig };
      localStorage.setItem('app_config', JSON.stringify(updated));
      return updated;
    });
  };

  const resetConfig = () => {
    setConfig(DEFAULT_CONFIG);
    localStorage.setItem('app_config', JSON.stringify(DEFAULT_CONFIG));
  };

  return (
    <ConfigContext.Provider value={{ config, updateConfig, resetConfig, isAdminOpen, setIsAdminOpen }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig must be used within an ConfigProvider');
  }
  return context;
};