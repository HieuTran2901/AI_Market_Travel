import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  Car,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coffee,
  CreditCard,
  Dumbbell,
  Globe2,
  Grid2X2,
  Hotel,
  LayoutGrid,
  List,
  Loader2,
  Map,
  MapPin,
  Minus,
  Navigation,
  PawPrint,
  Plane,
  Plus,
  RefreshCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Snowflake,
  Sparkles,
  Star,
  Tags,
  Utensils,
  Users,
  WashingMachine,
  Waves,
  Wifi,
  X,
  Zap,
} from "lucide-react";
import { listingService } from "@/services/listingService";
import { ListingCard } from "@/components/ui/ListingCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { StateBlock } from "@/components/ui/StateBlock";
import { ListingCategory, ListingResponse, ListingSearchRequest } from "@/types/listing";
import { cn } from "@/lib/utils";

type RatingFilter = "" | "4.5" | "4.0" | "3.5";
type LocationMode = "" | "text" | "coordinates";

type FilterState = {
  keyword: string;
  category: ListingCategory | "";
  city: string;
  locationMode: LocationMode;
  locationLabel: string;
  latitude: string;
  longitude: string;
  radiusKm: string;
  minPrice: string;
  maxPrice: string;
  rating: RatingFilter;
  sortBy: string;
  availableOnly: boolean;
  instantBooking: boolean;
  freeCancellation: boolean;
  amenities: string[];
  guestCapacity: string;
  providerRating: string;
  language: string;
  reserveNowPayLater: boolean;
  noPrepayment: boolean;
  flexibleCancellation: boolean;
  payAtProperty: boolean;
  confirmationWithin24Hours: boolean;
  propertyType: string;
  accessibility: string[];
  neighborhood: string;
  neighborhoodQuery: string;
  neighborhoodDistance: string;
  adults: number;
  children: number;
  infants: number;
  rooms: number;
  bedrooms: number;
  bathrooms: number;
  priceUnit: string;
  providerVerifiedOnly: boolean;
  providerTopRatedOnly: boolean;
  providerPreferredOnly: boolean;
  providerNewOnly: boolean;
  providerInstantResponse: boolean;
  providerRespondsWithin24h: boolean;
  providerTypes: string[];
  providerMinReviews: string;
  languages: string[];
};

type CategoryOption = {
  label: string;
  value: ListingCategory | "";
  icon: React.ElementType;
};

const defaultFilters: FilterState = {
  keyword: "",
  category: "",
  city: "",
  locationMode: "",
  locationLabel: "",
  latitude: "",
  longitude: "",
  radiusKm: "50",
  minPrice: "",
  maxPrice: "",
  rating: "",
  sortBy: "recommended",
  availableOnly: false,
  instantBooking: false,
  freeCancellation: false,
  amenities: [],
  guestCapacity: "",
  providerRating: "",
  language: "",
  reserveNowPayLater: false,
  noPrepayment: false,
  flexibleCancellation: false,
  payAtProperty: false,
  confirmationWithin24Hours: false,
  propertyType: "",
  accessibility: [],
  neighborhood: "",
  neighborhoodQuery: "",
  neighborhoodDistance: "",
  adults: 0,
  children: 0,
  infants: 0,
  rooms: 0,
  bedrooms: 0,
  bathrooms: 0,
  priceUnit: "ANY",
  providerVerifiedOnly: false,
  providerTopRatedOnly: false,
  providerPreferredOnly: false,
  providerNewOnly: false,
  providerInstantResponse: false,
  providerRespondsWithin24h: false,
  providerTypes: [],
  providerMinReviews: "",
  languages: [],
};

function safeString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function trimmed(value: unknown): string {
  return safeString(value).trim();
}

function safeStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function safeNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function optionalNumber(value: unknown): number | undefined {
  const valueText = trimmed(value);
  if (!valueText) return undefined;
  const numberValue = Number(valueText);
  return Number.isFinite(numberValue) ? numberValue : undefined;
}

function normalizeFilters(filters?: Partial<FilterState>): FilterState {
  return {
    ...defaultFilters,
    ...filters,
    keyword: safeString(filters?.keyword),
    category: filters?.category || "",
    city: safeString(filters?.city),
    locationMode: filters?.locationMode || "",
    locationLabel: safeString(filters?.locationLabel),
    latitude: safeString(filters?.latitude),
    longitude: safeString(filters?.longitude),
    radiusKm: safeString(filters?.radiusKm) || defaultFilters.radiusKm,
    minPrice: safeString(filters?.minPrice),
    maxPrice: safeString(filters?.maxPrice),
    rating: (filters?.rating as RatingFilter) || "",
    sortBy: safeString(filters?.sortBy) || defaultFilters.sortBy,
    availableOnly: Boolean(filters?.availableOnly),
    instantBooking: Boolean(filters?.instantBooking),
    freeCancellation: Boolean(filters?.freeCancellation),
    amenities: safeStringArray(filters?.amenities),
    guestCapacity: safeString(filters?.guestCapacity),
    providerRating: safeString(filters?.providerRating),
    language: safeString(filters?.language),
    reserveNowPayLater: Boolean(filters?.reserveNowPayLater),
    noPrepayment: Boolean(filters?.noPrepayment),
    flexibleCancellation: Boolean(filters?.flexibleCancellation),
    payAtProperty: Boolean(filters?.payAtProperty),
    confirmationWithin24Hours: Boolean(filters?.confirmationWithin24Hours),
    propertyType: safeString(filters?.propertyType),
    accessibility: safeStringArray(filters?.accessibility),
    neighborhood: safeString(filters?.neighborhood),
    neighborhoodQuery: safeString(filters?.neighborhoodQuery),
    neighborhoodDistance: safeString(filters?.neighborhoodDistance),
    adults: safeNumber(filters?.adults),
    children: safeNumber(filters?.children),
    infants: safeNumber(filters?.infants),
    rooms: safeNumber(filters?.rooms),
    bedrooms: safeNumber(filters?.bedrooms),
    bathrooms: safeNumber(filters?.bathrooms),
    priceUnit: safeString(filters?.priceUnit) || defaultFilters.priceUnit,
    providerVerifiedOnly: Boolean(filters?.providerVerifiedOnly),
    providerTopRatedOnly: Boolean(filters?.providerTopRatedOnly),
    providerPreferredOnly: Boolean(filters?.providerPreferredOnly),
    providerNewOnly: Boolean(filters?.providerNewOnly),
    providerInstantResponse: Boolean(filters?.providerInstantResponse),
    providerRespondsWithin24h: Boolean(filters?.providerRespondsWithin24h),
    providerTypes: safeStringArray(filters?.providerTypes),
    providerMinReviews: safeString(filters?.providerMinReviews),
    languages: safeStringArray(filters?.languages),
  };
}

const categoryOptions: CategoryOption[] = [
  { label: "All", value: "", icon: Grid2X2 },
  { label: "Hotel", value: "HOTEL", icon: Hotel },
  { label: "Tour", value: "TOUR", icon: Map },
  { label: "Experience", value: "EXPERIENCE", icon: Sparkles },
  { label: "Restaurant", value: "RESTAURANT", icon: Utensils },
  { label: "Vehicle", value: "VEHICLE", icon: Car },
];

const sortOptions = [
  { label: "Recommended", value: "recommended" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Rating: High to Low", value: "rating_desc" },
  { label: "Newest", value: "newest" },
];

const ratingOptions: Array<{ label: string; value: RatingFilter }> = [
  { label: "Any Rating", value: "" },
  { label: "4.5+", value: "4.5" },
  { label: "4.0+", value: "4.0" },
  { label: "3.5+", value: "3.5" },
];

const priceOptions = [
  { label: "Any Price", minPrice: "", maxPrice: "" },
  { label: "Under $50", minPrice: "", maxPrice: "50" },
  { label: "$50 - $150", minPrice: "50", maxPrice: "150" },
  { label: "$150 - $300", minPrice: "150", maxPrice: "300" },
  { label: "$300+", minPrice: "300", maxPrice: "" },
];

const amenities = [
  { label: "Wifi", icon: Wifi },
  { label: "Breakfast", icon: Coffee },
  { label: "Parking", icon: Car },
  { label: "Pool", icon: Waves },
  { label: "Air Conditioning", icon: Snowflake },
  { label: "Kitchen", icon: Utensils },
  { label: "Gym", icon: Dumbbell },
  { label: "Spa", icon: Sparkles },
  { label: "Pet friendly", icon: PawPrint },
  { label: "Airport transfer", icon: Plane },
  { label: "Laundry", icon: WashingMachine },
];

const extraAmenities = [
  { label: "Beach access", icon: Waves },
  { label: "Workspace", icon: Coffee },
  { label: "EV charging", icon: Zap },
  { label: "Hot tub", icon: Waves },
  { label: "Room service", icon: BadgeCheck },
  { label: "Balcony", icon: Hotel },
  { label: "Garden", icon: Sparkles },
];

const bookingPolicyOptions: Array<{
  label: string;
  key:
    | "instantBooking"
    | "freeCancellation"
    | "reserveNowPayLater"
    | "noPrepayment"
    | "flexibleCancellation"
    | "payAtProperty"
    | "confirmationWithin24Hours";
  icon: React.ElementType;
}> = [
  { label: "Instant booking", key: "instantBooking", icon: Zap },
  { label: "Free cancellation", key: "freeCancellation", icon: ShieldCheck },
  { label: "Reserve now, pay later", key: "reserveNowPayLater", icon: CalendarCheck },
  { label: "No prepayment required", key: "noPrepayment", icon: CreditCard },
  { label: "Flexible cancellation", key: "flexibleCancellation", icon: RefreshCcw },
  { label: "Pay at property", key: "payAtProperty", icon: Hotel },
  { label: "Confirmation within 24 hours", key: "confirmationWithin24Hours", icon: Clock },
];

const languageOptions = [
  "English",
  "Vietnamese",
  "Chinese",
  "Japanese",
  "Korean",
  "French",
  "German",
  "Spanish",
  "Thai",
  "Indonesian",
];

const accessibilityOptions = [
  "Wheelchair accessible",
  "Step-free entrance",
  "Accessible parking",
  "Accessible bathroom",
  "Elevator",
  "Wide doorway",
  "Hearing assistance",
  "Visual assistance",
  "Service animals allowed",
];

const neighborhoodOptions = [
  "Beachfront",
  "City center",
  "Old town",
  "Near airport",
  "Near public transport",
  "Mountain area",
  "Countryside",
  "Riverside",
  "Shopping district",
  "Nightlife area",
  "Quiet area",
  "Family-friendly area",
];

const heroSlides = [
  {
    title: "Summer Escape in Da Nang",
    subtitle: "Luxury stays, beachfront views, unforgettable memories.",
    image:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80",
    badge: "Featured getaway",
  },
  {
    title: "Lantern Nights in Hoi An",
    subtitle: "Heritage walks, local dining, and riverside evenings.",
    image:
      "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fit=crop&w=1600&q=80",
    badge: "Cultural favorite",
  },
  {
    title: "Island Calm in Phu Quoc",
    subtitle: "Sunset cruises, garden bungalows, and clear blue water.",
    image:
      "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1600&q=80",
    badge: "Beach collection",
  },
];

function filtersFromSearchParams(searchParams: URLSearchParams): FilterState {
  return normalizeFilters({
    ...defaultFilters,
    keyword: searchParams.get("keyword") || "",
    category: (searchParams.get("category") as ListingCategory) || "",
    city: searchParams.get("city") || "",
    locationMode:
      (searchParams.get("locationMode") as LocationMode) ||
      (searchParams.get("city") ? "text" : ""),
    locationLabel: searchParams.get("locationLabel") || "",
    latitude: searchParams.get("latitude") || "",
    longitude: searchParams.get("longitude") || "",
    radiusKm: searchParams.get("radiusKm") || "50",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    rating: (searchParams.get("rating") as RatingFilter) || "",
    sortBy: searchParams.get("sortBy") || "recommended",
    availableOnly: searchParams.get("availableOnly") === "true",
    instantBooking: searchParams.get("instantBooking") === "true",
    freeCancellation: searchParams.get("freeCancellation") === "true",
    amenities: searchParams.get("amenities")?.split(",").filter(Boolean) || [],
    guestCapacity: searchParams.get("guestCapacity") || "",
    providerRating: searchParams.get("providerRating") || "",
    language: searchParams.get("language") || "",
    reserveNowPayLater: searchParams.get("reserveNowPayLater") === "true",
    noPrepayment: searchParams.get("noPrepayment") === "true",
    flexibleCancellation: searchParams.get("flexibleCancellation") === "true",
    payAtProperty: searchParams.get("payAtProperty") === "true",
    confirmationWithin24Hours:
      searchParams.get("confirmationWithin24Hours") === "true",
    propertyType: searchParams.get("propertyType") || "",
    accessibility:
      searchParams.get("accessibility")?.split(",").filter(Boolean) || [],
    neighborhood: searchParams.get("neighborhood") || "",
    neighborhoodQuery: searchParams.get("neighborhoodQuery") || "",
    neighborhoodDistance: searchParams.get("neighborhoodDistance") || "",
    adults: Number(searchParams.get("adults") || 0),
    children: Number(searchParams.get("children") || 0),
    infants: Number(searchParams.get("infants") || 0),
    rooms: Number(searchParams.get("rooms") || 0),
    bedrooms: Number(searchParams.get("bedrooms") || 0),
    bathrooms: Number(searchParams.get("bathrooms") || 0),
    priceUnit: searchParams.get("priceUnit") || "ANY",
    providerVerifiedOnly: searchParams.get("providerVerifiedOnly") === "true",
    providerTopRatedOnly: searchParams.get("providerTopRatedOnly") === "true",
    providerPreferredOnly: searchParams.get("providerPreferredOnly") === "true",
    providerNewOnly: searchParams.get("providerNewOnly") === "true",
    providerInstantResponse:
      searchParams.get("providerInstantResponse") === "true",
    providerRespondsWithin24h:
      searchParams.get("providerRespondsWithin24h") === "true",
    providerTypes:
      searchParams.get("providerTypes")?.split(",").filter(Boolean) || [],
    providerMinReviews: searchParams.get("providerMinReviews") || "",
    languages: searchParams.get("languages")?.split(",").filter(Boolean) || [],
  });
}

function mapSortToApi(sortBy: string): string | undefined {
  switch (sortBy) {
    case "price_asc":
      return "PRICE_ASC";
    case "price_desc":
      return "PRICE_DESC";
    case "rating_desc":
      return "RATING_DESC";
    case "newest":
      return "NEWEST";
    default:
      return undefined;
  }
}

function filtersToApiParams(
  filters: Partial<FilterState> | undefined,
  page = 0,
): ListingSearchRequest {
  const normalized = normalizeFilters(filters);
  const latitude = optionalNumber(normalized.latitude);
  const longitude = optionalNumber(normalized.longitude);
  const radiusKm = optionalNumber(normalized.radiusKm);
  const minPrice = optionalNumber(normalized.minPrice);
  const maxPrice = optionalNumber(normalized.maxPrice);
  const hasCoordinates =
    normalized.locationMode === "coordinates" &&
    latitude !== undefined &&
    longitude !== undefined;

  return {
    keyword: trimmed(normalized.keyword) || undefined,
    category: normalized.category || undefined,
    city: hasCoordinates ? undefined : trimmed(normalized.city) || undefined,
    latitude: hasCoordinates ? latitude : undefined,
    longitude: hasCoordinates ? longitude : undefined,
    radiusKm: hasCoordinates ? radiusKm : undefined,
    minPrice,
    maxPrice,
    sortBy: mapSortToApi(normalized.sortBy),
    page,
  };
}

function filtersToSearchParams(filters: Partial<FilterState> | undefined, page = 0) {
  const normalized = normalizeFilters(filters);
  const next = new URLSearchParams();

  if (trimmed(normalized.keyword)) next.set("keyword", trimmed(normalized.keyword));
  if (normalized.category) next.set("category", normalized.category);
  if (trimmed(normalized.city)) next.set("city", trimmed(normalized.city));
  if (normalized.locationMode) next.set("locationMode", normalized.locationMode);
  if (trimmed(normalized.locationLabel))
    next.set("locationLabel", trimmed(normalized.locationLabel));
  if (normalized.locationMode === "coordinates" && normalized.latitude)
    next.set("latitude", normalized.latitude);
  if (normalized.locationMode === "coordinates" && normalized.longitude)
    next.set("longitude", normalized.longitude);
  if (normalized.locationMode === "coordinates" && normalized.radiusKm)
    next.set("radiusKm", normalized.radiusKm);
  if (normalized.minPrice) next.set("minPrice", normalized.minPrice);
  if (normalized.maxPrice) next.set("maxPrice", normalized.maxPrice);
  if (normalized.rating) next.set("rating", normalized.rating);
  if (normalized.sortBy !== "recommended") next.set("sortBy", normalized.sortBy);
  if (normalized.availableOnly) next.set("availableOnly", "true");
  if (normalized.instantBooking) next.set("instantBooking", "true");
  if (normalized.freeCancellation) next.set("freeCancellation", "true");
  if (normalized.amenities.length)
    next.set("amenities", normalized.amenities.join(","));
  if (normalized.guestCapacity) next.set("guestCapacity", normalized.guestCapacity);
  if (normalized.providerRating)
    next.set("providerRating", normalized.providerRating);
  if (normalized.language) next.set("language", normalized.language);
  if (normalized.reserveNowPayLater) next.set("reserveNowPayLater", "true");
  if (normalized.noPrepayment) next.set("noPrepayment", "true");
  if (normalized.flexibleCancellation) next.set("flexibleCancellation", "true");
  if (normalized.payAtProperty) next.set("payAtProperty", "true");
  if (normalized.confirmationWithin24Hours)
    next.set("confirmationWithin24Hours", "true");
  if (normalized.propertyType) next.set("propertyType", normalized.propertyType);
  if (normalized.accessibility.length)
    next.set("accessibility", normalized.accessibility.join(","));
  if (normalized.neighborhood) next.set("neighborhood", normalized.neighborhood);
  if (normalized.neighborhoodQuery)
    next.set("neighborhoodQuery", normalized.neighborhoodQuery);
  if (normalized.neighborhoodDistance)
    next.set("neighborhoodDistance", normalized.neighborhoodDistance);
  if (normalized.adults) next.set("adults", String(normalized.adults));
  if (normalized.children) next.set("children", String(normalized.children));
  if (normalized.infants) next.set("infants", String(normalized.infants));
  if (normalized.rooms) next.set("rooms", String(normalized.rooms));
  if (normalized.bedrooms) next.set("bedrooms", String(normalized.bedrooms));
  if (normalized.bathrooms) next.set("bathrooms", String(normalized.bathrooms));
  if (normalized.priceUnit !== "ANY") next.set("priceUnit", normalized.priceUnit);
  if (normalized.providerVerifiedOnly) next.set("providerVerifiedOnly", "true");
  if (normalized.providerTopRatedOnly) next.set("providerTopRatedOnly", "true");
  if (normalized.providerPreferredOnly) next.set("providerPreferredOnly", "true");
  if (normalized.providerNewOnly) next.set("providerNewOnly", "true");
  if (normalized.providerInstantResponse)
    next.set("providerInstantResponse", "true");
  if (normalized.providerRespondsWithin24h)
    next.set("providerRespondsWithin24h", "true");
  if (normalized.providerTypes.length)
    next.set("providerTypes", normalized.providerTypes.join(","));
  if (normalized.providerMinReviews)
    next.set("providerMinReviews", normalized.providerMinReviews);
  if (normalized.languages.length) next.set("languages", normalized.languages.join(","));
  if (page > 0) next.set("page", String(page));

  return next;
}

function getAdvancedFilterCount(filters: Partial<FilterState> | undefined) {
  const normalized = normalizeFilters(filters);
  return [
    normalized.availableOnly,
    normalized.instantBooking,
    normalized.freeCancellation,
    normalized.amenities.length,
    normalized.guestCapacity,
    normalized.providerRating,
    normalized.language,
    normalized.reserveNowPayLater,
    normalized.noPrepayment,
    normalized.flexibleCancellation,
    normalized.payAtProperty,
    normalized.confirmationWithin24Hours,
    normalized.propertyType,
    normalized.accessibility.length,
    normalized.neighborhood,
    normalized.neighborhoodQuery,
    normalized.neighborhoodDistance,
    normalized.adults,
    normalized.children,
    normalized.infants,
    normalized.rooms,
    normalized.bedrooms,
    normalized.bathrooms,
    normalized.priceUnit !== "ANY",
    normalized.providerVerifiedOnly,
    normalized.providerTopRatedOnly,
    normalized.providerPreferredOnly,
    normalized.providerNewOnly,
    normalized.providerInstantResponse,
    normalized.providerRespondsWithin24h,
    normalized.providerTypes.length,
    normalized.providerMinReviews,
    normalized.languages.length,
  ].filter(Boolean).length;
}

function getActiveFilterCount(filters: Partial<FilterState> | undefined) {
  const normalized = normalizeFilters(filters);
  return [
    trimmed(normalized.keyword),
    normalized.category,
    trimmed(normalized.city) ||
      (normalized.locationMode === "coordinates" &&
        normalized.latitude &&
        normalized.longitude),
    normalized.minPrice || normalized.maxPrice,
    normalized.rating,
    normalized.sortBy !== "recommended",
    getAdvancedFilterCount(normalized),
  ].filter(Boolean).length;
}

function getActiveFilterChips(filters: Partial<FilterState> | undefined) {
  const normalized = normalizeFilters(filters);
  const chips: Array<{ label: string; clear: Partial<FilterState> }> = [];

  if (trimmed(normalized.keyword))
    chips.push({ label: trimmed(normalized.keyword), clear: { keyword: "" } });
  if (trimmed(normalized.city) || normalized.locationMode === "coordinates")
    chips.push({
      label: formatLocationLabel(normalized),
      clear: clearLocationPatch(),
    });
  if (normalized.category)
    chips.push({
      label: formatCategory(normalized.category),
      clear: { category: "" },
    });
  if (normalized.minPrice || normalized.maxPrice)
    chips.push({
      label: formatPriceLabel(normalized),
      clear: { minPrice: "", maxPrice: "" },
    });
  if (normalized.rating)
    chips.push({ label: `${normalized.rating}+ rating`, clear: { rating: "" } });
  if (normalized.sortBy !== "recommended")
    chips.push({
      label:
        sortOptions.find((option) => option.value === normalized.sortBy)?.label ||
        normalized.sortBy,
      clear: { sortBy: "recommended" },
    });
  if (normalized.availableOnly)
    chips.push({ label: "Available only", clear: { availableOnly: false } });
  if (normalized.instantBooking)
    chips.push({ label: "Instant booking", clear: { instantBooking: false } });
  if (normalized.freeCancellation)
    chips.push({
      label: "Free cancellation",
      clear: { freeCancellation: false },
    });
  if (normalized.reserveNowPayLater)
    chips.push({
      label: "Reserve now, pay later",
      clear: { reserveNowPayLater: false },
    });
  if (normalized.propertyType)
    chips.push({
      label: normalized.propertyType,
      clear: { propertyType: "" },
    });
  if (normalized.guestCapacity)
    chips.push({
      label: `${normalized.guestCapacity}+ guests`,
      clear: { guestCapacity: "" },
    });
  if (normalized.providerRating)
    chips.push({
      label: `${normalized.providerRating}+ provider`,
      clear: { providerRating: "" },
    });
  if (normalized.language)
    chips.push({ label: normalized.language, clear: { language: "" } });
  if (normalized.neighborhood)
    chips.push({
      label: normalized.neighborhood,
      clear: { neighborhood: "" },
    });
  normalized.amenities.forEach((amenity) =>
    chips.push({
      label: amenity,
      clear: {
        amenities: normalized.amenities.filter((item) => item !== amenity),
      },
    }),
  );
  normalized.accessibility.forEach((item) =>
    chips.push({
      label: item,
      clear: {
        accessibility: normalized.accessibility.filter((value) => value !== item),
      },
    }),
  );

  return chips;
}

function clearSingleFilter(
  filters: Partial<FilterState> | undefined,
  clear: Partial<FilterState>,
) {
  return normalizeFilters({ ...normalizeFilters(filters), ...clear });
}

function formatCategory(category: ListingCategory | "") {
  return category
    ? category.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())
    : "All";
}

function HeroBannerSlider() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const slide = heroSlides[index];

  useEffect(() => {
    if (paused) return;

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % heroSlides.length);
    }, 6000);

    return () => window.clearInterval(timer);
  }, [paused]);

  const goTo = (nextIndex: number) => {
    setIndex((nextIndex + heroSlides.length) % heroSlides.length);
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative h-[320px] overflow-hidden rounded-3xl border border-white/70 bg-slate-950 shadow-2xl shadow-blue-200/50 sm:h-[380px] lg:h-[460px] xl:h-[520px]">
      {heroSlides.map((item, itemIndex) => (
        <img
          key={item.title}
          src={item.image}
          alt={item.title}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-all duration-700",
            itemIndex === index
              ? "scale-100 opacity-100"
              : "scale-105 opacity-0",
          )}
        />
      ))}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.55)_0%,rgba(15,23,42,0.28)_35%,rgba(15,23,42,0.05)_60%,transparent_75%)]" />

      <div className="relative z-10 flex h-full flex-col justify-between p-5 text-white sm:p-7 lg:p-8 xl:p-10">
        <div className="max-w-[33rem]">
          <span className="inline-flex rounded-full bg-blue-600 px-5 py-2.5 text-sm font-black shadow-lg shadow-blue-900/30">
            {slide.badge}
          </span>
          <h2 className="mt-6 text-3xl font-black leading-tight tracking-tight sm:text-4xl xl:text-[3.05rem]">
            {slide.title}
          </h2>
          <p className="mt-4 max-w-lg text-lg font-bold leading-8 text-blue-50 xl:text-2xl xl:leading-10">
            {slide.subtitle}
          </p>
        </div>

        <Button className="absolute bottom-16 left-5 inline-flex items-center justify-center gap-4 rounded-2xl bg-white px-7 py-4 text-base font-semibold tracking-[-0.01em] text-blue-600 shadow-lg shadow-slate-900/10 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-xl sm:bottom-7 sm:left-7 sm:px-8 sm:py-5 lg:bottom-10 lg:left-10 xl:bottom-12 xl:left-12">
          Explore now
          <ArrowRight className="h-5 w-5" strokeWidth={2.1} />
        </Button>

        <div className="flex items-end justify-between gap-4">
          <div className="flex flex-1 justify-center gap-2 md:justify-start md:pl-[32%]">
            {heroSlides.map((item, itemIndex) => (
              <button
                key={item.title}
                type="button"
                onClick={() => goTo(itemIndex)}
                className={cn(
                  "h-3 rounded-full transition-all",
                  itemIndex === index
                    ? "w-9 bg-blue-500"
                    : "w-3 bg-white/70 hover:bg-white",
                )}
                aria-label={`View banner ${itemIndex + 1}`}
              />
            ))}
          </div>

          <div className="hidden items-center gap-3 rounded-3xl bg-slate-950/35 p-3 backdrop-blur md:flex">
            {heroSlides.map((item, itemIndex) => (
              <button
                key={item.title}
                type="button"
                onClick={() => goTo(itemIndex)}
                className={cn(
                  "h-16 w-24 overflow-hidden rounded-2xl border transition-all xl:h-[72px] xl:w-28",
                  itemIndex === index
                    ? "border-cyan-300 shadow-lg shadow-cyan-500/20"
                    : "border-white/20 opacity-80 hover:opacity-100",
                )}
              >
                <img
                  src={item.image}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
            <span className="flex h-16 min-w-16 items-center justify-center rounded-2xl bg-slate-950/60 px-4 text-lg font-black xl:h-[72px] xl:min-w-20">
              {index + 1} / {heroSlides.length}
            </span>
          </div>
        </div>
      </div>
      </div>

      <button
        type="button"
        onClick={() => goTo(index - 1)}
        className="absolute left-0 top-1/2 z-20 hidden h-9 w-9 -translate-x-[35%] -translate-y-1/2 items-center justify-center rounded-full border border-slate-200/70 bg-white/95 text-blue-600 shadow-md backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:bg-white hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:flex"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-4 w-4" strokeWidth={2.25} />
      </button>
      <button
        type="button"
        onClick={() => goTo(index + 1)}
        className="absolute right-0 top-1/2 z-20 hidden h-9 w-9 -translate-y-1/2 translate-x-[35%] items-center justify-center rounded-full border border-slate-200/70 bg-white/95 text-blue-600 shadow-md backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:bg-white hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:flex"
        aria-label="Next slide"
      >
        <ChevronRight className="h-4 w-4" strokeWidth={2.25} />
      </button>
    </div>
  );
}

function HeroSection() {
  const trustCards = [
    {
      title: "Verified providers",
      subtitle: "Trusted local partners",
      icon: BadgeCheck,
    },
    {
      title: "Secure booking",
      subtitle: "Protected payments",
      icon: ShieldCheck,
    },
    {
      title: "AI recommended",
      subtitle: "Personalized suggestions",
      icon: Sparkles,
    },
  ] as const;
  const stats = [
    { value: "20K+", label: "Listings", icon: Hotel, color: "bg-blue-50 text-blue-600" },
    { value: "5", label: "Categories", icon: Grid2X2, color: "bg-emerald-50 text-emerald-600" },
    { value: "24/7", label: "Support", icon: ShieldCheck, color: "bg-violet-50 text-violet-600" },
  ] as const;

  return (
    <section className="relative overflow-hidden rounded-[32px] border border-blue-100/80 bg-gradient-to-br from-white via-blue-50/40 to-white px-5 py-8 shadow-sm sm:px-7 lg:grid lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-10 lg:px-8 lg:py-10 xl:gap-12 xl:px-10 xl:py-12">
      <div className="relative max-w-2xl">
        <div className="pointer-events-none absolute -right-8 top-8 hidden text-blue-300/50 lg:block xl:-right-14">
          <div className="h-36 w-28 rounded-full border-r-2 border-dashed border-blue-200/80" />
          <Plane className="absolute -right-2 -top-3 h-10 w-10 rotate-[-18deg]" />
          <Sparkles className="absolute -left-5 top-20 h-5 w-5" />
        </div>

        <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-gradient-to-r from-blue-50 to-cyan-50 px-5 py-2 text-sm font-black text-blue-700 shadow-sm shadow-blue-100/60">
          <Sparkles className="h-4 w-4" />
          AI Travel Marketplace
        </span>
        <h1 className="mt-7 text-4xl font-black leading-[1.02] tracking-tight text-slate-950 sm:text-5xl xl:text-[4rem] 2xl:text-[4.25rem]">
          Find your next{" "}
          <span className="relative inline-block bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
            travel experience
            <span className="absolute -bottom-1.5 left-1 h-2.5 w-11/12 rounded-full bg-blue-100/80" />
          </span>
        </h1>
        <p className="mt-5 max-w-xl text-base font-semibold leading-8 text-slate-600 sm:text-lg xl:text-xl xl:leading-9">
          Discover trusted stays, tours, restaurants, vehicles, and local
          experiences — all in one intelligent travel marketplace.
        </p>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Button className="h-14 rounded-2xl bg-blue-600 px-7 text-base font-black text-white shadow-lg shadow-blue-500/25 transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-500/30">
            <Search className="mr-3 h-5 w-5" />
            Start exploring
            <ArrowRight className="ml-3 h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            className="h-14 rounded-2xl border-blue-100 bg-white px-7 text-base font-black text-blue-700 shadow-sm shadow-blue-100/50 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50"
          >
            <Sparkles className="mr-3 h-5 w-5" />
            Plan with AI
            <ArrowRight className="ml-3 h-5 w-5" />
          </Button>
        </div>

        <div className="mt-7 grid overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-lg shadow-blue-100/40 sm:grid-cols-3">
          {trustCards.map(({ title, subtitle, icon: Icon }, index) => (
            <div
              key={title}
              className={cn(
                "flex min-w-0 items-center gap-3 p-4 xl:p-5",
                index > 0 && "border-t border-slate-100 sm:border-l sm:border-t-0",
              )}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-black text-slate-950">
                  {title}
                </span>
                <span className="mt-1 block text-xs font-semibold leading-5 text-slate-500">
                  {subtitle}
                </span>
              </span>
            </div>
          ))}
        </div>

        <div className="mt-3 grid overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-md shadow-blue-100/30 sm:grid-cols-3">
          {stats.map(({ value, label, icon: Icon, color }, index) => (
            <div
              key={label}
              className={cn(
                "flex items-center gap-3 p-4 xl:p-5",
                index > 0 && "border-t border-slate-100 sm:border-l sm:border-t-0",
              )}
            >
              <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl", color)}>
                <Icon className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-xl font-black leading-none text-blue-700">
                  {value}
                </span>
                <span className="mt-1 block text-xs font-semibold text-slate-500">
                  {label}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-8 min-w-0 lg:mt-0">
        <HeroBannerSlider />
      </div>
    </section>
  );
}

function formatPriceLabel(filters: FilterState) {
  if (!filters.minPrice && !filters.maxPrice) return "Any price";
  if (filters.minPrice && !filters.maxPrice) return `$${filters.minPrice}+`;
  if (!filters.minPrice && filters.maxPrice) return `Under $${filters.maxPrice}`;
  return `$${filters.minPrice}–$${filters.maxPrice}`;
}

function formatLocationLabel(filters: Pick<FilterState, "city" | "locationLabel" | "locationMode">) {
  if (filters.locationMode === "coordinates") {
    return filters.locationLabel || "Current location";
  }
  return filters.locationLabel || filters.city || "Anywhere";
}

type LocationSuggestion = {
  id: string;
  label: string;
  secondary: string;
  query: string;
  type: string;
};

function normalizeLocationText(value?: string) {
  return (value || "").trim().replace(/\s+/g, " ");
}

function buildLocationSuggestions(listings: ListingResponse[], query: string): LocationSuggestion[] {
  const normalizedQuery = query.trim().toLowerCase();
  const seen = new Set<string>();

  return listings
    .flatMap((listing) => {
      const city = normalizeLocationText(listing.city);
      const country = normalizeLocationText(listing.country);
      const address = normalizeLocationText(listing.address);
      const cityKey = `${city}|${country}`.toLowerCase();
      const addressKey = `${address}|${city}|${country}`.toLowerCase();
      const suggestions: LocationSuggestion[] = [];

      if (city && !seen.has(cityKey)) {
        seen.add(cityKey);
        suggestions.push({
          id: cityKey,
          label: city,
          secondary: country ? `City · ${country}` : "City",
          query: city,
          type: "City",
        });
      }

      if (
        address &&
        address.length <= 80 &&
        !seen.has(addressKey) &&
        (!normalizedQuery || address.toLowerCase().includes(normalizedQuery))
      ) {
        seen.add(addressKey);
        suggestions.push({
          id: addressKey,
          label: address,
          secondary: [city, country].filter(Boolean).join(", ") || "Destination",
          query: city || address,
          type: "Destination",
        });
      }

      return suggestions;
    })
    .filter((item) => {
      if (!normalizedQuery) return true;
      return (
        item.label.toLowerCase().includes(normalizedQuery) ||
        item.secondary.toLowerCase().includes(normalizedQuery)
      );
    })
    .slice(0, 8);
}

function clearLocationPatch(): Partial<FilterState> {
  return {
    city: "",
    locationMode: "",
    locationLabel: "",
    latitude: "",
    longitude: "",
    radiusKm: "50",
  };
}

const shortcutStyles: Record<string, string> = {
  All: "bg-blue-50 text-blue-600",
  Hotel: "bg-violet-50 text-violet-600",
  Tour: "bg-cyan-50 text-cyan-600",
  Experience: "bg-emerald-50 text-emerald-600",
  Restaurant: "bg-orange-50 text-orange-500",
  Vehicle: "bg-blue-50 text-blue-600",
};

function FriendlySearchField({
  value,
  onChange,
  onApply,
  compact = false,
}: {
  value: string;
  onChange: (value: string) => void;
  onApply: () => void;
  compact?: boolean;
}) {
  return (
    <label className="relative flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm transition-all focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100 hover:border-blue-200">
      <Search className="h-5 w-5 shrink-0 text-slate-500" />
      <span className="pointer-events-none absolute left-12 top-1/2 -translate-y-1/2">
        {!value && (
          <span className="block">
            <span className="block text-sm font-black leading-5 text-slate-700">
              Where do you want to go?
            </span>
            {!compact && (
              <span className="block text-xs font-semibold leading-4 text-slate-500">
                Hotels, tours, restaurants...
              </span>
            )}
          </span>
        )}
      </span>
      <Input
        className={cn(
          "h-[62px] min-w-0 border-0 bg-transparent p-0 text-sm font-bold text-slate-900 shadow-none outline-none focus:ring-0",
          !value && "text-transparent caret-blue-600",
          compact && "h-[58px]",
        )}
        aria-label="Search destination"
        value={value}
        placeholder=""
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") onApply();
        }}
      />
    </label>
  );
}

function FilterMiniCard({
  icon: Icon,
  label,
  value,
  colorClass,
  children,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  colorClass: string;
  children: React.ReactNode;
}) {
  return (
    <label className="relative flex h-[62px] min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3.5 text-left transition-all hover:border-blue-200 hover:shadow-sm focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100">
      <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", colorClass)}>
        <Icon className="h-5 w-5" />
      </span>
      <span className="sr-only">{label}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-black text-slate-500">{label}</span>
        <span className="block truncate text-sm font-black text-slate-900" title={value}>
          {value}
        </span>
      </span>
      <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
      {children}
    </label>
  );
}

function LocationPicker({
  filters,
  onChange,
}: {
  filters: FilterState;
  onChange: (next: Partial<FilterState>) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(filters.city || "");
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [geoStatus, setGeoStatus] = useState<
    "idle" | "requesting" | "success" | "denied" | "unavailable" | "error"
  >("idle");
  const [geoMessage, setGeoMessage] = useState("");
  const [popoverPosition, setPopoverPosition] = useState({
    left: 0,
    top: 0,
    width: 420,
    maxHeight: 560,
  });
  const [isDesktopPopover, setIsDesktopPopover] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [query]);

  useEffect(() => {
    if (open) {
      setQuery(filters.locationMode === "text" ? filters.city : "");
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [filters.city, filters.locationMode, open]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (
        !rootRef.current?.contains(target) &&
        !dropdownRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const updatePopoverPosition = () => {
      const trigger = rootRef.current;
      if (!trigger) return;
      const isDesktop = window.matchMedia("(min-width: 768px)").matches;
      setIsDesktopPopover(isDesktop);
      if (!isDesktop) return;

      const rect = trigger.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const gap = 10;
      const collisionPadding = 16;
      const desiredWidth = Math.min(420, viewportWidth - collisionPadding * 2);
      const left = Math.min(
        Math.max(rect.left, collisionPadding),
        viewportWidth - desiredWidth - collisionPadding,
      );
      const spaceBelow = viewportHeight - rect.bottom - collisionPadding - gap;
      const spaceAbove = rect.top - collisionPadding - gap;
      const openAbove = spaceBelow < 360 && spaceAbove > spaceBelow;
      const maxHeight = Math.max(
        280,
        Math.min(560, openAbove ? spaceAbove : spaceBelow),
      );
      const top = openAbove
        ? Math.max(collisionPadding, rect.top - gap - maxHeight)
        : rect.bottom + gap;

      setPopoverPosition({ left, top, width: desiredWidth, maxHeight });
    };

    updatePopoverPosition();
    window.addEventListener("resize", updatePopoverPosition);
    window.addEventListener("scroll", updatePopoverPosition, true);

    return () => {
      window.removeEventListener("resize", updatePopoverPosition);
      window.removeEventListener("scroll", updatePopoverPosition, true);
    };
  }, [open]);

  const locationQuery = useQuery({
    queryKey: ["explore-location-suggestions", debouncedQuery],
    queryFn: async () => {
      const response = await listingService.searchListings({
        keyword: debouncedQuery || undefined,
        status: "ACTIVE",
        page: 0,
        size: 20,
      });
      return response.data.content;
    },
    enabled: open,
    staleTime: 60_000,
  });

  const suggestions = useMemo(
    () => buildLocationSuggestions(locationQuery.data || [], debouncedQuery),
    [debouncedQuery, locationQuery.data],
  );

  useEffect(() => {
    setHighlightedIndex(0);
  }, [debouncedQuery, suggestions.length]);

  const selectedLabel = formatLocationLabel(filters);
  const hasCoordinateLocation =
    filters.locationMode === "coordinates" && filters.latitude && filters.longitude;

  const selectSuggestion = (suggestion: LocationSuggestion) => {
    onChange({
      city: suggestion.query,
      locationMode: "text",
      locationLabel: suggestion.secondary
        ? `${suggestion.label}, ${suggestion.secondary.replace(/^City ·\s*/, "")}`
        : suggestion.label,
      latitude: "",
      longitude: "",
    });
    setQuery(suggestion.query);
    setOpen(false);
  };

  const useCurrentLocation = () => {
    if (!("geolocation" in navigator)) {
      setGeoStatus("unavailable");
      setGeoMessage("Location is not supported by this browser.");
      return;
    }

    setGeoStatus("requesting");
    setGeoMessage("Detecting your location...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = String(position.coords.latitude);
        const longitude = String(position.coords.longitude);
        onChange({
          ...clearLocationPatch(),
          locationMode: "coordinates",
          locationLabel: "Current location",
          latitude,
          longitude,
        });
        setGeoStatus("success");
        setGeoMessage("Current location selected.");
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setGeoStatus("denied");
          setGeoMessage("Permission denied. You can still search by destination.");
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setGeoStatus("unavailable");
          setGeoMessage("Location is unavailable right now.");
        } else {
          setGeoStatus("error");
          setGeoMessage("We could not detect your location. Please try again.");
        }
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 },
    );
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((index) => Math.min(index + 1, suggestions.length - 1));
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((index) => Math.max(index - 1, 0));
    }
    if (event.key === "Enter" && suggestions[highlightedIndex]) {
      event.preventDefault();
      selectSuggestion(suggestions[highlightedIndex]);
    }
  };

  return (
    <div ref={rootRef} className="relative min-w-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "flex h-[62px] w-full min-w-0 items-center gap-3 rounded-2xl border bg-white px-3.5 text-left transition-all hover:border-blue-200 hover:shadow-sm focus-visible:border-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-100",
          filters.locationMode ? "border-blue-200 bg-blue-50/30" : "border-slate-200",
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
          {hasCoordinateLocation ? <Navigation className="h-5 w-5" /> : <MapPin className="h-5 w-5" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-black text-slate-500">Location</span>
          <span className="block truncate text-sm font-black text-slate-900" title={selectedLabel}>
            {selectedLabel}
          </span>
        </span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-slate-400 transition", open && "rotate-180")} />
      </button>

      {open && typeof document !== "undefined" && createPortal(
        <div
          ref={dropdownRef}
          className="fixed inset-x-3 bottom-3 z-[60] max-h-[calc(100vh-96px)] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.24)] md:inset-auto md:bottom-auto md:rounded-[24px]"
          style={
            isDesktopPopover
              ? {
                  left: popoverPosition.left,
                  top: popoverPosition.top,
                  width: popoverPosition.width,
                  maxHeight: popoverPosition.maxHeight,
                }
              : undefined
          }
        >
          <div className="flex justify-center pt-2 md:hidden">
            <span className="h-1 w-12 rounded-full bg-slate-200" />
          </div>
          <div className="border-b border-slate-100 p-4">
            <label className="flex h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-3 focus-within:border-blue-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100">
              <Search className="h-5 w-5 shrink-0 text-slate-500" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="Search city, region, or destination"
                role="combobox"
                aria-expanded={open}
                aria-controls="explore-location-results"
                className="h-full min-w-0 flex-1 bg-transparent text-sm font-bold text-slate-900 outline-none placeholder:text-slate-400"
              />
            </label>
          </div>

          <div className="max-h-[430px] overflow-y-auto p-3">
            <button
              type="button"
              onClick={useCurrentLocation}
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition hover:border-cyan-200 hover:bg-cyan-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                hasCoordinateLocation ? "border-blue-200 bg-blue-50" : "border-slate-100 bg-white",
              )}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600">
                {geoStatus === "requesting" ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Navigation className="h-5 w-5" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-black text-slate-900">
                  {geoStatus === "requesting" ? "Detecting your location..." : "Use my current location"}
                </span>
                <span className="block text-xs font-semibold text-slate-500">
                  {geoMessage || "Find nearby stays and experiences"}
                </span>
              </span>
              {hasCoordinateLocation && <Check className="h-5 w-5 shrink-0 text-blue-600" />}
            </button>

            <div className="my-3 border-t border-slate-100" />

            <div className="mb-2 px-1 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
              {debouncedQuery ? "Search results" : "Suggested destinations"}
            </div>

            <div id="explore-location-results" role="listbox" className="space-y-1">
              {locationQuery.isLoading &&
                [0, 1, 2].map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-2xl p-3">
                    <span className="h-10 w-10 rounded-2xl bg-slate-100" />
                    <span className="flex-1 space-y-2">
                      <span className="block h-3 w-32 rounded-full bg-slate-100" />
                      <span className="block h-3 w-44 rounded-full bg-slate-100" />
                    </span>
                  </div>
                ))}

              {!locationQuery.isLoading &&
                suggestions.map((suggestion, index) => {
                  const selected =
                    filters.locationMode === "text" &&
                    filters.city.toLowerCase() === suggestion.query.toLowerCase();
                  return (
                    <button
                      key={suggestion.id}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      onClick={() => selectSuggestion(suggestion)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-2xl p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                        selected
                          ? "bg-blue-50 text-blue-700"
                          : highlightedIndex === index
                            ? "bg-slate-50 text-slate-950"
                            : "text-slate-800 hover:bg-slate-50",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl",
                          selected ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500",
                        )}
                      >
                        <MapPin className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-black">{suggestion.label}</span>
                        <span className="block truncate text-xs font-semibold text-slate-500">
                          {suggestion.secondary}
                        </span>
                      </span>
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black uppercase text-slate-500">
                        {suggestion.type}
                      </span>
                      {selected && <Check className="h-4 w-4 text-blue-600" />}
                    </button>
                  );
                })}

              {!locationQuery.isLoading && !suggestions.length && (
                <div className="rounded-2xl border border-dashed border-slate-200 p-5 text-center">
                  <MapPin className="mx-auto h-7 w-7 text-slate-400" />
                  <p className="mt-2 text-sm font-black text-slate-900">No locations found</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    Try another city, region, or destination.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}

function ExploreFilterBar({
  filters,
  appliedFilters,
  activeCount,
  advancedCount,
  onChange,
  onApply,
  onClear,
  onRemoveApplied,
  onOpenMore,
}: {
  filters: FilterState;
  appliedFilters: FilterState;
  activeCount: number;
  advancedCount: number;
  onChange: (next: Partial<FilterState>) => void;
  onApply: () => void;
  onClear: () => void;
  onRemoveApplied: (next: Partial<FilterState>) => void;
  onOpenMore: () => void;
}) {
  return (
    <section className="relative z-10 hidden overflow-hidden rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-[0_12px_36px_rgba(15,23,42,0.07)] md:block">
      <div className="grid items-stretch gap-3 xl:grid-cols-[minmax(250px,1.45fr)_minmax(130px,.72fr)_minmax(190px,1fr)_minmax(130px,.7fr)_minmax(120px,.65fr)_minmax(170px,.9fr)_auto_auto]">
        <div className="min-w-0 md:col-span-2 xl:col-span-1">
          <FriendlySearchField value={filters.keyword} onChange={(keyword) => onChange({ keyword })} onApply={onApply} />
        </div>

        <FilterMiniCard
          icon={Grid2X2}
          label="Category"
          value={formatCategory(filters.category)}
          colorClass="bg-violet-50 text-violet-600"
        >
          <select
            className="absolute inset-0 cursor-pointer opacity-0"
            value={filters.category}
            onChange={(event) =>
              onChange({ category: event.target.value as ListingCategory | "" })
            }
          >
            {categoryOptions.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FilterMiniCard>

        <LocationPicker filters={filters} onChange={onChange} />

        <FilterMiniCard icon={Tags} label="Price" value={formatPriceLabel(filters)} colorClass="bg-orange-50 text-orange-500">
          <select
            className="absolute inset-0 cursor-pointer opacity-0"
            value={`${filters.minPrice}|${filters.maxPrice}`}
            onChange={(event) => {
              const [minPrice, maxPrice] = event.target.value.split("|");
              onChange({ minPrice, maxPrice });
            }}
          >
            {priceOptions.map((option) => (
              <option
                key={option.label}
                value={`${option.minPrice}|${option.maxPrice}`}
              >
                {option.label}
              </option>
            ))}
          </select>
        </FilterMiniCard>

        <FilterMiniCard
          icon={Star}
          label="Rating"
          value={filters.rating ? `${filters.rating}+` : "Any"}
          colorClass="bg-amber-50 text-amber-500"
        >
          <select
            className="absolute inset-0 cursor-pointer opacity-0"
            value={filters.rating}
            onChange={(event) =>
              onChange({ rating: event.target.value as RatingFilter })
            }
          >
            {ratingOptions.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FilterMiniCard>

        <FilterMiniCard
          icon={SlidersHorizontal}
          label="Sort by"
          value={
            sortOptions.find((option) => option.value === filters.sortBy)
              ?.label || "Recommended"
          }
          colorClass="bg-blue-50 text-blue-600"
        >
          <select
            className="absolute inset-0 cursor-pointer opacity-0"
            value={filters.sortBy}
            onChange={(event) => onChange({ sortBy: event.target.value })}
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FilterMiniCard>

        <Button
          className="flex h-[62px] items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 font-bold text-white shadow-[0_8px_18px_rgba(37,99,235,0.22)] transition hover:bg-blue-700"
          onClick={() => onApply()}
        >
          Apply filters
          {activeCount > 0 && (
            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-white px-2 text-xs font-black text-blue-700">
              {activeCount}
            </span>
          )}
        </Button>
        <Button
          variant="outline"
          className="h-[52px] self-center rounded-xl border-slate-200 bg-white px-4 text-slate-600 hover:bg-slate-50 hover:text-blue-700"
          onClick={onClear}
          aria-label="Reset filters"
          title="Reset filters"
        >
          <RefreshCcw className="h-5 w-5" />
        </Button>
      </div>

      <div className="mt-4 flex flex-wrap gap-3 border-t border-slate-100 pt-4">
        {categoryOptions.map((option) => (
          <button
            key={option.label}
            type="button"
            onClick={() => onChange({ category: option.value })}
            className={cn(
              "flex h-12 shrink-0 items-center gap-2.5 rounded-2xl border px-4 text-sm font-semibold transition-all hover:border-blue-200 hover:bg-slate-50",
              filters.category === option.value
                ? "border-blue-200 bg-blue-50/80 text-blue-700 shadow-sm"
                : "border-slate-200 bg-white text-slate-700",
            )}
          >
            <span className={cn("flex h-8 w-8 items-center justify-center rounded-xl", shortcutStyles[option.label] || "bg-blue-50 text-blue-600")}>
              <option.icon className="h-4 w-4" />
            </span>
            {option.label}
          </button>
        ))}
        <button
          type="button"
          onClick={onOpenMore}
          className="relative flex h-12 shrink-0 items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-all hover:border-blue-200 hover:bg-slate-50 hover:text-blue-700"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 text-slate-600">
            <SlidersHorizontal className="h-4 w-4" />
          </span>
          More filters
          {advancedCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] text-white">
              {advancedCount}
            </span>
          )}
        </button>
      </div>

      <ActiveFilterChips filters={appliedFilters} onRemove={onRemoveApplied} onClear={onClear} embedded />
    </section>
  );
}

function MobileExploreFilterBar({
  filters,
  appliedFilters,
  advancedCount,
  onChange,
  onApply,
  onClear,
  onRemoveApplied,
  onOpenMore,
}: {
  filters: FilterState;
  appliedFilters: FilterState;
  advancedCount: number;
  onChange: (next: Partial<FilterState>) => void;
  onApply: () => void;
  onClear: () => void;
  onRemoveApplied: (next: Partial<FilterState>) => void;
  onOpenMore: () => void;
}) {
  return (
    <section className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white p-3 shadow-[0_12px_36px_rgba(15,23,42,0.07)] md:hidden">
      <div className="grid grid-cols-2 gap-2 min-[420px]:grid-cols-[minmax(0,1fr)_auto_auto]">
        <div className="col-span-2 min-w-0 min-[420px]:col-span-1">
          <FriendlySearchField compact value={filters.keyword} onChange={(keyword) => onChange({ keyword })} onApply={onApply} />
        </div>
        <Button
          variant="outline"
          className="relative h-[58px] rounded-2xl bg-white px-3 font-black text-slate-800"
          onClick={onOpenMore}
        >
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          Filters
          {advancedCount > 0 && (
            <span className="ml-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-black text-white">
              {advancedCount}
            </span>
          )}
        </Button>

        <label className="relative flex h-[58px] items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-700">
          <SlidersHorizontal className="h-4 w-4 text-blue-600" />
          <span className="grid text-left">
            <span className="text-[10px] text-slate-500">Sort</span>
            <span className="max-w-24 truncate text-xs">
              {sortOptions.find((option) => option.value === filters.sortBy)?.label || "Recommended"}
            </span>
          </span>
          <select
            className="absolute inset-0 cursor-pointer opacity-0"
            value={filters.sortBy}
            onChange={(event) => onChange({ sortBy: event.target.value })}
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="mt-2">
        <LocationPicker filters={filters} onChange={onChange} />
      </div>

      <ActiveFilterChips filters={appliedFilters} onRemove={onRemoveApplied} onClear={onClear} embedded mobile />
    </section>
  );
}

function ActiveFilterChips({
  filters,
  onRemove,
  onClear,
  embedded = false,
  mobile = false,
}: {
  filters: FilterState;
  onRemove: (next: Partial<FilterState>) => void;
  onClear: () => void;
  embedded?: boolean;
  mobile?: boolean;
}) {
  const chips = getActiveFilterChips(filters);

  if (!chips.length) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-2",
        embedded
          ? "mt-4 border-t border-slate-100 pt-4"
          : "mb-5 flex-wrap",
        mobile ? "overflow-x-auto whitespace-nowrap pb-1" : "flex-wrap",
      )}
    >
      <span className="shrink-0 text-sm font-black text-slate-600">Active filters:</span>
      {chips.map((chip) => (
        <button
          key={chip.label}
          type="button"
          onClick={() => onRemove(chip.clear)}
          className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full bg-blue-50 px-3.5 text-sm font-bold text-blue-700 transition-all hover:bg-blue-100"
        >
          {chip.label}
          <X className="h-3.5 w-3.5" />
        </button>
      ))}
      <button
        type="button"
        onClick={onClear}
        className="h-9 shrink-0 px-3 text-sm font-black text-blue-700 hover:text-blue-800"
      >
        Clear all
      </button>
    </div>
  );
}

function MoreFiltersModal({
  open,
  filters: rawFilters,
  onClose,
  onChange,
  onApply,
  onClear,
}: {
  open: boolean;
  filters: FilterState;
  onClose: () => void;
  onChange: (next: Partial<FilterState>) => void;
  onApply: () => void;
  onClear: () => void;
}) {
  const [activeSection, setActiveSection] = useState("amenities");
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const filters = normalizeFilters(rawFilters);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  if (!open) return null;

  const selectedCount = getActiveFilterCount(filters);
  const bookingPolicyCount = [
    filters.instantBooking,
    filters.freeCancellation,
    filters.reserveNowPayLater,
    filters.noPrepayment,
    filters.flexibleCancellation,
    filters.payAtProperty,
    filters.confirmationWithin24Hours,
  ].filter(Boolean).length;
  const guestRoomCount = [
    filters.guestCapacity,
    filters.adults,
    filters.children,
    filters.infants,
    filters.rooms,
    filters.bedrooms,
    filters.bathrooms,
  ].filter(Boolean).length;
  const providerCount = [
    filters.providerRating,
    filters.providerVerifiedOnly,
    filters.providerTopRatedOnly,
    filters.providerPreferredOnly,
    filters.providerNewOnly,
    filters.providerInstantResponse,
    filters.providerRespondsWithin24h,
    filters.providerTypes.length,
    filters.providerMinReviews,
  ].filter(Boolean).length;
  const languageCount = [filters.language, filters.languages.length].filter(Boolean).length;
  const neighborhoodCount = [
    filters.neighborhood,
    filters.neighborhoodQuery,
    filters.neighborhoodDistance,
  ].filter(Boolean).length;

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    sectionRefs.current[sectionId]?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const toggleArrayFilter = (
    key: "amenities" | "accessibility",
    label: string,
  ) => {
    const current = filters[key];
    const exists = current.includes(label);
    onChange({
      [key]: exists
        ? current.filter((item) => item !== label)
        : [...current, label],
    });
  };

  const ToggleCard = ({
    active,
    icon: Icon,
    label,
    onClick,
  }: {
    active: boolean;
    icon: React.ElementType;
    label: string;
    onClick: () => void;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-[54px] items-center gap-3 rounded-xl border px-4 text-left text-sm font-black transition-all duration-200",
        active
          ? "border-blue-300 bg-blue-50 text-slate-950 shadow-sm shadow-blue-100"
          : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50/40",
      )}
    >
      <span
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
          active
            ? "border-blue-600 bg-blue-600 text-white"
            : "border-slate-300 bg-white text-transparent",
        )}
      >
        <Check className="h-3.5 w-3.5" />
      </span>
      <Icon className={cn("h-5 w-5 shrink-0", active ? "text-blue-600" : "text-slate-500")} />
      <span className="min-w-0 leading-snug">{label}</span>
    </button>
  );

  const CounterStepper = ({
    label,
    value,
    onChangeValue,
  }: {
    label: string;
    value: number;
    onChangeValue: (value: number) => void;
  }) => (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <span className="text-sm font-black text-slate-800">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChangeValue(Math.max(0, value - 1))}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-blue-200 hover:text-blue-700 disabled:opacity-40"
          disabled={value <= 0}
          aria-label={`Decrease ${label}`}
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-6 text-center text-sm font-black text-slate-950">{value}</span>
        <button
          type="button"
          onClick={() => onChangeValue(value + 1)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-blue-200 hover:text-blue-700"
          aria-label={`Increase ${label}`}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  const sideGroups = [
    { id: "amenities", label: "Amenities", icon: Grid2X2, count: filters.amenities.length },
    { id: "booking", label: "Booking & policies", icon: ShieldCheck, count: bookingPolicyCount },
    {
      id: "price",
      label: "Price & budget",
      icon: Tags,
      count: filters.minPrice || filters.maxPrice || filters.priceUnit !== "ANY" ? 1 : 0,
    },
    { id: "guests", label: "Guest & rooms", icon: Users, count: guestRoomCount },
    { id: "provider", label: "Provider", icon: Star, count: providerCount },
    { id: "languages", label: "Languages", icon: Globe2, count: languageCount },
    { id: "accessibility", label: "Accessibility", icon: Sparkles, count: filters.accessibility.length },
    { id: "neighborhood", label: "Neighborhood", icon: MapPin, count: neighborhoodCount },
  ];

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[3px] sm:p-5"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label="More filters"
        className="flex h-[94vh] w-full max-w-[1440px] flex-col overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.28)] sm:h-[88vh] lg:w-[94vw]"
      >
        <div className="flex items-center justify-center py-3 lg:hidden">
          <span className="h-1.5 w-14 rounded-full bg-slate-300" />
        </div>
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 py-4 lg:px-8 lg:py-5">
          <div>
            <h2 className="text-2xl font-black leading-tight text-slate-950 lg:text-[28px]">More filters</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500 lg:text-base">
              Refine your search to find the perfect experience
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="hidden h-11 rounded-xl bg-white px-5 font-black text-blue-700 lg:inline-flex"
              onClick={onClear}
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Reset all
            </Button>
            <span className="hidden h-9 w-px bg-slate-200 lg:block" />
            <button
              type="button"
              onClick={onClose}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200 lg:bg-white"
              aria-label="Close filters"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="hidden min-h-0 overflow-y-auto border-r border-slate-200 bg-white p-5 lg:block">
            <div className="space-y-2">
              {sideGroups.map((group, index) => (
                <button
                  key={group.label}
                  type="button"
                  onClick={() => scrollToSection(group.id)}
                  className={cn(
                    "flex h-[58px] w-full items-center gap-4 rounded-2xl border px-4 text-left text-base font-black transition-all",
                    activeSection === group.id || (index === 0 && activeSection === "amenities")
                      ? "border-blue-100 bg-blue-50 text-blue-700 shadow-sm"
                      : "border-transparent text-slate-600 hover:bg-white hover:text-blue-700",
                  )}
                >
                  <group.icon className="h-5 w-5 shrink-0" />
                  <span className="min-w-0 flex-1 truncate">{group.label}</span>
                  <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-slate-100 px-2 text-sm text-slate-600">
                    {group.count}
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-7 rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm">
              <Sparkles className="h-6 w-6 text-blue-600" />
              <h3 className="mt-4 text-lg font-black text-blue-700">Tip</h3>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                Use more filters to get better recommendations and more accurate results.
              </p>
            </div>
          </aside>

          <div className="flex min-h-0 flex-col overflow-hidden">
            <div className="sticky top-0 z-10 flex gap-2 overflow-x-auto border-b border-slate-100 bg-white px-5 py-3 lg:hidden">
              {sideGroups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => scrollToSection(group.id)}
                  className={cn(
                    "flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-black",
                    activeSection === group.id
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-white text-slate-600",
                  )}
                >
                  {group.label}
                  {group.count > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] text-white">
                      {group.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-5 lg:p-8">
            <div className="space-y-6">
              <section ref={(node) => { sectionRefs.current.amenities = node; }}>
                <h3 className="text-xl font-black text-slate-950">Amenities</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {(showAllAmenities ? [...amenities, ...extraAmenities] : amenities).map((item) => (
                    <ToggleCard
                      key={item.label}
                      icon={item.icon}
                      label={item.label}
                      active={filters.amenities.includes(item.label)}
                      onClick={() => toggleArrayFilter("amenities", item.label)}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setShowAllAmenities((value) => !value)}
                  className="mt-4 inline-flex h-11 items-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-blue-700 transition hover:border-blue-200 hover:bg-blue-50"
                >
                  {showAllAmenities ? "Show less" : "Show more"}
                  <ChevronDown className={cn("ml-2 h-4 w-4 transition", showAllAmenities && "rotate-180")} />
                </button>
              </section>

              <section ref={(node) => { sectionRefs.current.booking = node; }} className="border-t border-slate-200 pt-6">
                <h3 className="text-xl font-black text-slate-950">Booking & policies</h3>
                <div className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-4">
                  {bookingPolicyOptions.map((option) => {
                      const active = filters[option.key];
                      return (
                        <ToggleCard
                          key={option.key}
                          icon={option.icon}
                          label={option.label}
                          active={active}
                          onClick={() => onChange({ [option.key]: !active })}
                        />
                      );
                    })}
                </div>
              </section>

              <section ref={(node) => { sectionRefs.current.price = node; }} className="grid gap-6 border-t border-slate-200 pt-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                <div>
                  <h3 className="text-xl font-black text-slate-950">
                    Price range <span className="text-base font-semibold text-slate-500">(per night)</span>
                  </h3>
                  <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-5">
                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                      <label className="space-y-2">
                        <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">Min</span>
                        <Input
                          className="h-12 rounded-2xl"
                          inputMode="numeric"
                          placeholder="$0"
                          value={filters.minPrice}
                          onChange={(event) =>
                            onChange({ minPrice: event.target.value.replace(/\D/g, "") })
                          }
                        />
                      </label>
                      <span className="pt-7 text-xl font-black text-slate-400">-</span>
                      <label className="space-y-2">
                        <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">Max</span>
                        <Input
                          className="h-12 rounded-2xl"
                          inputMode="numeric"
                          placeholder="$500+"
                          value={filters.maxPrice}
                          onChange={(event) =>
                            onChange({ maxPrice: event.target.value.replace(/\D/g, "") })
                          }
                        />
                      </label>
                    </div>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {priceOptions.slice(1).map((option) => {
                        const active =
                          filters.minPrice === option.minPrice &&
                          filters.maxPrice === option.maxPrice;
                        return (
                          <button
                            key={option.label}
                            type="button"
                            onClick={() =>
                              onChange({
                                minPrice: option.minPrice,
                                maxPrice: option.maxPrice,
                              })
                            }
                            className={cn(
                              "h-10 rounded-2xl border px-4 text-sm font-black",
                              active
                                ? "border-blue-500 bg-blue-50 text-blue-700"
                                : "border-slate-200 bg-white text-slate-700 hover:border-blue-200",
                            )}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                    <label className="mt-5 block space-y-2">
                      <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">Price unit</span>
                      <select
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={filters.priceUnit}
                        onChange={(event) => onChange({ priceUnit: event.target.value })}
                      >
                        <option value="ANY">Any unit</option>
                        <option value="NIGHT">Per night</option>
                        <option value="PERSON">Per person</option>
                        <option value="DAY">Per day</option>
                        <option value="TOTAL">Total</option>
                      </select>
                    </label>
                  </div>
                </div>

                <div ref={(node) => { sectionRefs.current.provider = node; }}>
                  <h3 className="text-xl font-black text-slate-950">Provider rating</h3>
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
                    {[
                      { label: "Any", value: "" },
                      { label: "3+", value: "3.0" },
                      { label: "3.5+", value: "3.5" },
                      { label: "4+", value: "4.0" },
                      { label: "4.5+", value: "4.5" },
                    ].map((option) => (
                      <button
                        key={option.label}
                        type="button"
                        onClick={() => onChange({ providerRating: option.value })}
                        className={cn(
                          "min-h-16 rounded-2xl border px-3 text-sm font-black transition-all",
                          filters.providerRating === option.value
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-slate-200 bg-white text-slate-700 hover:border-blue-200",
                        )}
                      >
                        <span>{option.label}</span>
                        {option.value && (
                          <span className="mt-1 block text-amber-500">stars</span>
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {[
                      ["Verified providers only", "providerVerifiedOnly", ShieldCheck],
                      ["Top-rated providers", "providerTopRatedOnly", Star],
                      ["Preferred provider", "providerPreferredOnly", BadgeCheck],
                      ["New providers", "providerNewOnly", Sparkles],
                      ["Instant response", "providerInstantResponse", Zap],
                      ["Responds within 24 hours", "providerRespondsWithin24h", Clock],
                    ].map(([label, key, Icon]) => (
                      <ToggleCard
                        key={String(key)}
                        icon={Icon as React.ElementType}
                        label={String(label)}
                        active={Boolean(filters[key as keyof FilterState])}
                        onClick={() =>
                          onChange({
                            [key as string]: !filters[key as keyof FilterState],
                          } as Partial<FilterState>)
                        }
                      />
                    ))}
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {["Individual host", "Business", "Travel agency", "Professional operator"].map((type) => {
                      const active = filters.providerTypes.includes(type);
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() =>
                            onChange({
                              providerTypes: active
                                ? filters.providerTypes.filter((item) => item !== type)
                                : [...filters.providerTypes, type],
                            })
                          }
                          className={cn(
                            "h-11 rounded-2xl border px-4 text-sm font-black",
                            active
                              ? "border-blue-500 bg-blue-50 text-blue-700"
                              : "border-slate-200 bg-white text-slate-700 hover:border-blue-200",
                          )}
                        >
                          {type}
                        </button>
                      );
                    })}
                  </div>
                  <label className="mt-5 block space-y-2">
                    <span className="text-sm font-black text-slate-900">Minimum review count</span>
                    <select
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={filters.providerMinReviews}
                      onChange={(event) => onChange({ providerMinReviews: event.target.value })}
                    >
                      <option value="">Any</option>
                      <option value="10">10+</option>
                      <option value="50">50+</option>
                      <option value="100">100+</option>
                    </select>
                  </label>
                </div>
              </section>

              <section ref={(node) => { sectionRefs.current.guests = node; }} className="grid gap-7 border-t border-slate-200 pt-7 xl:grid-cols-2">
                <div>
                  <h3 className="text-xl font-black text-slate-950">Guest & rooms</h3>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <CounterStepper label="Adults" value={filters.adults} onChangeValue={(value) => onChange({ adults: value })} />
                    <CounterStepper label="Children" value={filters.children} onChangeValue={(value) => onChange({ children: value })} />
                    <CounterStepper label="Infants" value={filters.infants} onChangeValue={(value) => onChange({ infants: value })} />
                    <CounterStepper label="Rooms" value={filters.rooms} onChangeValue={(value) => onChange({ rooms: value })} />
                    <CounterStepper label="Bedrooms" value={filters.bedrooms} onChangeValue={(value) => onChange({ bedrooms: value })} />
                    <CounterStepper label="Bathrooms" value={filters.bathrooms} onChangeValue={(value) => onChange({ bathrooms: value })} />
                  </div>
                </div>
                <div className="space-y-5">
                <label className="block space-y-3">
                  <span className="text-xl font-black text-slate-950">Guest capacity</span>
                  <select
                    className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={filters.guestCapacity}
                    onChange={(event) => onChange({ guestCapacity: event.target.value })}
                  >
                    <option value="">Any</option>
                    <option value="1">1 guest</option>
                    <option value="2">2 guests</option>
                    <option value="4">4 guests</option>
                    <option value="6">6+ guests</option>
                    <option value="8">8+ guests</option>
                  </select>
                </label>
                <label className="block space-y-3">
                  <span className="text-xl font-black text-slate-950">Property type</span>
                  <select
                    className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={filters.propertyType}
                    onChange={(event) => onChange({ propertyType: event.target.value })}
                  >
                    <option value="">Any</option>
                    <option value="Hotel">Hotel</option>
                    <option value="Tour">Tour</option>
                    <option value="Restaurant">Restaurant</option>
                    <option value="Vehicle">Vehicle</option>
                    <option value="Experience">Experience</option>
                    <option value="Resort">Resort</option>
                    <option value="Villa">Villa</option>
                    <option value="Homestay">Homestay</option>
                    <option value="Apartment">Apartment</option>
                  </select>
                </label>
                </div>
              </section>

              <section ref={(node) => { sectionRefs.current.languages = node; }} className="grid gap-7 border-t border-slate-200 pt-7 xl:grid-cols-3">
                <div className="xl:col-span-1">
                  <span className="text-xl font-black text-slate-950">Languages</span>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                    {languageOptions.map((language) => {
                      const active = filters.languages.includes(language) || filters.language === language;
                      return (
                        <button
                          key={language}
                          type="button"
                          onClick={() => {
                            const exists = filters.languages.includes(language);
                            onChange({
                              language: "",
                              languages: exists
                                ? filters.languages.filter((item) => item !== language)
                                : [...filters.languages, language],
                            });
                          }}
                          className={cn(
                            "flex h-11 items-center justify-between rounded-2xl border px-4 text-sm font-black",
                            active
                              ? "border-blue-500 bg-blue-50 text-blue-700"
                              : "border-slate-200 bg-white text-slate-700 hover:border-blue-200",
                          )}
                        >
                          {language}
                          {active && <Check className="h-4 w-4" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div ref={(node) => { sectionRefs.current.accessibility = node; }} className="xl:col-span-2">
                  <h3 className="text-xl font-black text-slate-950">Accessibility</h3>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {accessibilityOptions.map((label) => (
                      <ToggleCard
                        key={label}
                        icon={ShieldCheck}
                        label={label}
                        active={filters.accessibility.includes(label)}
                        onClick={() => toggleArrayFilter("accessibility", label)}
                      />
                    ))}
                  </div>
                </div>
              </section>

              <section ref={(node) => { sectionRefs.current.neighborhood = node; }} className="border-t border-slate-200 pt-7">
                <h3 className="text-xl font-black text-slate-950">Neighborhood</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <Input
                      className="h-12 rounded-2xl pl-12"
                      placeholder="Search neighborhood or area..."
                      value={filters.neighborhoodQuery}
                      onChange={(event) => onChange({ neighborhoodQuery: event.target.value })}
                    />
                  </div>
                  <select
                    className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={filters.neighborhoodDistance}
                    onChange={(event) => onChange({ neighborhoodDistance: event.target.value })}
                  >
                    <option value="">Any distance</option>
                    <option value="1">Within 1 km</option>
                    <option value="3">Within 3 km</option>
                    <option value="5">Within 5 km</option>
                    <option value="10">Within 10 km</option>
                  </select>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  {neighborhoodOptions.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() =>
                        onChange({ neighborhood: filters.neighborhood === item ? "" : item })
                      }
                      className={cn(
                        "h-11 rounded-2xl border px-4 text-sm font-black transition-all",
                        filters.neighborhood === item
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-slate-200 bg-white text-slate-700 hover:border-blue-200",
                      )}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </section>
            </div>
          </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-3 border-t border-slate-200 bg-white p-4 shadow-[0_-8px_24px_rgba(15,23,42,0.04)] sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div className="hidden items-center gap-7 sm:flex">
            <span className="text-sm font-black text-blue-700">{selectedCount} filters selected</span>
            <button type="button" onClick={onClear} className="text-sm font-black text-slate-500 hover:text-blue-700">
              Clear all
            </button>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            variant="outline"
            className="h-[52px] rounded-2xl bg-white px-10 font-black text-slate-800"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            className="h-[52px] rounded-2xl bg-blue-600 px-10 font-black text-white shadow-lg shadow-blue-500/25 hover:bg-blue-700 sm:min-w-56"
            onClick={onApply}
          >
            Apply filters
            {selectedCount > 0 && (
              <span className="ml-3 flex h-6 min-w-6 items-center justify-center rounded-full bg-white/20 px-2 text-xs">
                {selectedCount}
              </span>
            )}
          </Button>
          <Button
            variant="outline"
            className="h-[52px] rounded-2xl bg-white px-8 font-black text-blue-700 sm:hidden"
            onClick={onClear}
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Clear Filters
          </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function ExploreResultsHeader({
  totalResults,
  isLoading,
  page,
}: {
  totalResults: number;
  isLoading: boolean;
  page: number;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-600">
          Explore results
        </p>
        <h2 className="mt-1 text-2xl font-black text-slate-950 sm:text-3xl">
          {isLoading ? "Searching..." : `${totalResults} Results Found`}
        </h2>
      </div>
      <div className="flex items-center gap-2">
        <span className="mr-2 text-sm font-black text-slate-500">
          Page {page + 1}
        </span>
        {[LayoutGrid, List, Map].map((Icon, iconIndex) => (
          <button
            key={iconIndex}
            type="button"
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-2xl border text-slate-600",
              iconIndex === 0
                ? "border-blue-200 bg-blue-50 text-blue-700"
                : "border-slate-200 bg-white",
            )}
            aria-label={`View mode ${iconIndex + 1}`}
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </div>
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages = Array.from(
    { length: Math.min(totalPages, 5) },
    (_, index) => index,
  );

  return (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
      <Button
        variant="outline"
        className="rounded-2xl bg-white"
        onClick={() => onPageChange(Math.max(0, page - 1))}
        disabled={page === 0}
      >
        Previous
      </Button>
      {pages.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onPageChange(item)}
          className={cn(
            "flex h-10 min-w-10 items-center justify-center rounded-2xl border px-3 text-sm font-black",
            item === page
              ? "border-blue-600 bg-blue-600 text-white"
              : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:text-blue-700",
          )}
        >
          {item + 1}
        </button>
      ))}
      <Button
        variant="outline"
        className="rounded-2xl bg-white"
        onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
        disabled={page >= totalPages - 1}
      >
        Next
      </Button>
    </div>
  );
}

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialFilters = useMemo(
    () => normalizeFilters(filtersFromSearchParams(searchParams)),
    [],
  );
  const initialPage = useMemo(
    () => {
      const parsedPage = Number(searchParams.get("page") || 0);
      return Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 0;
    },
    [],
  );

  const [draftFilters, setDraftFilters] = useState<FilterState>(initialFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<FilterState>(initialFilters);
  const [page, setCurrentPage] = useState(initialPage);
  const [isMoreFiltersOpen, setIsMoreFiltersOpen] = useState(false);
  const [moreFiltersBaseline, setMoreFiltersBaseline] =
    useState<FilterState>(initialFilters);

  const draftActiveCount = getActiveFilterCount(draftFilters);
  const draftAdvancedCount = getAdvancedFilterCount(draftFilters);
  const appliedApiParams = useMemo(
    () => filtersToApiParams(appliedFilters, page),
    [appliedFilters, page],
  );

  const { data, isLoading } = useQuery({
    queryKey: ["search-listings", appliedApiParams],
    queryFn: () =>
      listingService.searchListings({ ...appliedApiParams, status: "ACTIVE" }),
  });

  const updateDraft = (next: Partial<FilterState>) => {
    setDraftFilters((prev) => normalizeFilters({ ...prev, ...next }));
  };

  const applyFilters = (nextFilters = draftFilters) => {
    const normalized = normalizeFilters(nextFilters);
    setDraftFilters(normalized);
    setAppliedFilters(normalized);
    setCurrentPage(0);
    setSearchParams(filtersToSearchParams(normalized, 0));
    setIsMoreFiltersOpen(false);
  };

  const openMoreFilters = () => {
    setMoreFiltersBaseline(normalizeFilters(draftFilters));
    setIsMoreFiltersOpen(true);
  };

  const closeMoreFilters = () => {
    setDraftFilters(normalizeFilters(moreFiltersBaseline));
    setIsMoreFiltersOpen(false);
  };

  const clearFilters = () => {
    const normalized = normalizeFilters(defaultFilters);
    setDraftFilters(normalized);
    setAppliedFilters(normalized);
    setCurrentPage(0);
    setSearchParams(new URLSearchParams());
    setIsMoreFiltersOpen(false);
  };

  const removeAppliedFilter = (clear: Partial<FilterState>) => {
    const nextFilters = clearSingleFilter(appliedFilters, clear);
    setDraftFilters(nextFilters);
    setAppliedFilters(nextFilters);
    setCurrentPage(0);
    setSearchParams(filtersToSearchParams(nextFilters, 0));
  };

  const setPage = (newPage: number) => {
    setCurrentPage(newPage);
    setSearchParams(filtersToSearchParams(appliedFilters, newPage));
  };

  const totalResults = data?.data?.totalElements || 0;
  const currentPage = page;

  return (
    <div className="overflow-x-hidden bg-gradient-to-b from-slate-50 via-white to-blue-50/30">
      <div className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6 xl:px-8">
        <HeroSection />

        <div className="mt-5">
          <MobileExploreFilterBar
            filters={draftFilters}
            appliedFilters={appliedFilters}
            advancedCount={draftAdvancedCount}
            onChange={updateDraft}
            onApply={applyFilters}
            onClear={clearFilters}
            onRemoveApplied={removeAppliedFilter}
            onOpenMore={openMoreFilters}
          />
          <ExploreFilterBar
            filters={draftFilters}
            appliedFilters={appliedFilters}
            activeCount={draftActiveCount}
            advancedCount={draftAdvancedCount}
            onChange={updateDraft}
            onApply={applyFilters}
            onClear={clearFilters}
            onRemoveApplied={removeAppliedFilter}
            onOpenMore={openMoreFilters}
          />
        </div>

        <section className="mt-6">
          <ExploreResultsHeader
            totalResults={totalResults}
            isLoading={isLoading}
            page={currentPage}
          />

          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
                <div
                  key={item}
                  className="h-[350px] animate-pulse rounded-3xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="h-48 rounded-t-3xl bg-slate-100" />
                  <div className="space-y-3 p-4">
                    <div className="h-4 w-2/3 rounded bg-slate-100" />
                    <div className="h-3 w-1/2 rounded bg-slate-100" />
                    <div className="h-8 w-full rounded bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : data?.data?.content?.length === 0 ? (
            <StateBlock
              title="No listings found"
              description="Try adjusting your filters or search terms."
              actionLabel="Clear Filters"
              onAction={clearFilters}
            />
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
              {data?.data?.content?.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}

          <Pagination
            page={currentPage}
            totalPages={data?.data?.totalPages || 0}
            onPageChange={setPage}
          />
        </section>
      </div>

      <MoreFiltersModal
        open={isMoreFiltersOpen}
        filters={draftFilters}
        onClose={closeMoreFilters}
        onChange={updateDraft}
        onApply={() => applyFilters(draftFilters)}
        onClear={() => setDraftFilters(defaultFilters)}
      />
    </div>
  );
};

export default SearchPage;
