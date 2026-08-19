import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, ChevronDown, ChevronRight, ChevronLeft, Clock3, CreditCard, Loader2, RefreshCw, WalletCards, XCircle, Calendar, Filter, Search, Wallet, Plane, AlertCircle, Banknote, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/PageHeader';
import { StateBlock } from '../../components/ui/StateBlock';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PaymentTimeline } from '../../components/payment/PaymentTimeline';
import { PriceBreakdown } from '../../components/payment/PriceBreakdown';
import { paymentService } from '../../services/paymentService';
import { Payment, PaymentMethod, PaymentPurpose, PaymentStatus } from '../../types/payment';
import travelSummaryArt from '../../assets/images/image(468).png';
import beachFallback from '../../assets/images/01-beginner-tropical-beach.png';
import mountainFallback from '../../assets/images/02-master-mountain-road.png';
import parisFallback from '../../assets/images/03-pro-paris-city.png';
import villaFallback from '../../assets/images/04-ultra-luxury-villa.png';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import galaxyFallback from '../../assets/images/05-galaxy-space.png';
import goldCoin from '../../assets/images/coin-gold.png';
import { PaymentDetailsModal } from './PaymentDetailsModal';
import { AnimatedAmount } from '../../components/payment/AnimatedAmount';
import {
  dailyCoinPassPackage,
  largeCoinPackages,
  primaryCoinPackages,
} from '../public/ai-coins/coinPackageConfig';
import { 
  pageVariants, 
  summaryVariants, 
  listVariants, 
  rowVariants 
} from '../../utils/paymentHistoryMotion';

type MomoVerificationState = 'verifying' | 'success' | 'pending' | 'cancelled' | 'failed';

export const MomoReturnPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const gatewayOrderId = searchParams.get('orderId');
  const [payment, setPayment] = useState<Payment | null>(null);
  const [state, setState] = useState<MomoVerificationState>('verifying');
  const [message, setMessage] = useState('Waiting for the verified MoMo payment notification.');

  useEffect(() => {
    if (!gatewayOrderId) {
      setState('failed');
      setMessage('The MoMo return link does not contain a payment identifier.');
      return;
    }

    const resultCode = searchParams.get('resultCode');
    const resultMessage = searchParams.get('message') || '';
    if (resultCode === '1006' || resultCode === '1005' || /cancel|reject|decline/i.test(resultMessage)) {
      setState('cancelled');
      setMessage('The MoMo payment was cancelled.');
      return;
    }

    let cancelled = false;
    let timer: number | undefined;
    let attempts = 0;

    const verify = async () => {
      attempts += 1;
      try {
        const response = await paymentService.getMomoPaymentStatus(gatewayOrderId);
        if (cancelled) return;

        const currentPayment = response.data;
        setPayment(currentPayment);
        switch (currentPayment.status) {
          case PaymentStatus.SUCCESS:
            setState('success');
            setMessage('Your payment was verified and your booking is confirmed.');
            return;
          case PaymentStatus.CANCELLED:
            setState('cancelled');
            setMessage('The MoMo payment was cancelled.');
            return;
          case PaymentStatus.FAILED:
          case PaymentStatus.EXPIRED:
            setState('failed');
            setMessage(
              currentPayment.status === PaymentStatus.EXPIRED
                ? 'The MoMo payment session expired.'
                : 'MoMo could not complete this payment.',
            );
            return;
          default:
            if (attempts >= 15) {
              setState('pending');
              setMessage('The payment is still pending. You can check its status again from Payment History.');
              return;
            }
            timer = window.setTimeout(verify, 2_000);
        }
      } catch {
        if (cancelled) return;
        if (attempts >= 15) {
          setState('pending');
          setMessage('Payment verification is taking longer than expected. No payment result was assumed.');
          return;
        }
        timer = window.setTimeout(verify, 2_000);
      }
    };

    void verify();
    return () => {
      cancelled = true;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [gatewayOrderId]);

  const icon = state === 'success'
    ? <CheckCircle2 className="h-10 w-10 text-emerald-600" />
    : state === 'failed' || state === 'cancelled'
      ? <XCircle className="h-10 w-10 text-rose-600" />
      : state === 'pending'
        ? <Clock3 className="h-10 w-10 text-amber-600" />
        : <Loader2 className="h-10 w-10 animate-spin text-pink-600" />;

const title = state === 'success'
    ? 'Payment successful'
    : state === 'cancelled'
      ? 'Payment cancelled'
      : state === 'failed'
        ? 'Payment unsuccessful'
        : state === 'pending'
          ? 'Payment pending'
          : 'Verifying payment...';

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-pink-50/30 to-blue-50/30 px-4 py-12">
      <Card className="mx-auto max-w-xl rounded-3xl border-slate-200 bg-white shadow-xl shadow-slate-200/60">
        <CardContent className="p-7 text-center sm:p-10">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-slate-50">
            {icon}
          </div>
          <div className="mb-2 flex items-center justify-center gap-2 text-sm font-semibold text-pink-700">
            <WalletCards className="h-4 w-4" />
            MoMo Sandbox
          </div>
          <h1 className="text-2xl font-bold text-slate-950">{title}</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">{message}</p>
          {payment && (
            <p className="mt-4 text-xs font-medium text-slate-500">
              Payment PAY-{payment.id} · {payment.status}
            </p>
          )}
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
            {payment && (
              <Button onClick={() => navigate(`/payments/${payment.id}`)}>
                View payment details
              </Button>
            )}
            {(state === 'failed' || state === 'cancelled') && (
              <Button variant="outline" onClick={() => navigate('/checkout')}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Try again
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate('/my-trips')}>
              View my bookings
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
};

type PaymentStatusTab = 'ALL' | 'SUCCESS' | 'PROCESSING' | 'CANCELLED';
type PaymentDateRange = 'ALL_TIME' | 'LAST_30' | 'LAST_90' | 'THIS_YEAR';

const paymentFallbackImages = [
  beachFallback,
  mountainFallback,
  parisFallback,
  villaFallback,
  galaxyFallback,
];

const aiCoinHistoryPackages = [
  ...primaryCoinPackages,
  ...largeCoinPackages,
  dailyCoinPassPackage,
];

const paymentMethodLabels: Record<string, string> = {
  [PaymentMethod.AI_COINS]: 'AI Coins',
  [PaymentMethod.BANK_TRANSFER]: 'Bank Transfer',
  [PaymentMethod.COD]: 'Cash on Delivery',
  [PaymentMethod.MOCK]: 'Card',
  [PaymentMethod.MOMO]: 'MoMo',
  [PaymentMethod.PAYPAL]: 'PayPal',
  [PaymentMethod.STRIPE]: 'Card',
  [PaymentMethod.VNPAY]: 'VNPay',
  [PaymentMethod.ZALOPAY]: 'ZaloPay',
};

const isAiCoinPurchasePayment = (payment: Payment) =>
  payment.paymentPurpose === PaymentPurpose.AI_COIN_PURCHASE ||
  Boolean(payment.aiCoinPackageId || payment.aiCoinPackageCode || payment.totalCoins);

const getAiCoinPackageImage = (payment: Payment) => {
  const packageId = payment.aiCoinPackageId || '';
  const packageCode = payment.aiCoinPackageCode || '';
  return aiCoinHistoryPackages.find((pkg) =>
    pkg.id === packageId || pkg.id.toUpperCase() === packageCode || packageCode.replace(/_/g, '-').toLowerCase() === pkg.id
  )?.image;
};

const getAiCoinPackageName = (payment: Payment) => {
  const packageId = payment.aiCoinPackageId || '';
  const packageCode = payment.aiCoinPackageCode || '';
  return payment.aiCoinPackageName ||
    aiCoinHistoryPackages.find((pkg) =>
      pkg.id === packageId || pkg.id.toUpperCase() === packageCode || packageCode.replace(/_/g, '-').toLowerCase() === pkg.id
    )?.name ||
    'AI Coin package';
};

const formatAiCoinRewardSummary = (payment: Payment) => {
  const baseCoins = payment.baseCoins ?? 0;
  const bonusCoins = payment.bonusCoins ?? 0;
  const totalCoins = payment.totalCoins ?? baseCoins + bonusCoins;

  if (baseCoins > 0) {
    return `${baseCoins.toLocaleString('en-US')} AI Coins + ${bonusCoins.toLocaleString('en-US')} Bonus Coins`;
  }
  if (totalCoins > 0) {
    return `${totalCoins.toLocaleString('en-US')} AI Coins`;
  }
  return getAiCoinPackageName(payment);
};

const paymentStatusConfig = {
  ALL: { label: 'All', Icon: Wallet, icon: 'bg-blue-50 text-blue-600' },
  SUCCESS: { label: 'Success', Icon: CheckCircle2, icon: 'bg-emerald-50 text-emerald-600' },
  PROCESSING: { label: 'Processing', Icon: Clock3, icon: 'bg-amber-50 text-amber-600' },
  CANCELLED: { label: 'Cancelled', Icon: XCircle, icon: 'bg-rose-50 text-rose-600' },
} satisfies Record<PaymentStatusTab, { label: string; Icon: React.ElementType; icon: string }>;

const normalizePaymentStatus = (status: string): PaymentStatusTab => {
  switch (status) {
    case PaymentStatus.SUCCESS:
    case 'COMPLETED':
    case 'PAID':
      return 'SUCCESS';
    case PaymentStatus.PENDING:
    case PaymentStatus.PROCESSING:
      return 'PROCESSING';
    case PaymentStatus.CANCELLED:
    case PaymentStatus.EXPIRED:
    case PaymentStatus.FAILED:
    case PaymentStatus.REFUNDED:
      return 'CANCELLED';
    default:
      return 'PROCESSING';
  }
};

const getPaymentStatusDisplay = (status: string) => {
  switch (status) {
    case PaymentStatus.SUCCESS:
    case 'COMPLETED':
    case 'PAID':
      return { label: 'Success', Icon: CheckCircle2, className: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
    case PaymentStatus.PROCESSING:
      return { label: 'Processing', Icon: Clock3, className: 'bg-amber-50 text-amber-700 border-amber-100' };
    case PaymentStatus.PENDING:
      return { label: 'Pending', Icon: Clock3, className: 'bg-blue-50 text-blue-700 border-blue-100' };
    case PaymentStatus.CANCELLED:
    case PaymentStatus.EXPIRED:
      return { label: 'Cancelled', Icon: XCircle, className: 'bg-rose-50 text-rose-700 border-rose-100' };
    case PaymentStatus.REFUNDED:
      return { label: 'Refunded', Icon: RotateCcw, className: 'bg-violet-50 text-violet-700 border-violet-100' };
    case PaymentStatus.FAILED:
    default:
      return { label: 'Failed', Icon: AlertCircle, className: 'bg-red-50 text-red-700 border-red-100' };
  }
};

const formatPaymentAmount = (amount: number, currency?: string, method?: string) => {
  const normalizedCurrency = (currency || '').toUpperCase();
  const isCoins = method === PaymentMethod.AI_COINS || normalizedCurrency === 'AI_COINS' || normalizedCurrency === 'AI_COIN';

  if (isCoins) return `${Math.round(amount).toLocaleString('en-US')} AI Coins`;
  if (normalizedCurrency === 'VND') return `${Math.round(amount).toLocaleString('en-US')} VND`;
  if (normalizedCurrency === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }
  return `${amount.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${currency || ''}`.trim();
};

const formatPaymentDate = (dateStr: string) => {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  const formattedDate = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const formattedTime = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  return `${formattedDate} · ${formattedTime}`;
};

const formatPercent = (value: number) => Number.isInteger(value) ? `${value}%` : `${value.toFixed(1)}%`;

export const PaymentHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [historyParams, setHistoryParams] = useSearchParams();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusTab, setStatusTab] = useState<PaymentStatusTab>(() => {
    const status = historyParams.get('status')?.toUpperCase();
    return status === 'SUCCESS' || status === 'PROCESSING' || status === 'CANCELLED' ? status : 'ALL';
  });
  const [dateRange, setDateRange] = useState<PaymentDateRange>(() => {
    const range = historyParams.get('range')?.toUpperCase();
    return range === 'LAST_30' || range === 'LAST_90' || range === 'THIS_YEAR' ? range : 'ALL_TIME';
  });
  const [methodFilter, setMethodFilter] = useState(() => historyParams.get('method') || 'ALL');
  const [currentPage, setCurrentPage] = useState(() => Math.max(1, Number(historyParams.get('page') || 1)));
  const itemsPerPage = 6;
  const now = useMemo(() => new Date(), []);
  
  const shouldReduceMotion = useReducedMotion();
  const listTopRef = React.useRef<HTMLDivElement>(null);

  const loadPayments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await paymentService.getMyPayments();
      setPayments(response.data || []);
    } catch (err: any) {
      setError(err?.message || 'Unable to load payment history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPayments();
  }, []);

  useEffect(() => {
    const next = new URLSearchParams();
    if (statusTab !== 'ALL') next.set('status', statusTab.toLowerCase());
    if (dateRange !== 'ALL_TIME') next.set('range', dateRange.toLowerCase());
    if (methodFilter !== 'ALL') next.set('method', methodFilter);
    if (currentPage > 1) next.set('page', String(currentPage));
    setHistoryParams(next, { replace: true });
  }, [currentPage, dateRange, methodFilter, setHistoryParams, statusTab]);

  const isWithinDateRange = (payment: Payment) => {
    if (dateRange === 'ALL_TIME') return true;
    const createdAt = new Date(payment.createdAt);
    if (Number.isNaN(createdAt.getTime())) return true;
    if (dateRange === 'THIS_YEAR') return createdAt.getFullYear() === now.getFullYear();
    const start = new Date(now);
    start.setDate(start.getDate() - (dateRange === 'LAST_30' ? 30 : 90));
    return createdAt >= start && createdAt <= now;
  };

  const availableMethods = useMemo(() => {
    const methods = Array.from(new Set(payments.map((payment) => payment.paymentMethod).filter(Boolean)));
    return methods.sort((a, b) => (paymentMethodLabels[a] || a).localeCompare(paymentMethodLabels[b] || b));
  }, [payments]);

  const baseFilteredPayments = useMemo(
    () => payments.filter((payment) => (methodFilter === 'ALL' || payment.paymentMethod === methodFilter) && isWithinDateRange(payment)),
    [dateRange, methodFilter, payments],
  );

  const counts = useMemo(() => ({
    ALL: baseFilteredPayments.length,
    SUCCESS: baseFilteredPayments.filter((payment) => normalizePaymentStatus(payment.status) === 'SUCCESS').length,
    PROCESSING: baseFilteredPayments.filter((payment) => normalizePaymentStatus(payment.status) === 'PROCESSING').length,
    CANCELLED: baseFilteredPayments.filter((payment) => normalizePaymentStatus(payment.status) === 'CANCELLED').length,
  }), [baseFilteredPayments]);

  const percentages = {
    SUCCESS: counts.ALL > 0 ? Number(((counts.SUCCESS / counts.ALL) * 100).toFixed(1)) : 0,
    PROCESSING: counts.ALL > 0 ? Number(((counts.PROCESSING / counts.ALL) * 100).toFixed(1)) : 0,
    CANCELLED: counts.ALL > 0 ? Number(((counts.CANCELLED / counts.ALL) * 100).toFixed(1)) : 0,
  };

  const filteredPayments = useMemo(
    () => baseFilteredPayments.filter((payment) => statusTab === 'ALL' || normalizePaymentStatus(payment.status) === statusTab),
    [baseFilteredPayments, statusTab],
  );

  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedPayments = filteredPayments.slice((safeCurrentPage - 1) * itemsPerPage, safeCurrentPage * itemsPerPage);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const totalSpendGroups = useMemo(() => {
    const groups = new Map<string, number>();
    baseFilteredPayments
      .filter((payment) => normalizePaymentStatus(payment.status) === 'SUCCESS')
      .forEach((payment) => {
        const currency = payment.paymentMethod === PaymentMethod.AI_COINS ? 'AI_COINS' : (payment.currency || 'VND');
        groups.set(currency, (groups.get(currency) || 0) + Number(payment.amount || 0));
      });
    return Array.from(groups.entries()).map(([currency, amount]) => ({ currency, amount })).sort((a, b) => b.amount - a.amount);
  }, [baseFilteredPayments]);

  const primarySpend = totalSpendGroups[0] || { currency: 'VND', amount: 0 };
  const statusTabs = Object.keys(paymentStatusConfig) as PaymentStatusTab[];

  const resetPageWith = (updates: Partial<{ statusTab: PaymentStatusTab; dateRange: PaymentDateRange; methodFilter: string }>) => {
    if (updates.statusTab) setStatusTab(updates.statusTab);
    if (updates.dateRange) setDateRange(updates.dateRange);
    if (updates.methodFilter) setMethodFilter(updates.methodFilter);
    setCurrentPage(1);
    
    // Smooth scroll to list top when pagination resets (if reduced motion is false)
    if (listTopRef.current) {
      listTopRef.current.scrollIntoView({
        behavior: shouldReduceMotion ? 'auto' : 'smooth',
        block: 'start',
      });
    }
  };

  const pageNumbers = useMemo(() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1);
    const pages = new Set([1, totalPages, safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1]);
    return Array.from(pages).filter((page) => page >= 1 && page <= totalPages).sort((a, b) => a - b);
  }, [safeCurrentPage, totalPages]);

  const getThumbnail = (payment: Payment) => {
    if (isAiCoinPurchasePayment(payment)) {
      return getAiCoinPackageImage(payment) || goldCoin;
    }
    return payment.listingCoverImageUrl || paymentFallbackImages[payment.id % paymentFallbackImages.length];
  };

  const renderProviderLogo = (method: string) => {
    const normalized = (method || '').toUpperCase();
    if (normalized === PaymentMethod.MOMO) {
      return (
        <div className="flex h-11 w-11 select-none flex-col items-center justify-center rounded-2xl bg-[#A50064] text-[10px] font-black leading-none text-white shadow-sm">
          <span>mo</span>
          <span className="mt-0.5">mo</span>
        </div>
      );
    }
    if (normalized === 'VISA') return <span className="select-none font-sans text-sm font-black italic tracking-tighter text-[#1A1F71]">VISA</span>;
    if (normalized === 'MASTERCARD' || normalized === 'CARD' || normalized === PaymentMethod.MOCK || normalized === PaymentMethod.STRIPE) {
      return (
        <div className="flex select-none items-center -space-x-2">
          <div className="h-5 w-5 rounded-full bg-[#EB001B] opacity-90 shadow-sm" />
          <div className="h-5 w-5 rounded-full bg-[#F79E1B] opacity-90 shadow-sm" />
        </div>
      );
    }
    if (normalized === PaymentMethod.ZALOPAY) {
      return (
        <div className="flex h-11 w-11 select-none flex-col items-center justify-center rounded-2xl bg-[#0068FF] text-[8px] font-extrabold leading-none text-white shadow-sm">
          <span>Zalo</span>
          <span className="mt-0.5 font-black">Pay</span>
        </div>
      );
    }
    if (normalized === PaymentMethod.VNPAY) {
      return <div className="flex h-11 w-11 select-none items-center justify-center rounded-2xl bg-gradient-to-br from-red-600 to-blue-700 text-[9px] font-black tracking-tighter text-white shadow-sm">VNPAY</div>;
    }
    if (normalized === PaymentMethod.PAYPAL) return <span className="select-none text-sm font-black text-[#003087]">PayPal</span>;
    if (normalized === PaymentMethod.AI_COINS) return <img src={goldCoin} alt="AI Coins" className="h-8 w-8 select-none object-contain drop-shadow-sm" />;
    if (normalized === PaymentMethod.BANK_TRANSFER) return <Banknote className="h-6 w-6 text-emerald-600" />;
    if (normalized === PaymentMethod.COD) return <Banknote className="h-6 w-6 text-emerald-600" />;
    return <CreditCard className="h-5 w-5 text-slate-500" />;
  };

  const renderAmount = (payment: Payment) => {
    const isCoins = !isAiCoinPurchasePayment(payment) && (payment.paymentMethod === PaymentMethod.AI_COINS || (payment.currency || '').toUpperCase().includes('AI'));
    return (
      <span className="flex items-center justify-end gap-1.5">
        {isCoins && <img src={goldCoin} alt="AI Coins" className="h-5 w-5 object-contain" />}
        {formatPaymentAmount(payment.amount, payment.currency, payment.paymentMethod)}
      </span>
    );
  };

  const renderSkeletonRows = () => (
    <div className="space-y-3">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="grid min-h-[104px] animate-pulse grid-cols-1 gap-4 rounded-[22px] border border-slate-100 bg-white/90 p-4 shadow-sm lg:grid-cols-[80px_72px_minmax(180px,1fr)_minmax(120px,auto)_minmax(140px,auto)_auto] lg:items-center">
          <div className="h-20 rounded-2xl bg-slate-100" />
          <div className="h-14 w-14 rounded-2xl bg-slate-100" />
          <div className="space-y-2">
            <div className="h-4 w-28 rounded bg-slate-100" />
            <div className="h-3 w-44 rounded bg-slate-100" />
            <div className="h-3 w-36 rounded bg-slate-100" />
          </div>
          <div className="h-8 w-28 rounded-full bg-slate-100" />
          <div className="h-5 w-32 rounded bg-slate-100" />
          <div className="h-9 w-9 rounded-full bg-slate-100" />
        </div>
      ))}
    </div>
  );

  const resultKey = useMemo(() => {
    return [statusTab, methodFilter, dateRange, currentPage].join('|');
  }, [statusTab, methodFilter, dateRange, currentPage]);

  return (
    <main className="min-h-screen bg-[#eef4fb] px-3 py-4 font-sans text-slate-950 sm:px-6 lg:px-8 lg:py-8">
      <motion.div 
        variants={shouldReduceMotion ? undefined : pageVariants} 
        initial="hidden" 
        animate="visible"
        className="relative mx-auto max-w-[1500px] overflow-hidden rounded-[32px] border border-white/80 bg-white/95 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:p-7 lg:p-9"
      >
        <div className="pointer-events-none absolute left-[28%] top-16 hidden items-center gap-2 text-blue-400/70 md:flex">
          <svg width="150" height="38" viewBox="0 0 150 38" fill="none" aria-hidden="true">
            <path d="M4 26 C34 2 64 40 94 14 C112 -2 124 2 146 12" stroke="currentColor" strokeWidth="2" strokeDasharray="7 8" />
          </svg>
          <Plane className="h-6 w-6 rotate-12 fill-blue-500/20 text-blue-500" />
        </div>

        <motion.header variants={shouldReduceMotion ? undefined : summaryVariants} className="relative z-10 mb-7 flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex items-start gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-white text-blue-600 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
              aria-label="Go back"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Payment History</h1>
              <p className="mt-2 text-sm font-medium text-slate-500 sm:text-base">
                Track <span className="font-bold text-blue-600">every journey</span>, every payment.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[470px]">
            <label className="group relative flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition focus-within:ring-2 focus-within:ring-blue-400">
              <Calendar className="h-5 w-5 text-blue-600" />
              <select value={dateRange} onChange={(event) => resetPageWith({ dateRange: event.target.value as PaymentDateRange })} className="w-full appearance-none bg-transparent pr-7 outline-none" aria-label="Filter by date range">
                <option value="ALL_TIME">All Time</option>
                <option value="LAST_30">Last 30 Days</option>
                <option value="LAST_90">Last 90 Days</option>
                <option value="THIS_YEAR">This Year</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 h-4 w-4 text-slate-400" />
            </label>

            <label className="group relative flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition focus-within:ring-2 focus-within:ring-blue-400">
              <Filter className="h-5 w-5 text-blue-600" />
              <select value={methodFilter} onChange={(event) => resetPageWith({ methodFilter: event.target.value })} className="w-full appearance-none bg-transparent pr-7 outline-none" aria-label="Filter by payment method">
                <option value="ALL">All Methods</option>
                {availableMethods.map((method) => (
                  <option key={method} value={method}>{paymentMethodLabels[method] || method}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 h-4 w-4 text-slate-400" />
            </label>
          </div>
        </motion.header>

        {error ? (
          <div className="rounded-3xl border border-red-100 bg-white p-8 text-center shadow-sm">
            <StateBlock variant="error" title="Unable to load payment history" description={error} />
            <Button className="mt-5" onClick={() => void loadPayments()}><RefreshCw className="mr-2 h-4 w-4" />Try again</Button>
          </div>
        ) : loading ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(260px,320px)_minmax(0,1fr)] xl:gap-8">
            <aside className="space-y-4">
              <div className="h-[450px] animate-pulse rounded-[28px] bg-white/80 shadow-sm" />
              <div className="h-16 animate-pulse rounded-2xl bg-white/80 shadow-sm" />
              <div className="h-16 animate-pulse rounded-2xl bg-white/80 shadow-sm" />
            </aside>
            <section>
              <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }, (_, index) => <div key={index} className="h-16 animate-pulse rounded-2xl bg-white shadow-sm" />)}
              </div>
              {renderSkeletonRows()}
              <p className="mt-5 text-center text-sm font-semibold text-slate-500">Loading payment history...</p>
            </section>
          </div>
        ) : payments.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-blue-200 bg-white p-10 text-center shadow-sm">
            <Search className="mx-auto mb-4 h-12 w-12 text-blue-300" />
            <h2 className="text-xl font-black text-slate-950">No payments found</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">Your completed and pending transactions will appear here.</p>
            <Button className="mt-6" onClick={() => navigate('/marketplace')}>Explore Marketplace</Button>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(260px,320px)_minmax(0,1fr)] xl:gap-8">
            <aside className="space-y-4">
              <motion.section variants={shouldReduceMotion ? undefined : summaryVariants} className="relative min-h-[420px] overflow-hidden rounded-[28px] border border-white bg-slate-900 p-6 shadow-xl shadow-blue-200/50">
                <motion.img 
                  initial={shouldReduceMotion ? false : { opacity: 0 }}
                  animate={shouldReduceMotion ? false : { opacity: 1 }}
                  transition={{ duration: 1.2 }}
                  src={travelSummaryArt} 
                  alt="Soft travel landscape" 
                  className="absolute inset-0 h-full w-full object-cover" 
                  loading="lazy" 
                />
                <div className="absolute inset-0 bg-gradient-to-b from-white/35 via-white/5 to-slate-950/70" />
                <motion.div 
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
                  animate={shouldReduceMotion ? false : { opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="relative z-10"
                >
                  <h2 className="text-2xl font-black text-slate-950">Hi Traveler! 🌎</h2>
                  <p className="mt-3 max-w-[230px] text-sm font-semibold leading-6 text-slate-700">Your payments power amazing journeys.</p>
                </motion.div>
                <motion.div 
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
                  animate={shouldReduceMotion ? false : { opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="absolute bottom-5 left-5 right-5 rounded-3xl border border-white/25 bg-[#221a70]/90 p-5 text-white shadow-2xl backdrop-blur-md"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wide text-blue-100">Total Spend</span>
                    <span className="rounded-xl bg-white/15 px-3 py-1 text-xs font-bold text-white">All Time</span>
                  </div>
                  <div className="text-2xl font-black tracking-tight">
                    <AnimatedAmount value={primarySpend.amount} currency={primarySpend.currency} duration={1.2} />
                  </div>
                  <div className="mt-2 text-sm font-semibold text-blue-100">{baseFilteredPayments.length} Transactions</div>
                  <svg className="mt-5 h-14 w-full text-violet-300" viewBox="0 0 240 64" fill="none" aria-hidden="true">
                    <path d="M0 55 C24 42 39 52 58 36 C78 20 94 44 112 30 C136 12 147 31 168 18 C188 6 204 17 240 2 V64 H0 Z" fill="url(#paymentChartFill)" opacity="0.9" />
                    <path d="M0 55 C24 42 39 52 58 36 C78 20 94 44 112 30 C136 12 147 31 168 18 C188 6 204 17 240 2" stroke="currentColor" strokeWidth="2.4" />
                    <defs><linearGradient id="paymentChartFill" x1="120" y1="0" x2="120" y2="64" gradientUnits="userSpaceOnUse"><stop stopColor="#c084fc" /><stop offset="1" stopColor="#2563eb" stopOpacity="0.1" /></linearGradient></defs>
                  </svg>
                </motion.div>
              </motion.section>

              <motion.div variants={shouldReduceMotion ? undefined : summaryVariants} className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                {(['SUCCESS', 'PROCESSING', 'CANCELLED'] as PaymentStatusTab[]).map((tab) => {
                  const config = paymentStatusConfig[tab];
                  const Icon = config.Icon;
                  const tint = tab === 'SUCCESS' ? 'bg-emerald-50 text-emerald-600' : tab === 'PROCESSING' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600';
                  return (
                    <div key={tab} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${tint}`}><Icon className="h-4 w-4" /></span>
                        <span className="truncate text-sm font-black text-slate-800">{tab === 'SUCCESS' ? 'Successful' : config.label}</span>
                      </div>
                      <div className="ml-3 flex items-center gap-3 text-sm">
                        <strong className="text-slate-950">{counts[tab]}</strong>
                        <span className={`rounded-lg px-2 py-1 text-xs font-black ${tint}`}>{formatPercent(percentages[tab as keyof typeof percentages])}</span>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            </aside>

            <section className="min-w-0">
              <div ref={listTopRef} className="-mt-8 pt-8" />
              <motion.nav variants={shouldReduceMotion ? undefined : summaryVariants} className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Payment status filters">
                {statusTabs.map((tab) => {
                  const config = paymentStatusConfig[tab];
                  const Icon = config.Icon;
                  const isActive = statusTab === tab;
                  return (
                    <button key={tab} type="button" onClick={() => resetPageWith({ statusTab: tab })} className={`relative flex min-h-[58px] items-center justify-between rounded-2xl border px-4 text-left text-sm font-black shadow-sm transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 ${isActive ? 'border-indigo-200 text-blue-700 shadow-md' : 'border-slate-100 bg-white text-slate-800 hover:border-blue-100 hover:bg-blue-50/40'}`}>
                      {isActive && !shouldReduceMotion && (
                        <motion.span
                          layoutId="payment-status-active"
                          className="absolute inset-0 z-0 rounded-2xl bg-[#EEF2FF]"
                          transition={{ type: "spring", stiffness: 400, damping: 35 }}
                        />
                      )}
                      <span className="relative z-10 flex items-center gap-3"><span className={`flex h-8 w-8 items-center justify-center rounded-full ${isActive ? 'bg-white text-blue-600 shadow-sm' : config.icon}`}><Icon className="h-4 w-4" /></span>{config.label}</span>
                      <span className={`relative z-10 rounded-full px-2.5 py-1 text-xs ${isActive ? 'bg-white text-blue-700 shadow-sm' : 'bg-slate-50 text-slate-700'}`}>{counts[tab]}</span>
                    </button>
                  );
                })}
              </motion.nav>

              <AnimatePresence mode="wait">
                <motion.div 
                  key={resultKey}
                  variants={shouldReduceMotion ? undefined : listVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className="space-y-3"
                >
                {paginatedPayments.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-blue-200 bg-white p-10 text-center shadow-sm">
                    <Search className="mx-auto mb-4 h-11 w-11 text-blue-300" />
                    <h2 className="text-lg font-black text-slate-950">No payments found</h2>
                    <p className="mt-2 text-sm text-slate-500">Your completed and pending transactions will appear here.</p>
                    <Button className="mt-6" onClick={() => navigate('/marketplace')}>Explore Marketplace</Button>
                  </div>
                ) : paginatedPayments.map((payment) => {
                  const statusDisplay = getPaymentStatusDisplay(payment.status);
                  const StatusIcon = statusDisplay.Icon;
                  const methodLabel = paymentMethodLabels[payment.paymentMethod] || payment.paymentMethod;
                  const isAiCoinPurchase = isAiCoinPurchasePayment(payment);
                  const cardSubtitle = isAiCoinPurchase
                    ? `AI Coins purchase · ${methodLabel}`
                    : `Order: ${payment.orderNumber || payment.orderId} · ${methodLabel}`;
                  const secondaryInfo = isAiCoinPurchase ? formatAiCoinRewardSummary(payment) : payment.listingTitle;
                  return (
                    <motion.article 
                      key={payment.id} 
                      variants={shouldReduceMotion ? undefined : rowVariants}
                      whileHover={shouldReduceMotion ? undefined : { y: -2, scale: 1.002 }}
                      whileTap={shouldReduceMotion ? undefined : { scale: 0.995 }}
                      className="group grid min-h-[104px] grid-cols-1 gap-4 rounded-[22px] border border-slate-200/60 bg-white/95 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.05)] transition hover:border-blue-300 hover:shadow-[0_12px_28px_rgba(15,23,42,0.08)] md:grid-cols-[88px_minmax(0,1fr)] lg:grid-cols-[80px_72px_minmax(180px,1fr)_minmax(120px,auto)_minmax(140px,auto)_auto] lg:items-center lg:gap-4 lg:px-5"
                    >
                      <div className="flex items-center gap-4 md:contents">
                        <div className="h-20 w-24 shrink-0 overflow-hidden rounded-2xl bg-blue-50 shadow-sm md:h-20 md:w-20 lg:h-20 lg:w-20">
                          <img src={getThumbnail(payment)} alt={isAiCoinPurchase ? `${getAiCoinPackageName(payment)} image` : payment.listingTitle || `Payment PAY-${payment.id} travel thumbnail`} className={`h-full w-full transition duration-500 group-hover:scale-105 ${isAiCoinPurchase ? 'object-contain p-2' : 'object-cover'}`} loading="lazy" />
                        </div>
                        <div className="flex min-w-0 flex-1 items-center gap-3 lg:contents">
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white p-2 shadow-sm lg:h-16 lg:w-16">{renderProviderLogo(payment.paymentMethod)}</div>
                          <div className="min-w-0">
                            <h3 className="truncate text-base font-black text-slate-950 transition group-hover:text-blue-600">PAY-{payment.id}</h3>
                            <p className="mt-1 truncate text-xs font-bold text-slate-500">{cardSubtitle}</p>
                            <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-400"><Calendar className="h-3.5 w-3.5" />{formatPaymentDate(payment.createdAt)}</p>
                            {isAiCoinPurchase && <p className="mt-1 hidden truncate text-xs font-semibold text-slate-400 lg:block">{secondaryInfo}</p>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-3 md:col-start-2 lg:col-auto lg:justify-center">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-black ${statusDisplay.className}`}>
                          <motion.div initial={shouldReduceMotion ? false : { scale: 0.5, opacity: 0 }} animate={shouldReduceMotion ? false : { scale: 1, opacity: 1 }} transition={{ duration: 0.3 }}><StatusIcon className="h-3.5 w-3.5" /></motion.div>
                          {statusDisplay.label}
                        </span>
                        {secondaryInfo && <span className="truncate text-xs font-semibold text-slate-400 lg:hidden">{secondaryInfo}</span>}
                      </div>
                      <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-3 md:col-start-2 lg:col-auto lg:border-t-0 lg:pt-0">
                        <div className="text-left lg:text-right">
                          <div className="text-lg font-black tracking-tight text-slate-950 lg:text-xl">{renderAmount(payment)}</div>
                          <button type="button" onClick={() => setSelectedPaymentId(payment.id)} className="mt-2 rounded-full bg-blue-50 px-4 py-2 text-xs font-black text-blue-700 transition group-hover:bg-blue-100 group-hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2">View Details</button>
                        </div>
                        <motion.button whileHover={{ x: 2 }} type="button" onClick={() => setSelectedPaymentId(payment.id)} aria-label={`View details for payment PAY-${payment.id}`} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-100 bg-slate-50 text-blue-600 transition group-hover:border-blue-600 group-hover:bg-blue-600 group-hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"><ChevronRight className="h-5 w-5" /></motion.button>
                      </div>
                    </motion.article>
                  );
                })}
              </motion.div>
              </AnimatePresence>

              {totalPages > 1 && (
                <nav className="mx-auto mt-8 flex w-fit max-w-full items-center gap-1 rounded-full border border-blue-100 bg-blue-50/70 p-1.5 shadow-sm" aria-label="Payment history pagination">
                  <button type="button" disabled={safeCurrentPage === 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm transition hover:bg-blue-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-35" aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></button>
                  {pageNumbers.map((page, index) => {
                    const previous = pageNumbers[index - 1];
                    const showGap = previous !== undefined && page - previous > 1;
                    return (
                      <React.Fragment key={page}>
                        {showGap && <span className="px-2 text-xs font-black text-slate-400">...</span>}
                        <button type="button" onClick={() => setCurrentPage(page)} aria-current={safeCurrentPage === page ? 'page' : undefined} className={`flex h-9 min-w-9 items-center justify-center rounded-full px-3 text-sm font-black transition ${safeCurrentPage === page ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-md shadow-blue-500/25' : 'text-slate-600 hover:bg-white'}`}>{page}</button>
                      </React.Fragment>
                    );
                  })}
                  <button type="button" disabled={safeCurrentPage === totalPages} onClick={() => { setCurrentPage((page) => Math.min(totalPages, page + 1)); listTopRef.current?.scrollIntoView({ behavior: shouldReduceMotion ? 'auto' : 'smooth', block: 'start' }); }} className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm transition hover:bg-blue-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-35" aria-label="Next page"><ChevronRight className="h-4 w-4" /></button>
                </nav>
              )}
            </section>
          </div>
        )}

        <div className="pointer-events-none absolute bottom-0 right-0 hidden h-44 w-64 opacity-75 md:block">
          <svg viewBox="0 0 260 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full" aria-hidden="true">
            <ellipse cx="190" cy="170" rx="90" ry="25" fill="#DBEAFE" opacity="0.7" />
            <path d="M120 175 Q170 155 240 175 Z" fill="#EFF6FF" />
            <path d="M225 170 Q235 140 245 120" stroke="#64748B" strokeWidth="4" strokeLinecap="round" />
            <path d="M245 120 C235 110 220 115 215 120 M245 120 C255 110 265 115 270 120 M245 120 C240 105 245 95 250 90" stroke="#0D9488" strokeWidth="3" strokeLinecap="round" />
            <path d="M175 165 L180 95 L195 95 L200 165 Z" fill="#60A5FA" opacity="0.85" />
            <path d="M177 145 L198 145 L197 130 L178 130 Z" fill="#2563EB" />
            <path d="M179 115 L196 115 L195 102 L180 102 Z" fill="#2563EB" />
            <rect x="176" y="90" width="23" height="5" rx="1" fill="#2563EB" />
            <path d="M182 90 L187 78 L188 78 L193 90 Z" fill="#F59E0B" />
            <circle cx="187.5" cy="84" r="3" fill="#FEF08A" />
            <path d="M125 155 L155 155 L150 163 L130 163 Z" fill="#2563EB" />
            <path d="M140 154 L140 130 L152 154 Z" fill="#60A5FA" />
            <path d="M138 154 L138 135 L126 154 Z" fill="#93C5FD" />
            <path d="M100 80 Q105 75 110 80 Q115 75 120 80" stroke="#94A3B8" strokeWidth="1.5" fill="none" />
            <path d="M125 65 Q129 61 133 65 Q137 61 141 65" stroke="#94A3B8" strokeWidth="1.5" fill="none" />
          </svg>
        </div>
      </motion.div>
      <AnimatePresence>
        {!!selectedPaymentId && (
          <PaymentDetailsModal 
            paymentId={selectedPaymentId} 
            onClose={() => setSelectedPaymentId(null)} 
            onRequestRefund={(id, amount) => navigate(`/refunds/request?paymentId=${id}&amount=${amount}`)}
            onViewRefund={(id) => navigate(`/refunds/${id}`)}
          />
        )}
      </AnimatePresence>
    </main>
  );
};

export const PaymentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const response = await paymentService.getPayment(Number(id));
        setPayment(response.data);
      } catch (err: any) {
        setError(err?.message || 'Payment not found.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-50 py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <StateBlock variant="loading" title="Loading payment" description="Fetching payment status from the backend." />
        </div>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-50 py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <StateBlock variant="error" title="Payment unavailable" description={error || 'Payment not found.'} />
        </div>
      </div>
    );
  }

  const subtotal = payment.amount / 1.15;
  const serviceFee = subtotal * 0.05;
  const tax = payment.amount - subtotal - serviceFee;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-start gap-3 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/payments/history')} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <PageHeader title="Payment Detail" description={`PAY-${payment.id}`} className="flex-1" />
        </div>

        <div className="space-y-5">
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start flex-wrap gap-4">
                <div>
                  <p className="text-sm text-gray-500">Amount</p>
                  <p className="text-4xl font-bold text-gray-900 mt-1">${payment.amount.toFixed(2)}</p>
                  <p className="text-sm text-gray-400 mt-1">{payment.currency} · {payment.paymentMethod}</p>
                </div>
                <StatusBadge kind="payment" status={payment.status} />
              </div>
            </CardContent>
          </Card>

          <PaymentTimeline currentStatus={payment.status} createdAt={payment.createdAt} updatedAt={payment.updatedAt} />

          <Card>
            <CardHeader><CardTitle>Price Breakdown</CardTitle></CardHeader>
            <CardContent>
              <PriceBreakdown basePrice={Number(subtotal.toFixed(2))} serviceFee={Number(serviceFee.toFixed(2))} tax={Number(tax.toFixed(2))} finalTotal={payment.amount} />
            </CardContent>
          </Card>

          <Card className="border-dashed border-amber-300 bg-amber-50">
            <CardContent className="p-4 text-sm text-amber-800">
              Transaction details are recorded by the backend, but no transaction read endpoint exists yet.
            </CardContent>
          </Card>

          {payment.status === PaymentStatus.SUCCESS && (
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => navigate(`/refunds/request?paymentId=${payment.id}&amount=${payment.amount}`)}>
                <RefreshCw className="w-4 h-4 mr-2" /> Request Refund
              </Button>
              <Button variant="ghost" className="flex-1" onClick={() => navigate('/payments/history')}>Back to History</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
