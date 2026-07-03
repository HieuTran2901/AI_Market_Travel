import React, { useState } from 'react';
import { Bot, MapPin, Calendar, Loader2, Sparkles } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { PageHeader } from '../../../components/ui/PageHeader';
import { StateBlock } from '../../../components/ui/StateBlock';
import { aiService } from '../../../services/aiService';
import { TripPlanResponse } from '../../../types/ai';

export const TripPlannerPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [destination, setDestination] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [plan, setPlan] = useState<TripPlanResponse | null>(null);

  const handlePlanTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination || !query) return;

    setIsLoading(true);
    try {
      const result = await aiService.planTrip({
        naturalLanguageQuery: query,
        destination,
        durationDays: 3,
        totalBudget: 1000,
        groupSize: 2
      });
      setPlan(result);
    } catch (error) {
      console.error('Failed to plan trip:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Card className="border-0 bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg">
        <CardContent className="p-8 sm:p-10">
          <Bot className="w-14 h-14 mb-5 opacity-90" />
          <PageHeader
            eyebrow="AI Planner"
            title="Build a trip itinerary"
            description="Describe the trip you want and the backend AI planner will shape a day-by-day itinerary from marketplace context."
            className="text-white [&_h1]:text-white [&_p]:text-blue-100"
          />
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <form onSubmit={handlePlanTrip} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="pl-10 w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 py-2.5 border"
                    placeholder="e.g., Da Nang, Vietnam"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trip Description</label>
                <div className="relative">
                  <Sparkles className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-10 w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 py-2.5 border"
                    placeholder="A relaxing beach holiday with some cultural tours..."
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-xl font-medium flex items-center gap-2">
                {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <Bot className="w-5 h-5" />}
                {isLoading ? 'Crafting Itinerary...' : 'Generate Trip Plan'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {plan ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="border-0 shadow-sm bg-blue-50/50">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Trip to {plan.destination}</h2>
                  <p className="text-gray-600 leading-relaxed max-w-3xl">{plan.aiSummary}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 font-medium">Estimated Budget</p>
                  <p className="text-3xl font-bold text-blue-600">${plan.totalEstimatedBudget}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {plan.itinerary.map((day) => (
              <Card key={day.dayNumber} className="border-0 shadow-sm overflow-hidden">
                <div className="bg-gray-50 px-6 py-3 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-500" /> Day {day.dayNumber}: {day.theme}
                  </h3>
                </div>
                <CardContent className="p-0">
                  <div className="divide-y divide-gray-100">
                    {day.activities.map((act, idx) => (
                      <div key={idx} className="p-6 flex gap-6 hover:bg-gray-50/50 transition-colors">
                        <div className="w-24 flex-shrink-0 text-sm font-semibold text-gray-500 pt-1">
                          {act.time}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-900">{act.listingName}</h4>
                          <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 my-1">
                            {act.type}
                          </span>
                          <p className="text-gray-600 mt-1">{act.description}</p>
                        </div>
                        {act.estimatedCost && act.estimatedCost > 0 && (
                          <div className="flex-shrink-0 text-right">
                            <span className="font-medium text-gray-900">${act.estimatedCost}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : !isLoading && (
        <StateBlock
          title="No itinerary generated yet"
          description="Add a destination and trip description to generate a plan."
        />
      )}
    </div>
  );
};
