export type AdminUserRole = 'CUSTOMER' | 'PROVIDER' | 'ADMIN';
export type AdminUserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'BANNED';

export interface AdminUser {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  roles: string[];
  primaryRole: AdminUserRole;
  status: AdminUserStatus;
  banned: boolean;
  bannedAt?: string;
  banReasonCode?: string;
  banReason?: string;
  verified: boolean;
  createdAt: string;
  lastActiveAt?: string;
  bookingCount: number;
}

export interface BanUserRequest {
  reasonCode: string;
  reason: string;
  internalNote?: string;
}

export interface AdminUserStatistics {
  totalUsers: number;
  activeUsers: number;
  newUsersLast30Days: number;
  verifiedUsers: number;
  bannedUsers: number;
  customers: number;
  providers: number;
  admins: number;
}

export interface AdminUserSearchParams {
  page?: number;
  size?: number;
  sort?: string;
  keyword?: string;
  role?: AdminUserRole;
  status?: AdminUserStatus;
  verified?: boolean;
  joinedFrom?: string;
  joinedTo?: string;
}
