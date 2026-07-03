import React from 'react';
import { useForm } from 'react-hook-form';
import { useListingWizard } from '@/context/ListingWizardContext';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';

export const Step3CategoryDetails: React.FC = () => {
  const { formData, updateFormData, nextStep, prevStep } = useListingWizard();
  
  const { register, handleSubmit } = useForm({
    defaultValues: formData.details || {}
  });

  const onSubmit = (data: any) => {
    // Convert string inputs to proper types if needed, but keeping it simple for now
    updateFormData({ details: data });
    nextStep();
  };

  const renderHotelFields = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Star Rating</Label>
        <Input type="number" min={1} max={5} {...register('starRating', { valueAsNumber: true })} />
      </div>
      <div className="space-y-2">
        <Label>Total Rooms</Label>
        <Input type="number" {...register('totalRooms', { valueAsNumber: true })} />
      </div>
      <div className="space-y-2">
        <Label>Check-in Time</Label>
        <Input type="time" {...register('checkInTime')} />
      </div>
      <div className="space-y-2">
        <Label>Check-out Time</Label>
        <Input type="time" {...register('checkOutTime')} />
      </div>
    </div>
  );

  const renderTourFields = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Duration (Days)</Label>
        <Input type="number" {...register('durationDays', { valueAsNumber: true })} />
      </div>
      <div className="space-y-2">
        <Label>Max Group Size</Label>
        <Input type="number" {...register('maxGroupSize', { valueAsNumber: true })} />
      </div>
    </div>
  );

  const renderRestaurantFields = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Cuisine Type</Label>
        <Input {...register('cuisineType')} />
      </div>
      <div className="space-y-2">
        <Label>Seating Capacity</Label>
        <Input type="number" {...register('seatingCapacity', { valueAsNumber: true })} />
      </div>
    </div>
  );

  const renderVehicleFields = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Vehicle Type (e.g., CAR, MOTORBIKE)</Label>
        <Input {...register('vehicleType')} />
      </div>
      <div className="space-y-2">
        <Label>Brand</Label>
        <Input {...register('brand')} />
      </div>
      <div className="space-y-2">
        <Label>Model</Label>
        <Input {...register('model')} />
      </div>
      <div className="space-y-2">
        <Label>Seats</Label>
        <Input type="number" {...register('seats', { valueAsNumber: true })} />
      </div>
    </div>
  );

  const renderExperienceFields = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Duration (Hours)</Label>
        <Input type="number" step="0.5" {...register('durationHours', { valueAsNumber: true })} />
      </div>
      <div className="space-y-2">
        <Label>Skill Level</Label>
        <Input placeholder="BEGINNER, ALL..." {...register('skillLevel')} />
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <h3 className="text-lg font-medium">
        Details for {formData.category?.toLowerCase() || 'Listing'}
      </h3>
      
      {formData.category === 'HOTEL' && renderHotelFields()}
      {formData.category === 'TOUR' && renderTourFields()}
      {formData.category === 'RESTAURANT' && renderRestaurantFields()}
      {formData.category === 'VEHICLE' && renderVehicleFields()}
      {formData.category === 'EXPERIENCE' && renderExperienceFields()}

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={prevStep}>Previous</Button>
        <Button type="submit">Next Step</Button>
      </div>
    </form>
  );
};
