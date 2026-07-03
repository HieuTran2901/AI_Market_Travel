import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  Package,
  ShieldCheck,
  ShoppingCart,
  X,
} from 'lucide-react';
import { ListingCategory, ListingResponse } from '@/types/listing';
import { AvailabilityCalendar, bookingService } from '@/services/bookingService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Cart } from '@/types/payment';

type BookingRequestModalProps = {
  listing: ListingResponse;
  isOpen: boolean;
  onClose: () => void;
  mode?: 'checkout' | 'cart';
  onSuccess?: (cart: Cart, status: 'added' | 'duplicate' | 'checkout') => void;
};

type AvailabilityState = {
  kind: 'idle' | 'checking' | 'available' | 'limited' | 'unavailable' | 'unknown' | 'error';
  message: string;
  remaining?: number;
};

type FormErrors = Partial<Record<'startDate' | 'endDate' | 'timeSlot' | 'quantity' | 'listing' | 'availability', string>>;

const availabilityClassNames: Record<AvailabilityState['kind'], string> = {
  idle: 'border-slate-200 bg-slate-50 text-slate-600',
  checking: 'border-blue-100 bg-blue-50 text-blue-700',
  available: 'border-emerald-100 bg-emerald-50 text-emerald-700',
  limited: 'border-amber-100 bg-amber-50 text-amber-700',
  unavailable: 'border-red-100 bg-red-50 text-red-700',
  unknown: 'border-slate-200 bg-slate-50 text-slate-600',
  error: 'border-amber-100 bg-amber-50 text-amber-700',
};

function getTodayInputValue() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 10);
}

function addDaysInputValue(dateValue: string, days: number) {
  const date = new Date(`${dateValue}T00:00:00`);
  date.setDate(date.getDate() + days);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

function daysBetween(startDate?: string, endDate?: string) {
  if (!startDate || !endDate || endDate <= startDate) {
    return 1;
  }

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / 86_400_000));
}

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: currency || 'VND',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCategory(category: string) {
  return category.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
}

function getCategoryCopy(category: ListingCategory) {
  switch (category) {
    case 'HOTEL':
      return {
        startLabel: 'Check-in date',
        endLabel: 'Check-out date',
        quantityLabel: 'Guests',
        quantityHelp: 'Number of travelers staying.',
        summaryLabel: 'night',
        requiresEndDate: true,
        requiresTime: false,
      };
    case 'RESTAURANT':
      return {
        startLabel: 'Reservation date',
        endLabel: '',
        quantityLabel: 'Guests',
        quantityHelp: 'Party size for the reservation.',
        summaryLabel: 'reservation',
        requiresEndDate: false,
        requiresTime: true,
      };
    case 'VEHICLE':
      return {
        startLabel: 'Pickup date',
        endLabel: 'Return date',
        quantityLabel: 'Vehicles',
        quantityHelp: 'Number of vehicles to reserve.',
        summaryLabel: 'day',
        requiresEndDate: true,
        requiresTime: false,
      };
    case 'EXPERIENCE':
      return {
        startLabel: 'Experience date',
        endLabel: '',
        quantityLabel: 'Participants',
        quantityHelp: 'People joining this experience.',
        summaryLabel: 'experience',
        requiresEndDate: false,
        requiresTime: false,
      };
    case 'TOUR':
    default:
      return {
        startLabel: 'Tour date',
        endLabel: '',
        quantityLabel: 'Travelers',
        quantityHelp: 'People joining this tour.',
        summaryLabel: 'tour',
        requiresEndDate: false,
        requiresTime: false,
      };
  }
}

function evaluateAvailability(records: AvailabilityCalendar[], quantity: number): AvailabilityState {
  if (records.length === 0) {
    return {
      kind: 'unknown',
      message: 'Availability will be confirmed during checkout.',
    };
  }

  const remainingByDate = records.map(record => {
    const total = record.totalCapacity ?? 0;
    const blocked = record.blockedCapacity ?? 0;
    const booked = record.bookedUnits ?? 0;
    const reserved = record.reservedUnits ?? 0;
    return {
      remaining: total - blocked - booked - reserved,
      blocked: record.status === 'BLOCKED' || record.status === 'SOLD_OUT' || blocked >= total,
    };
  });

  const minimumRemaining = Math.min(...remainingByDate.map(record => record.remaining));
  const isUnavailable = remainingByDate.some(record => record.blocked || record.remaining < quantity);

  if (isUnavailable) {
    return {
      kind: 'unavailable',
      message: 'This date is not available for the selected quantity.',
      remaining: Math.max(0, minimumRemaining),
    };
  }

  if (minimumRemaining <= Math.max(2, quantity + 1)) {
    return {
      kind: 'limited',
      message: `Limited availability: ${minimumRemaining} spots left.`,
      remaining: minimumRemaining,
    };
  }

  return {
    kind: 'available',
    message: `Available: ${minimumRemaining} spots left.`,
    remaining: minimumRemaining,
  };
}

export const BookingRequestModal = ({
  listing,
  isOpen,
  onClose,
  mode = 'checkout',
  onSuccess,
}: BookingRequestModalProps) => {
  const navigate = useNavigate();
  const today = getTodayInputValue();
  const categoryCopy = getCategoryCopy(listing.category);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availability, setAvailability] = useState<AvailabilityState>({
    kind: 'idle',
    message: 'Select a date to check availability.',
  });

  const duration = useMemo(() => daysBetween(startDate, endDate), [startDate, endDate]);
  const estimate = useMemo(() => {
    const subtotal = listing.basePrice * quantity * duration;
    const serviceFee = subtotal * 0.05;
    const tax = (subtotal + serviceFee) * 0.1;
    return {
      subtotal,
      serviceFee,
      tax,
      finalTotal: subtotal + serviceFee + tax,
    };
  }, [duration, listing.basePrice, quantity]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    if (!startDate || quantity < 1 || (categoryCopy.requiresEndDate && !endDate)) {
      setAvailability({
        kind: 'idle',
        message: 'Select a date to check availability.',
      });
      return;
    }

    if (categoryCopy.requiresEndDate && endDate <= startDate) {
      setAvailability({
        kind: 'idle',
        message: 'Choose a valid date range to check availability.',
      });
      return;
    }

    let cancelled = false;
    const effectiveEndDate = categoryCopy.requiresEndDate ? endDate : startDate;

    setAvailability({
      kind: 'checking',
      message: 'Checking live availability...',
    });

    bookingService.getAvailability(listing.id, startDate, effectiveEndDate)
      .then(response => {
        if (cancelled) return;
        setAvailability(evaluateAvailability(response.data ?? [], quantity));
      })
      .catch(() => {
        if (cancelled) return;
        setAvailability({
          kind: 'error',
          message: 'Availability check is unavailable right now. Checkout will validate the request.',
        });
      });

    return () => {
      cancelled = true;
    };
  }, [categoryCopy.requiresEndDate, endDate, isOpen, listing.id, quantity, startDate]);

  if (!isOpen) {
    return null;
  }

  const validate = () => {
    const nextErrors: FormErrors = {};

    if (listing.status !== 'ACTIVE') {
      nextErrors.listing = 'This listing is not currently available for booking.';
    }

    if (!startDate) {
      nextErrors.startDate = `${categoryCopy.startLabel} is required.`;
    } else if (startDate < today) {
      nextErrors.startDate = 'Choose today or a future date.';
    }

    if (categoryCopy.requiresEndDate) {
      if (!endDate) {
        nextErrors.endDate = `${categoryCopy.endLabel} is required.`;
      } else if (startDate && endDate <= startDate) {
        nextErrors.endDate = `${categoryCopy.endLabel} must be after ${categoryCopy.startLabel.toLowerCase()}.`;
      }
    }

    if (categoryCopy.requiresTime && !timeSlot) {
      nextErrors.timeSlot = 'Reservation time is required.';
    }

    if (!Number.isFinite(quantity) || quantity < 1) {
      nextErrors.quantity = `${categoryCopy.quantityLabel} must be at least 1.`;
    }

    if (availability.kind === 'unavailable') {
      nextErrors.availability = availability.message;
    }

    return nextErrors;
  };

  const submitBookingRequest = async () => {
    const nextErrors = validate();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'checkout') {
        await bookingService.clearCart();
      } else {
        const currentCart = await bookingService.getCart();
        const alreadyInCart = currentCart.data?.items?.some(item => item.listingId === listing.id);

        if (alreadyInCart) {
          window.dispatchEvent(new CustomEvent('ai-travel-cart-updated', {
            detail: { count: currentCart.data?.items?.length ?? 0 },
          }));
          onSuccess?.(currentCart.data, 'duplicate');
          onClose();
          return;
        }
      }

      const response = await bookingService.addCartItem({
        listingId: listing.id,
        quantity,
        startDate,
        endDate: categoryCopy.requiresEndDate ? endDate : undefined,
        timeSlot: categoryCopy.requiresTime ? timeSlot : undefined,
      });

      window.dispatchEvent(new CustomEvent('ai-travel-cart-updated', {
        detail: { count: response.data?.items?.length ?? 0 },
      }));

      if (mode === 'checkout') {
        onSuccess?.(response.data, 'checkout');
        navigate('/checkout');
        return;
      }

      onSuccess?.(response.data, 'added');
      onClose();
    } catch (error: any) {
      setErrors({
        availability: error?.message || 'Unable to add this listing to your cart. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const setSingleDate = (value: string) => {
    setStartDate(value);
    if (!categoryCopy.requiresEndDate) {
      setEndDate('');
    } else if (!endDate || endDate <= value) {
      setEndDate(addDaysInputValue(value, 1));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 px-4 py-4 backdrop-blur-sm sm:items-center" role="presentation" onMouseDown={event => event.target === event.currentTarget && onClose()}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-modal-title"
        className="motion-fade-up max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/70 bg-white shadow-2xl shadow-slate-950/20"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-white/95 p-5 backdrop-blur sm:p-6">
          <div>
            <Badge className="mb-3 bg-blue-50 text-blue-700 ring-1 ring-blue-100">{formatCategory(listing.category)}</Badge>
            <h2 id="booking-modal-title" className="text-2xl font-bold text-slate-950">
              {mode === 'cart' ? 'Add this listing to cart' : 'Book this listing'}
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              {mode === 'cart'
                ? 'Choose dates and quantity so you can review this service later in your cart.'
                : 'Choose your dates and quantity. Final price and availability are confirmed at checkout.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close booking form"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_280px]">
          <div className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <h3 className="font-semibold text-slate-950">{listing.title}</h3>
              <div className="mt-3 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-blue-600" /> {listing.city}, {listing.country}</span>
                <span className="inline-flex items-center gap-2"><Package className="h-4 w-4 text-blue-600" /> {listing.providerName}</span>
              </div>
            </div>

            {errors.listing && (
              <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700">
                {errors.listing}
              </div>
            )}

            <div className={`grid gap-4 ${categoryCopy.requiresEndDate ? 'sm:grid-cols-2' : ''}`}>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">{categoryCopy.startLabel}</span>
                <Input type="date" min={today} value={startDate} onChange={event => setSingleDate(event.target.value)} className="mt-2 h-12 rounded-2xl" />
                {errors.startDate && <span className="mt-1 block text-xs font-medium text-red-600">{errors.startDate}</span>}
              </label>

              {categoryCopy.requiresEndDate && (
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">{categoryCopy.endLabel}</span>
                  <Input type="date" min={startDate || today} value={endDate} onChange={event => setEndDate(event.target.value)} className="mt-2 h-12 rounded-2xl" />
                  {errors.endDate && <span className="mt-1 block text-xs font-medium text-red-600">{errors.endDate}</span>}
                </label>
              )}
            </div>

            <div className={`grid gap-4 ${categoryCopy.requiresTime ? 'sm:grid-cols-2' : ''}`}>
              {categoryCopy.requiresTime && (
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Reservation time</span>
                  <Input type="time" value={timeSlot} onChange={event => setTimeSlot(event.target.value)} className="mt-2 h-12 rounded-2xl" />
                  {errors.timeSlot && <span className="mt-1 block text-xs font-medium text-red-600">{errors.timeSlot}</span>}
                </label>
              )}

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">{categoryCopy.quantityLabel}</span>
                <Input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={event => setQuantity(Math.max(1, Number(event.target.value) || 1))}
                  className="mt-2 h-12 rounded-2xl"
                />
                <span className="mt-1 block text-xs text-slate-500">{categoryCopy.quantityHelp}</span>
                {errors.quantity && <span className="mt-1 block text-xs font-medium text-red-600">{errors.quantity}</span>}
              </label>
            </div>

            <div className={`rounded-2xl border p-4 text-sm font-medium ${availabilityClassNames[availability.kind]}`}>
              <div className="flex items-start gap-3">
                {availability.kind === 'checking' ? <Loader2 className="mt-0.5 h-4 w-4 animate-spin" /> : availability.kind === 'available' || availability.kind === 'limited' ? <CheckCircle2 className="mt-0.5 h-4 w-4" /> : <AlertCircle className="mt-0.5 h-4 w-4" />}
                <div>
                  <p>{availability.message}</p>
                  <p className="mt-1 text-xs opacity-80">The backend validates availability again when the order is created.</p>
                </div>
              </div>
            </div>
            {errors.availability && <p className="text-sm font-medium text-red-600">{errors.availability}</p>}
          </div>

          <aside className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Estimated total</p>
            <p className="mt-1 text-3xl font-bold text-slate-950">{formatMoney(estimate.finalTotal, listing.currency)}</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">Display estimate only. Checkout uses backend pricing.</p>

            <div className="mt-5 space-y-3 rounded-2xl bg-white/80 p-4 text-sm text-slate-600">
              <div className="flex justify-between gap-4">
                <span>Base price</span>
                <strong className="text-slate-950">{formatMoney(listing.basePrice, listing.currency)}</strong>
              </div>
              <div className="flex justify-between gap-4">
                <span>{categoryCopy.quantityLabel}</span>
                <strong className="text-slate-950">x {quantity}</strong>
              </div>
              {categoryCopy.requiresEndDate && (
                <div className="flex justify-between gap-4">
                  <span>{categoryCopy.summaryLabel}s</span>
                  <strong className="text-slate-950">x {duration}</strong>
                </div>
              )}
              <div className="border-t border-slate-100 pt-3">
                <div className="flex justify-between gap-4">
                  <span>Subtotal</span>
                  <strong className="text-slate-950">{formatMoney(estimate.subtotal, listing.currency)}</strong>
                </div>
                <div className="mt-2 flex justify-between gap-4">
                  <span>Service fee</span>
                  <strong className="text-slate-950">{formatMoney(estimate.serviceFee, listing.currency)}</strong>
                </div>
                <div className="mt-2 flex justify-between gap-4">
                  <span>Tax</span>
                  <strong className="text-slate-950">{formatMoney(estimate.tax, listing.currency)}</strong>
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-2 text-sm text-slate-600">
              <p className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Secure checkout</p>
              <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-blue-600" /> Reservation lock at order creation</p>
              <p className="flex items-center gap-2"><Clock className="h-4 w-4 text-amber-600" /> Payment follows checkout</p>
            </div>
          </aside>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 p-5 sm:flex-row sm:justify-end sm:p-6">
          <Button variant="outline" className="rounded-2xl bg-white" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            className="rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 shadow-lg shadow-blue-500/20"
            onClick={submitBookingRequest}
            disabled={isSubmitting || availability.kind === 'checking' || availability.kind === 'unavailable'}
          >
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShoppingCart className="mr-2 h-4 w-4" />}
            {mode === 'cart' ? 'Add to cart' : 'Continue to checkout'}
          </Button>
        </div>
      </section>
    </div>
  );
};
