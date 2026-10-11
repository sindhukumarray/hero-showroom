import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Check,
  ShieldAlert,
  Navigation,
  Phone,
  Mail,
  Clock,
  Sparkles,
  ExternalLink,
  MapPin,
  Layers
} from 'lucide-react';
import { pageTransition, getAccessibleVariant } from '../../animations/variants';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { useSEO } from '../../hooks/useSEO';
import { adminService } from '../../services';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';

const SHOWROOM_TYPES = [
  'Standard Dealership',
  'Premia Flagship',
  'Experience Center',
  'Service Hub'
];

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const AdminShowroomsPage = () => {
  const shouldReduceMotion = usePrefersReducedMotion();
  const accessiblePageTransition = getAccessibleVariant(pageTransition, shouldReduceMotion);

  useSEO({
    title: 'Showroom Management | Admin Console',
    description: 'Manage physical dealership outlets, flagship lounges, brand associations, and locations.'
  });

  // Data states
  const [showrooms, setShowrooms] = useState([]);
  const [brands, setBrands] = useState([]);
  const [cities, setCities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [brandFilter, setBrandFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [feedback, setFeedback] = useState(null);

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingShowroom, setEditingShowroom] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    brand: '',
    city: '',
    dealerName: '',
    showroomType: 'Standard Dealership',
    fullAddress: '',
    street: '',
    area: '',
    pincode: '',
    phone: '',
    alternatePhone: '',
    email: '',
    website: '',
    latitude: '',
    longitude: '',
    openingHoursText: '9:00 AM - 8:00 PM',
    daysOpen: 'Monday to Sunday',
    facilities: 'Test Rides Available, Authorized Service',
    exteriorImage: '',
    isVerified: false,
    isActive: true
  });

  // Delete / Deactivate Confirmation Modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load Brand and City Lookups
  const loadLookups = useCallback(async () => {
    try {
      const [brandsRes, citiesRes] = await Promise.all([
        adminService.getBrands({ limit: 100 }),
        adminService.getCities({ limit: 100 })
      ]);
      setBrands(brandsRes?.data || []);
      setCities(citiesRes?.data || []);
    } catch (err) {
      console.error('Failed to load brand/city lookup options:', err);
    }
  }, []);

  // Fetch Showrooms
  const fetchShowrooms = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const params = { limit: 100 };
      if (search.trim()) params.search = search.trim();
      if (brandFilter !== 'all') params.brand = brandFilter;
      if (cityFilter !== 'all') params.city = cityFilter;
      if (typeFilter !== 'all') params.showroomType = typeFilter;
      if (statusFilter !== 'all') params.isActive = statusFilter;

      const res = await adminService.getShowrooms(params);
      setShowrooms(res?.data || []);
    } catch (err) {
      setError(err?.message || 'Failed to load showroom directory.');
    } finally {
      setIsLoading(false);
    }
  }, [search, brandFilter, cityFilter, typeFilter, statusFilter]);

  useEffect(() => {
    loadLookups();
  }, [loadLookups]);

  useEffect(() => {
    fetchShowrooms();
  }, [fetchShowrooms]);

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback(null);
    }, 4500);
  };

  const handleOpenCreateModal = () => {
    setEditingShowroom(null);
    setFormData({
      name: '',
      slug: '',
      brand: brands.length > 0 ? brands[0]._id : '',
      city: cities.length > 0 ? cities[0]._id : '',
      dealerName: '',
      showroomType: 'Standard Dealership',
      fullAddress: '',
      street: '',
      area: '',
      pincode: '',
      phone: '',
      alternatePhone: '',
      email: '',
      website: '',
      latitude: '',
      longitude: '',
      openingHoursText: '9:00 AM - 8:00 PM',
      daysOpen: 'Monday to Sunday',
      facilities: 'Test Rides Available, Authorized Service',
      exteriorImage: '',
      isVerified: false,
      isActive: true
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (showroom) => {
    setEditingShowroom(showroom);
    setFormData({
      name: showroom.name || '',
      slug: showroom.slug || '',
      brand: showroom.brand?._id || showroom.brand || '',
      city: showroom.city?._id || showroom.city || '',
      dealerName: showroom.dealerName || '',
      showroomType: showroom.showroomType || 'Standard Dealership',
      fullAddress: showroom.address?.fullAddress || '',
      street: showroom.address?.street || '',
      area: showroom.address?.area || '',
      pincode: showroom.address?.pincode || '',
      phone: showroom.contact?.phone || '',
      alternatePhone: showroom.contact?.alternatePhone || '',
      email: showroom.contact?.email || '',
      website: showroom.contact?.website || '',
      latitude:
        showroom.location?.coordinates && showroom.location.coordinates[1] !== undefined
          ? String(showroom.location.coordinates[1])
          : '',
      longitude:
        showroom.location?.coordinates && showroom.location.coordinates[0] !== undefined
          ? String(showroom.location.coordinates[0])
          : '',
      openingHoursText: showroom.openingHours?.displayText || '9:00 AM - 8:00 PM',
      daysOpen: showroom.openingHours?.daysOpen || 'Monday to Sunday',
      facilities: Array.isArray(showroom.facilities)
        ? showroom.facilities.join(', ')
        : 'Test Rides Available, Authorized Service',
      exteriorImage: showroom.images?.exterior || '',
      isVerified: Boolean(showroom.isVerified),
      isActive: Boolean(showroom.isActive)
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  const handleNameChange = (e) => {
    const newName = e.target.value;
    if (!editingShowroom) {
      setFormData((prev) => ({
        ...prev,
        name: newName,
        slug: slugify(newName)
      }));
    } else {
      setFormData((prev) => ({ ...prev, name: newName }));
    }
  };

  const validateForm = () => {
    const errs = {};
    if (!formData.name.trim()) {
      errs.name = 'Showroom name is required';
    } else if (formData.name.trim().length < 2 || formData.name.trim().length > 150) {
      errs.name = 'Showroom name must be between 2 and 150 characters';
    }

    if (!formData.slug.trim()) {
      errs.slug = 'Slug is required';
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(formData.slug.trim())) {
      errs.slug = 'Slug must only contain lowercase alphanumeric characters and single hyphens';
    }

    if (!formData.brand) {
      errs.brand = 'Brand selection is required';
    }

    if (!formData.city) {
      errs.city = 'City selection is required';
    }

    if (!formData.fullAddress.trim()) {
      errs.fullAddress = 'Full address is required';
    } else if (formData.fullAddress.trim().length < 5) {
      errs.fullAddress = 'Full address must be at least 5 characters long';
    }

    if (!formData.phone.trim()) {
      errs.phone = 'Contact phone number is required';
    } else if (formData.phone.trim().length < 7) {
      errs.phone = 'Please provide a valid phone number';
    }

    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        errs.email = 'Please provide a valid email address';
      }
    }

    if (formData.latitude !== '') {
      const lat = Number(formData.latitude);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        errs.latitude = 'Latitude must be a number between -90 and 90';
      }
    }

    if (formData.longitude !== '') {
      const lng = Number(formData.longitude);
      if (isNaN(lng) || lng < -180 || lng > 180) {
        errs.longitude = 'Longitude must be a number between -180 and 180';
      }
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);

      const parsedFacilities = formData.facilities
        ? formData.facilities
            .split(',')
            .map((f) => f.trim())
            .filter(Boolean)
        : [];

      const payload = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        brand: formData.brand,
        city: formData.city,
        dealerName: formData.dealerName.trim(),
        showroomType: formData.showroomType,
        address: {
          fullAddress: formData.fullAddress.trim(),
          street: formData.street.trim(),
          area: formData.area.trim(),
          pincode: formData.pincode.trim()
        },
        contact: {
          phone: formData.phone.trim(),
          alternatePhone: formData.alternatePhone.trim(),
          email: formData.email.trim().toLowerCase(),
          website: formData.website.trim()
        },
        openingHours: {
          displayText: formData.openingHoursText.trim() || '9:00 AM - 8:00 PM',
          daysOpen: formData.daysOpen.trim() || 'Monday to Sunday'
        },
        facilities: parsedFacilities,
        images: {
          exterior: formData.exteriorImage.trim(),
          interior: []
        },
        isVerified: formData.isVerified,
        isActive: formData.isActive
      };

      if (formData.longitude !== '' && formData.latitude !== '') {
        payload.location = {
          type: 'Point',
          coordinates: [Number(formData.longitude), Number(formData.latitude)]
        };
      }

      if (editingShowroom) {
        await adminService.updateShowroom(editingShowroom._id, payload);
        showFeedback('success', `Showroom "${payload.name}" updated successfully.`);
      } else {
        await adminService.createShowroom(payload);
        showFeedback('success', `Showroom "${payload.name}" created successfully.`);
      }

      setIsFormModalOpen(false);
      await fetchShowrooms();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to save showroom.';
      const details = err?.response?.data?.errors;
      const combinedMsg = Array.isArray(details) && details.length > 0 ? `${msg}: ${details.join(', ')}` : msg;
      setFormErrors((prev) => ({ ...prev, general: combinedMsg }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (showroom) => {
    const targetStatus = !showroom.isActive;
    try {
      await adminService.updateShowroomStatus(showroom._id, targetStatus);
      showFeedback(
        'success',
        `Showroom "${showroom.name}" marked as ${targetStatus ? 'Active' : 'Inactive'}.`
      );
      setShowrooms((prev) =>
        prev.map((s) => (s._id === showroom._id ? { ...s, isActive: targetStatus } : s))
      );
    } catch (err) {
      showFeedback('error', err?.message || 'Failed to update showroom status.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      setIsDeleting(true);
      const res = await adminService.deleteShowroom(deleteTarget._id);
      const data = res?.data;

      if (data?.deactivated) {
        showFeedback(
          'success',
          `Safe Protection: "${deleteTarget.name}" has linked customer leads, test rides, or reviews and has been safely deactivated instead of permanently deleted.`
        );
      } else {
        showFeedback('success', `Showroom "${deleteTarget.name}" permanently removed.`);
      }

      setDeleteTarget(null);
      await fetchShowrooms();
    } catch (err) {
      showFeedback('error', err?.message || 'Failed to delete showroom.');
    } finally {
      setIsDeleting(false);
    }
  };

  const totalCount = showrooms.length;
  const activeCount = showrooms.filter((s) => s.isActive).length;
  const flagshipCount = showrooms.filter((s) => s.showroomType === 'Premia Flagship').length;
  const inactiveCount = totalCount - activeCount;

  return (
    <motion.div
      variants={accessiblePageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6"
    >
      {/* Toast Feedback Notification */}
      {feedback && (
        <div
          role="alert"
          aria-live="polite"
          className={`p-4 rounded-xl border flex items-center justify-between shadow-lg transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
          }`}
        >
          <div className="flex items-center space-x-3">
            {feedback.type === 'success' ? (
              <Check className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <p className="text-sm font-medium">{feedback.message}</p>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs uppercase tracking-wider font-semibold opacity-70 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header & Quick Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-lg bg-red-600/10 border border-red-500/20 text-red-500">
              <Building2 className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-surface-50 tracking-tight">Showroom & Dealership Management</h1>
          </div>
          <p className="text-sm text-surface-200 mt-1">
            Oversee authorized dealer outlets, Premia experience centers, and localized customer contact hubs.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchShowrooms}
            disabled={isLoading}
            className="border-border hover:bg-surface-800 text-surface-200"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreateModal}
            className="bg-brand-red hover:bg-brand-red-hover text-white font-medium shadow-md shadow-brand-red/20"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Showroom
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 border-border/80">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Showrooms</p>
          <p className="text-2xl font-bold text-surface-50 mt-1">{totalCount}</p>
        </Card>
        <Card className="p-4 border-border/80">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Active Outlets</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{activeCount}</p>
        </Card>
        <Card className="p-4 border-border/80">
          <p className="text-xs font-semibold uppercase tracking-wider text-purple-700">Premia Flagships</p>
          <p className="text-2xl font-bold text-purple-700 mt-1">{flagshipCount}</p>
        </Card>
        <Card className="p-4 border-border/80">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Inactive Outlets</p>
          <p className="text-2xl font-bold text-amber-700 mt-1">{inactiveCount}</p>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 border-border/80">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, dealer, area, or address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-border rounded-lg text-sm text-surface-50 placeholder-muted-foreground focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
            />
          </div>

          <div className="md:col-span-2">
            <select
              aria-label="Filter by Brand"
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm text-surface-100 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
            >
              <option value="all">All Brands</option>
              {brands.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              aria-label="Filter by City"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm text-surface-100 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
            >
              <option value="all">All Cities</option>
              {cities.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} ({c.state})
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              aria-label="Filter by Showroom Type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm text-surface-100 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
            >
              <option value="all">All Types</option>
              {SHOWROOM_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2 flex items-center justify-end space-x-1.5">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                statusFilter === 'all'
                  ? 'bg-neutral-800 text-white font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('true')}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                statusFilter === 'true'
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter('false')}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                statusFilter === 'false'
                  ? 'bg-neutral-800 text-neutral-300 border border-neutral-700'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Inactive
            </button>
          </div>
        </div>
      </Card>

      {/* Main Content List Area */}
      {isLoading ? (
        <div className="py-20 flex justify-center">
          <Loading size="lg" message="Loading showroom directory..." />
        </div>
      ) : error ? (
        <Card className="p-8 text-center bg-rose-950/20 border-rose-800/40">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white">Error Loading Showrooms</h3>
          <p className="text-sm text-neutral-400 mt-1 max-w-md mx-auto">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchShowrooms}
            className="mt-4 border-neutral-700 text-neutral-300 hover:bg-neutral-800"
          >
            Retry
          </Button>
        </Card>
      ) : showrooms.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={
            search || brandFilter !== 'all' || cityFilter !== 'all' || typeFilter !== 'all' || statusFilter !== 'all'
              ? 'No showrooms match your filters'
              : 'No showrooms found'
          }
          description={
            search || brandFilter !== 'all' || cityFilter !== 'all' || typeFilter !== 'all' || statusFilter !== 'all'
              ? 'Try adjusting your search criteria or resetting filters.'
              : 'Add your first showroom outlet to connect customers with dealership services.'
          }
          actionLabel="Add Showroom"
          onAction={handleOpenCreateModal}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {showrooms.map((showroom) => (
            <Card
              key={showroom._id}
              className={`p-5 transition-all relative border flex flex-col justify-between ${
                showroom.isActive
                  ? 'border-border/80 hover:border-border hover:shadow-card-hover'
                  : 'border-border/60 opacity-75'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2.5">
                    <span
                      className={`p-2 rounded-lg border ${
                        showroom.showroomType === 'Premia Flagship'
                          ? 'bg-purple-50 border-purple-200 text-purple-700'
                          : showroom.isActive
                          ? 'bg-rose-50 border-rose-200 text-brand-red'
                          : 'bg-surface-800 border-border text-muted-foreground'
                      }`}
                    >
                      <Building2 className="w-4 h-4" />
                    </span>
                    <div>
                      <h3 className="font-semibold text-surface-50 text-base leading-snug">{showroom.name}</h3>
                      {showroom.dealerName && (
                        <p className="text-xs text-muted-foreground font-medium">Dealer: {showroom.dealerName}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={showroom.isActive ? 'success' : 'default'} size="sm">
                      {showroom.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${
                        showroom.showroomType === 'Premia Flagship'
                          ? 'bg-purple-950/50 border-purple-500/30 text-purple-300'
                          : showroom.showroomType === 'Experience Center'
                          ? 'bg-cyan-950/50 border-cyan-500/30 text-cyan-300'
                          : 'bg-neutral-800 border-neutral-700 text-neutral-300'
                      }`}
                    >
                      {showroom.showroomType}
                    </span>
                  </div>
                </div>

                {/* Brand & City pills */}
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <span className="text-xs px-2 py-0.5 rounded bg-surface-500 border border-border text-surface-200 flex items-center gap-1">
                    <Layers className="w-3 h-3 text-brand-red" />
                    <span>{showroom.brand?.name || 'Brand'}</span>
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-surface-500 border border-border text-surface-200 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-emerald-600" />
                    <span>
                      {showroom.city?.name || 'City'}, {showroom.city?.state || ''}
                    </span>
                  </span>
                  {showroom.isVerified && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 flex items-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5" /> Verified
                    </span>
                  )}
                </div>

                {/* Details list */}
                <div className="mt-4 pt-3 border-t border-neutral-800/60 space-y-1.5 text-xs text-neutral-400">
                  <p className="line-clamp-2 text-neutral-300" title={showroom.address?.fullAddress}>
                    {showroom.address?.fullAddress}
                  </p>
                  <div className="flex items-center justify-between text-neutral-400 pt-1">
                    <span className="flex items-center gap-1 text-neutral-300">
                      <Phone className="w-3 h-3 text-neutral-500" /> {showroom.contact?.phone}
                    </span>
                    {showroom.openingHours?.displayText && (
                      <span className="flex items-center gap-1 text-neutral-400 text-[11px]">
                        <Clock className="w-3 h-3 text-neutral-500" /> {showroom.openingHours.displayText}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-5 pt-3 border-t border-neutral-800/70 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleStatus(showroom)}
                  className={`text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors flex items-center space-x-1.5 ${
                    showroom.isActive
                      ? 'border-neutral-800 hover:border-amber-500/40 hover:bg-amber-950/20 text-neutral-400 hover:text-amber-300'
                      : 'border-emerald-800/40 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-900/40'
                  }`}
                  title={showroom.isActive ? 'Deactivate showroom' : 'Activate showroom'}
                >
                  {showroom.isActive ? (
                    <>
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Deactivate</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Activate</span>
                    </>
                  )}
                </button>

                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(showroom)}
                    className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                    title="Edit Showroom"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(showroom)}
                    className="p-1.5 rounded-lg hover:bg-rose-950/30 text-neutral-400 hover:text-rose-400 transition-colors"
                    title="Delete / Safe Deactivate"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Showroom Create / Edit Modal Form */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingShowroom ? `Edit Showroom: ${editingShowroom.name}` : 'Register New Showroom Outlet'}
        size="lg"
      >
        <form onSubmit={handleSubmitForm} className="space-y-4 max-h-[75vh] overflow-y-auto px-1 pr-2">
          {formErrors.general && (
            <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-lg text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formErrors.general}</span>
            </div>
          )}

          {/* Section: Core Identification */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-surface-200 mb-1.5">
                Showroom Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={handleNameChange}
                placeholder="e.g. Hero Premia Mumbai South"
                className="w-full px-3.5 py-2 bg-white border border-border rounded-lg text-sm text-surface-50 placeholder-muted-foreground focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
              />
              {formErrors.name && <p className="text-xs text-rose-500 mt-1">{formErrors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-surface-200 mb-1.5">
                URL Slug *
              </label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value.toLowerCase() }))}
                placeholder="e.g. hero-premia-mumbai-south"
                className="w-full px-3.5 py-2 bg-white border border-border rounded-lg text-sm font-mono text-surface-50 placeholder-muted-foreground focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
              />
              {formErrors.slug && <p className="text-xs text-rose-500 mt-1">{formErrors.slug}</p>}
            </div>
          </div>

          {/* Section: Relationships (Brand & City) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-surface-200 mb-1.5">
                Manufacturer / Brand *
              </label>
              <select
                required
                value={formData.brand}
                onChange={(e) => setFormData((prev) => ({ ...prev, brand: e.target.value }))}
                className="w-full px-3.5 py-2 bg-white border border-border rounded-lg text-sm text-surface-100 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
              >
                <option value="">Select Brand</option>
                {brands.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
              {formErrors.brand && <p className="text-xs text-rose-500 mt-1">{formErrors.brand}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-surface-200 mb-1.5">
                Target City Location *
              </label>
              <select
                required
                value={formData.city}
                onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                className="w-full px-3.5 py-2 bg-white border border-border rounded-lg text-sm text-surface-100 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
              >
                <option value="">Select City</option>
                {cities.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.state}) - {c.tier}
                  </option>
                ))}
              </select>
              {formErrors.city && <p className="text-xs text-rose-500 mt-1">{formErrors.city}</p>}
            </div>
          </div>

          {/* Dealer & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-surface-200 mb-1.5">
                Dealer / Operator Name
              </label>
              <input
                type="text"
                value={formData.dealerName}
                onChange={(e) => setFormData((prev) => ({ ...prev, dealerName: e.target.value }))}
                placeholder="e.g. Apex Mobility LLP"
                className="w-full px-3.5 py-2 bg-white border border-border rounded-lg text-sm text-surface-50 placeholder-muted-foreground focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-surface-200 mb-1.5">
                Showroom Tier / Format
              </label>
              <select
                value={formData.showroomType}
                onChange={(e) => setFormData((prev) => ({ ...prev, showroomType: e.target.value }))}
                className="w-full px-3.5 py-2 bg-white border border-border rounded-lg text-sm text-surface-100 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
              >
                {SHOWROOM_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Section: Address Details */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-surface-200 mb-1.5">
              Full Physical Address *
            </label>
            <textarea
              required
              rows={2}
              value={formData.fullAddress}
              onChange={(e) => setFormData((prev) => ({ ...prev, fullAddress: e.target.value }))}
              placeholder="e.g. Plot 42, Senapati Bapat Marg, Lower Parel, Mumbai 400013"
              className="w-full px-3.5 py-2 bg-white border border-border rounded-lg text-sm text-surface-50 placeholder-muted-foreground focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
            />
            {formErrors.fullAddress && <p className="text-xs text-rose-500 mt-1">{formErrors.fullAddress}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-surface-200 mb-1.5">
                Street
              </label>
              <input
                type="text"
                value={formData.street}
                onChange={(e) => setFormData((prev) => ({ ...prev, street: e.target.value }))}
                placeholder="Senapati Bapat Marg"
                className="w-full px-3 py-1.5 bg-white border border-border rounded-lg text-xs text-surface-50 focus:outline-none focus:border-brand-red"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-surface-200 mb-1.5">
                Area / Locality
              </label>
              <input
                type="text"
                value={formData.area}
                onChange={(e) => setFormData((prev) => ({ ...prev, area: e.target.value }))}
                placeholder="Lower Parel"
                className="w-full px-3 py-1.5 bg-white border border-border rounded-lg text-xs text-surface-50 focus:outline-none focus:border-brand-red"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-surface-200 mb-1.5">
                Pincode
              </label>
              <input
                type="text"
                value={formData.pincode}
                onChange={(e) => setFormData((prev) => ({ ...prev, pincode: e.target.value }))}
                placeholder="400013"
                className="w-full px-3 py-1.5 bg-white border border-border rounded-lg text-xs text-surface-50 focus:outline-none focus:border-brand-red"
              />
            </div>
          </div>

          {/* Section: Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-surface-200 mb-1.5">
                Primary Phone *
              </label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="7479524973"
                className="w-full px-3.5 py-2 bg-white border border-border rounded-lg text-sm text-surface-50 placeholder-muted-foreground focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
              />
              {formErrors.phone && <p className="text-xs text-rose-500 mt-1">{formErrors.phone}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-surface-200 mb-1.5">
                Alternate Phone
              </label>
              <input
                type="text"
                value={formData.alternatePhone}
                onChange={(e) => setFormData((prev) => ({ ...prev, alternatePhone: e.target.value }))}
                placeholder="022-24901234"
                className="w-full px-3.5 py-2 bg-white border border-border rounded-lg text-sm text-surface-50 placeholder-muted-foreground focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-surface-200 mb-1.5">
                Contact Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="mumbai.south@heroshowroom.in"
                className="w-full px-3.5 py-2 bg-white border border-border rounded-lg text-sm text-surface-50 placeholder-muted-foreground focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
              />
              {formErrors.email && <p className="text-xs text-rose-500 mt-1">{formErrors.email}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-surface-200 mb-1.5">
                Dealer Website
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData((prev) => ({ ...prev, website: e.target.value }))}
                placeholder="https://dealer.heromotocorp.com"
                className="w-full px-3.5 py-2 bg-white border border-border rounded-lg text-sm text-surface-50 placeholder-muted-foreground focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
              />
            </div>
          </div>

          {/* Coordinates */}
          <div className="p-3 bg-surface-500 border border-border rounded-lg space-y-2">
            <span className="text-xs font-semibold text-surface-100 flex items-center space-x-1.5">
              <Navigation className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Geospatial Coordinates (for Radius / Nearby Discovery)</span>
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-muted-foreground mb-1">Latitude (-90 to 90)</label>
                <input
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => setFormData((prev) => ({ ...prev, latitude: e.target.value }))}
                  placeholder="18.9950"
                  className="w-full px-2.5 py-1.5 bg-white border border-border rounded text-xs text-surface-50 focus:outline-none focus:border-brand-red"
                />
                {formErrors.latitude && <p className="text-[11px] text-rose-500 mt-1">{formErrors.latitude}</p>}
              </div>
              <div>
                <label className="block text-[11px] text-muted-foreground mb-1">Longitude (-180 to 180)</label>
                <input
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => setFormData((prev) => ({ ...prev, longitude: e.target.value }))}
                  placeholder="72.8258"
                  className="w-full px-2.5 py-1.5 bg-white border border-border rounded text-xs text-surface-50 focus:outline-none focus:border-brand-red"
                />
                {formErrors.longitude && <p className="text-[11px] text-rose-500 mt-1">{formErrors.longitude}</p>}
              </div>
            </div>
          </div>

          {/* Opening hours & Facilities */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-surface-200 mb-1.5">
                Opening Hours
              </label>
              <input
                type="text"
                value={formData.openingHoursText}
                onChange={(e) => setFormData((prev) => ({ ...prev, openingHoursText: e.target.value }))}
                placeholder="9:00 AM - 8:00 PM"
                className="w-full px-3 py-1.5 bg-white border border-border rounded text-xs text-surface-50 focus:outline-none focus:border-brand-red"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-surface-200 mb-1.5">
                Days Open
              </label>
              <input
                type="text"
                value={formData.daysOpen}
                onChange={(e) => setFormData((prev) => ({ ...prev, daysOpen: e.target.value }))}
                placeholder="Monday to Sunday"
                className="w-full px-3 py-1.5 bg-white border border-border rounded text-xs text-surface-50 focus:outline-none focus:border-brand-red"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-surface-200 mb-1.5">
              Available Facilities (comma separated)
            </label>
            <input
              type="text"
              value={formData.facilities}
              onChange={(e) => setFormData((prev) => ({ ...prev, facilities: e.target.value }))}
              placeholder="Test Rides Available, Authorized Service, EV Fast Charging"
              className="w-full px-3 py-1.5 bg-white border border-border rounded text-xs text-surface-50 focus:outline-none focus:border-brand-red"
            />
          </div>

          {/* Status & Verification Toggles */}
          <div className="flex items-center space-x-6 pt-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showroomIsActive"
                checked={formData.isActive}
                onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
                className="w-4 h-4 rounded border-border text-brand-red focus:ring-brand-red focus:ring-offset-white"
              />
              <label htmlFor="showroomIsActive" className="text-sm font-medium text-surface-100 cursor-pointer">
                Active in Public Catalogue
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showroomIsVerified"
                checked={formData.isVerified}
                onChange={(e) => setFormData((prev) => ({ ...prev, isVerified: e.target.checked }))}
                className="w-4 h-4 rounded border-border text-emerald-600 focus:ring-emerald-500 focus:ring-offset-white"
              />
              <label htmlFor="showroomIsVerified" className="text-sm font-medium text-surface-100 cursor-pointer">
                Verified Dealership Badge
              </label>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-border flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsFormModalOpen(false)}
              disabled={isSubmitting}
              className="border-border text-surface-200"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700 text-white font-medium"
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Saving...
                </span>
              ) : editingShowroom ? (
                'Update Showroom'
              ) : (
                'Add Showroom'
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Safe Delete / Deactivation Modal */}
      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Confirm Showroom Removal / Deactivation"
        size="sm"
      >
        <div className="space-y-4">
          <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-lg flex items-start space-x-3 text-amber-200">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-semibold text-amber-300">Catalogue Integrity Safeguard</p>
              <p>
                If <strong>{deleteTarget?.name}</strong> is referenced by existing customer enquiry leads, test rides,
                offers, or reviews, it will be <span className="underline">safely deactivated</span> rather than
                permanently deleted to preserve customer history.
              </p>
            </div>
          </div>

          <p className="text-sm text-neutral-300">
            Are you sure you want to proceed with removing or deactivating{' '}
            <strong className="text-white">{deleteTarget?.name}</strong>?
          </p>

          <div className="pt-3 border-t border-neutral-800 flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
              className="border-neutral-800 text-neutral-300"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-rose-600 hover:bg-rose-700 text-white font-medium"
            >
              {isDeleting ? 'Processing...' : 'Confirm Safe Removal'}
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
};

export default AdminShowroomsPage;
