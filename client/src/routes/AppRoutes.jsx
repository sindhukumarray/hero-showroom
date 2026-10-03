import React from 'react';
import { Routes, Route } from 'react-router-dom';
import RootLayout from '../layouts/RootLayout';
import HomePage from '../pages/HomePage';
import ShowroomsPage from '../pages/ShowroomsPage';
import ShowroomDetailPage from '../pages/ShowroomDetailPage';
import BikesPage from '../pages/BikesPage';
import BikeDetailPage from '../pages/BikeDetailPage';
import ComparePage from '../pages/ComparePage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import DashboardPage from '../pages/DashboardPage';
import AdminPage from '../pages/AdminPage';
import AdminBrandsPage from '../pages/admin/AdminBrandsPage';
import AdminCitiesPage from '../pages/admin/AdminCitiesPage';
import AdminShowroomsPage from '../pages/admin/AdminShowroomsPage';
import AdminBikesPage from '../pages/admin/AdminBikesPage';
import NotFoundPage from '../pages/NotFoundPage';
import OffersPage from '../pages/OffersPage';
import OfferDetailPage from '../pages/OfferDetailPage';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import AdminLayout from '../layouts/AdminLayout';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Protected Admin Routes with Dedicated Admin Chrome */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<AdminPage />} />
          <Route path="brands" element={<AdminBrandsPage />} />
          <Route path="cities" element={<AdminCitiesPage />} />
          <Route path="showrooms" element={<AdminShowroomsPage />} />
          <Route path="bikes" element={<AdminBikesPage />} />
        </Route>
      </Route>

      {/* Public & Customer Routes inside RootLayout */}
      <Route path="/" element={<RootLayout />}>
        {/* Public Routes */}
        <Route index element={<HomePage />} />
        <Route path="showrooms" element={<ShowroomsPage />} />
        <Route path="showrooms/:slug" element={<ShowroomDetailPage />} />
        <Route path="bikes" element={<BikesPage />} />
        <Route path="bikes/:slug" element={<BikeDetailPage />} />
        <Route path="offers" element={<OffersPage />} />
        <Route path="offers/:id" element={<OfferDetailPage />} />
        <Route path="compare" element={<ComparePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />

        {/* Protected Customer Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="dashboard" element={<DashboardPage />} />
        </Route>

        {/* Catch-all 404 Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
