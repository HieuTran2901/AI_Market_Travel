import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import Sidebar from './Sidebar';

export const Layout: React.FC = () => {
  const location = useLocation();
  const path = location.pathname;

  const isAdminRoute = path.startsWith('/admin');
  const isProviderRoute = path.startsWith('/provider');
  const hasSidebar = isAdminRoute || isProviderRoute;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground transition-colors duration-300">
      <Navbar />

      <div className="flex flex-1">
        {isAdminRoute && <Sidebar role="admin" />}
        {isProviderRoute && <Sidebar role="provider" />}

        <main className={`flex-1 ${hasSidebar ? 'p-6 lg:p-8' : 'mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8'}`}>
          <div className="animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>

      {!hasSidebar && <Footer />}
    </div>
  );
};
export default Layout;
