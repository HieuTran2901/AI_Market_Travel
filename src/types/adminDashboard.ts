export interface AdminDashboardOverview {
  totalUsers: number;
  activeListings: number;
  totalBookings: number;
  totalRevenue: number;
  currency: string;
  totalProviders: number;
  generatedAt: string;
}

export interface AdminDashboardBookingsOverview {
  range: string;
  total: number;
  changePercentage: number;
  points: Array<{
    date: string;
    count: number;
  }>;
}

export interface AdminDashboardUserGrowth {
  range: string;
  totalUsers: number;
  newUsers: number;
  changePercentage: number;
  points: Array<{
    date: string;
    newUsers: number;
    cumulativeUsers: number;
  }>;
}

export interface AdminDashboardSystemHealth {
  api: 'UP' | 'DOWN' | 'UNKNOWN' | string;
  database: 'UP' | 'DOWN' | 'UNKNOWN' | string;
  storage: 'UP' | 'DOWN' | 'UNKNOWN' | string;
  jobs: 'UP' | 'DOWN' | 'UNKNOWN' | string;
  lastCheckedAt: string;
}

export interface AdminDashboardRecentBooking {
  id: number;
  bookingNumber: string;
  customerName: string;
  listingTitle: string;
  status: string;
  total: number;
  currency: string;
  createdAt: string;
}
