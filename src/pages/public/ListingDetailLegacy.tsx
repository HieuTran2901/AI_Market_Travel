import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Activity,
  BadgeCheck,
  BedDouble,
  Building2,
  CalendarDays,
  Camera,
  Car,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  Dumbbell,
  Heart,
  Info,
  Map,
  MapPin,
  PawPrint,
  ShieldCheck,
  Share,
  ShoppingCart,
  Sparkles,
  Star,
  Utensils,
  Waves,
  Wifi,
  XCircle,
  Users,
  WalletCards,
} from 'lucide-react';
import { listingService } from '@/services/listingService';
import { ListingResponse } from '@/types/listing';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { StateBlock } from '@/components/ui/StateBlock';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PhotoLightbox } from '@/components/listing/PhotoLightbox';
import { ReviewSection } from '@/components/listing/ReviewSection';
import { BookingRequestModal } from '@/components/listing/BookingRequestModal';
import { useAuth } from '@/context/AuthContext';

function formatCategory(category: string) {
  return category.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
}

function formatKey(key: string) {
  return key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim().replace(/\b\w/g, char => char.toUpperCase());
}

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'boolean') return value ? 'Available' : 'Not available';
  if (Array.isArray(value)) return value.filter(Boolean).join(', ');
  return String(value).replace(/_/g, ' ');
}

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: currency || 'VND',
    maximumFractionDigits: 0,
  }).format(value);
}

function getGalleryImages(listing: ListingResponse) {
  const images = listing.images?.length
    ? listing.images.map(image => ({
        src: image.imageUrl,
        alt: image.altText || listing.title,
      }))
    : listing.coverImageUrl
      ? [{ src: listing.coverImageUrl, alt: listing.title }]
      : [];

  return images;
}

type DetailItem = {
  key: string;
  label: string;
  value: string;
  helper?: string;
  icon: React.ElementType;
  tone?: 'blue' | 'emerald' | 'amber' | 'rose' | 'slate';
  positive?: boolean;
};

type DetailGroup = {
  title: string;
  description: string;
  icon: React.ElementType;
  tone: 'blue' | 'emerald' | 'amber' | 'rose' | 'slate';
  items: DetailItem[];
};

const toneStyles = {
  blue: {
    panel: 'from-blue-50/80 via-white to-cyan-50/60 border-blue-100',
    icon: 'bg-blue-600 text-white shadow-blue-500/20',
    itemIcon: 'bg-blue-50 text-blue-600 ring-blue-100',
    value: 'text-blue-950',
  },
  emerald: {
    panel: 'from-emerald-50/80 via-white to-teal-50/60 border-emerald-100',
    icon: 'bg-emerald-600 text-white shadow-emerald-500/20',
    itemIcon: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
    value: 'text-emerald-950',
  },
  amber: {
    panel: 'from-amber-50/80 via-white to-orange-50/60 border-amber-100',
    icon: 'bg-amber-500 text-white shadow-amber-500/20',
    itemIcon: 'bg-amber-50 text-amber-600 ring-amber-100',
    value: 'text-amber-950',
  },
  rose: {
    panel: 'from-rose-50/80 via-white to-pink-50/60 border-rose-100',
    icon: 'bg-rose-500 text-white shadow-rose-500/20',
    itemIcon: 'bg-rose-50 text-rose-600 ring-rose-100',
    value: 'text-rose-950',
  },
  slate: {
    panel: 'from-slate-50 via-white to-gray-50 border-slate-200',
    icon: 'bg-slate-800 text-white shadow-slate-500/20',
    itemIcon: 'bg-slate-100 text-slate-700 ring-slate-200',
    value: 'text-slate-950',
  },
};

function textItem(details: Record<string, unknown>, key: string, label: string, icon: React.ElementType, helper?: string, tone: DetailItem['tone'] = 'blue', formatter?: (value: unknown) => string | null): DetailItem | null {
  const value = formatter ? formatter(details[key]) : formatValue(details[key]);
  if (!value) return null;
  return { key, label, value, helper, icon, tone };
}

function booleanItem(details: Record<string, unknown>, key: string, label: string, icon: React.ElementType, includedText = 'Included', helper?: string, tone: DetailItem['tone'] = 'emerald'): DetailItem | null {
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

function starValue(value: unknown) {
  if (value === null || value === undefined || value === '') return null;
  return `${value}-star stay`;
}

function roomValue(value: unknown) {
  if (value === null || value === undefined || value === '') return null;
  return `${value} rooms`;
}

function hourValue(value: unknown) {
  if (value === null || value === undefined || value === '') return null;
  return `${value} hours`;
}

function dayValue(value: unknown) {
  if (value === null || value === undefined || value === '') return null;
  return `${value} day${Number(value) === 1 ? '' : 's'}`;
}

function peopleValue(value: unknown) {
  if (value === null || value === undefined || value === '') return null;
  return `Up to ${value} people`;
}

function seatValue(value: unknown) {
  if (value === null || value === undefined || value === '') return null;
  return `${value} seats`;
}

function getDetailGroups(listing: ListingResponse): DetailGroup[] {
  const details = listing.details || {};
  const addGroup = (group: DetailGroup) => group.items.length > 0 ? group : null;

  const groupsByCategory: Record<string, Array<DetailGroup | null>> = {
    HOTEL: [
      addGroup({
        title: 'Stay basics',
        description: 'Essential check-in, room, and hotel category details.',
        icon: BedDouble,
        tone: 'blue',
        items: [
          textItem(details, 'starRating', 'Hotel category', Star, 'Premium stay classification.', 'amber', starValue),
          textItem(details, 'totalRooms', 'Stay size', Building2, 'A quick sense of property scale.', 'blue', roomValue),
          textItem(details, 'checkInTime', 'Check-in', Clock, 'Standard arrival window.', 'blue'),
          textItem(details, 'checkOutTime', 'Check-out', Clock, 'Standard departure time.', 'blue'),
        ].filter(Boolean) as DetailItem[],
      }),
      addGroup({
        title: 'Amenities',
        description: 'Guest-friendly facilities available at this stay.',
        icon: Sparkles,
        tone: 'emerald',
        items: [
          booleanItem(details, 'hasPool', 'Swimming pool', Waves, 'Available', 'Relax with access to pool facilities.'),
          booleanItem(details, 'hasSpa', 'Spa access', Sparkles, 'Available', 'Wellness facilities for a calmer stay.'),
          booleanItem(details, 'hasGym', 'Fitness center', Dumbbell, 'Available', 'Keep your routine while traveling.'),
          booleanItem(details, 'hasRestaurant', 'On-site restaurant', Utensils, 'Available', 'Dining is available at the property.'),
          booleanItem(details, 'hasFreeWifi', 'Free Wi-Fi', Wifi, 'Included', 'Stay connected throughout your visit.'),
          booleanItem(details, 'hasParking', 'Parking', Car, 'Available', 'Convenient parking support for guests.'),
          booleanItem(details, 'hasBreakfast', 'Breakfast', Utensils, 'Included', 'Breakfast may be included with this stay.'),
          booleanItem(details, 'hasBar', 'Dining & bar', Utensils, 'Available', 'On-site dining or bar options are available.'),
          booleanItem(details, 'hasRoomService', 'Room service', Utensils, 'Available', 'Enjoy meals in the comfort of your room.'),
          booleanItem(details, 'hasAirConditioning', 'Air conditioning', Sparkles, 'Available', 'Climate comfort is available in guest areas.'),
          booleanItem(details, 'hasBeachAccess', 'Beach access', Waves, 'Available', 'Beach access is available for guests.'),
          booleanItem(details, 'hasElevator', 'Elevator', Building2, 'Available', 'Elevator access is available at the property.'),
          booleanItem(details, 'hasConcierge', 'Concierge', BadgeCheck, 'Available', 'Concierge support may be available.'),
          booleanItem(details, 'hasLaundry', 'Laundry service', CheckCircle2, 'Available', 'Laundry support may be available during your stay.'),
        ].filter(Boolean) as DetailItem[],
      }),
      addGroup({
        title: 'Guest policies / house rules',
        description: 'Useful notes for planning who and what can come along.',
        icon: ShieldCheck,
        tone: 'slate',
        items: [
          booleanItem(details, 'petFriendly', 'Pet friendly', PawPrint, 'Pets welcome', 'Bring pets when the provider allows it.', 'amber'),
          booleanItem(details, 'smokingAllowed', 'Smoking', Info, 'Allowed', 'Smoking policy is defined by the provider.', 'rose'),
          booleanItem(details, 'childrenAllowed', 'Children', Users, 'Welcome', 'Children are welcome when the provider allows it.', 'blue'),
          booleanItem(details, 'eventsAllowed', 'Events & parties', Sparkles, 'Allowed', 'Events are possible when approved by the provider.', 'rose'),
        ].filter(Boolean) as DetailItem[],
      }),
    ],
    TOUR: [
      addGroup({
        title: 'Tour logistics',
        description: 'Timing, group size, and meeting information for the tour.',
        icon: Map,
        tone: 'blue',
        items: [
          textItem(details, 'durationDays', 'Duration', CalendarDays, 'Total tour length.', 'blue', dayValue),
          textItem(details, 'durationHours', 'Time on tour', Clock, 'Expected active tour time.', 'blue', hourValue),
          textItem(details, 'maxGroupSize', 'Group size', Users, 'Maximum travelers per departure.', 'emerald', peopleValue),
          textItem(details, 'minGroupSize', 'Minimum group', Users, 'Minimum travelers required.', 'slate'),
          textItem(details, 'meetingPoint', 'Meeting point', MapPin, 'Where the experience begins.', 'amber'),
        ].filter(Boolean) as DetailItem[],
      }),
      addGroup({
        title: 'Included and excluded',
        description: 'What the provider includes and what travelers should plan separately.',
        icon: CheckCircle2,
        tone: 'emerald',
        items: [
          textItem(details, 'includes', 'Included', CheckCircle2, 'Covered by this booking.', 'emerald'),
          textItem(details, 'excludes', 'Not included', Info, 'Plan separately if needed.', 'amber'),
          textItem(details, 'tourType', 'Tour style', Sparkles, 'Provider operating style.', 'blue'),
        ].filter(Boolean) as DetailItem[],
      }),
      addGroup({
        title: 'Route preview',
        description: 'A quick look at the planned experience flow.',
        icon: Map,
        tone: 'amber',
        items: [
          textItem(details, 'itinerary', 'Itinerary', Map, 'Main stops and story arc.', 'amber'),
        ].filter(Boolean) as DetailItem[],
      }),
    ],
    RESTAURANT: [
      addGroup({
        title: 'Dining basics',
        description: 'Cuisine, capacity, hours, and dining style.',
        icon: Utensils,
        tone: 'amber',
        items: [
          textItem(details, 'cuisineType', 'Cuisine', Utensils, 'Primary dining style.', 'amber'),
          textItem(details, 'seatingCapacity', 'Seating capacity', Users, 'Approximate dining capacity.', 'blue', peopleValue),
          textItem(details, 'openingHours', 'Opening hours', Clock, 'Current service window.', 'blue'),
          textItem(details, 'priceRange', 'Price range', WalletCards, 'Dining budget category.', 'emerald'),
        ].filter(Boolean) as DetailItem[],
      }),
      addGroup({
        title: 'Service options',
        description: 'Available ways to enjoy the restaurant.',
        icon: CheckCircle2,
        tone: 'emerald',
        items: [
          booleanItem(details, 'hasDineIn', 'Dine-in', Utensils, 'Available', 'Enjoy the restaurant on site.'),
          booleanItem(details, 'hasTakeaway', 'Takeaway', CheckCircle2, 'Available', 'Order for pickup when supported.'),
          booleanItem(details, 'hasDelivery', 'Delivery', Car, 'Available', 'Delivery service may be available.'),
          booleanItem(details, 'hasReservations', 'Reservations', CalendarDays, 'Available', 'Reserve ahead for smoother planning.'),
          booleanItem(details, 'vegetarianFriendly', 'Vegetarian friendly', Sparkles, 'Available', 'Vegetarian-friendly options are offered.'),
        ].filter(Boolean) as DetailItem[],
      }),
    ],
    VEHICLE: [
      addGroup({
        title: 'Vehicle essentials',
        description: 'Core vehicle specs for comfort and trip planning.',
        icon: Car,
        tone: 'blue',
        items: [
          textItem(details, 'vehicleType', 'Vehicle type', Car, 'Rental category.', 'blue'),
          textItem(details, 'brand', 'Brand', BadgeCheck, 'Vehicle maker.', 'slate'),
          textItem(details, 'model', 'Model', BadgeCheck, 'Listed model.', 'slate'),
          textItem(details, 'manufactureYear', 'Year', CalendarDays, 'Vehicle production year.', 'amber'),
          textItem(details, 'seats', 'Seats', Users, 'Passenger capacity.', 'emerald', seatValue),
        ].filter(Boolean) as DetailItem[],
      }),
      addGroup({
        title: 'Rental conditions',
        description: 'Driver, license, and operating details.',
        icon: ShieldCheck,
        tone: 'emerald',
        items: [
          textItem(details, 'fuelType', 'Fuel type', Info, 'Operating fuel.', 'blue'),
          textItem(details, 'transmission', 'Transmission', Activity, 'Driving configuration.', 'blue'),
          booleanItem(details, 'hasDriver', 'Driver option', Users, 'Driver included', 'Provider can include a driver.'),
          booleanItem(details, 'requiresLicense', 'License required', ShieldCheck, 'Required', 'Traveler must provide a valid license.', 'amber'),
          textItem(details, 'minRentalDays', 'Minimum rental', CalendarDays, 'Shortest supported rental period.', 'slate', dayValue),
        ].filter(Boolean) as DetailItem[],
      }),
    ],
    EXPERIENCE: [
      addGroup({
        title: 'Experience basics',
        description: 'Timing, group size, and skill level for this activity.',
        icon: Sparkles,
        tone: 'blue',
        items: [
          textItem(details, 'durationHours', 'Duration', Clock, 'Expected activity length.', 'blue', hourValue),
          textItem(details, 'maxParticipants', 'Participants', Users, 'Maximum group size.', 'emerald', peopleValue),
          textItem(details, 'minParticipants', 'Minimum group', Users, 'Minimum travelers required.', 'slate'),
          textItem(details, 'skillLevel', 'Skill level', Sparkles, 'Best-fit experience level.', 'amber'),
          textItem(details, 'meetingPoint', 'Meeting point', MapPin, 'Where the experience begins.', 'blue'),
        ].filter(Boolean) as DetailItem[],
      }),
      addGroup({
        title: 'Preparation',
        description: 'What is provided and what travelers should bring.',
        icon: CheckCircle2,
        tone: 'emerald',
        items: [
          textItem(details, 'includes', 'Included', CheckCircle2, 'Covered by this experience.', 'emerald'),
          textItem(details, 'whatToBring', 'What to bring', Info, 'Recommended traveler preparation.', 'amber'),
        ].filter(Boolean) as DetailItem[],
      }),
    ],
  };

  const groups = (groupsByCategory[listing.category] || [])
    .filter(Boolean) as DetailGroup[];

  if (groups.length > 0) {
    return groups;
  }

  const fallbackItems = Object.entries(details)
    .map(([key, value]) => ({ key, label: formatKey(key), value: formatValue(value), icon: CheckCircle2, tone: 'blue' as const }))
    .filter(item => item.value) as DetailItem[];

  return fallbackItems.length
    ? [{
        title: 'Listing details',
        description: 'Helpful information shared by the provider.',
        icon: Info,
        tone: 'blue',
        items: fallbackItems,
      }]
    : [];
}

function amenityItems(listing: ListingResponse) {
  return Object.entries(listing.details || {})
    .filter(([, value]) => value === true)
    .map(([key]) => formatKey(key).replace(/^Has /, ''))
    .slice(0, 8);
}

const trustHighlights = [
  { title: 'Verified provider', description: 'Provider profile is connected to marketplace review flows.', icon: BadgeCheck },
  { title: 'Secure booking', description: 'Checkout uses the platform payment and status tracking flow.', icon: ShieldCheck },
  { title: 'Flexible availability', description: 'Availability is managed through live inventory records.', icon: CalendarDays },
  { title: 'AI trip ready', description: 'Ask the planner how this listing fits into your itinerary.', icon: Sparkles },
];

const LoadingSkeleton = () => (
  <div className="mx-auto w-full max-w-[1540px] px-5 py-8 sm:px-6 lg:px-8 xl:px-10 2xl:max-w-[1680px]">
    <div className="h-4 w-56 animate-pulse rounded-full bg-gray-200" />
    <div className="mt-5 h-10 w-3/4 animate-pulse rounded-xl bg-gray-200" />
    <div className="mt-3 h-5 w-1/2 animate-pulse rounded-full bg-gray-100" />
    <div className="mt-8 grid h-[420px] gap-3 overflow-hidden rounded-3xl md:grid-cols-[1.45fr_1fr]">
      <div className="animate-pulse bg-gray-200" />
      <div className="hidden grid-cols-2 gap-3 md:grid">
        {Array.from({ length: 4 }).map((_, index) => <div key={index} className="animate-pulse bg-gray-100" />)}
      </div>
    </div>
    <div className="mt-10 grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_360px] 2xl:grid-cols-[minmax(0,1fr)_390px]">
      <div className="space-y-5">
        {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-28 animate-pulse rounded-2xl bg-gray-100" />)}
      </div>
      <div className="h-80 animate-pulse rounded-3xl bg-gray-100" />
    </div>
  </div>
);

const ImageFallback = ({ title, className = '' }: { title: string; className?: string }) => (
  <div className={`flex h-full min-h-0 items-center justify-center bg-gradient-to-br from-blue-50 via-cyan-50 to-slate-100 text-center ${className}`}>
    <div>
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/85 shadow-sm">
        <Camera className="h-7 w-7 text-blue-500" />
      </div>
      <p className="mt-3 text-sm font-semibold text-gray-600">{title}</p>
      <p className="text-xs text-gray-400">Photos coming soon</p>
    </div>
  </div>
);

const AnimatedSection = ({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => (
  <section className={`motion-fade-up ${className}`} style={{ animationDelay: `${delay}ms` }}>
    {children}
  </section>
);

const DetailItemCard = ({ item }: { item: DetailItem }) => {
  const tone = toneStyles[item.tone || 'blue'];
  const Icon = item.icon;

  return (
    <div className="group/item relative overflow-hidden rounded-2xl border border-white/80 bg-white/85 p-4 shadow-sm ring-1 ring-slate-200/70 transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-lg hover:shadow-slate-200/80">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent opacity-0 transition-opacity duration-300 group-hover/item:opacity-100" />
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl ring-1 transition-all duration-300 group-hover/item:scale-105 group-hover/item:shadow-lg ${tone.itemIcon}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-600">{item.label}</p>
          <p className={`mt-1 text-lg font-bold leading-6 ${tone.value}`}>{item.value}</p>
          {item.helper && <p className="mt-1.5 text-xs leading-5 text-gray-500">{item.helper}</p>}
        </div>
      </div>
    </div>
  );
};

const getHotelBasics = (listing: ListingResponse) => {
  const details = listing.details || {};
  return [
    textItem(details, 'starRating', 'Hotel category', Star, 'Premium luxury classification', 'amber', starValue) || {
      key: 'category',
      label: 'Hotel category',
      value: formatCategory(listing.category),
      helper: 'Marketplace category',
      icon: Star,
      tone: 'amber' as const,
    },
    textItem(details, 'totalRooms', 'Stay size', Building2, 'Across the property.', 'blue', roomValue),
    textItem(details, 'checkInTime', 'Check-in', Clock, 'Standard arrival window.', 'blue'),
    textItem(details, 'checkOutTime', 'Check-out', Clock, 'Standard departure time.', 'blue'),
  ].filter(Boolean) as DetailItem[];
};

const QuickFactCard = ({ item }: { item: DetailItem }) => {
  const tone = toneStyles[item.tone || 'blue'];
  const Icon = item.icon;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-md sm:px-5">
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ring-1 ${tone.itemIcon}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-500">{item.label}</p>
          <p className="mt-1 text-sm font-black leading-5 text-slate-950">{item.value}</p>
          {item.helper && <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{item.helper}</p>}
        </div>
      </div>
    </div>
  );
};

const SectionHeader = ({
  icon: Icon,
  title,
  description,
  tone = 'blue',
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  tone?: DetailItem['tone'];
}) => {
  const styles = toneStyles[tone || 'blue'];

  return (
    <div className="flex items-start gap-4">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-lg ${styles.icon}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <h2 className="text-xl font-black tracking-tight text-slate-950">{title}</h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>
      </div>
    </div>
  );
};

const InfoGroupCard = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 ${className}`}>
    {children}
  </div>
);

const PlaneLikeIcon = () => (
  <svg viewBox="0 0 80 48" className="h-12 w-20" fill="none" aria-hidden="true">
    <path d="M8 36c16-14 31-20 58-25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="5 6" opacity="0.45" />
    <path d="M55 7 72 14 58 20 52 32 47 29 50 19 38 15 43 10l12 3V7Z" fill="currentColor" opacity="0.75" />
    <circle cx="17" cy="30" r="3" fill="currentColor" opacity="0.25" />
    <circle cx="30" cy="23" r="2" fill="currentColor" opacity="0.25" />
  </svg>
);

const AmenitiesPanel = ({ group }: { group?: DetailGroup }) => {
  if (!group || group.items.length === 0) return null;

  return (
    <InfoGroupCard className="border-emerald-100 bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/40">
      <SectionHeader
        icon={Sparkles}
        title="Amenities"
        description="Guest-friendly facilities available at this stay."
        tone="emerald"
      />
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {group.items.map(item => <DetailItemCard key={item.key} item={item} />)}
      </div>
    </InfoGroupCard>
  );
};

const PoliciesPanel = ({ group }: { group?: DetailGroup }) => {
  if (!group || group.items.length === 0) return null;

  return (
    <InfoGroupCard>
      <SectionHeader
        icon={ShieldCheck}
        title="Guest policies / house rules"
        description="Useful notes for planning who and what can come along."
        tone="blue"
      />
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {group.items.map(item => <DetailItemCard key={item.key} item={item} />)}
      </div>
    </InfoGroupCard>
  );
};

const AmenityChips = ({ amenities }: { amenities: string[] }) => {
  const [expanded, setExpanded] = useState(false);
  const visibleAmenities = expanded ? amenities : amenities.slice(0, 10);

  return (
    <InfoGroupCard>
      <SectionHeader
        icon={CheckCircle2}
        title="Amenities & inclusions"
        description="A compact summary of available facilities and included services."
        tone="emerald"
      />
      {amenities.length > 0 ? (
        <>
          <div className="mt-5 flex flex-wrap gap-2">
            {visibleAmenities.map(item => (
              <span key={item} className="rounded-full bg-emerald-50 px-3.5 py-2 text-xs font-black text-emerald-700 ring-1 ring-emerald-100">
                {item}
              </span>
            ))}
          </div>
          {amenities.length > 10 && (
            <button
              type="button"
              className="mt-4 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-black text-blue-700 transition hover:bg-blue-100"
              onClick={() => setExpanded(value => !value)}
            >
              {expanded ? 'Show less' : 'View all'}
            </button>
          )}
        </>
      ) : (
        <p className="mt-5 text-sm leading-6 text-slate-500">Amenities and inclusions vary by provider and booking date.</p>
      )}
    </InfoGroupCard>
  );
};

const LocationPanel = ({ location }: { location: string }) => (
  <InfoGroupCard>
    <SectionHeader
      icon={Map}
      title="Location"
      description="Address and check-in context for this listing."
      tone="blue"
    />
    <div className="mt-5 overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-cyan-50">
      <div className="relative h-28 bg-[radial-gradient(circle_at_20%_40%,rgba(59,130,246,0.18),transparent_30%),linear-gradient(135deg,rgba(219,234,254,1),rgba(207,250,254,1))]">
        <div className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-500/30">
          <MapPin className="h-6 w-6" />
        </div>
      </div>
      <p className="px-4 py-3 text-sm font-semibold leading-6 text-slate-700">{location}</p>
    </div>
    <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800">
      Exact meeting or check-in instructions are confirmed after booking.
    </div>
  </InfoGroupCard>
);

const ImportantNotesPanel = () => {
  const notes = [
    'Provider policies may vary by category and travel date.',
    'Payment status and booking status are tracked in your account.',
    'Refund eligibility depends on provider and platform review.',
    'Extra charges may apply for additional services used.',
  ];

  return (
    <InfoGroupCard className="border-amber-100 bg-amber-50/60">
      <SectionHeader
        icon={Info}
        title="Policies & important notes"
        description="Booking information to keep in mind before checkout."
        tone="amber"
      />
      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-4">
        {notes.map(note => (
          <div key={note} className="rounded-2xl border border-amber-100 bg-white/80 p-4 text-sm leading-6 text-slate-700">
            {note}
          </div>
        ))}
      </div>
    </InfoGroupCard>
  );
};

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

  if (isLoading) {
    return <LoadingSkeleton />;
  }

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
  const detailGroups = getDetailGroups(listing);
  const amenities = amenityItems(listing);
  const stayBasics = getHotelBasics(listing);
  const basicsGroup = detailGroups.find(group => group.title === 'Stay basics');
  const amenitiesGroup = detailGroups.find(group => group.title === 'Amenities');
  const policiesGroup = detailGroups.find(group => group.title === 'Guest policies / house rules');
  const aboutText = listing.description || listing.shortDesc;
  const ratingLabel = listing.averageRating ? listing.averageRating.toFixed(1) : 'New';
  const location = [listing.address, listing.city, listing.country].filter(Boolean).join(', ');
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
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50/50 to-white">
      <div className="mx-auto w-full max-w-[1540px] px-5 py-6 sm:py-8 lg:px-8 xl:px-10 2xl:max-w-[1680px]">
        <nav className="motion-fade-up mb-5 flex flex-wrap items-center gap-2 text-sm text-gray-500" aria-label="Breadcrumb">
          <button className="font-medium transition-colors hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500" onClick={() => navigate('/')}>Home</button>
          <ChevronRight className="h-4 w-4" />
          <button className="font-medium transition-colors hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500" onClick={() => navigate('/search')}>Explore</button>
          <ChevronRight className="h-4 w-4" />
          <span className="truncate text-gray-700">{listing.title}</span>
        </nav>

        <header className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-4xl">
            <div className="motion-fade-up mb-3 flex flex-wrap items-center gap-2" style={{ animationDelay: '70ms' }}>
              <Badge className="bg-blue-100 text-blue-800">{formatCategory(listing.category)}</Badge>
              <StatusBadge kind="listing" status={listing.status} />
              <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-700 shadow-sm ring-1 ring-gray-200">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                {ratingLabel}
                <span className="text-gray-400">·</span>
                {listing.reviewCount} reviews
              </span>
            </div>
            <h1 className="motion-fade-up text-3xl font-bold leading-tight text-gray-950 sm:text-4xl lg:text-5xl" style={{ animationDelay: '130ms' }}>{listing.title}</h1>
            <p className="motion-fade-up mt-3 flex max-w-3xl items-start gap-2 text-sm font-medium leading-6 text-gray-600 sm:text-base" style={{ animationDelay: '190ms' }}>
              <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
              {location}
            </p>
          </div>

          <div className="motion-fade-up flex gap-2" style={{ animationDelay: '230ms' }}>
            <Button variant="outline" size="sm" className="rounded-full bg-white shadow-sm">
              <Share className="mr-2 h-4 w-4" /> Share
            </Button>
            <Button variant="outline" size="sm" className="rounded-full bg-white shadow-sm" disabled title="Wishlist is not connected yet">
              <Heart className="mr-2 h-4 w-4" /> Save
            </Button>
          </div>
        </header>

        <section className="motion-fade-up group relative mb-10 w-full rounded-3xl shadow-xl shadow-slate-200/80 ring-1 ring-black/5" style={{ animationDelay: '260ms' }}>
          {previewImages.length > 0 ? (
            <div className="grid h-[320px] w-full gap-2 overflow-hidden rounded-3xl bg-white sm:h-[420px] lg:h-auto lg:min-h-[430px] lg:max-h-[620px] lg:aspect-[16/5.2] lg:grid-cols-[minmax(0,1.65fr)_minmax(0,0.9fr)_minmax(0,0.9fr)] lg:grid-rows-2">
              <div
                role="button"
                tabIndex={0}
                className="group/photo relative min-h-0 overflow-hidden text-left focus:outline-none focus:ring-4 focus:ring-blue-500/30 lg:row-span-2"
                onClick={() => openLightbox(0)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openLightbox(0);
                  }
                }}
                aria-label="Open main listing photo"
              >
                <img src={previewImages[0].src} alt={previewImages[0].alt} className="image-reveal h-full w-full object-cover transition-transform duration-700 group-hover/photo:scale-[1.03]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
                <Button
                  variant="secondary"
                  className="absolute bottom-4 right-4 z-10 rounded-full bg-white/90 opacity-90 shadow-lg backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:opacity-100 hover:shadow-xl lg:hidden"
                  onClick={(event) => {
                    event.stopPropagation();
                    openLightbox(0);
                  }}
                >
                  <Camera className="mr-2 h-4 w-4" /> View all photos
                </Button>
              </div>
              {Array.from({ length: 4 }).map((_, index) => {
                const image = previewImages[index + 1];
                const isLastCell = index === 3;
                return image ? (
                  <div
                    key={image.src}
                    role="button"
                    tabIndex={0}
                    className="group/photo relative hidden min-h-0 overflow-hidden focus:outline-none focus:ring-4 focus:ring-blue-500/30 lg:block"
                    onClick={() => openLightbox(index + 1)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        openLightbox(index + 1);
                      }
                    }}
                    aria-label={`Open listing photo ${index + 2}`}
                  >
                    <img src={image.src} alt={image.alt} className="image-reveal h-full w-full object-cover transition-transform duration-500 group-hover/photo:scale-105" />
                    {isLastCell && (
                      <Button
                        variant="secondary"
                        className="absolute bottom-4 right-4 z-10 rounded-full bg-white/90 opacity-90 shadow-lg backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:opacity-100 hover:shadow-xl"
                        onClick={(event) => {
                          event.stopPropagation();
                          openLightbox(0);
                        }}
                      >
                        <Camera className="mr-2 h-4 w-4" /> View all photos
                      </Button>
                    )}
                  </div>
                ) : (
                  <div key={index} className="relative hidden min-h-0 overflow-hidden lg:block">
                    <ImageFallback title={listing.title} />
                    {isLastCell && (
                      <Button
                        variant="secondary"
                        className="absolute bottom-4 right-4 z-10 rounded-full bg-white/90 opacity-90 shadow-lg backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:opacity-100 hover:shadow-xl"
                        onClick={() => openLightbox(0)}
                      >
                        <Camera className="mr-2 h-4 w-4" /> View all photos
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <ImageFallback title={listing.title} className="h-[320px] overflow-hidden rounded-3xl sm:h-[420px]" />
          )}
        </section>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start 2xl:grid-cols-[minmax(0,1fr)_390px]">
          <div className="min-w-0 space-y-5">
            <AnimatedSection delay={320} className="grid w-full grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
              {stayBasics.slice(0, 4).map(item => <QuickFactCard key={item.key} item={item} />)}
              <QuickFactCard
                item={{
                  key: 'highlights',
                  label: 'Highlights',
                  value: amenities.length > 0 ? amenities.slice(0, 3).join(' • ') : formatCategory(listing.category),
                  helper: amenities.length > 3 ? `${amenities.length} amenities listed` : 'Provider details',
                  icon: Sparkles,
                  tone: 'blue',
                }}
              />
            </AnimatedSection>

            <AnimatedSection delay={360} className="overflow-hidden rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <SectionHeader
                  icon={ShieldCheck}
                  title="What you need to know before booking"
                  description="Key details, inclusions, and traveler-friendly information organized for quick comparison."
                  tone="blue"
                />
                <div className="hidden h-16 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-50 to-cyan-50 text-blue-500 sm:flex">
                  <PlaneLikeIcon />
                </div>
              </div>
            </AnimatedSection>

            {basicsGroup && (
              <AnimatedSection delay={400}>
                <InfoGroupCard>
                  <SectionHeader
                    icon={BedDouble}
                    title="Stay basics"
                    description="Essential check-in, room, and hotel category details."
                    tone="blue"
                  />
                  <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {basicsGroup.items.map(item => <DetailItemCard key={item.key} item={item} />)}
                  </div>
                </InfoGroupCard>
              </AnimatedSection>
            )}

            <AnimatedSection delay={440}>
              <AmenitiesPanel group={amenitiesGroup} />
            </AnimatedSection>

            <AnimatedSection delay={480}>
              <PoliciesPanel group={policiesGroup} />
            </AnimatedSection>

            <AnimatedSection delay={520} className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
              <AmenityChips amenities={amenities} />
              <LocationPanel location={location} />
            </AnimatedSection>

            <AnimatedSection delay={560}>
              <ImportantNotesPanel />
            </AnimatedSection>

            {aboutText && (
              <AnimatedSection delay={600}>
                <InfoGroupCard>
                  <SectionHeader
                    icon={Info}
                    title={`About this ${listing.category === 'HOTEL' ? 'stay' : 'listing'}`}
                    description="Provider description and helpful context for your trip."
                    tone="slate"
                  />
                  <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                    {aboutText}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {trustHighlights.slice(0, 4).map(item => (
                      <span key={item.title} className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
                        <item.icon className="h-3.5 w-3.5 text-blue-600" />
                        {item.title}
                      </span>
                    ))}
                  </div>
                </InfoGroupCard>
              </AnimatedSection>
            )}
          </div>

          <aside className="motion-fade-up xl:sticky xl:top-24 xl:w-full xl:self-start" style={{ animationDelay: '420ms' }}>
            <Card className="overflow-hidden rounded-3xl border-gray-200 shadow-2xl shadow-slate-200/80 transition-all duration-300 hover:-translate-y-1 hover:shadow-blue-100">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Starting from</p>
                    <p className="mt-1 text-3xl font-bold text-gray-950">{formatMoney(listing.basePrice, listing.currency)}</p>
                    <p className="text-sm text-gray-500">Base price before final checkout totals</p>
                  </div>
                  <div className="rounded-2xl bg-amber-50 px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-1 text-sm font-bold text-gray-900">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {ratingLabel}
                    </div>
                    <p className="text-xs text-gray-500">{listing.reviewCount} reviews</p>
                  </div>
                </div>

                <div className="my-6 rounded-2xl border border-gray-200 bg-slate-50 p-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Destination</p>
                      <p className="mt-1 font-semibold text-gray-900">{listing.city}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Category</p>
                      <p className="mt-1 font-semibold text-gray-900">{formatCategory(listing.category)}</p>
                    </div>
                    <div className="col-span-2 border-t border-gray-200 pt-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Provider</p>
                      <p className="mt-1 font-semibold text-gray-900">{listing.providerName}</p>
                    </div>
                  </div>
                </div>

                <Button
                  className="h-12 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 shadow-lg shadow-blue-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-blue-500/35"
                  onClick={openBookingFlow}
                  disabled={listing.status !== 'ACTIVE'}
                  title={listing.status === 'ACTIVE' ? 'Start booking this listing' : 'This listing is not currently available for booking'}
                >
                  Book Now
                </Button>
                <Button
                  variant="outline"
                  className="mt-3 h-11 w-full rounded-2xl border-blue-200 bg-blue-50/70 font-semibold text-blue-700 transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-100 hover:shadow-md"
                  onClick={openAddToCartFlow}
                  disabled={listing.status !== 'ACTIVE'}
                  title={listing.status === 'ACTIVE' ? 'Save this listing to your cart' : 'This listing is not currently available'}
                >
                  <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
                </Button>
                {cartNotice && (
                  <div className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-sm font-medium text-emerald-800">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p>{cartNotice}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="font-black text-emerald-900 underline-offset-4 hover:underline"
                            onClick={() => navigate('/cart')}
                          >
                            View Cart
                          </button>
                          <span className="text-emerald-300">/</span>
                          <button
                            type="button"
                            className="font-black text-emerald-900 underline-offset-4 hover:underline"
                            onClick={() => setCartNotice(null)}
                          >
                            Continue Browsing
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <Button variant="outline" className="mt-3 h-11 w-full rounded-2xl bg-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md" onClick={() => navigate('/ai/assistant')}>
                  <Sparkles className="mr-2 h-4 w-4" /> Ask AI about this listing
                </Button>

                <div className="mt-5 space-y-3 text-sm text-gray-600">
                  <div className="flex items-center gap-3"><CreditCard className="h-4 w-4 text-blue-600" /> Secure payment flow</div>
                  <div className="flex items-center gap-3"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Verified marketplace provider</div>
                  <div className="flex items-center gap-3"><CalendarDays className="h-4 w-4 text-amber-600" /> Availability checked during checkout</div>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>

      </div>

      <ReviewSection listingId={listing.id} averageRating={listing.averageRating} reviewCount={listing.reviewCount} listingTitle={listing.title} />

      {showLoginPrompt && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 px-4 py-4 backdrop-blur-sm sm:items-center" role="presentation" onMouseDown={event => event.target === event.currentTarget && setShowLoginPrompt(false)}>
          <section role="dialog" aria-modal="true" aria-labelledby="login-required-title" className="motion-fade-up w-full max-w-md rounded-3xl border border-white/70 bg-white p-6 shadow-2xl shadow-slate-950/20">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h2 id="login-required-title" className="mt-4 text-2xl font-bold text-slate-950">
              {loginPromptAction === 'cart' ? 'Please log in to add this listing to your cart.' : 'Please log in to book this listing.'}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">We will bring you back to this listing after sign in so you can continue.</p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button variant="outline" className="rounded-2xl bg-white" onClick={() => setShowLoginPrompt(false)}>
                Cancel
              </Button>
              <Button className="rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 shadow-lg shadow-blue-500/20" onClick={continueToLogin}>
                Log in to continue
              </Button>
            </div>
          </section>
        </div>
      )}

      <BookingRequestModal
        listing={listing}
        isOpen={isBookingOpen}
        mode={bookingMode}
        onClose={() => setIsBookingOpen(false)}
        onSuccess={(_, status) => {
          if (status === 'added') {
            setCartNotice('Added to cart. You can review it later before checkout.');
          } else if (status === 'duplicate') {
            setCartNotice('This listing is already in your cart.');
          }
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
