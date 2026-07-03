import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Star } from 'lucide-react';
import { ListingResponse } from '@/types/listing';
import { Card, CardContent } from './Card';
import { Badge } from './Badge';

interface ListingCardProps {
  listing: ListingResponse;
}

export const ListingCard: React.FC<ListingCardProps> = ({ listing }) => {
  return (
    <Link to={`/listings/${listing.slug}`} className="group block">
      <Card className="h-full overflow-hidden hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          {listing.coverImageUrl ? (
            <img 
              src={listing.coverImageUrl} 
              alt={listing.title} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 text-gray-400">
              No Image
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge className="bg-white/90 text-gray-900 shadow-sm hover:bg-white">{listing.category}</Badge>
          </div>
        </div>
        <CardContent className="p-4 flex flex-col justify-between h-[170px]">
          <div>
            <div className="flex justify-between items-start gap-2">
              <h3 className="font-semibold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                {listing.title}
              </h3>
              {listing.averageRating && (
                <div className="flex items-center text-sm font-medium">
                  <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                  {listing.averageRating.toFixed(1)}
                </div>
              )}
            </div>
            <div className="flex items-center text-sm text-gray-500 mt-1">
              <MapPin className="w-3.5 h-3.5 mr-1" />
              <span className="line-clamp-1">{listing.city}, {listing.country}</span>
            </div>
          </div>
          
          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-xs text-gray-500">Starting from</p>
              <p className="font-bold text-gray-900">
                {listing.basePrice.toLocaleString()} {listing.currency}
              </p>
            </div>
            <p className="max-w-[45%] truncate text-right text-xs text-gray-400">by {listing.providerName}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
