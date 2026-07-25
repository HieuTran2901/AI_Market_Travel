import React, { useEffect, useState } from 'react';
import { X, Star, MapPin, Calendar, Users, Building, ShieldCheck, HelpCircle, Receipt } from 'lucide-react';
import { PaymentDetail, PaymentStatus } from '@/types/payment';
import { paymentService } from '@/services/paymentService';
import { formatDateOnly, resolveImageUrl } from '@/utils/formatters';
import { motion, useReducedMotion } from 'framer-motion';
import { backdropVariants, modalVariants, modalContentVariants } from '@/utils/paymentHistoryMotion';

interface PaymentDetailsModalProps {
  paymentId: number | null;
  onClose: () => void;
  onRequestRefund?: (paymentId: number, amount: number) => void;
  onViewRefund?: (refundId: number) => void;
}

export const PaymentDetailsModal: React.FC<PaymentDetailsModalProps> = ({
  paymentId,
  onClose,
  onRequestRefund,
  onViewRefund,
}) => {
  const [payment, setPayment] = useState<PaymentDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (!paymentId) return;

    let mounted = true;
    const fetchPayment = async () => {
      setLoading(true);
      setError(null);
      setPayment(null);
      try {
        const response = await paymentService.getPayment(paymentId);
        if (mounted) {
          setPayment(response.data);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err?.response?.data?.message || 'Failed to load payment details.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchPayment();

    return () => {
      mounted = false;
    };
  }, [paymentId]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Prevent background scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const renderStatus = () => {
    if (!payment) return null;
    let bgColor = 'bg-slate-50';
    let iconColor = 'text-slate-500';
    let textColor = 'text-slate-700';
    let icon = <Receipt className="w-5 h-5" />;
    let desc = 'This transaction is pending.';

    switch (payment.status) {
      case PaymentStatus.SUCCESS:
        bgColor = 'bg-emerald-50';
        iconColor = 'text-emerald-500';
        textColor = 'text-emerald-700';
        desc = 'This transaction was successful.';
        icon = (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
        break;
      case PaymentStatus.PROCESSING:
        bgColor = 'bg-amber-50';
        iconColor = 'text-amber-500';
        textColor = 'text-amber-700';
        desc = 'This transaction is processing.';
        icon = (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
        break;
      case PaymentStatus.CANCELLED:
      case PaymentStatus.FAILED:
        bgColor = 'bg-rose-50';
        iconColor = 'text-rose-500';
        textColor = 'text-rose-700';
        desc = 'This transaction was cancelled.';
        icon = (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
        break;
      case PaymentStatus.REFUNDED:
        bgColor = 'bg-purple-50';
        iconColor = 'text-purple-500';
        textColor = 'text-purple-700';
        desc = 'This transaction was refunded.';
        icon = (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        );
        break;
    }

    return (
      <div className={`p-4 rounded-2xl ${bgColor} flex items-start gap-3 mb-6`}>
        <div className={`mt-0.5 ${iconColor}`}>{icon}</div>
        <div>
          <h4 className={`text-sm font-bold ${textColor} capitalize`}>{payment.status.toLowerCase()}</h4>
          <p className="text-xs font-medium text-slate-500 mt-0.5">{desc}</p>
        </div>
      </div>
    );
  };

  const renderProviderLogo = (method?: string) => {
    switch (method) {
      case 'MOMO':
        return <img src="/src/assets/images/momo-logo.png" alt="MoMo Wallet" className="w-6 h-6 object-contain rounded" />;
      case 'VNPAY':
        return <img src="/src/assets/images/vnpay-logo.png" alt="VNPay" className="w-6 h-6 object-contain" />;
      case 'STRIPE':
      case 'PAYPAL':
      case 'AI_COINS':
      default:
        return (
          <div className="w-6 h-6 rounded bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[10px]">
            {method?.substring(0, 2) || 'CC'}
          </div>
        );
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <motion.div 
        variants={shouldReduceMotion ? undefined : backdropVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" 
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <motion.div 
        variants={shouldReduceMotion ? undefined : modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="relative w-full h-[90vh] sm:h-auto sm:max-h-[90vh] max-w-[840px] bg-white rounded-t-[32px] sm:rounded-[32px] shadow-[0_20px_60px_-15px_rgba(79,70,229,0.15)] border border-indigo-50 flex flex-col overflow-hidden origin-bottom sm:origin-center"
      >
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 shrink-0">
          <h2 id="modal-title" className="text-lg font-black text-slate-900">Payment Details</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-500 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 custom-scrollbar">
          {loading ? (
            <div className="animate-pulse flex flex-col md:flex-row gap-8">
              <div className="flex-1 space-y-6">
                <div className="flex gap-4">
                  <div className="w-24 h-24 bg-slate-100 rounded-2xl"></div>
                  <div className="flex-1 space-y-2 py-2">
                    <div className="h-4 bg-slate-100 rounded w-16"></div>
                    <div className="h-6 bg-slate-100 rounded w-3/4"></div>
                    <div className="h-4 bg-slate-100 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="h-32 bg-slate-50 rounded-2xl"></div>
                <div className="h-48 bg-slate-50 rounded-2xl"></div>
              </div>
              <div className="hidden md:block w-[1px] bg-slate-100 shrink-0"></div>
              <div className="flex-1 space-y-6">
                <div className="h-16 bg-slate-50 rounded-2xl"></div>
                <div className="h-24 bg-slate-50 rounded-2xl"></div>
                <div className="h-48 bg-slate-50 rounded-2xl"></div>
              </div>
            </div>
          ) : error ? (
            <div className="py-12 text-center">
              <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Failed to load payment</h3>
              <p className="text-sm text-slate-500 mt-2 mb-6">{error}</p>
              <button onClick={() => window.location.reload()} className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-sm hover:bg-indigo-700 transition-colors">
                Retry
              </button>
            </div>
          ) : payment ? (
            <div className="flex flex-col md:flex-row gap-8 lg:gap-10">
              
              {/* Left Column */}
              <div className="flex-1 space-y-8 min-w-0">
                {/* Listing Header */}
                <motion.div variants={shouldReduceMotion ? undefined : modalContentVariants} className="flex items-start gap-5">
                  <div className="w-24 h-24 shrink-0 rounded-2xl overflow-hidden bg-slate-100 shadow-sm border border-slate-100">
                    {payment.booking?.imageUrl ? (
                      <img 
                        src={resolveImageUrl(payment.booking.imageUrl) || ''} 
                        alt="Listing" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.style.display = 'none';
                        }} 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <Building className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 pt-1">
                    <span className="inline-block px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-wider mb-2">
                      {payment.booking?.listingType || 'SERVICE'}
                    </span>
                    <h3 className="text-lg font-black text-slate-900 leading-tight mb-2 truncate">
                      {payment.booking?.listingTitle || 'Booking details'}
                    </h3>
                    
                    <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
                      {payment.booking?.averageRating !== undefined && payment.booking.averageRating > 0 && (
                        <div className="flex items-center gap-1 text-amber-500">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span>{payment.booking.averageRating} <span className="text-slate-400 font-medium">({payment.booking.reviewCount} reviews)</span></span>
                        </div>
                      )}
                      {payment.booking?.listingLocation && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate max-w-[120px]">{payment.booking.listingLocation}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>

                {/* Booking Information Grid */}
                <motion.div variants={shouldReduceMotion ? undefined : modalContentVariants} className="grid grid-cols-2 gap-y-6 gap-x-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                      <Calendar className="w-3.5 h-3.5" />
                      {payment.booking?.listingType === 'TOUR' || payment.booking?.listingType === 'EXPERIENCE' ? 'Start Date' : payment.booking?.listingType === 'VEHICLE_RENTAL' ? 'Pickup Date' : 'Check-in'}
                    </div>
                    <div className="text-sm font-black text-slate-900">
                      {formatDateOnly(payment.booking?.checkIn)}
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                      <Calendar className="w-3.5 h-3.5" />
                      {payment.booking?.listingType === 'TOUR' || payment.booking?.listingType === 'EXPERIENCE' ? 'Duration / End' : payment.booking?.listingType === 'VEHICLE_RENTAL' ? 'Return Date' : 'Check-out'}
                    </div>
                    <div className="text-sm font-black text-slate-900">
                      {formatDateOnly(payment.booking?.checkOut)}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                      <Users className="w-3.5 h-3.5" />
                      {payment.booking?.listingType === 'TOUR' || payment.booking?.listingType === 'EXPERIENCE' ? 'Participants' : payment.booking?.listingType === 'VEHICLE_RENTAL' ? 'Passengers' : 'Guests'}
                    </div>
                    <div className="text-sm font-black text-slate-900">
                      {payment.booking?.totalGuests ? `${payment.booking.totalGuests} ${payment.booking.listingType === 'TOUR' ? 'participants' : 'guests'}` : 'Not available'}
                    </div>
                  </div>

                  {(!payment.booking?.listingType || payment.booking?.listingType === 'HOTEL') && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Room
                      </div>
                      <div className="text-sm font-black text-slate-900">
                        {payment.booking?.roomName || payment.booking?.roomType || payment.booking?.listingTitle || 'Not available'}
                      </div>
                    </div>
                  )}
                  {(payment.booking?.listingType === 'TOUR' || payment.booking?.listingType === 'EXPERIENCE') && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Selected package
                      </div>
                      <div className="text-sm font-black text-slate-900">
                        {payment.booking?.roomName || payment.booking?.roomType || 'Not available'}
                      </div>
                    </div>
                  )}
                </motion.div>

                {/* Payment Information Card */}
                <motion.div variants={shouldReduceMotion ? undefined : modalContentVariants} className="bg-slate-50/80 rounded-2xl p-5 space-y-4 border border-slate-100">
                  <h4 className="text-sm font-black text-slate-900 mb-2">Payment Information</h4>
                  
                  <div className="grid grid-cols-[1fr_auto] gap-y-3 text-sm">
                    <span className="font-semibold text-slate-500">Payment ID</span>
                    <span className="font-bold text-slate-900 text-right">PAY-{payment.id}</span>
                    
                    <span className="font-semibold text-slate-500">Order ID</span>
                    <span className="font-bold text-slate-900 text-right">{payment.orderNumber || payment.orderId}</span>
                    
                    {payment.booking?.bookingId && (
                      <>
                        <span className="font-semibold text-slate-500">Booking ID</span>
                        <span className="font-bold text-slate-900 text-right">{payment.booking.bookingId}</span>
                      </>
                    )}

                    <span className="font-semibold text-slate-500">Payment Method</span>
                    <span className="font-bold text-slate-900 flex items-center justify-end gap-2">
                      {renderProviderLogo(payment.paymentMethod)}
                      {payment.paymentMethod === 'MOMO' ? 'MoMo Wallet' : payment.paymentMethod}
                    </span>

                    <span className="font-semibold text-slate-500">Transaction Date</span>
                    <span className="font-bold text-slate-900 text-right">
                      {new Date(payment.createdAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })} · {new Date(payment.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </motion.div>

                {/* Contact Support */}
                <motion.button variants={shouldReduceMotion ? undefined : modalContentVariants} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-indigo-50/50 hover:bg-indigo-50 text-indigo-600 text-xs font-black transition-colors border border-indigo-100/50">
                  <HelpCircle className="w-4 h-4" />
                  Need help? Contact Support
                </motion.button>
              </div>

              {/* Divider */}
              <div className="hidden md:block w-[1px] bg-slate-100 shrink-0 self-stretch"></div>

              {/* Right Column */}
              <div className="flex-1 min-w-0 flex flex-col">
                <motion.div variants={shouldReduceMotion ? undefined : modalContentVariants}>
                  {renderStatus()}
                </motion.div>

                <motion.div variants={shouldReduceMotion ? undefined : modalContentVariants} className="mb-6">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Amount</span>
                  <div className="text-3xl font-black text-slate-900 mt-1">
                    {payment.amount.toLocaleString('en-US')} {payment.currency}
                  </div>
                  
                  {/* Refund Actions */}
                  {payment.existingRefundId ? (
                    <button 
                      onClick={() => onViewRefund?.(payment.existingRefundId!)}
                      className="mt-4 px-5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-xs font-bold w-full transition-colors flex items-center justify-center gap-2"
                    >
                      <Receipt className="w-4 h-4" /> View Refund Details
                    </button>
                  ) : payment.isRefundable ? (
                    <button 
                      onClick={() => onRequestRefund?.(payment.id, payment.amount)}
                      className="mt-4 px-5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-xs font-bold w-full transition-colors flex items-center justify-center gap-2"
                    >
                      Request Refund
                    </button>
                  ) : null}
                </motion.div>

                {/* Price Breakdown */}
                {payment.priceBreakdown && (
                  <motion.div variants={shouldReduceMotion ? undefined : modalContentVariants} className="bg-white border border-slate-100 rounded-2xl p-5 mb-6 shadow-sm">
                    <h4 className="text-sm font-black text-slate-900 mb-4">Price Breakdown</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between text-slate-500 font-semibold">
                        <span>Base price</span>
                        <span className="text-slate-900 font-bold">{payment.priceBreakdown.basePrice?.toLocaleString('en-US')} {payment.currency}</span>
                      </div>
                      
                      {payment.priceBreakdown.serviceFee > 0 && (
                        <div className="flex justify-between text-slate-500 font-semibold">
                          <span>Service fee</span>
                          <span className="text-slate-900 font-bold">{payment.priceBreakdown.serviceFee?.toLocaleString('en-US')} {payment.currency}</span>
                        </div>
                      )}
                      
                      {payment.priceBreakdown.tax > 0 && (
                        <div className="flex justify-between text-slate-500 font-semibold">
                          <span>Taxes & fees</span>
                          <span className="text-slate-900 font-bold">{payment.priceBreakdown.tax?.toLocaleString('en-US')} {payment.currency}</span>
                        </div>
                      )}

                      {payment.priceBreakdown.discount > 0 && (
                        <div className="flex justify-between text-emerald-500 font-semibold">
                          <span>Discount</span>
                          <span className="font-bold">-{payment.priceBreakdown.discount?.toLocaleString('en-US')} {payment.currency}</span>
                        </div>
                      )}
                      
                      <div className="pt-3 border-t border-slate-100 mt-2 flex justify-between items-center">
                        <span className="font-black text-slate-900">Total</span>
                        <span className="font-black text-lg text-indigo-600">
                          {payment.priceBreakdown.finalTotal?.toLocaleString('en-US')} {payment.currency}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Security Notice */}
                <motion.div variants={shouldReduceMotion ? undefined : modalContentVariants} className="mt-auto bg-indigo-50/50 rounded-2xl p-4 flex gap-4 items-start border border-indigo-50">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-indigo-600">Your payment is secure</h5>
                    <p className="text-[11px] font-medium text-slate-500 mt-1 leading-relaxed">
                      All transactions are encrypted and 100% secure. We do not store your full card details.
                    </p>
                  </div>
                </motion.div>
              </div>

            </div>
          ) : null}
        </div>
      </motion.div>
    </div>
  );
};
