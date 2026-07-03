import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useListingWizard } from '@/context/ListingWizardContext';
import { Button } from '@/components/ui/Button';
import { listingService } from '@/services/listingService';
import { CreateListingRequest } from '@/types/listing';

export const Step5Review: React.FC = () => {
  const navigate = useNavigate();
  const { formData, prevStep, resetForm } = useListingWizard();
  
  const createMutation = useMutation({
    mutationFn: (data: CreateListingRequest) => listingService.createListing(data),
    onSuccess: () => {
      alert('Listing created successfully!');
      resetForm();
      navigate('/provider/listings');
    },
    onError: (error: any) => {
      alert(`Failed to create listing: ${error.message || 'Unknown error'}`);
    }
  });

  const handleSubmit = () => {
    // Force cast to full request since we have collected all required parts
    const payload = { ...formData } as CreateListingRequest;
    createMutation.mutate(payload);
    
    // In a real app, if submitForReview is true, we might immediately call 
    // changeStatus to 'PENDING_REVIEW' after creation, or include it in the Create request.
    // For now, the backend defaults to DRAFT.
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {formData.coverImageUrl && (
          <img src={formData.coverImageUrl} alt="Cover" className="w-full h-48 object-cover" />
        )}
        <div className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{formData.title}</h2>
              <p className="text-sm text-gray-500 mt-1">{formData.city}, {formData.country}</p>
            </div>
            <div className="text-xl font-bold text-blue-600">
              {formData.basePrice?.toLocaleString()} {formData.currency}
            </div>
          </div>
          
          <div className="mt-4">
            <h4 className="font-semibold text-gray-900 text-sm">Category</h4>
            <p className="text-gray-700">{formData.category}</p>
          </div>

          <div className="mt-4">
            <h4 className="font-semibold text-gray-900 text-sm">Description</h4>
            <p className="text-gray-700 whitespace-pre-wrap text-sm mt-1">{formData.description || formData.shortDesc}</p>
          </div>

          <div className="mt-4">
            <h4 className="font-semibold text-gray-900 text-sm">Category Specific Details</h4>
            <pre className="bg-gray-50 p-3 rounded-md text-xs mt-1 overflow-x-auto text-gray-700">
              {JSON.stringify(formData.details, null, 2)}
            </pre>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={prevStep} disabled={createMutation.isPending}>
          Previous
        </Button>
        <div className="space-x-3">
          <Button 
            type="button" 
            variant="secondary" 
            onClick={handleSubmit}
            disabled={createMutation.isPending}
          >
            Save as Draft
          </Button>
          <Button 
            type="button" 
            onClick={handleSubmit}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? 'Submitting...' : 'Submit for Review'}
          </Button>
        </div>
      </div>
    </div>
  );
};
