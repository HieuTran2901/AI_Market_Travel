import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { providerService } from '@/services/providerService';
import { ProviderUpdateRequest } from '@/types/provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export const ProviderProfile: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['provider-profile'],
    queryFn: () => providerService.getMyProfile(),
  });

  const { register, handleSubmit, reset } = useForm<ProviderUpdateRequest>();

  React.useEffect(() => {
    if (data?.data) {
      reset(data.data);
    }
  }, [data, reset]);

  const updateMutation = useMutation({
    mutationFn: (updateData: ProviderUpdateRequest) => providerService.updateMyProfile(updateData),
    onSuccess: (res) => {
      alert("Profile updated successfully!");
      reset(res.data);
    },
    onError: (err: any) => {
      alert(err?.message || "Failed to update profile");
    }
  });

  const onSubmit = (formData: ProviderUpdateRequest) => {
    updateMutation.mutate(formData);
  };

  if (isLoading) return <div>Loading...</div>;

  const profile = data?.data;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Provider Profile</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your business information and banking details.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-blue-800">Account Status</h3>
          <p className="text-xs text-blue-600 mt-1">Your current verification status with the marketplace.</p>
        </div>
        <div>
          {profile?.verificationStatus === 'APPROVED' && <Badge variant="success">Approved</Badge>}
          {profile?.verificationStatus === 'PENDING' && <Badge variant="warning">Pending Review</Badge>}
          {profile?.verificationStatus === 'REJECTED' && <Badge variant="destructive">Rejected</Badge>}
          {profile?.verificationStatus === 'SUSPENDED' && <Badge variant="destructive">Suspended</Badge>}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Business Name</Label>
                <Input {...register('businessName')} />
              </div>
              <div className="space-y-2">
                <Label>Business Type</Label>
                <Input disabled value={profile?.businessType || ''} className="bg-gray-50" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Description</Label>
                <Textarea {...register('description')} rows={3} placeholder="Tell customers about your business..." />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input {...register('phone')} />
              </div>
              <div className="space-y-2">
                <Label>Website</Label>
                <Input {...register('website')} type="url" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Street Address</Label>
              <Input {...register('address')} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>City / Province</Label>
                <Input {...register('city')} />
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Input {...register('country')} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Banking & Tax Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tax Code</Label>
                <Input {...register('taxCode')} />
              </div>
              <div className="space-y-2">
                <Label>Bank Name</Label>
                <Input {...register('bankName')} />
              </div>
              <div className="space-y-2">
                <Label>Account Name</Label>
                <Input {...register('bankAccountName')} />
              </div>
              <div className="space-y-2">
                <Label>Account Number</Label>
                <Input {...register('bankAccountNumber')} />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
};
