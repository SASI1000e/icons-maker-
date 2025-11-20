
import React, { useState, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { ImageUpload } from './components/ImageUpload';
import { Button } from './components/Button';
import { AdminPanel } from './components/AdminPanel';
import { ConfigProvider, useConfig } from './contexts/ConfigContext';
import { generateImageEdit, ImageInput } from './services/geminiService';
import { fileToBase64, fileToPreviewUrl, getMimeType } from './utils';
import { GeneratedImage, MockupPreset } from './types';
import { Wand2, Download, Trash2, AlertCircle, Shirt, HardHat, ShoppingBag, Coffee, Monitor, Tag, Sparkles, ArrowRight, LayoutGrid, Box, Edit2, Check, X, Palette, Layers, ZoomIn, Sliders, History } from 'lucide-react';

// Separate component to use hook inside provider
const AppContent: React.FC = () => {
  const { config } = useConfig();
  
  // State
  const [activeTab, setActiveTab] = useState<'editor' | 'mockup'>('editor');
  
  // Multi-file support
  const [currentFiles, setCurrentFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const [prompt, setPrompt] = useState('');
  const [customMockupInput, setCustomMockupInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // History State with Persistence
  const [generatedHistory, setGeneratedHistory] = useState<GeneratedImage[]>([]);
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);
  
  // Variation State
  const [variationCount, setVariationCount] = useState<number>(3);
  
  // Generation Stroke Weight State (Pre-generation setting)
  const [genStroke, setGenStroke] = useState<'Default' | 'Thin' | 'Medium' | 'Thick' | 'Ultra'>('Default');
  
  // Editing Label State (Description under image)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempLabel, setTempLabel] = useState("");

  // Lightbox State
  const [viewedImage, setViewedImage] = useState<GeneratedImage | null>(null);

  // Refs
  const resultRef = useRef<HTMLDivElement>(null);
  const promptInputRef = useRef<HTMLTextAreaElement>(null);
  const customInputRef = useRef<HTMLInputElement>(null);

  // --- Persistence Logic ---
  useEffect(() => {
    // Load history on mount
    const saved = localStorage.getItem('iconic_history');
    if (saved) {
      try {
        setGeneratedHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load history");
      }
    }
    setIsHistoryLoaded(true);
  }, []);

  useEffect(() => {
    // Save history whenever it changes (only after initial load)
    if (isHistoryLoaded) {
      localStorage.setItem('iconic_history', JSON.stringify(generatedHistory));
    }
  }, [generatedHistory, isHistoryLoaded]);

  // --- Handlers ---

  const handleImagesSelect = async (files: File[]) => {
    try {
      const newFiles = [...currentFiles, ...files];
      const newUrls = await Promise.all(files.map(f => fileToPreviewUrl(f)));
      
      setCurrentFiles(newFiles);
      setPreviewUrls(prev => [...prev, ...newUrls]);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load image previews.");
    }
  };

  const handleClearImages = () => {
    setCurrentFiles([]);
    setPreviewUrls([]);
    setPrompt('');
    setError(null);
    setCustomMockupInput(false);
  };

  const performGeneration = async (basePrompt: string, sourceFiles: File[], count: number = 1) => {
    setIsLoading(true);
    setError(null);

    try {
      // Process all images
      const processedImages: ImageInput[] = await Promise.all(
          sourceFiles.map(async (file) => ({
              base64: await fileToBase64(file),
              mimeType: getMimeType(file)
          }))
      );

      let successCount = 0;

      // Sequential execution to avoid Rate Limiting (429 Errors)
      for (let i = 0; i < count; i++) {
          const variationPrompt = count > 1 ? `${basePrompt} (Variation ${i + 1})` : basePrompt;
          
          try {
              const resultUrl = await generateImageEdit(processedImages, variationPrompt);
              
              const newImage: GeneratedImage = {
                id: Date.now().toString() + Math.random().toString(36).substring(2),
                imageUrl: resultUrl,
                prompt: count > 1 ? `${prompt} (Var ${i + 1})` : prompt,
                customLabel: count > 1 ? `${prompt} (Var ${i + 1})` : prompt,
                timestamp: Date.now()
              };

              // Add one by one to history so user sees progress
              setGeneratedHistory(prev => [newImage, ...prev]);
              successCount++;
              
              // Scroll on first success
              if (successCount === 1) {
                setTimeout(() => {
                    resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
              }

          } catch (err: any) {
              console.error(`Variation ${i+1} failed:`, err);
              // If it's a quota error, stop trying further variations
              if (err.message && (err.message.includes('Quota') || err.message.includes('busy'))) {
                  setError(`Stopped after ${i} variations due to API usage limits.`);
                  break; 
              }
          }
      }

      if (successCount === 0) {
          throw new Error("Failed to generate image. Please try again.");
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred during generation.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditorGenerate = async () => {
    if (currentFiles.length === 0 || !prompt.trim()) return;
    
    let strokeInstruction = "";
    switch(genStroke) {
        case 'Thin': strokeInstruction = " Use delicate, thin stroke lines (fine weight)."; break;
        case 'Medium': strokeInstruction = " Use standard medium stroke lines."; break;
        case 'Thick': strokeInstruction = " Use bold, thick stroke lines."; break;
        case 'Ultra': strokeInstruction = " Use very heavy, ultra-thick stroke lines."; break;
        default: strokeInstruction = "";
    }

    const strictPrompt = `Create a completely new high-quality icon design based on the visual style and concept of the provided reference image(s). ${prompt}.${strokeInstruction} IMPORTANT: The output must be a fresh, standalone icon on a clean background. Do not just edit the original image; create a new asset from scratch based on the design language of the inputs.`;
    
    await performGeneration(strictPrompt, currentFiles, variationCount);
  };

  const handleMockupGenerate = async (preset: MockupPreset) => {
    if (currentFiles.length === 0) {
        setError("Please select a source icon first.");
        return;
    }

    // Strict instruction to preserve the icon exactly as is
    const strictLogoInstruction = "Use the visual content of the input image EXACTLY as the logo/design on the object. Do not alter the design, text, or shapes of the input logo. Maintain the integrity of the provided icon. Only adjust perspective and lighting to match the scene.";

    let finalPrompt = "";
    if (preset.id === 'custom') {
        if (!prompt.trim()) {
            setCustomMockupInput(true);
            customInputRef.current?.focus();
            return;
        }
        finalPrompt = `A high-quality realistic photo of ${prompt} featuring the provided logo applied to it. ${strictLogoInstruction} Professional product photography, photorealistic, best quality.`;
    } else {
        finalPrompt = prompt.trim() 
            ? `${preset.prompt} ${strictLogoInstruction} Additional details: ${prompt}` 
            : `${preset.prompt} ${strictLogoInstruction}`;
    }
    await performGeneration(finalPrompt, currentFiles, 1);
  };

  const handleTransferImage = async (genImage: GeneratedImage, targetTab: 'editor' | 'mockup') => {
    try {
      const res = await fetch(genImage.imageUrl);
      const blob = await res.blob();
      const file = new File([blob], `iconic-${genImage.id}.png`, { type: "image/png" });
      
      const url = await fileToPreviewUrl(file);
      setCurrentFiles([file]);
      setPreviewUrls([url]);
      
      setActiveTab(targetTab);
      if (targetTab === 'editor') {
          setPrompt('');
          setTimeout(() => promptInputRef.current?.focus(), 100);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      setError("Could not load generated image.");
    }
  };

  const handleDownload = (url: string, id: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `iconic-studio-${id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDelete = (id: string) => {
      setGeneratedHistory(prev => prev.filter(img => img.id !== id));
  };

  // Text Editing (Label Description)
  const startEditingLabel = (item: GeneratedImage) => {
      setTempLabel(item.customLabel || item.prompt);
      setEditingId(item.id);
  };

  const cancelEditingLabel = () => {
      setEditingId(null);
      setTempLabel("");
  };

  const saveLabel = (id: string) => {
      setGeneratedHistory(prev => prev.map(img => 
        img.id === id ? { ...img, customLabel: tempLabel } : img
      ));
      setEditingId(null);
  };

  const getIconComponent = (iconName: string) => {
      switch(iconName) {
          case 'Shirt': return <Shirt className="w-5 h-5" />;
          case 'HardHat': return <HardHat className="w-5 h-5" />;
          case 'ShoppingBag': return <ShoppingBag className="w-5 h-5" />;
          case 'Coffee': return <Coffee className="w-5 h-5" />;
          case 'Monitor': return <Monitor className="w-5 h-5" />;
          case 'Tag': return <Tag className="w-5 h-5" />;
          case 'Sparkles': return <Sparkles className="w-5 h-5" />;
          case 'Box': return <Box className="w-5 h-5" />;
          default: return <Tag className="w-5 h-5" />;
      }
  };

  const displayPresets = [
      ...config.mockupPresets,
      { id: 'custom', label: 'Custom Object', icon: 'Sparkles', prompt: "" }
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-800 selection:bg-brand-200 flex flex-col font-sans">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      <AdminPanel />

      <main className="max-w-[1440px] mx-auto px-4 py-8 md:px-8 flex-grow w-full">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Input / Controls */}
          <div className="lg:col-span-5 space-y-6 sticky top-24">
            
            <section className="bg-white/70 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-white/50 ring-1 ring-slate-200/50">
              <div className="flex justify-between items-center mb-5">
                <div>
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                        {activeTab === 'editor' ? 'Reference Images' : 'Source Icon'}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                        {activeTab === 'editor' ? 'Upload images to define the style' : 'Upload the logo to place on objects'}
                    </p>
                </div>
                {previewUrls.length > 0 && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2 py-1 rounded-full border border-brand-100">
                    {previewUrls.length} Active
                  </span>
                )}
              </div>
              <ImageUpload 
                onImagesSelect={handleImagesSelect} 
                previewUrls={previewUrls} 
                onClear={handleClearImages}
                title={activeTab === 'editor' ? "Upload Styles" : "Upload Logo"}
              />
            </section>

            {activeTab === 'editor' && (
                <>
                <section className={`bg-white/70 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-white/50 ring-1 ring-slate-200/50 transition-all duration-300 ${previewUrls.length === 0 ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
                    <div className="flex items-center justify-between mb-3">
                        <label htmlFor="prompt" className="block text-sm font-bold text-slate-800">
                            Creative Instruction
                        </label>
                        <div className="flex gap-1">
                            {(['Default', 'Thin', 'Thick'] as const).map(weight => (
                                <button
                                    key={weight}
                                    onClick={() => setGenStroke(weight as any)}
                                    className={`px-2 py-0.5 text-[10px] font-medium rounded-md transition-all border ${
                                        genStroke === weight 
                                        ? 'bg-brand-50 text-brand-600 border-brand-200' 
                                        : 'bg-slate-50 text-slate-400 border-transparent hover:bg-slate-100'
                                    }`}
                                >
                                    {weight}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="relative group">
                        <textarea
                        id="prompt"
                        ref={promptInputRef}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Describe the icon you want to create..."
                        className="w-full bg-white border-slate-200 rounded-xl p-4 text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 resize-none h-32 transition-all shadow-sm group-hover:border-brand-300"
                        />
                        <div className="absolute bottom-3 right-3 pointer-events-none">
                            <span className={`text-[10px] font-medium ${prompt.length > 10 ? 'text-brand-600' : 'text-slate-300'}`}>
                                {prompt.length} chars
                            </span>
                        </div>
                    </div>

                    <div className="mt-4">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Quick Ideas</p>
                        <div className="flex flex-wrap gap-2">
                            {config?.editorPrompts?.slice(0, 6).map((p) => (
                            <button
                                key={p}
                                onClick={() => setPrompt(p)}
                                className="text-[11px] bg-slate-50 hover:bg-white text-slate-600 hover:text-brand-600 px-3 py-1.5 rounded-lg transition-all border border-slate-200 hover:border-brand-200 hover:shadow-sm"
                            >
                                {p}
                            </button>
                            ))}
                        </div>
                    </div>
                </section>

                <div className={`space-y-4 pt-2 ${previewUrls.length === 0 ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="flex items-center gap-4">
                         <div className="flex-1 bg-white px-4 py-3 rounded-xl border border-slate-200 flex justify-between items-center shadow-sm">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Count</span>
                            <div className="flex bg-slate-100 p-1 rounded-lg">
                                {[1, 2, 3].map(num => (
                                    <button
                                        key={num}
                                        onClick={() => setVariationCount(num)}
                                        className={`w-7 h-7 text-xs font-bold rounded-md transition-all ${
                                            variationCount === num 
                                            ? 'bg-white text-brand-600 shadow-sm ring-1 ring-slate-200' 
                                            : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                    >
                                        {num}
                                    </button>
                                ))}
                            </div>
                         </div>
                         
                         <Button 
                            onClick={handleEditorGenerate} 
                            isLoading={isLoading}
                            disabled={!prompt.trim() || currentFiles.length === 0}
                            className="flex-[2] py-3.5 text-base shadow-lg shadow-brand-500/20 hover:shadow-brand-500/30 hover:-translate-y-0.5 transition-transform"
                        >
                            {!isLoading ? (
                            <>
                                <Wand2 className="w-5 h-5 mr-2" />
                                Generate Design
                            </>
                            ) : (
                            "Processing..."
                            )}
                        </Button>
                    </div>
                </div>
                </>
            )}

            {activeTab === 'mockup' && (
                <section className={`bg-white/70 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-white/50 ring-1 ring-slate-200/50 transition-all duration-300 ${previewUrls.length === 0 ? 'opacity-50 pointer-events-none' : ''}`}>
                    <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center">
                        <LayoutGrid className="w-4 h-4 mr-2 text-brand-500" />
                        Choose Product Mockup
                    </h3>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                        {displayPresets.map((preset) => (
                            <button
                                key={preset.id}
                                onClick={() => {
                                    if (preset.id === 'custom') {
                                        setCustomMockupInput(true);
                                        setTimeout(() => customInputRef.current?.focus(), 100);
                                    } else {
                                        setCustomMockupInput(false);
                                        handleMockupGenerate(preset);
                                    }
                                }}
                                disabled={isLoading}
                                className={`flex flex-col items-center p-3 rounded-xl transition-all group disabled:opacity-50 disabled:cursor-not-allowed text-center border relative
                                    ${preset.id === 'custom' && customMockupInput 
                                        ? 'bg-brand-50 border-brand-500 ring-1 ring-brand-500' 
                                        : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-brand-300 hover:shadow-md'}
                                `}
                            >
                                <div className={`p-2.5 rounded-full mb-2 transition-transform group-hover:scale-110 duration-300 ${preset.id === 'custom' ? 'bg-brand-100 text-brand-600' : 'bg-slate-50 text-slate-500 shadow-sm'}`}>
                                    {getIconComponent(preset.icon)}
                                </div>
                                <span className="text-xs font-medium text-slate-700">{preset.label}</span>
                            </button>
                        ))}
                    </div>
                    
                    <div className={`mt-4 transition-all duration-300 ${customMockupInput ? 'bg-brand-50 p-4 rounded-xl border border-brand-100' : ''}`}>
                        <label className="block text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-2">
                            {customMockupInput ? "Describe your custom object" : "Refine Mockup (Optional)"}
                        </label>
                        <div className="flex gap-2">
                             <input 
                                ref={customInputRef} 
                                type="text" 
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder={customMockupInput ? "E.g. A vintage leather backpack..." : "E.g. 'Dark cinematic lighting'"}
                                className="flex-1 bg-white border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none shadow-sm"
                                onKeyDown={(e) => {
                                    if(e.key === 'Enter' && customMockupInput && prompt) {
                                        handleMockupGenerate(displayPresets.find(p => p.id === 'custom')!);
                                    }
                                }}
                            />
                            {customMockupInput && (
                                <Button 
                                    onClick={() => handleMockupGenerate(displayPresets.find(p => p.id === 'custom')!)}
                                    disabled={!prompt.trim()}
                                    className="!px-3"
                                >
                                    <ArrowRight className="w-4 h-4" />
                                </Button>
                            )}
                        </div>
                    </div>

                    {isLoading && (
                         <div className="mt-4 p-4 bg-brand-50 border border-brand-100 rounded-xl flex items-center justify-center text-brand-700 animate-pulse">
                             <Wand2 className="w-5 h-5 mr-2 animate-spin" />
                             Generating Mockup...
                         </div>
                    )}
                </section>
            )}

            {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start text-red-600 text-sm animate-in fade-in slide-in-from-top-2">
                  <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
            )}
          </div>

          {/* Right Column: Gallery */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center justify-between mb-3 px-1">
               <div className="flex items-center gap-3">
                   <h2 className="text-lg font-bold text-slate-900">
                       {activeTab === 'editor' ? 'Recent Designs' : 'Mockup Gallery'}
                   </h2>
                   <span className="text-xs bg-white text-slate-500 px-2.5 py-0.5 rounded-full font-bold border border-slate-200 shadow-sm">
                       {generatedHistory.length}
                   </span>
               </div>
               {generatedHistory.length > 0 && (
                   <p className="text-xs text-slate-400 flex items-center">
                       <History className="w-3 h-3 mr-1" />
                       Auto-saved locally
                   </p>
               )}
            </div>

            {generatedHistory.length === 0 && !isLoading && (
               <div className="h-[500px] rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
                  <div className="p-6 bg-white rounded-full shadow-sm mb-4">
                    <Wand2 className="w-8 h-8 text-brand-300" />
                  </div>
                  <p className="text-lg font-bold text-slate-700">{config.welcomeMessage}</p>
                  <p className="text-sm opacity-60 max-w-xs text-center mt-2">
                    {activeTab === 'editor' 
                        ? "Your generated designs will appear here and persist automatically."
                        : "Select a product on the left to create realistic mockups."}
                  </p>
               </div>
            )}

            {/* Loading Skeleton */}
            {isLoading && (
              <div className="w-full p-8 rounded-3xl bg-white shadow-sm border border-slate-100 flex items-center justify-center mb-6 ring-1 ring-slate-100">
                  <div className="flex flex-col items-center space-y-4">
                      <div className="relative">
                        <div className="w-12 h-12 border-4 border-slate-100 rounded-full"></div>
                        <div className="absolute top-0 left-0 w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                      <p className="text-slate-600 font-medium animate-pulse text-sm tracking-wide">
                          {activeTab === 'editor' ? `Crafting your designs...` : 'Rendering realistic scene...'}
                      </p>
                  </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" ref={resultRef}>
              {generatedHistory.map((item) => (
                <div 
                  key={item.id} 
                  className="group relative bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-brand-200 transition-all duration-300 flex flex-col animate-in fade-in zoom-in-95 duration-500"
                >
                  <div className="w-full bg-slate-50 relative overflow-hidden flex items-center justify-center aspect-square border-b border-slate-100 group-hover:bg-white transition-colors">
                        <img 
                          src={item.imageUrl} 
                          alt="Generated Result" 
                          onClick={() => setViewedImage(item)}
                          className="w-full h-full object-contain p-4 transition-transform group-hover:scale-105 duration-500 cursor-zoom-in drop-shadow-sm"
                        />
                        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 flex items-center space-x-2">
                           <button 
                            onClick={(e) => { e.stopPropagation(); handleDownload(item.imageUrl, item.id); }}
                            className="p-2 bg-white text-slate-700 rounded-xl hover:text-brand-600 hover:shadow-md transition-all shadow-sm border border-slate-200"
                            title="Download"
                           >
                             <Download className="w-4 h-4" />
                           </button>
                        </div>
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all translate-y--2 group-hover:translate-y-0">
                            <button 
                                onClick={(e) => { e.stopPropagation(); setViewedImage(item); }}
                                className="p-2 bg-black/50 text-white rounded-full hover:bg-black/70 backdrop-blur-sm"
                            >
                                <ZoomIn className="w-3 h-3" />
                            </button>
                        </div>
                  </div>

                  <div className="p-4 flex flex-col flex-grow bg-white">
                       <div className="flex-grow">
                         <div className="flex items-center justify-end mb-2">
                           <span className="text-[10px] font-medium text-slate-300 uppercase tracking-wide">
                             {new Date(item.timestamp).toLocaleDateString()}
                           </span>
                         </div>
                         
                         <div className="flex items-start justify-between gap-2 group/label mb-2">
                             {editingId === item.id ? (
                                 <div className="flex-grow animate-in fade-in duration-200 w-full">
                                     <textarea 
                                        value={tempLabel}
                                        onChange={(e) => setTempLabel(e.target.value)}
                                        className="w-full p-2 text-sm border border-brand-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none h-20 resize-none bg-brand-50"
                                        autoFocus
                                     />
                                     <div className="flex gap-2 mt-2">
                                         <Button onClick={() => saveLabel(item.id)} className="!py-1 !px-2 text-xs flex-1 h-8">
                                             <Check className="w-3 h-3 mr-1" /> Save
                                         </Button>
                                         <Button onClick={cancelEditingLabel} variant="secondary" className="!py-1 !px-2 text-xs flex-1 h-8">
                                             <X className="w-3 h-3 mr-1" /> Cancel
                                         </Button>
                                     </div>
                                 </div>
                             ) : (
                                <>
                                    <p className="text-slate-700 text-xs leading-relaxed line-clamp-3 font-medium whitespace-pre-wrap min-h-[2.5rem]">
                                        {item.customLabel || item.prompt}
                                    </p>
                                    <button 
                                        onClick={() => startEditingLabel(item)}
                                        className="text-slate-300 hover:text-brand-500 opacity-0 group-hover/label:opacity-100 transition-opacity"
                                        title="Edit Description"
                                    >
                                        <Edit2 className="w-3 h-3" />
                                    </button>
                                </>
                             )}
                         </div>
                       </div>
                       
                       <div className="mt-4 pt-3 border-t border-slate-50">
                         <div className="grid grid-cols-2 gap-2 mb-2">
                             <button 
                                className="flex items-center justify-center px-2 py-2 rounded-lg text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200 hover:bg-white hover:border-brand-300 hover:text-brand-600 transition-all"
                                onClick={() => handleTransferImage(item, 'editor')}
                                title="Refine Icon"
                             >
                                 <Palette className="w-3 h-3 mr-1.5" />
                                 Refine
                             </button>
                             <button 
                                className="flex items-center justify-center px-2 py-2 rounded-lg text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200 hover:bg-white hover:border-brand-300 hover:text-brand-600 transition-all"
                                onClick={() => handleTransferImage(item, 'mockup')}
                                title="Create Mockup"
                             >
                                 <LayoutGrid className="w-3 h-3 mr-1.5" />
                                 Mockup
                             </button>
                         </div>

                         <button 
                           onClick={() => handleDelete(item.id)}
                           className="w-full flex items-center justify-center px-4 py-1.5 text-[10px] uppercase font-bold tracking-wider text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                         >
                           <Trash2 className="w-3 h-3 mr-1" />
                           Remove
                         </button>
                       </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Lightbox Modal */}
            {viewedImage && (
                <div 
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200"
                    onClick={() => setViewedImage(null)}
                >
                    <button 
                        onClick={() => setViewedImage(null)}
                        className="absolute top-6 right-6 p-3 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors z-50"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    
                    <div 
                        className="relative max-w-6xl max-h-[90vh] w-full flex flex-col items-center"
                        onClick={(e) => e.stopPropagation()} 
                    >
                        <img 
                            src={viewedImage.imageUrl} 
                            alt="Full View" 
                            className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl bg-white"
                        />
                        <div className="mt-6 flex gap-4">
                             <Button 
                                onClick={() => handleDownload(viewedImage.imageUrl, viewedImage.id)}
                                className="bg-white text-black hover:bg-slate-200 !px-6 !py-3 !rounded-full shadow-xl"
                                title="Download High-Res"
                             >
                                 <Download className="w-6 h-6" />
                             </Button>
                        </div>
                    </div>
                </div>
            )}

          </div>
        </div>
      </main>
      
      <footer className="py-8 text-center text-slate-400 text-xs border-t border-slate-200 bg-white mt-auto">
         <p className="font-medium opacity-80">development by Sasinio Digital Marketing</p>
      </footer>
    </div>
  );
};

function App() {
  return (
    <ConfigProvider>
        <AppContent />
    </ConfigProvider>
  );
}

export default App;
