import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Globe,
  AlertCircle,
  Check,
  ShieldAlert,
  Navigation
} from 'lucide-react';
import { pageTransition, getAccessibleVariant } from '../../animations/variants';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { useSEO } from '../../hooks/useSEO';
import { adminService } from '../../services';
import Container from '../../components/Container';
import Badge from '../../components/Badge';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Modal from '../../components/Modal';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';

const TIERS = ['Metro', 'Tier 1', 'Tier 2', 'Tier 3'];

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const AdminCitiesPage = () => {
  const shouldReduceMotion = usePrefersReducedMotion();
  const accessiblePageTransition = getAccessibleVariant(pageTransition, shouldReduceMotion);

  useSEO({
    title: 'City Management | Admin Console',
    description: 'Manage geographical coverage, metropolitan hubs, tiers, and showroom locations.'
  });

  const [cities, setCities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'true' | 'false'
  const [tierFilter, setTierFilter] = useState('all');
  const [feedback, setFeedback] = useState(null); // { type: 'success'|'error', message }

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCity, setEditingCity] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    state: '',
    country: 'India',
    tier: 'Metro',
    latitude: '',
    longitude: '',
    isActive: true
  });

  // Delete / Deactivate Confirmation Modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCities = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== 'all') params.isActive = statusFilter;

      const res = await adminService.getCities(params);
      let list = res?.data || [];
      if (tierFilter !== 'all') {
        list = list.filter((c) => c.tier === tierFilter);
      }
      setCities(list);
    } catch (err) {
      setError(err?.message || 'Failed to load city catalogue.');
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, tierFilter]);

  useEffect(() => {
    fetchCities();
  }, [fetchCities]);

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback(null);
    }, 4500);
  };

  const handleOpenCreateModal = () => {
    setEditingCity(null);
    setFormData({
      name: '',
      slug: '',
      state: '',
      country: 'India',
      tier: 'Metro',
      latitude: '',
      longitude: '',
      isActive: true
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (city) => {
    setEditingCity(city);
    setFormData({
      name: city.name || '',
      slug: city.slug || '',
      state: city.state || '',
      country: city.country || 'India',
      tier: city.tier || 'Metro',
      latitude: city.coordinates?.latitude !== undefined && city.coordinates?.latitude !== null ? String(city.coordinates.latitude) : '',
      longitude: city.coordinates?.longitude !== undefined && city.coordinates?.longitude !== null ? String(city.coordinates.longitude) : '',
      isActive: Boolean(city.isActive)
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  const handleNameChange = (e) => {
    const newName = e.target.value;
    if (!editingCity) {
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
      errs.name = 'City name is required';
    } else if (formData.name.trim().length < 2) {
      errs.name = 'City name must be at least 2 characters';
    } else if (formData.name.trim().length > 100) {
      errs.name = 'City name cannot exceed 100 characters';
    }

    if (!formData.slug.trim()) {
      errs.slug = 'Slug is required';
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(formData.slug.trim())) {
      errs.slug = 'Slug must only contain lowercase alphanumeric characters and single hyphens';
    }

    if (!formData.state.trim()) {
      errs.state = 'State is required';
    } else if (formData.state.trim().length < 2) {
      errs.state = 'State name must be at least 2 characters';
    }

    if (!TIERS.includes(formData.tier)) {
      errs.tier = `Tier must be one of: ${TIERS.join(', ')}`;
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

      const payload = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        state: formData.state.trim(),
        country: formData.country.trim() || 'India',
        tier: formData.tier,
        isActive: formData.isActive
      };

      if (formData.latitude !== '' || formData.longitude !== '') {
        payload.coordinates = {
          latitude: formData.latitude !== '' ? Number(formData.latitude) : 0,
          longitude: formData.longitude !== '' ? Number(formData.longitude) : 0
        };
      }

      if (editingCity) {
        await adminService.updateCity(editingCity._id, payload);
        showFeedback('success', `City "${payload.name}" updated successfully.`);
      } else {
        await adminService.createCity(payload);
        showFeedback('success', `City "${payload.name}" added successfully.`);
      }

      setIsFormModalOpen(false);
      await fetchCities();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to save city.';
      const details = err?.response?.data?.errors;
      const combinedMsg = Array.isArray(details) && details.length > 0 ? `${msg}: ${details.join(', ')}` : msg;
      setFormErrors((prev) => ({ ...prev, general: combinedMsg }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (city) => {
    const targetStatus = !city.isActive;
    try {
      await adminService.updateCityStatus(city._id, targetStatus);
      showFeedback(
        'success',
        `City "${city.name}" marked as ${targetStatus ? 'Active' : 'Inactive'}.`
      );
      setCities((prev) =>
        prev.map((c) => (c._id === city._id ? { ...c, isActive: targetStatus } : c))
      );
    } catch (err) {
      showFeedback('error', err?.message || 'Failed to update city status.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      setIsDeleting(true);
      const res = await adminService.deleteCity(deleteTarget._id);
      const data = res?.data;

      if (data?.deactivated) {
        showFeedback(
          'success',
          `Safe Protection: "${deleteTarget.name}" is referenced by active showrooms and has been safely deactivated instead of permanently deleted.`
        );
      } else {
        showFeedback('success', `City "${deleteTarget.name}" permanently removed.`);
      }

      setDeleteTarget(null);
      await fetchCities();
    } catch (err) {
      showFeedback('error', err?.message || 'Failed to delete city.');
    } finally {
      setIsDeleting(false);
    }
  };

  const totalCount = cities.length;
  const activeCount = cities.filter((c) => c.isActive).length;
  const metroCount = cities.filter((c) => c.tier === 'Metro').length;
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
              <MapPin className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-surface-50 tracking-tight">City & Region Management</h1>
          </div>
          <p className="text-sm text-surface-200 mt-1">
            Configure geographic zones, metropolitan hubs, operational tiers, and showroom locations.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCities}
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
            Add City
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 border-border/80">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Cities</p>
          <p className="text-2xl font-bold text-surface-50 mt-1">{totalCount}</p>
        </Card>
        <Card className="p-4 border-border/80">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Active Coverage</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{activeCount}</p>
        </Card>
        <Card className="p-4 border-border/80">
          <p className="text-xs font-semibold uppercase tracking-wider text-sky-700">Metro Hubs</p>
          <p className="text-2xl font-bold text-sky-700 mt-1">{metroCount}</p>
        </Card>
        <Card className="p-4 border-border/80">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Inactive / Staged</p>
          <p className="text-2xl font-bold text-amber-700 mt-1">{inactiveCount}</p>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 bg-neutral-900/30 border-neutral-800">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by city name, state, or slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-border rounded-lg text-sm text-surface-50 placeholder-muted-foreground focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
            />
          </div>

          <div className="md:col-span-3">
            <select
              aria-label="Filter by Tier"
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm text-surface-100 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
            >
              <option value="all">All Tiers</option>
              {TIERS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-4 flex items-center justify-end space-x-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                statusFilter === 'all'
                  ? 'bg-neutral-800 text-white font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              All Status
            </button>
            <button
              onClick={() => setStatusFilter('true')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                statusFilter === 'true'
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Active Only
            </button>
            <button
              onClick={() => setStatusFilter('false')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                statusFilter === 'false'
                  ? 'bg-neutral-800 text-neutral-300 border border-neutral-700'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Inactive Only
            </button>
          </div>
        </div>
      </Card>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="py-20 flex justify-center">
          <Loading size="lg" message="Loading city catalogue..." />
        </div>
      ) : error ? (
        <Card className="p-8 text-center bg-rose-950/20 border-rose-800/40">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white">Error Loading Cities</h3>
          <p className="text-sm text-neutral-400 mt-1 max-w-md mx-auto">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCities}
            className="mt-4 border-neutral-700 text-neutral-300 hover:bg-neutral-800"
          >
            Retry
          </Button>
        </Card>
      ) : cities.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title={search || statusFilter !== 'all' || tierFilter !== 'all' ? 'No cities match your filters' : 'No cities found'}
          description={
            search || statusFilter !== 'all' || tierFilter !== 'all'
              ? 'Try adjusting your search criteria or resetting filters.'
              : 'Add your first city location to begin expanding your showroom footprint.'
          }
          actionLabel="Add City"
          onAction={handleOpenCreateModal}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cities.map((city) => (
            <Card
              key={city._id}
              className={`p-5 transition-all relative border flex flex-col justify-between ${
                city.isActive
                  ? 'bg-white border-border hover:shadow-card-hover'
                  : 'bg-surface-500/80 border-border/60 opacity-80'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2.5">
                    <span
                      className={`p-2 rounded-lg border ${
                        city.isActive
                          ? 'bg-brand-red-subtle border-brand-red/20 text-brand-red'
                          : 'bg-surface-600 border-border text-muted-foreground'
                      }`}
                    >
                      <MapPin className="w-4 h-4" />
                    </span>
                    <div>
                      <h3 className="font-semibold text-surface-50 text-base leading-snug">{city.name}</h3>
                      <p className="text-xs text-muted-foreground flex items-center space-x-1">
                        <span>{city.state}</span>
                        <span>•</span>
                        <span>{city.country || 'India'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    <Badge variant={city.isActive ? 'success' : 'default'} size="sm">
                      {city.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${
                        city.tier === 'Metro'
                          ? 'bg-purple-500/10 border-purple-500/30 text-purple-700'
                          : city.tier === 'Tier 1'
                          ? 'bg-blue-500/10 border-blue-500/30 text-blue-700'
                          : 'bg-surface-600 border-border text-surface-200'
                      }`}
                    >
                      {city.tier}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border/60 space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Slug:</span>
                    <span className="font-mono text-surface-200 bg-surface-500 px-1.5 py-0.5 rounded border border-border">
                      {city.slug}
                    </span>
                  </div>
                  {city.coordinates && (city.coordinates.latitude || city.coordinates.longitude) ? (
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500 flex items-center gap-1">
                        <Navigation className="w-3 h-3" /> GPS:
                      </span>
                      <span className="font-mono text-neutral-400">
                        {city.coordinates.latitude?.toFixed(2)}°, {city.coordinates.longitude?.toFixed(2)}°
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-5 pt-3 border-t border-neutral-800/70 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleStatus(city)}
                  className={`text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors flex items-center space-x-1.5 ${
                    city.isActive
                      ? 'border-neutral-800 hover:border-amber-500/40 hover:bg-amber-950/20 text-neutral-400 hover:text-amber-300'
                      : 'border-emerald-800/40 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-900/40'
                  }`}
                  title={city.isActive ? 'Deactivate city' : 'Activate city'}
                >
                  {city.isActive ? (
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
                    onClick={() => handleOpenEditModal(city)}
                    className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                    title="Edit City"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(city)}
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

      {/* City Create / Edit Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingCity ? `Edit City: ${editingCity.name}` : 'Add New City Location'}
        size="md"
      >
        <form onSubmit={handleSubmitForm} className="space-y-4">
          {formErrors.general && (
            <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-lg text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formErrors.general}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-surface-200 mb-1.5">
              City Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={handleNameChange}
              placeholder="e.g. Mumbai, New Delhi, Bengaluru"
              className="w-full px-3.5 py-2 bg-white border border-border rounded-lg text-sm text-surface-50 placeholder-muted-foreground focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
            />
            {formErrors.name && <p className="text-xs text-rose-500 mt-1">{formErrors.name}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-surface-200 mb-1.5">
                URL Slug *
              </label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value.toLowerCase() }))}
                placeholder="e.g. mumbai"
                className="w-full px-3.5 py-2 bg-white border border-border rounded-lg text-sm font-mono text-surface-50 placeholder-muted-foreground focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
              />
              {formErrors.slug && <p className="text-xs text-rose-500 mt-1">{formErrors.slug}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-surface-200 mb-1.5">
                State / Province *
              </label>
              <input
                type="text"
                required
                value={formData.state}
                onChange={(e) => setFormData((prev) => ({ ...prev, state: e.target.value }))}
                placeholder="e.g. Maharashtra, Karnataka"
                className="w-full px-3.5 py-2 bg-white border border-border rounded-lg text-sm text-surface-50 placeholder-muted-foreground focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
              />
              {formErrors.state && <p className="text-xs text-rose-500 mt-1">{formErrors.state}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-surface-200 mb-1.5">
                Operational Tier
              </label>
              <select
                value={formData.tier}
                onChange={(e) => setFormData((prev) => ({ ...prev, tier: e.target.value }))}
                className="w-full px-3.5 py-2 bg-white border border-border rounded-lg text-sm text-surface-100 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
              >
                {TIERS.map((tier) => (
                  <option key={tier} value={tier}>
                    {tier}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-surface-200 mb-1.5">
                Country
              </label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData((prev) => ({ ...prev, country: e.target.value }))}
                placeholder="India"
                className="w-full px-3.5 py-2 bg-white border border-border rounded-lg text-sm text-surface-50 placeholder-muted-foreground focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
              />
            </div>
          </div>

          {/* Coordinates */}
          <div className="p-3 bg-surface-500 border border-border rounded-lg space-y-2">
            <span className="text-xs font-semibold text-surface-100 flex items-center space-x-1.5">
              <Navigation className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Geographic Coordinates (Optional)</span>
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-muted-foreground mb-1">Latitude (-90 to 90)</label>
                <input
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => setFormData((prev) => ({ ...prev, latitude: e.target.value }))}
                  placeholder="e.g. 19.0760"
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
                  placeholder="e.g. 72.8777"
                  className="w-full px-2.5 py-1.5 bg-white border border-border rounded text-xs text-surface-50 focus:outline-none focus:border-brand-red"
                />
                {formErrors.longitude && <p className="text-[11px] text-rose-500 mt-1">{formErrors.longitude}</p>}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="cityIsActive"
              checked={formData.isActive}
              onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
              className="w-4 h-4 rounded border-border text-brand-red focus:ring-brand-red focus:ring-offset-white"
            />
            <label htmlFor="cityIsActive" className="text-sm font-medium text-surface-100 cursor-pointer">
              Active in Public Showroom Directory & Booking Search
            </label>
          </div>

          <div className="pt-3 border-t border-border flex justify-end space-x-2">
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
              ) : editingCity ? (
                'Update City'
              ) : (
                'Add City'
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Safe Delete / Deactivation Modal */}
      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Confirm City Removal / Deactivation"
        size="sm"
      >
        <div className="space-y-4">
          <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-lg flex items-start space-x-3 text-amber-200">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-semibold text-amber-300">Catalogue Integrity Safeguard</p>
              <p>
                If <strong>{deleteTarget?.name}</strong> is currently referenced by any showrooms, it will be{' '}
                <span className="underline">safely deactivated</span> rather than deleted to prevent broken customer links.
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

export default AdminCitiesPage;
