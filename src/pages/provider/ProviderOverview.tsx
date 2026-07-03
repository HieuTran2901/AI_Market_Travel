import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { listingService } from '@/services/listingService';
import { Card, CardContent } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { StateBlock } from '@/components/ui/StateBlock';
import { Layers, Activity, Clock, Ban, Archive, FileText } from 'lucide-react';

export const ProviderOverview: React.FC = () => {
  // In a real app we might have a specific stats endpoint, 
  // but for now we can fetch the first page of listings to get some basic counts
  // or build a lightweight stats summary
  const { data: listingsData, isLoading } = useQuery({
    queryKey: ['my-listings-stats'],
    queryFn: () => listingService.getMyListings({ page: 0, size: 100 }),
  });

  const listings = listingsData?.data?.content || [];

  const stats = {
    total: listings.length,
    active: listings.filter(l => l.status === 'ACTIVE').length,
    pending: listings.filter(l => l.status === 'PENDING_REVIEW').length,
    rejected: listings.filter(l => l.status === 'REJECTED').length,
    draft: listings.filter(l => l.status === 'DRAFT').length,
    archived: listings.filter(l => l.status === 'ARCHIVED' || l.status === 'INACTIVE').length,
  };

  if (isLoading) {
    return <StateBlock variant="loading" title="Loading dashboard" description="Fetching provider listing counts." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Provider"
        title="Dashboard Overview"
        description="Get a quick glance at listing performance and approval statuses."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Total Listings" value={stats.total} icon={Layers} color="bg-blue-100 text-blue-600" />
        <StatCard title="Active Listings" value={stats.active} icon={Activity} color="bg-green-100 text-green-600" />
        <StatCard title="Pending Review" value={stats.pending} icon={Clock} color="bg-yellow-100 text-yellow-600" />
        <StatCard title="Rejected" value={stats.rejected} icon={Ban} color="bg-red-100 text-red-600" />
        <StatCard title="Drafts" value={stats.draft} icon={FileText} color="bg-gray-100 text-gray-600" />
        <StatCard title="Archived/Inactive" value={stats.archived} icon={Archive} color="bg-purple-100 text-purple-600" />
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color }: any) => (
  <Card>
    <CardContent className="p-6 flex items-center gap-4">
      <div className={`p-4 rounded-full ${color}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <h4 className="text-2xl font-bold text-gray-900">{value}</h4>
      </div>
    </CardContent>
  </Card>
);
