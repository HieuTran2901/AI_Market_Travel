import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { aiService } from '@/services/aiService';
import { useAuth } from '@/context/AuthContext';

const formatMoney = (value?: number, currency = 'VND') => {
  if (value === undefined || value === null) return 'Estimate unavailable';
  try {
    return new Intl.NumberFormat(currency === 'VND' ? 'vi-VN' : 'en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${value.toLocaleString()} ${currency}`;
  }
};

export const TripDetailPage = () => {
  const { slug = '' } = useParams();
  const { user } = useAuth();
  const { data: trip, isLoading } = useQuery({
    queryKey: ['trip-detail', user?.id, slug],
    queryFn: () => aiService.getTrip(slug),
    enabled: Boolean(user?.id && slug),
  });

  if (isLoading) {
    return <main className="min-h-screen bg-slate-50 p-8"><div className="mx-auto h-96 max-w-5xl animate-pulse rounded-3xl bg-white" /></main>;
  }
  if (!trip) {
    return <main className="min-h-screen bg-slate-50 p-8"><div className="mx-auto max-w-5xl rounded-2xl bg-white p-8">Trip not found.</div></main>;
  }
  const activityTotal = trip.days
    ?.flatMap((day) => day.activities || [])
    .reduce((sum, activity) => sum + (activity.estimatedCost || 0), 0) ?? 0;
  const estimatedCost = trip.estimatedCost && trip.estimatedCost > 0 ? trip.estimatedCost : activityTotal;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="h-72 bg-slate-300">
        {trip.heroImageUrl ? <img src={trip.heroImageUrl} alt={trip.title} className="h-full w-full object-cover" /> : null}
      </div>
      <div className="mx-auto -mt-16 max-w-5xl px-4 pb-10">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
          <Link to="/my-trips" className="text-sm font-bold text-blue-600">Back to My Trips</Link>
          <h1 className="mt-3 text-3xl font-black text-slate-950">{trip.title}</h1>
          <p className="mt-2 text-slate-600">{trip.summary}</p>
          <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-xl bg-slate-50 p-3">{trip.destination}</div>
            <div className="rounded-xl bg-slate-50 p-3">{trip.durationText}</div>
            <div className="rounded-xl bg-slate-50 p-3">{trip.travelerCount || 1} travelers</div>
            <div className="rounded-xl bg-slate-50 p-3">{formatMoney(estimatedCost || undefined, trip.currency)}</div>
            <div className="rounded-xl bg-slate-50 p-3">{trip.status}</div>
          </div>
        </section>
        <section className="mt-5 grid gap-4">
          {trip.days?.map((day) => (
            <article key={day.dayNumber} className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="text-xl font-black text-slate-950">Day {day.dayNumber}: {day.title}</h2>
              <p className="mt-1 text-slate-600">{day.summary}</p>
              <div className="mt-4 grid gap-3">
                {day.activities?.map((activity, index) => (
                  <div key={`${activity.timeOfDay}-${index}`} className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase text-blue-600">{activity.timeOfDay}</p>
                    <p className="mt-1 font-bold text-slate-950">{activity.title}</p>
                    <p className="text-sm text-slate-600">{activity.description}</p>
                    {activity.listingSlug ? <Link to={`/listings/${activity.listingSlug}`} className="mt-2 inline-flex text-sm font-bold text-blue-600">View listing</Link> : null}
                  </div>
                ))}
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
};
