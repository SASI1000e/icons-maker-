import React from 'react';
import { PenTool, Sparkles, LayoutGrid, Palette } from 'lucide-react';
import { useConfig } from '../contexts/ConfigContext';

interface HeaderProps {
  activeTab: 'editor' | 'mockup';
  onTabChange: (tab: 'editor' | 'mockup') => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange }) => {
  const { config, setIsAdminOpen } = useConfig();

  return (
    <header className="w-full border-b border-slate-200 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center py-4 gap-4">
          
          {/* Logo Section - Hidden Admin Trigger (Double Click) */}
          <div 
            className="flex items-center space-x-3 cursor-pointer select-none group p-2 rounded-xl transition-colors hover:bg-slate-50/50" 
            onDoubleClick={() => setIsAdminOpen(true)}
            title="Double-click to manage settings"
          >
            {config.logoUrl ? (
               <img src={config.logoUrl} alt="Logo" className="w-10 h-10 object-contain rounded-lg select-none" />
            ) : (
              <div className="bg-gradient-to-br from-brand-500 to-brand-700 p-2 rounded-lg shadow-lg shadow-brand-500/20">
                <PenTool className="w-6 h-6 text-white" />
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight select-none">
                {config.appName}
              </h1>
              <p className="text-xs text-slate-500 hidden md:block select-none">{config.appDescription}</p>
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              onClick={() => onTabChange('editor')}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === 'editor'
                  ? 'bg-white text-brand-700 shadow-sm border border-slate-200'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              <Palette className="w-4 h-4 mr-2" />
              Icon Editor
            </button>
            <button
              onClick={() => onTabChange('mockup')}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === 'mockup'
                  ? 'bg-white text-brand-700 shadow-sm border border-slate-200'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              <LayoutGrid className="w-4 h-4 mr-2" />
              Mockup Studio
            </button>
          </div>

          <div className="hidden md:flex items-center space-x-4 text-sm">
            <div className="flex items-center px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-700 select-none">
                <Sparkles className="w-3 h-3 mr-2" />
                <span className="font-medium">AI Powered</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};