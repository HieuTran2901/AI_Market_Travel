import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, Send, Info, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/PageHeader';
import { StateBlock } from '../../components/ui/StateBlock';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { RefundTimeline } from '../../components/payment/RefundTimeline';
import { refundService } from '../../services/paymentService';
import { Refund } from '../../types/payment';

const REFUND_REASONS = [
  { value: 'CUSTOMER_REQUEST', label: 'I changed my mind' },
  { value: 'PROVIDER_CANCELLATION', label: 'Provider cancelled my booking' },
  { value: 'SYSTEM_ERROR', label: 'System or technical error' },
  { value: 'DUPLICATE_PAYMENT', label: 'Duplicate payment charged' },
  { value: 'OTHER', label: 'Other reason' },
];

const REFUND_METHODS = [
  { value: 'ORIGINAL_PAYMENT_METHOD', label: 'Original Payment Method', description: 'Back to the same card/wallet used' },
  { value: 'STORE_CREDIT', label: 'Store Credit', description: 'Apply as credit on your account' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer', description: 'Transfer to your bank account' },
];

function rememberRefund(refund: Refund, paymentId: number) {
  const raw = localStorage.getItem('recent_refunds');
  const existing = raw ? JSON.parse(raw) as Array<{ refundId: number; paymentId: number }> : [];
  const next = [{ refundId: refund.id, paymentId }, ...existing.filter(item => item.refundId !== refund.id)].slice(0, 20);
  localStorage.setItem('recent_refunds', JSON.stringify(next));
}

export const RefundRequestPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const paymentId = Number(params.get('paymentId'));
  const amount = Number(params.get('amount'));

  const [reason, setReason] = useState('');
  const [method, setMethod] = useState('ORIGINAL_PAYMENT_METHOD');
  const [notes, setNotes] = useState('');
  const [submittedRefund, setSubmittedRefund] = useState<Refund | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = Number.isFinite(paymentId) && paymentId > 0 && Number.isFinite(amount) && amount > 0 && reason;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError(null);
    try {
      const response = await refundService.requestRefund(
        paymentId,
        amount,
        notes.trim() ? `${reason}: ${notes.trim()}` : reason,
        method
      );
      rememberRefund(response.data, paymentId);
      setSubmittedRefund(response.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Refund request failed.');
    } finally {
      setLoading(false);
    }
  };

  if (submittedRefund) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-50 py-12 px-4">
        <div className="max-w-xl mx-auto text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Refund Requested</h2>
          <p className="text-gray-500 mt-2">Your refund request has been submitted to the backend for review.</p>
          <div className="mt-8">
            <RefundTimeline currentStatus={submittedRefund.status} requestedAt={submittedRefund.createdAt} />
          </div>
          <div className="flex gap-3 mt-6 justify-center">
            <Button onClick={() => navigate(`/refunds/${submittedRefund.id}?paymentId=${paymentId}`)}>View Refund</Button>
            <Button variant="outline" onClick={() => navigate(`/payments/${paymentId}`)}>Back to Payment</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-start gap-3 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <PageHeader
            title="Request a Refund"
            description={Number.isFinite(paymentId) && paymentId > 0 ? `For payment PAY-${paymentId}` : 'Payment details required'}
            className="flex-1"
          />
        </div>

        {(!Number.isFinite(paymentId) || paymentId <= 0 || !Number.isFinite(amount) || amount <= 0) && (
          <Card className="mb-5 border-amber-200 bg-amber-50">
            <CardContent className="p-4 text-sm text-amber-800">
              Open this page from a successful payment so the refund API receives a payment id and amount.
            </CardContent>
          </Card>
        )}

        {error && (
          <StateBlock variant="error" title="Refund request failed" description={error} className="mb-5 py-6" />
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100">
            <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-700">
              Refund requests are sent to the backend and reviewed before processing.
            </p>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Why are you requesting a refund?</CardTitle></CardHeader>
            <CardContent className="space-y-2.5">
              {REFUND_REASONS.map(r => (
                <button
                  type="button"
                  key={r.value}
                  onClick={() => setReason(r.value)}
                  className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${
                    reason === r.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/30'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${reason === r.value ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`} />
                  <span className="text-sm font-medium text-gray-800">{r.label}</span>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Refund Method</CardTitle></CardHeader>
            <CardContent className="space-y-2.5">
              {REFUND_METHODS.map(m => (
                <button
                  type="button"
                  key={m.value}
                  onClick={() => setMethod(m.value)}
                  className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${
                    method === m.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${method === m.value ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`} />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{m.label}</p>
                    <p className="text-xs text-gray-500">{m.description}</p>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Additional Notes <span className="text-gray-400 font-normal">(optional)</span></CardTitle></CardHeader>
            <CardContent>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full rounded-xl border border-gray-200 p-3 text-sm text-gray-900 resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none"
                rows={4}
                placeholder="Provide any additional context for your refund request..."
              />
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" size="lg" disabled={!canSubmit || loading}>
            {loading ? 'Submitting...' : <><Send className="w-4 h-4 mr-2" /> Submit Refund Request</>}
          </Button>
        </form>
      </div>
    </div>
  );
};

export const RefundDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const refundId = Number(id);
  const paymentIdFromQuery = Number(new URLSearchParams(location.search).get('paymentId'));

  const [refund, setRefund] = useState<Refund | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await refundService.getRefund(refundId);
        setRefund(response.data);
      } catch (err: any) {
        setError(err?.response?.data?.message || err?.message || 'Unable to load refund details.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [refundId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-50 py-12 px-4">
        <div className="max-w-xl mx-auto">
          <StateBlock variant="loading" title="Loading refund" description="Fetching refund details by payment." />
        </div>
      </div>
    );
  }

  if (error || !refund) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-50 py-12 px-4">
        <div className="max-w-xl mx-auto">
          <StateBlock
            variant="error"
            title="Refund detail unavailable"
            description={error || 'Refund not found.'}
            actionLabel="Back to Payments"
            onAction={() => navigate('/payments/history')}
          />
        </div>
      </div>
    );
  }

  const displayPaymentId = paymentIdFromQuery || refund.paymentId;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-start gap-3 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <PageHeader title="Refund Detail" description={`REF-${refund.id}`} className="flex-1" />
        </div>

        <div className="space-y-5">
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start flex-wrap gap-4">
                <div>
                  <p className="text-sm text-gray-500">Refund Amount</p>
                  <p className="text-4xl font-bold text-gray-900 mt-1">${refund.amount.toFixed(2)}</p>
                  <p className="text-sm text-gray-400 mt-1">{refund.refundMethod.replace(/_/g, ' ')}</p>
                </div>
                <StatusBadge kind="refund" status={refund.status} />
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4 pt-5 border-t border-gray-100">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Refund ID</p>
                  <p className="font-mono text-sm font-semibold text-gray-900 mt-1">REF-{refund.id}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Payment ID</p>
                  <p className="font-mono text-sm font-semibold text-gray-900 mt-1">
                    {displayPaymentId ? `PAY-${displayPaymentId}` : 'Linked payment'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Reason</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">{refund.reason.replace(/_/g, ' ')}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Requested</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">{new Date(refund.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <RefundTimeline
            currentStatus={refund.status}
            requestedAt={refund.createdAt}
            processedAt={refund.processedAt}
          />

          <Button variant="outline" className="w-full" onClick={() => navigate(displayPaymentId ? `/payments/${displayPaymentId}` : '/payments/history')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Payment
          </Button>
        </div>
      </div>
    </div>
  );
};
