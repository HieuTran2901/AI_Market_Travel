import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  BedDouble,
  Building2,
  CalendarDays,
  Camera,
  Car,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  CreditCard,
  Dumbbell,
  ExternalLink,
  FileText,
  Headphones,
  Info,
  Map,
  MapPin,
  PawPrint,
  Printer,
  ReceiptText,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Star,
  Minus,
  Plus,
  Utensils,
  Waves,
  Wifi,
  XCircle,
  Users,
  WalletCards,
} from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { StateBlock } from '@/components/ui/StateBlock';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { BookingRequestModal } from '@/components/listing/BookingRequestModal';
import { ExtrasServicesTab } from '@/components/listing/ExtrasServicesTab';
import { PhotoLightbox } from '@/components/listing/PhotoLightbox';
import { ReviewSection } from '@/components/listing/ReviewSection';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { listingService } from '@/services/listingService';
import type { ListingResponse } from '@/types/listing';

type DetailTab = 'overview' | 'rates' | 'amenities' | 'location' | 'policies' | 'reviews' | 'extras';

type DetailItem = {
  key: string;
  label: string;
  value: string;
  helper?: string;
  icon: React.ElementType;
  tone?: 'blue' | 'emerald' | 'amber' | 'rose' | 'violet' | 'slate';
  positive?: boolean;
  imageUrl?: string;
};

const GuestVibePattern = () => (
  <svg
    aria-hidden="true"
    className="pointer-events-none absolute bottom-0 right-0 h-[82%] w-[52%] text-violet-600 opacity-[0.08]"
    viewBox="0 0 220 220"
    fill="none"
  >
    <path d="M8 160C42 130 72 130 104 160C136 190 170 190 212 150" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    <path d="M18 128C50 100 82 100 112 128C142 156 174 156 206 124" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M30 96C58 76 88 76 116 98C146 120 174 118 198 94" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M50 178L72 142L94 178H50Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
    <path d="M92 178L118 132L146 178H92Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
    <path d="M150 180L168 150L186 180H150Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
    <path d="M36 54C62 42 88 42 116 56C146 72 174 68 202 50" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const PerfectForPattern = () => (
  <svg
    aria-hidden="true"
    className="pointer-events-none absolute bottom-0 right-0 h-[86%] w-[56%] text-orange-500 opacity-[0.08]"
    viewBox="0 0 240 220"
    fill="none"
  >
    <path d="M10 168C42 142 70 142 100 168C132 196 168 196 226 154" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    <path d="M28 138L64 92L102 138H28Z" stroke="currentColor" strokeWidth="2.6" strokeLinejoin="round" />
    <path d="M90 140L132 78L176 140H90Z" stroke="currentColor" strokeWidth="2.6" strokeLinejoin="round" />
    <path d="M154 142L184 106L216 142H154Z" stroke="currentColor" strokeWidth="2.6" strokeLinejoin="round" />
    <path d="M144 46C160 32 184 32 200 46C214 58 224 58 234 50" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M186 72C200 60 216 60 230 70" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <circle cx="202" cy="82" r="16" stroke="currentColor" strokeWidth="2.4" />
  </svg>
);

function formatCategory(category: string) {
  return category.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: currency || 'VND',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'boolean') return value ? 'Available' : 'Not available';
  if (Array.isArray(value)) return value.filter(Boolean).join(', ');
  return String(value).replace(/_/g, ' ');
}

function starValue(value: unknown) {
  const formatted = formatValue(value);
  return formatted ? `${formatted}-star stay` : null;
}

function roomValue(value: unknown) {
  const formatted = formatValue(value);
  return formatted ? `${formatted} rooms` : null;
}

function dayValue(value: unknown) {
  const formatted = formatValue(value);
  return formatted ? `${formatted} day${Number(formatted) === 1 ? '' : 's'}` : null;
}

function peopleValue(value: unknown) {
  const formatted = formatValue(value);
  return formatted ? `Up to ${formatted} people` : null;
}

function textItem(
  details: Record<string, unknown>,
  key: string,
  label: string,
  icon: React.ElementType,
  helper?: string,
  tone: DetailItem['tone'] = 'blue',
  formatter?: (value: unknown) => string | null,
): DetailItem | null {
  const value = formatter ? formatter(details[key]) : formatValue(details[key]);
  if (!value) return null;
  return { key, label, value, helper, icon, tone };
}

function booleanItem(
  details: Record<string, unknown>,
  key: string,
  label: string,
  icon: React.ElementType,
  includedText = 'Available',
  helper?: string,
  tone: DetailItem['tone'] = 'emerald',
): DetailItem | null {
  const raw = details[key];
  if (raw === null || raw === undefined || raw === '') return null;
  const positive = raw === true;
  return {
    key,
    label,
    value: positive ? includedText : 'Not available',
    helper,
    icon: positive ? icon : XCircle,
    tone: positive ? tone : 'slate',
    positive,
  };
}

function getGalleryImages(listing: ListingResponse) {
  if (listing.images?.length) {
    return listing.images.map((image) => ({
      src: image.imageUrl,
      alt: image.altText || listing.title,
    }));
  }

  return listing.coverImageUrl ? [{ src: listing.coverImageUrl, alt: listing.title }] : [];
}

function getStayBasics(listing: ListingResponse): DetailItem[] {
  const details = listing.details || {};
  const hotelBasics = [
    textItem(details, 'starRating', 'Hotel category', Star, 'Premium stay classification.', 'amber', starValue),
    textItem(details, 'totalRooms', 'Stay size', Building2, 'A quick sense of property scale.', 'blue', roomValue),
    textItem(details, 'checkInTime', 'Check-in', Clock, 'Standard arrival time.', 'blue'),
    textItem(details, 'checkOutTime', 'Check-out', Clock, 'Standard departure time.', 'blue'),
  ].filter(Boolean) as DetailItem[];

  if (hotelBasics.length > 0) return hotelBasics;

  return [
    { key: 'category', label: 'Category', value: formatCategory(listing.category), helper: 'Marketplace category.', icon: Building2, tone: 'blue' },
    textItem(details, 'durationDays', 'Duration', CalendarDays, 'Expected trip length.', 'blue', dayValue),
    textItem(details, 'maxGroupSize', 'Group size', Users, 'Maximum travelers.', 'emerald', peopleValue),
    textItem(details, 'meetingPoint', 'Meeting point', MapPin, 'Where the experience begins.', 'amber'),
  ].filter(Boolean) as DetailItem[];
}

function getAmenities(listing: ListingResponse): DetailItem[] {
  const details = listing.details || {};
  if (Array.isArray(details.amenities) && details.amenities.length > 0) {
    return details.amenities
      .filter((amenity: any) => amenity?.status !== 'unavailable')
      .sort((a: any, b: any) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0))
      .map((amenity: any, index: number) => {
        const name = String(amenity.name || `Amenity ${index + 1}`);
        const source = name.toLowerCase();
        const icon = source.includes('pool') ? Waves
          : source.includes('spa') ? Sparkles
            : source.includes('fitness') || source.includes('gym') ? Dumbbell
              : source.includes('wi-fi') || source.includes('wifi') ? Wifi
                : source.includes('parking') ? Car
                  : source.includes('dining') || source.includes('restaurant') || source.includes('bar') ? Utensils
                    : CheckCircle2;
        return {
          key: `amenity-${index}-${source.replace(/\s+/g, '-')}`,
          label: name,
          value: amenity.status === 'included' ? 'Included' : amenity.status === 'paid' ? 'Paid' : 'Available',
          helper: amenity.description || amenity.fee || 'Available based on the current listing information.',
          icon,
          tone: 'emerald',
          positive: amenity.status !== 'unavailable',
          imageUrl: amenity.imageUrl,
        };
      });
  }
  return [
    booleanItem(details, 'hasPool', 'Swimming pool', Waves, 'Available', 'Relax with pool access.'),
    booleanItem(details, 'hasSpa', 'Spa access', Sparkles, 'Available', 'Wellness facilities available.'),
    booleanItem(details, 'hasGym', 'Fitness center', Dumbbell, 'Available', 'Keep your routine while traveling.'),
    booleanItem(details, 'hasFreeWifi', 'Free Wi-Fi', Wifi, 'Included', 'Stay connected throughout your visit.'),
    booleanItem(details, 'hasBreakfast', 'Breakfast', Utensils, 'Included', 'Breakfast may be included.'),
    booleanItem(details, 'hasParking', 'Parking', Car, 'Available', 'Parking support for guests.'),
    booleanItem(details, 'hasRestaurant', 'Dining & bar', Utensils, 'Available', 'On-site dining options.'),
    booleanItem(details, 'hasRoomService', 'Room service', Utensils, 'Available', 'Meals in your room.'),
    booleanItem(details, 'hasAirConditioning', 'Air conditioning', Sparkles, 'Available', 'Climate comfort available.'),
    booleanItem(details, 'hasBeachAccess', 'Beach access', Waves, 'Available', 'Beach access for guests.'),
    booleanItem(details, 'hasElevator', 'Elevator', Building2, 'Available', 'Elevator access available.'),
    booleanItem(details, 'hasConcierge', 'Concierge', ShieldCheck, 'Available', 'Guest support available.'),
  ].filter(Boolean) as DetailItem[];
}

function getPolicies(listing: ListingResponse): DetailItem[] {
  const details = listing.details || {};
  return [
    booleanItem(details, 'petFriendly', 'Pet friendly', PawPrint, 'Pets welcome', 'Provider policy for pets.', 'amber'),
    booleanItem(details, 'smokingAllowed', 'Smoking', Info, 'Allowed', 'Provider smoking policy.', 'rose'),
    booleanItem(details, 'childrenAllowed', 'Children', Users, 'Welcome', 'Children policy.', 'blue'),
    booleanItem(details, 'eventsAllowed', 'Events & parties', Sparkles, 'Allowed', 'Events policy.', 'rose'),
  ].filter(Boolean) as DetailItem[];
}

function amenityLabels(listing: ListingResponse) {
  return getAmenities(listing)
    .filter((item) => item.positive !== false)
    .map((item) => item.label);
}

const amenityImageMap = [
  {
    terms: ['pool', 'swimming'],
    src: 'https://images.unsplash.com/photo-1575429198097-0414ec08e8cd?auto=format&fit=crop&w=900&q=80',
  },
  {
    terms: ['spa', 'wellness'],
    src: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=900&q=80',
  },
  {
    terms: ['gym', 'fitness'],
    src: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=900&q=80',
  },
  {
    terms: ['wi-fi', 'wifi', 'internet'],
    src: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=900&q=80',
  },
  {
    terms: ['parking', 'car'],
    src: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80',
  },
  {
    terms: ['dining', 'restaurant', 'bar', 'breakfast'],
    src: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80',
  },
  {
    terms: ['room service', 'concierge'],
    src: 'https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?auto=format&fit=crop&w=900&q=80',
  },
  {
    terms: ['air conditioning', 'elevator'],
    src: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80',
  },
  {
    terms: ['beach'],
    src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80',
  },
];

function amenityImageFor(item: DetailItem, fallback?: string) {
  if (item.imageUrl) return item.imageUrl;
  const source = `${item.label} ${item.value} ${item.helper || ''}`.toLowerCase();
  return amenityImageMap.find((entry) => entry.terms.some((term) => source.includes(term)))?.src || fallback || amenityImageMap[7].src;
}

function amenityImagePositionFor(item: DetailItem) {
  const source = `${item.label} ${item.value} ${item.helper || ''}`.toLowerCase();

  if (source.includes('pool') || source.includes('swimming')) return '62% center';
  if (source.includes('spa') || source.includes('wellness')) return '72% center';
  if (source.includes('gym') || source.includes('fitness')) return '76% center';
  if (source.includes('wi-fi') || source.includes('wifi') || source.includes('internet')) return '70% center';
  if (source.includes('parking') || source.includes('car')) return '76% center';
  if (source.includes('dining') || source.includes('restaurant') || source.includes('bar')) return '78% center';

  return '72% center';
}

function textIncludes(source: string, terms: string[]) {
  const normalized = source.toLowerCase();
  return terms.some((term) => normalized.includes(term));
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item || '').trim()).filter(Boolean);
}

function detailItemsFromLabels(
  labels: string[],
  label: string,
  icon: React.ElementType,
  tone: DetailItem['tone'] = 'blue',
): DetailItem[] {
  return labels.map((value, index) => ({
    key: `${label.toLowerCase().replace(/\s+/g, '-')}-${index}`,
    label,
    value,
    icon,
    tone,
  }));
}

function deriveChoiceHighlights(listing: ListingResponse, amenityNames: string[], location: string) {
  const source = `${listing.title} ${listing.shortDesc || ''} ${listing.description || ''} ${location}`.toLowerCase();
  const highlights: string[] = [];

  const add = (condition: boolean, label: string) => {
    if (condition && !highlights.includes(label)) highlights.push(label);
  };

  add(amenityNames.includes('Beach access') || textIncludes(source, ['beach', 'ocean', 'sea', 'coast']), 'Scenic coastal setting for a relaxed trip');
  add(amenityNames.includes('Swimming pool'), 'Pool access for slower vacation days');
  add(amenityNames.includes('Spa access') || amenityNames.includes('Fitness center'), 'Wellness-friendly facilities available');
  add(amenityNames.includes('Free Wi-Fi') || amenityNames.includes('Room service'), 'Comfort details that make stays easier');
  add(Boolean(listing.city), `Convenient base in ${listing.city}`);
  add(Boolean(listing.averageRating && listing.averageRating >= 4.5), 'Strong guest rating from traveler feedback');
  add(textIncludes(source, ['modern', 'new', 'suite', 'luxury', 'premium']), 'Modern stay experience with elevated touches');
  add(Boolean(listing.providerName), 'Managed by a verified marketplace provider');

  return highlights.slice(0, 5);
}

function deriveVibes(listing: ListingResponse, amenityNames: string[]) {
  const source = `${listing.title} ${listing.shortDesc || ''} ${listing.description || ''}`.toLowerCase();
  const vibes: DetailItem[] = [];
  const add = (key: string, condition: boolean, value: string, icon: React.ElementType, tone: DetailItem['tone']) => {
    if (condition) vibes.push({ key, label: 'Vibe', value, icon, tone });
  };

  add('relaxing', textIncludes(source, ['relax', 'quiet', 'retreat', 'escape']) || amenityNames.includes('Spa access'), 'Relaxing', Sparkles, 'emerald');
  add('scenic', textIncludes(source, ['view', 'scenic', 'ocean', 'beach', 'sea']) || amenityNames.includes('Beach access'), 'Scenic', Waves, 'blue');
  add('modern', textIncludes(source, ['modern', 'new', 'suite', 'premium']), 'Modern', Building2, 'blue');
  add('wellness', amenityNames.includes('Spa access') || amenityNames.includes('Fitness center'), 'Wellness', Dumbbell, 'emerald');
  add('family', textIncludes(source, ['family', 'children']) || listing.details?.childrenAllowed === true, 'Family-friendly', Users, 'amber');
  add('food', amenityNames.includes('Dining & bar') || amenityNames.includes('Breakfast'), 'Food-friendly', Utensils, 'rose');

  if (vibes.length === 0) {
    vibes.push({ key: 'comfortable', label: 'Vibe', value: 'Comfortable', icon: CheckCircle2, tone: 'blue' });
  }

  return vibes.slice(0, 6);
}

function deriveExperienceSignals(listing: ListingResponse, amenityNames: string[]) {
  const source = `${listing.title} ${listing.shortDesc || ''} ${listing.description || ''}`.toLowerCase();
  const signals: DetailItem[] = [];
  const add = (key: string, condition: boolean, value: string, icon: React.ElementType, tone: DetailItem['tone']) => {
    if (condition) signals.push({ key, label: 'Experience signal', value, icon, tone });
  };

  add('quiet', textIncludes(source, ['quiet', 'peaceful', 'calm', 'retreat']), 'Quiet moments', Sparkles, 'violet');
  add('views', textIncludes(source, ['view', 'scenic', 'ocean', 'sea', 'beach']) || amenityNames.includes('Beach access'), 'Scenic views', Waves, 'blue');
  add('recharge', amenityNames.includes('Spa access') || amenityNames.includes('Swimming pool') || amenityNames.includes('Fitness center'), 'Unwind & recharge', Dumbbell, 'emerald');
  add('dining', amenityNames.includes('Dining & bar') || amenityNames.includes('Breakfast'), 'Easy dining', Utensils, 'rose');

  return signals.slice(0, 3);
}

function deriveTravelerSegments(listing: ListingResponse, amenityNames: string[]) {
  const source = `${listing.title} ${listing.shortDesc || ''} ${listing.description || ''}`.toLowerCase();
  const segments: DetailItem[] = [];
  const add = (key: string, condition: boolean, value: string, icon: React.ElementType, tone: DetailItem['tone']) => {
    if (condition) segments.push({ key, label: 'Perfect for', value, icon, tone });
  };

  add('couples', textIncludes(source, ['couple', 'romantic', 'honeymoon', 'spa']) || amenityNames.includes('Spa access'), 'Couples', Star, 'rose');
  add('families', textIncludes(source, ['family', 'children']) || listing.details?.childrenAllowed === true, 'Families', Users, 'amber');
  add('business', amenityNames.includes('Free Wi-Fi') || textIncludes(source, ['business', 'work']), 'Business', WalletCards, 'blue');
  add('weekend', Boolean(listing.city || amenityNames.includes('Parking')), 'Weekend getaway', CalendarDays, 'emerald');
  add('wellness', amenityNames.includes('Spa access') || amenityNames.includes('Fitness center'), 'Wellness travelers', Sparkles, 'emerald');

  return segments.slice(0, 4);
}

function derivePlanningTips(listing: ListingResponse, amenityNames: string[], location: string): DetailItem[] {
  const details = listing.details || {};
  const tips: DetailItem[] = [];

  const checkIn = formatValue(details.checkInTime);
  if (checkIn) {
    tips.push({ key: 'check-in-tip', label: 'Check-in tip', value: `Check-in from ${checkIn}`, helper: 'Final arrival instructions are confirmed after booking.', icon: Clock, tone: 'blue' });
  }

  if (amenityNames.includes('Parking')) {
    tips.push({ key: 'parking-tip', label: 'Getting here', value: 'Parking support is available', helper: location || 'Review the Location tab before arrival.', icon: Car, tone: 'emerald' });
  } else if (location) {
    tips.push({ key: 'location-tip', label: 'Getting here', value: listing.city ? `Plan around ${listing.city}` : 'Review the location before arrival', helper: location, icon: MapPin, tone: 'blue' });
  }

  if (amenityNames.includes('Breakfast')) {
    tips.push({ key: 'breakfast-tip', label: 'Morning plan', value: 'Breakfast may be included', helper: 'Confirm inclusions before checkout.', icon: Utensils, tone: 'amber' });
  }

  if (amenityNames.includes('Beach access')) {
    tips.push({ key: 'beach-tip', label: 'Trip style', value: 'Beach access is available', helper: 'Pack for a relaxed coastal itinerary.', icon: Waves, tone: 'blue' });
  }

  return tips.slice(0, 3);
}

function deriveQuickOverviewSignals(listing: ListingResponse, amenityNames: string[], location: string): DetailItem[] {
  const source = `${listing.title} ${listing.shortDesc || ''} ${listing.description || ''} ${location}`.toLowerCase();
  const signals: DetailItem[] = [];
  const add = (key: string, condition: boolean, value: string, helper: string, icon: React.ElementType, tone: DetailItem['tone']) => {
    if (condition && !signals.some((item) => item.key === key)) {
      signals.push({ key, label: 'Quick overview', value, helper, icon, tone });
    }
  };

  add('coastal', textIncludes(source, ['beach', 'ocean', 'sea', 'coast']) || amenityNames.includes('Beach access'), 'Coastal setting', listing.city ? `Explore ${listing.city} from here.` : 'Travel-friendly setting.', Waves, 'blue');
  add('wellness', amenityNames.includes('Spa access') || amenityNames.includes('Swimming pool'), 'Pool or spa time', 'Relax and unwind between plans.', Sparkles, 'emerald');
  add('dining', amenityNames.includes('Dining & bar') || amenityNames.includes('Breakfast'), 'Dining convenience', 'Food and breakfast details may be available.', Utensils, 'rose');
  add('connected', amenityNames.includes('Free Wi-Fi'), 'Easy to stay connected', 'Helpful for work or planning on the go.', Wifi, 'blue');
  add('destination', Boolean(listing.city), 'Destination context', listing.city ? `Located in ${listing.city}.` : 'Check the Location tab for context.', MapPin, 'violet');
  add('provider', Boolean(listing.providerName), 'Provider support', 'Managed by a marketplace provider.', ShieldCheck, 'slate');

  return signals.slice(0, 4);
}

const toneClasses = {
  blue: 'bg-blue-50 text-blue-600 ring-blue-100',
  emerald: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
  amber: 'bg-amber-50 text-amber-600 ring-amber-100',
  rose: 'bg-rose-50 text-rose-600 ring-rose-100',
  violet: 'bg-violet-50 text-violet-600 ring-violet-100',
  slate: 'bg-slate-100 text-slate-600 ring-slate-200',
};

const DetailItemCard = ({ item }: { item: DetailItem }) => {
  const Icon = item.icon;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/85 p-4">
      <div className="flex items-start gap-3">
        <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ring-1', toneClasses[item.tone || 'blue'])}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-500">{item.label}</p>
          <p className="mt-1 break-words text-sm font-black text-slate-950">{item.value}</p>
          {item.helper && <p className="mt-1 text-xs leading-5 text-slate-500">{item.helper}</p>}
        </div>
      </div>
    </div>
  );
};

const policyCardStyles: Record<string, { card: string; icon: string; label: string; decoration: string }> = {
  'pet-policy': {
    card: 'border-emerald-200/80 bg-emerald-50/55 shadow-emerald-100/40',
    icon: 'bg-emerald-100/80 text-emerald-600 ring-emerald-200',
    label: 'text-emerald-700',
    decoration: 'text-emerald-500',
  },
  'check-times': {
    card: 'border-blue-200/80 bg-blue-50/60 shadow-blue-100/40',
    icon: 'bg-blue-100/80 text-blue-600 ring-blue-200',
    label: 'text-blue-700',
    decoration: 'text-blue-500',
  },
  'payment-methods': {
    card: 'border-violet-200/80 bg-violet-50/55 shadow-violet-100/40',
    icon: 'bg-violet-100/80 text-violet-600 ring-violet-200',
    label: 'text-violet-700',
    decoration: 'text-violet-500',
  },
  'cancellation-policy': {
    card: 'border-orange-200/80 bg-orange-50/55 shadow-orange-100/40',
    icon: 'bg-orange-100/80 text-orange-600 ring-orange-200',
    label: 'text-orange-700',
    decoration: 'text-orange-500',
  },
  'refund-policy': {
    card: 'border-teal-200/80 bg-teal-50/55 shadow-teal-100/40',
    icon: 'bg-teal-100/80 text-teal-600 ring-teal-200',
    label: 'text-teal-700',
    decoration: 'text-teal-500',
  },
};

const PolicyCardPattern = ({ type, className }: { type: string; className?: string }) => {
  if (type === 'pet-policy') {
    return (
      <svg aria-hidden="true" className={className} viewBox="0 0 220 220" fill="none">
        <path d="M-8 172C34 148 72 148 112 174C148 198 184 198 228 164" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M-8 190C34 166 72 166 112 192C148 216 184 216 228 182" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M157 78C149 78 145 86 145 94C145 105 151 112 158 112C165 112 170 104 170 94C170 85 165 78 157 78Z" fill="currentColor" />
        <path d="M126 92C119 92 114 99 114 108C114 117 119 124 126 124C133 124 138 117 138 108C138 99 133 92 126 92Z" fill="currentColor" />
        <path d="M188 92C181 92 176 99 176 108C176 117 181 124 188 124C195 124 200 117 200 108C200 99 195 92 188 92Z" fill="currentColor" />
        <path d="M157 120C140 120 127 132 127 148C127 160 137 166 157 166C177 166 187 160 187 148C187 132 174 120 157 120Z" fill="currentColor" />
      </svg>
    );
  }

  if (type === 'check-times') {
    return (
      <svg aria-hidden="true" className={className} viewBox="0 0 220 220" fill="none">
        <circle cx="168" cy="168" r="74" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="168" cy="168" r="48" stroke="currentColor" strokeWidth="2" />
        <path d="M168 130V170L198 188" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <path d="M26 178C54 154 86 154 116 178" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="204" cy="116" r="5" fill="currentColor" />
      </svg>
    );
  }

  if (type === 'payment-methods') {
    return (
      <svg aria-hidden="true" className={className} viewBox="0 0 220 220" fill="none">
        <rect x="104" y="128" width="96" height="58" rx="12" transform="rotate(-12 104 128)" stroke="currentColor" strokeWidth="3" />
        <path d="M112 146L206 126" stroke="currentColor" strokeWidth="9" strokeLinecap="round" />
        <rect x="38" y="164" width="112" height="68" rx="14" transform="rotate(-9 38 164)" fill="currentColor" opacity=".22" />
        <path d="M176 70H198V92" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M44 74H58V88H44V74Z" stroke="currentColor" strokeWidth="2" />
        <circle cx="198" cy="106" r="4" fill="currentColor" />
      </svg>
    );
  }

  if (type === 'cancellation-policy') {
    return (
      <svg aria-hidden="true" className={className} viewBox="0 0 220 220" fill="none">
        <rect x="100" y="124" width="98" height="78" rx="14" stroke="currentColor" strokeWidth="3" />
        <path d="M100 150H198" stroke="currentColor" strokeWidth="3" />
        <path d="M126 110V136M172 110V136" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
        <path d="M38 74H42M68 74H72M98 74H102M38 104H42M68 104H72M98 104H102M38 134H42M68 134H72" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
        <path d="M154 176L174 196M174 176L154 196" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 220 220" fill="none">
      <path d="M104 74H166L198 106V194H104V74Z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
      <path d="M166 74V106H198" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
      <path d="M128 146L148 166L184 128" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M30 92H36M58 76H64M52 142H58M78 122H84M34 172H40" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
};

const SectionTitle = ({
  icon: Icon,
  title,
  description,
  tone = 'blue',
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
  tone?: DetailItem['tone'];
}) => (
  <div className="flex items-start gap-3">
    <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1', toneClasses[tone])}>
      <Icon className="h-5 w-5" />
    </span>
    <div>
      <h2 className="text-lg font-black text-slate-950">{title}</h2>
      {description && <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>}
    </div>
  </div>
);

const InfoCard = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn('motion-card-hover h-auto w-full min-w-0 max-w-full self-start rounded-3xl border border-slate-200 bg-white p-5 shadow-sm 2xl:p-6', className)}>{children}</div>
);

const ImageFallback = ({ title, className }: { title: string; className?: string }) => (
  <div className={cn('flex h-full min-h-[220px] w-full items-center justify-center bg-gradient-to-br from-blue-100 via-cyan-50 to-slate-100', className)}>
    <div className="text-center text-blue-700">
      <Camera className="mx-auto h-10 w-10" />
      <p className="mt-3 text-sm font-black">{title}</p>
    </div>
  </div>
);

const LocationExplorerMap = ({
  address,
  city,
  country,
  latitude,
  longitude,
}: {
  address: string;
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
}) => {
  const [zoom, setZoom] = useState(1);
  const locationLabel = [address, city, country].filter(Boolean).join(', ');
  const mapQuery = latitude != null && longitude != null
    ? `${latitude},${longitude}`
    : locationLabel;

  return (
    <div className="relative min-h-[430px] w-full overflow-hidden rounded-[22px] border border-blue-100 bg-[#e9f4f7] shadow-sm sm:min-h-[500px]">
      <div
        className="absolute inset-0 origin-center transition-transform duration-300"
        style={{ transform: `scale(${zoom})` }}
      >
        <svg aria-hidden="true" className="h-full w-full" viewBox="0 0 900 560" preserveAspectRatio="xMidYMid slice">
          <rect width="900" height="560" fill="#eef3f1" />
          <path d="M560 -30C646 72 623 156 690 226C755 294 748 390 936 455V-30H560Z" fill="#b9e8f4" />
          <path d="M610 -20C666 90 652 148 710 216C770 286 766 358 916 420" fill="none" stroke="#7dd3e8" strokeWidth="3" opacity=".55" />
          <path d="M520 -20C582 82 548 170 610 244C668 314 652 430 742 590" fill="none" stroke="#fde9a9" strokeWidth="18" opacity=".85" />
          <path d="M510 -20C572 84 538 174 600 250C656 320 642 432 730 590" fill="none" stroke="#ffffff" strokeWidth="11" />
          <path d="M-20 78C128 134 216 90 356 150C468 198 534 284 606 324" fill="none" stroke="#ffffff" strokeWidth="13" />
          <path d="M20 486C168 398 252 430 366 344C432 294 474 244 548 214" fill="none" stroke="#ffffff" strokeWidth="12" />
          <path d="M72 -20C142 86 122 184 198 248C278 316 286 414 330 590" fill="none" stroke="#ffffff" strokeWidth="10" />
          <path d="M270 -20C298 102 272 204 342 276C406 342 422 430 450 590" fill="none" stroke="#ffffff" strokeWidth="8" />
          <path d="M-20 246C126 222 250 244 370 194C458 158 510 116 574 96" fill="none" stroke="#d6dde0" strokeWidth="4" />
          <path d="M-20 376C114 340 204 360 320 310C414 270 472 222 532 194" fill="none" stroke="#d6dde0" strokeWidth="4" />
          <path d="M80 116L168 90L224 142L194 202L104 196Z" fill="#ccebd8" />
          <path d="M354 44L452 18L506 74L470 132L378 120Z" fill="#d2eddd" />
          <path d="M150 356L246 326L286 384L242 446L162 432Z" fill="#d1ebda" />
          <g fill="#dce3e5" opacity=".85">
            <rect x="38" y="280" width="70" height="42" rx="5" />
            <rect x="122" y="266" width="52" height="62" rx="5" />
            <rect x="212" y="214" width="72" height="48" rx="5" />
            <rect x="300" y="186" width="48" height="66" rx="5" />
            <rect x="360" y="380" width="62" height="46" rx="5" />
            <rect x="444" y="334" width="52" height="68" rx="5" />
          </g>
          <text x="650" y="155" fill="#0891b2" fontSize="22" fontWeight="700">Coastal area</text>
          <text x="96" y="236" fill="#64748b" fontSize="18" fontWeight="700">{city || 'Destination'}</text>
          <text x="382" y="292" fill="#64748b" fontSize="15" fontWeight="600">Main route</text>
        </svg>
      </div>

      <button
        type="button"
        onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`, '_blank', 'noopener,noreferrer')}
        className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-xl border border-white/80 bg-white px-4 py-3 text-sm font-black text-blue-700 shadow-lg shadow-slate-300/40 transition hover:-translate-y-0.5 hover:text-blue-800"
      >
        View on map <ExternalLink className="h-4 w-4" />
      </button>

      <div className="absolute left-[52%] top-[48%] -translate-x-1/2 -translate-y-1/2">
        <div className="relative flex items-center">
          <span className="motion-map-marker relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-[6px] border-white bg-blue-600 text-white shadow-xl shadow-blue-900/25">
            <MapPin className="h-7 w-7 fill-current" />
          </span>
          <div className="motion-map-tooltip -ml-2 min-w-[210px] rounded-2xl bg-white py-3 pl-5 pr-4 shadow-xl ring-1 ring-slate-200/80">
            <p className="text-sm font-black text-slate-950">{address || city || 'Listing location'}</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{[city, country].filter(Boolean).join(', ')}</p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-xl border border-white/80 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-lg shadow-slate-300/30">
        <Car className="h-4 w-4 text-blue-600" /> Plan your route after booking
      </div>

      <div className="absolute bottom-4 right-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
        <button type="button" aria-label="Zoom in" onClick={() => setZoom((value) => Math.min(1.18, value + 0.06))} className="flex h-10 w-10 items-center justify-center text-slate-700 transition hover:bg-blue-50 hover:text-blue-600"><Plus className="h-4 w-4" /></button>
        <button type="button" aria-label="Zoom out" onClick={() => setZoom((value) => Math.max(1, value - 0.06))} className="flex h-10 w-10 items-center justify-center border-t border-slate-200 text-slate-700 transition hover:bg-blue-50 hover:text-blue-600"><Minus className="h-4 w-4" /></button>
      </div>
    </div>
  );
};

const CompactLocationPreview = ({ location }: { location: string }) => (
  <div className="overview-compact-location">
    <div className="relative aspect-[4/3] max-h-[190px] min-h-[150px] w-full overflow-hidden rounded-2xl bg-gradient-to-r from-blue-100 via-cyan-100 to-sky-200">
      <div className="absolute inset-0 opacity-60 [background-image:linear-gradient(rgba(255,255,255,.45)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.45)_1px,transparent_1px)] [background-size:24px_24px]" />
      <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-blue-600 p-3 text-white shadow-lg">
        <MapPin className="h-5 w-5" />
      </div>
    </div>
    <div className="min-w-0">
      <h3 className="text-base font-black text-slate-950">{location.split(',')[0] || 'Location'}</h3>
      <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">{location || 'Location details are confirmed after booking.'}</p>
      <p className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold leading-6 text-blue-800">
        Exact meeting or check-in instructions are confirmed after booking.
      </p>
    </div>
  </div>
);

const LoadingSkeleton = () => (
  <div className="mx-auto w-full max-w-[1680px] px-5 py-8 lg:px-8 2xl:px-10">
    <div className="h-8 w-80 animate-pulse rounded-full bg-slate-100" />
    <div className="mt-6 h-[420px] animate-pulse rounded-[28px] bg-slate-100" />
    <div className="mt-5 grid gap-4 md:grid-cols-4">
      {[1, 2, 3, 4].map((item) => <div key={item} className="h-24 animate-pulse rounded-3xl bg-slate-100" />)}
    </div>
  </div>
);

export const ListingDetail: React.FC = () => {
  const { slug, id } = useParams<{ slug?: string; id?: string }>();
  const listingSlug = slug ?? id;
  const navigate = useNavigate();
  const routeLocation = useLocation();
  const { isAuthenticated } = useAuth();
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingMode, setBookingMode] = useState<'checkout' | 'cart'>('checkout');
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [loginPromptAction, setLoginPromptAction] = useState<'book' | 'cart'>('book');
  const [cartNotice, setCartNotice] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [showAllPolicies, setShowAllPolicies] = useState(false);
  const [showMobileBookingBar, setShowMobileBookingBar] = useState(false);
  const [bookingEmphasis, setBookingEmphasis] = useState(false);
  const bookingCardRef = useRef<HTMLElement | null>(null);
  const activeTabRef = useRef<HTMLButtonElement | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['listing', listingSlug],
    queryFn: () => listingService.getListingBySlug(listingSlug as string),
    enabled: !!listingSlug,
  });

  useEffect(() => {
    if (!cartNotice) return;
    const timeout = window.setTimeout(() => setCartNotice(null), 5000);
    return () => window.clearTimeout(timeout);
  }, [cartNotice]);

  useEffect(() => {
    const bookingCard = bookingCardRef.current;
    if (!bookingCard || typeof window === 'undefined' || !('IntersectionObserver' in window)) return;

    const mobileQuery = window.matchMedia('(max-width: 767px)');
    const observer = new IntersectionObserver(
      ([entry]) => setShowMobileBookingBar(mobileQuery.matches && !entry.isIntersecting),
      { threshold: 0.12 },
    );

    observer.observe(bookingCard);
    const handleMediaChange = () => {
      if (!mobileQuery.matches) setShowMobileBookingBar(false);
    };
    mobileQuery.addEventListener('change', handleMediaChange);

    return () => {
      observer.disconnect();
      mobileQuery.removeEventListener('change', handleMediaChange);
    };
  }, [data?.data?.id]);

  useEffect(() => {
    const activeTabButton = activeTabRef.current;
    if (!activeTabButton || typeof window === 'undefined') return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    activeTabButton.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
  }, [activeTab]);

  useEffect(() => {
    if (!data?.data) return;
    setBookingEmphasis(true);
    const timeout = window.setTimeout(() => setBookingEmphasis(false), 1200);
    return () => window.clearTimeout(timeout);
  }, [data?.data?.basePrice, data?.data?.currency]);

  if (isLoading) return <LoadingSkeleton />;

  if (isError || !data?.data) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
        <StateBlock
          variant="error"
          title="Listing not found"
          description="This listing may have been removed, archived, or the link may no longer be valid."
          className="border-blue-100 bg-gradient-to-br from-white to-blue-50/50 shadow-sm"
        />
        <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
          <Button variant="outline" onClick={() => navigate('/')}><ArrowLeft className="mr-2 h-4 w-4" /> Back to Home</Button>
          <Button onClick={() => navigate('/search')}>Explore Listings</Button>
        </div>
      </div>
    );
  }

  const listing = data.data;
  const galleryImages = getGalleryImages(listing);
  const previewImages = galleryImages.slice(0, 5);
  const stayBasics = getStayBasics(listing);
  const amenities = getAmenities(listing);
  const policies = getPolicies(listing);
  const amenityNames = amenityLabels(listing);
  const ratingLabel = listing.averageRating ? listing.averageRating.toFixed(1) : 'New';
  const location = [listing.address, listing.city, listing.country].filter(Boolean).join(', ');

  const tabs: Array<{ id: DetailTab; label: string; icon: React.ElementType }> = [
    { id: 'overview', label: 'Overview', icon: Building2 },
    { id: 'rates', label: listing.category === 'HOTEL' ? 'Rooms & Rates' : 'Details & Rates', icon: BedDouble },
    { id: 'amenities', label: 'Amenities', icon: Sparkles },
    { id: 'location', label: 'Location', icon: MapPin },
    { id: 'policies', label: 'Policies', icon: ShieldCheck },
    { id: 'reviews', label: `Reviews (${listing.reviewCount})`, icon: Star },
    { id: 'extras', label: 'Extras & Services', icon: ShoppingBag },
  ];

  const providerDetails = listing.details || {};
  const overviewImage = formatValue(providerDetails.overviewImageUrl)
    ? { src: String(providerDetails.overviewImageUrl), alt: `${listing.title} overview` }
    : previewImages[0];
  const choiceHighlights = stringArray(providerDetails.whyChoosePoints).length
    ? stringArray(providerDetails.whyChoosePoints)
    : deriveChoiceHighlights(listing, amenityNames, location);
  const guestVibes = stringArray(providerDetails.guestVibeTags).length
    ? detailItemsFromLabels(stringArray(providerDetails.guestVibeTags), 'Vibe', Sparkles, 'violet')
    : deriveVibes(listing, amenityNames);
  const experienceSignals = stringArray(providerDetails.highlights).length
    ? detailItemsFromLabels(stringArray(providerDetails.highlights), 'Experience signal', CheckCircle2, 'emerald')
    : deriveExperienceSignals(listing, amenityNames);
  const travelerSegments = stringArray(providerDetails.suitableForTags).length
    ? detailItemsFromLabels(stringArray(providerDetails.suitableForTags), 'Perfect for', Users, 'amber')
    : deriveTravelerSegments(listing, amenityNames);
  const planningTips = stringArray(providerDetails.tripPlanningTips).length
    ? detailItemsFromLabels(stringArray(providerDetails.tripPlanningTips), 'Trip planning tip', Clock, 'blue')
    : derivePlanningTips(listing, amenityNames, location);
  const quickOverviewSignals = stringArray(providerDetails.quickOverviewFacts).length
    ? detailItemsFromLabels(stringArray(providerDetails.quickOverviewFacts), 'Quick overview', Info, 'blue')
    : deriveQuickOverviewSignals(listing, amenityNames, location);
  const compactHighlights = [
    amenityNames.length > 0 ? `${amenityNames.length} listed amenities` : null,
    listing.city ? `Located in ${listing.city}` : null,
    listing.averageRating ? `${listing.averageRating.toFixed(1)} average rating` : null,
    formatCategory(listing.category),
  ].filter(Boolean) as string[];
  const isGuestFavorite = Boolean(listing.averageRating && listing.averageRating >= 4.5 && listing.reviewCount > 0);
  const locationSource = `${listing.title} ${listing.shortDesc || ''} ${listing.description || ''} ${location}`.toLowerCase();
  const isCoastalLocation = textIncludes(locationSource, ['beach', 'ocean', 'sea', 'coast']) || amenityNames.includes('Beach access');
  const locationBadges = [
    formatValue(providerDetails.locationType) || (isCoastalLocation ? 'Coastal setting' : null),
    formatValue(providerDetails.areaNeighborhood),
    listing.city || null,
    listing.latitude != null && listing.longitude != null ? 'Mapped location' : null,
  ].filter(Boolean) as string[];
  const nearbyContext: Array<{ label: string; detail: string; icon: React.ElementType; tone: string }> = Array.isArray(providerDetails.nearbyPlaces) && providerDetails.nearbyPlaces.length
    ? providerDetails.nearbyPlaces.map((place: any) => ({
      label: place.name || 'Nearby place',
      detail: [place.travelTime, place.distance].filter(Boolean).join(' · ') || 'Nearby',
      icon: MapPin,
      tone: 'text-blue-600 bg-blue-50',
    }))
    : [];
  if (nearbyContext.length === 0) {
    if (listing.city) nearbyContext.push({ label: listing.city, detail: 'Current destination', icon: MapPin, tone: 'text-blue-600 bg-blue-50' });
    if (listing.address) nearbyContext.push({ label: listing.address, detail: 'Listing address', icon: Map, tone: 'text-violet-600 bg-violet-50' });
    if (amenityNames.includes('Beach access')) nearbyContext.push({ label: 'Beach access', detail: 'Listed amenity', icon: Waves, tone: 'text-cyan-600 bg-cyan-50' });
    if (amenityNames.includes('Parking')) nearbyContext.push({ label: 'Parking', detail: 'Available at the property', icon: Car, tone: 'text-emerald-600 bg-emerald-50' });
    if (amenityNames.includes('Dining & bar') || amenityNames.includes('Breakfast')) nearbyContext.push({ label: 'Dining options', detail: 'Available with this listing', icon: Utensils, tone: 'text-rose-600 bg-rose-50' });
  }
  const localTravelContext = stringArray(providerDetails.localTravelContext).length ? stringArray(providerDetails.localTravelContext) : [
    listing.city ? `A practical base for exploring ${listing.city}` : null,
    isCoastalLocation ? 'Coastal context is reflected in the listing details' : null,
    amenityNames.includes('Parking') ? 'Parking support is available at the property' : null,
    amenityNames.includes('Dining & bar') ? 'On-site dining can simplify daily plans' : null,
    'Final arrival details are confirmed after booking',
  ].filter(Boolean).slice(0, 3) as string[];
  const policyDetails = listing.details || {};
  const petPolicyText = formatValue(policyDetails.petPolicy);
  const petPolicyKnown = Boolean(petPolicyText) || (policyDetails.petFriendly !== undefined && policyDetails.petFriendly !== null && policyDetails.petFriendly !== '');
  const petPolicyAllowed = petPolicyText ? petPolicyText.toLowerCase().includes('allow') && !petPolicyText.toLowerCase().includes('not') : policyDetails.petFriendly === true;
  const checkInText = formatValue(policyDetails.checkInTime);
  const checkOutText = formatValue(policyDetails.checkOutTime);
  const paymentPolicy = formatValue(policyDetails.paymentMethods || policyDetails.paymentMethod);
  const cancellationPolicy = formatValue(policyDetails.cancellationPolicy || policyDetails.cancellation);
  const refundPolicy = formatValue(policyDetails.refundPolicy || policyDetails.refundEligibility);
  const policySummaryCards: Array<{
    key: string;
    label: string;
    value: string;
    helper: string;
    icon: React.ElementType;
    tone: NonNullable<DetailItem['tone']>;
  }> = [
    {
      key: 'pet-policy',
      label: 'Pet policy',
      value: petPolicyText || (petPolicyKnown ? (petPolicyAllowed ? 'Allowed' : 'Not allowed') : 'Not specified'),
      helper: petPolicyKnown ? (petPolicyAllowed ? 'Pets are welcome when provider rules are followed.' : 'Pets are not permitted on the property.') : 'Review provider rules before booking.',
      icon: PawPrint,
      tone: petPolicyAllowed ? 'emerald' : 'slate',
    },
    {
      key: 'check-times',
      label: 'Check-in / Check-out',
      value: [checkInText, checkOutText].filter(Boolean).join(' / ') || 'Confirmed later',
      helper: checkInText || checkOutText ? 'Early check-in or late check-out may depend on availability.' : 'Arrival and departure details are confirmed before checkout.',
      icon: Clock,
      tone: 'blue',
    },
    {
      key: 'payment-methods',
      label: 'Payment methods',
      value: paymentPolicy || 'Platform checkout',
      helper: paymentPolicy ? 'Use the available payment method during checkout.' : 'Complete payment through the secure marketplace checkout.',
      icon: CreditCard,
      tone: 'violet',
    },
    {
      key: 'cancellation-policy',
      label: 'Cancellation policy',
      value: cancellationPolicy || 'Review at checkout',
      helper: cancellationPolicy ? 'Cancellation terms come from the current listing policy.' : 'Cancellation terms are shown before booking is confirmed.',
      icon: CalendarDays,
      tone: 'amber',
    },
    {
      key: 'refund-policy',
      label: 'Refund policy',
      value: refundPolicy || 'Eligibility review',
      helper: refundPolicy ? 'Refund details follow the current listing policy.' : 'Refund eligibility depends on provider and platform review.',
      icon: WalletCards,
      tone: 'emerald',
    },
  ];
  const bookingNoteCards: Array<{
    key: string;
    title: string;
    description: string;
    bullets: string[];
    icon: React.ElementType;
    tone: NonNullable<DetailItem['tone']>;
  }> = [
    {
      key: 'provider-policies',
      title: 'Provider policies',
      description: 'Policies may vary by category and travel date.',
      bullets: ['Property rules are set by the provider.', 'Special requests may have extra rules.', 'Review the full policy before booking.'],
      icon: FileText,
      tone: 'blue',
    },
    {
      key: 'payment-status',
      title: 'Payment & booking status',
      description: 'Your payment and booking status are tracked in your account.',
      bullets: ['Payments are securely processed online.', 'Booking details are sent to your email.', 'Check your booking status anytime.'],
      icon: CreditCard,
      tone: 'emerald',
    },
    {
      key: 'refund-eligibility',
      title: 'Refund eligibility',
      description: 'Refund eligibility depends on provider and platform review.',
      bullets: ['Refunds follow the property policy.', 'Processing times may vary.', 'Contact support for refund assistance.'],
      icon: ShieldCheck,
      tone: 'violet',
    },
    {
      key: 'extra-charges',
      title: 'Extra charges',
      description: 'Extra charges may apply for additional services.',
      bullets: ['Optional services may not be included.', 'Additional guests may incur extra charges.', 'Charges are shown at checkout.'],
      icon: ReceiptText,
      tone: 'amber',
    },
  ];
  const quickInfoItems: DetailItem[] = [
    ...stayBasics.slice(0, 4),
    ...(amenityNames.some((name) => name.toLowerCase().includes('wi-fi') || name.toLowerCase().includes('wifi'))
      ? [{ key: 'wifi-strip', label: 'Free Wi-Fi', value: 'Available', helper: 'Fast & reliable', icon: Wifi, tone: 'blue' as DetailItem['tone'] }]
      : []),
    {
      key: 'highlight-strip',
      label: amenityNames.some((name) => name.toLowerCase().includes('parking')) ? 'Free parking' : 'Highlights',
      value: amenityNames.some((name) => name.toLowerCase().includes('parking')) ? 'Available' : (amenityNames[0] || formatCategory(listing.category)),
      helper: amenityNames.some((name) => name.toLowerCase().includes('parking')) ? 'On premises' : 'Provider details',
      icon: amenityNames.some((name) => name.toLowerCase().includes('parking')) ? Car : Sparkles,
      tone: 'blue' as DetailItem['tone'],
    },
  ].slice(0, 6);

  const openLightbox = (index: number) => {
    setSelectedPhotoIndex(index);
    setIsLightboxOpen(true);
  };

  const openBookingFlow = () => {
    if (!isAuthenticated) {
      setLoginPromptAction('book');
      setShowLoginPrompt(true);
      return;
    }
    setBookingMode('checkout');
    setIsBookingOpen(true);
  };

  const openAddToCartFlow = () => {
    if (!isAuthenticated) {
      setLoginPromptAction('cart');
      setShowLoginPrompt(true);
      return;
    }
    setBookingMode('cart');
    setIsBookingOpen(true);
  };

  const continueToLogin = () => {
    const redirect = encodeURIComponent(`${routeLocation.pathname}${routeLocation.search}`);
    navigate(`/login?redirect=${redirect}&reason=booking`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50/70 to-white">
      <main className="mx-auto w-full max-w-[1680px] px-4 py-4 sm:px-5 sm:py-6 lg:px-8 2xl:px-10">
        <nav className="detail-enter mb-4 flex flex-nowrap items-center gap-2 overflow-x-auto whitespace-nowrap text-xs text-slate-500 [scrollbar-width:none] sm:mb-5 sm:text-sm [&::-webkit-scrollbar]:hidden" aria-label="Breadcrumb">
          <button className="font-semibold transition-colors hover:text-blue-600" onClick={() => navigate('/')}>Home</button>
          <ChevronRight className="h-4 w-4" />
          <button className="font-semibold transition-colors hover:text-blue-600" onClick={() => navigate('/search')}>Explore</button>
          <ChevronRight className="h-4 w-4" />
          {listing.city && <span className="font-semibold text-blue-600">{listing.city}</span>}
          <ChevronRight className="h-4 w-4" />
          <span className="max-w-[220px] truncate text-slate-700 sm:max-w-none">{listing.title}</span>
        </nav>

        <header className="detail-enter detail-enter-delay-1 mb-5 space-y-3 sm:mb-6 sm:space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-blue-100 text-blue-800">{formatCategory(listing.category)}</Badge>
            <StatusBadge kind="listing" status={listing.status} />
          </div>
          <div className="min-w-0">
            <h1 className="text-[28px] font-black leading-tight tracking-tight text-slate-950 sm:text-4xl">{listing.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-slate-600 sm:text-sm">
              <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-blue-600" />{location}</span>
              <span className="inline-flex items-center gap-1"><Star className="h-4 w-4 fill-amber-400 text-amber-400" />{ratingLabel} ({listing.reviewCount} reviews)</span>
              <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-blue-600" />Verified provider</span>
              <span className="inline-flex items-center gap-2"><CreditCard className="h-4 w-4 text-blue-600" />Secure booking</span>
            </div>
          </div>
        </header>

        <div className="min-w-0 space-y-5 sm:space-y-6">
          <section className="detail-enter detail-enter-delay-2 grid min-w-0 grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,360px)] xl:gap-6 2xl:grid-cols-[minmax(0,1fr)_minmax(330px,390px)]">
            <div className="flex min-w-0 flex-col gap-4">
              <div className="relative min-w-0 rounded-[22px] shadow-xl shadow-slate-200/80 ring-1 ring-black/5 sm:rounded-[24px]">
                {previewImages.length > 0 ? (
                  <div className="grid h-[260px] w-full gap-2 overflow-hidden rounded-[22px] bg-white min-[390px]:h-[300px] sm:h-[420px] sm:rounded-[24px] lg:h-auto lg:min-h-[430px] lg:max-h-[560px] lg:aspect-[16/5.5] lg:grid-cols-[minmax(0,1.7fr)_minmax(0,0.8fr)_minmax(0,0.8fr)] lg:grid-rows-2">
                    <button className="motion-gallery-item group relative min-h-0 overflow-hidden text-left lg:row-span-2" onClick={() => openLightbox(0)} aria-label="Open main listing photo">
                      <img src={previewImages[0].src} alt={previewImages[0].alt} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
                      <div className="absolute right-4 top-4 rounded-full bg-slate-950/65 px-3 py-1.5 text-sm font-bold text-white lg:bottom-4 lg:left-4 lg:right-auto lg:top-auto">{galleryImages.length > 0 ? `1 / ${galleryImages.length}` : '1 / 1'}</div>
                      <button
                        type="button"
                        className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-slate-700 shadow-lg lg:hidden"
                        onClick={(event) => { event.stopPropagation(); openLightbox(0); }}
                        aria-label="Previous photo"
                      >
                        <ArrowLeft className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-slate-700 shadow-lg lg:hidden"
                        onClick={(event) => { event.stopPropagation(); openLightbox(Math.min(1, galleryImages.length - 1)); }}
                        aria-label="Next photo"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </button>
                    {Array.from({ length: 4 }).map((_, index) => {
                      const image = previewImages[index + 1];
                      const isLastCell = index === 3;
                      return (
                        <button key={image?.src ?? index} className="motion-gallery-item group relative hidden min-h-0 overflow-hidden text-left lg:block" style={{ animationDelay: `${120 + index * 65}ms` }} onClick={() => openLightbox(image ? index + 1 : 0)} aria-label={`Open listing photo ${index + 2}`}>
                          {image ? (
                            <img src={image.src} alt={image.alt} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          ) : isLastCell ? (
                            <div className="h-full w-full bg-blue-50" />
                          ) : (
                            <ImageFallback title={listing.title} />
                          )}
                          {isLastCell && (
                            <span className="motion-photo-tile absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-blue-50/90 text-blue-700">
                              <Camera className="h-8 w-8" />
                              <span className="text-sm font-black">View all photos</span>
                              {galleryImages.length > 5 && <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-blue-700 shadow-sm">+{galleryImages.length - 5} photos</span>}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <ImageFallback title={listing.title} className="h-[260px] overflow-hidden rounded-[22px] min-[390px]:h-[300px] sm:h-[420px] sm:rounded-[24px]" />
                )}
              </div>

              {previewImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] lg:hidden [&::-webkit-scrollbar]:hidden">
                  {previewImages.slice(1, 4).map((image, index) => (
                    <button
                      key={image.src}
                      type="button"
                      className="h-20 w-[31%] min-w-[96px] overflow-hidden rounded-xl bg-slate-100 shadow-sm ring-1 ring-slate-200"
                      onClick={() => openLightbox(index + 1)}
                      aria-label={`Open listing photo ${index + 2}`}
                    >
                      <img src={image.src} alt={image.alt} className="h-full w-full object-cover" />
                    </button>
                  ))}
                  <button
                    type="button"
                    className="flex h-20 w-[31%] min-w-[104px] flex-col items-center justify-center gap-1 rounded-xl bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100"
                    onClick={() => openLightbox(0)}
                    aria-label="View all listing photos"
                  >
                    <Camera className="h-6 w-6" />
                    <span className="text-xs font-black">View all photos</span>
                  </button>
                </div>
              )}

              <section className="hidden w-full overflow-hidden rounded-[22px] border border-blue-100 bg-blue-50/30 shadow-sm xl:grid xl:grid-cols-6">
                {quickInfoItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.key} className="flex min-w-0 gap-3 border-r border-blue-100/80 p-4 last:border-r-0">
                      <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ring-1', toneClasses[item.tone || 'blue'])}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-black text-slate-950 sm:text-sm">{item.label}</p>
                        <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-slate-600 sm:text-sm">{item.value}</p>
                        {item.helper && <p className="mt-1 truncate text-xs font-medium text-slate-500">{item.helper}</p>}
                      </div>
                    </div>
                  );
                })}
              </section>
            </div>

            <aside ref={bookingCardRef} className="min-w-0 xl:self-start">
              <Card className="motion-card-hover overflow-hidden rounded-[22px] border-gray-200 shadow-xl shadow-slate-200/80 sm:rounded-3xl sm:shadow-2xl">
                <CardContent className="p-4 sm:p-6">
                  <div className="mb-4 inline-flex items-center gap-2 self-start rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 sm:mb-5"><ShieldCheck className="h-3.5 w-3.5" /> Best price guarantee</div>
                  <div className="flex items-start justify-between gap-4">
                    <div><p className="text-sm font-medium text-gray-500">Starting from</p><p className={cn('mt-1 rounded-xl text-3xl font-bold text-gray-950 transition-colors', bookingEmphasis && 'motion-price-highlight')}>{formatMoney(listing.basePrice, listing.currency)}</p><p className="text-sm text-gray-500">Total taxes & fees checked at checkout</p></div>
                    <div className="rounded-2xl bg-amber-50 px-3 py-2 text-right"><div className="flex items-center justify-end gap-1 text-sm font-bold text-gray-900"><Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {ratingLabel}</div><p className="text-xs text-gray-500">{listing.reviewCount} reviews</p></div>
                  </div>
                  <div className="my-4 rounded-2xl border border-gray-200 bg-slate-50 p-4 sm:my-6"><div className="grid grid-cols-2 gap-3 text-sm"><div><p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Destination</p><p className="mt-1 font-semibold text-gray-900">{listing.city}</p></div><div><p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Category</p><p className="mt-1 font-semibold text-gray-900">{formatCategory(listing.category)}</p></div><div className="col-span-2 border-t border-gray-200 pt-3"><p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Provider</p><p className="mt-1 font-semibold text-gray-900">{listing.providerName}</p></div></div></div>
                  <Button className={cn('h-12 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 shadow-lg shadow-blue-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-blue-500/35', bookingEmphasis && 'motion-book-emphasis')} onClick={openBookingFlow} disabled={listing.status !== 'ACTIVE'}>Book now</Button>
                  <Button variant="outline" className="mt-3 h-11 w-full rounded-2xl border-blue-200 bg-blue-50/70 font-semibold text-blue-700 transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-100 hover:shadow-md" onClick={openAddToCartFlow} disabled={listing.status !== 'ACTIVE'}><ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart</Button>
                  {cartNotice && <div className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-sm font-medium text-emerald-800">{cartNotice}</div>}
                  <Button variant="outline" className="motion-ai-button group/ai mt-3 h-11 w-full rounded-2xl bg-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md" onClick={() => navigate('/ai/assistant')}><Sparkles className="motion-ai-sparkle mr-2 h-4 w-4" /> Ask AI about this listing</Button>
                  <div className="mt-4 space-y-3 text-sm text-gray-600 sm:mt-5"><div className="flex items-center gap-3"><CreditCard className="h-4 w-4 text-blue-600" /> Secure payment & checkout</div><div className="flex items-center gap-3"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Verified marketplace provider</div><div className="flex items-center gap-3"><CalendarDays className="h-4 w-4 text-amber-600" /> Availability checked during checkout</div></div>
                </CardContent>
              </Card>
            </aside>
          </section>

          <section className="flex w-full snap-x snap-mandatory gap-2 overflow-x-auto rounded-[22px] border border-blue-100 bg-blue-50/30 p-2 shadow-sm [scrollbar-width:none] xl:hidden [&::-webkit-scrollbar]:hidden">
            {quickInfoItems.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.key} className="flex w-[136px] shrink-0 snap-start gap-3 rounded-2xl border border-blue-100/80 bg-white/85 p-3">
                  <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ring-1', toneClasses[item.tone || 'blue'])}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-black text-slate-950">{item.label}</p>
                    <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-slate-600">{item.value}</p>
                    {item.helper && <p className="mt-1 truncate text-xs font-medium text-slate-500">{item.helper}</p>}
                  </div>
                </div>
              );
            })}
          </section>

            <section className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm sm:rounded-3xl">
              <div className="sticky top-0 z-30 overflow-x-auto border-b border-slate-200 bg-white/95 backdrop-blur [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="flex min-w-max gap-2 px-3 py-3">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const active = activeTab === tab.id;
                    return (
                      <button key={tab.id} ref={active ? activeTabRef : undefined} type="button" onClick={() => setActiveTab(tab.id)} className={cn('motion-tab-button inline-flex min-h-11 items-center gap-2 rounded-full px-4 py-2.5 text-xs font-bold transition-all sm:rounded-2xl sm:py-3 sm:text-sm', active ? 'is-active bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100' : 'text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 hover:text-blue-700 sm:ring-0')}>
                        <Icon className="h-4 w-4" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-3 sm:p-6">
                {activeTab === 'overview' && (
                  <div className="overview-layout-container motion-fade-up w-full min-w-0 max-w-full space-y-5">
                    <InfoCard className="overflow-hidden border-blue-100 bg-white p-4 shadow-sm shadow-slate-200/50 sm:p-5">
                      <div className="grid min-w-0 grid-cols-1 items-stretch gap-5 min-[900px]:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                        <div className="relative min-h-[300px] min-w-0 overflow-hidden rounded-[20px] bg-slate-100">
                          {overviewImage ? (
                            <img src={overviewImage.src} alt={overviewImage.alt} className="absolute inset-0 h-full w-full object-cover" />
                          ) : (
                            <ImageFallback title={listing.title} className="absolute inset-0 h-full w-full" />
                          )}
                          <button
                            type="button"
                            className="absolute inset-0 z-10 cursor-zoom-in"
                            onClick={() => openLightbox(0)}
                            aria-label="Open listing photos"
                          />
                          <div className="absolute bottom-4 left-4 z-20 flex max-w-[calc(100%-2rem)] gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            {previewImages.slice(0, 3).map((image, index) => (
                              <button
                                key={image.src}
                                type="button"
                                className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border-2 border-white/85 bg-white shadow-lg transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                onClick={() => openLightbox(index)}
                                aria-label={`Open listing photo ${index + 1}`}
                              >
                                <img src={image.src} alt={image.alt} className="h-full w-full object-cover" />
                              </button>
                            ))}
                            {galleryImages.length > 3 && (
                              <button
                                type="button"
                                className="flex h-14 w-16 shrink-0 items-center justify-center rounded-xl border border-white/50 bg-slate-950/55 px-2 text-xs font-black text-white shadow-lg backdrop-blur-sm transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                onClick={() => openLightbox(3)}
                                aria-label="View more listing photos"
                              >
                                +{galleryImages.length - 3} photos
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex h-full min-w-0 flex-col">
                          <div className="min-w-0">
                            <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">About this stay</p>
                            <h2 className="mt-2 text-2xl font-black leading-tight text-slate-950 sm:text-3xl">{formatCategory(listing.category)} experience{listing.city ? ` in ${listing.city}` : ''}</h2>
                            <p className="mt-3 line-clamp-4 text-sm font-semibold leading-6 text-slate-600 sm:text-base sm:leading-7">
                              {listing.description || listing.shortDesc || 'Review the details, amenities, location, and policies to decide whether this stay fits your trip.'}
                            </p>
                          </div>

                          <div className="mt-5 flex flex-wrap gap-2">
                            {[
                              { label: formatCategory(listing.category), icon: Building2, tone: 'blue' },
                              listing.city ? { label: listing.city, icon: MapPin, tone: 'violet' } : null,
                              listing.averageRating ? { label: `${listing.averageRating.toFixed(1)} guest rating`, icon: Star, tone: 'amber' } : null,
                              listing.providerName ? { label: 'Verified provider', icon: ShieldCheck, tone: 'emerald' } : null,
                            ].filter(Boolean).map((badge) => {
                              const item = badge as { label: string; icon: React.ElementType; tone: NonNullable<DetailItem['tone']> };
                              const Icon = item.icon;
                              return (
                                <span key={item.label} className={cn('inline-flex min-h-10 items-center gap-2 rounded-xl border bg-white px-3 py-2 text-xs font-black shadow-sm', item.tone === 'amber' ? 'border-amber-100 text-amber-700' : item.tone === 'emerald' ? 'border-emerald-100 text-emerald-700' : item.tone === 'violet' ? 'border-violet-100 text-violet-700' : 'border-blue-100 text-blue-700')}>
                                  <Icon className={cn('h-4 w-4', item.tone === 'amber' && 'fill-amber-400')} />
                                  {item.label}
                                </span>
                              );
                            })}
                          </div>

                          <div className="mt-5 min-[900px]:mt-auto min-[900px]:pt-5">
                            <div className="overflow-hidden rounded-[20px] border border-blue-100 bg-white shadow-sm min-[560px]:grid min-[560px]:grid-cols-[138px_minmax(0,1fr)]">
                              <div className="bg-blue-600 p-5 text-white">
                                <p className="text-4xl font-black leading-none">{listing.averageRating ? listing.averageRating.toFixed(1) : 'New'}</p>
                                {listing.averageRating && (
                                  <div className="mt-3 flex gap-0.5 text-amber-300">
                                    {Array.from({ length: 5 }).map((_, index) => (
                                      <Star key={index} className={cn('h-4 w-4', index + 1 <= Math.round(listing.averageRating || 0) ? 'fill-amber-300' : 'text-white/40')} />
                                    ))}
                                  </div>
                                )}
                                <p className="mt-3 text-sm font-black">{listing.averageRating && listing.averageRating >= 4.5 ? 'Excellent' : listing.averageRating ? 'Guest rated' : 'New stay'}</p>
                                <p className="mt-1 text-xs font-semibold text-blue-100">Based on {listing.reviewCount} {listing.reviewCount === 1 ? 'review' : 'reviews'}</p>
                              </div>
                              <div className="flex min-w-0 flex-col justify-center p-5">
                                <p className="text-sm font-semibold leading-6 text-slate-600">
                                  {listing.averageRating
                                    ? 'Guests rate this stay highly for its overall experience. Open Reviews for full comments, filters, and rating details.'
                                    : 'Guest feedback will appear after travelers complete bookings and share reviews.'}
                                </p>
                                <button type="button" className="mt-4 inline-flex items-center gap-2 self-start text-sm font-black text-blue-700 hover:text-blue-800" onClick={() => setActiveTab('reviews')}>
                                  See all reviews <ChevronRight className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </InfoCard>

                    <div className="overview-row overview-row-primary">
                      <InfoCard className="flex h-full min-h-0 flex-col border-emerald-200/70 bg-emerald-50/35 sm:min-h-[260px]">
                        <SectionTitle tone="emerald" icon={CheckCircle2} title="Why travelers choose this stay" description="Short signals that help you decide quickly." />
                        <div className="mt-5 flex-1 space-y-3">
                          {(choiceHighlights.length > 0 ? choiceHighlights : compactHighlights).slice(0, 4).map((item) => (
                            <p key={item} className="flex gap-3 text-sm font-semibold leading-6 text-slate-600">
                              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                              <span className="min-w-0 break-words">{item}</span>
                            </p>
                          ))}
                        </div>
                        {amenities.length > 0 && (
                          <button type="button" className="mt-5 inline-flex items-center gap-2 self-start text-sm font-black text-emerald-700 hover:text-emerald-800" onClick={() => setActiveTab('amenities')}>
                            See what makes us special <ChevronRight className="h-4 w-4" />
                          </button>
                        )}
                      </InfoCard>

                      <InfoCard className="relative flex h-full min-h-0 flex-col overflow-hidden border-violet-200/70 bg-violet-50/45 sm:min-h-[260px]">
                        <GuestVibePattern />
                        <div className="relative z-10 flex h-full min-w-0 flex-col">
                          <SectionTitle tone="violet" icon={Sparkles} title="Guest vibe" description="A quick feel for the experience." />
                          <div className="mt-5 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
                            {guestVibes.slice(0, 4).map((vibe) => {
                              const Icon = vibe.icon;
                              return (
                                <div key={vibe.key} className="flex w-full min-w-0 items-center gap-3 rounded-2xl border border-violet-100 bg-white/70 p-3">
                                  <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ring-1', toneClasses[vibe.tone || 'blue'])}>
                                    <Icon className="h-5 w-5" />
                                  </span>
                                  <p className="min-w-0 break-words text-sm font-black text-slate-700">{vibe.value}</p>
                                </div>
                              );
                            })}
                          </div>
                          {experienceSignals.length > 0 && (
                            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                              {experienceSignals.map((signal) => {
                                const Icon = signal.icon;
                                return (
                                  <div key={signal.key} className="min-w-0 border-violet-200/70 text-center sm:border-l sm:first:border-l-0">
                                    <Icon className={cn('mx-auto h-5 w-5', toneClasses[signal.tone || 'blue'].split(' ')[1])} />
                                    <p className="mt-2 break-words text-xs font-bold leading-5 text-slate-600">{signal.value}</p>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          <button type="button" className="mt-auto inline-flex items-center gap-2 self-start pt-5 text-sm font-black text-violet-700 hover:text-violet-800" onClick={() => openLightbox(0)}>
                            See photos & highlights <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </InfoCard>

                      <InfoCard className="relative flex h-full min-h-0 flex-col overflow-hidden border-orange-200/70 bg-orange-50/35 sm:min-h-[260px]">
                        <PerfectForPattern />
                        <div className="relative z-10 flex h-full min-w-0 flex-col">
                          <SectionTitle tone="amber" icon={Users} title="Perfect for" description="Who this stay may suit best." />
                          <div className="mt-5 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
                            {travelerSegments.slice(0, 4).map((segment) => {
                              const Icon = segment.icon;
                              return (
                                <div key={segment.key} className="flex w-full min-w-0 items-center gap-3 rounded-2xl border border-orange-100 bg-white/75 p-3">
                                  <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ring-1', toneClasses[segment.tone || 'blue'])}>
                                    <Icon className="h-5 w-5" />
                                  </span>
                                  <p className="min-w-0 break-words text-sm font-black text-slate-700">{segment.value}</p>
                                </div>
                              );
                            })}
                          </div>
                          <p className="mt-4 text-sm leading-6 text-slate-500">
                            Use this overview to decide whether the stay matches your trip style, then compare pricing and details in the rates tab.
                          </p>
                          <button type="button" className="mt-auto inline-flex items-center gap-2 self-start pt-5 text-sm font-black text-orange-700 hover:text-orange-800" onClick={() => setActiveTab('rates')}>
                            Explore rooms & rates <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </InfoCard>
                    </div>

                    <div className="overview-row overview-row-secondary">
                      <InfoCard className="flex h-full min-h-0 flex-col border-sky-200/70 bg-sky-50/45 sm:min-h-[270px]">
                        <SectionTitle tone="blue" icon={MapPin} title="Neighborhood snapshot" description="A compact location preview." />
                        <div className="mt-5">
                          <CompactLocationPreview location={location} />
                        </div>
                        <button type="button" className="mt-auto inline-flex items-center gap-2 self-start pt-5 text-sm font-black text-blue-700 hover:text-blue-800" onClick={() => setActiveTab('location')}>
                          View on map <ChevronRight className="h-4 w-4" />
                        </button>
                      </InfoCard>

                      <InfoCard className="flex h-full min-h-0 flex-col border-violet-200/60 bg-violet-50/25 sm:min-h-[270px]">
                        <SectionTitle tone="violet" icon={Info} title="Trip planning tips" description="Practical notes from listing data." />
                        <div className="mt-5 flex-1 space-y-3">
                          {planningTips.length > 0 ? planningTips.slice(0, 3).map((tip) => {
                            const Icon = tip.icon;
                            return (
                              <div key={tip.key} className="grid grid-cols-[42px_minmax(0,1fr)] gap-3 rounded-2xl border border-slate-200/80 bg-white/75 p-3.5">
                                <span className={cn('flex h-10 w-10 items-center justify-center rounded-2xl ring-1', toneClasses[tip.tone || 'blue'])}>
                                  <Icon className="h-5 w-5" />
                                </span>
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-slate-500">{tip.label}</p>
                                  <p className="mt-1 break-words text-sm font-black text-slate-950">{tip.value}</p>
                                  {tip.helper && <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{tip.helper}</p>}
                                </div>
                              </div>
                            );
                          }) : (
                            <div className="rounded-2xl border border-slate-200 bg-white/75 p-4 text-sm font-semibold leading-6 text-slate-600">
                              Review the booking sidebar, location tab, and policies tab before checkout for final planning details.
                            </div>
                          )}
                        </div>
                        <button type="button" className="mt-auto inline-flex items-center gap-2 self-start pt-5 text-sm font-black text-violet-700 hover:text-violet-800" onClick={() => setActiveTab(amenities.length > 0 ? 'amenities' : 'location')}>
                          {amenities.length > 0 ? 'Explore amenities' : 'Explore location'} <ChevronRight className="h-4 w-4" />
                        </button>
                      </InfoCard>

                      <InfoCard className="flex h-full min-h-0 flex-col border-slate-200 bg-slate-50/65 sm:min-h-[270px]">
                        <SectionTitle tone="slate" icon={Info} title="Quick facts" description="Experience-oriented signals from this listing." />
                        <div className="mt-5 flex-1 space-y-3">
                          {(quickOverviewSignals.length > 0 ? quickOverviewSignals : compactHighlights.map((item, index) => ({
                            key: `summary-${index}`,
                            label: 'Quick facts',
                            value: item,
                            helper: 'Open the relevant tab for more detail.',
                            icon: CheckCircle2,
                            tone: 'blue' as DetailItem['tone'],
                          }))).slice(0, 4).map((signal) => {
                            const Icon = signal.icon;
                            return (
                              <div key={signal.key} className="grid min-w-0 grid-cols-[42px_minmax(0,1fr)] gap-3 rounded-2xl border border-slate-200 bg-white/80 p-3.5">
                                <span className={cn('flex h-10 w-10 items-center justify-center rounded-2xl ring-1', toneClasses[signal.tone || 'blue'])}>
                                  <Icon className="h-5 w-5" />
                                </span>
                                <div className="min-w-0">
                                  <p className="break-words text-sm font-black text-slate-800">{signal.value}</p>
                                  {signal.helper && <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{signal.helper}</p>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </InfoCard>
                    </div>

                    <InfoCard className={cn('rounded-[22px] border-amber-200/80 bg-amber-50/65', !isGuestFavorite && 'border-blue-100 bg-blue-50/50')}>
                      <div className="grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
                        <span className={cn('flex h-12 w-12 items-center justify-center rounded-2xl', isGuestFavorite ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600')}>
                          {isGuestFavorite ? <Star className="h-6 w-6 fill-current" /> : <Sparkles className="h-6 w-6" />}
                        </span>
                        <div className="min-w-0">
                          <h2 className="text-lg font-black text-slate-950">{isGuestFavorite ? 'Great choice! This stay is a guest favorite.' : 'Explore this stay'}</h2>
                          <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                            {isGuestFavorite
                              ? `High ratings, destination context, and strong listing features make this a popular option${listing.city ? ` in ${listing.city}` : ''}.`
                              : 'Compare rooms, features, and booking details before you decide.'}
                          </p>
                        </div>
                        <Button className={cn('rounded-2xl px-5 shadow-sm', isGuestFavorite ? 'bg-amber-400 text-slate-950 hover:bg-amber-300' : 'bg-blue-600 text-white hover:bg-blue-500')} onClick={() => setActiveTab('rates')}>
                          See available rooms <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </InfoCard>
                  </div>
                )}

                {activeTab === 'rates' && (
                  <div className="motion-fade-up space-y-5">
                    <div className="flex min-w-0 items-start gap-4">
                      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                        <BedDouble className="h-7 w-7" />
                      </span>
                      <div className="min-w-0">
                        <h2 className="text-3xl font-black tracking-tight text-slate-950">Rooms & Rates</h2>
                        <p className="mt-1 text-base font-medium leading-7 text-slate-500">Pricing and category-specific booking details at a glance.</p>
                      </div>
                    </div>

                    <div className="grid min-w-0 grid-cols-1 items-stretch gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1fr)]">
                      <InfoCard className="rounded-[24px] p-5 xl:p-7">
                        <h3 className="text-xl font-black text-slate-950">Room & stay details</h3>
                        <div className="mt-6 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
                          {stayBasics.slice(0, 4).map((item, index) => {
                            const Icon = item.icon;
                            const tones: Array<DetailItem['tone']> = ['amber', 'blue', 'emerald', 'violet'];
                            return (
                              <div key={item.key} className="flex min-w-0 gap-4 rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm">
                                <span className={cn('flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ring-1', toneClasses[tones[index] || item.tone || 'blue'])}>
                                  <Icon className="h-7 w-7" />
                                </span>
                                <div className="min-w-0">
                                  <p className="text-sm font-bold text-slate-500">{item.label}</p>
                                  <p className="mt-2 break-words text-2xl font-black text-slate-950">{item.value}</p>
                                  {item.helper && <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{item.helper}</p>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </InfoCard>

                      <div className="relative min-w-0 overflow-hidden rounded-[24px] bg-gradient-to-br from-blue-700 via-blue-600 to-blue-950 p-6 text-white shadow-xl shadow-blue-500/20 xl:p-7">
                        <svg aria-hidden="true" className="pointer-events-none absolute bottom-0 right-0 h-full w-2/5 opacity-20" viewBox="0 0 240 240" fill="none">
                          <path d="M58 184V84h36v100M94 184V56h54v128M148 184V108h40v76" stroke="white" strokeWidth="8" strokeLinejoin="round" />
                          <path d="M70 108h10M70 132h10M70 156h10M110 84h12M110 112h12M110 140h12M162 132h10M162 156h10" stroke="white" strokeWidth="6" strokeLinecap="round" />
                          <path d="M28 184h188" stroke="white" strokeWidth="8" strokeLinecap="round" />
                        </svg>
                        <div className="relative z-10">
                          <div className="flex min-w-0 items-start gap-4">
                            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white ring-1 ring-white/20">
                              <WalletCards className="h-7 w-7" />
                            </span>
                            <div className="min-w-0">
                              <h3 className="text-2xl font-black">Current base price</h3>
                              <p className="mt-1 text-sm font-semibold text-blue-100">Final totals are calculated during checkout.</p>
                            </div>
                          </div>
                          <p className="mt-9 text-5xl font-black tracking-tight sm:text-6xl">{formatMoney(listing.basePrice, listing.currency)}</p>
                          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-2 text-sm font-bold text-blue-50 ring-1 ring-white/15">
                            <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                            Final taxes and fees are checked at checkout
                          </div>
                          <p className="mt-7 text-sm font-semibold leading-7 text-blue-100">Availability and booking totals are confirmed before payment.</p>
                          <div className="mt-6 grid min-w-0 gap-0 overflow-hidden rounded-3xl bg-white text-slate-950 shadow-2xl shadow-blue-950/20 sm:grid-cols-2">
                            <div className="flex min-w-0 gap-4 border-b border-slate-200 p-5 sm:border-b-0 sm:border-r">
                              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                                <CalendarDays className="h-7 w-7" />
                              </span>
                              <div className="min-w-0">
                                <p className="text-sm font-black text-blue-600">Schedule</p>
                                <p className="mt-1 text-xl font-black">{formatValue(listing.details?.durationDays) ? `${formatValue(listing.details?.durationDays)} nights` : 'Dates flexible'}</p>
                                <p className="mt-1 text-sm font-semibold text-slate-500">{formatValue(listing.details?.checkInTime) || 'Check-in flexible'} - {formatValue(listing.details?.checkOutTime) || 'check-out flexible'}</p>
                              </div>
                            </div>
                            <div className="flex min-w-0 gap-4 p-5">
                              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                                <Users className="h-7 w-7" />
                              </span>
                              <div className="min-w-0">
                                <p className="text-sm font-black text-emerald-700">Guests</p>
                                <p className="mt-1 text-xl font-black">{formatValue(listing.details?.maxGuests || listing.details?.maxGroupSize || listing.details?.capacity) || 'Set at checkout'}</p>
                                <p className="mt-1 text-sm font-semibold text-slate-500">{formatValue(listing.details?.totalRooms) || '1 room'}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(240px,300px)]">
                      <InfoCard className="rounded-[24px] p-5 xl:p-6">
                        <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(260px,0.8fr)]">
                          <div className="min-w-0">
                            <SectionTitle icon={CalendarDays} title="Rate overview" description="Average price per night" />
                            <div className="relative mt-5 h-64 min-w-0 rounded-2xl bg-gradient-to-b from-blue-50/60 to-white p-4">
                              <svg className="h-full w-full overflow-visible" viewBox="0 0 520 220" preserveAspectRatio="none" aria-label="Presentation rate trend based on current base price">
                                <defs>
                                  <linearGradient id="rateFill" x1="0" x2="0" y1="0" y2="1">
                                    <stop offset="0%" stopColor="#2563eb" stopOpacity="0.22" />
                                    <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                                  </linearGradient>
                                </defs>
                                {[40, 85, 130, 175].map((y) => <line key={y} x1="0" x2="520" y1={y} y2={y} stroke="#e2e8f0" strokeWidth="1" />)}
                                <path d="M0 150 C55 118, 98 120, 150 112 S240 72, 292 66 S386 92, 520 82" fill="none" stroke="#2563eb" strokeWidth="4" strokeLinecap="round" />
                                <path d="M0 150 C55 118, 98 120, 150 112 S240 72, 292 66 S386 92, 520 82 L520 220 L0 220 Z" fill="url(#rateFill)" />
                                <line x1="292" x2="292" y1="66" y2="220" stroke="#93c5fd" strokeWidth="2" />
                                <circle cx="292" cy="66" r="9" fill="white" stroke="#2563eb" strokeWidth="4" />
                              </svg>
                              <div className="absolute left-[52%] top-6 rounded-xl bg-white px-3 py-2 text-sm font-black text-blue-600 shadow-md ring-1 ring-blue-100">{formatMoney(listing.basePrice, listing.currency)}</div>
                              <div className="mt-2 grid grid-cols-4 gap-2 text-center text-xs font-bold text-slate-400 sm:grid-cols-7">
                                {['Today', '+1', '+2', '+3', '+4', '+5', '+6'].map((label) => <span key={label}>{label}</span>)}
                              </div>
                            </div>
                          </div>
                          <div className="min-w-0">
                            <SectionTitle icon={WalletCards} title="Price breakdown" description="Per night" tone="emerald" />
                            <div className="mt-6 space-y-4 text-sm font-semibold">
                              <div className="flex items-center justify-between gap-4"><span className="text-slate-600">Base room rate</span><span className="font-black text-slate-950">{formatMoney(listing.basePrice, listing.currency)}</span></div>
                              <div className="flex items-center justify-between gap-4"><span className="text-slate-600">Taxes & fees</span><span className="text-slate-500">Calculated at checkout</span></div>
                              <div className="flex items-center justify-between gap-4"><span className="text-slate-600">Service fee</span><span className="text-slate-500">Calculated at checkout</span></div>
                              <div className="border-t border-slate-200 pt-4">
                                <div className="flex items-center justify-between gap-4 text-lg"><span className="font-black text-slate-950">Total <span className="text-sm font-semibold text-slate-500">(base)</span></span><span className="font-black text-emerald-600">{formatMoney(listing.basePrice, listing.currency)}</span></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </InfoCard>

                      <InfoCard className="rounded-[24px] border-blue-100 bg-blue-50/45 p-5 xl:p-6">
                        <SectionTitle icon={Info} title="Good to know" description="Helpful booking notes" tone="blue" />
                        <div className="mt-6 space-y-4">
                          {[
                            'Prices may vary based on season and availability.',
                            'Availability is checked during checkout before payment.',
                            'Secure your room now and complete payment during checkout.',
                          ].map((note) => (
                            <div key={note} className="flex gap-3 text-sm font-semibold leading-6 text-slate-600">
                              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                              <span>{note}</span>
                            </div>
                          ))}
                        </div>
                      </InfoCard>
                    </div>
                  </div>
                )}

                {activeTab === 'amenities' && (
                  <div className="motion-fade-up space-y-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-4">
                        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                          <Sparkles className="h-8 w-8" />
                        </span>
                        <div className="min-w-0">
                          <h2 className="text-3xl font-black tracking-tight text-slate-950">Amenities</h2>
                          <p className="mt-1 text-base font-medium leading-7 text-slate-500">Everything available to make your stay more comfortable.</p>
                        </div>
                      </div>
                      <span className="inline-flex self-start rounded-full border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-black text-slate-600 sm:self-center">
                        {amenities.length} {amenities.length === 1 ? 'amenity' : 'amenities'}
                      </span>
                    </div>

                    {amenities.length > 0 ? (
                      <>
                        <div className="grid min-w-0 grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                          {amenities.map((item, index) => {
                            const Icon = item.icon;
                            const image = amenityImageFor(item, previewImages[index % Math.max(previewImages.length, 1)]?.src);
                            const objectPosition = amenityImagePositionFor(item);
                            const isIncluded = item.value.toLowerCase().includes('included');
                            return (
                              <div key={item.key} className="motion-amenity-card group relative min-h-[220px] min-w-0 overflow-hidden rounded-[22px] border border-emerald-100/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-100/60 sm:min-h-[240px]">
                                <img
                                  src={image}
                                  alt=""
                                  aria-hidden="true"
                                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                  style={{ objectPosition }}
                                />
                                <div
                                  aria-hidden="true"
                                  className="pointer-events-none absolute inset-0"
                                  style={{
                                    background:
                                      'radial-gradient(ellipse 108% 145% at 0% 48%, rgba(255,255,255,1) 0%, rgba(255,255,255,0.98) 46%, rgba(255,255,255,0.86) 60%, rgba(255,255,255,0.42) 74%, rgba(255,255,255,0) 92%)',
                                  }}
                                />
                                <div
                                  aria-hidden="true"
                                  className="pointer-events-none absolute inset-0"
                                  style={{
                                    background:
                                      'radial-gradient(circle at 0% 100%, rgba(255,255,255,0.72) 0%, rgba(255,255,255,0.28) 28%, transparent 52%)',
                                  }}
                                />
                                <div className="relative z-10 h-full w-[76%] min-w-0 max-w-[270px] px-5 py-5 sm:w-[52%] sm:min-w-[250px] sm:max-w-[290px] xl:px-6 xl:py-6">
                                  <div className="flex min-w-0 items-start gap-4">
                                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 xl:h-14 xl:w-14">
                                      <Icon className="h-6 w-6 xl:h-7 xl:w-7" />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                      <h3 className="truncate whitespace-nowrap text-[16px] font-semibold leading-tight text-slate-950 xl:text-[17px]">{item.label}</h3>
                                      <span className="mt-2 inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700 ring-1 ring-emerald-100">
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        {isIncluded ? 'Included' : item.value}
                                      </span>
                                      <p className="mt-4 w-full max-w-full whitespace-normal break-words text-[13px] font-semibold leading-5 text-slate-600 xl:text-sm">
                                        {item.helper || 'Available based on the current listing information.'}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="grid min-w-0 grid-cols-1 overflow-hidden rounded-[22px] border border-emerald-100/80 bg-gradient-to-r from-white via-emerald-50/20 to-white shadow-sm sm:grid-cols-2 lg:grid-cols-4">
                          <div className="flex min-w-0 gap-4 border-b border-emerald-100/80 p-5 sm:border-r lg:border-b-0">
                            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100"><Star className="h-6 w-6" /></span>
                            <div className="min-w-0"><p className="text-lg font-black text-slate-950">{amenities.length} amenities</p><p className="mt-1 text-sm font-semibold text-slate-500">available</p></div>
                          </div>
                          <div className="flex min-w-0 gap-4 border-b border-emerald-100/80 p-5 sm:border-b-0 lg:border-r">
                            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100"><Wifi className="h-6 w-6" /></span>
                            <div className="min-w-0"><p className="text-lg font-black text-slate-950">Wi-Fi</p><p className="mt-1 text-sm font-semibold text-slate-500">{amenityNames.includes('Free Wi-Fi') ? 'included' : 'check listing details'}</p></div>
                          </div>
                          <div className="flex min-w-0 gap-4 border-b border-emerald-100/80 p-5 sm:border-r lg:border-b-0">
                            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100"><Car className="h-6 w-6" /></span>
                            <div className="min-w-0"><p className="text-lg font-black text-slate-950">Parking</p><p className="mt-1 text-sm font-semibold text-slate-500">{amenityNames.includes('Parking') ? 'available' : 'check listing details'}</p></div>
                          </div>
                          <div className="flex min-w-0 gap-4 p-5">
                            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-500 ring-1 ring-slate-200"><Info className="h-6 w-6" /></span>
                            <div className="min-w-0"><p className="text-lg font-black text-slate-950">Current data</p><p className="mt-1 text-sm font-semibold leading-6 text-slate-500">Everything shown is based on the current listing information.</p></div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <p className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm font-semibold text-slate-500">No amenity data is available for this listing yet.</p>
                    )}
                  </div>
                )}

                {activeTab === 'location' && (
                  <div className="motion-fade-up space-y-5">
                    <div className="grid min-w-0 grid-cols-1 items-stretch gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(330px,0.75fr)]">
                      <div className="min-w-0 space-y-5">
                        <div className="flex min-w-0 items-center gap-4">
                          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                            <MapPin className="h-8 w-8" />
                          </span>
                          <div className="min-w-0">
                            <h2 className="text-3xl font-black tracking-tight text-slate-950">Location</h2>
                            <p className="mt-1 text-base font-medium leading-7 text-slate-500">See where we are and explore what&apos;s nearby.</p>
                          </div>
                        </div>

                        <LocationExplorerMap
                          address={listing.address}
                          city={listing.city}
                          country={listing.country}
                          latitude={listing.latitude}
                          longitude={listing.longitude}
                        />

                        <div className="flex min-w-0 items-center gap-4 rounded-[20px] border border-blue-100 bg-gradient-to-r from-blue-50/90 to-white p-4 shadow-sm sm:p-5">
                          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                            {isCoastalLocation ? <Waves className="h-6 w-6" /> : <MapPin className="h-6 w-6" />}
                          </span>
                          <div className="min-w-0">
                            <h3 className="text-base font-black text-slate-950">{isCoastalLocation ? 'Coastal location' : `Stay in ${listing.city || 'the destination'}`}</h3>
                            <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                              {isCoastalLocation
                                ? `Use this location as a base for exploring ${listing.city || 'the surrounding destination'}.`
                                : `Review the address and plan your route through ${listing.city || listing.country || 'the local area'}.`}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid min-w-0 content-start gap-4 md:grid-cols-2 xl:grid-cols-1">
                        <InfoCard className="min-w-0 rounded-[22px] p-5 xl:p-6">
                          <SectionTitle icon={Map} title="Destination information" description="Location details from this listing." />
                          <div className="mt-5 divide-y divide-slate-100">
                            {[
                              { label: 'City', value: listing.city || 'Not provided', icon: Building2 },
                              { label: 'Country', value: listing.country || 'Not provided', icon: Map },
                              { label: 'Address', value: listing.address || 'Confirmed after booking', icon: MapPin },
                              ...(listing.latitude != null && listing.longitude != null
                                ? [{ label: 'Coordinates', value: `${listing.latitude.toFixed(4)}, ${listing.longitude.toFixed(4)}`, icon: MapPin }]
                                : []),
                            ].map((item) => {
                              const Icon = item.icon;
                              return (
                                <div key={item.label} className="grid min-w-0 grid-cols-[38px_minmax(0,1fr)] gap-3 py-3 first:pt-0 last:pb-0">
                                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Icon className="h-4 w-4" /></span>
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{item.label}</p>
                                    <p className="mt-1 break-words text-sm font-black leading-6 text-slate-800">{item.value}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          {locationBadges.length > 0 && (
                            <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                              {locationBadges.map((badge, index) => (
                                <span key={badge} className={cn('rounded-full px-3 py-1.5 text-xs font-black ring-1', index === 0 ? 'bg-blue-50 text-blue-700 ring-blue-100' : index === 1 ? 'bg-emerald-50 text-emerald-700 ring-emerald-100' : 'bg-violet-50 text-violet-700 ring-violet-100')}>{badge}</span>
                              ))}
                            </div>
                          )}
                        </InfoCard>

                        <InfoCard className="min-w-0 rounded-[22px] p-5 xl:p-6">
                          <SectionTitle icon={MapPin} title="What&apos;s nearby" description="Useful context from the current listing." />
                          <div className="mt-5 space-y-3">
                            {nearbyContext.map((item) => {
                              const Icon = item.icon;
                              return (
                                <div key={`${item.label}-${item.detail}`} className="flex min-w-0 items-center justify-between gap-3">
                                  <div className="flex min-w-0 items-center gap-3">
                                    <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', item.tone)}><Icon className="h-4 w-4" /></span>
                                    <span className="min-w-0 break-words text-sm font-black text-slate-800">{item.label}</span>
                                  </div>
                                  <span className="shrink-0 text-right text-xs font-bold text-slate-400">{item.detail}</span>
                                </div>
                              );
                            })}
                          </div>
                        </InfoCard>

                        <InfoCard className="min-w-0 rounded-[22px] border-emerald-100 bg-emerald-50/55 p-5 md:col-span-2 xl:col-span-1 xl:p-6">
                          <SectionTitle icon={Car} title="Local travel context" description="Practical signals for planning your stay." />
                          <div className="mt-5 space-y-3">
                            {localTravelContext.map((item) => (
                              <div key={item} className="flex min-w-0 items-start gap-3 text-sm font-semibold leading-6 text-slate-600">
                                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
                                <span className="min-w-0">{item}</span>
                              </div>
                            ))}
                          </div>
                        </InfoCard>
                      </div>
                    </div>

                    <div className="flex min-w-0 items-center gap-4 rounded-[22px] border border-blue-100 bg-blue-50/70 p-4 sm:p-5">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm ring-1 ring-blue-100">
                        <CalendarDays className="h-6 w-6" />
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-base font-black text-slate-950">Check-in information</h3>
                        <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">Exact meeting point or self check-in instructions will be provided after your booking is confirmed.</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'policies' && (
                  <div className="motion-fade-up space-y-5">
                    <InfoCard className="p-4 sm:p-5 2xl:p-6">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <SectionTitle icon={ShieldCheck} title="Property policies" description="Important information to help you plan your stay." />
                        <Button
                          type="button"
                          variant="outline"
                          className="h-12 rounded-2xl border-blue-100 bg-blue-50/60 px-4 text-sm font-black text-blue-700 hover:bg-blue-100 md:self-start"
                          onClick={() => window.print()}
                        >
                          <Printer className="mr-2 h-4 w-4" />
                          Print policies
                        </Button>
                      </div>

                      <div className="mt-6 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 min-[1380px]:grid-cols-[repeat(5,minmax(0,1fr))]">
                        {policySummaryCards.map((item) => {
                          const Icon = item.icon;
                          const styles = policyCardStyles[item.key] || policyCardStyles['check-times'];
                          return (
                            <article key={item.key} className={cn('group relative flex min-h-[210px] min-w-0 overflow-hidden rounded-[22px] border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:min-h-[300px] sm:p-6', styles.card)}>
                              <PolicyCardPattern type={item.key} className={cn('pointer-events-none absolute bottom-0 right-0 h-32 w-32 opacity-[0.06] sm:h-40 sm:w-40', styles.decoration)} />
                              <div className="relative z-10 flex h-full min-w-0 flex-1 flex-col">
                                <div className="flex min-w-0 items-start justify-between gap-3">
                                  <span className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1 sm:h-16 sm:w-16 sm:rounded-[20px]', styles.icon)}>
                                    <Icon className="h-6 w-6 sm:h-8 sm:w-8" />
                                  </span>
                                  <ChevronRight className="mt-3 h-5 w-5 shrink-0 text-slate-500/80 transition group-hover:translate-x-0.5 group-hover:text-blue-600 sm:mt-4" />
                                </div>
                                <div className="mt-5 min-w-0 sm:mt-8">
                                  <p className={cn('text-xs font-semibold uppercase tracking-wide', styles.label)}>{item.label}</p>
                                  <h3 className="mt-2 break-words text-lg font-semibold leading-tight text-slate-950 sm:mt-3 sm:text-[20px]">{item.value}</h3>
                                  <p className="mt-3 text-sm font-medium leading-6 text-slate-600 sm:mt-5">{item.helper}</p>
                                </div>
                              </div>
                            </article>
                          );
                        })}
                      </div>

                      <div className="mt-5 flex justify-center">
                        <button
                          type="button"
                          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-black text-blue-700 transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
                          onClick={() => setShowAllPolicies((current) => !current)}
                          aria-expanded={showAllPolicies}
                        >
                          {showAllPolicies ? 'Hide all policies' : 'See all policies'}
                          <ChevronDown className={cn('h-4 w-4 transition-transform', showAllPolicies && 'rotate-180')} />
                        </button>
                      </div>

                      {showAllPolicies && (
                        <div className="policy-expand-panel mt-4 rounded-[22px] border border-slate-200 bg-slate-50/70 p-4">
                          {policies.length > 0 ? (
                            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                              {policies.map((item, index) => <div key={item.key} className="motion-stagger-item" style={{ animationDelay: `${index * 55}ms` }}><DetailItemCard item={item} /></div>)}
                            </div>
                          ) : (
                            <p className="text-sm font-semibold leading-6 text-slate-500">No additional provider policy data is available for this listing yet.</p>
                          )}
                        </div>
                      )}
                    </InfoCard>

                    <InfoCard className="relative overflow-hidden rounded-[24px] border-blue-100 bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/50 p-4 sm:p-6">
                      <svg
                        aria-hidden="true"
                        className="pointer-events-none absolute right-4 top-2 h-40 w-56 text-blue-600 opacity-[0.10] sm:right-8 sm:top-0 sm:h-48 sm:w-72"
                        viewBox="0 0 300 210"
                        fill="none"
                      >
                        <circle cx="198" cy="112" r="42" fill="#FACC15" opacity="0.55" />
                        <rect x="116" y="34" width="82" height="108" rx="14" fill="currentColor" opacity="0.18" />
                        <path d="M132 58H182M132 80H182M132 102H160" stroke="currentColor" strokeWidth="8" strokeLinecap="round" opacity="0.55" />
                        <path d="M122 34V20M176 34V20" stroke="#0F172A" strokeWidth="7" strokeLinecap="round" opacity="0.35" />
                        <path d="M204 72L246 88V124C246 148 230 166 204 176C178 166 162 148 162 124V88L204 72Z" fill="#2563EB" opacity="0.75" />
                        <path d="M186 122L199 135L224 106" stroke="white" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M72 84C42 72 30 50 34 24C58 28 78 42 86 68" stroke="#38BDF8" strokeWidth="8" strokeLinecap="round" opacity="0.7" />
                        <path d="M68 132C38 132 18 116 8 92C32 82 58 88 76 108" stroke="#38BDF8" strokeWidth="8" strokeLinecap="round" opacity="0.55" />
                        <circle cx="270" cy="42" r="5" fill="#2563EB" opacity="0.45" />
                        <circle cx="286" cy="74" r="4" fill="#2563EB" opacity="0.35" />
                        <circle cx="250" cy="26" r="3" fill="#2563EB" opacity="0.35" />
                      </svg>

                      <div className="relative z-10">
                        <div className="flex min-w-0 items-center gap-4">
                          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm ring-1 ring-blue-100">
                            <Info className="h-6 w-6" />
                          </span>
                          <div className="min-w-0">
                            <h2 className="text-xl font-black tracking-tight text-slate-950">Booking & payment notes</h2>
                            <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">Please review the following information before booking.</p>
                          </div>
                        </div>

                        <div className="mt-6 grid min-w-0 grid-cols-1 items-stretch gap-4 md:grid-cols-2 xl:grid-cols-4">
                          {bookingNoteCards.map((card) => {
                            const Icon = card.icon;
                            const bulletColor = card.tone === 'amber' ? 'text-orange-500' : card.tone === 'violet' ? 'text-violet-600' : card.tone === 'emerald' ? 'text-emerald-600' : 'text-blue-600';
                            const cardAccent = card.tone === 'amber'
                              ? 'border-orange-100 shadow-orange-100/40'
                              : card.tone === 'violet'
                                ? 'border-violet-100 shadow-violet-100/40'
                                : card.tone === 'emerald'
                                  ? 'border-emerald-100 shadow-emerald-100/40'
                                  : 'border-blue-100 shadow-blue-100/40';
                            return (
                              <article key={card.key} className={cn('flex h-full min-w-0 flex-col rounded-[20px] border bg-white/90 p-5 shadow-sm', cardAccent)}>
                                <div className="flex min-w-0 items-start gap-3">
                                  <span className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1', toneClasses[card.tone])}>
                                    <Icon className="h-5 w-5" />
                                  </span>
                                  <div className="min-w-0">
                                    <h3 className="text-base font-black text-slate-950">{card.title}</h3>
                                    <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">{card.description}</p>
                                  </div>
                                </div>
                                <div className="mt-5 space-y-3">
                                  {card.bullets.map((bullet) => (
                                    <div key={bullet} className="flex min-w-0 items-start gap-3 text-sm font-semibold leading-6 text-slate-600">
                                      <CheckCircle2 className={cn('mt-1 h-4 w-4 shrink-0', bulletColor)} />
                                      <span className="min-w-0">{bullet}</span>
                                    </div>
                                  ))}
                                </div>
                              </article>
                            );
                          })}
                        </div>

                        <div className="mt-6 flex flex-col gap-4 rounded-[22px] border border-blue-100 bg-blue-50/80 p-4 shadow-sm sm:p-5 xl:flex-row xl:items-center xl:justify-between">
                          <div className="flex min-w-0 items-center gap-4">
                            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm ring-1 ring-blue-100">
                              <Headphones className="h-7 w-7" />
                            </span>
                            <div className="min-w-0">
                              <h3 className="text-base font-black text-slate-950">Need help understanding our policies?</h3>
                              <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">Our support team is here to help 24/7.</p>
                            </div>
                          </div>
                          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center xl:justify-end">
                            {['24/7 Support', 'Fast response', 'Real people'].map((label) => (
                              <span key={label} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/85 px-4 text-xs font-black text-slate-700 shadow-sm">
                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                {label}
                              </span>
                            ))}
                            <Button
                              type="button"
                              className="h-11 shrink-0 rounded-2xl bg-blue-600 px-5 text-sm font-black text-white shadow-lg shadow-blue-500/20 hover:bg-blue-500"
                              onClick={() => navigate('/ai/assistant')}
                            >
                              <Headphones className="mr-2 h-4 w-4" />
                              Contact support
                            </Button>
                          </div>
                        </div>
                      </div>
                    </InfoCard>
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div className="motion-fade-up">
                    <ReviewSection listingId={listing.id} averageRating={listing.averageRating} reviewCount={listing.reviewCount} listingTitle={listing.title} />
                  </div>
                )}

                {activeTab === 'extras' && (
                  <ExtrasServicesTab listing={listing} isAuthenticated={isAuthenticated} />
                )}
              </div>
            </section>
          </div>

      </main>

      {showLoginPrompt && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 px-4 py-4 backdrop-blur-sm sm:items-center" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setShowLoginPrompt(false)}>
          <section role="dialog" aria-modal="true" aria-labelledby="login-required-title" className="motion-fade-up w-full max-w-md rounded-3xl border border-white/70 bg-white p-6 shadow-2xl shadow-slate-950/20">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><ShieldCheck className="h-6 w-6" /></div>
            <h2 id="login-required-title" className="mt-4 text-2xl font-bold text-slate-950">{loginPromptAction === 'cart' ? 'Please log in to add this listing to your cart.' : 'Please log in to book this listing.'}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">We will bring you back to this listing after sign in so you can continue.</p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button variant="outline" className="rounded-2xl bg-white" onClick={() => setShowLoginPrompt(false)}>Cancel</Button>
              <Button className="rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 shadow-lg shadow-blue-500/20" onClick={continueToLogin}>Log in to continue</Button>
            </div>
          </section>
        </div>
      )}

      {showMobileBookingBar && (
        <div className="motion-mobile-booking-bar fixed inset-x-0 bottom-0 z-40 border-t border-blue-100 bg-white/95 px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 shadow-2xl shadow-slate-950/15 backdrop-blur md:hidden">
          <div className="mx-auto flex max-w-screen-sm items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Starting from</p>
              <p className="truncate text-lg font-black text-slate-950">{formatMoney(listing.basePrice, listing.currency)}</p>
            </div>
            <Button
              className="h-11 shrink-0 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 text-sm font-black shadow-lg shadow-blue-500/25"
              onClick={openBookingFlow}
              disabled={listing.status !== 'ACTIVE'}
            >
              Book now
            </Button>
          </div>
        </div>
      )}

      <BookingRequestModal
        listing={listing}
        isOpen={isBookingOpen}
        mode={bookingMode}
        onClose={() => setIsBookingOpen(false)}
        onSuccess={(_, status) => {
          if (status === 'added') setCartNotice('Added to cart. You can review it later before checkout.');
          else if (status === 'duplicate') setCartNotice('This listing is already in your cart.');
        }}
      />

      <PhotoLightbox
        images={galleryImages}
        selectedIndex={selectedPhotoIndex}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        onSelect={setSelectedPhotoIndex}
        listingTitle={listing.title}
        listingLocation={location}
        listingDescription={listing.shortDesc || listing.description}
      />
    </div>
  );
};
