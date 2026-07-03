import React from 'react';
import { cn } from '../../lib/utils';
import { Check, Clock, XCircle, RefreshCw } from 'lucide-react';
import { PaymentStatus } from '../../types/payment';

interface PaymentTimelineProps {
  currentStatus: PaymentStatus;
  createdAt?: string;
  updatedAt?: string;
  className?: string;
}

const PAYMENT_STEPS: { status: PaymentStatus[]; label: string }[] = [
  { status: [PaymentStatus.PENDING], label: 'Order Placed' },
  { status: [PaymentStatus.PROCESSING], label: 'Processing Payment' },
  { status: [PaymentStatus.SUCCESS, PaymentStatus.FAILED, PaymentStatus.CANCELLED, PaymentStatus.REFUNDED, PaymentStatus.EXPIRED], label: 'Payment Complete' },
];

function getStepStatus(
  stepStatuses: PaymentStatus[],
  currentStatus: PaymentStatus,
  stepIndex: number
): 'completed' | 'current' | 'upcoming' | 'failed' {
  const statusOrder: PaymentStatus[] = [
    PaymentStatus.PENDING,
    PaymentStatus.PROCESSING,
    PaymentStatus.SUCCESS,
  ];

  const currentIdx = statusOrder.indexOf(currentStatus);

  if (currentStatus === PaymentStatus.FAILED && stepIndex === 2) return 'failed';
  if (currentStatus === PaymentStatus.CANCELLED && stepIndex === 2) return 'failed';
  if (currentStatus === PaymentStatus.EXPIRED && stepIndex === 2) return 'failed';
  if (currentStatus === PaymentStatus.REFUNDED && stepIndex === 2) return 'completed';

  if (stepIndex < currentIdx) return 'completed';
  if (stepStatuses.includes(currentStatus)) return 'current';
  if (stepIndex === 2 && currentStatus === PaymentStatus.SUCCESS) return 'completed';
  return 'upcoming';
}

const StepIcon: React.FC<{ status: 'completed' | 'current' | 'upcoming' | 'failed' }> = ({ status }) => {
  if (status === 'completed') {
    return <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center shadow-md shadow-emerald-200"><Check className="w-5 h-5 text-white" /></div>;
  }
  if (status === 'current') {
    return (
      <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center shadow-md shadow-blue-200 ring-4 ring-blue-100">
        <RefreshCw className="w-4 h-4 text-white animate-spin" />
      </div>
    );
  }
  if (status === 'failed') {
    return <div className="w-9 h-9 rounded-full bg-red-500 flex items-center justify-center shadow-md shadow-red-200"><XCircle className="w-5 h-5 text-white" /></div>;
  }
  return <div className="w-9 h-9 rounded-full bg-gray-200 border-2 border-gray-300 flex items-center justify-center"><Clock className="w-4 h-4 text-gray-400" /></div>;
};

export const PaymentTimeline: React.FC<PaymentTimelineProps> = ({ currentStatus, createdAt, updatedAt, className }) => {
  const statusLabels: Partial<Record<PaymentStatus, string>> = {
    [PaymentStatus.FAILED]: 'Payment Failed',
    [PaymentStatus.CANCELLED]: 'Payment Cancelled',
    [PaymentStatus.EXPIRED]: 'Payment Expired',
    [PaymentStatus.REFUNDED]: 'Refunded',
  };

  return (
    <div className={cn('p-6 rounded-2xl bg-white border border-gray-100 shadow-sm', className)}>
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-6">Payment Progress</h3>
      <div className="flex items-start gap-0">
        {PAYMENT_STEPS.map((step, i) => {
          const status = getStepStatus(step.status, currentStatus, i);
          const isLast = i === PAYMENT_STEPS.length - 1;
          return (
            <React.Fragment key={step.label}>
              <div className="flex flex-col items-center flex-shrink-0">
                <StepIcon status={status} />
                <span className={cn(
                  'mt-2 text-xs font-medium text-center max-w-[80px]',
                  status === 'completed' && 'text-emerald-600',
                  status === 'current' && 'text-blue-600',
                  status === 'failed' && 'text-red-500',
                  status === 'upcoming' && 'text-gray-400',
                )}>
                  {status === 'failed' && i === 2 ? (statusLabels[currentStatus] ?? 'Failed') : step.label}
                </span>
              </div>
              {!isLast && (
                <div className={cn(
                  'flex-1 h-0.5 mt-4 mx-1 transition-colors duration-500',
                  status === 'completed' ? 'bg-emerald-400' : 'bg-gray-200'
                )} />
              )}
            </React.Fragment>
          );
        })}
      </div>
      {(createdAt || updatedAt) && (
        <div className="mt-5 pt-4 border-t border-gray-100 flex flex-wrap gap-4 text-xs text-gray-400">
          {createdAt && <span>Created: {new Date(createdAt).toLocaleString()}</span>}
          {updatedAt && <span>Updated: {new Date(updatedAt).toLocaleString()}</span>}
        </div>
      )}
    </div>
  );
};
