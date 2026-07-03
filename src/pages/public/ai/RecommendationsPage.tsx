import React, { useState } from 'react';
import { MapPin, DollarSign, Loader2, Star } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { PageHeader } from '../../../components/ui/PageHeader';
import { StateBlock } from '../../../components/ui/StateBlock';
import { aiService } from '../../../services/aiService';
import { RecommendationResponse } from '../../../types/ai';

export const RecommendationsPage: React.FC = () => {
  const [destination, setDestination] = useState('');
  const [budget, setBudget] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<RecommendationResponse | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination) return;

    setIsLoading(true);
    try {
      const res = await aiService.getRecommendations({
        destination,
        budgetPerPerson: budget ? Number(budget) : undefined,
        groupSize: 2
      });
      setResponse(res);
    } catch (error) {
      console.error('Failed to get recommendations', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <Card>
        <CardContent className="p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <PageHeader
          eyebrow="AI"
          title="Smart Recommendations"
          description="Get personalized, ranked suggestions based on your destination, budget, and travel style."
        />
        
        <form onSubmit={handleSearch} className="grid w-full grid-cols-1 gap-3 sm:grid-cols-[1fr_9rem_auto] lg:w-auto">
          <div className="relative">
            <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              required
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Where to?"
              className="pl-10 w-full border-gray-300 rounded-lg py-2 border focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
          <div className="relative">
            <DollarSign className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="Budget"
              className="pl-10 w-full border-gray-300 rounded-lg py-2 border focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
          <Button type="submit" disabled={isLoading} className="bg-amber-500 hover:bg-amber-600 text-white rounded-lg px-6">
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Find'}
          </Button>
        </form>
      </div>
        </CardContent>
      </Card>

      {response && (
        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-5 text-amber-900">
            <p className="font-medium leading-relaxed">{response.aiSummary}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {response.recommendations.map((rec) => (
              <Card key={rec.listing?.id || rec.rank} className="overflow-hidden flex flex-col h-full hover:shadow-lg transition-shadow border-0 shadow-md">
                <div className="relative h-48 bg-gray-200">
                  {rec.listing?.coverImageUrl ? (
                    <img src={rec.listing.coverImageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200" />
                  )}
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-bold text-gray-900 shadow-sm flex items-center gap-1">
                    #{rec.rank} Match
                  </div>
                  <div className="absolute top-3 right-3 bg-amber-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-sm">
                    {rec.score}% Fit
                  </div>
                </div>
                
                <CardContent className="p-5 flex-1 flex flex-col">
                  <div className="mb-2">
                    <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">{rec.listing?.category || 'HOTEL'}</span>
                  </div>
                  <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-1">{rec.listing?.title || 'Amazing Listing'}</h3>
                  
                  <div className="flex items-center gap-1 text-sm text-gray-600 mb-3">
                    <Star className="w-4 h-4 text-amber-400 fill-current" />
                    <span className="font-medium text-gray-900">{rec.listing?.averageRating || '4.8'}</span>
                    <span>({rec.listing?.reviewCount || '120'} reviews)</span>
                  </div>

                  <div className="mt-auto pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-600 italic line-clamp-3">"{rec.reasoning}"</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {!response && !isLoading && (
        <StateBlock
          title="No recommendations yet"
          description="Enter a destination and optional budget to ask the backend AI recommendation endpoint for ranked listings."
          className="bg-white"
        />
      )}
    </div>
  );
};
