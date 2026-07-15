import React from 'react';
import { useForm, type UseFormRegisterReturn } from 'react-hook-form';
import { useListingWizard } from '@/context/ListingWizardContext';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { ListingCategory } from '@/types/listing';
import { FileText, Layers3, Link, ListChecks, MapPin, Tag, X } from 'lucide-react';

interface Step1FormData {
  category: ListingCategory;
  title: string;
  shortDesc: string;
  description: string;
  basePrice: number;
  highlights: string;
  guestVibeTags: string;
  suitableForTags: string;
  neighborhoodSummary: string;
  whyChoosePoints: string;
  tripPlanningTips: string;
  quickOverviewFacts: string;
  overviewImageUrl: string;
}

const linesToArray = (value?: string) => (value || '')
  .split('\n')
  .map((item) => item.trim())
  .filter(Boolean);

const csvToArray = (value?: string) => (value || '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

export const Step1BasicInfo: React.FC = () => {
  const { formData, updateFormData, nextStep } = useListingWizard();

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<Step1FormData>({
    defaultValues: {
      category: formData.category || 'HOTEL',
      title: formData.title || '',
      shortDesc: formData.shortDesc || '',
      description: formData.description || '',
      basePrice: formData.basePrice || 0,
      highlights: Array.isArray(formData.details?.highlights) ? formData.details.highlights.join('\n') : '',
      guestVibeTags: Array.isArray(formData.details?.guestVibeTags) ? formData.details.guestVibeTags.join(', ') : '',
      suitableForTags: Array.isArray(formData.details?.suitableForTags) ? formData.details.suitableForTags.join(', ') : '',
      neighborhoodSummary: (formData.details?.neighborhoodSummary as string) || '',
      whyChoosePoints: Array.isArray(formData.details?.whyChoosePoints) ? formData.details.whyChoosePoints.join('\n') : '',
      tripPlanningTips: Array.isArray(formData.details?.tripPlanningTips) ? formData.details.tripPlanningTips.join('\n') : '',
      quickOverviewFacts: Array.isArray(formData.details?.quickOverviewFacts) ? formData.details.quickOverviewFacts.join('\n') : '',
      overviewImageUrl: (formData.details?.overviewImageUrl as string) || '',
    }
  });

  const shortDesc = watch('shortDesc') || '';
  const description = watch('description') || '';
  const vibeTags = csvToArray(watch('guestVibeTags'));
  const suitableTags = csvToArray(watch('suitableForTags'));

  const removeTag = (field: 'guestVibeTags' | 'suitableForTags', tag: string) => {
    const next = csvToArray(watch(field)).filter((item) => item !== tag).join(', ');
    setValue(field, next, { shouldDirty: true });
  };

  const addTagFromInput = (field: 'guestVibeTags' | 'suitableForTags', value: string) => {
    const tags = csvToArray(watch(field));
    const tag = value.trim();
    if (!tag || tags.includes(tag) || tags.length >= 5) return;
    setValue(field, [...tags, tag].join(', '), { shouldDirty: true });
  };

  const onSubmit = (data: Step1FormData) => {
    const { highlights, guestVibeTags, suitableForTags, neighborhoodSummary, whyChoosePoints, tripPlanningTips, quickOverviewFacts, overviewImageUrl, ...core } = data;
    updateFormData({
      ...core,
      details: {
        ...(formData.details || {}),
        highlights: linesToArray(highlights),
        guestVibeTags: csvToArray(guestVibeTags),
        suitableForTags: csvToArray(suitableForTags),
        neighborhoodSummary,
        whyChoosePoints: linesToArray(whyChoosePoints),
        tripPlanningTips: linesToArray(tripPlanningTips),
        quickOverviewFacts: linesToArray(quickOverviewFacts),
        overviewImageUrl,
      }
    });
    nextStep();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="wizard-section-header">
        <div className="flex min-w-0 items-start gap-4">
          <span className="wizard-icon">
            <FileText className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <h2 className="text-2xl font-black tracking-tight text-slate-950">Basic Info</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">Tell travelers what makes your place special.</p>
          </div>
        </div>
      </div>

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

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="shortDesc">Short Description</Label>
            <span className="text-xs font-semibold text-slate-400">{shortDesc.length} / 500</span>
          </div>
          <Textarea
            id="shortDesc"
            placeholder="A quick summary (max 500 characters)"
            rows={5}
            {...register('shortDesc', { maxLength: 500 })}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="description">Full Description</Label>
            <span className="text-xs font-semibold text-slate-400">{description.length} / 2000</span>
          </div>
          <Textarea
            id="description"
            placeholder="Provide complete details about what you are offering..."
            rows={5}
            {...register('description')}
          />
        </div>
      </div>

      <div className="wizard-section">
        <div className="mb-5 flex min-w-0 items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 ring-1 ring-blue-200">
            <Layers3 className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h3 className="text-base font-black text-slate-950">Overview content</h3>
            <p className="mt-1 text-sm font-medium text-slate-500">These fields feed the Listing Detail Overview cards. Use content per field unless noted.</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="overviewImageUrl">Overview Image URL</Label>
            <IconInput icon={Link} id="overviewImageUrl" placeholder="Optional image used in About this stay" registration={register('overviewImageUrl')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="neighborhoodSummary">Neighborhood Summary</Label>
            <IconInput icon={MapPin} id="neighborhoodSummary" placeholder="A cozy part of central Da Lat" registration={register('neighborhoodSummary')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="guestVibeTags">Guest Vibe Tags</Label>
            <TagChipEditor tags={vibeTags} placeholder="Relaxing, Scenic, Quiet" onRemove={(tag) => removeTag('guestVibeTags', tag)} onAdd={(tag) => addTagFromInput('guestVibeTags', tag)} />
            <input type="hidden" {...register('guestVibeTags')} />
            <p className="text-xs text-slate-500">Add up to 5 vibe tags</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="suitableForTags">Suitable For Tags</Label>
            <TagChipEditor tags={suitableTags} placeholder="Business, Weekend getaway, Families" onRemove={(tag) => removeTag('suitableForTags', tag)} onAdd={(tag) => addTagFromInput('suitableForTags', tag)} />
            <input type="hidden" {...register('suitableForTags')} />
            <p className="text-xs text-slate-500">Add up to 5 tags</p>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="whyChoosePoints">Why Travelers Choose This Stay</Label>
            <IconTextarea icon={ListChecks} id="whyChoosePoints" rows={3} placeholder="Comfort details that make stays easier&#10;Convenient base near the lake" registration={register('whyChoosePoints')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="highlights">Listing Highlights</Label>
            <Textarea id="highlights" rows={4} placeholder="Garden breakfast&#10;Pine valley views" {...register('highlights')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tripPlanningTips">Trip Planning Tips</Label>
            <Textarea id="tripPlanningTips" rows={4} placeholder="Check-in from 14:00&#10;Parking support is available" {...register('tripPlanningTips')} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="quickOverviewFacts">Quick Overview Facts</Label>
            <Textarea id="quickOverviewFacts" rows={3} placeholder="Free high-speed Wi-Fi throughout&#10;24/7 provider support when you need it" {...register('quickOverviewFacts')} />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="basePrice">Base Price (VND) *</Label>
        <div className="flex overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
          <span className="flex h-12 w-12 items-center justify-center border-r border-slate-200 text-xs font-black text-slate-500">VND</span>
          <Input
            id="basePrice"
            type="number"
            min={0}
            className="border-0 shadow-none focus:ring-0"
            {...register('basePrice', { required: 'Base price is required', valueAsNumber: true })}
          />
        </div>
        {errors.basePrice && <p className="text-sm text-red-500">{errors.basePrice.message}</p>}
      </div>

      <div className="wizard-action-bar">
        <div />
        <Button type="submit" className="h-12 rounded-xl bg-blue-600 px-6 font-black shadow-lg shadow-blue-500/20">
          Next Step
        </Button>
      </div>
    </form>
  );
};

const TagChipEditor = ({ tags, placeholder, onRemove, onAdd }: {
  tags: string[];
  placeholder: string;
  onRemove: (tag: string) => void;
  onAdd: (tag: string) => void;
}) => {
  const [draft, setDraft] = React.useState('');
  return (
    <div className="relative flex min-h-14 items-center rounded-xl border border-slate-300 bg-white shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
      <Tag className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-slate-400" />
      <div className="flex min-h-14 min-w-0 flex-1 flex-wrap items-center gap-2 py-2 pl-12 pr-4">
        {tags.slice(0, 5).map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700 ring-1 ring-slate-200">
            {tag}
            <button type="button" onClick={() => onRemove(tag)} className="text-slate-400 hover:text-slate-700">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ',') {
              event.preventDefault();
              onAdd(draft);
              setDraft('');
            }
          }}
          placeholder={tags.length ? '' : placeholder}
          className="h-7 min-w-[160px] flex-1 border-0 bg-transparent p-0 text-sm leading-normal shadow-none outline-none placeholder:text-slate-400 focus:ring-0"
        />
      </div>
    </div>
  );
};

const IconInput = ({ icon: Icon, registration, className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement> & {
  icon: React.ElementType;
  registration: UseFormRegisterReturn;
}) => (
  <div className="relative">
    <Icon aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 z-10 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
    <input
      className={`h-14 w-full rounded-xl border border-slate-300 bg-white py-2 pr-4 pl-12 text-sm leading-normal text-slate-950 shadow-sm transition-colors transition-shadow duration-200 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
      {...registration}
    />
  </div>
);

const IconTextarea = ({ icon: Icon, registration, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  icon: React.ElementType;
  registration: UseFormRegisterReturn;
}) => (
  <div className="relative">
    <Icon aria-hidden="true" className="pointer-events-none absolute left-4 top-[18px] z-10 h-5 w-5 text-slate-400" />
    <textarea
      className="min-h-[110px] w-full resize-y rounded-xl border border-slate-300 bg-white pt-4 pr-4 pb-4 pl-12 text-sm leading-6 text-slate-950 shadow-sm transition-colors transition-shadow duration-200 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
      {...props}
      {...registration}
    />
  </div>
);
