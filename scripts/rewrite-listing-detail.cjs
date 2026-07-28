const fs = require('fs');
const path = require('path');

const target = path.join(__dirname, '..', 'src', 'pages', 'public', 'ListingDetail.tsx');

const content = String.raw`import React, { useEffect, useMemo, useState } from 'react';
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

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { StateBlock } from '@/components/ui/StateBlock';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { BookingRequestModal } from '@/components/listing/BookingRequestModal';
import { PhotoLightbox } from '@/components/listing/PhotoLightbox';
import { ReviewSection } from '@/components/listing/ReviewSection';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { listingService } from '@/services/listingService';
import type { ListingResponse } from '@/types/listing';

type DetailTab = 'overview' | 'rates' | 'amenities' | 'location' | 'policies' | 'reviews';

type DetailItem = {
  key: string;
  label: string;
  value: string;
  helper?: string;
  icon: React.ElementType;
  tone?: 'blue' | 'emerald' | 'amber' | 'rose' | 'slate';
  positive?: boolean;
};

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
  return formatted ? \`\${formatted}-star stay\` : null;
}

function roomValue(value: unknown) {
  const formatted = formatValue(value);
  return formatted ? \`\${formatted} rooms\` : null;
}

function dayValue(value: unknown) {
  const formatted = formatValue(value);
  return formatted ? \`\${formatted} day\${Number(formatted) === 1 ? '' : 's'}\` : null;
}

function peopleValue(value: unknown) {
  const formatted = formatValue(value);
  return formatted ? \`Up to \${formatted} people\` : null;
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

const toneClasses = {
  blue: 'bg-blue-50 text-blue-600 ring-blue-100',
  emerald: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
  amber: 'bg-amber-50 text-amber-600 ring-amber-100',
  rose: 'bg-rose-50 text-rose-600 ring-rose-100',
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

const SectionTitle = ({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
}) => (
  <div className="flex items-start gap-3">
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
      <Icon className="h-5 w-5" />
    </span>
    <div>
      <h2 className="text-lg font-black text-slate-950">{title}</h2>
      {description && <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>}
    </div>
  </div>
);

const InfoCard = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn('rounded-3xl border border-slate-200 bg-white p-5 shadow-sm', className)}>{children}</div>
);

const ImageFallback = ({ title, className }: { title: string; className?: string }) => (
  <div className={cn('flex h-full min-h-[220px] w-full items-center justify-center bg-gradient-to-br from-blue-100 via-cyan-50 to-slate-100', className)}>
    <div className="text-center text-blue-700">
      <Camera className="mx-auto h-10 w-10" />
      <p className="mt-3 text-sm font-black">{title}</p>
    </div>
  </div>
);

const LocationPreview = ({ location }: { location: string }) => (
  <div className="space-y-4">
    <div className="relative h-36 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-100 via-cyan-100 to-sky-200">
      <div className="absolute inset-0 opacity-60 [background-image:linear-gradient(rgba(255,255,255,.45)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.45)_1px,transparent_1px)] [background-size:28px_28px]" />
      <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-black text-white shadow-lg">
        <MapPin className="h-4 w-4" /> {location.split(',')[0] || 'Location'}
      </div>
    </div>
    <p className="text-sm font-semibold leading-6 text-slate-700">{location}</p>
    <p className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800">
      Exact meeting or check-in instructions are confirmed after booking.
    </p>
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
  const aboutText = listing.description || listing.shortDesc;
  const ratingLabel = listing.averageRating ? listing.averageRating.toFixed(1) : 'New';
  const location = [listing.address, listing.city, listing.country].filter(Boolean).join(', ');

  const tabs: Array<{ id: DetailTab; label: string; icon: React.ElementType }> = [
    { id: 'overview', label: 'Overview', icon: Building2 },
    { id: 'rates', label: listing.category === 'HOTEL' ? 'Rooms & Rates' : 'Details & Rates', icon: BedDouble },
    { id: 'amenities', label: 'Amenities', icon: Sparkles },
    { id: 'location', label: 'Location', icon: MapPin },
    { id: 'policies', label: 'Policies', icon: ShieldCheck },
    { id: 'reviews', label: \`Reviews (\${listing.reviewCount})\`, icon: Star },
  ];

  const compactHighlights = [
    amenityNames.length > 0 ? \`\${amenityNames.length} listed amenities\` : null,
    listing.city ? \`Located in \${listing.city}\` : null,
    listing.averageRating ? \`\${listing.averageRating.toFixed(1)} average rating\` : null,
    formatCategory(listing.category),
  ].filter(Boolean) as string[];

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
    const redirect = encodeURIComponent(\`\${routeLocation.pathname}\${routeLocation.search}\`);
    navigate(\`/login?redirect=\${redirect}&reason=booking\`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50/70 to-white">
      <main className="mx-auto w-full max-w-[1680px] px-5 py-6 lg:px-8 2xl:px-10">
        <nav className="mb-5 flex flex-wrap items-center gap-2 text-sm text-slate-500" aria-label="Breadcrumb">
          <button className="font-semibold transition-colors hover:text-blue-600" onClick={() => navigate('/')}>Home</button>
          <ChevronRight className="h-4 w-4" />
          <button className="font-semibold transition-colors hover:text-blue-600" onClick={() => navigate('/search')}>Explore</button>
          <ChevronRight className="h-4 w-4" />
          {listing.city && <span className="font-semibold text-blue-600">{listing.city}</span>}
          <ChevronRight className="h-4 w-4" />
          <span className="truncate text-slate-700">{listing.title}</span>
        </nav>

        <header className="mb-6 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-blue-100 text-blue-800">{formatCategory(listing.category)}</Badge>
            <StatusBadge kind="listing" status={listing.status} />
          </div>
          <div className="min-w-0">
            <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{listing.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold text-slate-600">
              <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-blue-600" />{location}</span>
              <span className="inline-flex items-center gap-1"><Star className="h-4 w-4 fill-amber-400 text-amber-400" />{ratingLabel} ({listing.reviewCount} reviews)</span>
              <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-blue-600" />Verified provider</span>
              <span className="inline-flex items-center gap-2"><CreditCard className="h-4 w-4 text-blue-600" />Secure booking</span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start 2xl:grid-cols-[minmax(0,1fr)_390px]">
          <div className="min-w-0 space-y-5">
            <section className="relative w-full rounded-[24px] shadow-xl shadow-slate-200/80 ring-1 ring-black/5">
              {previewImages.length > 0 ? (
                <div className="grid h-[320px] w-full gap-2 overflow-hidden rounded-[24px] bg-white sm:h-[420px] lg:h-auto lg:min-h-[430px] lg:max-h-[620px] lg:aspect-[16/5.2] lg:grid-cols-[minmax(0,1.65fr)_minmax(0,0.9fr)_minmax(0,0.9fr)] lg:grid-rows-2">
                  <button className="group relative min-h-0 overflow-hidden text-left lg:row-span-2" onClick={() => openLightbox(0)} aria-label="Open main listing photo">
                    <img src={previewImages[0].src} alt={previewImages[0].alt} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
                    <div className="absolute bottom-4 left-4 rounded-full bg-black/55 px-3 py-1.5 text-sm font-bold text-white">{galleryImages.length > 0 ? \`1 / \${galleryImages.length}\` : '1 / 1'}</div>
                    <Button variant="secondary" className="absolute bottom-4 right-4 z-10 rounded-full bg-white/95 shadow-lg lg:hidden" onClick={(event) => { event.stopPropagation(); openLightbox(0); }}>
                      <Camera className="mr-2 h-4 w-4" /> View all photos
                    </Button>
                  </button>
                  {Array.from({ length: 4 }).map((_, index) => {
                    const image = previewImages[index + 1];
                    const isLastCell = index === 3;
                    return (
                      <button key={image?.src ?? index} className="group relative hidden min-h-0 overflow-hidden text-left lg:block" onClick={() => openLightbox(image ? index + 1 : 0)} aria-label={\`Open listing photo \${index + 2}\`}>
                        {image ? <img src={image.src} alt={image.alt} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" /> : <ImageFallback title={listing.title} />}
                        {isLastCell && (
                          <Button variant="secondary" className="absolute bottom-4 right-4 z-10 rounded-full bg-white/95 shadow-lg" onClick={(event) => { event.stopPropagation(); openLightbox(0); }}>
                            <Camera className="mr-2 h-4 w-4" /> View all photos
                          </Button>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <ImageFallback title={listing.title} className="h-[320px] overflow-hidden rounded-[24px] sm:h-[420px]" />
              )}
            </section>

            <section className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
              {stayBasics.slice(0, 4).map((item) => <DetailItemCard key={item.key} item={item} />)}
              <DetailItemCard item={{ key: 'highlights', label: 'Highlights', value: amenityNames.length > 0 ? amenityNames.slice(0, 3).join(' - ') : formatCategory(listing.category), helper: amenityNames.length > 3 ? \`\${amenityNames.length} amenities listed\` : 'Provider details', icon: Sparkles, tone: 'blue' }} />
            </section>

            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto border-b border-slate-200 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="flex min-w-max gap-1 px-3 py-3">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const active = activeTab === tab.id;
                    return (
                      <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={cn('inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition-all', active ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-700')}>
                        <Icon className="h-4 w-4" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-5 sm:p-6">
                {activeTab === 'overview' && (
                  <div className="motion-fade-up space-y-5">
                    <div>
                      <h2 className="text-xl font-black text-slate-950">About this {listing.category === 'HOTEL' ? 'stay' : 'listing'}</h2>
                      <p className="mt-3 max-w-4xl whitespace-pre-wrap text-sm leading-7 text-slate-600">{aboutText || 'Provider details are available during booking and checkout.'}</p>
                      <div className="mt-4 flex flex-wrap gap-3">
                        {compactHighlights.map((item) => <span key={item} className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 ring-1 ring-blue-100"><CheckCircle2 className="h-3.5 w-3.5" /> {item}</span>)}
                      </div>
                    </div>

                    <div className="grid gap-4 xl:grid-cols-3">
                      <InfoCard><SectionTitle icon={BedDouble} title="Stay basics" description="Essential category and timing details." /><div className="mt-5 space-y-3">{stayBasics.slice(0, 4).map((item) => <DetailItemCard key={item.key} item={item} />)}</div></InfoCard>
                      <InfoCard><SectionTitle icon={Sparkles} title="Amenities & facilities" description="Top inclusions available for this listing." /><div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">{amenities.slice(0, 6).map((item) => <DetailItemCard key={item.key} item={item} />)}</div>{amenities.length > 6 && <button className="mt-4 text-sm font-bold text-blue-600" onClick={() => setActiveTab('amenities')}>View all amenities</button>}</InfoCard>
                      <InfoCard><SectionTitle icon={ShieldCheck} title="Guest policies" description="Helpful notes for planning your visit." /><div className="mt-5 space-y-3">{policies.slice(0, 4).map((item) => <DetailItemCard key={item.key} item={item} />)}</div>{policies.length > 0 && <button className="mt-4 text-sm font-bold text-blue-600" onClick={() => setActiveTab('policies')}>View all policies</button>}</InfoCard>
                    </div>

                    <div className="grid gap-4 xl:grid-cols-3">
                      <InfoCard><SectionTitle icon={MapPin} title="Location" description="Address and check-in context." /><div className="mt-5"><LocationPreview location={location} /></div></InfoCard>
                      <InfoCard><SectionTitle icon={CheckCircle2} title="Why guests love it" description="Highlights derived from this listing." /><div className="mt-5 space-y-3">{compactHighlights.map((item) => <p key={item} className="flex gap-2 text-sm font-semibold text-slate-600"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />{item}</p>)}</div></InfoCard>
                      <InfoCard><SectionTitle icon={Star} title="Reviews snapshot" description="A quick look at traveler feedback." /><div className="mt-5 flex items-end gap-3"><p className="text-4xl font-black text-slate-950">{ratingLabel}</p><div className="pb-1"><div className="flex text-amber-400">{Array.from({ length: 5 }).map((_, index) => <Star key={index} className="h-4 w-4 fill-current" />)}</div><p className="mt-1 text-xs font-semibold text-slate-500">Based on {listing.reviewCount} reviews</p></div></div><button className="mt-4 text-sm font-bold text-blue-600" onClick={() => setActiveTab('reviews')}>Read all reviews</button></InfoCard>
                    </div>
                  </div>
                )}

                {activeTab === 'rates' && (
                  <div className="motion-fade-up grid gap-4 lg:grid-cols-2">
                    <InfoCard><SectionTitle icon={BedDouble} title={listing.category === 'HOTEL' ? 'Rooms & rates' : 'Details & rates'} description="Pricing and category-specific booking details." /><div className="mt-5 grid gap-3 sm:grid-cols-2">{stayBasics.map((item) => <DetailItemCard key={item.key} item={item} />)}</div></InfoCard>
                    <InfoCard><SectionTitle icon={WalletCards} title="Current base price" description="Final totals are calculated during checkout." /><p className="mt-5 text-3xl font-black text-slate-950">{formatMoney(listing.basePrice, listing.currency)}</p><p className="mt-2 text-sm leading-6 text-slate-500">Availability and booking totals are confirmed before payment.</p></InfoCard>
                  </div>
                )}

                {activeTab === 'amenities' && (
                  <div className="motion-fade-up">
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{amenities.length > 0 ? amenities.map((item) => <DetailItemCard key={item.key} item={item} />) : <p className="text-sm text-slate-500">No amenity data is available for this listing yet.</p>}</div>
                  </div>
                )}

                {activeTab === 'location' && (
                  <div className="motion-fade-up grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                    <InfoCard><SectionTitle icon={MapPin} title="Location" description="Address and check-in context." /><div className="mt-5"><LocationPreview location={location} /></div></InfoCard>
                    <InfoCard><SectionTitle icon={Map} title="Destination information" description="Location details from this listing." /><p className="mt-5 text-sm leading-7 text-slate-600">{location}</p></InfoCard>
                  </div>
                )}

                {activeTab === 'policies' && (
                  <div className="motion-fade-up space-y-5">
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{policies.length > 0 ? policies.map((item) => <DetailItemCard key={item.key} item={item} />) : <p className="text-sm text-slate-500">No guest policy data is available for this listing yet.</p>}</div>
                    <InfoCard><SectionTitle icon={Info} title="Booking & payment notes" description="Platform information to keep in mind before checkout." /><div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">{['Provider policies may vary by category and travel date.', 'Payment status and booking status are tracked in your account.', 'Refund eligibility depends on provider and platform review.', 'Extra charges may apply for additional services used.'].map((note) => <div key={note} className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4 text-sm leading-6 text-slate-700">{note}</div>)}</div></InfoCard>
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div className="motion-fade-up">
                    <ReviewSection listingId={listing.id} averageRating={listing.averageRating} reviewCount={listing.reviewCount} listingTitle={listing.title} />
                  </div>
                )}
              </div>
            </section>
          </div>

          <aside className="xl:sticky xl:top-24 xl:w-full xl:self-start">
            <Card className="overflow-hidden rounded-3xl border-gray-200 shadow-2xl shadow-slate-200/80 transition-all duration-300 hover:-translate-y-1 hover:shadow-blue-100">
              <CardContent className="p-6">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700"><ShieldCheck className="h-3.5 w-3.5" /> Best price guarantee</div>
                <div className="flex items-start justify-between gap-4">
                  <div><p className="text-sm font-medium text-gray-500">Starting from</p><p className="mt-1 text-3xl font-bold text-gray-950">{formatMoney(listing.basePrice, listing.currency)}</p><p className="text-sm text-gray-500">Base price before final checkout totals</p></div>
                  <div className="rounded-2xl bg-amber-50 px-3 py-2 text-right"><div className="flex items-center justify-end gap-1 text-sm font-bold text-gray-900"><Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {ratingLabel}</div><p className="text-xs text-gray-500">{listing.reviewCount} reviews</p></div>
                </div>
                <div className="my-6 rounded-2xl border border-gray-200 bg-slate-50 p-4"><div className="grid grid-cols-2 gap-3 text-sm"><div><p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Destination</p><p className="mt-1 font-semibold text-gray-900">{listing.city}</p></div><div><p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Category</p><p className="mt-1 font-semibold text-gray-900">{formatCategory(listing.category)}</p></div><div className="col-span-2 border-t border-gray-200 pt-3"><p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Provider</p><p className="mt-1 font-semibold text-gray-900">{listing.providerName}</p></div></div></div>
                <Button className="h-12 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 shadow-lg shadow-blue-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-blue-500/35" onClick={openBookingFlow} disabled={listing.status !== 'ACTIVE'}>Book Now</Button>
                <Button variant="outline" className="mt-3 h-11 w-full rounded-2xl border-blue-200 bg-blue-50/70 font-semibold text-blue-700 transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-100 hover:shadow-md" onClick={openAddToCartFlow} disabled={listing.status !== 'ACTIVE'}><ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart</Button>
                {cartNotice && <div className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-sm font-medium text-emerald-800">{cartNotice}</div>}
                <Button variant="outline" className="mt-3 h-11 w-full rounded-2xl bg-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md" onClick={() => navigate('/ai/assistant')}><Sparkles className="mr-2 h-4 w-4" /> Ask AI about this listing</Button>
                <div className="mt-5 space-y-3 text-sm text-gray-600"><div className="flex items-center gap-3"><CreditCard className="h-4 w-4 text-blue-600" /> Secure payment & checkout</div><div className="flex items-center gap-3"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Verified marketplace provider</div><div className="flex items-center gap-3"><CalendarDays className="h-4 w-4 text-amber-600" /> Availability checked during checkout</div></div>
              </CardContent>
            </Card>
          </aside>
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
`;

fs.writeFileSync(target, content, 'utf8');
