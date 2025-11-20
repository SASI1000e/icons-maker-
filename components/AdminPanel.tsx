import React, { useState, useEffect } from 'react';
import { useConfig } from '../contexts/ConfigContext';
import { X, Save, RotateCcw, Plus, Settings, Upload, Image as ImageIcon, Lock, Unlock, LayoutGrid, Trash2, LogOut, Edit2, Key } from 'lucide-react';
import { Button } from './Button';
import { fileToPreviewUrl } from '../utils';
import { MockupPreset } from '../types';

export const AdminPanel: React.FC = () => {
  const { config, updateConfig, resetConfig, isAdminOpen, setIsAdminOpen } = useConfig();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState("");
  const [authError, setAuthError] = useState(false);

  const [localName, setLocalName] = useState(config.appName);
  const [localDesc, setLocalDesc] = useState(config.appDescription);
  const [localWelcome, setLocalWelcome] = useState(config.welcomeMessage);
  const [localPin, setLocalPin] = useState(config.adminPin);
  const [localLogo, setLocalLogo] = useState(config.logoUrl);
  const [localApiKey, setLocalApiKey] = useState(config.geminiApiKey || "");
  const [localPrompts, setLocalPrompts] = useState<string[]>(config.editorPrompts);
  const [localMockups, setLocalMockups] = useState<MockupPreset[]>(config.mockupPresets);
  const [newPrompt, setNewPrompt] = useState("");

  const [newMockupLabel, setNewMockupLabel] = useState("");
  const [newMockupPrompt, setNewMockupPrompt] = useState("");
  const [newMockupIcon, setNewMockupIcon] = useState("Box");
  const [editingMockupId, setEditingMockupId] = useState<string | null>(null);

  useEffect(() => {
    if (isAdminOpen) {
      setLocalName(config.appName);
      setLocalDesc(config.appDescription);
      setLocalWelcome(config.welcomeMessage || "Upload an image to start designing");
      setLocalPin(config.adminPin || "admin");
      setLocalLogo(config.logoUrl);
      setLocalApiKey(config.geminiApiKey || "");
      setLocalPrompts(config.editorPrompts);
      setLocalMockups(config.mockupPresets || []);
    } else {
       setPin("");
       setAuthError(false);
       setEditingMockupId(null);
       resetMockupForm();
    }
  }, [isAdminOpen, config]);

  const handleLogin = (e: React.FormEvent) => {
      e.preventDefault();
      if (pin === config.adminPin) {
          setIsAuthenticated(true);
          setAuthError(false);
      } else {
          setAuthError(true);
      }
  };

  const handleLock = () => {
    setIsAuthenticated(false);
    setPin("");
  };

  const handleSave = () => {
    updateConfig({
      appName: localName,
      appDescription: localDesc,
      welcomeMessage: localWelcome,
      adminPin: localPin,
      logoUrl: localLogo,
      geminiApiKey: localApiKey,
      editorPrompts: localPrompts,
      mockupPresets: localMockups
    });
    setIsAdminOpen(false);
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset all settings to default?")) {
      resetConfig();
      setIsAdminOpen(false);
    }
  };

  const addPrompt = () => {
    if (newPrompt.trim()) {
      setLocalPrompts([...localPrompts, newPrompt.trim()]);
      setNewPrompt("");
    }
  };

  const removePrompt = (index: number) => {
    setLocalPrompts(localPrompts.filter((_, i) => i !== index));
  };

  const resetMockupForm = () => {
    setNewMockupLabel("");
    setNewMockupPrompt("");
    setNewMockupIcon("Box");
    setEditingMockupId(null);
  };

  const handleMockupSubmit = () => {
      if (!newMockupLabel.trim() || !newMockupPrompt.trim()) return;
      if (editingMockupId) {
        setLocalMockups(prev => prev.map(m => 
            m.id === editingMockupId 
            ? { ...m, label: newMockupLabel, prompt: newMockupPrompt, icon: newMockupIcon } 
            : m
        ));
      } else {
        const newPreset: MockupPreset = {
            id: 'custom-' + Date.now(),
            label: newMockupLabel,
            icon: newMockupIcon,
            prompt: newMockupPrompt
        };
        setLocalMockups([...localMockups, newPreset]);
      }
      resetMockupForm();
  };

  const startEditMockup = (mockup: MockupPreset) => {
      setNewMockupLabel(mockup.label);
      setNewMockupPrompt(mockup.prompt);
      setNewMockupIcon(mockup.icon);
      setEditingMockupId(mockup.id);
  };

  const removeMockup = (id: string) => {
      if(window.confirm("Delete this mockup preset?")) {
          setLocalMockups(localMockups.filter(m => m.id !== id));
          if (editingMockupId === id) resetMockupForm();
      }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        if (file.size > 1024 * 1024) {
            alert("Please select an image smaller than 1MB.");
            return;
        }
        try {
            const url = await fileToPreviewUrl(file);
            setLocalLogo(url);
        } catch (err) { console.error("Failed to upload logo", err); }
    }
  };

  if (!isAdminOpen) return null;

  if (!isAuthenticated) {
      return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
             <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center animate-in fade-in zoom-in duration-200">
                 <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-6">
                     <Lock className="w-8 h-8 text-brand-600" />
                 </div>
                 <h2 className="text-2xl font-bold text-slate-800 mb-2">Admin Login</h2>
                 <p className="text-slate-500 mb-6">Please enter access PIN to continue.</p>
                 <form onSubmit={handleLogin} className="space-y-4">
                     <input 
                        type="password" 
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        className="w-full px-4 py-3 text-center text-2xl tracking-widest border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-shadow"
                        placeholder="••••"
                        autoFocus
                        autoComplete="off"
                     />
                     {authError && <p className="text-red-500 text-sm font-medium animate-pulse">Incorrect PIN. Try again.</p>}
                     <div className="flex gap-3 mt-6">
                         <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsAdminOpen(false)}>Cancel</Button>
                         <Button type="submit" className="flex-1">Login <Unlock className="w-4 h-4 ml-2" /></Button>
                     </div>
                 </form>
             </div>
        </div>
      );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200 text-left">
        
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 text-slate-800">
                <div className="p-2 bg-brand-100 rounded-lg">
                    <Settings className="w-5 h-5 text-brand-600" />
                </div>
                <h2 className="text-xl font-bold">System Admin Panel</h2>
             </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleLock} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"><LogOut className="w-5 h-5" /></button>
            <button onClick={() => setIsAdminOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-8">
                    <section className="space-y-6">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Configuration</h3>
                        
                        <div className="space-y-4">
                            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                                <label className="block text-sm font-bold text-blue-800 mb-2 flex items-center">
                                    <Key className="w-4 h-4 mr-2" /> Gemini API Key (Required)
                                </label>
                                <input 
                                    type="password" 
                                    value={localApiKey}
                                    onChange={(e) => setLocalApiKey(e.target.value)}
                                    className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="AIza..."
                                />
                                <p className="text-xs text-blue-600 mt-2">Get your key from AI Studio. Saved securely in local storage.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-slate-700">App Name</label>
                                    <input type="text" value={localName} onChange={(e) => setLocalName(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-slate-700">Subtitle</label>
                                    <input type="text" value={localDesc} onChange={(e) => setLocalDesc(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-slate-700">Welcome Message</label>
                                    <input type="text" value={localWelcome} onChange={(e) => setLocalWelcome(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-slate-700 flex items-center"><Lock className="w-3 h-3 mr-1.5" /> Change PIN</label>
                                    <input type="text" value={localPin} onChange={(e) => setLocalPin(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none bg-slate-50" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-slate-700">System Logo</label>
                                <div className="flex gap-4 items-start">
                                    <div className="w-16 h-16 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                                        {localLogo ? <img src={localLogo} alt="Preview" className="w-full h-full object-contain" /> : <ImageIcon className="w-6 h-6 text-slate-300" />}
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <label className="block w-full text-center px-3 py-2 bg-white border border-slate-300 rounded-lg shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer transition-all">
                                            <Upload className="w-4 h-4 inline mr-2" /> Choose Image
                                            <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                                        </label>
                                        {localLogo.startsWith('data:') && <button onClick={() => setLocalLogo('')} className="text-xs text-red-500 hover:underline w-full text-center">Remove Logo</button>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Prompt Shortcuts</h3>
                        <div className="flex gap-2">
                        <input type="text" value={newPrompt} onChange={(e) => setNewPrompt(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addPrompt()} placeholder="Add new..." className="flex-1 px-3 py-2 border border-slate-300 rounded-lg outline-none" />
                        <button onClick={addPrompt} className="bg-slate-100 hover:bg-brand-50 px-3 rounded-lg border border-slate-200"><Plus className="w-5 h-5" /></button>
                        </div>
                        <div className="flex flex-wrap gap-2 bg-slate-50 p-4 rounded-xl border border-slate-200 min-h-[100px] max-h-[200px] overflow-y-auto custom-scrollbar">
                        {localPrompts.map((prompt, idx) => (
                            <div key={idx} className="flex items-center bg-white border border-slate-200 rounded-full px-3 py-1.5 shadow-sm">
                            <span className="text-xs text-slate-700 mr-2">{prompt}</span>
                            <button onClick={() => removePrompt(idx)} className="text-slate-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                            </div>
                        ))}
                        </div>
                    </section>
                </div>

                <div className="space-y-6 h-full flex flex-col">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center justify-between">
                        <span>Mockup Presets</span>
                        <span className="text-xs normal-case bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{localMockups.length} presets</span>
                    </h3>

                    <div className={`p-4 rounded-xl border space-y-3 shadow-sm transition-all ${editingMockupId ? 'bg-amber-50 border-amber-200' : 'bg-brand-50 border-brand-100'}`}>
                        <h4 className={`text-xs font-bold uppercase flex items-center justify-between ${editingMockupId ? 'text-amber-700' : 'text-brand-800'}`}>
                            <span className="flex items-center">
                                {editingMockupId ? <Edit2 className="w-3 h-3 mr-1" /> : <Plus className="w-3 h-3 mr-1" />} 
                                {editingMockupId ? 'Edit Preset' : 'Add New Preset'}
                            </span>
                            {editingMockupId && <button onClick={resetMockupForm} className="text-amber-600 hover:text-amber-800 underline">Cancel</button>}
                        </h4>
                        <div className="grid grid-cols-3 gap-2">
                            <div className="col-span-2">
                                <input type="text" value={newMockupLabel} onChange={(e) => setNewMockupLabel(e.target.value)} placeholder="Preset Name" className="w-full px-3 py-2 text-sm border border-white/50 rounded-lg outline-none shadow-sm" />
                            </div>
                            <div className="col-span-1">
                                <select value={newMockupIcon} onChange={(e) => setNewMockupIcon(e.target.value)} className="w-full px-2 py-2 text-sm border border-white/50 rounded-lg outline-none bg-white shadow-sm">
                                    <option value="Box">Box</option>
                                    <option value="Shirt">Shirt</option>
                                    <option value="HardHat">Hat</option>
                                    <option value="ShoppingBag">Bag</option>
                                    <option value="Coffee">Mug</option>
                                    <option value="Monitor">Screen</option>
                                    <option value="Tag">Tag</option>
                                    <option value="Sparkles">Gen</option>
                                </select>
                            </div>
                        </div>
                        <textarea value={newMockupPrompt} onChange={(e) => setNewMockupPrompt(e.target.value)} placeholder="AI Prompt..." className="w-full px-3 py-2 text-sm border border-white/50 rounded-lg outline-none h-20 resize-none shadow-sm" />
                        <Button onClick={handleMockupSubmit} disabled={!newMockupLabel || !newMockupPrompt} className={`w-full py-1.5 text-xs ${editingMockupId ? 'bg-amber-600 hover:bg-amber-700' : ''}`}>
                            {editingMockupId ? 'Update Preset' : 'Save Preset'}
                        </Button>
                    </div>

                    <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl bg-slate-50 divide-y divide-slate-100 custom-scrollbar shadow-inner h-[300px]">
                        {localMockups.map((mockup) => (
                            <div key={mockup.id} className={`p-3 flex items-start justify-between group hover:bg-white transition-colors ${editingMockupId === mockup.id ? 'bg-white ring-2 ring-inset ring-amber-100' : ''}`}>
                                <div className="flex items-start gap-3 overflow-hidden">
                                    <div className="p-2 bg-white border border-slate-100 rounded-lg text-slate-400 group-hover:text-brand-500 group-hover:border-brand-100 transition-colors"><LayoutGrid className="w-4 h-4" /></div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2"><p className="text-sm font-medium text-slate-800 truncate">{mockup.label}</p></div>
                                        <p className="text-xs text-slate-500 truncate max-w-[180px]">{mockup.prompt}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => startEditMockup(mockup)} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg"><Edit2 className="w-3.5 h-3.5" /></button>
                                    <button onClick={() => removeMockup(mockup.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
            <button onClick={handleReset} className="flex items-center text-sm text-red-500 hover:text-red-700 px-3 py-2 rounded hover:bg-red-50 transition-colors"><RotateCcw className="w-4 h-4 mr-2" /> Reset to Defaults</button>
            <div className="flex items-center gap-3">
                <Button variant="secondary" onClick={() => setIsAdminOpen(false)}>Cancel</Button>
                <Button onClick={handleSave}><Save className="w-4 h-4 mr-2" /> Save Changes</Button>
            </div>
        </div>
      </div>
    </div>
  );
};