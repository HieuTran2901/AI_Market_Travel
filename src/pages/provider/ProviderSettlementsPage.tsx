import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Clock, DollarSign, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { StateBlock } from '../../components/ui/StateBlock';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { settlementService } from '../../services/paymentService';
import { providerService } from '../../services/providerService';
import { Settlement, SettlementStatus } from '../../types/payment';

function money(value: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);
}

export const ProviderSettlementsPage: React.FC = () => {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const profile = await providerService.getMyProfile();
        const response = await settlementService.getSettlementsByProvider(profile.data.userId);
        setSettlements(response.data);
      } catch (err: any) {
        setError(err?.response?.data?.message || err?.message || 'Unable to load settlements.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const summary = useMemo(() => {
    const completed = settlements.filter(item => item.status === SettlementStatus.COMPLETED);
    const pending = settlements.filter(item => item.status === SettlementStatus.PENDING || item.status === SettlementStatus.PROCESSING);
    const currency = settlements[0]?.currency ?? 'USD';

    return [
      {
        label: 'Total Earned',
        value: money(completed.reduce((sum, item) => sum + item.providerAmount, 0), currency),
        icon: DollarSign,
        color: 'bg-emerald-50 text-emerald-600',
      },
      {
        label: 'Pending Payout',
        value: money(pending.reduce((sum, item) => sum + item.providerAmount, 0), currency),
        icon: Clock,
        color: 'bg-amber-50 text-amber-600',
      },
      {
        label: 'Settlements',
        value: `${settlements.length} total`,
        icon: TrendingUp,
        color: 'bg-blue-50 text-blue-600',
      },
    ];
  }, [settlements]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Finance"
        title="Settlements"
        description="Track backend settlement history, payout totals, and pending provider earnings."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {summary.map(stat => (
          <Card key={stat.label}>
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">{stat.label}</p>
                  <p className="text-xl font-bold text-gray-900 mt-0.5">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {error && (
        <StateBlock variant="error" title="Unable to load settlements" description={error} className="py-6" />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Settlement History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <StateBlock variant="loading" title="Loading settlements" description="Fetching provider settlement history." className="border-0 shadow-none" />
          ) : settlements.length === 0 ? (
            <StateBlock title="No settlements yet" description="Completed provider payouts will appear here." className="border-0 shadow-none" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left py-3 px-5 font-semibold text-gray-500 uppercase text-xs tracking-wide">ID</th>
                    <th className="text-left py-3 px-5 font-semibold text-gray-500 uppercase text-xs tracking-wide">Period</th>
                    <th className="text-right py-3 px-5 font-semibold text-gray-500 uppercase text-xs tracking-wide">Gross</th>
                    <th className="text-right py-3 px-5 font-semibold text-gray-500 uppercase text-xs tracking-wide">Platform Fee</th>
                    <th className="text-right py-3 px-5 font-semibold text-gray-500 uppercase text-xs tracking-wide">Tax</th>
                    <th className="text-right py-3 px-5 font-semibold text-gray-500 uppercase text-xs tracking-wide">You Receive</th>
                    <th className="text-center py-3 px-5 font-semibold text-gray-500 uppercase text-xs tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {settlements.map((settlement, index) => (
                    <tr key={settlement.id} className={`border-b border-gray-50 hover:bg-blue-50/30 transition-colors ${index % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                      <td className="py-4 px-5 font-mono font-semibold text-gray-900">SET-{settlement.id}</td>
                      <td className="py-4 px-5 text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          {new Date(settlement.periodStart).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </div>
                      </td>
                      <td className="py-4 px-5 text-right font-medium text-gray-900">{money(settlement.grossAmount, settlement.currency)}</td>
                      <td className="py-4 px-5 text-right text-red-500">-{money(settlement.platformFee, settlement.currency)}</td>
                      <td className="py-4 px-5 text-right text-red-500">-{money(settlement.taxAmount, settlement.currency)}</td>
                      <td className="py-4 px-5 text-right font-bold text-emerald-600">{money(settlement.providerAmount, settlement.currency)}</td>
                      <td className="py-4 px-5 text-center">
                        <StatusBadge kind="settlement" status={settlement.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-dashed border-amber-300 bg-amber-50">
        <CardContent className="p-4 text-sm text-amber-800">
          Payout request controls are not shown because the backend exposes settlement history only.
        </CardContent>
      </Card>
    </div>
  );
};
