import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import ProtectedRoute from './ProtectedRoute';

// Pages
import Home from '@/pages/customer/Home';
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import Profile from '@/pages/customer/Profile';

// Unauthorized component inline for simplicity
const Unauthorized: React.FC = () => (
  <div className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center text-center p-4">
    <span className="text-6xl mb-4">🛡️</span>
    <h1 className="text-3xl font-extrabold text-foreground">Access Denied</h1>
    <p className="text-muted-foreground mt-2 max-w-sm text-sm">
      You do not have the required permissions to view this resource. Please contact administrator if you think this is a mistake.
    </p>
  </div>
);

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Protected Routes (Require Authentication) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<Profile />} />
          
          {/* Dashboard Placeholders for future phases */}
          <Route path="/admin" element={
            <div className="space-y-4">
              <h1 className="text-2xl font-bold">Admin Portal</h1>
              <p className="text-muted-foreground">Admin functions will be implemented in Phase 6.</p>
            </div>
          } />
          
          <Route path="/provider" element={
            <div className="space-y-4">
              <h1 className="text-2xl font-bold">Partner Dashboard</h1>
              <p className="text-muted-foreground">Partner functions will be implemented in Phase 2 & 6.</p>
            </div>
          } />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
