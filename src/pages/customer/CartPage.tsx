import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Heart,
  Loader2,
  Lock,
  MapPin,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Tag,
  Trash2,
  Users,
  WalletCards,
} from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { bookingService } from "@/services/bookingService";
import { Cart, CartItem, PriceBreakdownDto } from "@/types/payment";
import { cn } from "@/lib/utils";

function formatMoney(value = 0, currency = "VND") {
  if (currency === "VND") {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(value);
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatCategory(value?: string) {
  return (value || "Listing")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(value?: string) {
  if (!value) return "To be confirmed";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function getDuration(item: CartItem) {
  if (!item.startDate || !item.endDate || item.endDate <= item.startDate) {
    return 1;
  }

  const start = new Date(`${item.startDate}T00:00:00`);
  const end = new Date(`${item.endDate}T00:00:00`);
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / 86_400_000));
}

function getQuantityLabel(item: CartItem) {
  switch (item.listingCategory) {
    case "HOTEL":
    case "RESTAURANT":
      return "Guests";
    case "VEHICLE":
      return "Vehicles";
    case "EXPERIENCE":
      return "Participants";
    case "TOUR":
    default:
      return "Travelers";
  }
}

function getDateLabel(item: CartItem) {
  if (item.listingCategory === "HOTEL" || item.listingCategory === "VEHICLE") {
    return `${formatDate(item.startDate)} - ${formatDate(item.endDate)}`;
  }

  if (item.timeSlot) {
    return `${formatDate(item.startDate)} at ${item.timeSlot}`;
  }

  return formatDate(item.startDate);
}

function getDestination(item: CartItem) {
  return (
    [item.listingCity, item.listingCountry].filter(Boolean).join(", ") ||
    "Destination confirmed after booking"
  );
}

function getLinePrice(item: CartItem) {
  return item.priceBreakdown?.finalTotal ?? item.basePrice * item.quantity * getDuration(item);
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object") {
    const candidate = error as {
      message?: string;
      response?: { data?: { message?: string } };
    };
    return candidate.response?.data?.message || candidate.message || fallback;
  }

  return fallback;
}

function CartSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((item) => (
        <Card key={item} className="rounded-3xl border-slate-200 bg-white shadow-sm">
          <CardContent className="p-4 sm:p-5">
            <div className="flex gap-4">
              <div className="h-28 w-28 shrink-0 animate-pulse rounded-2xl bg-slate-100 sm:h-36 sm:w-40" />
              <div className="flex-1 space-y-3 py-1">
                <div className="h-4 w-20 animate-pulse rounded-full bg-slate-100" />
                <div className="h-5 w-3/5 animate-pulse rounded-full bg-slate-100" />
                <div className="h-4 w-2/5 animate-pulse rounded-full bg-slate-100" />
                <div className="h-10 w-36 animate-pulse rounded-full bg-slate-100" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function EmptyCart() {
  const navigate = useNavigate();

  return (
    <Card className="rounded-3xl border-blue-100 bg-white shadow-xl shadow-blue-100/40">
      <CardContent className="flex flex-col items-center px-6 py-14 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-50 text-blue-600">
          <ShoppingBag className="h-10 w-10" />
        </div>
        <h2 className="mt-6 text-2xl font-black text-slate-950">Your cart is empty</h2>
        <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
          Explore stays, tours, restaurants, vehicles, and experiences, then add your favorites to checkout in one secure flow.
        </p>
        <Button
          className="mt-7 h-12 rounded-full bg-blue-600 px-7 font-black text-white shadow-lg shadow-blue-500/25 hover:bg-blue-700"
          onClick={() => navigate("/search")}
        >
          Continue Shopping
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}

function QuantityControl({ item }: { item: CartItem }) {
  return (
    <div
      className="inline-flex h-10 items-center rounded-full border border-slate-200 bg-white shadow-sm"
      title="Quantity changes are managed from the listing booking form."
    >
      <button
        type="button"
        disabled
        className="flex h-10 w-10 items-center justify-center text-slate-300"
        aria-label="Decrease quantity"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="min-w-10 px-2 text-center text-sm font-black text-slate-950">
        {item.quantity}
      </span>
      <button
        type="button"
        disabled
        className="flex h-10 w-10 items-center justify-center text-slate-300"
        aria-label="Increase quantity"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

function CartItemCard({
  item,
  removing,
  onRemove,
}: {
  item: CartItem;
  removing: boolean;
  onRemove: (itemId: number) => void;
}) {
  const navigate = useNavigate();
  const currency = item.currency || "VND";
  const quantityLabel = getQuantityLabel(item);

  return (
    <Card className="group overflow-hidden rounded-3xl border-slate-200 bg-white shadow-sm shadow-slate-200/70 transition-all duration-300 hover:-translate-y-1 hover:border-blue-100 hover:shadow-xl hover:shadow-blue-100/60">
      <CardContent className="p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-[156px_minmax(0,1fr)] lg:grid-cols-[180px_minmax(0,1fr)_150px]">
          <button
            type="button"
            onClick={() => navigate(`/listings/${item.listingSlug}`)}
            className="aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100 text-left sm:aspect-auto sm:h-full sm:min-h-[150px]"
            aria-label={`View ${item.listingTitle}`}
          >
            {item.listingCoverImageUrl ? (
              <img
                src={item.listingCoverImageUrl}
                alt={item.listingTitle}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full min-h-[150px] items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50 text-blue-500">
                <MapPin className="h-10 w-10" />
              </div>
            )}
          </button>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-blue-50 text-[10px] font-black uppercase tracking-wide text-blue-700 ring-1 ring-blue-100">
                {formatCategory(item.listingCategory)}
              </Badge>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-100">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Free cancellation
              </span>
            </div>

            <button
              type="button"
              onClick={() => navigate(`/listings/${item.listingSlug}`)}
              className="mt-2 line-clamp-2 text-left text-lg font-black leading-6 text-slate-950 transition-colors hover:text-blue-700"
            >
              {item.listingTitle}
            </button>

            <div className="mt-3 grid gap-2 text-sm font-medium text-slate-600 sm:grid-cols-2 xl:grid-cols-3">
              <p className="flex min-w-0 items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-blue-600" />
                <span className="truncate">{getDestination(item)}</span>
              </p>
              <p className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 shrink-0 text-blue-600" />
                <span>{getDateLabel(item)}</span>
              </p>
              <p className="flex items-center gap-2">
                <Users className="h-4 w-4 shrink-0 text-blue-600" />
                <span>
                  {item.quantity} {quantityLabel.toLowerCase()}
                  {item.listingCategory === "HOTEL" && item.inventoryName
                    ? `, ${item.inventoryName}`
                    : ""}
                </span>
              </p>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <QuantityControl item={item} />
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                disabled={removing}
                className="inline-flex h-10 items-center gap-2 rounded-full px-3 text-sm font-bold text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
              >
                {removing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Remove
              </button>
              <button
                type="button"
                className="inline-flex h-10 items-center gap-2 rounded-full px-3 text-sm font-bold text-slate-500 transition-colors hover:bg-blue-50 hover:text-blue-700"
                title="Save for later is coming soon."
              >
                <Heart className="h-4 w-4" />
                Save
              </button>
            </div>

            {item.selectedExtras && item.selectedExtras.length > 0 && (
              <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/50 p-3">
                <p className="text-xs font-black uppercase tracking-wide text-blue-700">Extras & Services</p>
                <div className="mt-2 space-y-1.5">
                  {item.selectedExtras.map(extra => (
                    <div key={extra.extraServiceId} className="flex items-center justify-between gap-3 text-sm">
                      <span className="min-w-0 truncate font-semibold text-slate-700">
                        {extra.name} <span className="text-slate-400">x {extra.quantity}</span>
                      </span>
                      <span className="shrink-0 font-black text-slate-900">{formatMoney(extra.lineTotal, extra.currency || currency)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-end justify-between border-t border-slate-100 pt-4 sm:col-span-2 lg:col-span-1 lg:flex-col lg:items-end lg:border-t-0 lg:pt-0">
            <div className="lg:text-right">
              <p className="text-lg font-black text-slate-950">
                {formatMoney(getLinePrice(item), currency)}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                {formatMoney(item.basePrice, currency)} x {item.quantity}
                {item.listingCategory === "HOTEL" || item.listingCategory === "VEHICLE"
                  ? ` x ${getDuration(item)} ${getDuration(item) === 1 ? "day" : "days"}`
                  : ""}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function OrderSummaryCard({
  totals,
  itemCount,
  currency,
  onCheckout,
}: {
  totals?: PriceBreakdownDto;
  itemCount: number;
  currency: string;
  onCheckout: () => void;
}) {
  const subtotal = totals?.subtotal ?? totals?.basePrice ?? 0;
  const extrasAmount = totals?.extrasAmount ?? 0;
  const tax = totals?.tax ?? 0;
  const platformFee = totals?.serviceFee ?? 0;
  const finalTotal = totals?.finalTotal ?? subtotal + extrasAmount + tax + platformFee;

  const rows = [
    [`Subtotal (${itemCount} ${itemCount === 1 ? "item" : "items"})`, subtotal],
    ["Extras & services", extrasAmount],
    ["Taxes & fees", tax],
    ["Platform fee", platformFee],
  ] as const;

  return (
    <Card className="rounded-3xl border-slate-200 bg-white shadow-xl shadow-slate-200/70">
      <CardContent className="p-5 sm:p-6">
        <h2 className="text-lg font-black text-slate-950">Order Summary</h2>
        <div className="mt-5 space-y-3">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-4 text-sm">
              <span className="font-medium text-slate-500">{label}</span>
              <span className="font-bold text-slate-800">{formatMoney(value, currency)}</span>
            </div>
          ))}
        </div>

        <div className="my-5 border-t border-slate-100" />

        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-black text-slate-950">Total</p>
            <p className="text-xs font-medium text-slate-500">Includes platform fees and taxes</p>
          </div>
          <p className="text-2xl font-black text-slate-950">{formatMoney(finalTotal, currency)}</p>
        </div>

        <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-sm font-bold text-emerald-800">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span>You will earn travel rewards on this booking.</span>
          </div>
        </div>

        <Button
          className="mt-5 h-12 w-full rounded-2xl bg-blue-600 font-black text-white shadow-lg shadow-blue-500/25 hover:bg-blue-700"
          onClick={onCheckout}
          disabled={itemCount === 0}
        >
          Proceed to Checkout
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          className="mt-3 h-12 w-full rounded-2xl bg-white font-black"
          disabled
          title="Google Pay checkout is coming soon."
        >
          Checkout with <span className="ml-1 text-blue-600">G</span>
          <span className="text-red-500">o</span>
          <span className="text-amber-500">o</span>
          <span className="text-blue-600">g</span>
          <span className="text-emerald-600">l</span>
          <span className="text-red-500">e</span> Pay
        </Button>

        <p className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold text-slate-500">
          <Lock className="h-4 w-4" />
          Secure checkout
        </p>
      </CardContent>
    </Card>
  );
}

function TrustFeatureStrip() {
  const features = [
    ["Best Price Guarantee", "We match a lower price", ShieldCheck, "blue"],
    ["Free Cancellation", "On most items", CheckCircle2, "emerald"],
    ["Secure Payment", "Your payment is protected", Lock, "violet"],
    ["24/7 Support", "We are here to help", Sparkles, "orange"],
  ] as const;

  const colorMap = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    violet: "bg-violet-50 text-violet-600",
    orange: "bg-orange-50 text-orange-600",
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {features.map(([title, description, Icon, color]) => (
        <Card key={title} className="rounded-3xl border-slate-100 bg-white/90 shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl", colorMap[color])}>
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-black text-slate-950">{title}</p>
              <p className="text-xs font-medium text-slate-500">{description}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export const CartPage = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);

  const loadCart = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await bookingService.getCart();
      setCart(response.data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to load your cart."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  const items = cart?.items ?? [];
  const itemCount = items.length;
  const currency = items[0]?.currency || "VND";
  const totals = cart?.totalBreakdown;
  const totalQuantity = useMemo(
    () => items.reduce((sum, item) => sum + (item.quantity || 0), 0),
    [items],
  );
  const finalTotal = totals?.finalTotal ?? items.reduce((sum, item) => sum + getLinePrice(item), 0);

  const removeItem = async (itemId: number) => {
    setRemovingId(itemId);
    setError(null);
    try {
      const response = await bookingService.removeCartItem(itemId);
      setCart(response.data);
      window.dispatchEvent(new CustomEvent("ai-travel-cart-updated", {
        detail: { count: response.data?.items?.length ?? 0 },
      }));
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to remove this item."));
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50/30 to-white text-slate-950">
      <SiteHeader />

      <main className="mx-auto w-full max-w-[1440px] px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-14">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Your Cart</h1>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-black text-blue-700 ring-1 ring-blue-100">
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </span>
            </div>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Review your selected travel services before secure checkout.
            </p>
          </div>

          <Button
            variant="outline"
            className="h-11 rounded-full bg-white px-5 font-black shadow-sm"
            onClick={() => navigate("/search")}
          >
            Continue Shopping
          </Button>
        </div>

        <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            You are {formatMoney(120000, currency)} away from free cancellation on all eligible items.
          </span>
          <button
            type="button"
            className="text-left text-sm font-black text-emerald-700 underline-offset-4 hover:underline sm:text-right"
          >
            Learn more
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_390px]">
          <section className="space-y-4">
            {loading ? (
              <CartSkeleton />
            ) : itemCount === 0 ? (
              <EmptyCart />
            ) : (
              items.map((item) => (
                <CartItemCard
                  key={item.id}
                  item={item}
                  removing={removingId === item.id}
                  onRemove={removeItem}
                />
              ))
            )}

            {!loading && itemCount > 0 && (
              <>
                <TrustFeatureStrip />

                <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
                  <CardContent className="p-5 sm:p-6">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h2 className="text-lg font-black text-slate-950">Saved for later</h2>
                        <p className="mt-1 text-sm font-medium text-slate-500">
                          Saved items will appear here when wishlist checkout support is available.
                        </p>
                      </div>
                      <Badge className="bg-slate-100 text-slate-600">Coming soon</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-3xl border-blue-100 bg-white shadow-sm">
                  <CardContent className="p-5 sm:p-6">
                    <h2 className="text-lg font-black text-slate-950">Why book with AI Travel Marketplace?</h2>
                    <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      {[
                        ["Trusted by travelers", "Verified services and real booking history.", BadgeCheck],
                        ["Wide selection", "Book stays, tours, dining, vehicles, and more.", ShoppingBag],
                        ["Best deals", "Transparent totals before you pay.", Tag],
                        ["Easy booking", "One cart, one checkout, one payment flow.", WalletCards],
                      ].map(([title, description, Icon]) => (
                        <div key={title as string} className="rounded-2xl bg-blue-50/50 p-4">
                          <Icon className="h-5 w-5 text-blue-600" />
                          <p className="mt-3 text-sm font-black text-slate-950">{title as string}</p>
                          <p className="mt-1 text-xs leading-5 text-slate-500">{description as string}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </section>

          <aside className="space-y-4 lg:sticky lg:top-32 lg:self-start">
            <OrderSummaryCard
              totals={totals}
              itemCount={itemCount}
              currency={currency}
              onCheckout={() => navigate("/checkout")}
            />
          </aside>
        </div>
      </main>

      {!loading && itemCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-2xl shadow-slate-900/10 backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-[720px] items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-500">
                {totalQuantity} {totalQuantity === 1 ? "traveler/service unit" : "traveler/service units"}
              </p>
              <p className="truncate text-lg font-black text-slate-950">
                {formatMoney(finalTotal, currency)}
              </p>
            </div>
            <Button
              className="h-12 rounded-2xl bg-blue-600 px-5 font-black text-white shadow-lg shadow-blue-500/25 hover:bg-blue-700"
              onClick={() => navigate("/checkout")}
            >
              Checkout
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
