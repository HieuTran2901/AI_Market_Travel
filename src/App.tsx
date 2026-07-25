import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/AuthContext";
import { AuthenticationGateProvider } from "@/context/AuthenticationGateContext";
import { AiCoinsModalProvider } from "@/context/AiCoinsModalContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import { ScrollToTop } from "./routes/ScrollToTop";
import { PublicLayout } from "./components/layout/PublicLayout";
import { MarketplaceHomeRedesign } from "./pages/public/MarketplaceHomeRedesign";
import { SearchPage } from "./pages/public/SearchPage";
import { ListingDetail } from "./pages/public/ListingDetail";
import AuthPage from "./pages/auth/AuthPage";

import { ProviderLayout } from "./components/layout/ProviderLayout";
import { ProviderOverview } from "./pages/provider/ProviderOverview";
import { MyListings } from "./pages/provider/MyListings";
import { ProviderProfile } from "./pages/provider/ProviderProfile";
import { CreateListingPage, EditListingPage } from "./pages/provider/wizard";
import { ProviderSettlementsPage } from "./pages/provider/ProviderSettlementsPage";
import { ProviderBookingsPage } from "./pages/provider/ProviderBookingsPage";
import { ProviderReviewsPage } from "./pages/provider/ProviderReviewsPage";
import { ProviderMessagesPage } from "./pages/provider/ProviderMessagesPage";
import { ProviderAnalyticsPage } from "./pages/provider/ProviderAnalyticsPage";
import { ProviderSettingsPage } from "./pages/provider/ProviderSettingsPage";

import { CheckoutPage } from "./pages/customer/CheckoutPage";
import { CartPage } from "./pages/customer/CartPage";
import {
  PaymentHistoryPage,
  PaymentDetailPage,
  MomoReturnPage,
} from "./pages/customer/PaymentPages";
import {
  RefundRequestPage,
  RefundDetailPage,
} from "./pages/customer/RefundPages";
import Profile from "./pages/customer/Profile";
import { MyTripsPage } from "./pages/customer/MyTripsPage";
import { TripDetailPage } from "./pages/customer/TripDetailPage";

import { TripPlannerPage } from "./pages/public/ai/TripPlannerPage";
import { RecommendationsPage } from "./pages/public/ai/RecommendationsPage";
import { AiAssistantPage } from "./pages/public/ai/AiAssistantPage";
import { UpgradeExperiencePage } from "./pages/public/upgrade/UpgradeExperiencePage";
import {
  ChallengePlaceholderPage,
} from "./pages/public/challenges/ChallengePlaceholderPage";
import { LuckyWheelPage } from "./pages/public/challenges/LuckyWheelPage";
import { RewardRedemptionPage } from "./pages/public/challenges/RewardRedemptionPage";
import { MissionsPage } from "./pages/public/challenges/MissionsPage";
import { PaymentResultPage } from "./pages/public/ai-coins/PaymentResultPage";
import { AdminDashboardPage } from "./pages/admin/AdminDashboardPage";
import { AdminUsersPage } from "./pages/admin/AdminUsersPage";
import { AdminProvidersPage } from "./pages/admin/AdminProvidersPage";
import { AdminListingsPage } from "./pages/admin/AdminListingsPage";
import { TravelAiChat } from "./components/ai/TravelAiChat";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AuthenticationGateProvider>
            <AiCoinsModalProvider>
              <ScrollToTop />
          <Routes>
            <Route path="/" element={<PublicLayout />}>
              <Route index element={<MarketplaceHomeRedesign />} />
              <Route path="search" element={<SearchPage />} />
              <Route path="listings/:slug" element={<ListingDetail />} />
              <Route path="ai/planner" element={<TripPlannerPage />} />
              <Route
                path="ai/recommendations"
                element={<RecommendationsPage />}
              />
              <Route path="ai/assistant" element={<AiAssistantPage />} />
              <Route path="ai-coins" element={<UpgradeExperiencePage />} />
              <Route path="ai-coins/payment-result" element={<PaymentResultPage />} />
              <Route path="membership" element={<UpgradeExperiencePage />} />
              <Route path="challenges" element={<ChallengePlaceholderPage />} />
              <Route
                path="challenges/lucky-wheel"
                element={<LuckyWheelPage />}
              />
              <Route
                path="challenges/missions"
                element={<MissionsPage />}
              />
              <Route
                path="challenges/games"
                element={<ChallengePlaceholderPage kind="games" />}
              />
              <Route
                path="challenges/rewards"
                element={<RewardRedemptionPage />}
              />
            </Route>

            <Route path="/login" element={<AuthPage initialMode="login" />} />
            <Route path="/register" element={<AuthPage initialMode="register" />} />

            <Route element={<ProtectedRoute allowedRoles={["ROLE_ADMIN"]} />}>
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/providers" element={<AdminProvidersPage />} />
              <Route path="/admin/listings" element={<AdminListingsPage />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route path="/provider" element={<ProviderLayout />}>
                <Route
                  index
                  element={<Navigate to="/provider/dashboard" replace />}
                />
                <Route path="dashboard" element={<ProviderOverview />} />
                <Route path="listings" element={<MyListings />} />
                <Route path="listings/new" element={<CreateListingPage />} />
                <Route path="listings/:id/edit" element={<EditListingPage />} />
                <Route path="bookings" element={<ProviderBookingsPage />} />
                <Route
                  path="settlements"
                  element={<ProviderSettlementsPage />}
                />
                <Route path="reviews" element={<ProviderReviewsPage />} />
                <Route path="messages" element={<ProviderMessagesPage />} />
                <Route path="analytics" element={<ProviderAnalyticsPage />} />
                <Route path="profile" element={<ProviderProfile />} />
                <Route path="settings" element={<ProviderSettingsPage />} />
              </Route>

              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/my-trips" element={<MyTripsPage />} />
              <Route path="/trips/:slug" element={<TripDetailPage />} />
              <Route
                path="/payments/history"
                element={<PaymentHistoryPage />}
              />
              <Route path="/payments/momo/return" element={<MomoReturnPage />} />
              <Route path="/payments/:id" element={<PaymentDetailPage />} />
              <Route path="/refunds/request" element={<RefundRequestPage />} />
              <Route path="/refunds/:id" element={<RefundDetailPage />} />
            </Route>
          </Routes>
          <TravelAiChat />
            </AiCoinsModalProvider>
          </AuthenticationGateProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
