import React from "react";
import { FlightDealRecommendation } from "@/types/ai";
import { formatCurrency } from "@/lib/utils";
import { Calendar } from "lucide-react";
import { getTranslation } from "@/lib/translations";

interface FlightDealCardProps {
  deal: FlightDealRecommendation;
  language?: string;
}

export const FlightDealCard: React.FC<FlightDealCardProps> = ({ deal, language = 'en' }) => {
  return (
    <div className="flex w-full max-w-sm flex-col rounded-xl border border-white/10 bg-white/5 p-4 shadow-sm backdrop-blur-md transition-all hover:border-white/20">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white/80">
        <Calendar className="h-4 w-4 text-cyan-400" />
        <span>{deal.departureDate} — {deal.returnDate}</span>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {deal.airlineLogo ? (
            <img src={deal.airlineLogo} alt={deal.airlineName} className="h-8 w-8 rounded-md bg-white object-contain p-1" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white/10 text-xs text-white/50">{deal.airlineName.charAt(0)}</div>
          )}
          <div>
            <div className="text-sm font-medium text-white">{deal.routeText}</div>
            <div className="text-xs text-white/60">{deal.airlineName}</div>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-xs font-medium text-white/60">{deal.durationText}</div>
          <div className="mt-1 text-xs font-medium text-cyan-200">{getTranslation(deal.rankText, language)}</div>
        </div>
      </div>
      
      <div className="mt-4 flex items-end justify-between border-t border-white/10 pt-4">
        <div className="text-lg font-bold text-white">
          {formatCurrency(deal.price, deal.currency)}
        </div>
        
        <button
          className="rounded-lg bg-cyan-500/20 px-4 py-2 text-sm font-medium text-cyan-50 transition-colors hover:bg-cyan-500/30"
          onClick={() => {
            if (deal.bookingUrl) {
              window.open(deal.bookingUrl, "_blank", "noopener,noreferrer");
            } else {
              console.log("Select deal", deal);
            }
          }}
        >
          {getTranslation('CHECK_FLIGHTS', language)}
        </button>
      </div>
    </div>
  );
};
