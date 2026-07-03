import React, { useState } from 'react';
import { useListingWizard } from '@/context/ListingWizardContext';
import { Button } from '@/components/ui/Button';
import { storageService } from '@/services/storageService';
import { UploadCloud, X } from 'lucide-react';

export const Step4Images: React.FC = () => {
  const { formData, updateFormData, nextStep, prevStep } = useListingWizard();
  const [images, setImages] = useState<string[]>(formData.imageUrls || []);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    
    setIsUploading(true);
    const files = Array.from(e.target.files);
    
    try {
      const uploadPromises = files.map(file => storageService.uploadImage(file, 'listings'));
      const responses = await Promise.all(uploadPromises);
      
      const newUrls = responses.map(res => res.data);
      setImages(prev => [...prev, ...newUrls]);
    } catch (error) {
      console.error('Failed to upload images', error);
      alert('Failed to upload images. Check console for details.');
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const setAsCover = (index: number) => {
    // Move to front
    setImages(prev => {
      const newImages = [...prev];
      const [item] = newImages.splice(index, 1);
      newImages.unshift(item);
      return newImages;
    });
  };

  const onSubmit = () => {
    updateFormData({ 
      imageUrls: images,
      coverImageUrl: images.length > 0 ? images[0] : undefined
    });
    nextStep();
  };

  return (
    <div className="space-y-6">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:bg-gray-50 transition-colors">
        <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
        <div className="mt-4 flex text-sm leading-6 text-gray-600 justify-center">
          <label
            htmlFor="file-upload"
            className="relative cursor-pointer rounded-md bg-white font-semibold text-blue-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2 hover:text-blue-500"
          >
            <span>Upload files</span>
            <input id="file-upload" name="file-upload" type="file" multiple className="sr-only" onChange={handleFileChange} accept="image/*" disabled={isUploading} />
          </label>
          <p className="pl-1">or drag and drop</p>
        </div>
        <p className="text-xs leading-5 text-gray-600">PNG, JPG, GIF up to 10MB</p>
        {isUploading && <p className="text-sm text-blue-600 mt-2 font-medium">Uploading images...</p>}
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {images.map((url, idx) => (
            <div key={idx} className="relative group rounded-lg overflow-hidden border border-gray-200">
              <img src={url} alt={`Listing upload ${idx}`} className="h-24 w-full object-cover" />
              <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                <button 
                  onClick={() => removeImage(idx)}
                  className="self-end p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
                {idx !== 0 && (
                  <button 
                    onClick={() => setAsCover(idx)}
                    className="text-xs bg-white text-gray-900 font-medium py-1 px-2 rounded w-full"
                  >
                    Set as Cover
                  </button>
                )}
              </div>
              {idx === 0 && (
                <div className="absolute top-0 left-0 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-br-lg">
                  COVER
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={prevStep}>Previous</Button>
        <Button type="button" onClick={onSubmit} disabled={isUploading}>Next Step</Button>
      </div>
    </div>
  );
};
