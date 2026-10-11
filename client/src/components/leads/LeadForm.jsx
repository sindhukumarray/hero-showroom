import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Send, CheckCircle2, AlertCircle, LogIn, Building2, Bike as BikeIcon, Loader2, Tag } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { leadService, showroomService, bikeService } from '../../services';
import Button from '../Button';
import Input from '../Input';
import Card from '../Card';
import Badge from '../Badge';

// Simplified RFC 5322 regex for client-side feedback
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+]?[0-9\s-]{7,20}$/;

/**
 * Reusable Lead & Enquiry Form Component
 * Connects contextual showroom and motorcycle inquiries with POST /api/leads
 */
const LeadForm = ({
  showroom: initialShowroom = null,
  bike: initialBike = null,
  variant: initialVariant = null,
  offer: initialOffer = null,
  source = 'showroom',
  onSuccess,
  onCancel,
  className = ''
}) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  // Resolve contextual entities (can derive from offer if passed)
  const resolvedBike = initialBike || (initialOffer?.bike && typeof initialOffer.bike === 'object' ? initialOffer.bike : null);
  const resolvedShowroom = initialShowroom || (initialOffer?.showroom && typeof initialOffer.showroom === 'object' ? initialOffer.showroom : null);
  const resolvedVariant = initialVariant || (initialOffer?.variant && typeof initialOffer.variant === 'object' ? initialOffer.variant : null);

  // Extract ID or object
  const showroomId = resolvedShowroom?._id || (typeof resolvedShowroom === 'string' ? resolvedShowroom : (initialOffer?.showroom?._id || (typeof initialOffer?.showroom === 'string' ? initialOffer.showroom : '')));
  const bikeId = resolvedBike?._id || (typeof resolvedBike === 'string' ? resolvedBike : (initialOffer?.bike?._id || (typeof initialOffer?.bike === 'string' ? initialOffer.bike : '')));
  const variantId = resolvedVariant?._id || (typeof resolvedVariant === 'string' ? resolvedVariant : (initialOffer?.variant?._id || (typeof initialOffer?.variant === 'string' ? initialOffer.variant : '')));
  const offerId = initialOffer?._id || (typeof initialOffer === 'string' ? initialOffer : '');

  // Form State
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    showroom: showroomId,
    bike: bikeId,
    variant: variantId,
    offer: offerId,
    message: ''
  });

  const [availableShowrooms, setAvailableShowrooms] = useState([]);
  const [availableBikes, setAvailableBikes] = useState([]);
  const [loadingLookups, setLoadingLookups] = useState(false);

  const [formErrors, setFormErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdLead, setCreatedLead] = useState(null);

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
      errors.showroom = 'Please select a showroom.';
    }

    if (!formData.bike) {
      errors.bike = 'Please select a motorcycle model.';
    }

    if (formData.message && formData.message.length > 500) {
      errors.message = 'Enquiry message cannot exceed 500 characters.';
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
        offer: formData.offer || undefined,
        source,
        message: formData.message.trim()
      };

      const res = await leadService.createLead(payload);
      const lead = res?.data?.lead || res?.lead || res?.data;

      setCreatedLead(lead);
      setIsSuccess(true);
      if (onSuccess) onSuccess(lead);
    } catch (err) {
      setApiError(err?.message || 'Failed to submit enquiry. Please check your connection and try again.');
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
            Please sign in to your showroom account to connect directly with authorized dealership specialists.
          </p>
        </div>
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to={redirectUrl} className="w-full sm:w-auto">
            <Button variant="primary" size="md" icon={LogIn} fullWidth>
              Sign In to Enquire
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
            Enquiry Transmitted
          </Badge>
          <h4 className="typography-h2 text-surface-50 font-bold text-xl md:text-2xl">
            Enquiry Received!
          </h4>
          <p className="typography-small text-muted-foreground text-xs md:text-sm max-w-md mx-auto">
            Your enquiry has been routed to the authorized showroom team. A product specialist will contact you at{' '}
            <span className="text-surface-100 font-medium">{formData.email}</span> with delivery timelines and quotes.
          </p>
        </div>

        <div className="p-4 rounded-lg bg-surface-950 border border-border/80 text-left text-xs space-y-2 max-w-md mx-auto">
          {(createdLead?.offer?.title || initialOffer?.title) && (
            <div className="flex justify-between items-center text-amber-400">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" /> Offer:
              </span>
              <span className="font-semibold">{createdLead?.offer?.title || initialOffer.title}</span>
            </div>
          )}
          {createdLead?.showroom?.name && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Showroom:</span>
              <span className="text-surface-100 font-medium">{createdLead.showroom.name}</span>
            </div>
          )}
          {createdLead?.bike?.name && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Model:</span>
              <span className="text-surface-100 font-medium">{createdLead.bike.name}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Initial Status:</span>
            <span className="text-emerald-400 font-medium capitalize">{createdLead?.status || 'New'}</span>
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
      {(initialBike || initialShowroom || initialOffer) && (
        <div className="p-3 rounded-lg bg-surface-950 border border-border/80 text-xs flex flex-wrap items-center gap-3">
          {initialOffer?.title && (
            <span className="flex items-center gap-1.5 text-amber-300">
              <Tag className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
              <span>Offer: <strong>{initialOffer.title}</strong></span>
            </span>
          )}
          {initialShowroom?.name && (
            <span className="flex items-center gap-1.5 text-surface-200">
              <Building2 className="w-3.5 h-3.5 text-brand-red" aria-hidden="true" />
              <span>Showroom: <strong>{initialShowroom.name}</strong></span>
            </span>
          )}
          {initialBike?.name && (
            <span className="flex items-center gap-1.5 text-surface-200">
              <BikeIcon className="w-3.5 h-3.5 text-brand-red" aria-hidden="true" />
              <span>Model: <strong>{initialBike.name}</strong></span>
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
          <label htmlFor="lead-showroom-select" className="block typography-label text-surface-200">
            Select Showroom <span className="text-brand-red">*</span>
          </label>
          <select
            id="lead-showroom-select"
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
          <label htmlFor="lead-bike-select" className="block typography-label text-surface-200">
            Select Motorcycle Model <span className="text-brand-red">*</span>
          </label>
          <select
            id="lead-bike-select"
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

      {/* Contact Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          id="lead-name"
          label="Full Name"
          required
          placeholder="e.g. er_sindhu"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          error={formErrors.name}
          disabled={isSubmitting}
        />

        <Input
          id="lead-email"
          label="Email Address"
          type="email"
          required
          placeholder="e.g. er_sindhu@heroshowroom.com"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          error={formErrors.email}
          disabled={isSubmitting}
        />
      </div>

      <Input
        id="lead-phone"
        label="Phone Number"
        type="tel"
        placeholder="e.g. 7479524973 (Optional)"
        value={formData.phone}
        onChange={(e) => handleChange('phone', e.target.value)}
        error={formErrors.phone}
        disabled={isSubmitting}
        helperText="Used only for callback scheduling and official quotation dispatch"
      />

      {/* Message Field */}
      <div className="space-y-1.5">
        <label htmlFor="lead-message" className="block typography-label text-surface-200">
          Enquiry Details or Questions <span className="text-muted-foreground text-xs">(Optional)</span>
        </label>
        <textarea
          id="lead-message"
          rows={3}
          maxLength={500}
          placeholder="Ask about on-road pricing, festival offers, booking status, or color availability..."
          value={formData.message}
          onChange={(e) => handleChange('message', e.target.value)}
          disabled={isSubmitting}
          className="w-full bg-background-elevated border border-border text-surface-100 placeholder-muted-foreground rounded-card p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red resize-none"
        />
        <div className="flex justify-between text-[11px] text-muted-foreground">
          <span>{formErrors.message && <span className="text-rose-400">{formErrors.message}</span>}</span>
          <span>{formData.message.length}/500</span>
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
          icon={isSubmitting ? Loader2 : Send}
          disabled={isSubmitting}
          className={isSubmitting ? 'cursor-wait opacity-80' : ''}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Enquiry'}
        </Button>
      </div>
    </form>
  );
};

export default LeadForm;
