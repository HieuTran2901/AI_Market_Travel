export type ListingSlugTarget = {
  slug?: string | null;
};

export function getListingDetailPath(listing: ListingSlugTarget): string | null {
  const slug = listing.slug?.trim();
  return slug ? `/listings/${encodeURIComponent(slug)}` : null;
}
