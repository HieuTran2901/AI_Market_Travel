import React, { useState } from 'react';
import { useListingWizard } from '@/context/ListingWizardContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { storageService } from '@/services/storageService';
import { GripVertical, ImagePlus, Sparkles, Star, UploadCloud, X } from 'lucide-react';
import type { ListingImageCategory, ListingImageDraft } from '@/types/listing';

const imageCategories: ListingImageCategory[] = ['Exterior', 'Room', 'Bathroom', 'Pool', 'Dining', 'View', 'Amenity', 'Other'];
const amenityNames = ['Swimming pool', 'Spa access', 'Fitness center', 'Free Wi-Fi', 'Parking', 'Dining & bar'];
const amenityGroups = ['Popular', 'Room', 'Bathroom', 'Food & Drink', 'Wellness', 'Transportation', 'Accessibility', 'Safety', 'Business', 'Family'];
const amenityKeyMap: Record<string, string> = {
  'Swimming pool': 'hasPool',
  'Spa access': 'hasSpa',
  'Fitness center': 'hasGym',
  'Free Wi-Fi': 'hasFreeWifi',
  Parking: 'hasParking',
  'Dining & bar': 'hasRestaurant',
};

type AmenityDraft = {
  name: string;
  status: 'available' | 'included' | 'paid' | 'unavailable';
  description: string;
  fee?: string;
  imageUrl?: string;
  displayOrder: number;
};

const defaultAmenities = (details: Record<string, any>): AmenityDraft[] => amenityNames.map((name, index) => {
  const booleanKey = amenityKeyMap[name];
  const enabled = details[booleanKey] === true || (name === 'Free Wi-Fi' && details[booleanKey] !== false);
  const existing = Array.isArray(details.amenities) ? details.amenities.find((item: AmenityDraft) => item.name === name) : undefined;
  return existing || {
    name,
    status: enabled ? (name === 'Free Wi-Fi' ? 'included' : 'available') : 'unavailable',
    description: name === 'Free Wi-Fi'
      ? 'Stay connected throughout your visit.'
      : name === 'Parking'
        ? 'Parking support for guests.'
        : `${name} is available based on current listing information.`,
    fee: '',
    imageUrl: '',
    displayOrder: index,
  };
});

export const Step4Images: React.FC = () => {
  const { formData, updateFormData, nextStep, prevStep } = useListingWizard();
  const initialImages = Array.isArray(formData.details?.imageMetadata) && formData.details?.imageMetadata.length
    ? formData.details.imageMetadata as ListingImageDraft[]
    : (formData.imageUrls || []).map((url) => ({ url, category: 'Other' as ListingImageCategory, caption: '' }));
  const [images, setImages] = useState<ListingImageDraft[]>(initialImages);
  const [amenities, setAmenities] = useState<AmenityDraft[]>(defaultAmenities(formData.details || {}));
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    
    setIsUploading(true);
    const files = Array.from(e.target.files);
    
    try {
      const uploadPromises = files.map(file => storageService.uploadImage(file, 'listings'));
      const responses = await Promise.all(uploadPromises);
      const newImages = responses.map(res => ({ url: res.data, category: 'Other' as ListingImageCategory, caption: '' }));
      setImages(prev => [...prev, ...newImages]);
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
    setImages(prev => {
      const newImages = [...prev];
      const [item] = newImages.splice(index, 1);
      newImages.unshift(item);
      return newImages;
    });
  };

  const updateImage = (index: number, patch: Partial<ListingImageDraft>) => {
    setImages(prev => prev.map((image, idx) => idx === index ? { ...image, ...patch } : image));
  };

  const updateAmenity = (index: number, patch: Partial<AmenityDraft>) => {
    setAmenities(prev => prev.map((amenity, idx) => idx === index ? { ...amenity, ...patch } : amenity));
  };

  const onSubmit = () => {
    const imageUrls = images.map((image) => image.url);
    const enabledAmenities = amenities
      .map((amenity, index) => ({ ...amenity, displayOrder: index }))
      .sort((a, b) => a.displayOrder - b.displayOrder);
    const amenityFlags = enabledAmenities.reduce<Record<string, boolean>>((acc, amenity) => {
      const key = amenityKeyMap[amenity.name];
      if (key) acc[key] = amenity.status !== 'unavailable';
      return acc;
    }, {});

    updateFormData({ 
      imageUrls,
      coverImageUrl: imageUrls.length > 0 ? imageUrls[0] : undefined,
      details: {
        ...(formData.details || {}),
        ...amenityFlags,
        amenities: enabledAmenities,
        imageMetadata: images,
      }
    });
    nextStep();
  };

  return (
    <div className="space-y-6">
      <div className="wizard-section-header">
        <div className="flex min-w-0 items-start gap-4">
          <span className="wizard-icon">
            <ImagePlus className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <h2 className="text-2xl font-black tracking-tight text-slate-950">Images & Amenities</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">Build the visual gallery and amenity cards travelers will scan first.</p>
          </div>
        </div>
      </div>

      <section className="wizard-section">
        <div className="mb-5 flex min-w-0 items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 ring-1 ring-blue-200">
            <UploadCloud className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h3 className="text-base font-black text-slate-950">Image manager</h3>
            <p className="mt-1 text-sm font-medium text-slate-500">Upload multiple images, select a cover, add captions, and categorize each photo.</p>
          </div>
        </div>

        <div className="rounded-[22px] border-2 border-dashed border-blue-200 bg-white/80 p-8 text-center shadow-sm transition hover:border-blue-300 hover:bg-blue-50/30">
          <UploadCloud className="mx-auto h-12 w-12 text-blue-500" />
          <div className="mt-4 flex justify-center text-sm leading-6 text-slate-600">
            <label
              htmlFor="file-upload"
              className="relative cursor-pointer rounded-xl bg-white px-3 py-1.5 font-black text-blue-600 ring-1 ring-blue-100 transition hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2"
            >
              <span>Upload files</span>
              <input id="file-upload" name="file-upload" type="file" multiple className="sr-only" onChange={handleFileChange} accept="image/*" disabled={isUploading} />
            </label>
            <p className="pl-2 font-medium">or drag and drop</p>
          </div>
          <p className="mt-2 text-xs font-semibold text-slate-500">PNG, JPG, GIF up to 10MB. First image becomes the cover.</p>
          {isUploading && <p className="mt-3 text-sm font-black text-blue-600">Uploading images...</p>}
        </div>

        {images.length > 0 && (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {images.map((image, idx) => (
              <div key={`${image.url}-${idx}`} className="group relative overflow-hidden rounded-[20px] border border-blue-100 bg-white shadow-sm">
                <div className="relative">
                  <img src={image.url} alt={`Listing upload ${idx + 1}`} className="h-36 w-full object-cover" />
                  <div className="absolute left-2 top-2 flex items-center gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-500 shadow-sm">
                      <GripVertical className="h-4 w-4" />
                    </span>
                    {idx === 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white">
                        <Star className="h-3 w-3" />
                        Cover
                      </span>
                    )}
                  </div>
                  <button 
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute right-2 top-2 rounded-full bg-red-500 p-1.5 text-white opacity-0 shadow-sm transition hover:bg-red-600 group-hover:opacity-100"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="space-y-2 p-3">
                  <Input value={image.caption || ''} placeholder="Caption" onChange={(event) => updateImage(idx, { caption: event.target.value })} className="h-9 text-xs" />
                  <Select value={image.category || 'Other'} onChange={(event) => updateImage(idx, { category: event.target.value as ListingImageCategory })} className="h-9 text-xs">
                    {imageCategories.map((category) => <option key={category} value={category}>{category}</option>)}
                  </Select>
                  {idx !== 0 && (
                    <button type="button" onClick={() => setAsCover(idx)} className="w-full rounded-xl bg-blue-50 px-2 py-2 text-xs font-black text-blue-700 ring-1 ring-blue-100">
                      Set as cover
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="wizard-section">
        <div className="mb-5 flex min-w-0 items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 ring-1 ring-emerald-200">
            <Sparkles className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h3 className="text-base font-black text-slate-950">Amenities</h3>
            <p className="mt-1 text-sm font-medium text-slate-500">Set status, copy, fees, and optional background images for Listing Detail amenity cards.</p>
          </div>
        </div>

        <div className="mb-5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {amenityGroups.map((group) => (
            <span key={group} className="shrink-0 rounded-full border border-emerald-100 bg-white px-3 py-1.5 text-xs font-black text-emerald-700">
              {group}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {amenities.map((amenity, index) => (
            <div key={amenity.name} className="rounded-[20px] border border-white bg-white/90 p-4 shadow-sm">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_150px]">
                <div>
                  <Label>{amenity.name}</Label>
                  <Textarea rows={2} value={amenity.description} onChange={(event) => updateAmenity(index, { description: event.target.value })} className="mt-2 min-h-[72px]" />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={amenity.status} onChange={(event) => updateAmenity(index, { status: event.target.value as AmenityDraft['status'] })}>
                    <option value="available">Available</option>
                    <option value="included">Included</option>
                    <option value="paid">Paid</option>
                    <option value="unavailable">Unavailable</option>
                  </Select>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input value={amenity.fee || ''} placeholder="Optional fee" onChange={(event) => updateAmenity(index, { fee: event.target.value })} />
                <Input value={amenity.imageUrl || ''} placeholder="Optional background image URL" onChange={(event) => updateAmenity(index, { imageUrl: event.target.value })} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="wizard-action-bar">
        <Button type="button" variant="outline" onClick={prevStep}>Previous</Button>
        <Button type="button" onClick={onSubmit} disabled={isUploading}>Next Step</Button>
      </div>
    </div>
  );
};
