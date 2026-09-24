import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Container from '../Container';
import Loading from '../Loading';

/**
 * Frontend Route Protection Component
 * Enforces authentication and optional role authorization for private routes.
 *
 * @param {object} props
 * @param {string[]} [props.allowedRoles] Optional array of allowed roles (e.g. ['admin'])
 * @param {React.ReactNode} [props.children] Optional nested child elements
 */
const ProtectedRoute = ({ allowedRoles, children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <Container className="py-24 flex items-center justify-center min-h-[50vh]">
        <Loading text="Authenticating session..." size="lg" />
      </Container>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && Array.isArray(allowedRoles) && (!user?.role || !allowedRoles.includes(user.role))) {
    return <Navigate to="/" replace />;
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
