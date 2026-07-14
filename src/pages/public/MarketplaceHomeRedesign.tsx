import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import {
  ArrowRight,
  Bot,
  Building,
  CalendarDays,
  Car,
  Headphones,
  Map,
  MapPin,
  PackageCheck,
  Plane,
  Quote,
  ShieldCheck,
  Sparkles,
  Star,
  Utensils,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ListingCard } from '@/components/ui/ListingCard';
import { StateBlock } from '@/components/ui/StateBlock';
import { listingService } from '@/services/listingService';
import { ListingCategory, ListingResponse } from '@/types/listing';

const ease = [0.22, 1, 0.36, 1] as const;

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease } },
};

const fadeLeft: Variants = {
  hidden: { opacity: 0, x: 36 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.65, ease } },
};

const fadeRight: Variants = {
  hidden: { opacity: 0, x: -36 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.65, ease } },
};

const scaleReveal: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease } },
};

const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.08 } },
};

const heroImage = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2400&q=85';

const categoryCards: Array<{
  name: string;
  value?: ListingCategory;
  icon: React.ElementType;
  subtitle: string;
  image: string;
  accent: string;
}> = [
  {
    name: 'Stays',
    value: 'HOTEL',
    icon: Building,
    subtitle: 'Hotels, villas, resorts',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80',
    accent: 'from-violet-500 to-blue-500',
  },
  {
    name: 'Tours & Activities',
    value: 'TOUR',
    icon: Map,
    subtitle: 'Guided trips, adventure',
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
    accent: 'from-cyan-500 to-teal-400',
  },
  {
    name: 'Dining / Restaurants',
    value: 'RESTAURANT',
    icon: Utensils,
    subtitle: 'Local food, fine dining',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80',
    accent: 'from-orange-500 to-rose-400',
  },
  {
    name: 'Vehicles',
    value: 'VEHICLE',
    icon: Car,
    subtitle: 'Cars, transfers, drivers',
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80',
    accent: 'from-blue-500 to-sky-400',
  },
  {
    name: 'Experiences',
    value: 'EXPERIENCE',
    icon: Sparkles,
    subtitle: 'Culture, wellness, local life',
    image: 'https://images.unsplash.com/photo-1530789253388-582c481c54b0?auto=format&fit=crop&w=900&q=80',
    accent: 'from-emerald-500 to-cyan-400',
  },
  {
    name: 'Packages / More',
    icon: PackageCheck,
    subtitle: 'Bundles, specials, inspiration',
    image: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80',
    accent: 'from-fuchsia-500 to-indigo-500',
  },
];

const loveFeatures = [
  {
    title: 'AI-Powered Recommendations',
    description: 'Smart suggestions tailored to your style, budget, timing, and destination.',
    icon: Sparkles,
    accent: 'from-violet-500 to-blue-500',
  },
  {
    title: 'All-in-One Booking',
    description: 'Stays, tours, dining, vehicles, and more in one connected marketplace.',
    icon: CalendarDays,
    accent: 'from-blue-500 to-cyan-500',
  },
  {
    title: 'Safe & Trusted',
    description: 'Verified providers, secure payments, and clear booking status at every step.',
    icon: ShieldCheck,
    accent: 'from-emerald-500 to-teal-500',
  },
  {
    title: '24/7 AI Support',
    description: 'Get smart help and travel inspiration anytime during your journey.',
    icon: Headphones,
    accent: 'from-orange-500 to-rose-500',
  },
];

const testimonials = [
  {
    name: 'Sarah Johnson',
    avatar: 'SJ',
    text: 'The AI planner saved me so much time. Our trip felt polished, personal, and easy to book.',
  },
  {
    name: 'Michael Chen',
    avatar: 'MC',
    text: 'Excellent service and amazing support. I found stays, food, and transfers without opening ten tabs.',
  },
  {
    name: 'Emily Carter',
    avatar: 'EC',
    text: 'Best travel marketplace experience so far. Everything was organized in one place.',
  },
];

const itineraryImages = [
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=360&q=80',
  'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=360&q=80',
  'https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=360&q=80',
];

const fallbackDealImages = [
  'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=900&q=80',
];

const formatPrice = (listing: ListingResponse, value = listing.basePrice) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: listing.currency || 'USD',
    maximumFractionDigits: 0,
  }).format(value);

const getListingImage = (listing: ListingResponse, index = 0) =>
  listing.coverImageUrl || listing.images?.[0]?.imageUrl || fallbackDealImages[index % fallbackDealImages.length];

const getCategoryRoute = (value?: ListingCategory) => (value ? `/search?category=${value}` : '/search');

const ListingSkeleton = () => (
  <div className="h-[330px] animate-pulse rounded-[22px] border border-slate-200 bg-white shadow-sm">
    <div className="h-44 rounded-t-[22px] bg-slate-200" />
    <div className="space-y-3 p-4">
      <div className="h-4 w-2/3 rounded bg-slate-200" />
      <div className="h-3 w-1/2 rounded bg-slate-200" />
      <div className="h-5 w-1/3 rounded bg-slate-200" />
    </div>
  </div>
);

export const MarketplaceHomeRedesign: React.FC = () => {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const [destination, setDestination] = React.useState('');
  const [dates, setDates] = React.useState('');
  const [guests, setGuests] = React.useState('2');
  const [category, setCategory] = React.useState<ListingCategory | ''>('');

  const { data, isLoading } = useQuery({
    queryKey: ['home-featured-listings'],
    queryFn: () => listingService.searchListings({ status: 'ACTIVE', page: 0, size: 10 }),
  });

  const featured = data?.data?.content ?? [];
  const recommended = featured.slice(0, 5);
  const deals = featured.slice(0, 4);
  const sectionMotion = shouldReduceMotion ? { initial: false } : { initial: 'hidden' as const, whileInView: 'visible' as const };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (destination.trim()) params.set('city', destination.trim());
    if (category) params.set('category', category);
    navigate(`/search${params.toString() ? `?${params.toString()}` : ''}`);
  };

  return (
    <div className="overflow-hidden bg-white text-slate-950">
      <section className="relative min-h-[680px] text-white lg:min-h-[720px]">
        <img src={heroImage} alt="Sunset beach coastline" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/55 to-slate-900/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-transparent to-slate-950/20" />

        <motion.div
          className="relative mx-auto flex min-h-[680px] max-w-[1440px] flex-col justify-center px-4 pb-16 pt-24 sm:px-6 lg:min-h-[720px] lg:px-8"
          variants={staggerContainer}
          initial={shouldReduceMotion ? false : 'hidden'}
          animate="visible"
        >
          <div className="max-w-4xl">
            <motion.span variants={fadeUp} className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-blue-50 shadow-lg shadow-slate-950/20 backdrop-blur-md">
              <Sparkles className="mr-2 h-4 w-4 text-amber-300" />
              AI-powered travel marketplace
            </motion.span>
            <motion.h1 variants={fadeUp} className="mt-6 max-w-4xl text-5xl font-black leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
              Design the trip that feels like it was{' '}
              <span className="bg-gradient-to-r from-blue-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
                waiting for you.
              </span>
            </motion.h1>
            <motion.p variants={fadeUp} className="mt-6 max-w-2xl text-lg leading-8 text-blue-50/90 sm:text-xl">
              Search trusted travel services, ask AI for a personalized itinerary, and bring stays, tours, dining, vehicles, and experiences into one booking flow.
            </motion.p>
            <motion.div variants={fadeUp} className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="h-12 rounded-full px-7 shadow-xl shadow-blue-950/30" onClick={() => navigate('/search')}>
                Explore Trips <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 rounded-full border-white/35 bg-white/10 px-7 text-white backdrop-blur hover:bg-white/20"
                onClick={() => navigate('/ai/planner')}
              >
                Plan with AI <Bot className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          </div>

          <motion.form
            variants={fadeUp}
            onSubmit={handleSearch}
            className="mt-12 grid gap-3 rounded-2xl border border-white/20 bg-white/95 p-3 text-slate-900 shadow-2xl shadow-slate-950/30 backdrop-blur md:grid-cols-[1.2fr_1fr_0.7fr_1fr_auto]"
          >
            <label className="rounded-xl bg-slate-50 px-4 py-3">
              <span className="flex items-center text-xs font-bold uppercase tracking-wide text-slate-500">
                <MapPin className="mr-1.5 h-3.5 w-3.5" /> Destination
              </span>
              <input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="mt-1 w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                placeholder="Da Nang, Hanoi..."
              />
            </label>
            <label className="rounded-xl bg-slate-50 px-4 py-3">
              <span className="flex items-center text-xs font-bold uppercase tracking-wide text-slate-500">
                <CalendarDays className="mr-1.5 h-3.5 w-3.5" /> Dates
              </span>
              <input
                value={dates}
                onChange={(e) => setDates(e.target.value)}
                className="mt-1 w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                placeholder="Flexible"
              />
            </label>
            <label className="rounded-xl bg-slate-50 px-4 py-3">
              <span className="flex items-center text-xs font-bold uppercase tracking-wide text-slate-500">
                <Users className="mr-1.5 h-3.5 w-3.5" /> Guests
              </span>
              <input
                value={guests}
                onChange={(e) => setGuests(e.target.value)}
                className="mt-1 w-full bg-transparent text-sm font-semibold text-slate-900 outline-none"
                inputMode="numeric"
              />
            </label>
            <label className="rounded-xl bg-slate-50 px-4 py-3">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Category</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ListingCategory | '')}
                className="mt-1 w-full bg-transparent text-sm font-semibold text-slate-900 outline-none"
              >
                <option value="">All services</option>
                {categoryCards.filter((item) => item.value).map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <Button type="submit" size="lg" className="h-full min-h-14 rounded-xl px-7">
              Search
            </Button>
          </motion.form>
        </motion.div>
      </section>

      <motion.section className="py-16 sm:py-20" variants={staggerContainer} viewport={{ once: true, amount: 0.2 }} {...sectionMotion}>
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeUp} className="text-center">
            <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Why travelers love AI Marketplace</h2>
          </motion.div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {loveFeatures.map((feature) => (
              <motion.article
                key={feature.title}
                variants={scaleReveal}
                whileHover={shouldReduceMotion ? undefined : { y: -6 }}
                className="group rounded-[24px] border border-slate-200/80 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.05)] transition-shadow duration-300 hover:shadow-[0_20px_60px_rgba(15,23,42,0.10)]"
              >
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.accent} text-white shadow-lg`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-7 text-lg font-black leading-6 text-slate-950">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{feature.description}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.section className="py-12 sm:py-16" variants={staggerContainer} viewport={{ once: true, amount: 0.18 }} {...sectionMotion}>
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeUp} className="mb-8 flex items-end justify-between gap-4">
            <h2 className="text-3xl font-black tracking-tight text-slate-950">Explore popular categories</h2>
            <button className="hidden text-sm font-bold text-blue-600 hover:text-blue-700 sm:inline-flex" onClick={() => navigate('/search')}>
              View all categories
            </button>
          </motion.div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
            {categoryCards.map((item) => (
              <motion.button
                key={item.name}
                type="button"
                variants={scaleReveal}
                onClick={() => navigate(getCategoryRoute(item.value))}
                className="group relative min-h-[170px] overflow-hidden rounded-[22px] bg-slate-900 text-left shadow-sm outline-none ring-offset-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-blue-500 sm:min-h-[190px]"
              >
                <img src={item.image} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/35 to-transparent transition-colors duration-300 group-hover:from-slate-950/95" />
                <div className={`absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${item.accent} text-white shadow-lg transition-transform duration-300 group-hover:-translate-y-1`}>
                  <item.icon className="h-5 w-5" />
                </div>
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <h3 className="text-base font-black text-white">{item.name}</h3>
                  <p className="mt-1 text-xs font-medium text-white/80">{item.subtitle}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.section className="py-12 sm:py-16" variants={staggerContainer} viewport={{ once: true, amount: 0.15 }} {...sectionMotion}>
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeUp} className="mb-8 flex items-end justify-between gap-4">
            <h2 className="text-3xl font-black tracking-tight text-slate-950">Recommended for you</h2>
            <button className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700" onClick={() => navigate('/search')}>
              View all <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>
          {isLoading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
              {[1, 2, 3, 4, 5].map((item) => <ListingSkeleton key={item} />)}
            </div>
          ) : recommended.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
              {recommended.map((listing) => (
                <motion.div key={listing.id} variants={scaleReveal} className="h-full">
                  <ListingCard listing={listing} />
                </motion.div>
              ))}
            </div>
          ) : (
            <StateBlock title="No recommendations yet" description="Active listings will appear here as soon as they are available." actionLabel="Browse Search" onAction={() => navigate('/search')} />
          )}
        </div>
      </motion.section>

      <motion.section className="py-14 sm:py-20" variants={staggerContainer} viewport={{ once: true, amount: 0.2 }} {...sectionMotion}>
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[32px] border border-blue-100 bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50 p-6 shadow-[0_24px_80px_rgba(59,130,246,0.14)] sm:p-10 lg:grid lg:grid-cols-[0.9fr_1.1fr] lg:gap-10 lg:p-14">
            <div className="absolute right-10 top-8 h-48 w-48 rounded-full bg-violet-200/40 blur-3xl" />
            <motion.div variants={fadeRight} className="relative z-10">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-600">AI Trip Planner</p>
              <h2 className="mt-4 max-w-xl text-4xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
                Turn ideas into the perfect itinerary
              </h2>
              <p className="mt-5 max-w-md text-base leading-7 text-slate-600">
                Tell AI your budget, dates, and interests. Get a personalized day-by-day plan in seconds.
              </p>
              <Button className="mt-8 rounded-2xl px-6 shadow-lg shadow-blue-500/20" onClick={() => navigate('/ai/planner')}>
                Create your AI plan <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
            <motion.div variants={fadeLeft} className="relative z-10 mt-10 min-h-[310px] lg:mt-0">
              <motion.div
                animate={shouldReduceMotion ? undefined : { y: [0, -8, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                className="ml-auto max-w-sm rounded-3xl bg-blue-600 px-5 py-4 text-sm font-semibold leading-6 text-white shadow-xl shadow-blue-500/20"
              >
                I want a 4-day trip to Da Nang for 2 people, beach + food, under $800
              </motion.div>
              <motion.div variants={scaleReveal} className="mt-5 max-w-md rounded-[28px] border border-white/80 bg-white p-5 shadow-2xl shadow-slate-200/80">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-black text-slate-950">Here's your personalized plan ✨</p>
                  <Bot className="h-5 w-5 text-blue-600" />
                </div>
                <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                  <p className="font-black text-slate-950">Day 1</p>
                  <ul className="mt-2 space-y-1">
                    <li>• My Khe Beach</li>
                    <li>• Marble Mountains</li>
                    <li>• Dinner at local seafood restaurant</li>
                  </ul>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {itineraryImages.map((image) => (
                    <img key={image} src={image} alt="" className="h-20 rounded-2xl object-cover" />
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      <motion.section className="py-12 sm:py-16" variants={staggerContainer} viewport={{ once: true, amount: 0.16 }} {...sectionMotion}>
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeUp} className="mb-8 flex items-end justify-between gap-4">
            <h2 className="text-3xl font-black tracking-tight text-slate-950">Hot deals just for you</h2>
            <button className="text-sm font-bold text-blue-600 hover:text-blue-700" onClick={() => navigate('/search')}>
              View all deals
            </button>
          </motion.div>
          {isLoading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((item) => <ListingSkeleton key={item} />)}
            </div>
          ) : deals.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {deals.map((listing, index) => {
                const discount = [30, 25, 20, 15][index % 4];
                const oldPrice = listing.basePrice / (1 - discount / 100);
                return (
                  <motion.button
                    key={listing.id}
                    type="button"
                    variants={scaleReveal}
                    onClick={() => navigate(`/listings/${listing.slug}`)}
                    className="group overflow-hidden rounded-[22px] border border-slate-200 bg-white text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                  >
                    <div className="relative h-44 overflow-hidden">
                      <img src={getListingImage(listing, index)} alt={listing.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      <span className="absolute left-4 top-4 rounded-full bg-gradient-to-r from-rose-500 to-red-500 px-3 py-1 text-xs font-black text-white shadow-lg">
                        -{discount}%
                      </span>
                    </div>
                    <div className="p-4">
                      <h3 className="line-clamp-1 font-black text-slate-950">{listing.title}</h3>
                      <p className="mt-1 text-sm text-slate-500">{listing.city}, {listing.country}</p>
                      <div className="mt-4 flex items-end gap-2">
                        <p className="text-lg font-black text-rose-600">{formatPrice(listing)}</p>
                        <p className="text-sm font-semibold text-slate-400 line-through">{formatPrice(listing, oldPrice)}</p>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          ) : (
            <StateBlock title="No hot deals yet" description="Deal-ready listings will appear here when providers publish active offers." actionLabel="Explore listings" onAction={() => navigate('/search')} />
          )}
        </div>
      </motion.section>

      <motion.section className="py-12 sm:py-16" variants={staggerContainer} viewport={{ once: true, amount: 0.2 }} {...sectionMotion}>
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeUp} className="mb-8 flex items-center justify-between">
            <h2 className="text-3xl font-black tracking-tight text-slate-950">What travelers say</h2>
            <div className="hidden gap-2 sm:flex">
              <button className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:text-blue-600" type="button" aria-label="Previous testimonial">‹</button>
              <button className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:text-blue-600" type="button" aria-label="Next testimonial">›</button>
            </div>
          </motion.div>
          <div className="grid gap-6 lg:grid-cols-3">
            {testimonials.map((item, index) => (
              <motion.article
                key={item.name}
                variants={index === 0 ? fadeRight : index === 2 ? fadeLeft : fadeUp}
                className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.05)]"
              >
                <Quote className="h-7 w-7 text-blue-200" />
                <p className="mt-5 text-sm leading-7 text-slate-600">{item.text}</p>
                <div className="mt-7 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-500 text-sm font-black text-white">
                    {item.avatar}
                  </div>
                  <div>
                    <p className="font-black text-slate-950">{item.name}</p>
                    <div className="mt-1 flex gap-0.5 text-amber-400">
                      {[1, 2, 3, 4, 5].map((star) => <Star key={star} className="h-3.5 w-3.5 fill-current" />)}
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
          <div className="mt-8 flex justify-center gap-2">
            <span className="h-2 w-6 rounded-full bg-blue-600" />
            <span className="h-2 w-2 rounded-full bg-slate-300" />
            <span className="h-2 w-2 rounded-full bg-slate-300" />
          </div>
        </div>
      </motion.section>

      <motion.section className="px-4 py-14 sm:px-6 lg:px-8" variants={fadeUp} viewport={{ once: true, amount: 0.25 }} {...sectionMotion}>
        <div className="relative mx-auto max-w-[1440px] overflow-hidden rounded-[28px] bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-6 text-white shadow-2xl shadow-blue-500/20 sm:p-8 lg:p-10">
          <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_70%_40%,rgba(255,255,255,0.18),transparent_35%)]" />
          <Plane className="absolute right-8 top-8 h-24 w-24 rotate-12 text-white/15" />
          <div className="relative z-10 grid gap-6 lg:grid-cols-[1fr_0.9fr] lg:items-center">
            <div>
              <h2 className="text-2xl font-black tracking-tight sm:text-3xl">Get travel inspiration & exclusive deals</h2>
              <p className="mt-2 text-blue-50">Join 100K+ travelers and never miss a deal.</p>
            </div>
            <form className="flex flex-col gap-3 sm:flex-row" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Enter your email"
                className="min-h-12 flex-1 rounded-2xl border border-white/20 bg-white px-4 text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400 focus:ring-4 focus:ring-white/20"
              />
              <Button type="submit" className="min-h-12 rounded-2xl bg-slate-950 px-6 text-white hover:bg-slate-900">
                Subscribe
              </Button>
            </form>
          </div>
        </div>
      </motion.section>
    </div>
  );
};
