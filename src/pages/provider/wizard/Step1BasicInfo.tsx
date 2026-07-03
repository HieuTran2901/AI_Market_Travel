import React from 'react';
import { useForm } from 'react-hook-form';
import { useListingWizard } from '@/context/ListingWizardContext';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { ListingCategory } from '@/types/listing';

interface Step1FormData {
  category: ListingCategory;
  title: string;
  shortDesc: string;
  description: string;
  basePrice: number;
}

export const Step1BasicInfo: React.FC = () => {
  const { formData, updateFormData, nextStep } = useListingWizard();
  
  const { register, handleSubmit, formState: { errors } } = useForm<Step1FormData>({
    defaultValues: {
      category: formData.category || 'HOTEL',
      title: formData.title || '',
      shortDesc: formData.shortDesc || '',
      description: formData.description || '',
      basePrice: formData.basePrice || 0,
    }
  });

  const onSubmit = (data: Step1FormData) => {
    updateFormData(data);
    nextStep();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="category">Listing Category *</Label>
        <Select id="category" {...register('category', { required: 'Category is required' })}>
          <option value="HOTEL">Hotel / Accommodation</option>
          <option value="TOUR">Tour Package</option>
          <option value="RESTAURANT">Restaurant</option>
          <option value="VEHICLE">Vehicle Rental</option>
          <option value="EXPERIENCE">Local Experience</option>
        </Select>
        {errors.category && <p className="text-sm text-red-500">{errors.category.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input 
          id="title" 
          placeholder="e.g. Luxury Ocean View Villa" 
          {...register('title', { required: 'Title is required', maxLength: 200 })} 
        />
        {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="shortDesc">Short Description</Label>
        <Textarea 
          id="shortDesc" 
          placeholder="A quick summary (max 500 characters)" 
          rows={2}
          {...register('shortDesc', { maxLength: 500 })} 
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Full Description</Label>
        <Textarea 
          id="description" 
          placeholder="Provide complete details about what you are offering..." 
          rows={6}
          {...register('description')} 
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="basePrice">Base Price (VND) *</Label>
        <Input 
          id="basePrice" 
          type="number" 
          min={0}
          {...register('basePrice', { required: 'Base price is required', valueAsNumber: true })} 
        />
        {errors.basePrice && <p className="text-sm text-red-500">{errors.basePrice.message}</p>}
      </div>

      <div className="flex justify-end pt-4">
        <Button type="submit">Next Step</Button>
      </div>
    </form>
  );
};
