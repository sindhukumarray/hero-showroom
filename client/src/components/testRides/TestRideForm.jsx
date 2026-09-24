import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calendar, Clock, CheckCircle2, AlertCircle, LogIn, Building2, Bike as BikeIcon, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { testRideService, showroomService, bikeService } from '../../services';
import Button from '../Button';
import Input from '../Input';
import Card from '../Card';
import Badge from '../Badge';

// RFC 5322 email regex and phone regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+]?[0-9\s-]{7,20}$/;
const TIME_REGEX = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;

// Pre-defined convenient showroom test ride time slots
const TIME_SLOTS = [
  '10:00',
  '11:30',
  '14:00',
  '15:30',
  '17:00',
  '18:30'
];

/**
 * Reusable Test Ride Booking Form Component
 * Connects vehicle test ride scheduling with POST /api/test-rides
 */
const TestRideForm = ({
  bike: initialBike = null,
  showroom: initialShowroom = null,
  variant: initialVariant = null,
  onSuccess,
  onCancel,
  className = ''
}) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  // Extract ID or object
  const bikeId = initialBike?._id || (typeof initialBike === 'string' ? initialBike : '');
  const showroomId = initialShowroom?._id || (typeof initialShowroom === 'string' ? initialShowroom : '');
  const variantId = initialVariant?._id || (typeof initialVariant === 'string' ? initialVariant : '');

  // Calculate default future date (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = tomorrow.toISOString().split('T')[0];
  const minDateStr = new Date().toISOString().split('T')[0];

  // Form State
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    showroom: showroomId,
    bike: bikeId,
    variant: variantId,
    preferredDate: defaultDateStr,
    preferredTime: '11:30',
    notes: ''
  });

  const [availableShowrooms, setAvailableShowrooms] = useState([]);
  const [availableBikes, setAvailableBikes] = useState([]);
  const [availableVariants, setAvailableVariants] = useState([]);
  const [loadingLookups, setLoadingLookups] = useState(false);

  const [formErrors, setFormErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdTestRide, setCreatedTestRide] = useState(null);

  // Sync user defaults when auth state is restored
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || user.name || '',
        email: prev.email || user.email || '',
        phone: prev.phone || user.phone || ''
      }));
    }
  }, [user]);

  // Load fallback showrooms or bikes if missing from props
  useEffect(() => {
    let isMounted = true;
    const loadLookups = async () => {
      if (showroomId && bikeId) return;

      try {
        setLoadingLookups(true);
        if (!showroomId) {
          const brandId = initialBike?.brand?._id || initialBike?.brand;
          const params = brandId ? { brand: brandId, limit: 50 } : { limit: 50 };
          const res = await showroomService.getShowrooms(params);
          if (isMounted && res?.data) {
            setAvailableShowrooms(res.data);
            if (res.data.length > 0 && !formData.showroom) {
              setFormData((prev) => ({ ...prev, showroom: res.data[0]._id }));
            }
          }
        }
        if (!bikeId) {
          const brandId = initialShowroom?.brand?._id || initialShowroom?.brand;
          const params = brandId ? { brand: brandId, limit: 50 } : { limit: 50 };
          const res = await bikeService.getBikes(params);
          if (isMounted && res?.data) {
            setAvailableBikes(res.data);
            if (res.data.length > 0 && !formData.bike) {
              setFormData((prev) => ({ ...prev, bike: res.data[0]._id }));
            }
          }
        }
      } catch {
        // Fallback gracefully
      } finally {
        if (isMounted) setLoadingLookups(false);
      }
    };

    loadLookups();
    return () => {
      isMounted = false;
    };
  }, [showroomId, bikeId, initialBike, initialShowroom]);

  // Handle field change
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: null }));
    }
    if (apiError) setApiError(null);
  };

  // Client-side validation
  const validate = () => {
    const errors = {};

    if (!formData.name || formData.name.trim().length < 2) {
      errors.name = 'Full name must be at least 2 characters.';
    } else if (formData.name.trim().length > 60) {
      errors.name = 'Full name cannot exceed 60 characters.';
    }

    if (!formData.email || !formData.email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!EMAIL_REGEX.test(formData.email.trim())) {
      errors.email = 'Please provide a valid email address.';
    }

    if (formData.phone && formData.phone.trim()) {
      if (!PHONE_REGEX.test(formData.phone.trim())) {
        errors.phone = 'Please provide a valid phone number (7-20 digits).';
      }
    }

    if (!formData.showroom) {
      errors.showroom = 'Please select a dealership showroom.';
    }

    if (!formData.bike) {
      errors.bike = 'Please select a motorcycle model.';
    }

    if (!formData.preferredDate) {
      errors.preferredDate = 'Please select a preferred test ride date.';
    } else {
      const selectedDate = new Date(formData.preferredDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (isNaN(selectedDate.getTime()) || selectedDate < today) {
        errors.preferredDate = 'Preferred date cannot be in the past.';
      }
    }

    if (!formData.preferredTime || !TIME_REGEX.test(formData.preferredTime.trim())) {
      errors.preferredTime = 'Preferred time must be in HH:mm format (e.g. 11:30, 15:00).';
    }

    if (formData.notes && formData.notes.length > 500) {
      errors.notes = 'Notes cannot exceed 500 characters.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) return;
    if (!validate() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setApiError(null);

      // Clean payload strictly omitting client-side identity or status overrides
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        showroom: formData.showroom,
        bike: formData.bike,
        variant: formData.variant || undefined,
        preferredDate: formData.preferredDate,
        preferredTime: formData.preferredTime.trim(),
        notes: formData.notes.trim()
      };

      const res = await testRideService.createTestRide(payload);
      const testRide = res?.data?.testRide || res?.testRide || res?.data;

      setCreatedTestRide(testRide);
      setIsSuccess(true);
      if (onSuccess) onSuccess(testRide);
    } catch (err) {
      setApiError(err?.message || 'Failed to schedule test ride. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Unauthenticated Gate
  if (!isAuthenticated) {
    const redirectUrl = `/login?redirect=${encodeURIComponent(location.pathname + location.search)}`;
    return (
      <Card variant="elevated" className={`p-6 text-center space-y-4 ${className}`}>
        <div className="w-12 h-12 rounded-full bg-brand-red/10 border border-brand-red/30 flex items-center justify-center mx-auto text-brand-red">
          <LogIn className="w-6 h-6" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <h4 className="typography-h3 text-surface-50 font-bold">Sign In Required</h4>
          <p className="typography-small text-muted-foreground text-xs max-w-sm mx-auto">
            Please sign in to your showroom account to book vehicle test rides and inspect demo bikes in person.
          </p>
        </div>
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to={redirectUrl} className="w-full sm:w-auto">
            <Button variant="primary" size="md" icon={LogIn} fullWidth>
              Sign In to Book Test Ride
            </Button>
          </Link>
          {onCancel && (
            <Button variant="ghost" size="md" onClick={onCancel} fullWidth className="sm:w-auto">
              Cancel
            </Button>
          )}
        </div>
      </Card>
    );
  }

  // Success Confirmation State
  if (isSuccess) {
    return (
      <Card variant="elevated" className={`p-6 md:p-8 text-center space-y-5 border-emerald-800/60 ${className}`}>
        <div className="w-14 h-14 rounded-full bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
          <CheckCircle2 className="w-8 h-8" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <Badge variant="success" size="sm">
            Request Logged
          </Badge>
          <h4 className="typography-h2 text-surface-50 font-bold text-xl md:text-2xl">
            Test Ride Requested!
          </h4>
          <p className="typography-small text-muted-foreground text-xs md:text-sm max-w-md mx-auto">
            Your preferred test ride schedule has been sent to the dealership. An authorized representative will confirm vehicle availability and slot details at{' '}
            <span className="text-surface-100 font-medium">{formData.email}</span>.
          </p>
        </div>

        <div className="p-4 rounded-lg bg-surface-950 border border-border/80 text-left text-xs space-y-2 max-w-md mx-auto">
          {createdTestRide?.bike?.name && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Motorcycle:</span>
              <span className="text-surface-100 font-medium">{createdTestRide.bike.name}</span>
            </div>
          )}
          {createdTestRide?.showroom?.name && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Dealership:</span>
              <span className="text-surface-100 font-medium">{createdTestRide.showroom.name}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Schedule:</span>
            <span className="text-surface-100 font-medium">
              {formData.preferredDate} at {formData.preferredTime}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status:</span>
            <span className="text-amber-400 font-medium capitalize">{createdTestRide?.status || 'Requested'}</span>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/dashboard" className="w-full sm:w-auto">
            <Button variant="primary" size="md" fullWidth>
              View in Dashboard
            </Button>
          </Link>
          {onCancel && (
            <Button variant="secondary" size="md" onClick={onCancel} fullWidth className="sm:w-auto">
              Close
            </Button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className={`space-y-5 ${className}`}>
      {/* API Level Error Banner */}
      {apiError && (
        <div
          role="alert"
          className="p-3.5 rounded-lg bg-rose-950/50 border border-rose-800 text-rose-200 text-xs flex items-start gap-2.5"
        >
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{apiError}</span>
        </div>
      )}

      {/* Context Summary Pill */}
      {(initialBike || initialShowroom) && (
        <div className="p-3 rounded-lg bg-surface-950 border border-border/80 text-xs flex flex-wrap items-center gap-3">
          {initialBike?.name && (
            <span className="flex items-center gap-1.5 text-surface-200">
              <BikeIcon className="w-3.5 h-3.5 text-brand-red" aria-hidden="true" />
              <span>Model: <strong>{initialBike.name}</strong></span>
            </span>
          )}
          {initialShowroom?.name && (
            <span className="flex items-center gap-1.5 text-surface-200">
              <Building2 className="w-3.5 h-3.5 text-brand-red" aria-hidden="true" />
              <span>Hub: <strong>{initialShowroom.name}</strong></span>
            </span>
          )}
          {initialVariant?.name && (
            <span className="text-muted-foreground">
              Trim: <strong className="text-surface-200">{initialVariant.name}</strong>
            </span>
          )}
        </div>
      )}

      {/* Showroom Selector (if not prefilled) */}
      {!showroomId && (
        <div className="space-y-1.5">
          <label htmlFor="testride-showroom-select" className="block typography-label text-surface-200">
            Select Showroom <span className="text-brand-red">*</span>
          </label>
          <select
            id="testride-showroom-select"
            value={formData.showroom}
            onChange={(e) => handleChange('showroom', e.target.value)}
            disabled={isSubmitting || loadingLookups}
            className="w-full bg-background-elevated border border-border text-surface-100 rounded-card px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
          >
            <option value="">Choose an authorized dealership...</option>
            {availableShowrooms.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name} ({s.city?.name || s.showroomType || 'Showroom'})
              </option>
            ))}
          </select>
          {formErrors.showroom && (
            <p className="typography-small text-xs text-rose-400 mt-1">{formErrors.showroom}</p>
          )}
        </div>
      )}

      {/* Bike Selector (if not prefilled) */}
      {!bikeId && (
        <div className="space-y-1.5">
          <label htmlFor="testride-bike-select" className="block typography-label text-surface-200">
            Select Motorcycle Model <span className="text-brand-red">*</span>
          </label>
          <select
            id="testride-bike-select"
            value={formData.bike}
            onChange={(e) => handleChange('bike', e.target.value)}
            disabled={isSubmitting || loadingLookups}
            className="w-full bg-background-elevated border border-border text-surface-100 rounded-card px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
          >
            <option value="">Choose a motorcycle model...</option>
            {availableBikes.map((b) => (
              <option key={b._id} value={b._id}>
                {b.name} ({b.category})
              </option>
            ))}
          </select>
          {formErrors.bike && (
            <p className="typography-small text-xs text-rose-400 mt-1">{formErrors.bike}</p>
          )}
        </div>
      )}

      {/* Date & Time Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="testride-date" className="block typography-label text-surface-200">
            Preferred Date <span className="text-brand-red">*</span>
          </label>
          <div className="relative">
            <input
              id="testride-date"
              type="date"
              min={minDateStr}
              value={formData.preferredDate}
              onChange={(e) => handleChange('preferredDate', e.target.value)}
              disabled={isSubmitting}
              className="w-full bg-background-elevated border border-border text-surface-100 rounded-card px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
            />
          </div>
          {formErrors.preferredDate && (
            <p className="typography-small text-xs text-rose-400 mt-1">{formErrors.preferredDate}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="testride-time-select" className="block typography-label text-surface-200">
            Preferred Time Slot <span className="text-brand-red">*</span>
          </label>
          <select
            id="testride-time-select"
            value={formData.preferredTime}
            onChange={(e) => handleChange('preferredTime', e.target.value)}
            disabled={isSubmitting}
            className="w-full bg-background-elevated border border-border text-surface-100 rounded-card px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
          >
            {TIME_SLOTS.map((slot) => (
              <option key={slot} value={slot}>
                {slot} hrs
              </option>
            ))}
          </select>
          {formErrors.preferredTime && (
            <p className="typography-small text-xs text-rose-400 mt-1">{formErrors.preferredTime}</p>
          )}
        </div>
      </div>

      {/* Rider Contact Information */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          id="testride-name"
          label="Rider Name"
          required
          placeholder="e.g. Rahul Sharma"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          error={formErrors.name}
          disabled={isSubmitting}
        />

        <Input
          id="testride-email"
          label="Email Address"
          type="email"
          required
          placeholder="e.g. rahul@example.com"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          error={formErrors.email}
          disabled={isSubmitting}
        />
      </div>

      <Input
        id="testride-phone"
        label="Phone Number"
        type="tel"
        placeholder="e.g. 9876543210 (Optional)"
        value={formData.phone}
        onChange={(e) => handleChange('phone', e.target.value)}
        error={formErrors.phone}
        disabled={isSubmitting}
        helperText="Required by dealership to confirm gate entry and helmet availability"
      />

      {/* Notes Field */}
      <div className="space-y-1.5">
        <label htmlFor="testride-notes" className="block typography-label text-surface-200">
          Special Notes or Requests <span className="text-muted-foreground text-xs">(Optional)</span>
        </label>
        <textarea
          id="testride-notes"
          rows={2}
          maxLength={500}
          placeholder="e.g. Highway trial preference, passenger pillion ride, pillion helmet request..."
          value={formData.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          disabled={isSubmitting}
          className="w-full bg-background-elevated border border-border text-surface-100 placeholder-muted-foreground rounded-card p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red resize-none"
        />
        <div className="flex justify-between text-[11px] text-muted-foreground">
          <span>{formErrors.notes && <span className="text-rose-400">{formErrors.notes}</span>}</span>
          <span>{formData.notes.length}/500</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 flex items-center justify-end gap-3">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          size="md"
          icon={isSubmitting ? Loader2 : Calendar}
          disabled={isSubmitting}
          className={isSubmitting ? 'cursor-wait opacity-80' : ''}
        >
          {isSubmitting ? 'Scheduling...' : 'Request Test Ride'}
        </Button>
      </div>
    </form>
  );
};

export default TestRideForm;
