import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import { ScrollToTop } from "./routes/ScrollToTop";
import { PublicLayout } from "./components/layout/PublicLayout";
import { MarketplaceHome } from "./pages/public/MarketplaceHome";
import { SearchPage } from "./pages/public/SearchPage";
import { ListingDetail } from "./pages/public/ListingDetail";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

import { ProviderLayout } from "./components/layout/ProviderLayout";
import { ProviderOverview } from "./pages/provider/ProviderOverview";
import { MyListings } from "./pages/provider/MyListings";
import { ProviderProfile } from "./pages/provider/ProviderProfile";
import { CreateListingPage } from "./pages/provider/wizard";
import { ProviderSettlementsPage } from "./pages/provider/ProviderSettlementsPage";

import { CheckoutPage } from "./pages/customer/CheckoutPage";
import { CartPage } from "./pages/customer/CartPage";
import { PaymentHistoryPage, PaymentDetailPage } from "./pages/customer/PaymentPages";
import { RefundRequestPage, RefundDetailPage } from "./pages/customer/RefundPages";
import Profile from "./pages/customer/Profile";

import { TripPlannerPage } from "./pages/public/ai/TripPlannerPage";
import { RecommendationsPage } from "./pages/public/ai/RecommendationsPage";
import { AiAssistantPage } from "./pages/public/ai/AiAssistantPage";
import { AdminDashboardPage } from "./pages/admin/AdminDashboardPage";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<PublicLayout />}>
              <Route index element={<MarketplaceHome />} />
              <Route path="search" element={<SearchPage />} />
              <Route path="listings/:slug" element={<ListingDetail />} />
              <Route path="ai/planner" element={<TripPlannerPage />} />
              <Route path="ai/recommendations" element={<RecommendationsPage />} />
              <Route path="ai/assistant" element={<AiAssistantPage />} />
            </Route>

            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route element={<ProtectedRoute allowedRoles={["ROLE_ADMIN"]} />}>
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route path="/provider" element={<ProviderLayout />}>
                <Route index element={<Navigate to="/provider/dashboard" replace />} />
                <Route path="dashboard" element={<ProviderOverview />} />
                <Route path="listings" element={<MyListings />} />
                <Route path="listings/new" element={<CreateListingPage />} />
                <Route path="settlements" element={<ProviderSettlementsPage />} />
                <Route path="profile" element={<ProviderProfile />} />
              </Route>

              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/payments/history" element={<PaymentHistoryPage />} />
              <Route path="/payments/:id" element={<PaymentDetailPage />} />
              <Route path="/refunds/request" element={<RefundRequestPage />} />
              <Route path="/refunds/:id" element={<RefundDetailPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
