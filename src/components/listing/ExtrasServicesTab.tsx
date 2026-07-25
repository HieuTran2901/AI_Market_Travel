import { useEffect, useMemo, useState } from 'react';
import type { ElementType } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BedDouble,
  Car,
  CheckCircle2,
  Coffee,
  ImageIcon,
  Loader2,
  Minus,
  Package,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StateBlock } from '@/components/ui/StateBlock';
import { bookingService } from '@/services/bookingService';
import { listingService } from '@/services/listingService';
import { cn } from '@/lib/utils';
import type { ExtraServiceCategory, ListingExtraService, ListingResponse } from '@/types/listing';
import type { CartItemExtra } from '@/types/payment';

type SelectedExtras = Record<number, { service: ListingExtraService; confirmedQuantity: number; draftQuantity: number }>;

type ExtrasServicesTabProps = {
  listing: ListingResponse;
  isAuthenticated: boolean;
};

const categories: Array<{ id: ExtraServiceCategory | 'ALL'; label: string; icon: ElementType }> = [
  { id: 'ALL', label: 'All', icon: Package },
  { id: 'FOOD_DRINK', label: 'Food & Drinks', icon: Coffee },
  { id: 'COMFORT', label: 'Comfort', icon: BedDouble },
  { id: 'TRANSPORT', label: 'Transport', icon: Car },
  { id: 'EXPERIENCE', label: 'Experiences', icon: Sparkles },
];

const categoryIconMap: Record<ExtraServiceCategory, ElementType> = {
  FOOD_DRINK: Coffee,
  COMFORT: BedDouble,
  TRANSPORT: Car,
  EXPERIENCE: Sparkles,
  OTHER: Package,
};

function formatMoney(value = 0, currency = 'VND') {
  return new Intl.NumberFormat(currency === 'VND' ? 'vi-VN' : 'en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'VND' ? 0 : 2,
  }).format(value);
}

function formatUnit(unit: string) {
  return unit.toLowerCase().replace(/_/g, ' ');
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object') {
    const candidate = error as { message?: string; response?: { data?: { message?: string } } };
    return candidate.response?.data?.message || candidate.message || fallback;
  }
  return fallback;
}

function QuantityStepper({
  value,
  max,
  onIncrement,
  onDecrement,
}: {
  value: number;
  max?: number;
  onIncrement: () => void;
  onDecrement: () => void;
}) {
  return (
    <div className="inline-flex h-9 min-w-[136px] overflow-hidden rounded-xl border border-blue-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={onDecrement}
        disabled={value <= 0}
        className="flex h-9 w-10 items-center justify-center text-blue-700 transition-colors hover:bg-blue-50 disabled:text-slate-300"
        aria-label="Decrease quantity"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="flex h-9 min-w-12 flex-1 items-center justify-center border-x border-blue-100 px-3 text-sm font-black text-slate-950">
        {value}
      </span>
      <button
        type="button"
        onClick={onIncrement}
        disabled={max != null && value >= max}
        className="flex h-9 w-10 items-center justify-center text-blue-700 transition-colors hover:bg-blue-50 disabled:text-slate-300"
        aria-label="Increase quantity"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

function ExtraServiceCard({
  service,
  quantity,
  onIncrement,
  onDecrement,
}: {
  service: ListingExtraService;
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
}) {
  const Icon = categoryIconMap[service.category] || Package;
  const selected = quantity > 0;

  return (
    <article
      className={cn(
        'grid min-w-0 gap-4 rounded-2xl border bg-white p-3 shadow-sm transition-all sm:grid-cols-[132px_minmax(0,1fr)]',
        selected ? 'border-blue-400 shadow-blue-100/80 ring-1 ring-blue-200' : 'border-slate-200 hover:border-blue-200 hover:shadow-md',
      )}
    >
      <div className="relative h-36 min-w-0 overflow-hidden rounded-xl bg-slate-100 sm:h-full sm:min-h-[138px]">
        {service.imageUrl ? (
          <img src={service.imageUrl} alt={service.name} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 text-blue-500">
            <Icon className="h-9 w-9" />
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-col">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-base font-black leading-snug text-slate-950">{service.name}</h3>
            <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-500">
              {service.description || 'Optional service provided by this marketplace listing.'}
            </p>
          </div>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <Icon className="h-4.5 w-4.5" />
          </span>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:mt-auto">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <p className="text-lg font-black text-blue-700">
              {formatMoney(service.price, service.currency)}
              <span className="ml-1 text-xs font-bold text-slate-500">/ {formatUnit(service.pricingUnit)}</span>
            </p>
            <QuantityStepper
              value={quantity}
              max={service.maxQuantity}
              onIncrement={onIncrement}
              onDecrement={onDecrement}
            />
          </div>
          {!service.available && (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700">Availability will be confirmed before checkout.</p>
          )}
        </div>
      </div>
    </article>
  );
}

function SelectedExtraRow({
  service,
  quantity,
  confirmedQuantity,
  onRemove,
}: {
  service: ListingExtraService;
  quantity: number;
  confirmedQuantity?: number;
  onRemove: () => void;
}) {
  const Icon = categoryIconMap[service.category] || Package;
  const lineTotal = service.price * quantity;

  return (
    <div className="flex items-center gap-3 py-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-black text-slate-950">{service.name}</p>
        <p className="text-xs font-semibold text-slate-500">
          {quantity} x {formatMoney(service.price, service.currency)}
          {confirmedQuantity ? <span className="ml-1 text-blue-600">({confirmedQuantity} confirmed)</span> : null}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-black text-slate-800">{formatMoney(lineTotal, service.currency)}</p>
        <button
          type="button"
          onClick={onRemove}
          className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-red-600"
          aria-label={`Remove ${service.name}`}
        >
          <X className="h-3.5 w-3.5" /> Remove
        </button>
      </div>
    </div>
  );
}

export function ExtrasServicesTab({ listing, isAuthenticated }: ExtrasServicesTabProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState<ExtraServiceCategory | 'ALL'>('ALL');
  const [selectedExtras, setSelectedExtras] = useState<SelectedExtras>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const extrasQuery = useQuery({
    queryKey: ['listing-extras', listing.id],
    queryFn: () => listingService.getListingExtras(listing.id),
  });

  const cartQuery = useQuery({
    queryKey: ['cart'],
    queryFn: () => bookingService.getCart(),
    enabled: isAuthenticated,
  });

  const extras = extrasQuery.data?.data ?? [];
  const currentCartItem = cartQuery.data?.data?.items?.find(item => item.listingId === listing.id);
  const categoryCounts = useMemo(() => {
    return extras.reduce<Record<string, number>>((counts, extra) => {
      counts.ALL = (counts.ALL || 0) + 1;
      counts[extra.category] = (counts[extra.category] || 0) + 1;
      return counts;
    }, {});
  }, [extras]);

  const filteredExtras = activeCategory === 'ALL'
    ? extras
    : extras.filter(extra => extra.category === activeCategory);

  useEffect(() => {
    if (!extras.length || !currentCartItem) {
      return;
    }

    setSelectedExtras(current => {
      const extrasById = new Map(extras.map(extra => [extra.id, extra]));
      const next: SelectedExtras = {};

      currentCartItem.selectedExtras?.forEach((confirmed: CartItemExtra) => {
        const service = extrasById.get(confirmed.extraServiceId);
        if (!service) return;
        next[service.id] = {
          service,
          confirmedQuantity: confirmed.quantity,
          draftQuantity: current[service.id]?.draftQuantity ?? 0,
        };
      });

      Object.values(current).forEach(row => {
        if (row.draftQuantity > 0 && !next[row.service.id]) {
          next[row.service.id] = {
            service: row.service,
            confirmedQuantity: 0,
            draftQuantity: row.draftQuantity,
          };
        }
      });

      return next;
    });
  }, [currentCartItem, extras]);

  const selectedRows = Object.values(selectedExtras);
  const extrasTotal = selectedRows.reduce((sum, row) => sum + row.service.price * (row.confirmedQuantity + row.draftQuantity), 0);
  const draftRows = selectedRows.filter(row => row.draftQuantity > 0);
  const draftTotal = draftRows.reduce((sum, row) => sum + row.service.price * row.draftQuantity, 0);
  const currency = selectedRows[0]?.service.currency || listing.currency || 'VND';

  const increment = (service: ListingExtraService) => {
    setNotice(null);
    setSelectedExtras(current => {
      const currentQuantity = (current[service.id]?.confirmedQuantity ?? 0) + (current[service.id]?.draftQuantity ?? 0);
      const nextQuantity = service.maxQuantity != null
        ? Math.min(service.maxQuantity, currentQuantity + 1)
        : currentQuantity + 1;
      const confirmedQuantity = current[service.id]?.confirmedQuantity ?? 0;
      return { ...current, [service.id]: { service, confirmedQuantity, draftQuantity: nextQuantity - confirmedQuantity } };
    });
  };

  const decrement = (service: ListingExtraService) => {
    setNotice(null);
    setSelectedExtras(current => {
      const currentRow = current[service.id];
      const confirmedQuantity = currentRow?.confirmedQuantity ?? 0;
      const draftQuantity = currentRow?.draftQuantity ?? 0;
      if (draftQuantity > 0) {
        return { ...current, [service.id]: { service, confirmedQuantity, draftQuantity: draftQuantity - 1 } };
      }
      if (confirmedQuantity <= 0) {
        const next = { ...current };
        delete next[service.id];
        return next;
      }
      return current;
    });
  };

  const remove = (serviceId: number) => {
    setNotice(null);
    setSelectedExtras(current => {
      const next = { ...current };
      const existing = next[serviceId];
      if (existing?.confirmedQuantity) {
        next[serviceId] = { ...existing, draftQuantity: 0 };
      } else {
        delete next[serviceId];
      }
      return next;
    });
  };

  const clearAll = () => {
    setNotice(null);
    setSelectedExtras(current => {
      const next: SelectedExtras = {};
      Object.values(current).forEach(row => {
        if (row.confirmedQuantity > 0) {
          next[row.service.id] = { ...row, draftQuantity: 0 };
        }
      });
      return next;
    });
  };

  const ensureCartItem = async () => {
    if (currentCartItem) {
      return currentCartItem.id;
    }
    const cartResponse = await bookingService.getCart();
    const existing = cartResponse.data?.items?.find(item => item.listingId === listing.id);
    if (existing) {
      return existing.id;
    }
    const addResponse = await bookingService.addCartItem({
      listingId: listing.id,
      quantity: 1,
    });
    const created = addResponse.data?.items?.find(item => item.listingId === listing.id);
    if (!created) {
      throw new Error('Unable to prepare this booking draft.');
    }
    return created.id;
  };

  const submitExtras = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (draftRows.length === 0) {
      return;
    }

    setIsSubmitting(true);
    setNotice(null);
    try {
      const itemId = await ensureCartItem();
      const response = await bookingService.mergeCartItemExtras(itemId, {
        listingId: listing.id,
        items: draftRows.map(row => ({
          extraServiceId: row.service.id,
          quantity: row.draftQuantity,
        })),
      });
      queryClient.setQueryData(['cart'], response);
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      window.dispatchEvent(new CustomEvent('ai-travel-cart-updated', {
        detail: { count: response.data?.items?.length ?? 0 },
      }));
      const updatedItem = response.data?.items?.find(item => item.listingId === listing.id);
      if (updatedItem) {
        const extrasById = new Map(extras.map(extra => [extra.id, extra]));
        const next: SelectedExtras = {};
        updatedItem.selectedExtras?.forEach((confirmed: CartItemExtra) => {
          const service = extrasById.get(confirmed.extraServiceId);
          if (!service) return;
          next[service.id] = {
            service,
            confirmedQuantity: confirmed.quantity,
            draftQuantity: 0,
          };
        });
        setSelectedExtras(next);
      }
      setNotice({ type: 'success', message: 'Extras added to your booking draft. You can review the updated total in cart or checkout.' });
    } catch (error) {
      setNotice({ type: 'error', message: getApiErrorMessage(error, 'Unable to add extras to your booking. Please try again.') });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="motion-fade-up rounded-[22px] border border-blue-100 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.32em] text-blue-600">Personalize your stay</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Add a little extra to your stay</h2>
          <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-500">
            Choose only what you need. You can review everything before checkout.
          </p>
        </div>
        <div className="inline-flex items-start gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          Availability is validated during checkout.
        </div>
      </div>

      <div className="mt-7 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex min-w-max gap-3">
          {categories.map(category => {
            const Icon = category.icon;
            const active = activeCategory === category.id;
            const count = categoryCounts[category.id] ?? 0;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveCategory(category.id)}
                className={cn(
                  'inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-bold transition-all',
                  active
                    ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-700',
                )}
              >
                <Icon className="h-4 w-4" />
                {category.label}
                {count > 0 && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{count}</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          {extrasQuery.isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map(item => (
                <div key={item} className="h-44 animate-pulse rounded-2xl border border-slate-100 bg-slate-50" />
              ))}
            </div>
          ) : extrasQuery.isError ? (
            <StateBlock
              variant="error"
              title="Unable to load extras"
              description="Please retry without leaving this listing."
              actionLabel="Retry"
              onAction={() => extrasQuery.refetch()}
            />
          ) : extras.length === 0 ? (
            <StateBlock
              title="No extras are currently available"
              description="This listing does not have optional services published yet."
            />
          ) : filteredExtras.length === 0 ? (
            <StateBlock
              title="No services in this category"
              description="Try another category or view all available extras."
            />
          ) : (
            <div className="grid min-w-0 gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {filteredExtras.map(service => (
                <ExtraServiceCard
                  key={service.id}
                  service={service}
                  quantity={(selectedExtras[service.id]?.confirmedQuantity ?? 0) + (selectedExtras[service.id]?.draftQuantity ?? 0)}
                  onIncrement={() => increment(service)}
                  onDecrement={() => decrement(service)}
                />
              ))}
            </div>
          )}
        </div>

        <aside className="min-w-0 rounded-3xl border border-blue-100 bg-white p-5 shadow-lg shadow-blue-100/40 xl:sticky xl:top-24">
          <h3 className="text-xl font-black text-slate-950">Your extras</h3>
          <div className="mt-4 divide-y divide-slate-100">
            {selectedRows.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center">
                <ImageIcon className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-3 text-sm font-bold text-slate-700">No extras selected yet</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">Use the plus buttons to personalize your booking.</p>
              </div>
            ) : (
              selectedRows.map(row => (
                <SelectedExtraRow
                  key={row.service.id}
                  service={row.service}
                  quantity={row.confirmedQuantity + row.draftQuantity}
                  confirmedQuantity={row.confirmedQuantity}
                  onRemove={() => remove(row.service.id)}
                />
              ))
            )}
          </div>

          <div className="mt-5 border-t border-slate-100 pt-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-black text-slate-950">Extras total</p>
                <p className="text-xs font-semibold text-slate-500">
                  {draftTotal > 0 ? `${formatMoney(draftTotal, currency)} pending confirmation` : 'All selected extras are confirmed'}
                </p>
              </div>
              <p className="text-2xl font-black text-slate-950">{formatMoney(extrasTotal, currency)}</p>
            </div>

            {notice && (
              <div
                className={cn(
                  'mt-4 rounded-2xl border px-3 py-2 text-sm font-semibold',
                  notice.type === 'success'
                    ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                    : 'border-red-100 bg-red-50 text-red-700',
                )}
              >
                {notice.message}
              </div>
            )}

            <Button
              type="button"
              className="mt-5 h-12 w-full rounded-2xl bg-blue-600 text-base font-black shadow-lg shadow-blue-500/20 hover:bg-blue-700"
              onClick={submitExtras}
              disabled={draftRows.length === 0 || isSubmitting}
            >
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Add to booking
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="mt-2 h-11 w-full rounded-2xl font-black text-blue-700"
              onClick={clearAll}
              disabled={draftRows.length === 0 || isSubmitting}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear all
            </Button>

            <p className="mt-5 flex items-center justify-center gap-2 border-t border-slate-100 pt-4 text-xs font-semibold text-slate-500">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              No charge until you confirm checkout
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
