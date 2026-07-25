import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Edit3,
  MapPin,
  MoreHorizontal,
  Plus,
  Route,
  Send,
  Share2,
  Sparkles,
  WalletCards,
} from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { aiService } from "@/services/aiService";
import type { SavedTrip } from "@/types/ai";
import { useAuth } from "@/context/AuthContext";

type TripTab = "upcoming" | "completed";

const money = (amount?: number, currency = "VND") => {
  if (amount === undefined || amount === null) return undefined;
  try {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString("vi-VN")} ${currency}`;
  }
};

const compactMoney = (amount?: number, currency = "VND") => {
  if (amount === undefined || amount === null) return undefined;
  if (currency === "VND" && amount >= 1_000_000) {
    const value = new Intl.NumberFormat("vi-VN", {
      maximumFractionDigits: amount >= 10_000_000 ? 0 : 1,
    }).format(amount / 1_000_000);
    return `${value} triệu ₫`;
  }
  return money(amount, currency);
};

const dateRange = (startDate?: string, endDate?: string) => {
  if (!startDate && !endDate) return "Dates flexible";
  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  try {
    if (startDate && endDate)
      return `${formatter.format(new Date(startDate))} - ${formatter.format(new Date(endDate))}`;
    return formatter.format(new Date(startDate || endDate || ""));
  } catch {
    return startDate && endDate
      ? `${startDate} - ${endDate}`
      : startDate || endDate || "Dates flexible";
  }
};

const durationText = (trip: SavedTrip) =>
  trip.durationText ||
  `${trip.durationDays || 1}D / ${trip.durationNights ?? Math.max((trip.durationDays || 1) - 1, 0)}N`;

const tripPath = (trip: SavedTrip) => trip.detailPath || `/trips/${trip.slug}`;

const isCompleted = (trip: SavedTrip) =>
  (trip.status || "").toUpperCase() === "COMPLETED";

const tripStatusLabel = (trip: SavedTrip) => {
  const status = (trip.status || "UPCOMING").toUpperCase();
  if (status === "COMPLETED") return "Completed";
  if (status === "DRAFT") return "Draft";
  return "Upcoming";
};

const TripFallbackImage = ({ destination }: { destination: string }) => (
  <div className="relative h-full w-full overflow-hidden bg-gradient-to-br from-sky-200 via-blue-300 to-teal-300">
    <svg
      aria-hidden="true"
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 520 260"
      fill="none"
      preserveAspectRatio="none"
    >
      <path
        d="M0 142C86 87 168 93 248 137C329 181 408 145 520 86V260H0V142Z"
        fill="#BAE6FD"
      />
      <path
        d="M46 177C131 132 218 133 326 180"
        stroke="#2563EB"
        strokeWidth="9"
        strokeLinecap="round"
        opacity="0.42"
      />
      <path d="M50 137L150 45L250 137H50Z" fill="#0F766E" opacity="0.7" />
      <path d="M222 145L338 51L453 145H222Z" fill="#0284C7" opacity="0.45" />
      <circle cx="416" cy="63" r="34" fill="#FBBF24" opacity="0.85" />
    </svg>
    <span className="sr-only">{destination}</span>
  </div>
);

const TripTabs = ({
  activeTab,
  onChange,
  upcomingCount,
  completedCount,
}: {
  activeTab: TripTab;
  onChange: (tab: TripTab) => void;
  upcomingCount: number;
  completedCount: number;
}) => (
  <div className="grid grid-cols-2 gap-1.5 rounded-[16px] border border-slate-200 bg-white p-1 shadow-sm">
    {[
      {
        key: "upcoming" as const,
        label: "Upcoming",
        count: upcomingCount,
        icon: CalendarDays,
      },
      {
        key: "completed" as const,
        label: "Completed",
        count: completedCount,
        icon: CheckCircle2,
      },
    ].map(({ key, label, count, icon: Icon }) => {
      const active = activeTab === key;
      return (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={`flex min-w-0 items-center justify-center gap-2 rounded-[13px] px-2.5 py-2 text-[13px] font-black transition ${
            active
              ? "bg-blue-50 text-blue-700 shadow-sm"
              : "text-slate-500 hover:bg-slate-50"
          }`}
        >
          <Icon className="h-4 w-4" />
          <span className="min-w-0 whitespace-normal leading-tight">
            {label}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs ${active ? "bg-white text-blue-700" : "bg-slate-100 text-slate-500"}`}
          >
            {count}
          </span>
        </button>
      );
    })}
  </div>
);

const TripListItem = ({
  trip,
  selected,
  onSelect,
}: {
  trip: SavedTrip;
  selected: boolean;
  onSelect: () => void;
}) => (
  <button
    type="button"
    onClick={onSelect}
    className={`grid min-h-[108px] w-full min-w-0 grid-cols-[80px_minmax(0,1fr)_32px] items-center gap-3 rounded-[20px] border bg-white p-3 text-left shadow-sm transition sm:grid-cols-[88px_minmax(0,1fr)_34px] min-[1180px]:grid-cols-[84px_minmax(0,1fr)_32px] ${
      selected
        ? "border-blue-500 shadow-blue-500/15 ring-2 ring-blue-100"
        : "border-slate-200 hover:border-blue-200 hover:shadow-md"
    }`}
  >
    <div className="h-[82px] overflow-hidden rounded-[15px] bg-slate-100 sm:h-[88px] min-[1180px]:h-[82px]">
      {trip.heroImageUrl ? (
        <img
          src={trip.heroImageUrl}
          alt={trip.title}
          className="h-full w-full object-cover"
        />
      ) : (
        <TripFallbackImage destination={trip.destination} />
      )}
    </div>
    <div className="min-w-0">
      <h3 className="line-clamp-2 text-[15px] font-black leading-[1.25] text-slate-950">
        {trip.title}
      </h3>
      <p className="mt-1 text-[13px] font-semibold leading-[1.35] text-slate-500">
        {durationText(trip)} - {trip.travelerCount || 1} travelers
      </p>
      <p className="mt-0.5 text-[13px] leading-[1.35] text-slate-500">
        {dateRange(trip.startDate, trip.endDate)}
      </p>
      <p className="mt-0.5 text-[13px] leading-[1.35] text-slate-500">
        Est.{" "}
        {compactMoney(trip.estimatedCost || trip.budget, trip.currency) ||
          "Not set"}
      </p>
    </div>
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-700">
      <ChevronRight className="h-4 w-4" />
    </span>
  </button>
);

const CreateTripCard = () => (
  <Link
    to="/ai/assistant"
    className="relative grid min-h-[78px] min-w-0 grid-cols-[48px_minmax(0,1fr)] items-center gap-3 overflow-hidden rounded-[18px] border border-dashed border-blue-200 bg-blue-50/50 p-3.5 transition hover:border-blue-300 hover:bg-blue-50"
  >
    <div className="flex h-12 w-12 items-center justify-center rounded-[15px] bg-white text-blue-700 shadow-sm">
      <Plus className="h-6 w-6" />
    </div>
    <div className="min-w-0">
      <p className="text-[15px] font-black text-blue-700">Create new trip</p>
      <p className="mt-0.5 text-xs leading-5 text-slate-500">
        Let AI craft your next adventure
      </p>
    </div>
    <Send className="absolute bottom-4 right-5 h-7 w-7 rotate-[-18deg] text-blue-300/70" />
  </Link>
);

const MyTripsNavigator = ({
  activeTab,
  onTabChange,
  trips,
  selectedTrip,
  onSelectTrip,
  upcomingCount,
  completedCount,
  isLoading,
  isError,
  onRetry,
}: {
  activeTab: TripTab;
  onTabChange: (tab: TripTab) => void;
  trips: SavedTrip[];
  selectedTrip?: SavedTrip;
  onSelectTrip: (trip: SavedTrip) => void;
  upcomingCount: number;
  completedCount: number;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) => (
  <aside className="min-w-0 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-xl shadow-blue-950/5 min-[1180px]:sticky min-[1180px]:top-24 min-[1180px]:flex min-[1180px]:max-h-[calc(100dvh-var(--shared-header-offset,88px)-24px)] min-[1180px]:flex-col">
    <div className="shrink-0 p-4 pb-3 sm:p-4 sm:pb-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between min-[1180px]:gap-3">
        <div>
          <h1 className="text-[clamp(26px,1.8vw,32px)] font-black tracking-tight text-slate-950">
            My Trips
          </h1>
          <p className="mt-1 max-w-[240px] text-xs font-medium leading-5 text-slate-500">
            Your AI-curated adventures, all in one place.
          </p>
        </div>
        <Link
          to="/ai/assistant"
          className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-full bg-blue-600 px-3.5 text-[13px] font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Plan trip
        </Link>
      </div>
      <div className="mt-4">
        <TripTabs
          activeTab={activeTab}
          onChange={onTabChange}
          upcomingCount={upcomingCount}
          completedCount={completedCount}
        />
      </div>
    </div>

    <div className="min-w-0 px-4 pb-2 pr-3 sm:pr-4 min-[1180px]:min-h-[250px] min-[1180px]:flex-1 min-[1180px]:overflow-y-auto min-[1180px]:overscroll-contain min-[1180px]:[scrollbar-gutter:stable] min-[1180px]:[scrollbar-width:thin]">
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-32 animate-pulse rounded-[22px] bg-slate-100"
            />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-[20px] border border-red-100 bg-red-50 p-5 text-slate-700">
          <p className="font-bold text-red-600">Could not load your trips.</p>
          <button
            onClick={onRetry}
            className="mt-3 rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white"
          >
            Retry
          </button>
        </div>
      ) : trips.length === 0 ? (
        <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-6 text-center">
          <Route className="mx-auto h-9 w-9 text-blue-500" />
          <h2 className="mt-3 text-lg font-black text-slate-950">
            No {activeTab} trips
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Use the AI concierge to build your next saved trip.
          </p>
        </div>
      ) : (
        <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3 min-[1180px]:block min-[1180px]:space-y-3">
          {trips.map((trip) => (
            <TripListItem
              key={trip.id}
              trip={trip}
              selected={selectedTrip?.id === trip.id}
              onSelect={() => onSelectTrip(trip)}
            />
          ))}
        </div>
      )}
    </div>

    <div className="shrink-0 border-t border-slate-100 px-4 pb-4 pt-3">
      <CreateTripCard />
      <p className="mt-3 flex items-center gap-2 text-[11px] font-semibold leading-4 text-slate-500">
        <Sparkles className="h-4 w-4 text-blue-500" />
        Powered by AI - crafted for unforgettable journeys.
      </p>
    </div>
  </aside>
);

const TripHero = ({ trip }: { trip: SavedTrip }) => (
  <section className="relative h-[clamp(245px,26vw,320px)] min-w-0 overflow-hidden rounded-[24px] bg-slate-900 shadow-lg shadow-blue-950/10 max-[720px]:h-[clamp(230px,62vw,270px)]">
    {trip.heroImageUrl ? (
      <img
        src={trip.heroImageUrl}
        alt={trip.title}
        className="absolute inset-0 h-full w-full object-cover"
      />
    ) : (
      <TripFallbackImage destination={trip.destination} />
    )}
    <div className="absolute inset-y-0 left-0 w-[68%] bg-gradient-to-r from-slate-950/78 via-slate-950/34 to-transparent" />
    <div className="absolute inset-x-0 bottom-0 h-[48%] bg-gradient-to-t from-slate-950/45 via-slate-950/12 to-transparent" />
    <div className="relative flex h-full min-w-0 flex-col justify-end p-5 text-white sm:p-6 lg:p-7">
      <div className="absolute left-5 top-5 sm:left-6 sm:top-6 lg:left-8 lg:top-8">
        <span className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-3 py-2 text-xs font-black shadow-lg shadow-slate-950/20 sm:text-sm">
          <CalendarDays className="h-4 w-4" />
          {tripStatusLabel(trip)}
        </span>
      </div>
      <button
        type="button"
        aria-label="Trip menu"
        className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm transition hover:bg-white"
      >
        <MoreHorizontal className="h-5 w-5" />
      </button>
      <div className="min-w-0 max-w-[min(700px,78%)] rounded-[22px] bg-slate-950/[0.16] p-3 pr-10 shadow-[0_18px_55px_rgba(15,23,42,0.22)] backdrop-blur-[1px] sm:p-4 sm:pr-12">
        <h2 className="text-[clamp(30px,2.8vw,50px)] font-black leading-[1.06] tracking-tight text-white [text-shadow:0_3px_18px_rgba(0,0,0,0.58),0_1px_2px_rgba(0,0,0,0.55)]">
          {trip.title}
        </h2>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs font-bold text-white/90 [text-shadow:0_2px_10px_rgba(0,0,0,0.52)] sm:text-sm">
          <span className="inline-flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            {dateRange(trip.startDate, trip.endDate)}
          </span>
          <span className="inline-flex items-center gap-2">
            <Route className="h-4 w-4" />
            {trip.travelerCount || 1} travelers
          </span>
          <span className="inline-flex items-center gap-2">
            <CircleDollarSign className="h-4 w-4" />
            Est.{" "}
            {compactMoney(trip.estimatedCost || trip.budget, trip.currency) ||
              "Not set"}
          </span>
        </div>
        <p className="mt-3 line-clamp-2 max-w-xl text-sm leading-6 text-white/82 [text-shadow:0_2px_10px_rgba(0,0,0,0.45)]">
          {trip.summary || `A personalized journey to ${trip.destination}.`}
        </p>
      </div>
    </div>
  </section>
);

const TripStats = ({ trips }: { trips: SavedTrip[] }) => {
  const upcoming = trips.filter((trip) => !isCompleted(trip)).length;
  const completed = trips.filter(isCompleted).length;
  const totalBudget = trips.reduce(
    (sum, trip) => sum + (trip.estimatedCost || trip.budget || 0),
    0,
  );
  const aiSaved = trips.length;
  const cards = [
    {
      label: "Upcoming trips",
      value: upcoming.toLocaleString("en-US"),
      icon: CalendarDays,
    },
    {
      label: "Completed trips",
      value: completed.toLocaleString("en-US"),
      icon: CheckCircle2,
    },
    {
      label: "Total est. budget",
      value: compactMoney(totalBudget) || "Not set",
      icon: WalletCards,
    },
    {
      label: "Saved by AI",
      value: aiSaved.toLocaleString("en-US"),
      icon: Sparkles,
    },
  ];
  return (
    <section className="grid gap-3 sm:grid-cols-2 min-[1500px]:grid-cols-4">
      {cards.map(({ label, value, icon: Icon }) => (
        <div
          key={label}
          className="flex min-w-0 items-center gap-3 rounded-[17px] border border-slate-200 bg-white p-3.5 shadow-sm"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-blue-50 text-blue-700">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="break-words text-base font-black leading-tight text-slate-950">
              {value}
            </p>
            <p className="mt-1 text-xs font-medium leading-4 text-slate-500">
              {label}
            </p>
          </div>
        </div>
      ))}
    </section>
  );
};

const ItineraryPreview = ({ trip }: { trip: SavedTrip }) => {
  const days = trip.days?.slice(0, 5) ?? [];
  return (
    <section className="min-w-0 rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h3 className="flex items-center gap-2 text-base font-black text-slate-950">
          <MapPin className="h-5 w-5 text-blue-600" />
          Itinerary preview
        </h3>
        <Link
          to={tripPath(trip)}
          className="text-xs font-black text-blue-600 hover:text-blue-700 sm:text-sm"
        >
          View full itinerary
        </Link>
      </div>
      {days.length === 0 ? (
        <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">
          No day-by-day itinerary is available for this trip yet.
        </p>
      ) : (
        <div className="grid min-w-0 grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] gap-3">
          {days.map((day, index) => (
            <Link
              key={day.dayNumber}
              to={tripPath(trip)}
              className="relative grid min-w-0 grid-cols-[58px_minmax(0,1fr)] gap-3 rounded-[17px] border border-slate-200 bg-white p-3 shadow-sm transition hover:border-blue-200 hover:shadow-md"
            >
              {index > 0 ? (
                <span
                  aria-hidden="true"
                  className="absolute -left-3 top-1/2 hidden h-px w-3 border-t border-dashed border-blue-200 min-[1650px]:block"
                />
              ) : null}
              <div className="h-14 overflow-hidden rounded-full bg-slate-100">
                {day.imageUrl ? (
                  <img
                    src={day.imageUrl}
                    alt={day.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <TripFallbackImage destination={trip.destination} />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-black text-slate-950">
                  Day {day.dayNumber}
                </p>
                <p className="mt-1 line-clamp-2 text-sm font-bold leading-5 text-slate-700">
                  {day.title}
                </p>
                <p className="mt-1 line-clamp-3 text-xs leading-5 text-slate-500">
                  {day.summary ||
                    day.activities
                      ?.slice(0, 2)
                      .map((activity) => activity.title)
                      .join(" - ") ||
                    "Curated activities"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
};

const AiTripNotes = ({ trip }: { trip: SavedTrip }) => {
  const linkedCount =
    trip.days
      ?.flatMap((day) => day.activities || [])
      .filter((activity) => activity.listingSlug).length ?? 0;
  const notes = [
    `${durationText(trip)} balanced for ${trip.travelerCount || 1} traveler${(trip.travelerCount || 1) > 1 ? "s" : ""}.`,
    `${money(trip.estimatedCost || trip.budget, trip.currency) ? "Budget estimate is available for this plan." : "Budget details can be refined with AI."}`,
    linkedCount > 0
      ? `${linkedCount} marketplace service${linkedCount > 1 ? "s" : ""} attached to the itinerary.`
      : "Marketplace picks can be added as you continue planning.",
  ];

  return (
    <section className="min-w-0 rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="flex items-center gap-2 text-base font-black text-slate-950">
        <Sparkles className="h-5 w-5 text-blue-600" />
        AI notes
      </h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        This trip balances {trip.durationDays || 1} day
        {(trip.durationDays || 1) > 1 ? "s" : ""}, {trip.travelerCount || 1}{" "}
        traveler{(trip.travelerCount || 1) > 1 ? "s" : ""}, and the current
        estimated budget.
      </p>
      <ul className="mt-3 space-y-2 text-[13px] leading-5 text-slate-600">
        {notes.map((note) => (
          <li key={note} className="flex gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            <span className="min-w-0">{note}</span>
          </li>
        ))}
      </ul>
      <Link
        to="/ai/assistant"
        className="mt-4 flex h-10 items-center justify-center gap-2 rounded-[14px] border border-blue-200 bg-blue-50 text-sm font-black text-blue-700 transition hover:bg-blue-100"
      >
        Continue planning
        <Sparkles className="h-4 w-4" />
      </Link>
    </section>
  );
};

const TripExperiences = ({ trip }: { trip: SavedTrip }) => {
  const linkedActivities =
    trip.days
      ?.flatMap((day) =>
        (day.activities || [])
          .filter((activity) => activity.listingSlug)
          .map((activity) => ({
            ...activity,
            dayImage: day.imageUrl,
          })),
      )
      .slice(0, 4) ?? [];

  return (
    <section className="min-w-0 rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h3 className="flex items-center gap-2 text-base font-black text-slate-950">
          <Route className="h-5 w-5 text-blue-600" />
          Experiences in this trip
        </h3>
        <Link
          to={tripPath(trip)}
          className="text-xs font-black text-blue-600 hover:text-blue-700 sm:text-sm"
        >
          See all
        </Link>
      </div>
      {linkedActivities.length === 0 ? (
        <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">
          No linked marketplace services are attached to this trip yet.
        </p>
      ) : (
        <div className="grid min-w-0 grid-cols-[repeat(auto-fit,minmax(min(150px,100%),1fr))] gap-3">
          {linkedActivities.map((activity) => (
            <Link
              key={`${activity.listingSlug}-${activity.timeOfDay}-${activity.title}`}
              to={`/listings/${encodeURIComponent(activity.listingSlug || "")}`}
              className="min-w-0 overflow-hidden rounded-[16px] border border-slate-200 bg-white shadow-sm transition hover:border-blue-200 hover:shadow-md"
            >
              <div className="h-28 bg-slate-100">
                {activity.dayImage ? (
                  <img
                    src={activity.dayImage}
                    alt={activity.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <TripFallbackImage destination={trip.destination} />
                )}
              </div>
              <div className="p-3">
                <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-black text-emerald-700">
                  Included
                </span>
                <h4 className="mt-2 line-clamp-2 text-sm font-black leading-5 text-slate-950">
                  {activity.title}
                </h4>
                <p className="mt-1 truncate text-xs text-slate-500">
                  {activity.timeOfDay || "Trip activity"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
};

const TripBudgetBreakdown = ({ trip }: { trip: SavedTrip }) => {
  const activityCosts =
    trip.days
      ?.flatMap((day) => day.activities || [])
      .map((activity) => activity.estimatedCost || 0)
      .filter((cost) => cost > 0) ?? [];
  const activityTotal = activityCosts.reduce((sum, cost) => sum + cost, 0);
  const total = trip.estimatedCost || activityTotal || trip.budget;
  return (
    <section className="min-w-0 rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-base font-black text-slate-950">
          Budget breakdown
        </h3>
        <Link
          to={tripPath(trip)}
          className="text-xs font-black text-blue-600 hover:text-blue-700 sm:text-sm"
        >
          See details
        </Link>
      </div>
      {activityCosts.length === 0 ? (
        <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
          Detailed category costs are not available yet. Total estimate:{" "}
          <span className="font-black text-slate-900">
            {money(total, trip.currency) || "Not set"}
          </span>
        </div>
      ) : (
        <div className="space-y-3 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-slate-500">Trip activities</span>
            <span className="break-words text-right font-bold text-slate-900">
              {money(activityTotal, trip.currency)}
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 text-base font-black text-blue-700">
            <span>Total estimate</span>
            <span className="break-words text-right">
              {money(total, trip.currency)}
            </span>
          </div>
        </div>
      )}
    </section>
  );
};

const TripQuickActions = ({ trip }: { trip: SavedTrip }) => (
  <section className="min-w-0 rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm">
    <h3 className="mb-4 text-base font-black text-slate-950">Quick actions</h3>
    <div className="grid gap-3">
      <Link
        to={tripPath(trip)}
        className="flex h-12 items-center gap-3 rounded-[14px] border border-slate-200 px-4 text-sm font-black text-slate-800 transition hover:border-blue-200 hover:bg-blue-50"
      >
        <Edit3 className="h-4 w-4 text-blue-600" />
        Edit trip
      </Link>
      <Link
        to="/ai/assistant"
        className="flex h-12 items-center gap-3 rounded-[14px] border border-slate-200 px-4 text-sm font-black text-slate-800 transition hover:border-blue-200 hover:bg-blue-50"
      >
        <Sparkles className="h-4 w-4 text-blue-600" />
        Continue planning
      </Link>
      <button
        type="button"
        className="flex h-12 items-center gap-3 rounded-[14px] border border-slate-200 px-4 text-sm font-black text-slate-800 transition hover:border-blue-200 hover:bg-blue-50"
      >
        <Share2 className="h-4 w-4 text-blue-600" />
        Share trip
      </button>
      <Link
        to={tripPath(trip)}
        className="flex h-12 items-center gap-3 rounded-[14px] bg-blue-600 px-4 text-sm font-black text-white transition hover:bg-blue-700"
      >
        <CalendarCheck className="h-4 w-4" />
        Start booking
      </Link>
    </div>
  </section>
);

const SelectedTripWorkspace = ({
  trip,
  trips,
}: {
  trip?: SavedTrip;
  trips: SavedTrip[];
}) => {
  if (!trip) {
    return (
      <section className="flex min-h-[420px] items-center justify-center rounded-[24px] border border-slate-200 bg-white p-6 text-center shadow-xl shadow-blue-950/5 sm:p-8">
        <div className="max-w-md">
          <Route className="mx-auto h-12 w-12 text-blue-500" />
          <h2 className="mt-4 text-3xl font-black text-slate-950">
            Start planning your next journey
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Create a trip with the AI concierge or add one manually when you are
            ready.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to="/ai/assistant"
              className="rounded-full bg-blue-600 px-5 py-3 text-sm font-black text-white"
            >
              Plan with AI
            </Link>
            <Link
              to="/ai/planner"
              className="rounded-full border border-slate-200 px-5 py-3 text-sm font-black text-slate-700"
            >
              Create manually
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-w-0 space-y-4 rounded-[24px] border border-slate-200 bg-white p-3 shadow-xl shadow-blue-950/5 sm:p-4 lg:p-5">
      <TripHero trip={trip} />
      <TripStats trips={trips} />
      <div className="grid min-w-0 gap-4 min-[1500px]:grid-cols-[minmax(0,2fr)_minmax(280px,0.85fr)]">
        <ItineraryPreview trip={trip} />
        <AiTripNotes trip={trip} />
      </div>
      <div className="grid min-w-0 gap-4 min-[900px]:grid-cols-2 min-[1280px]:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.8fr)]">
        <TripExperiences trip={trip} />
        <TripBudgetBreakdown trip={trip} />
        <TripQuickActions trip={trip} />
      </div>
    </section>
  );
};

export const MyTripsPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TripTab>("upcoming");
  const [selectedTripId, setSelectedTripId] = useState<number>();
  const {
    data = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["my-trips", user?.id],
    queryFn: aiService.getMyTrips,
    enabled: Boolean(user?.id),
    staleTime: 30_000,
  });

  const upcomingTrips = useMemo(
    () => data.filter((trip) => !isCompleted(trip)),
    [data],
  );
  const completedTrips = useMemo(() => data.filter(isCompleted), [data]);
  const visibleTrips =
    activeTab === "upcoming" ? upcomingTrips : completedTrips;
  const selectedTrip = data.find((trip) => trip.id === selectedTripId);

  useEffect(() => {
    if (selectedTripId && data.some((trip) => trip.id === selectedTripId))
      return;
    const nextTrip =
      visibleTrips[0] || upcomingTrips[0] || completedTrips[0] || data[0];
    setSelectedTripId(nextTrip?.id);
  }, [completedTrips, data, selectedTripId, upcomingTrips, visibleTrips]);

  const handleTabChange = (tab: TripTab) => {
    setActiveTab(tab);
    const nextTrips = tab === "upcoming" ? upcomingTrips : completedTrips;
    if (nextTrips[0]) setSelectedTripId(nextTrips[0].id);
  };

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-slate-50 px-[clamp(16px,2vw,32px)] py-5 pb-8">
        <div className="mx-auto grid w-full max-w-[1760px] gap-[clamp(18px,1.5vw,26px)] min-[1180px]:grid-cols-[clamp(300px,23vw,360px)_minmax(0,1fr)]">
          <MyTripsNavigator
            activeTab={activeTab}
            onTabChange={handleTabChange}
            trips={visibleTrips}
            selectedTrip={selectedTrip}
            onSelectTrip={(trip) => setSelectedTripId(trip.id)}
            upcomingCount={upcomingTrips.length}
            completedCount={completedTrips.length}
            isLoading={isLoading}
            isError={isError}
            onRetry={refetch}
          />
          {isLoading ? (
            <section className="min-h-[520px] min-w-0 animate-pulse rounded-[24px] border border-slate-200 bg-white shadow-xl shadow-blue-950/5" />
          ) : isError ? (
            <section className="flex min-h-[420px] min-w-0 items-center justify-center rounded-[24px] border border-red-100 bg-white p-8 text-center shadow-xl shadow-blue-950/5">
              <div>
                <p className="text-lg font-black text-red-600">
                  Could not load the selected trip workspace.
                </p>
                <button
                  onClick={() => refetch()}
                  className="mt-4 rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white"
                >
                  Retry
                </button>
              </div>
            </section>
          ) : (
            <SelectedTripWorkspace trip={selectedTrip} trips={data} />
          )}
        </div>
      </main>
    </>
  );
};
