import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ListingWizardProvider } from '@/context/ListingWizardContext';
import { ListingWizard } from './ListingWizard';
import { listingService } from '@/services/listingService';
import type { CreateListingRequest, ListingResponse } from '@/types/listing';

const toWizardData = (listing: ListingResponse): Partial<CreateListingRequest> => ({
  category: listing.category,
  title: listing.title,
  shortDesc: listing.shortDesc,
  description: listing.description,
  address: listing.address,
  city: listing.city,
  country: listing.country,
  latitude: listing.latitude,
  longitude: listing.longitude,
  coverImageUrl: listing.coverImageUrl,
  basePrice: listing.basePrice,
  currency: listing.currency,
  imageUrls: listing.images?.map((image) => image.imageUrl) || [],
  details: listing.details || {},
});

export const CreateListingPage: React.FC = () => {
  return (
    <ListingWizardProvider>
      <ListingWizard />
    </ListingWizardProvider>
  );
};

export const EditListingPage: React.FC = () => {
  const { id } = useParams();
  const listingId = Number(id);
  const { data, isLoading, error } = useQuery({
    queryKey: ['provider-listing-edit', listingId],
    queryFn: () => listingService.getMyListingById(listingId),
    enabled: Number.isFinite(listingId),
  });

  if (isLoading) return <div className="p-8 text-sm font-semibold text-slate-500">Loading listing for editing...</div>;
  if (error || !data) return <div className="p-8 text-sm font-semibold text-red-600">Unable to load this listing for editing.</div>;

  return (
    <ListingWizardProvider mode="edit" listingId={listingId} initialData={toWizardData(data)}>
      <ListingWizard />
    </ListingWizardProvider>
  );
};
