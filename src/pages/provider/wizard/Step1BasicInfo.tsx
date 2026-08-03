import React from 'react';
import { useForm, type UseFormRegisterReturn } from 'react-hook-form';
import { useListingWizard } from '@/context/ListingWizardContext';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { ListingCategory } from '@/types/listing';
import { FileText, Layers3, Link as LinkIcon, ListChecks, MapPin, Tag, X, Sparkles, Wand2, Globe2, Type, Maximize2, Minimize2, Crown, Search, Coins, Rocket, Loader2 } from 'lucide-react';
import { useState, useRef } from 'react';
import { aiService } from '@/services/aiService';

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

  
  const abortControllerRef = useRef<AbortController | null>(null);
  const [promptInput, setPromptInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingOverview, setIsGeneratingOverview] = useState(false);
  const [generatingField, setGeneratingField] = useState<string | null>(null);
  const [isGeneratingPrice, setIsGeneratingPrice] = useState(false);
  const [pricingAdvice, setPricingAdvice] = useState<{ explanation?: string, seasonalAdvice?: string } | null>(null);

  const safelyParseJSON = (text: any) => {
    console.log("Raw AI response:", text);
    if (typeof text === 'object' && text !== null) {
      return text;
    }
    if (typeof text !== 'string') {
      console.error('AI response is not a string or object:', text);
      alert('Failed to parse AI response (invalid format). Please try again.');
      return null;
    }
    
    let cleanText = text.trim();
    if (cleanText.includes('```')) {
      cleanText = cleanText.replace(/```json/gi, '').replace(/```/g, '').trim();
    }
    
    try {
      return JSON.parse(cleanText);
    } catch (e) {
      console.error('Failed to parse AI JSON', e);
      console.error('Raw text that failed parsing:', cleanText);
      alert('Failed to parse AI response. Please try again.');
      return null;
    }
  };

  const handleGenerateEntireListing = async () => {
    if (!promptInput.trim()) return;
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
    
    setIsGenerating(true);
    try {
      const response = await aiService.generateListing({
        prompt: `Generate an entire listing based on this input: "${promptInput}". Return ONLY valid JSON with keys: title, shortDesc, description, overviewImageUrl, highlights (array of strings), guestVibeTags (array of strings), suitableForTags (array of strings), neighborhoodSummary, whyChoosePoints (array of strings), tripPlanningTips (array of strings), quickOverviewFacts (array of strings), basePrice (number). Do NOT wrap in markdown blocks, just raw JSON.`
      }, abortControllerRef.current.signal);
      
      const data = safelyParseJSON(response.rawJson || '');
      if (data) {
         if (data.title) setValue('title', data.title, { shouldDirty: true });
         if (data.shortDesc) setValue('shortDesc', data.shortDesc, { shouldDirty: true });
         if (data.description) setValue('description', data.description, { shouldDirty: true });
         if (data.overviewImageUrl) setValue('overviewImageUrl', data.overviewImageUrl, { shouldDirty: true });
         if (data.highlights) setValue('highlights', Array.isArray(data.highlights) ? data.highlights.join('\n') : data.highlights, { shouldDirty: true });
         if (data.guestVibeTags) setValue('guestVibeTags', Array.isArray(data.guestVibeTags) ? data.guestVibeTags.join(', ') : data.guestVibeTags, { shouldDirty: true });
         if (data.suitableForTags) setValue('suitableForTags', Array.isArray(data.suitableForTags) ? data.suitableForTags.join(', ') : data.suitableForTags, { shouldDirty: true });
         if (data.neighborhoodSummary) setValue('neighborhoodSummary', data.neighborhoodSummary, { shouldDirty: true });
         if (data.whyChoosePoints) setValue('whyChoosePoints', Array.isArray(data.whyChoosePoints) ? data.whyChoosePoints.join('\n') : data.whyChoosePoints, { shouldDirty: true });
         if (data.tripPlanningTips) setValue('tripPlanningTips', Array.isArray(data.tripPlanningTips) ? data.tripPlanningTips.join('\n') : data.tripPlanningTips, { shouldDirty: true });
         if (data.quickOverviewFacts) setValue('quickOverviewFacts', Array.isArray(data.quickOverviewFacts) ? data.quickOverviewFacts.join('\n') : data.quickOverviewFacts, { shouldDirty: true });
         if (data.basePrice) setValue('basePrice', Number(data.basePrice), { shouldDirty: true });
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') alert('Failed to generate listing. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateOverview = async () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
    
    setIsGeneratingOverview(true);
    try {
      const response = await aiService.chatWithAssistant({
        message: `Generate overview content for this listing. Title: "${watch('title')}". Description: "${watch('description')}". Return ONLY valid JSON with keys: overviewImageUrl, highlights (array), guestVibeTags (array), suitableForTags (array), neighborhoodSummary, whyChoosePoints (array), tripPlanningTips (array), quickOverviewFacts (array). Do NOT wrap in markdown blocks, just raw JSON.`,
        history: []
      }, abortControllerRef.current.signal);
      
      const data = safelyParseJSON(response.reply || response.message || '');
      if (data) {
         if (data.overviewImageUrl) setValue('overviewImageUrl', data.overviewImageUrl, { shouldDirty: true });
         if (data.highlights) setValue('highlights', Array.isArray(data.highlights) ? data.highlights.join('\n') : data.highlights, { shouldDirty: true });
         if (data.guestVibeTags) setValue('guestVibeTags', Array.isArray(data.guestVibeTags) ? data.guestVibeTags.join(', ') : data.guestVibeTags, { shouldDirty: true });
         if (data.suitableForTags) setValue('suitableForTags', Array.isArray(data.suitableForTags) ? data.suitableForTags.join(', ') : data.suitableForTags, { shouldDirty: true });
         if (data.neighborhoodSummary) setValue('neighborhoodSummary', data.neighborhoodSummary, { shouldDirty: true });
         if (data.whyChoosePoints) setValue('whyChoosePoints', Array.isArray(data.whyChoosePoints) ? data.whyChoosePoints.join('\n') : data.whyChoosePoints, { shouldDirty: true });
         if (data.tripPlanningTips) setValue('tripPlanningTips', Array.isArray(data.tripPlanningTips) ? data.tripPlanningTips.join('\n') : data.tripPlanningTips, { shouldDirty: true });
         if (data.quickOverviewFacts) setValue('quickOverviewFacts', Array.isArray(data.quickOverviewFacts) ? data.quickOverviewFacts.join('\n') : data.quickOverviewFacts, { shouldDirty: true });
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') alert('Failed to generate overview.');
    } finally {
      setIsGeneratingOverview(false);
    }
  };

  const handleFieldAiAction = async (action: string, fieldName: keyof Step1FormData) => {
    const currentValue = watch(fieldName);
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
    
    setGeneratingField(`${fieldName}-${action}`);
    try {
      const response = await aiService.chatWithAssistant({
        message: `Action: ${action}. Field Name: ${fieldName}. Current Value: "${currentValue}". Listing Title: "${watch('title')}". Return ONLY the newly generated text for this field. Do not include labels, json tags, or markdown.`,
        history: []
      }, abortControllerRef.current.signal);
      
      const newText = (response.reply || response.message || '').replace(/```.*?/g, '').trim();
      if (newText) {
        setValue(fieldName, newText as any, { shouldDirty: true });
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') alert(`Failed to ${action.toLowerCase()} field.`);
    } finally {
      setGeneratingField(null);
    }
  };

  const handleGeneratePricing = async () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
    
    setIsGeneratingPrice(true);
    setPricingAdvice(null);
    try {
      const response = await aiService.chatWithAssistant({
        message: `Act as a pricing expert for travel listings. Title: "${watch('title')}". Category: "${watch('category')}". Description: "${watch('description')}". Return ONLY valid JSON with keys: suggestedPrice (number in VND), explanation (string), seasonalAdvice (string). Do NOT wrap in markdown blocks, just raw JSON.`,
        history: []
      }, abortControllerRef.current.signal);
      
      const data = safelyParseJSON(response.reply || response.message || '');
      if (data) {
         if (data.suggestedPrice) setValue('basePrice', Number(data.suggestedPrice), { shouldDirty: true });
         setPricingAdvice({ explanation: data.explanation, seasonalAdvice: data.seasonalAdvice });
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') alert('Failed to generate pricing.');
    } finally {
      setIsGeneratingPrice(false);
    }
  };

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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-10 pb-20 sm:pb-10">
      {/* SECTION 1: AI Listing Assistant Hero */}
      <div className="relative overflow-hidden rounded-[24px] border border-blue-200 bg-white p-6 md:p-10 shadow-sm ring-1 ring-black/5">
        <div className="flex flex-col gap-6">
          
          {/* Left Column: Prompt Area */}
          <div className="flex flex-1 flex-col space-y-4">
            <div className="flex items-center gap-3">
              <h2 className="text-[28px] font-black tracking-tight text-slate-900">✨ AI Listing Assistant</h2>
              <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-blue-700">Beta</span>
            </div>
            <p className="text-[15px] font-medium text-slate-600 max-w-xl">
              Describe your property in a few words and AI will generate an entire professional listing.
            </p>
            
            <div className="relative mt-2 flex flex-1 flex-col">
              <Textarea 
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                placeholder='e.g. "Luxury villa near Xuan Huong Lake, heated pool, mountain view..."'
                className="flex-1 min-h-[240px] w-full resize-none rounded-[16px] border border-slate-200 bg-slate-50/50 p-5 pb-16 text-[15px] font-medium shadow-inner focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
              />
              <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2">
                <button type="button" className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700">
                  <Wand2 className="h-3.5 w-3.5" /> Smart Suggestions
                </button>
                <button type="button" className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700">
                  <Search className="h-3.5 w-3.5" /> SEO Optimize
                </button>
                <button type="button" className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition hover:-translate-y-0.5 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700">
                  <Crown className="h-3.5 w-3.5" /> Luxury Tone
                </button>
                <button type="button" className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700">
                  <Globe2 className="h-3.5 w-3.5" /> Translate
                </button>
              </div>
            </div>
            
            <div className="flex justify-center pt-3">
              <Button type="button" onClick={handleGenerateEntireListing} disabled={isGenerating || !promptInput.trim()} className="h-[48px] rounded-[16px] bg-gradient-to-r from-blue-600 to-indigo-600 px-6 text-[15px] font-black text-white shadow-[0_8px_16px_rgba(37,99,235,0.2)] transition-all hover:-translate-y-1 hover:from-blue-700 hover:to-indigo-700 hover:shadow-[0_12px_20px_rgba(37,99,235,0.3)] disabled:opacity-50 disabled:hover:translate-y-0">
                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />} {isGenerating ? "Generating..." : "Generate Entire Listing"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-10">
        {/* SECTION 2: Basic Information Card */}
        <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-8">
          <div className="mb-8 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-blue-50 text-blue-600">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-[20px] font-black text-slate-900">Basic Information</h3>
              <p className="text-[13px] font-medium text-slate-500">Tell travelers what makes your place special.</p>
            </div>
          </div>

          <div className="space-y-8">
            <div className="space-y-2">
              <Label htmlFor="category" className="text-[13px] font-bold text-slate-700">Listing Category *</Label>
              <Select id="category" className="h-14 w-full rounded-[16px] bg-white border-slate-200 shadow-sm" {...register('category', { required: 'Category is required' })}>
                <option value="HOTEL">Hotel / Accommodation</option>
                <option value="TOUR">Tour Package</option>
                <option value="RESTAURANT">Restaurant</option>
                <option value="VEHICLE">Vehicle Rental</option>
                <option value="EXPERIENCE">Local Experience</option>
              </Select>
              {errors.category && <p className="text-sm text-red-500">{errors.category.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="title" className="text-[13px] font-bold text-slate-700">Title *</Label>
              <Input
                id="title"
                className="h-14 w-full rounded-[16px] bg-white border-slate-200 shadow-sm text-[15px]"
                placeholder="e.g. Luxury Ocean View Villa"
                {...register('title', { required: 'Title is required', maxLength: 200 })}
              />
              {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="shortDesc" className="text-[13px] font-bold text-slate-700">Short Description</Label>
                  <span className="text-[13px] font-medium text-slate-400">{shortDesc.length} / 500</span>
                </div>
                <Textarea
                  id="shortDesc"
                  className="rounded-[16px] bg-white border-slate-200 shadow-sm text-[15px] p-4"
                  placeholder="A quick summary (max 500 characters)"
                  rows={7}
                  {...register('shortDesc', { maxLength: 500 })}
                />
                <AIActionRow fieldName="shortDesc" onAction={(action) => handleFieldAiAction(action, 'shortDesc')} generatingField={generatingField} />
                
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="description" className="text-[13px] font-bold text-slate-700">Full Description</Label>
                  <span className="text-[13px] font-medium text-slate-400">{description.length} / 2000</span>
                </div>
                <Textarea
                  id="description"
                  className="rounded-[16px] bg-white border-slate-200 shadow-sm text-[15px] p-4"
                  placeholder="Provide complete details about what you are offering..."
                  rows={7}
                  {...register('description')}
                />
                <AIActionRow fieldName="description" onAction={(action) => handleFieldAiAction(action, 'description')} generatingField={generatingField} />
                
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: Overview Content */}
        <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-8">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-blue-50 text-blue-600">
                <Layers3 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-[20px] font-black text-slate-900">Overview Content</h3>
                <p className="text-[13px] font-medium text-slate-500">These fields feed the Listing Detail Overview cards</p>
              </div>
            </div>
            <Button type="button" onClick={handleGenerateOverview} disabled={isGeneratingOverview} variant="outline" className="h-11 w-full sm:w-auto rounded-[16px] border-slate-200 bg-white text-[15px] font-bold text-slate-700 shadow-sm hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50">
              {isGeneratingOverview ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />} {isGeneratingOverview ? "Generating..." : "Generate All"}
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="overviewImageUrl" className="text-[13px] font-bold text-slate-700">Overview Image URL</Label>
              <IconInput icon={LinkIcon} id="overviewImageUrl" placeholder="Optional image used in About this stay" registration={register('overviewImageUrl')} />
              <AIBasicActionRow fieldName="overviewImageUrl" onAction={(action) => handleFieldAiAction(action, 'overviewImageUrl')} generatingField={generatingField} />
              
            </div>
            <div className="space-y-2">
              <Label htmlFor="neighborhoodSummary" className="text-[13px] font-bold text-slate-700">Neighborhood Summary</Label>
              <IconInput icon={MapPin} id="neighborhoodSummary" placeholder="A cozy part of central Da Lat" registration={register('neighborhoodSummary')} />
              <AIBasicActionRow fieldName="neighborhoodSummary" onAction={(action) => handleFieldAiAction(action, 'neighborhoodSummary')} generatingField={generatingField} />
              
            </div>
            <div className="space-y-2">
              <Label htmlFor="guestVibeTags" className="text-[13px] font-bold text-slate-700">Guest Vibe Tags</Label>
              <TagChipEditor tags={vibeTags} placeholder="Relaxing, Scenic, Quiet" onRemove={(tag) => removeTag('guestVibeTags', tag)} onAdd={(tag) => addTagFromInput('guestVibeTags', tag)} />
              <input type="hidden" {...register('guestVibeTags')} />
              <p className="text-[11px] font-medium text-slate-400 mt-1">Add up to 5 vibe tags</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="suitableForTags" className="text-[13px] font-bold text-slate-700">Suitable For Tags</Label>
              <TagChipEditor tags={suitableTags} placeholder="Business, Weekend getaway, Families" onRemove={(tag) => removeTag('suitableForTags', tag)} onAdd={(tag) => addTagFromInput('suitableForTags', tag)} />
              <input type="hidden" {...register('suitableForTags')} />
              <p className="text-[11px] font-medium text-slate-400 mt-1">Add up to 5 tags</p>
            </div>
            
            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="whyChoosePoints" className="text-[13px] font-bold text-slate-700">Why Travelers Choose This Stay</Label>
              <IconTextarea icon={ListChecks} id="whyChoosePoints" rows={3} placeholder="Comfort details that make stays easier&#10;Convenient base near the lake" registration={register('whyChoosePoints')} />
              <AIBasicActionRow fieldName="whyChoosePoints" onAction={(action) => handleFieldAiAction(action, 'whyChoosePoints')} generatingField={generatingField} />
              
            </div>
            <div className="space-y-2">
              <Label htmlFor="highlights" className="text-[13px] font-bold text-slate-700">Listing Highlights</Label>
              <Textarea id="highlights" className="rounded-[16px] bg-white border-slate-200 shadow-sm p-4 text-[15px]" rows={4} placeholder="Garden breakfast&#10;Pine valley views" {...register('highlights')} />
              <AIBasicActionRow fieldName="highlights" onAction={(action) => handleFieldAiAction(action, 'highlights')} generatingField={generatingField} />
              
            </div>
            <div className="space-y-2">
              <Label htmlFor="tripPlanningTips" className="text-[13px] font-bold text-slate-700">Trip Planning Tips</Label>
              <Textarea id="tripPlanningTips" className="rounded-[16px] bg-white border-slate-200 shadow-sm p-4 text-[15px]" rows={4} placeholder="Check-in from 14:00&#10;Parking support is available" {...register('tripPlanningTips')} />
              <AIBasicActionRow fieldName="tripPlanningTips" onAction={(action) => handleFieldAiAction(action, 'tripPlanningTips')} generatingField={generatingField} />
              
            </div>
            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="quickOverviewFacts" className="text-[13px] font-bold text-slate-700">Quick Overview Facts</Label>
              <Textarea id="quickOverviewFacts" className="rounded-[16px] bg-white border-slate-200 shadow-sm p-4 text-[15px]" rows={3} placeholder="Free high-speed Wi-Fi throughout&#10;24/7 provider support when you need it" {...register('quickOverviewFacts')} />
              <AIBasicActionRow fieldName="quickOverviewFacts" onAction={(action) => handleFieldAiAction(action, 'quickOverviewFacts')} generatingField={generatingField} />
              
            </div>
          </div>
        </div>

        {/* SECTION 4: Pricing */}
        <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-8">
          <div className="mb-8 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-blue-50 text-blue-600">
              <Coins className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-[20px] font-black text-slate-900">Pricing Strategy</h3>
              <p className="text-[13px] font-medium text-slate-500">Set your base nightly or package rate</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="basePrice" className="text-[13px] font-bold text-slate-700">Base Price (VND) *</Label>
              <div className="flex overflow-hidden rounded-[16px] border border-slate-200 bg-white shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                <span className="flex h-14 w-16 items-center justify-center border-r border-slate-100 bg-slate-50/50 text-[13px] font-black tracking-widest text-slate-500">VND</span>
                <Input
                  id="basePrice"
                  type="number"
                  min={0}
                  className="h-14 border-0 bg-transparent shadow-none focus:ring-0 text-[15px] font-medium"
                  {...register('basePrice', { required: 'Base price is required', valueAsNumber: true })}
                />
              </div>
              {errors.basePrice && <p className="text-sm text-red-500">{errors.basePrice.message}</p>}
            </div>
            
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[13px] font-bold text-slate-400">Smart Pricing (Beta)</Label>
                <div className="flex h-14 w-full items-center justify-between rounded-[16px] border border-dashed border-slate-300 bg-slate-50 px-5">
                  <span className="text-[15px] font-medium text-slate-400">AI Demand Pricing</span>
                  <button type="button" onClick={handleGeneratePricing} disabled={isGeneratingPrice} className="rounded-md bg-blue-100 hover:bg-blue-200 px-3 py-1 text-[12px] font-bold text-blue-700 transition flex items-center gap-1 disabled:opacity-50">
                    {isGeneratingPrice ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />} Generate AI Price
                  </button>
                </div>
              </div>
              
              {pricingAdvice && (
                <div className="rounded-xl bg-blue-50/50 p-4 border border-blue-100 space-y-3">
                  {pricingAdvice.explanation && (
                    <div>
                      <h4 className="text-[12px] font-bold text-blue-800 uppercase tracking-wider mb-1">Pricing Explanation</h4>
                      <p className="text-[13px] font-medium text-slate-600 leading-relaxed">{pricingAdvice.explanation}</p>
                    </div>
                  )}
                  {pricingAdvice.seasonalAdvice && (
                    <div>
                      <h4 className="text-[12px] font-bold text-emerald-800 uppercase tracking-wider mb-1">Seasonal Advice</h4>
                      <p className="text-[13px] font-medium text-slate-600 leading-relaxed">{pricingAdvice.seasonalAdvice}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Sticky Bottom Actions */}
      <div className="fixed bottom-0 left-0 z-40 w-full border-t border-slate-200 bg-white/95 p-4 shadow-[0_-4px_24px_rgba(0,0,0,0.05)] backdrop-blur-xl sm:static sm:mt-10 sm:w-auto sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none sm:backdrop-blur-none">
        <div className="mx-auto flex max-w-[1180px] justify-end">
          <Button type="submit" className="h-14 w-full sm:w-auto rounded-[16px] bg-[#2563EB] px-10 text-[15px] font-black text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg">
            Next Step
          </Button>
        </div>
      </div>
    </form>
  );
};

const AIActionRow = ({ fieldName, onAction, generatingField }: { fieldName: string, onAction: (a: string) => void, generatingField: string | null }) => (
  <div className="mt-3 flex flex-wrap items-center gap-2">
    <button type="button" onClick={() => onAction('Rewrite')} disabled={!!generatingField} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50 disabled:hover:translate-y-0">
      {generatingField === `${fieldName}-Rewrite` ? <Loader2 className="h-3 w-3 animate-spin" /> : <Type className="h-3 w-3" />} Rewrite
    </button>
    <button type="button" onClick={() => onAction('Expand')} disabled={!!generatingField} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50 disabled:hover:translate-y-0">
      {generatingField === `${fieldName}-Expand` ? <Loader2 className="h-3 w-3 animate-spin" /> : <Maximize2 className="h-3 w-3" />} Expand
    </button>
    <button type="button" onClick={() => onAction('Shorter')} disabled={!!generatingField} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50 disabled:hover:translate-y-0">
      {generatingField === `${fieldName}-Shorter` ? <Loader2 className="h-3 w-3 animate-spin" /> : <Minimize2 className="h-3 w-3" />} Shorter
    </button>
    <button type="button" onClick={() => onAction('Luxury')} disabled={!!generatingField} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition hover:-translate-y-0.5 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 disabled:opacity-50 disabled:hover:translate-y-0">
      {generatingField === `${fieldName}-Luxury` ? <Loader2 className="h-3 w-3 animate-spin" /> : <Crown className="h-3 w-3" />} Luxury
    </button>
    <button type="button" onClick={() => onAction('SEO')} disabled={!!generatingField} className="hidden lg:inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-50 disabled:hover:translate-y-0">
      {generatingField === `${fieldName}-SEO` ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />} SEO
    </button>
    <button type="button" onClick={() => onAction('Translate')} disabled={!!generatingField} className="hidden lg:inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-50 disabled:hover:translate-y-0">
      {generatingField === `${fieldName}-Translate` ? <Loader2 className="h-3 w-3 animate-spin" /> : <Globe2 className="h-3 w-3" />} Translate
    </button>
  </div>
);

const AIBasicActionRow = ({ fieldName, onAction, generatingField }: { fieldName: string, onAction: (a: string) => void, generatingField: string | null }) => (
  <div className="mt-3 flex flex-wrap items-center gap-2">
    <button type="button" onClick={() => onAction('Generate')} disabled={!!generatingField} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50 disabled:hover:translate-y-0">
      {generatingField === `${fieldName}-Generate` ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />} Generate
    </button>
    <button type="button" onClick={() => onAction('Improve')} disabled={!!generatingField} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50 disabled:hover:translate-y-0">
      {generatingField === `${fieldName}-Improve` ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />} Improve
    </button>
    <button type="button" onClick={() => onAction('Suggest')} disabled={!!generatingField} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50 disabled:hover:translate-y-0">
      {generatingField === `${fieldName}-Suggest` ? <Loader2 className="h-3 w-3 animate-spin" /> : <Rocket className="h-3 w-3" />} Suggest
    </button>
  </div>
);

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
