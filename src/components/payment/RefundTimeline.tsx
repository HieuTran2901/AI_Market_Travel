import React from 'react';
import { cn } from '../../lib/utils';
import { Check, Clock, XCircle, RefreshCw } from 'lucide-react';
import { RefundStatus } from '../../types/payment';

interface RefundTimelineProps {
  currentStatus: RefundStatus;
  requestedAt?: string;
  processedAt?: string;
  className?: string;
}

const REFUND_STEPS: { status: RefundStatus; label: string; description: string }[] = [
  { status: RefundStatus.REQUESTED, label: 'Requested', description: 'Your refund has been submitted.' },
  { status: RefundStatus.UNDER_REVIEW, label: 'Under Review', description: 'Our team is reviewing your request.' },
  { status: RefundStatus.APPROVED, label: 'Approved', description: 'Refund approved. Processing soon.' },
  { status: RefundStatus.PROCESSING, label: 'Processing', description: 'Refund is being processed.' },
  { status: RefundStatus.COMPLETED, label: 'Completed', description: 'Refund returned to your account.' },
];

const STATUS_ORDER = [
  RefundStatus.REQUESTED,
  RefundStatus.UNDER_REVIEW,
  RefundStatus.APPROVED,
  RefundStatus.PROCESSING,
  RefundStatus.COMPLETED,
];

export const RefundTimeline: React.FC<RefundTimelineProps> = ({ currentStatus, requestedAt, processedAt, className }) => {
  const isRejected = currentStatus === RefundStatus.REJECTED;
  const currentIdx = STATUS_ORDER.indexOf(currentStatus);

  return (
    <div className={cn('p-6 rounded-2xl bg-white border border-gray-100 shadow-sm', className)}>
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-6">Refund Progress</h3>

      {isRejected ? (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
          <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
          <div>
            <p className="font-semibold text-red-700">Refund Rejected</p>
            <p className="text-sm text-red-500 mt-0.5">Your refund request was not approved.</p>
          </div>
        </div>
      ) : (
        <div className="relative">
          {/* Vertical connector line */}
          <div className="absolute left-4 top-5 bottom-5 w-0.5 bg-gray-200 z-0" />
          
          <div className="relative z-10 space-y-5">
            {REFUND_STEPS.map((step) => {
              const stepDone = STATUS_ORDER.indexOf(step.status) < currentIdx;
              const isCurrent = step.status === currentStatus;
              return (
                <div key={step.status} className="flex items-start gap-4">
                  <div className={cn(
                    'w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm transition-all',
                    stepDone && 'bg-emerald-500',
                    isCurrent && 'bg-blue-600 ring-4 ring-blue-100',
                    !stepDone && !isCurrent && 'bg-gray-200 border-2 border-gray-300',
                  )}>
                    {stepDone && <Check className="w-4 h-4 text-white" />}
                    {isCurrent && <RefreshCw className="w-3.5 h-3.5 text-white animate-spin" />}
                    {!stepDone && !isCurrent && <Clock className="w-3.5 h-3.5 text-gray-400" />}
                  </div>
                  <div className="pt-0.5">
                    <p className={cn(
                      'text-sm font-semibold',
                      stepDone && 'text-emerald-600',
                      isCurrent && 'text-blue-700',
                      !stepDone && !isCurrent && 'text-gray-400',
                    )}>{step.label}</p>
                    <p className={cn(
                      'text-xs mt-0.5',
                      (stepDone || isCurrent) ? 'text-gray-500' : 'text-gray-300',
                    )}>{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {(requestedAt || processedAt) && (
        <div className="mt-5 pt-4 border-t border-gray-100 flex flex-wrap gap-4 text-xs text-gray-400">
          {requestedAt && <span>Requested: {new Date(requestedAt).toLocaleString()}</span>}
          {processedAt && <span>Processed: {new Date(processedAt).toLocaleString()}</span>}
        </div>
      )}
    </div>
  );
};
