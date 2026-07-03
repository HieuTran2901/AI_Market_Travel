import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, User, ShieldAlert, Award } from 'lucide-react';

interface SidebarProps {
  role: 'admin' | 'provider';
}

export const Sidebar: React.FC<SidebarProps> = ({ role }) => {
  const links = role === 'admin' 
    ? [
        { to: '/admin', label: 'Overview', icon: LayoutDashboard },
        { to: '/admin/providers', label: 'Providers Queue', icon: ShieldAlert },
        { to: '/admin/users', label: 'Users List', icon: User },
      ]
    : [
        { to: '/provider', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/provider/listings', label: 'My Listings', icon: Award },
        { to: '/provider/bookings', label: 'Bookings', icon: User },
      ];

  return (
    <aside className="w-64 border-r border-border bg-card text-card-foreground hidden md:flex flex-col h-[calc(100vh-4rem)] sticky top-16">
      <div className="flex-1 py-6 px-4 space-y-1">
        <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          {role === 'admin' ? 'Admin Portal' : 'Partner Dashboard'}
        </p>
        
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </div>
    </aside>
  );
};
export default Sidebar;
