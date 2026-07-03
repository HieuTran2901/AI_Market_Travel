import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  Bot,
  Building,
  CalendarDays,
  Car,
  CheckCircle2,
  Coffee,
  CreditCard,
  Map,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  WalletCards,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ListingCard } from '@/components/ui/ListingCard';
import { StateBlock } from '@/components/ui/StateBlock';
import { Reveal } from '@/components/landing/Reveal';
import { listingService } from '@/services/listingService';
import { ListingCategory } from '@/types/listing';

const categories: Array<{
  name: string;
  value: ListingCategory;
  icon: React.ElementType;
  description: string;
  image: string;
}> = [
  {
    name: 'Hotels',
    value: 'HOTEL',
    icon: Building,
    description: 'Boutique stays, beachfront resorts, city hotels.',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'Tours',
    value: 'TOUR',
    icon: Map,
    description: 'Guided city walks, culture trips, day adventures.',
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'Experiences',
    value: 'EXPERIENCE',
    icon: Sparkles,
    description: 'Local workshops, hidden gems, personal moments.',
    image: 'https://images.unsplash.com/photo-1530789253388-582c481c54b0?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'Restaurants',
    value: 'RESTAURANT',
    icon: Coffee,
    description: 'Memorable tables, tastings, food-led travel.',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'Vehicles',
    value: 'VEHICLE',
    icon: Car,
    description: 'Airport transfers, private cars, flexible rentals.',
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80',
  },
];

const plannerBenefits = [
  {
    number: '01',
    title: 'Tell AI your budget, dates, and interests',
    description: 'Share your destination, travel dates, budget, group size, and preferences so AI can understand your perfect trip.',
    icon: Users,
    accent: 'from-blue-500 to-cyan-400',
    surface: 'from-blue-50 via-white to-cyan-50',
  },
  {
    number: '02',
    title: 'Get a personalized itinerary',
    description: 'Receive a day-by-day travel plan with recommended stays, tours, dining, and local experiences.',
    icon: Bot,
    accent: 'from-violet-500 to-fuchsia-400',
    surface: 'from-violet-50 via-white to-fuchsia-50',
  },
  {
    number: '03',
    title: 'Book multiple services in one checkout',
    description: 'Reserve hotels, tours, vehicles, restaurants, and experiences through one connected booking flow.',
    icon: CreditCard,
    accent: 'from-emerald-500 to-teal-400',
    surface: 'from-emerald-50 via-white to-teal-50',
  },
];

const steps = [
  { title: 'Search or ask AI', description: 'Find services directly or describe the trip you want.', icon: Search, accent: 'from-blue-500 to-cyan-400' },
  { title: 'Build your trip', description: 'Compare stays, tours, dining, vehicles, and experiences.', icon: Map, accent: 'from-violet-500 to-indigo-400' },
  { title: 'Book services', description: 'Add available services into one clean checkout path.', icon: CheckCircle2, accent: 'from-emerald-500 to-teal-400' },
  { title: 'Pay securely', description: 'Use the connected payment flow and clear status tracking.', icon: CreditCard, accent: 'from-amber-500 to-orange-400' },
  { title: 'Travel with confidence', description: 'Keep bookings, payments, refunds, and support in one place.', icon: ShieldCheck, accent: 'from-rose-500 to-pink-400' },
];

const trustItems = [
  { title: 'Verified providers', icon: ShieldCheck },
  { title: 'Secure payments', icon: WalletCards },
  { title: 'AI recommendations', icon: Bot },
  { title: 'Flexible booking', icon: CalendarDays },
  { title: 'Transparent pricing', icon: CheckCircle2 },
];

export const MarketplaceHome: React.FC = () => {
  const navigate = useNavigate();
  const [destination, setDestination] = React.useState('');
  const [dates, setDates] = React.useState('');
  const [guests, setGuests] = React.useState('2');
  const [category, setCategory] = React.useState<ListingCategory | ''>('');

  const { data, isLoading } = useQuery({
    queryKey: ['home-featured-listings'],
    queryFn: () => listingService.searchListings({ status: 'ACTIVE', page: 0, size: 4 }),
  });

  const featured = data?.data?.content ?? [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (destination.trim()) params.set('city', destination.trim());
    if (category) params.set('category', category);
    navigate(`/search${params.toString() ? `?${params.toString()}` : ''}`);
  };

  return (
    <div className="overflow-hidden bg-slate-50 text-gray-950">
      <section className="relative min-h-[720px] text-white">
        <img
          src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2400&q=85"
          alt="Turquoise coastline with beach and mountains"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/85 via-slate-900/50 to-blue-950/40" />
        <div className="relative mx-auto flex min-h-[720px] max-w-7xl flex-col justify-center px-4 pb-16 pt-24 sm:px-6 lg:px-8">
          <div className="max-w-4xl">
            <Reveal>
              <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-blue-50 backdrop-blur">
                <Sparkles className="mr-2 h-4 w-4 text-amber-300" />
                AI-powered travel marketplace
              </span>
            </Reveal>
            <Reveal delay={90}>
              <h1 className="mt-6 max-w-4xl text-5xl font-bold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
                Design the trip that feels like it was waiting for you.
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-blue-50/90 sm:text-xl">
                Search trusted travel services, ask AI for a personalized itinerary, and bring stays, tours, dining, vehicles, and experiences into one booking flow.
              </p>
            </Reveal>
            <Reveal delay={230}>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" className="h-12 rounded-full px-7" onClick={() => navigate('/search')}>
                  Explore Trips <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 rounded-full border-white/40 bg-white/10 px-7 text-white hover:bg-white/20"
                  onClick={() => navigate('/ai/planner')}
                >
                  Plan with AI <Bot className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </Reveal>
          </div>

          <Reveal delay={300}>
            <form
              onSubmit={handleSearch}
              className="mt-12 grid gap-3 rounded-2xl border border-white/20 bg-white/95 p-3 text-gray-900 shadow-2xl backdrop-blur md:grid-cols-[1.2fr_1fr_0.7fr_1fr_auto]"
            >
              <label className="rounded-xl bg-slate-50 px-4 py-3">
                <span className="flex items-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <MapPin className="mr-1.5 h-3.5 w-3.5" /> Destination
                </span>
                <input
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="mt-1 w-full bg-transparent text-sm font-semibold text-gray-900 outline-none placeholder:text-gray-400"
                  placeholder="Da Nang, Hanoi..."
                />
              </label>
              <label className="rounded-xl bg-slate-50 px-4 py-3">
                <span className="flex items-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <CalendarDays className="mr-1.5 h-3.5 w-3.5" /> Dates
                </span>
                <input
                  value={dates}
                  onChange={(e) => setDates(e.target.value)}
                  className="mt-1 w-full bg-transparent text-sm font-semibold text-gray-900 outline-none placeholder:text-gray-400"
                  placeholder="Flexible"
                />
              </label>
              <label className="rounded-xl bg-slate-50 px-4 py-3">
                <span className="flex items-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <Users className="mr-1.5 h-3.5 w-3.5" /> Guests
                </span>
                <input
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  className="mt-1 w-full bg-transparent text-sm font-semibold text-gray-900 outline-none"
                  inputMode="numeric"
                />
              </label>
              <label className="rounded-xl bg-slate-50 px-4 py-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Category</span>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ListingCategory | '')}
                  className="mt-1 w-full bg-transparent text-sm font-semibold text-gray-900 outline-none"
                >
                  <option value="">All services</option>
                  {categories.map((item) => (
                    <option key={item.value} value={item.value}>{item.name}</option>
                  ))}
                </select>
              </label>
              <Button type="submit" size="lg" className="h-full min-h-14 rounded-xl px-7">
                Search
              </Button>
            </form>
          </Reveal>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Browse by style</p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">Every part of the trip, beautifully organized</h2>
              </div>
              <Button variant="outline" onClick={() => navigate('/search')}>View all</Button>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {categories.map((item, index) => (
              <Reveal key={item.value} delay={index * 70}>
                <button
                  onClick={() => navigate(`/search?category=${item.value}`)}
                  className="group h-full overflow-hidden rounded-2xl border border-gray-200 bg-white text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <div className="relative h-40 overflow-hidden">
                    <img src={item.image} alt={`${item.name} category`} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent" />
                    <item.icon className="absolute bottom-4 left-4 h-8 w-8 text-white" />
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-gray-900">{item.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-gray-500">{item.description}</p>
                  </div>
                </button>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-white py-24">
        <div className="absolute left-0 top-12 h-72 w-72 rounded-full bg-blue-100/70 blur-3xl" />
        <div className="absolute bottom-6 right-0 h-80 w-80 rounded-full bg-emerald-100/70 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.18]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #94a3b8 1px, transparent 0)', backgroundSize: '26px 26px' }} />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="mb-12 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">AI travel planner</p>
                <h2 className="mt-3 text-4xl font-bold tracking-tight text-gray-900">A smarter way to turn travel ideas into bookable plans</h2>
                <p className="mt-4 text-lg leading-8 text-gray-600">
                  The planner helps translate fuzzy trip ideas into structured days, recommended services, and a checkout-ready path.
                </p>
              </div>
              <Button className="rounded-full shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30" onClick={() => navigate('/ai/planner')}>
                Create AI trip plan <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </Reveal>
          <div className="grid gap-6 lg:grid-cols-3">
            {plannerBenefits.map((item, index) => (
              <Reveal key={item.number} delay={index * 110}>
                <article className={`group relative h-full overflow-hidden rounded-3xl border border-white/80 bg-gradient-to-br ${item.surface} p-6 shadow-lg shadow-slate-200/70 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl`}>
                  <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-white/70 blur-2xl transition-transform duration-500 group-hover:scale-125" />
                  <div className="absolute bottom-0 right-0 h-32 w-32 bg-gradient-to-tl from-white/70 to-transparent" />
                  <div className="relative">
                    <div className="flex items-start justify-between">
                      <span className="text-5xl font-black tracking-tight text-gray-900/10">{item.number}</span>
                      <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${item.accent} text-white shadow-lg transition-transform duration-300 group-hover:rotate-3 group-hover:scale-105`}>
                        <item.icon className="h-7 w-7" />
                      </div>
                    </div>
                    <div className="mt-12">
                      <h3 className="text-xl font-bold leading-7 text-gray-900">{item.title}</h3>
                      <p className="mt-4 text-sm leading-7 text-gray-600">{item.description}</p>
                    </div>
                    <div className="mt-8 h-1.5 overflow-hidden rounded-full bg-white/80">
                      <div className={`h-full w-2/3 rounded-full bg-gradient-to-r ${item.accent} transition-all duration-500 group-hover:w-full`} />
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Featured listings</p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">Top places to start exploring</h2>
              </div>
              <Button variant="outline" onClick={() => navigate('/search')}>Explore marketplace</Button>
            </div>
          </Reveal>
          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="h-80 animate-pulse rounded-2xl bg-white shadow-sm" />
              ))}
            </div>
          ) : featured.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((listing, index) => (
                <Reveal key={listing.id} delay={index * 70}>
                  <ListingCard listing={listing} />
                </Reveal>
              ))}
            </div>
          ) : (
            <StateBlock
              title="No featured listings yet"
              description="Once active listings are available, this section will showcase the best places to start."
              actionLabel="Browse Search"
              onAction={() => navigate('/search')}
            />
          )}
        </div>
      </section>

      <section className="bg-gradient-to-b from-slate-50 to-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">How it works</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">From idea to itinerary in five clear steps</h2>
            </div>
          </Reveal>
          <div className="relative mt-14">
            <div className="absolute left-6 top-0 h-full w-px bg-gradient-to-b from-blue-200 via-slate-200 to-rose-200 md:left-0 md:top-8 md:h-px md:w-full" />
            <div className="relative grid gap-6 md:grid-cols-5">
            {steps.map((step, index) => (
              <Reveal key={step.title} delay={index * 60}>
                <div className="group relative flex gap-5 rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-gray-200/70 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-xl md:block md:min-h-[230px] md:p-5">
                  <div className={`relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${step.accent} text-white shadow-lg ring-8 ring-white transition-transform duration-300 group-hover:scale-110`}>
                      <step.icon className="h-5 w-5" />
                    </div>
                    <div className="md:mt-7">
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Step {index + 1}</p>
                      <h3 className="mt-2 font-bold text-gray-900">{step.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-gray-500">{step.description}</p>
                    </div>
                </div>
              </Reveal>
            ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="overflow-hidden rounded-3xl bg-slate-950 text-white shadow-2xl">
              <div className="grid gap-8 p-8 sm:p-10 lg:grid-cols-[1fr_0.85fr] lg:p-12">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-cyan-300">For providers</p>
                  <h2 className="mt-3 text-3xl font-bold tracking-tight">Bring your travel business into one premium marketplace.</h2>
                  <p className="mt-4 max-w-2xl text-slate-300">
                    Hotels, tours, restaurants, vehicles, and experiences can manage listings and connect to the same booking and payment flow.
                  </p>
                  <Button className="mt-8 rounded-full" onClick={() => navigate('/register')}>
                    Become a Provider <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {categories.map((item) => (
                    <div key={item.value} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <item.icon className="h-5 w-5 text-cyan-300" />
                      <p className="mt-3 text-sm font-semibold">{item.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-5 lg:px-8">
          {trustItems.map((item, index) => (
            <Reveal key={item.title} delay={index * 50}>
              <div className="rounded-2xl border border-gray-200 bg-slate-50 p-5">
                <item.icon className="h-6 w-6 text-blue-600" />
                <p className="mt-4 font-semibold text-gray-900">{item.title}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mx-auto max-w-5xl rounded-3xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-14 text-center text-white shadow-2xl sm:px-10">
            <Star className="mx-auto h-10 w-10 text-amber-200" />
            <h2 className="mx-auto mt-5 max-w-3xl text-4xl font-bold tracking-tight">Start with one search, or let AI shape the whole journey.</h2>
            <p className="mx-auto mt-4 max-w-2xl text-blue-50">Explore trusted listings, generate an itinerary, and move toward checkout with less friction.</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button className="rounded-full bg-white text-blue-700 hover:bg-blue-50" onClick={() => navigate('/search')}>
                Start exploring
              </Button>
              <Button variant="outline" className="rounded-full border-white/40 text-white hover:bg-white/15" onClick={() => navigate('/ai/planner')}>
                Create AI trip plan
              </Button>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
};
