import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-border bg-card text-card-foreground">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <img
              src="/brand/ai-marketplace-traveler-logo.png"
              alt="AI Marketplace Traveler"
              className="h-14 w-auto max-w-[240px] object-contain"
            />
            <p className="mt-4 text-sm text-muted-foreground max-w-sm">
              Discover and book unique experiences, hotels, tours, and culinary adventures. Planned and optimized by modern artificial intelligence.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Explore</h3>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Hotels & Homestays</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Tours & Activities</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Local Guides</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Car & Bike Rentals</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Platform</h3>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Become a Partner</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">API Documentation</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} AI Travel Marketplace. All rights reserved.
          </p>
          <div className="flex space-x-6 text-xs text-muted-foreground">
            <span className="hover:text-primary cursor-pointer">English (US)</span>
            <span className="hover:text-primary cursor-pointer">VND (₫)</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
export default Footer;
