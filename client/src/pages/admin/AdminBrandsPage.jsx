import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Layers,
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
  ArrowUpRight
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

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const AdminBrandsPage = () => {
  const shouldReduceMotion = usePrefersReducedMotion();
  const accessiblePageTransition = getAccessibleVariant(pageTransition, shouldReduceMotion);

  useSEO({
    title: 'Brand Management | Admin Console',
    description: 'Manage motorcycle manufacturers, brands, divisions, and active status.'
  });

  const [brands, setBrands] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'true' | 'false'
  const [feedback, setFeedback] = useState(null); // { type: 'success'|'error', message }

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    originCountry: 'India',
    website: '',
    logo: '',
    isActive: true
  });

  // Delete / Deactivate Confirmation Modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchBrands = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== 'all') params.isActive = statusFilter;

      const res = await adminService.getBrands(params);
      setBrands(res?.data || []);
    } catch (err) {
      setError(err?.message || 'Failed to load brand catalogue.');
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback(null);
    }, 4500);
  };

  const openCreateModal = () => {
    setEditingBrand(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      originCountry: 'India',
      website: '',
      logo: '',
      isActive: true
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  const openEditModal = (brand) => {
    setEditingBrand(brand);
    setFormData({
      name: brand.name || '',
      slug: brand.slug || '',
      description: brand.description || '',
      originCountry: brand.originCountry || 'India',
      website: brand.website || '',
      logo: brand.logo || '',
      isActive: brand.isActive !== false
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  const handleNameChange = (e) => {
    const nameVal = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name: nameVal,
      // Auto-generate slug if creating new brand and slug hasn't been manually detached
      slug: !editingBrand ? slugify(nameVal) : prev.slug
    }));
  };

  const validateForm = () => {
    const errs = {};
    if (!formData.name.trim()) {
      errs.name = 'Brand name is required';
    } else if (formData.name.trim().length < 2) {
      errs.name = 'Brand name must be at least 2 characters';
    }

    if (!formData.slug.trim()) {
      errs.slug = 'Slug is required';
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(formData.slug.trim())) {
      errs.slug = 'Slug must contain only lowercase letters, numbers, and hyphens';
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      if (editingBrand) {
        await adminService.updateBrand(editingBrand._id, formData);
        showFeedback('success', `Brand '${formData.name}' updated successfully.`);
      } else {
        await adminService.createBrand(formData);
        showFeedback('success', `Brand '${formData.name}' created successfully.`);
      }
      setIsFormModalOpen(false);
      fetchBrands();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Operation failed.';
      setFormErrors({ submit: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (brand) => {
    try {
      const newStatus = !brand.isActive;
      await adminService.updateBrandStatus(brand._id, newStatus);
      showFeedback('success', `Brand '${brand.name}' is now ${newStatus ? 'active' : 'inactive'}.`);
      fetchBrands();
    } catch (err) {
      showFeedback('error', err?.message || 'Failed to update brand status.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    try {
      setIsDeleting(true);
      const res = await adminService.deleteBrand(deleteTarget._id);
      const message = res?.message || 'Brand processed successfully.';
      showFeedback('success', message);
      setDeleteTarget(null);
      fetchBrands();
    } catch (err) {
      showFeedback('error', err?.message || 'Failed to delete brand.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Container className="space-y-8">
      <motion.div
        variants={accessiblePageTransition}
        initial="initial"
        animate="animate"
        exit="exit"
        className="space-y-8"
      >
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="brand" size="sm">
                CATALOGUE ENGINE
              </Badge>
              <span className="text-xs font-mono text-muted-foreground">{brands.length} Record(s)</span>
            </div>
            <h1 className="typography-h1 text-surface-50 font-bold tracking-tight">
              Brand Management
            </h1>
            <p className="typography-body text-surface-200 text-sm max-w-2xl">
              Create, update, and manage automotive manufacturers, brands, and parent divisions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={fetchBrands}
              disabled={isLoading}
              className="text-xs"
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={openCreateModal}
              className="text-xs"
            >
              Add New Brand
            </Button>
          </div>
        </div>

        {/* Feedback Alert Banner */}
        {feedback && (
          <div
            role="alert"
            className={`p-4 rounded-xl flex items-center justify-between gap-3 text-xs font-medium border ${
              feedback.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200'
                : 'bg-rose-950/40 border-rose-800/80 text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" aria-hidden="true" />
              )}
              <span>{feedback.message}</span>
            </div>
          </div>
        )}

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-surface-900/60 border border-border/60">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search brands by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface-800 border border-border rounded-lg text-surface-100 placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-brand-red"
            />
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-auto w-full sm:w-auto overflow-x-auto">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                statusFilter === 'all'
                  ? 'bg-surface-700 text-white shadow-xs'
                  : 'text-muted-foreground hover:text-surface-100 hover:bg-surface-800/60'
              }`}
            >
              All Statuses
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('true')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                statusFilter === 'true'
                  ? 'bg-surface-700 text-emerald-400 shadow-xs'
                  : 'text-muted-foreground hover:text-surface-100 hover:bg-surface-800/60'
              }`}
            >
              Active Only
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('false')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                statusFilter === 'false'
                  ? 'bg-surface-700 text-rose-400 shadow-xs'
                  : 'text-muted-foreground hover:text-surface-100 hover:bg-surface-800/60'
              }`}
            >
              Inactive Only
            </button>
          </div>
        </div>

        {/* Content Area */}
        {isLoading && brands.length === 0 ? (
          <div className="py-16 flex justify-center">
            <Loading text="Loading brand records..." size="lg" />
          </div>
        ) : error && brands.length === 0 ? (
          <Card variant="default" className="p-8 border-rose-800/80 bg-rose-950/20 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" aria-hidden="true" />
            <p className="text-rose-200 text-sm">{error}</p>
            <Button variant="secondary" size="sm" onClick={fetchBrands}>
              Try Again
            </Button>
          </Card>
        ) : brands.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="No brands found"
            message="No brand records match your search or status filter. Create a new brand to start the catalogue."
            actionLabel="Add New Brand"
            onAction={openCreateModal}
            className="border-dashed py-12"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {brands.map((brand) => (
              <Card
                key={brand._id}
                variant="elevated"
                className="p-5 border-border/80 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-muted-foreground bg-surface-800 px-2 py-0.5 rounded border border-border/40">
                      /{brand.slug}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(brand)}
                      title="Click to toggle status"
                      className="cursor-pointer"
                    >
                      <Badge
                        variant={brand.isActive ? 'success' : 'outline'}
                        size="sm"
                        className="text-[10px] uppercase font-bold"
                      >
                        {brand.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </button>
                  </div>

                  <div className="space-y-1">
                    <h3 className="typography-h3 text-surface-50 font-bold flex items-center justify-between">
                      <span>{brand.name}</span>
                      {brand.originCountry && (
                        <span className="text-[11px] font-normal text-muted-foreground">
                          {brand.originCountry}
                        </span>
                      )}
                    </h3>

                    {brand.description ? (
                      <p className="typography-small text-surface-200 text-xs line-clamp-2">
                        {brand.description}
                      </p>
                    ) : (
                      <p className="typography-small text-muted-foreground text-xs italic">
                        No description provided.
                      </p>
                    )}
                  </div>

                  {brand.website && (
                    <a
                      href={brand.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-brand-red hover:underline flex items-center gap-1 pt-1"
                    >
                      <Globe className="w-3.5 h-3.5" aria-hidden="true" />
                      <span className="truncate">{brand.website}</span>
                      <ArrowUpRight className="w-3 h-3 shrink-0" aria-hidden="true" />
                    </a>
                  )}
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-border/40 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={Edit2}
                      onClick={() => openEditModal(brand)}
                      className="text-xs px-2.5 py-1"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(brand)}
                      className="text-xs px-2.5 py-1"
                    >
                      {brand.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Trash2}
                    onClick={() => setDeleteTarget(brand)}
                    className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 px-2 py-1"
                    aria-label={`Delete ${brand.name}`}
                  />
                </div>
              </Card>
            ))}
          </div>
        )}
      </motion.div>

      {/* ============================================================ */}
      {/* Create / Edit Brand Modal                                     */}
      {/* ============================================================ */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingBrand ? 'Edit Brand' : 'Create New Brand'}
        subtitle={
          editingBrand
            ? `Updating attributes for '${editingBrand.name}'`
            : 'Register a new automotive brand in the Hero Showroom catalogue'
        }
      >
        <form onSubmit={handleFormSubmit} className="space-y-4 pt-2">
          {formErrors.submit && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-xs text-rose-200">
              {formErrors.submit}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Brand Name"
              placeholder="e.g. Hero MotoCorp"
              value={formData.name}
              onChange={handleNameChange}
              error={formErrors.name}
              required
            />

            <Input
              label="URL Slug"
              placeholder="e.g. hero-motocorp"
              value={formData.slug}
              onChange={(e) => setFormData((p) => ({ ...p, slug: e.target.value.toLowerCase() }))}
              error={formErrors.slug}
              helperText="URL identifier for catalogue routing"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block typography-label text-surface-200">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Brief overview of the brand and heritage..."
              value={formData.description}
              onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
              className="w-full bg-background-elevated border border-border text-surface-100 placeholder-muted-foreground rounded-input px-3.5 py-2.5 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Country of Origin"
              placeholder="e.g. India"
              value={formData.originCountry}
              onChange={(e) => setFormData((p) => ({ ...p, originCountry: e.target.value }))}
            />

            <Input
              label="Official Website"
              placeholder="https://www.heromotocorp.com"
              value={formData.website}
              onChange={(e) => setFormData((p) => ({ ...p, website: e.target.value }))}
            />
          </div>

          <Input
            label="Logo URL"
            placeholder="https://cdn.example.com/logo.png"
            value={formData.logo}
            onChange={(e) => setFormData((p) => ({ ...p, logo: e.target.value }))}
          />

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="brand-is-active"
              checked={formData.isActive}
              onChange={(e) => setFormData((p) => ({ ...p, isActive: e.target.checked }))}
              className="w-4 h-4 rounded border-border bg-surface-800 text-brand-red focus:ring-brand-red cursor-pointer"
            />
            <label htmlFor="brand-is-active" className="text-xs text-surface-100 font-medium cursor-pointer">
              Active in public catalogue
            </label>
          </div>

          <div className="pt-4 border-t border-border/40 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsFormModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : editingBrand ? 'Update Brand' : 'Create Brand'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ============================================================ */}
      {/* Safe Delete / Deactivate Confirmation Modal                   */}
      {/* ============================================================ */}
      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Confirm Brand Deletion"
        subtitle={`Action for brand '${deleteTarget?.name}'`}
      >
        <div className="space-y-4 pt-2">
          <div className="p-3.5 rounded-xl bg-surface-900 border border-amber-800/60 text-xs text-amber-200 flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-1">
              <p className="font-semibold text-surface-100">Referential Safety Policy Active</p>
              <p className="text-surface-200 leading-relaxed">
                If this brand is referenced by existing showrooms or motorcycles, it will be{' '}
                <strong>safely deactivated</strong> to prevent orphaned records. If unreferenced, it will be permanently deleted.
              </p>
            </div>
          </div>

          <p className="text-xs text-surface-200">
            Are you sure you want to proceed with deleting or deactivating{' '}
            <strong className="text-surface-50">{deleteTarget?.name}</strong>?
          </p>

          <div className="pt-4 border-t border-border/40 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              icon={Trash2}
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? 'Processing...' : 'Confirm Action'}
            </Button>
          </div>
        </div>
      </Modal>
    </Container>
  );
};

export default AdminBrandsPage;
