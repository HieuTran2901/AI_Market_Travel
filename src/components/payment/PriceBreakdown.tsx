import React from "react";
import { cn } from "../../lib/utils";

interface PriceBreakdownProps {
  basePrice: number;
  serviceFee: number;
  tax: number;
  discount?: number;
  finalTotal: number;
  currency?: string;
  className?: string;
}

function formatCurrency(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
    amount,
  );
}

export const PriceBreakdown: React.FC<PriceBreakdownProps> = ({
  basePrice,
  serviceFee,
  tax,
  discount = 0,
  finalTotal,
  currency = "USD",
  className,
}) => {
  return (
    <div className={cn("space-y-2.5", className)}>
      <div className="flex justify-between text-sm text-gray-600">
        <span>Base Price</span>
        <span className="font-medium text-gray-900">
          {formatCurrency(basePrice, currency)}
        </span>
      </div>
      <div className="flex justify-between text-sm text-gray-600">
        <span>Service Fee</span>
        <span className="font-medium text-gray-900">
          {formatCurrency(serviceFee, currency)}
        </span>
      </div>
      <div className="flex justify-between text-sm text-gray-600">
        <span>Tax</span>
        <span className="font-medium text-gray-900">
          {formatCurrency(tax, currency)}
        </span>
      </div>
      {discount > 0 && (
        <div className="flex justify-between text-sm text-emerald-600">
          <span>Discount</span>
          <span className="font-semibold">
            −{formatCurrency(discount, currency)}
          </span>
        </div>
      )}
      <div className="pt-2.5 border-t border-gray-200 flex justify-between">
        <span className="text-base font-bold text-gray-900">Total</span>
        <span className="text-base font-bold text-blue-600">
          {formatCurrency(finalTotal, currency)}
        </span>
      </div>
    </div>
  );
};
