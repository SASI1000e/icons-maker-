import React, { useCallback, useState } from 'react';
import { Upload, Image as ImageIcon, X, Plus } from 'lucide-react';

interface ImageUploadProps {
  onImagesSelect: (files: File[]) => void;
  previewUrls: string[];
  onClear: () => void;
  title?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ onImagesSelect, previewUrls, onClear, title = "Upload Reference Images" }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files).filter((file): file is File => file.type.startsWith('image/'));
      if (files.length > 0) {
        onImagesSelect(files);
      }
    }
  }, [onImagesSelect]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      onImagesSelect(files);
    }
  };

  if (previewUrls.length > 0) {
    return (
      <div className="relative w-full bg-slate-50 rounded-xl border border-slate-200 p-2">
        <div className="absolute top-2 right-2 z-10">
           <button 
            onClick={onClear}
            className="bg-white text-slate-500 hover:text-red-500 p-2 rounded-full shadow-sm border border-slate-200 transition-colors"
            title="Clear All"
           >
             <X className="w-4 h-4" />
           </button>
        </div>
        
        <div className={`grid ${previewUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-2 md:grid-cols-3'} gap-2`}>
            {previewUrls.map((url, idx) => (
                <div key={idx} className={`relative rounded-lg overflow-hidden border border-slate-100 bg-white shadow-sm ${previewUrls.length === 1 ? 'h-64 md:h-80' : 'h-32'}`}>
                    <img 
                        src={url} 
                        alt={`Ref ${idx}`} 
                        className="w-full h-full object-contain" 
                    />
                </div>
            ))}
             {previewUrls.length < 6 && (
                <label className="relative flex flex-col items-center justify-center h-32 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-white hover:border-brand-400 cursor-pointer transition-all group">
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Plus className="w-6 h-6 text-slate-400 group-hover:text-brand-500" />
                    <span className="text-xs text-slate-400 group-hover:text-brand-500 mt-1">Add Image</span>
                </label>
             )}
        </div>
        <div className="mt-2 px-2 flex justify-between items-center">
             <span className="text-xs text-slate-400">{previewUrls.length} images selected</span>
             <span className="text-xs text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
                Combined Style Reference
             </span>
        </div>
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative w-full h-64 md:h-80 rounded-xl border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center
        ${isDragging 
          ? 'border-brand-500 bg-brand-50' 
          : 'border-slate-300 bg-white hover:border-brand-400 hover:bg-slate-50'
        }
      `}
    >
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
      />
      <div className="flex flex-col items-center space-y-4 text-center p-6">
        <div className={`p-4 rounded-full ${isDragging ? 'bg-brand-100 text-brand-600' : 'bg-slate-100 text-slate-500'}`}>
          {isDragging ? <ImageIcon className="w-8 h-8" /> : <Upload className="w-8 h-8" />}
        </div>
        <div className="space-y-1">
          <p className="text-lg font-medium text-slate-700">
            {isDragging ? 'Drop images here' : title}
          </p>
          <p className="text-sm text-slate-500">
            Select multiple images to define the style
          </p>
        </div>
        <div className="text-xs text-slate-400">
          Supports PNG, JPG, WEBP
        </div>
      </div>
    </div>
  );
};