import React from "react";
import { FlightOfferRecommendation } from "@/types/ai";
import { formatCurrency } from "@/lib/utils";
import { getTranslation } from "@/lib/translations";

interface FlightOfferCardProps {
  flight: FlightOfferRecommendation;
  language?: string;
}

export const FlightOfferCard: React.FC<FlightOfferCardProps> = ({ flight, language = 'en' }) => {
  return (
    <div className="flex w-full max-w-sm flex-col rounded-xl border border-white/10 bg-white/5 p-4 shadow-sm backdrop-blur-md transition-all hover:border-white/20">
      {flight.badges && flight.badges.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {flight.badges.map((badge, idx) => (
            <span
              key={idx}
              className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-xs font-medium text-cyan-200"
            >
              {getTranslation(badge, language)}
            </span>
          ))}
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {flight.airlineLogo ? (
            <img src={flight.airlineLogo} alt={flight.airlineName} className="h-8 w-8 rounded-md bg-white object-contain p-1" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white/10 text-xs text-white/50">{flight.airlineName.charAt(0)}</div>
          )}
          <div>
            <div className="text-sm font-medium text-white">{flight.departureTime} - {flight.arrivalTime}</div>
            <div className="text-xs text-white/60">{flight.airlineName}</div>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-xs font-medium text-white/60">{flight.durationText}</div>
          <div className="text-xs text-white/60">{flight.routeText}</div>
          <div className="mt-1 text-xs font-medium text-amber-200">{flight.stopsText}</div>
        </div>
      </div>
      
      <div className="mt-4 flex items-end justify-between border-t border-white/10 pt-4">
        <div className="text-lg font-bold text-white">
          {formatCurrency(flight.price, flight.currency)}
        </div>
        
        {flight.bookingUrl && (
          <a
            href={flight.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-cyan-500/20 px-4 py-2 text-sm font-medium text-cyan-50 transition-colors hover:bg-cyan-500/30"
          >
            {getTranslation('CHECK_FLIGHTS', language)}
          </a>
        )}
      </div>
    </div>
  );
};
