
import React, { useState, useRef } from 'react';
import { Header } from './components/Header';
import { ImageUpload } from './components/ImageUpload';
import { Button } from './components/Button';
import { AdminPanel } from './components/AdminPanel';
import { ConfigProvider, useConfig } from './contexts/ConfigContext';
import { generateImageEdit, ImageInput } from './services/geminiService';
import { fileToBase64, fileToPreviewUrl, getMimeType } from './utils';
import { GeneratedImage, MockupPreset } from './types';
import { Wand2, Download, Trash2, AlertCircle, Shirt, HardHat, ShoppingBag, Coffee, Monitor, Tag, Sparkles, ArrowRight, LayoutGrid, Box, Edit2, Check, X, Palette, Layers, ZoomIn, Sliders } from 'lucide-react';

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
  const [generatedHistory, setGeneratedHistory] = useState<GeneratedImage[]>([]);
  
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

  // Handlers
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
          case 'Shirt': return <Shirt className="w-6 h-6" />;
          case 'HardHat': return <HardHat className="w-6 h-6" />;
          case 'ShoppingBag': return <ShoppingBag className="w-6 h-6" />;
          case 'Coffee': return <Coffee className="w-6 h-6" />;
          case 'Monitor': return <Monitor className="w-6 h-6" />;
          case 'Tag': return <Tag className="w-6 h-6" />;
          case 'Sparkles': return <Sparkles className="w-6 h-6" />;
          case 'Box': return <Box className="w-6 h-6" />;
          default: return <Tag className="w-6 h-6" />;
      }
  };

  const displayPresets = [
      ...config.mockupPresets,
      { id: 'custom', label: 'Custom Object', icon: 'Sparkles', prompt: "" }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 selection:bg-brand-200 flex flex-col">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      <AdminPanel />

      <main className="max-w-7xl mx-auto px-4 py-8 md:px-8 flex-grow w-full">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column */}
          <div className="lg:col-span-5 space-y-6">
            
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-lg font-bold text-slate-900">
                        {activeTab === 'editor' ? 'Reference Images' : 'Icon Source'}
                    </h2>
                    <p className="text-sm text-slate-500">
                        {activeTab === 'editor' ? 'Upload style references (one or more)' : 'Upload the logo/icon to place on objects'}
                    </p>
                </div>
                {previewUrls.length > 0 && (
                  <span className="text-xs font-medium text-brand-600 bg-brand-50 px-2 py-1 rounded border border-brand-100">
                    {previewUrls.length} Selected
                  </span>
                )}
              </div>
              <ImageUpload 
                onImagesSelect={handleImagesSelect} 
                previewUrls={previewUrls} 
                onClear={handleClearImages}
                title={activeTab === 'editor' ? "Upload References" : "Upload Icon"}
              />
            </section>

            {activeTab === 'editor' && (
                <>
                <section className={`bg-white p-6 rounded-2xl shadow-sm border border-slate-100 transition-all duration-300 ${previewUrls.length === 0 ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
                <label htmlFor="prompt" className="block text-sm font-bold text-slate-800 mb-2">
                    Design Instruction
                </label>
                <div className="relative">
                    <textarea
                    id="prompt"
                    ref={promptInputRef}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe the new icon style you want to create based on these references..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none h-32 transition-all shadow-inner"
                    />
                    <div className="absolute bottom-3 right-3">
                        <span className={`text-xs ${prompt.length > 10 ? 'text-brand-600' : 'text-slate-400'}`}>
                            {prompt.length} chars
                        </span>
                    </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                    {config?.editorPrompts?.slice(0, 6).map((p) => (
                    <button
                        key={p}
                        onClick={() => setPrompt(p)}
                        className="text-xs bg-white hover:bg-brand-50 text-slate-600 hover:text-brand-700 px-3 py-1.5 rounded-full transition-colors border border-slate-200 hover:border-brand-200 shadow-sm"
                    >
                        {p}
                    </button>
                    ))}
                </div>
                </section>

                <div className={`space-y-4 pt-2 ${previewUrls.length === 0 ? 'opacity-50 pointer-events-none' : ''}`}>
                    {/* Variations Selector */}
                    <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-slate-200">
                        <span className="text-sm font-medium text-slate-700 flex items-center">
                            <Layers className="w-4 h-4 mr-2 text-brand-500" />
                            Variations:
                        </span>
                        <div className="flex bg-slate-100 p-1 rounded-lg">
                            {[1, 2, 3, 4].map(num => (
                                <button
                                    key={num}
                                    onClick={() => setVariationCount(num)}
                                    className={`w-8 h-8 text-xs font-bold rounded-md transition-all ${
                                        variationCount === num 
                                        ? 'bg-white text-brand-600 shadow-sm' 
                                        : 'text-slate-500 hover:text-slate-700'
                                    }`}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Stroke Weight Selector */}
                    <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-slate-200">
                        <span className="text-sm font-medium text-slate-700 flex items-center">
                            <Sliders className="w-4 h-4 mr-2 text-brand-500" />
                            Line Weight:
                        </span>
                        <div className="flex bg-slate-100 p-1 rounded-lg gap-1">
                            {(['Default', 'Thin', 'Medium', 'Thick', 'Ultra'] as const).map(weight => (
                                <button
                                    key={weight}
                                    onClick={() => setGenStroke(weight)}
                                    className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${
                                        genStroke === weight 
                                        ? 'bg-white text-brand-600 shadow-sm' 
                                        : 'text-slate-500 hover:text-slate-700'
                                    }`}
                                >
                                    {weight}
                                </button>
                            ))}
                        </div>
                    </div>

                    <Button 
                        onClick={handleEditorGenerate} 
                        isLoading={isLoading}
                        disabled={!prompt.trim() || currentFiles.length === 0}
                        className="w-full py-4 text-lg shadow-lg shadow-brand-500/20"
                    >
                        {!isLoading ? (
                        <>
                            <Wand2 className="w-5 h-5 mr-2" />
                            Generate {variationCount} Variations
                        </>
                        ) : (
                        "Creating New Icons..."
                        )}
                    </Button>
                </div>
                </>
            )}

            {activeTab === 'mockup' && (
                <section className={`bg-white p-6 rounded-2xl shadow-sm border border-slate-100 transition-all duration-300 ${previewUrls.length === 0 ? 'opacity-50 pointer-events-none' : ''}`}>
                    <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center">
                        <LayoutGrid className="w-4 h-4 mr-2 text-brand-500" />
                        Select Object to Embed
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
                                className={`flex flex-col items-center p-3 rounded-xl transition-all group disabled:opacity-50 disabled:cursor-not-allowed text-center border
                                    ${preset.id === 'custom' && customMockupInput ? 'bg-brand-50 border-brand-500 ring-2 ring-brand-200' : 'bg-slate-50 hover:bg-white border-slate-200 hover:border-brand-300 hover:shadow-md'}
                                `}
                            >
                                <div className={`p-2.5 rounded-full mb-2 transition-transform group-hover:scale-110 ${preset.id === 'custom' ? 'bg-brand-100 text-brand-600' : 'bg-white text-slate-500 shadow-sm'}`}>
                                    {getIconComponent(preset.icon)}
                                </div>
                                <span className="text-xs font-medium text-slate-700">{preset.label}</span>
                            </button>
                        ))}
                    </div>
                    
                    <div className={`mt-4 transition-all duration-300 ${customMockupInput ? 'bg-brand-50 p-4 rounded-xl border border-brand-100' : ''}`}>
                        <label className="block text-xs uppercase tracking-wider text-slate-500 font-bold mb-2">
                            {customMockupInput ? "Describe your custom object" : "Optional Adjustment"}
                        </label>
                        <div className="flex gap-2">
                             <input 
                                ref={customInputRef} 
                                type="text" 
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder={customMockupInput ? "E.g. A vintage leather backpack..." : "E.g. 'Make it vintage style'"}
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
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start text-red-600 text-sm">
                  <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                  <span>{error}</span>
                </div>
            )}
          </div>

          {/* Right Column */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center justify-between mb-3">
               <h2 className="text-lg font-bold text-slate-900">
                   {activeTab === 'editor' ? 'Generated Results' : 'Mockup Gallery'}
               </h2>
               <div className="flex items-center gap-3">
                   <span className="text-sm bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-medium border border-slate-200">
                       {generatedHistory.length}
                   </span>
               </div>
            </div>

            {generatedHistory.length === 0 && !isLoading && (
               <div className="h-[500px] rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 bg-slate-50">
                  <Wand2 className="w-12 h-12 mb-4 opacity-20 text-slate-600" />
                  <p className="text-lg font-medium text-slate-600">{config.welcomeMessage}</p>
                  <p className="text-sm opacity-80 max-w-xs text-center mt-2">
                    {activeTab === 'editor' 
                        ? "Upload images and describe the new icon style."
                        : "Select an icon and a product to generate a mockup."}
                  </p>
               </div>
            )}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="w-full p-6 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center mb-6">
                  <div className="flex flex-col items-center space-y-4">
                      <div className="relative">
                        <div className="w-10 h-10 border-4 border-slate-100 rounded-full"></div>
                        <div className="absolute top-0 left-0 w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                      <p className="text-slate-600 font-medium animate-pulse text-sm">
                          {activeTab === 'editor' ? `Designing Variations...` : 'Rendering Mockup...'}
                      </p>
                  </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" ref={resultRef}>
              {generatedHistory.map((item) => (
                <div 
                  key={item.id} 
                  className="group relative bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-brand-300 transition-all duration-300 flex flex-col animate-in fade-in zoom-in-95 duration-500"
                >
                  <div className="w-full bg-slate-50 relative overflow-hidden flex items-center justify-center aspect-square border-b border-slate-100">
                        <img 
                          src={item.imageUrl} 
                          alt="Generated Result" 
                          onClick={() => setViewedImage(item)}
                          className="w-full h-full object-contain p-2 transition-transform group-hover:scale-105 duration-500 cursor-zoom-in"
                        />
                        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-2">
                           <button 
                            onClick={() => handleDownload(item.imageUrl, item.id)}
                            className="p-2 bg-white text-slate-700 rounded-lg hover:text-brand-600 hover:shadow-md transition-all shadow-sm border border-slate-200"
                            title="Download"
                           >
                             <Download className="w-4 h-4" />
                           </button>
                        </div>
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                                onClick={() => setViewedImage(item)}
                                className="p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 backdrop-blur-sm"
                            >
                                <ZoomIn className="w-3 h-3" />
                            </button>
                        </div>
                  </div>

                  <div className="p-4 flex flex-col flex-grow bg-white">
                       <div className="flex-grow">
                         <div className="flex items-center justify-end mb-2">
                           <span className="text-[10px] text-slate-400">
                             {new Date(item.timestamp).toLocaleTimeString()}
                           </span>
                         </div>
                         
                         <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                            <span>Description</span>
                            {editingId !== item.id && (
                                <button 
                                    onClick={() => startEditingLabel(item)}
                                    className="text-brand-500 hover:text-brand-700 p-1 rounded hover:bg-brand-50"
                                    title="Edit Description"
                                >
                                    <Edit2 className="w-3 h-3" />
                                </button>
                            )}
                         </h3>

                         {editingId === item.id ? (
                             <div className="mt-1 space-y-2 animate-in fade-in duration-200">
                                 <textarea 
                                    value={tempLabel}
                                    onChange={(e) => setTempLabel(e.target.value)}
                                    className="w-full p-2 text-sm border border-brand-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none h-20 resize-none bg-brand-50"
                                    autoFocus
                                 />
                                 <div className="flex gap-2">
                                     <Button onClick={() => saveLabel(item.id)} className="!py-1 !px-2 text-xs flex-1">
                                         <Check className="w-3 h-3 mr-1" /> Save
                                     </Button>
                                     <Button onClick={cancelEditingLabel} variant="secondary" className="!py-1 !px-2 text-xs flex-1">
                                         <X className="w-3 h-3 mr-1" /> Cancel
                                     </Button>
                                 </div>
                             </div>
                         ) : (
                            <p className="text-slate-700 text-xs leading-relaxed line-clamp-3 font-medium whitespace-pre-wrap min-h-[3rem]">
                                {item.customLabel || item.prompt}
                            </p>
                         )}
                       </div>
                       
                       <div className="mt-4 space-y-2 pt-3 border-t border-slate-50">
                         <div className="flex gap-2">
                            <div className="flex-1 grid grid-cols-2 gap-2">
                                <Button 
                                    variant="outline" 
                                    className="text-xs !px-1"
                                    onClick={() => handleTransferImage(item, 'editor')}
                                    title="Edit/Refine this icon (AI)"
                                >
                                    <Palette className="w-3 h-3 mr-1" />
                                    Refine
                                </Button>
                                <Button 
                                    variant="outline" 
                                    className="text-xs !px-1"
                                    onClick={() => handleTransferImage(item, 'mockup')}
                                    title="Create Mockup"
                                >
                                    <LayoutGrid className="w-3 h-3 mr-1" />
                                    Mockup
                                </Button>
                            </div>
                         </div>

                         <button 
                           onClick={() => handleDelete(item.id)}
                           className="w-full flex items-center justify-center px-4 py-1 text-xs text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors mt-2"
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
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200"
                    onClick={() => setViewedImage(null)}
                >
                    <button 
                        onClick={() => setViewedImage(null)}
                        className="absolute top-4 right-4 p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors"
                    >
                        <X className="w-8 h-8" />
                    </button>
                    
                    <div 
                        className="relative max-w-5xl max-h-[90vh] w-full flex flex-col items-center"
                        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking content
                    >
                        <img 
                            src={viewedImage.imageUrl} 
                            alt="Full View" 
                            className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl bg-white"
                        />
                        <div className="mt-4 flex gap-4">
                             <Button 
                                onClick={() => handleDownload(viewedImage.imageUrl, viewedImage.id)}
                                className="bg-white text-black hover:bg-slate-200 !px-4"
                                title="Download"
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
      
      <footer className="py-6 text-center text-slate-400 text-xs border-t border-slate-200 bg-white mt-auto">
         <p>development by Sasinio Digital Marketing</p>
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
