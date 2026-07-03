import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Compass, Map, BadgePercent, Sparkles } from 'lucide-react';

export const Home: React.FC = () => {
  return (
    <div className="space-y-16 py-8">
      {/* Hero section */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 px-6 py-20 text-center shadow-xl sm:px-12 sm:py-24">
        {/* Decorative background vectors */}
        <div className="absolute inset-0 bg-cover bg-center opacity-25" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80')" }}></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/90 to-slate-900/40"></div>
        
        <div className="relative z-10 mx-auto max-w-2xl space-y-6">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/20 px-3.5 py-1.5 text-xs font-semibold text-primary border border-primary/30">
            <Sparkles className="h-3.5 w-3.5 animate-pulse" /> Introducing AI Travel Planner
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
            One Trip. One Checkout. Custom AI Itinerary.
          </h1>
          <p className="mx-auto max-w-xl text-lg text-slate-300">
            Book local hotels, verified guides, restaurants, and vehicle rentals in a single consolidated transaction.
          </p>
          <div className="flex justify-center gap-4 pt-4">
            <Link
              to="/register"
              className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg hover:bg-primary/95 transition-all hover:scale-[1.02]"
            >
              Get Started Free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/login"
              className="rounded-xl border border-white/20 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white hover:bg-white/20 transition-all backdrop-blur-sm"
            >
              Partner Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* Core Marketplace Features Grid */}
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Unified Platform Capabilities</h2>
          <p className="text-muted-foreground max-w-lg mx-auto text-sm">
            Everything you need for an immersive trip, managed completely under one marketplace platform.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
              <Compass className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Diverse Local Listings</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Rent scooters, hire local mountaineer guides, book boutique hotels, and reserve restaurants.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
              <Map className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground">AI Travel Assistant</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Enter your dates and budget limits, and watch the AI recommend matching stays and activities automatically.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
              <BadgePercent className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Single Cart Checkout</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Say goodbye to fragmented payments across multiple systems. Add everything to your shopping cart and pay once.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Home;
