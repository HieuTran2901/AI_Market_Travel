import React from 'react';
import { useForm } from 'react-hook-form';
import { useListingWizard } from '@/context/ListingWizardContext';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { BedDouble, CalendarClock, Car, Clock3, DollarSign, Hotel, ListPlus, Utensils, WalletCards } from 'lucide-react';

const linesToArray = (value?: string) => (value || '')
  .split('\n')
  .map((item) => item.trim())
  .filter(Boolean);

const parseRoomTypes = (value?: string) => linesToArray(value).map((line) => {
  const [name = '', quantity = '', maxGuests = '', price = '', description = ''] = line.split('|').map((part) => part.trim());
  return {
    name,
    quantity: quantity ? Number(quantity) : undefined,
    maxGuests: maxGuests ? Number(maxGuests) : undefined,
    price: price ? Number(price) : undefined,
    description,
  };
}).filter((room) => room.name);

export const Step3CategoryDetails: React.FC = () => {
  const { formData, updateFormData, nextStep, prevStep } = useListingWizard();
  const detailDefaults = formData.details || {};
  
  const { register, handleSubmit, watch } = useForm<Record<string, any>>({
    defaultValues: {
      ...detailDefaults,
      includedServices: Array.isArray(detailDefaults.includedServices) ? detailDefaults.includedServices.join('\n') : '',
      roomTypes: Array.isArray(detailDefaults.roomTypes)
        ? detailDefaults.roomTypes.map((room: any) => [room.name, room.quantity, room.maxGuests, room.price, room.description].filter(Boolean).join(' | ')).join('\n')
        : '',
    }
  });

  const onSubmit = (data: any) => {
    const normalized = {
      ...data,
      includedServices: linesToArray(data.includedServices),
      roomTypes: parseRoomTypes(data.roomTypes),
    };
    updateFormData({ details: normalized });
    nextStep();
  };

  const watched = watch();
  const base = Number(formData.basePrice || 0);
  const tax = Number(watched.taxes || 0);
  const service = Number(watched.serviceFee || 0);
  const cleaning = Number(watched.cleaningFee || 0);
  const totalPreview = base + tax + service + cleaning;

  const renderHotelFields = () => (
    <div className="space-y-6">
      <section className="wizard-section">
        <div className="mb-5 flex min-w-0 items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 ring-1 ring-blue-200">
            <Hotel className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h3 className="text-base font-black text-slate-950">Property details</h3>
            <p className="mt-1 text-sm font-medium text-slate-500">These fields power the Rooms & Rates summary and quick information strip.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field label="Star / Category Rating"><Input type="number" min={1} max={5} {...register('starRating', { valueAsNumber: true })} /></Field>
          <Field label="Total Rooms"><Input type="number" min={0} {...register('totalRooms', { valueAsNumber: true })} /></Field>
          <Field label="Property Type"><Input placeholder="Hotel, homestay, villa..." {...register('propertyType')} /></Field>
          <Field label="Bedrooms"><Input type="number" min={0} {...register('bedrooms', { valueAsNumber: true })} /></Field>
          <Field label="Beds"><Input type="number" min={0} {...register('beds', { valueAsNumber: true })} /></Field>
          <Field label="Bathrooms"><Input type="number" min={0} step="0.5" {...register('bathrooms', { valueAsNumber: true })} /></Field>
          <Field label="Maximum Guests"><Input type="number" min={1} {...register('maxGuests', { valueAsNumber: true })} /></Field>
          <Field label="Minimum Stay"><Input type="number" min={1} {...register('minStayNights', { valueAsNumber: true })} /></Field>
          <Field label="Maximum Stay"><Input type="number" min={1} {...register('maxStayNights', { valueAsNumber: true })} /></Field>
        </div>
      </section>

      <section className="wizard-section">
        <div className="mb-5 flex min-w-0 items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 ring-1 ring-emerald-200">
            <CalendarClock className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h3 className="text-base font-black text-slate-950">Check-in and services</h3>
            <p className="mt-1 text-sm font-medium text-slate-500">Set standard arrival windows and included services.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field label="Check-in Time"><Input type="time" {...register('checkInTime')} /></Field>
          <Field label="Check-out Time"><Input type="time" {...register('checkOutTime')} /></Field>
          <Field label="Price Unit">
            <Select {...register('priceUnit')}>
              <option value="night">Per night</option>
              <option value="stay">Per stay</option>
              <option value="guest">Per guest</option>
            </Select>
          </Field>
          <div className="space-y-2 md:col-span-3">
            <Label>Included Services</Label>
            <Textarea rows={3} placeholder="Breakfast included&#10;Airport transfer on request" {...register('includedServices')} />
          </div>
        </div>
      </section>

      <section className="wizard-section">
        <div className="mb-5 flex min-w-0 items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600 ring-1 ring-violet-200">
            <BedDouble className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h3 className="text-base font-black text-slate-950">Room types and rate plans</h3>
            <p className="mt-1 text-sm font-medium text-slate-500">Add one room plan per line. The Listing Detail page reads this structured list.</p>
          </div>
        </div>
        <div className="rounded-2xl border border-white bg-white/80 p-4 shadow-sm">
          <Label>Room Types / Rate Plans</Label>
          <Textarea rows={5} className="mt-2" placeholder="Deluxe Double Room | 6 | 2 | 820000 | Garden view and ensuite bathroom&#10;Family Suite | 2 | 4 | 1400000 | Two bedrooms and balcony" {...register('roomTypes')} />
          <p className="mt-2 text-xs font-medium text-slate-500">Format: name | quantity | max guests | price | description</p>
        </div>
      </section>

      <section className="wizard-section">
        <div className="mb-5 flex min-w-0 items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600 ring-1 ring-orange-200">
            <WalletCards className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h3 className="text-base font-black text-slate-950">Pricing and fees</h3>
            <p className="mt-1 text-sm font-medium text-slate-500">Keep provider-entered fees separate from booking calculations.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field label="Taxes"><Input type="number" min={0} {...register('taxes', { valueAsNumber: true })} /></Field>
          <Field label="Service Fee"><Input type="number" min={0} {...register('serviceFee', { valueAsNumber: true })} /></Field>
          <Field label="Cleaning Fee"><Input type="number" min={0} {...register('cleaningFee', { valueAsNumber: true })} /></Field>
          <Field label="Extra Guest Fee"><Input type="number" min={0} {...register('extraGuestFee', { valueAsNumber: true })} /></Field>
          <Field label="Weekend Price"><Input type="number" min={0} {...register('weekendPrice', { valueAsNumber: true })} /></Field>
          <Field label="Seasonal Price"><Input type="number" min={0} {...register('seasonalPrice', { valueAsNumber: true })} /></Field>
        </div>
        <div className="mt-5 rounded-2xl border border-emerald-100 bg-white/80 p-4 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-600">Live price preview</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-2xl font-black text-slate-950">{totalPreview.toLocaleString('vi-VN')} VND</p>
              <p className="text-sm font-medium text-slate-500">Base price plus visible taxes/service/cleaning fees.</p>
            </div>
            <DollarSign className="h-10 w-10 text-emerald-500" />
          </div>
        </div>
      </section>
    </div>
  );

  const categoryFields: Record<string, React.ReactNode> = {
    TOUR: (
      <CategoryPanel icon={Clock3} title="Tour details" helper="Use duration and group size for tour-specific marketplace cards.">
        <Field label="Duration (Days)"><Input type="number" {...register('durationDays', { valueAsNumber: true })} /></Field>
        <Field label="Max Group Size"><Input type="number" {...register('maxGroupSize', { valueAsNumber: true })} /></Field>
      </CategoryPanel>
    ),
    RESTAURANT: (
      <CategoryPanel icon={Utensils} title="Restaurant details" helper="Keep dining-specific fields concise and searchable.">
        <Field label="Cuisine Type"><Input {...register('cuisineType')} /></Field>
        <Field label="Seating Capacity"><Input type="number" {...register('seatingCapacity', { valueAsNumber: true })} /></Field>
      </CategoryPanel>
    ),
    VEHICLE: (
      <CategoryPanel icon={Car} title="Vehicle details" helper="Capture the vehicle basics used in provider listings.">
        <Field label="Vehicle Type"><Input placeholder="CAR, MOTORBIKE..." {...register('vehicleType')} /></Field>
        <Field label="Brand"><Input {...register('brand')} /></Field>
        <Field label="Model"><Input {...register('model')} /></Field>
        <Field label="Seats"><Input type="number" {...register('seats', { valueAsNumber: true })} /></Field>
      </CategoryPanel>
    ),
    EXPERIENCE: (
      <CategoryPanel icon={ListPlus} title="Experience details" helper="Describe the time commitment and skill fit.">
        <Field label="Duration (Hours)"><Input type="number" step="0.5" {...register('durationHours', { valueAsNumber: true })} /></Field>
        <Field label="Skill Level"><Input placeholder="BEGINNER, ALL..." {...register('skillLevel')} /></Field>
      </CategoryPanel>
    ),
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="wizard-section-header">
        <div className="flex min-w-0 items-start gap-4">
          <span className="wizard-icon">
            <BedDouble className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <h2 className="text-2xl font-black tracking-tight text-slate-950">Details & Rates</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">Category-aware details for {formData.category?.toLowerCase() || 'this listing'}.</p>
          </div>
        </div>
      </div>

      {formData.category === 'HOTEL' ? renderHotelFields() : categoryFields[formData.category || ''] || null}

      <div className="wizard-action-bar">
        <Button type="button" variant="outline" onClick={prevStep}>Previous</Button>
        <Button type="submit">Next Step</Button>
      </div>
    </form>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-2">
    <Label>{label}</Label>
    {children}
  </div>
);

const CategoryPanel = ({ icon: Icon, title, helper, children }: {
  icon: React.ElementType;
  title: string;
  helper: string;
  children: React.ReactNode;
}) => (
  <section className="wizard-section">
    <div className="mb-5 flex min-w-0 items-start gap-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 ring-1 ring-blue-200">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <h3 className="text-base font-black text-slate-950">{title}</h3>
        <p className="mt-1 text-sm font-medium text-slate-500">{helper}</p>
      </div>
    </div>
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {children}
    </div>
  </section>
);
