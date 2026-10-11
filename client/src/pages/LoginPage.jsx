import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, AlertCircle } from 'lucide-react';
import { pageTransition, getAccessibleVariant } from '../animations/variants';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { useSEO } from '../hooks/useSEO';
import { useAuth } from '../context/AuthContext';
import Container from '../components/Container';
import Badge from '../components/Badge';
import Input from '../components/Input';
import Button from '../components/Button';

/**
 * Customer & Admin Login Page
 * Connects to real JWT authentication API with client-side validation and accessible feedback.
 */
const LoginPage = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const shouldReduceMotion = usePrefersReducedMotion();
  const accessiblePageTransition = getAccessibleVariant(pageTransition, shouldReduceMotion);

  useSEO({
    title: 'Customer & Dealer Sign In',
    description: 'Access your saved bikes, booked test rides, and showroom dashboard.'
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const returnPath = location.state?.from?.pathname || '/dashboard';
      navigate(returnPath, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const validate = () => {
    const errors = {};
    const emailRegex = /^\S+@\S+\.\S+$/;

    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    if (formErrors[id]) {
      setFormErrors((prev) => ({ ...prev, [id]: undefined }));
    }
    if (apiError) {
      setApiError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    setApiError(null);

    try {
      await login({
        email: formData.email,
        password: formData.password
      });

      const returnPath = location.state?.from?.pathname || '/dashboard';
      navigate(returnPath, { replace: true });
    } catch (err) {
      const errorMessage =
        err?.message ||
        (err?.errors && err.errors[0]?.message) ||
        'Unable to sign in. Please verify your credentials.';
      setApiError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container className="py-14 md:py-20">
      <motion.div
        variants={accessiblePageTransition}
        initial="initial"
        animate="animate"
        exit="exit"
        className="max-w-md mx-auto"
      >
        <div className="glass-surface p-8 md:p-10 rounded-card border border-border shadow-card-dark space-y-6">
          <div className="text-center space-y-2">
            <Badge variant="brand" size="sm" dot>
              Portal Access
            </Badge>
            <h1 className="typography-h2 text-surface-50">Welcome Back</h1>
            <p className="typography-small">Sign in to manage test rides and showroom operations.</p>
          </div>

          {apiError && (
            <div
              role="alert"
              aria-live="polite"
              className="p-3.5 rounded-card bg-rose-950/40 border border-rose-800/80 text-rose-200 text-xs flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{apiError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Input
              id="email"
              type="email"
              label="Email Address"
              required
              placeholder="er_sindhu@heroshowroom.com"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              error={formErrors.email}
              disabled={isSubmitting}
              icon={Mail}
            />

            <Input
              id="password"
              type="password"
              label="Password"
              required
              placeholder="••••••••"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              error={formErrors.password}
              disabled={isSubmitting}
              icon={Lock}
            />

            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="md"
              loading={isSubmitting}
              icon={LogIn}
              className="mt-2"
            >
              Sign In
            </Button>
          </form>

          <div className="pt-4 border-t border-border/80 text-center">
            <p className="typography-small text-xs text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link
                to="/register"
                className="text-brand-red font-semibold hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-red rounded"
              >
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </Container>
  );
};

export default LoginPage;
