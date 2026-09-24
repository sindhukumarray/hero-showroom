import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Phone, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { pageTransition, getAccessibleVariant } from '../animations/variants';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { useSEO } from '../hooks/useSEO';
import { useAuth } from '../context/AuthContext';
import Container from '../components/Container';
import Badge from '../components/Badge';
import Input from '../components/Input';
import Button from '../components/Button';

/**
 * Customer Registration Page
 * Connects to real registration API with client-side validation and accessible feedback.
 */
const RegisterPage = () => {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const shouldReduceMotion = usePrefersReducedMotion();
  const accessiblePageTransition = getAccessibleVariant(pageTransition, shouldReduceMotion);

  useSEO({
    title: 'Create an Account',
    description: 'Register to unlock personalized recommendations, test ride scheduling, and dealer portal tools.'
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const validate = () => {
    const errors = {};
    const emailRegex = /^\S+@\S+\.\S+$/;

    if (!formData.name.trim()) {
      errors.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    } else if (formData.name.trim().length > 60) {
      errors.name = 'Name cannot exceed 60 characters';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters long';
    } else if (formData.password.length > 128) {
      errors.password = 'Password cannot exceed 128 characters';
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
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone
      });

      setIsSuccess(true);
    } catch (err) {
      const errorMessage =
        err?.message ||
        (err?.errors && err.errors[0]?.message) ||
        'Unable to complete registration. Please try again.';
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
              Membership
            </Badge>
            <h1 className="typography-h2 text-surface-50">Create Account</h1>
            <p className="typography-small">Join the premium automotive discovery network.</p>
          </div>

          {isSuccess ? (
            <div className="p-6 rounded-card bg-emerald-950/40 border border-emerald-800 text-center space-y-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" aria-hidden="true" />
              <div className="space-y-1">
                <h3 className="typography-h3 text-surface-50">Registration Successful!</h3>
                <p className="typography-small text-emerald-200 text-xs">
                  Your customer account has been created. You can now sign in with your credentials.
                </p>
              </div>
              <Link to="/login" className="block pt-2">
                <Button variant="primary" fullWidth size="md">
                  Proceed to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <>
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
                  id="name"
                  type="text"
                  label="Full Name"
                  required
                  placeholder="Aarav Sharma"
                  autoComplete="name"
                  value={formData.name}
                  onChange={handleChange}
                  error={formErrors.name}
                  disabled={isSubmitting}
                  icon={User}
                />

                <Input
                  id="email"
                  type="email"
                  label="Email Address"
                  required
                  placeholder="rider@example.com"
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
                  placeholder="Minimum 8 characters"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  error={formErrors.password}
                  disabled={isSubmitting}
                  icon={Lock}
                />

                <Input
                  id="phone"
                  type="tel"
                  label="Phone Number (Optional)"
                  placeholder="+91 98765 43210"
                  autoComplete="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  error={formErrors.phone}
                  disabled={isSubmitting}
                  icon={Phone}
                />

                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  size="md"
                  loading={isSubmitting}
                  icon={UserPlus}
                  className="mt-2"
                >
                  Create Account
                </Button>
              </form>

              <div className="pt-4 border-t border-border/80 text-center">
                <p className="typography-small text-xs text-muted-foreground">
                  Already have an account?{' '}
                  <Link
                    to="/login"
                    className="text-brand-red font-semibold hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-red rounded"
                  >
                    Sign In
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </Container>
  );
};

export default RegisterPage;
