import React, { useState } from 'react';
import { 
  Users, Calendar, CreditCard, RefreshCcw, 
  Settings, Server, Activity, Sparkles, MapPin, List
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';

export const AdminDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'infrastructure' | 'intelligence'>('overview');

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Platform Control Center</h1>
          <p className="text-gray-500 mt-1">Monitor marketplace health and operational metrics</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'overview' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Overview
          </button>
          <button 
            onClick={() => setActiveTab('intelligence')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'intelligence' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Intelligence
          </button>
          <button 
            onClick={() => setActiveTab('infrastructure')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'infrastructure' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Infrastructure
          </button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Activity className="text-blue-500" /> Business Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Active Users" value="12,450" change="+12%" icon={<Users />} color="text-blue-600" bg="bg-blue-50" />
            <StatCard title="Total Bookings" value="3,842" change="+5%" icon={<Calendar />} color="text-emerald-600" bg="bg-emerald-50" />
            <StatCard title="Total Revenue" value="$450.2k" change="+18%" icon={<CreditCard />} color="text-indigo-600" bg="bg-indigo-50" />
            <StatCard title="Active Providers" value="452" change="+2%" icon={<Settings />} color="text-orange-600" bg="bg-orange-50" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Recent Bookings</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="font-medium text-gray-900">Booking #BK-00{i}</p>
                        <p className="text-sm text-gray-500">Da Nang City Tour</p>
                      </div>
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">CONFIRMED</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Recent Settlements</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1,2,3].map(i => (
                    <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="font-medium text-gray-900">Provider #{100+i}</p>
                        <p className="text-sm text-gray-500">Payout ID: ST-{i}89</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">${(i*120).toFixed(2)}</p>
                        <span className="text-xs text-blue-600 font-medium">COMPLETED</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'intelligence' && (
        <div className="space-y-6 animate-in fade-in">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Sparkles className="text-amber-500" /> Platform Intelligence</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="w-5 h-5" /> Top Destinations</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex justify-between items-center"><span className="text-gray-700">Da Nang, VN</span><span className="font-bold text-blue-600">45%</span></li>
                  <li className="flex justify-between items-center"><span className="text-gray-700">Hoi An, VN</span><span className="font-bold text-blue-600">30%</span></li>
                  <li className="flex justify-between items-center"><span className="text-gray-700">Hue, VN</span><span className="font-bold text-blue-600">15%</span></li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><List className="w-5 h-5" /> Top Listings</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="text-sm">
                    <p className="font-medium text-gray-900 line-clamp-1">Luxury Beachfront Villa</p>
                    <p className="text-gray-500">240 bookings</p>
                  </li>
                  <li className="text-sm">
                    <p className="font-medium text-gray-900 line-clamp-1">Hoi An Lantern Tour</p>
                    <p className="text-gray-500">195 bookings</p>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Bot className="w-5 h-5" /> AI Usage (Daily)</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Trip Plans</span>
                      <span className="font-bold">1,240</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2"><div className="bg-indigo-500 h-2 rounded-full w-[70%]"></div></div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Recommendations</span>
                      <span className="font-bold">4,800</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2"><div className="bg-amber-500 h-2 rounded-full w-[90%]"></div></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'infrastructure' && (
        <div className="space-y-6 animate-in fade-in">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Server className="text-slate-600" /> Infrastructure Health</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-l-4 border-l-emerald-500">
              <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500 uppercase tracking-wider">API Health</CardTitle></CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <span className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></span> Healthy
                </p>
                <p className="text-sm text-gray-500 mt-2">Uptime: 99.98%</p>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500 uppercase tracking-wider">Cache Hit Rate</CardTitle></CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-gray-900">84.2%</p>
                <p className="text-sm text-gray-500 mt-2">Provider: LocalCache</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-indigo-500">
              <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500 uppercase tracking-wider">Storage Usage</CardTitle></CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-gray-900">45 GB</p>
                <p className="text-sm text-gray-500 mt-2">Provider: Local Disk</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><RefreshCcw className="w-5 h-5 text-gray-500" /> Scheduled Jobs</CardTitle></CardHeader>
              <CardContent>
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50 rounded-t-lg">
                    <tr>
                      <th className="px-6 py-3">Job Name</th>
                      <th className="px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">BookingExpiryJob</td>
                      <td className="px-6 py-4"><span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">COMPLETED</span></td>
                    </tr>
                    <tr className="border-b border-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">PaymentExpiryJob</td>
                      <td className="px-6 py-4"><span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">COMPLETED</span></td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 font-medium text-gray-900">SettlementJob</td>
                      <td className="px-6 py-4"><span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">COMPLETED</span></td>
                    </tr>
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Settings className="w-5 h-5 text-gray-500" /> Module Status</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-700">AI Provider</span>
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">ONLINE</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-700">Notifications</span>
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">ONLINE</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-700">Scheduler</span>
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">ONLINE</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-700">Storage Layer</span>
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">ONLINE</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

    </div>
  );
};

const StatCard = ({ title, value, change, icon, color, bg }: any) => (
  <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
    <CardContent className="p-6">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl ${bg} ${color}`}>
          {icon}
        </div>
      </div>
      <div className="mt-4">
        <span className="text-emerald-600 text-sm font-bold bg-emerald-50 px-2 py-1 rounded-md">{change}</span>
        <span className="text-gray-400 text-sm ml-2">vs last month</span>
      </div>
    </CardContent>
  </Card>
);

// Simple Lucide icon placeholder if not already imported above
const Bot = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>
  </svg>
);
