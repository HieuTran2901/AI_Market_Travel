import React from "react";
import { FlightSummaryLabel } from "@/types/ai";
import { DollarSign, Clock, Star } from "lucide-react";

interface FlightSummaryLabelsProps {
  labels: FlightSummaryLabel[];
}

export const FlightSummaryLabels: React.FC<FlightSummaryLabelsProps> = ({ labels }) => {
  if (!labels || labels.length === 0) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case "price":
        return <DollarSign className="h-4 w-4 text-emerald-400" />;
      case "time":
        return <Clock className="h-4 w-4 text-cyan-400" />;
      case "overall":
      default:
        return <Star className="h-4 w-4 text-amber-400" />;
    }
  };

  return (
    <div className="mb-4 flex flex-wrap gap-3">
      {labels.map((label, idx) => (
        <div
          key={idx}
          className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 shadow-sm backdrop-blur-md"
        >
          {getIcon(label.type)}
          <div className="flex flex-col">
            <span className="text-[10px] font-medium uppercase tracking-wider text-white/50 leading-none mb-0.5">
              {label.title}
            </span>
            <span className="text-sm font-semibold text-white leading-none">
              {label.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};
