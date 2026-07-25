import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Star } from 'lucide-react';
import { ListingResponse } from '@/types/listing';
import { Card, CardContent } from './Card';
import { Badge } from './Badge';
import coinGoldImage from '@/assets/images/coin-gold.png';
import { getListingAiCoinPrice } from './listingCoinFare';
import './ListingCard.css';

interface ListingCardProps {
  listing: ListingResponse;
}

export const ListingCard: React.FC<ListingCardProps> = ({ listing }) => {
  const aiCoinPrice = getListingAiCoinPrice(listing);

  return (
    <Link to={`/listings/${listing.slug}`} className="group block">
      <Card className="h-full overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:hover:shadow-slate-950/40">
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-slate-800">
          {listing.coverImageUrl ? (
            <img 
              src={listing.coverImageUrl} 
              alt={listing.title} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 text-gray-400 dark:from-slate-800 dark:to-slate-900 dark:text-slate-500">
              No Image
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge className="bg-white/90 text-gray-900 shadow-sm hover:bg-white dark:bg-slate-950/85 dark:text-slate-100 dark:hover:bg-slate-950">{listing.category}</Badge>
          </div>
        </div>
        <CardContent className="p-4 flex flex-col justify-between h-[170px]">
          <div>
            <div className="flex justify-between items-start gap-2">
              <h3 className="line-clamp-1 font-semibold text-gray-900 transition-colors group-hover:text-blue-600 dark:text-slate-100 dark:group-hover:text-blue-300">
                {listing.title}
              </h3>
              {listing.averageRating && (
                <div className="flex items-center text-sm font-medium">
                  <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                  {listing.averageRating.toFixed(1)}
                </div>
              )}
            </div>
            <div className="mt-1 flex items-center text-sm text-gray-500 dark:text-slate-400">
              <MapPin className="w-3.5 h-3.5 mr-1" />
              <span className="line-clamp-1">{listing.city}, {listing.country}</span>
            </div>
          </div>
          
          <div className="mt-3">
            <div className="listing-card__pricing">
              <div className="listing-card__cash-price">
              <p className="text-xs text-gray-500 dark:text-slate-400">Starting from</p>
              <p className="font-bold text-gray-900 dark:text-slate-100">
                {listing.basePrice.toLocaleString()} {listing.currency}
              </p>
              </div>

              {aiCoinPrice !== null && (
                <>
                  <div className="listing-card__price-divider" aria-hidden="true">
                    <span>or</span>
                  </div>
                  <div
                    className="listing-card__coin-price"
                    aria-label={`${aiCoinPrice.toLocaleString('en-US')} AI Coins coin fare`}
                  >
                    <img src={coinGoldImage} alt="" aria-hidden="true" />
                    <div>
                      <strong>{aiCoinPrice.toLocaleString('en-US')}</strong>
                      <span>AI Coins</span>
                    </div>
                    <small>Coin fare</small>
                  </div>
                </>
              )}
            </div>
            <p className="listing-card__provider truncate text-right text-xs text-gray-400 dark:text-slate-500">
              by {listing.providerName}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
