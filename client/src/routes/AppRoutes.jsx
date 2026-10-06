import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import RootLayout from '../layouts/RootLayout';
import AdminLayout from '../layouts/AdminLayout';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import Loading from '../components/Loading';

// Eagerly loaded primary landing page
import HomePage from '../pages/HomePage';

// Lazy loaded public and customer pages
const ShowroomsPage = lazy(() => import('../pages/ShowroomsPage'));
const ShowroomDetailPage = lazy(() => import('../pages/ShowroomDetailPage'));
const BikesPage = lazy(() => import('../pages/BikesPage'));
const BikeDetailPage = lazy(() => import('../pages/BikeDetailPage'));
const ComparePage = lazy(() => import('../pages/ComparePage'));
const LoginPage = lazy(() => import('../pages/LoginPage'));
const RegisterPage = lazy(() => import('../pages/RegisterPage'));
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const OffersPage = lazy(() => import('../pages/OffersPage'));
const OfferDetailPage = lazy(() => import('../pages/OfferDetailPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

// Lazy loaded administrative console pages
const AdminPage = lazy(() => import('../pages/AdminPage'));
const AdminBrandsPage = lazy(() => import('../pages/admin/AdminBrandsPage'));
const AdminCitiesPage = lazy(() => import('../pages/admin/AdminCitiesPage'));
const AdminShowroomsPage = lazy(() => import('../pages/admin/AdminShowroomsPage'));
const AdminBikesPage = lazy(() => import('../pages/admin/AdminBikesPage'));
const AdminLeadsPage = lazy(() => import('../pages/admin/AdminLeadsPage'));
const AdminReviewsPage = lazy(() => import('../pages/admin/AdminReviewsPage'));

const PageFallback = () => (
  <div className="flex items-center justify-center min-h-[40vh] w-full py-12">
    <Loading text="Loading..." size="md" />
  </div>
);

const AppRoutes = () => {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        {/* Protected Admin Routes with Dedicated Admin Chrome */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<AdminPage />} />
            <Route path="brands" element={<AdminBrandsPage />} />
            <Route path="cities" element={<AdminCitiesPage />} />
            <Route path="showrooms" element={<AdminShowroomsPage />} />
            <Route path="bikes" element={<AdminBikesPage />} />
            <Route path="leads" element={<AdminLeadsPage />} />
            <Route path="reviews" element={<AdminReviewsPage />} />
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
    </Suspense>
  );
};

export default AppRoutes;
