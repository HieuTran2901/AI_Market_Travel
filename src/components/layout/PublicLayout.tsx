import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import {
  ArrowUp,
  Facebook,
  Headphones,
  Instagram,
  Linkedin,
  Lock,
  ShieldCheck,
  Smartphone,
  Twitter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SiteHeader } from './SiteHeader';

type PaymentMethod = {
  name: string;
  mark: string;
  className: string;
  bg: string;
  type?: 'mastercard' | 'paypal' | 'vnpay' | 'zalopay';
};

const PaymentCard: React.FC<{ method: PaymentMethod }> = ({ method }) => (
  <div
    role="img"
    aria-label={`${method.name} accepted`}
    title={method.name}
    className="group relative flex h-9 w-[66px] items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm ring-1 ring-white/60 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-950/20 focus-within:ring-2 focus-within:ring-blue-400"
  >
    <span className="absolute left-1.5 top-1.5 h-1 w-4 rounded-full bg-slate-100" />
    <span className="absolute bottom-1.5 right-1.5 h-1 w-6 rounded-full bg-slate-100" />
    {method.type === 'mastercard' ? (
      <div className="relative h-6 w-9">
        <span className="absolute left-0 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-red-500 opacity-95" />
        <span className="absolute right-0 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-amber-400 opacity-95 mix-blend-multiply" />
      </div>
    ) : method.type === 'paypal' ? (
      <span className="text-[11px] font-black tracking-tight">
        <span className="text-blue-800">Pay</span><span className="text-sky-500">Pal</span>
      </span>
    ) : method.type === 'vnpay' ? (
      <span className="inline-flex items-center overflow-hidden rounded border border-sky-100 text-[9px] font-black">
        <span className="bg-red-500 px-1 py-0.5 text-white">VN</span>
        <span className="bg-sky-600 px-1 py-0.5 text-white">PAY</span>
      </span>
    ) : method.type === 'zalopay' ? (
      <span className="text-[10px] font-black tracking-tight">
        <span className="text-blue-600">Zalo</span><span className="text-emerald-500">Pay</span>
      </span>
    ) : (
      <span className={cn('rounded px-1.5 py-0.5 text-[11px] font-black tracking-tight', method.bg, method.className)}>
        {method.mark}
      </span>
    )}
  </div>
);

export const PublicLayout: React.FC = () => {
  const footerColumns = [
    {
      title: 'Discover',
      links: [
        ['All Listings', '/search'],
        ['Stays / Hotels', '/search?category=HOTEL'],
        ['Tours', '/search?category=TOUR'],
        ['Experiences', '/search?category=EXPERIENCE'],
        ['Restaurants', '/search?category=RESTAURANT'],
        ['Vehicles', '/search?category=VEHICLE'],
        ['Top Destinations', '/search'],
        ['Deals & Offers', '/search'],
      ],
    },
    {
      title: 'Support',
      links: [
        ['Help Center', '#'],
        ['Contact Us', '#'],
        ['Booking Guide', '#'],
        ['Payment & Refund', '#'],
        ['Safety & Security', '#'],
        ['FAQs', '#'],
      ],
    },
    {
      title: 'For Providers',
      links: [
        ['Become a Provider', '/register'],
        ['Provider Login', '/login'],
        ['Provider Guide', '/provider/dashboard'],
        ['Pricing & Plans', '/register'],
        ['Partner Program', '/register'],
      ],
    },
    {
      title: 'Company',
      links: [
        ['About Us', '#'],
        ['Careers', '#'],
        ['Press', '#'],
        ['Blog', '#'],
        ['Sustainability', '#'],
      ],
    },
    {
      title: 'Legal',
      links: [
        ['Terms of Service', '#'],
        ['Privacy Policy', '#'],
        ['Cookie Policy', '#'],
        ['Refund Policy', '#'],
        ['Code of Conduct', '#'],
      ],
    },
  ];

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const paymentMethods = [
    { name: 'Visa', mark: 'VISA', className: 'text-blue-700 italic', bg: 'bg-blue-50' },
    { name: 'Mastercard', mark: 'Mastercard', className: 'text-orange-600', bg: 'bg-orange-50', type: 'mastercard' },
    { name: 'PayPal', mark: 'PayPal', className: 'text-blue-700', bg: 'bg-sky-50', type: 'paypal' },
    { name: 'MoMo', mark: 'MoMo', className: 'text-pink-700', bg: 'bg-pink-50' },
    { name: 'VNPay', mark: 'VNPay', className: 'text-sky-700', bg: 'bg-cyan-50', type: 'vnpay' },
    { name: 'ZaloPay', mark: 'ZaloPay', className: 'text-blue-600', bg: 'bg-blue-50', type: 'zalopay' },
  ] satisfies PaymentMethod[];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <SiteHeader />

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="relative w-full overflow-hidden bg-slate-950 text-white">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-950/70 via-slate-950 to-slate-900" />
          <div className="absolute left-0 top-0 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1.35fr_3fr_1.35fr]">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <img
                  src="/brand/ai-marketplace-traveler-logo.png"
                  alt="AI Marketplace Traveler"
                  className="h-14 w-auto max-w-[230px] rounded-lg bg-white/95 px-2 py-1 shadow-sm"
                />
              </div>
              <p className="mt-5 max-w-sm text-sm leading-6 text-slate-300">
                Your intelligent marketplace for the best travel experiences, stays, tours, restaurants, vehicles, and more. Plan smarter. Travel better.
              </p>

              <div className="mt-6 flex gap-3">
                {[Facebook, Instagram, Twitter, Linkedin].map((Icon, index) => (
                  <a
                    key={index}
                    href="#"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition-all hover:-translate-y-0.5 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    aria-label="Social link"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>

              <div className="mt-7 grid max-w-sm grid-cols-2 gap-3">
                <button className="rounded-lg border border-white/15 bg-black/25 px-3 py-2.5 text-left text-[11px] text-slate-300 transition-colors hover:bg-white/10">
                  <span className="flex items-center gap-2 font-semibold text-white"><Smartphone className="h-4 w-4" /> App Store</span>
                  Coming soon
                </button>
                <button className="rounded-lg border border-white/15 bg-black/25 px-3 py-2.5 text-left text-[11px] text-slate-300 transition-colors hover:bg-white/10">
                  <span className="flex items-center gap-2 font-semibold text-white"><Smartphone className="h-4 w-4" /> Google Play</span>
                  Coming soon
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-8 sm:grid-cols-3 xl:grid-cols-5">
              {footerColumns.map((column) => (
                <div key={column.title}>
                  <h4 className="text-sm font-bold text-white">{column.title}</h4>
                  <ul className="mt-4 space-y-2 text-sm text-slate-400">
                    {column.links.map(([label, href]) => (
                      <li key={label}>
                        <Link to={href} className="transition-colors hover:text-white focus:outline-none focus:text-white">
                          {label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="min-w-0">
              <div>
                <h4 className="text-sm font-bold text-white">We Accept</h4>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {paymentMethods.map((item) => (
                    <PaymentCard key={item.name} method={item} />
                  ))}
                </div>
              </div>

              <div className="mt-8">
                <h4 className="text-sm font-bold text-white">Secure & Trusted</h4>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {[
                    { label: 'PCI', sub: 'Compliant', icon: ShieldCheck, color: 'text-blue-300' },
                    { label: 'SSL', sub: 'Secure', icon: Lock, color: 'text-emerald-300' },
                    { label: '24/7', sub: 'Support', icon: Headphones, color: 'text-cyan-300' },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex h-10 items-center gap-2 rounded-lg border border-white/15 bg-white/[0.06] px-2 text-left transition-all hover:-translate-y-0.5 hover:bg-white/[0.1] hover:shadow-lg"
                    >
                      <item.icon className={cn('h-4 w-4 shrink-0', item.color)} />
                      <span className="min-w-0">
                        <span className="block text-[10px] font-black leading-none text-white">{item.label}</span>
                        <span className="block truncate text-[8px] uppercase leading-none text-slate-400">{item.sub}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-4 border-t border-white/10 pt-5 text-sm text-slate-400 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-center lg:text-left">Copyright 2026 AI Travel Marketplace. All rights reserved.</p>
            <div className="flex flex-wrap items-center justify-center gap-5">
              <button className="inline-flex items-center gap-2 transition-colors hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-400">
                <span className="h-4 w-4 rounded-full border border-slate-500" /> English (US)
              </button>
              <button className="inline-flex items-center gap-2 transition-colors hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-400">
                <span className="h-4 w-4 rounded-full border border-slate-500" /> USD
              </button>
              <button
                onClick={scrollToTop}
                className="inline-flex items-center gap-2 transition-all hover:-translate-y-0.5 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                Back to top <ArrowUp className="h-4 w-4" />
              </button>
            </div>
          </div>
          </div>
      </footer>
    </div>
  );
};

