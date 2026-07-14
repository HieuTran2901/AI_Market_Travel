import React from 'react';
import { useForm } from 'react-hook-form';
import { useListingWizard } from '@/context/ListingWizardContext';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { ExternalLink, Lock, Map, MapPin, Navigation, Route } from 'lucide-react';

interface Step2FormData {
  address: string;
  city: string;
  country: string;
  latitude: number | undefined;
  longitude: number | undefined;
  district: string;
  ward: string;
  postalCode: string;
  areaNeighborhood: string;
  locationType: string;
  nearbyPlaces: string;
  localTravelContext: string;
  checkInMeetingInstructions: string;
  privatePostBookingInstructions: string;
}

const linesToArray = (value?: string) => (value || '')
  .split('\n')
  .map((item) => item.trim())
  .filter(Boolean);

const parseNearbyPlaces = (value?: string) => linesToArray(value).map((line) => {
  const [name = '', distance = '', travelTime = '', transportMode = ''] = line.split('|').map((part) => part.trim());
  return { name, distance, travelTime, transportMode };
}).filter((item) => item.name);

export const Step2Location: React.FC = () => {
  const { formData, updateFormData, nextStep, prevStep } = useListingWizard();
  
  const { register, handleSubmit, formState: { errors } } = useForm<Step2FormData>({
    defaultValues: {
      address: formData.address || '',
      city: formData.city || '',
      country: formData.country || 'Vietnam',
      latitude: formData.latitude,
      longitude: formData.longitude,
      district: (formData.details?.district as string) || '',
      ward: (formData.details?.ward as string) || '',
      postalCode: (formData.details?.postalCode as string) || '',
      areaNeighborhood: (formData.details?.areaNeighborhood as string) || '',
      locationType: (formData.details?.locationType as string) || '',
      nearbyPlaces: Array.isArray(formData.details?.nearbyPlaces)
        ? formData.details.nearbyPlaces.map((place: any) => [place.name, place.distance, place.travelTime, place.transportMode].filter(Boolean).join(' | ')).join('\n')
        : '',
      localTravelContext: Array.isArray(formData.details?.localTravelContext) ? formData.details.localTravelContext.join('\n') : '',
      checkInMeetingInstructions: (formData.details?.checkInMeetingInstructions as string) || '',
      privatePostBookingInstructions: (formData.details?.privatePostBookingInstructions as string) || '',
    }
  });

  const onSubmit = (data: Step2FormData) => {
    const {
      district,
      ward,
      postalCode,
      areaNeighborhood,
      locationType,
      nearbyPlaces,
      localTravelContext,
      checkInMeetingInstructions,
      privatePostBookingInstructions,
      ...core
    } = data;
    updateFormData({
      ...core,
      details: {
        ...(formData.details || {}),
        district,
        ward,
        postalCode,
        areaNeighborhood,
        locationType,
        nearbyPlaces: parseNearbyPlaces(nearbyPlaces),
        localTravelContext: linesToArray(localTravelContext),
        checkInMeetingInstructions,
        privatePostBookingInstructions,
      }
    });
    nextStep();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="wizard-section-header">
        <div className="flex min-w-0 items-start gap-4">
          <span className="wizard-icon">
            <MapPin className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <h2 className="text-2xl font-black tracking-tight text-slate-950">Location</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">Help travelers understand the area, arrival flow, and nearby context.</p>
          </div>
        </div>
      </div>

      <section className="wizard-section">
        <div className="mb-5 flex min-w-0 items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 ring-1 ring-blue-200">
            <Navigation className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h3 className="text-base font-black text-slate-950">Address information</h3>
            <p className="mt-1 text-sm font-medium text-slate-500">Use public-safe address information for listing discovery and map previews.</p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="address">Street Address *</Label>
            <Input id="address" placeholder="e.g. 123 Tran Phu Street" {...register('address', { required: 'Address is required' })} />
            {errors.address && <p className="text-xs font-semibold text-red-500">{errors.address.message}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="city">Province / City *</Label>
              <Input id="city" placeholder="e.g. Da Nang" {...register('city', { required: 'City is required' })} />
              {errors.city && <p className="text-xs font-semibold text-red-500">{errors.city.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country *</Label>
              <Input id="country" {...register('country', { required: 'Country is required' })} />
              {errors.country && <p className="text-xs font-semibold text-red-500">{errors.country.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="district">District</Label>
              <Input id="district" placeholder="e.g. Son Tra" {...register('district')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ward">Ward</Label>
              <Input id="ward" placeholder="e.g. My Khe" {...register('ward')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postalCode">Postal Code</Label>
              <Input id="postalCode" placeholder="e.g. 550000" {...register('postalCode')} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="areaNeighborhood">Area / Neighborhood</Label>
              <Input id="areaNeighborhood" placeholder="e.g. My Khe Beach" {...register('areaNeighborhood')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="locationType">Location Type</Label>
              <Input id="locationType" placeholder="Beachfront · Central area" {...register('locationType')} />
            </div>
          </div>
        </div>
      </section>

      <section className="wizard-section">
        <div className="mb-5 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600 ring-1 ring-sky-200">
              <Map className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h3 className="text-base font-black text-slate-950">Coordinates and map preview</h3>
              <p className="mt-1 text-sm font-medium text-slate-500">Exact coordinates improve traveler confidence and external map links.</p>
            </div>
          </div>
          <Button type="button" variant="outline" className="h-10 rounded-xl border-blue-100 bg-white text-xs font-bold text-blue-700">
            <ExternalLink className="mr-2 h-4 w-4" />
            Open in Google Maps
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude</Label>
              <Input id="latitude" type="number" step="0.000001" placeholder="16.054407" {...register('latitude', { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude</Label>
              <Input id="longitude" type="number" step="0.000001" placeholder="108.202167" {...register('longitude', { valueAsNumber: true })} />
            </div>
          </div>

          <div className="relative min-h-[220px] overflow-hidden rounded-[20px] border border-blue-100 bg-gradient-to-br from-sky-100 via-white to-blue-50 p-5">
            <div className="absolute inset-0 opacity-50" aria-hidden="true">
              <div className="absolute left-8 top-8 h-36 w-36 rounded-full bg-sky-200/70 blur-2xl" />
              <div className="absolute bottom-4 right-8 h-32 w-44 rounded-full bg-emerald-100 blur-2xl" />
            </div>
            <div className="relative z-10 flex h-full min-h-[180px] flex-col justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">Map preview</p>
                <h4 className="mt-2 text-lg font-black text-slate-950">{formData.city || 'Your destination'}</h4>
                <p className="mt-1 max-w-sm text-sm font-medium text-slate-500">{formData.address || 'Enter an address to complete the traveler-facing map context.'}</p>
              </div>
              <div className="mt-8 flex items-center gap-3 rounded-2xl border border-white bg-white/85 p-3 shadow-sm">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                  <MapPin className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-900">{formData.address || 'Listing marker'}</p>
                  <p className="truncate text-xs font-semibold text-slate-500">{formData.city || 'City'} · {formData.country || 'Country'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="wizard-section">
        <div className="mb-5 flex min-w-0 items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600 ring-1 ring-violet-200">
            <Route className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h3 className="text-base font-black text-slate-950">Nearby places and travel context</h3>
            <p className="mt-1 text-sm font-medium text-slate-500">One item per line keeps the Listing Detail explorer structured.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="nearbyPlaces">Nearby Places</Label>
            <Textarea id="nearbyPlaces" rows={4} placeholder="My Khe Beach | 200 m | 3 min walk | walk&#10;Airport | 6.2 km | 20 min drive | car" {...register('nearbyPlaces')} />
            <p className="text-xs font-medium text-slate-500">Format: name | distance | travel time | transport mode</p>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="localTravelContext">Local Travel Context</Label>
            <Textarea id="localTravelContext" rows={3} placeholder="Easy access to main coastal road&#10;Close to beaches and restaurants" {...register('localTravelContext')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="checkInMeetingInstructions">Check-in Meeting Instructions</Label>
            <Textarea id="checkInMeetingInstructions" rows={3} placeholder="Public-safe arrival notes shown before booking" {...register('checkInMeetingInstructions')} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-slate-400" />
              <Label htmlFor="privatePostBookingInstructions">Private Post-booking Instructions</Label>
            </div>
            <Textarea id="privatePostBookingInstructions" rows={3} placeholder="Private details sent only after confirmation" {...register('privatePostBookingInstructions')} />
          </div>
        </div>
      </section>

      <div className="wizard-action-bar">
        <Button type="button" variant="outline" onClick={prevStep}>Previous</Button>
        <Button type="submit">Next Step</Button>
      </div>
    </form>
  );
};
