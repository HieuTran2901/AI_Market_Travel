import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronRight, CreditCard, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/PageHeader';
import { StateBlock } from '../../components/ui/StateBlock';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PaymentTimeline } from '../../components/payment/PaymentTimeline';
import { PriceBreakdown } from '../../components/payment/PriceBreakdown';
import { paymentService } from '../../services/paymentService';
import { Payment, PaymentStatus } from '../../types/payment';

export const PaymentHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await paymentService.getMyPayments();
        setPayments(response.data);
      } catch (err: any) {
        setError(err?.message || 'Unable to load payment history.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-start gap-3 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <PageHeader
            title="Payment History"
            description="Review payments created through the backend checkout flow."
            className="flex-1"
          />
        </div>

        {error ? (
          <StateBlock variant="error" title="Payment history unavailable" description={error} />
        ) : loading ? (
          <StateBlock variant="loading" title="Loading payments" description="Fetching payment history from the backend." />
        ) : payments.length === 0 ? (
          <StateBlock
            title="No recent payments found"
            description="Create a payment from checkout to see it here."
            actionLabel="Go to Checkout"
            onAction={() => navigate('/checkout')}
          />
        ) : (
          <div className="space-y-3">
            {payments.map((payment) => (
              <Card key={payment.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/payments/${payment.id}`)}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900">PAY-{payment.id}</p>
                          <StatusBadge kind="payment" status={payment.status} />
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">
                          Order: {payment.orderId} · {payment.paymentMethod} · {new Date(payment.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-xl font-bold text-gray-900">${payment.amount.toFixed(2)}</p>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
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
