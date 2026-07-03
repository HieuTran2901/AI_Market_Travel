import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listingService } from '@/services/listingService';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { StateBlock } from '@/components/ui/StateBlock';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Edit, Trash2, Eye, PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const MyListings: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = React.useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['my-listings', page],
    queryFn: () => listingService.getMyListings({ page, size: 10 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => listingService.deleteListing(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
    },
  });

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this listing?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Provider"
        title="My Listings"
        description="Manage marketplace listings, review status, and keep your catalog ready for bookings."
        actions={
        <Button onClick={() => navigate('/provider/listings/new')}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create New Listing
        </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Listing
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8">
                      <div className="space-y-3">
                        {[1, 2, 3].map((row) => (
                          <div key={row} className="h-12 animate-pulse rounded-lg bg-gray-100" />
                        ))}
                      </div>
                    </td>
                  </tr>
                ) : data?.data?.content?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8">
                      <StateBlock
                        title="No listings yet"
                        description="Create your first listing to start accepting marketplace bookings."
                        actionLabel="Create Listing"
                        onAction={() => navigate('/provider/listings/new')}
                        className="border-0 shadow-none"
                      />
                    </td>
                  </tr>
                ) : (
                  data?.data?.content?.map((listing) => (
                    <tr key={listing.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                            {listing.coverImageUrl ? (
                              <img className="h-10 w-10 object-cover" src={listing.coverImageUrl} alt="" />
                            ) : (
                              <span className="h-full w-full flex items-center justify-center text-gray-400">Img</span>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 truncate max-w-xs">{listing.title}</div>
                            <div className="text-sm text-gray-500">{listing.city}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {listing.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {listing.basePrice.toLocaleString()} {listing.currency}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge kind="listing" status={listing.status} />
                        {listing.status === 'REJECTED' && (
                          <div className="text-xs text-red-500 mt-1 max-w-[150px] truncate" title={listing.rejectionReason}>
                            {listing.rejectionReason}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <Button variant="ghost" size="icon" title="View Public Page" onClick={() => window.open(`/listings/${listing.slug}`, '_blank')}>
                            <Eye className="h-4 w-4 text-gray-500" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Edit" onClick={() => navigate(`/provider/listings/${listing.id}/edit`)}>
                            <Edit className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Delete" onClick={() => handleDelete(listing.id)} disabled={deleteMutation.isPending}>
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          {data?.data && data.data.totalPages > 1 && (
            <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-700">
                Page {page + 1} of {data.data.totalPages}
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.min(data.data.totalPages - 1, p + 1))}
                disabled={page >= data.data.totalPages - 1}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
