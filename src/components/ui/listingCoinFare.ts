import type { ListingResponse } from "@/types/listing";

export const DEFAULT_VND_PER_AI_COIN = 1_000;

export const getListingAiCoinPrice = (listing: ListingResponse): number | null => {
  const apiCoinPrice = listing.coinPrice ?? listing.aiCoinPrice ?? listing.coinFare;

  if (typeof apiCoinPrice === "number" && Number.isFinite(apiCoinPrice) && apiCoinPrice > 0) {
    return Math.ceil(apiCoinPrice);
  }

  if (listing.currency.toUpperCase() !== "VND" || listing.basePrice <= 0) {
    return null;
  }

  // TODO: Replace this display-only conversion when listing eligibility and coin fares come from the API.
  return Math.ceil(listing.basePrice / DEFAULT_VND_PER_AI_COIN);
};
