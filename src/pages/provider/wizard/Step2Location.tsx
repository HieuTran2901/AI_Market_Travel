import React from 'react';
import { useForm } from 'react-hook-form';
import { useListingWizard } from '@/context/ListingWizardContext';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';

interface Step2FormData {
  address: string;
  city: string;
  country: string;
  latitude: number | undefined;
  longitude: number | undefined;
}

export const Step2Location: React.FC = () => {
  const { formData, updateFormData, nextStep, prevStep } = useListingWizard();
  
  const { register, handleSubmit, formState: { errors } } = useForm<Step2FormData>({
    defaultValues: {
      address: formData.address || '',
      city: formData.city || '',
      country: formData.country || 'Vietnam',
      latitude: formData.latitude,
      longitude: formData.longitude,
    }
  });

  const onSubmit = (data: Step2FormData) => {
    updateFormData(data);
    nextStep();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="address">Street Address *</Label>
        <Input 
          id="address" 
          placeholder="e.g. 123 Tran Phu Street" 
          {...register('address', { required: 'Address is required' })} 
        />
        {errors.address && <p className="text-sm text-red-500">{errors.address.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">City / Province *</Label>
          <Input 
            id="city" 
            placeholder="e.g. Da Nang" 
            {...register('city', { required: 'City is required' })} 
          />
          {errors.city && <p className="text-sm text-red-500">{errors.city.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="country">Country *</Label>
          <Input 
            id="country" 
            {...register('country', { required: 'Country is required' })} 
          />
          {errors.country && <p className="text-sm text-red-500">{errors.country.message}</p>}
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
        <h4 className="text-sm font-medium text-gray-900 mb-4">Map Coordinates (Optional)</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="latitude">Latitude</Label>
            <Input 
              id="latitude" 
              type="number"
              step="0.000001"
              {...register('latitude', { valueAsNumber: true })} 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="longitude">Longitude</Label>
            <Input 
              id="longitude" 
              type="number"
              step="0.000001"
              {...register('longitude', { valueAsNumber: true })} 
            />
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Providing exact coordinates helps customers find your location on the map.
        </p>
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={prevStep}>Previous</Button>
        <Button type="submit">Next Step</Button>
      </div>
    </form>
  );
};
