import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bike as BikeIcon,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Check,
  Layers,
  Sparkles,
  Zap,
  Gauge,
  IndianRupee,
  Fuel,
  Settings,
  ArrowRight,
  Palette,
  X
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

const CATEGORIES = [
  'Commuter',
  'Sport',
  'Cruiser',
  'Tourer',
  'Adventure',
  'Scooter',
  'Electric'
];

const FUEL_TYPES = ['Petrol', 'Electric', 'Hybrid'];
const COOLING_TYPES = ['Air Cooled', 'Liquid Cooled', 'Air/Oil Cooled', 'Electric Motor', 'Other'];
const BRAKE_TYPES = ['Disc', 'Drum'];
const ABS_TYPES = ['Single Channel ABS', 'Dual Channel ABS', 'Combi Brake System (CBS)', 'None'];

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const formatPriceINR = (num) => {
  if (num === undefined || num === null || isNaN(num)) return '₹0';
  return '₹' + Number(num).toLocaleString('en-IN');
};

const AdminBikesPage = () => {
  const shouldReduceMotion = usePrefersReducedMotion();
  const accessiblePageTransition = getAccessibleVariant(pageTransition, shouldReduceMotion);

  useSEO({
    title: 'Bike Catalogue Management | Admin Console',
    description: 'Manage motorcycle models, technical specifications, variants, pricing, and active status.'
  });

  // Data states
  const [bikes, setBikes] = useState([]);
  const [brands, setBrands] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState({ page: 1, limit: 12, total: 0, pages: 1 });

  // Filters & Search
  const [search, setSearch] = useState('');
  const [brandFilter, setBrandFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [fuelTypeFilter, setFuelTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sort, setSort] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [feedback, setFeedback] = useState(null);

  // Bike Form Modal State
  const [isBikeModalOpen, setIsBikeModalOpen] = useState(false);
  const [editingBike, setEditingBike] = useState(null);
  const [bikeFormErrors, setBikeFormErrors] = useState({});
  const [isSubmittingBike, setIsSubmittingBike] = useState(false);
  const [bikeFormTab, setBikeFormTab] = useState('basic');

  // Bike Form Data
  const initialBikeForm = {
    name: '',
    slug: '',
    brand: '',
    category: 'Commuter',
    tagline: '',
    description: '',
    minPrice: '',
    maxPrice: '',
    fuelType: 'Petrol',
    transmission: 'Manual',
    displacementCc: '',
    maxPower: '',
    maxTorque: '',
    cooling: 'Air Cooled',
    emissionStandard: 'BS6 Phase 2',
    estimatedKmpl: '',
    certifiedRangeKm: '',
    frontBrake: 'Disc',
    rearBrake: 'Drum',
    absType: 'Single Channel ABS',
    heroImage: '',
    galleryText: '',
    isFeatured: false,
    isActive: true
  };
  const [bikeFormData, setBikeFormData] = useState(initialBikeForm);

  // Delete Bike Modal State
  const [deleteBikeTarget, setDeleteBikeTarget] = useState(null);
  const [isDeletingBike, setIsDeletingBike] = useState(false);

  // Variant Management Modal State
  const [activeVariantBike, setActiveVariantBike] = useState(null);
  const [variants, setVariants] = useState([]);
  const [isLoadingVariants, setIsLoadingVariants] = useState(false);
  const [variantError, setVariantError] = useState(null);

  // Variant Form Modal / Mode State
  const [isVariantFormOpen, setIsVariantFormOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState(null);
  const [variantFormErrors, setVariantFormErrors] = useState({});
  const [isSubmittingVariant, setIsSubmittingVariant] = useState(false);

  // Variant Form Data
  const initialVariantForm = {
    name: '',
    slug: '',
    exShowroomPrice: '',
    colors: [{ name: 'Standard Black', hexCode: '#111111', image: '' }],
    kerbWeightKg: '',
    fuelCapacityLitres: '',
    seatHeightMm: '',
    groundClearanceMm: '',
    keyFeaturesText: '',
    isActive: true
  };
  const [variantFormData, setVariantFormData] = useState(initialVariantForm);

  // Delete Variant State
  const [deleteVariantTarget, setDeleteVariantTarget] = useState(null);
  const [isDeletingVariant, setIsDeletingVariant] = useState(false);

  // Load Brand Lookup Data
  const loadBrands = useCallback(async () => {
    try {
      const res = await adminService.getBrands({ limit: 100, isActive: 'all' });
      setBrands(res?.data || []);
    } catch (err) {
      console.error('Failed to load brands lookup:', err);
    }
  }, []);

  useEffect(() => {
    loadBrands();
  }, [loadBrands]);

  // Load Bikes
  const loadBikes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
        limit: 12,
        sort
      };

      if (search && search.trim() !== '') params.search = search.trim();
      if (brandFilter !== 'all') params.brand = brandFilter;
      if (categoryFilter !== 'all') params.category = categoryFilter;
      if (fuelTypeFilter !== 'all') params.fuelType = fuelTypeFilter;
      if (statusFilter !== 'all') params.isActive = statusFilter;

      const res = await adminService.getBikes(params);
      setBikes(res?.data || []);
      setMeta(res?.meta || { page: 1, limit: 12, total: res?.data?.length || 0, pages: 1 });
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to load bikes');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, search, brandFilter, categoryFilter, fuelTypeFilter, statusFilter, sort]);

  useEffect(() => {
    loadBikes();
  }, [loadBikes]);

  // Auto-dismiss Feedback after 4 seconds
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // Open Create Bike Modal
  const handleOpenCreateBike = () => {
    setEditingBike(null);
    setBikeFormData({
      ...initialBikeForm,
      brand: brands.length > 0 ? brands[0]._id : ''
    });
    setBikeFormErrors({});
    setBikeFormTab('basic');
    setIsBikeModalOpen(true);
  };

  // Open Edit Bike Modal
  const handleOpenEditBike = (bike) => {
    setEditingBike(bike);
    setBikeFormData({
      name: bike.name || '',
      slug: bike.slug || '',
      brand: bike.brand?._id || bike.brand || '',
      category: bike.category || 'Commuter',
      tagline: bike.tagline || '',
      description: bike.description || '',
      minPrice: bike.priceRange?.minPrice ?? '',
      maxPrice: bike.priceRange?.maxPrice ?? '',
      fuelType: bike.fuelType || 'Petrol',
      transmission: bike.transmission || 'Manual',
      displacementCc: bike.engine?.displacementCc ?? '',
      maxPower: bike.engine?.maxPower || '',
      maxTorque: bike.engine?.maxTorque || '',
      cooling: bike.engine?.cooling || 'Air Cooled',
      emissionStandard: bike.engine?.emissionStandard || 'BS6 Phase 2',
      estimatedKmpl: bike.mileage?.estimatedKmpl ?? '',
      certifiedRangeKm: bike.mileage?.certifiedRangeKm ?? '',
      frontBrake: bike.brakes?.front || 'Disc',
      rearBrake: bike.brakes?.rear || 'Drum',
      absType: bike.brakes?.absType || 'Single Channel ABS',
      heroImage: bike.images?.heroImage || '',
      galleryText: Array.isArray(bike.images?.gallery) ? bike.images.gallery.join('\n') : '',
      isFeatured: Boolean(bike.isFeatured),
      isActive: bike.isActive !== undefined ? Boolean(bike.isActive) : true
    });
    setBikeFormErrors({});
    setBikeFormTab('basic');
    setIsBikeModalOpen(true);
  };

  // Validate Bike Form
  const validateBikeForm = () => {
    const errs = {};
    if (!bikeFormData.name.trim() || bikeFormData.name.trim().length < 2) {
      errs.name = 'Bike model name must be at least 2 characters.';
    }
    if (!bikeFormData.slug.trim()) {
      errs.slug = 'URL slug is required.';
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(bikeFormData.slug.trim())) {
      errs.slug = 'Slug must contain only lowercase alphanumeric characters and single hyphens.';
    }
    if (!bikeFormData.brand) {
      errs.brand = 'Brand selection is required.';
    }
    if (!bikeFormData.category) {
      errs.category = 'Category selection is required.';
    }
    if (bikeFormData.minPrice === '' || isNaN(Number(bikeFormData.minPrice)) || Number(bikeFormData.minPrice) < 0) {
      errs.minPrice = 'Valid minimum ex-showroom price is required.';
    }
    if (bikeFormData.maxPrice === '' || isNaN(Number(bikeFormData.maxPrice)) || Number(bikeFormData.maxPrice) < 0) {
      errs.maxPrice = 'Valid maximum ex-showroom price is required.';
    }
    if (
      !errs.minPrice &&
      !errs.maxPrice &&
      Number(bikeFormData.minPrice) > Number(bikeFormData.maxPrice)
    ) {
      errs.maxPrice = 'Max price cannot be less than Min price.';
    }
    return errs;
  };

  // Submit Bike (Create or Update)
  const handleSubmitBike = async (e) => {
    e.preventDefault();
    const errs = validateBikeForm();
    if (Object.keys(errs).length > 0) {
      setBikeFormErrors(errs);
      return;
    }

    setIsSubmittingBike(true);
    setBikeFormErrors({});

    const galleryArray = bikeFormData.galleryText
      ? bikeFormData.galleryText
          .split(/[\n,]/)
          .map((url) => url.trim())
          .filter(Boolean)
      : [];

    const payload = {
      name: bikeFormData.name.trim(),
      slug: bikeFormData.slug.trim().toLowerCase(),
      brand: bikeFormData.brand,
      category: bikeFormData.category,
      tagline: bikeFormData.tagline.trim(),
      description: bikeFormData.description.trim(),
      priceRange: {
        minPrice: Number(bikeFormData.minPrice),
        maxPrice: Number(bikeFormData.maxPrice),
        currency: 'INR'
      },
      fuelType: bikeFormData.fuelType,
      transmission: bikeFormData.transmission.trim(),
      engine: {
        displacementCc: Number(bikeFormData.displacementCc) || 0,
        maxPower: bikeFormData.maxPower.trim(),
        maxTorque: bikeFormData.maxTorque.trim(),
        cooling: bikeFormData.cooling,
        emissionStandard: bikeFormData.emissionStandard.trim()
      },
      mileage: {
        estimatedKmpl: Number(bikeFormData.estimatedKmpl) || 0,
        certifiedRangeKm: Number(bikeFormData.certifiedRangeKm) || 0
      },
      brakes: {
        front: bikeFormData.frontBrake,
        rear: bikeFormData.rearBrake,
        absType: bikeFormData.absType
      },
      images: {
        heroImage: bikeFormData.heroImage.trim(),
        gallery: galleryArray
      },
      isFeatured: bikeFormData.isFeatured,
      isActive: bikeFormData.isActive
    };

    try {
      if (editingBike) {
        await adminService.updateBike(editingBike._id, payload);
        setFeedback({
          type: 'success',
          message: `Bike '${payload.name}' updated successfully.`
        });
      } else {
        await adminService.createBike(payload);
        setFeedback({
          type: 'success',
          message: `Bike '${payload.name}' added to catalogue.`
        });
      }
      setIsBikeModalOpen(false);
      loadBikes();
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Operation failed.';
      setBikeFormErrors({ general: msg });
    } finally {
      setIsSubmittingBike(false);
    }
  };

  // Toggle Bike Active Status
  const handleToggleBikeStatus = async (bike) => {
    const nextStatus = !bike.isActive;
    try {
      await adminService.updateBikeStatus(bike._id, nextStatus);
      setBikes((prev) =>
        prev.map((b) => (b._id === bike._id ? { ...b, isActive: nextStatus } : b))
      );
      setFeedback({
        type: 'success',
        message: `Bike '${bike.name}' ${nextStatus ? 'activated' : 'deactivated'} successfully.`
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err?.response?.data?.message || 'Failed to update status.'
      });
    }
  };

  // Delete / Deactivate Bike
  const handleConfirmDeleteBike = async () => {
    if (!deleteBikeTarget) return;
    setIsDeletingBike(true);
    try {
      const res = await adminService.deleteBike(deleteBikeTarget._id);
      setFeedback({
        type: 'success',
        message: res?.message || `Bike '${deleteBikeTarget.name}' processed successfully.`
      });
      setDeleteBikeTarget(null);
      loadBikes();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err?.response?.data?.message || 'Failed to delete bike.'
      });
    } finally {
      setIsDeletingBike(false);
    }
  };

  // -------------------------------------------------------------
  // VARIANT MANAGEMENT
  // -------------------------------------------------------------

  // Load Variants for a Bike
  const loadVariantsForBike = useCallback(async (bike) => {
    if (!bike) return;
    setIsLoadingVariants(true);
    setVariantError(null);
    try {
      const res = await adminService.getBikeVariants(bike._id, { limit: 100, isActive: 'all' });
      setVariants(res?.data || []);
    } catch (err) {
      setVariantError(err?.response?.data?.message || 'Failed to load bike variants.');
    } finally {
      setIsLoadingVariants(false);
    }
  }, []);

  // Open Variant Management Modal
  const handleOpenVariantManagement = (bike) => {
    setActiveVariantBike(bike);
    setIsVariantFormOpen(false);
    setEditingVariant(null);
    loadVariantsForBike(bike);
  };

  // Open Variant Create Form
  const handleOpenCreateVariant = () => {
    setEditingVariant(null);
    setVariantFormData({
      ...initialVariantForm,
      colors: [{ name: 'Standard Black', hexCode: '#111111', image: '' }]
    });
    setVariantFormErrors({});
    setIsVariantFormOpen(true);
  };

  // Open Variant Edit Form
  const handleOpenEditVariant = (variant) => {
    setEditingVariant(variant);
    setVariantFormData({
      name: variant.name || '',
      slug: variant.slug || '',
      exShowroomPrice: variant.exShowroomPrice ?? '',
      colors: Array.isArray(variant.colors) && variant.colors.length > 0
        ? variant.colors.map((c) => ({
            name: c.name || '',
            hexCode: c.hexCode || '#000000',
            image: c.image || ''
          }))
        : [{ name: 'Standard', hexCode: '#000000', image: '' }],
      kerbWeightKg: variant.keySpecifications?.kerbWeightKg ?? '',
      fuelCapacityLitres: variant.keySpecifications?.fuelCapacityLitres ?? '',
      seatHeightMm: variant.keySpecifications?.seatHeightMm ?? '',
      groundClearanceMm: variant.keySpecifications?.groundClearanceMm ?? '',
      keyFeaturesText: Array.isArray(variant.keyFeatures) ? variant.keyFeatures.join(', ') : '',
      isActive: variant.isActive !== undefined ? Boolean(variant.isActive) : true
    });
    setVariantFormErrors({});
    setIsVariantFormOpen(true);
  };

  // Add Color Row to Variant Form
  const handleAddColorRow = () => {
    setVariantFormData((prev) => ({
      ...prev,
      colors: [...prev.colors, { name: '', hexCode: '#c5221f', image: '' }]
    }));
  };

  // Remove Color Row
  const handleRemoveColorRow = (idx) => {
    setVariantFormData((prev) => ({
      ...prev,
      colors: prev.colors.filter((_, i) => i !== idx)
    }));
  };

  // Update Color Row Field
  const handleColorChange = (idx, field, val) => {
    setVariantFormData((prev) => {
      const nextColors = [...prev.colors];
      nextColors[idx] = { ...nextColors[idx], [field]: val };
      return { ...prev, colors: nextColors };
    });
  };

  // Validate Variant Form
  const validateVariantForm = () => {
    const errs = {};
    if (!variantFormData.name.trim() || variantFormData.name.trim().length < 2) {
      errs.name = 'Variant name must be at least 2 characters.';
    }
    if (!variantFormData.slug.trim()) {
      errs.slug = 'Variant slug is required.';
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(variantFormData.slug.trim())) {
      errs.slug = 'Slug must contain only lowercase alphanumeric characters and hyphens.';
    }
    if (
      variantFormData.exShowroomPrice === '' ||
      isNaN(Number(variantFormData.exShowroomPrice)) ||
      Number(variantFormData.exShowroomPrice) < 0
    ) {
      errs.exShowroomPrice = 'Valid ex-showroom price is required.';
    }
    return errs;
  };

  // Submit Variant Form
  const handleSubmitVariant = async (e) => {
    e.preventDefault();
    const errs = validateVariantForm();
    if (Object.keys(errs).length > 0) {
      setVariantFormErrors(errs);
      return;
    }

    setIsSubmittingVariant(true);
    setVariantFormErrors({});

    const featuresArray = variantFormData.keyFeaturesText
      ? variantFormData.keyFeaturesText
          .split(/[\n,]/)
          .map((f) => f.trim())
          .filter(Boolean)
      : [];

    const payload = {
      name: variantFormData.name.trim(),
      slug: variantFormData.slug.trim().toLowerCase(),
      exShowroomPrice: Number(variantFormData.exShowroomPrice),
      colors: variantFormData.colors.filter((c) => c.name.trim() !== ''),
      keySpecifications: {
        kerbWeightKg: Number(variantFormData.kerbWeightKg) || 0,
        fuelCapacityLitres: Number(variantFormData.fuelCapacityLitres) || 0,
        seatHeightMm: Number(variantFormData.seatHeightMm) || 0,
        groundClearanceMm: Number(variantFormData.groundClearanceMm) || 0
      },
      keyFeatures: featuresArray,
      isActive: variantFormData.isActive
    };

    try {
      if (editingVariant) {
        await adminService.updateBikeVariant(activeVariantBike._id, editingVariant._id, payload);
        setFeedback({
          type: 'success',
          message: `Variant '${payload.name}' updated successfully.`
        });
      } else {
        await adminService.createBikeVariant(activeVariantBike._id, payload);
        setFeedback({
          type: 'success',
          message: `Variant '${payload.name}' added to ${activeVariantBike.name}.`
        });
      }
      setIsVariantFormOpen(false);
      loadVariantsForBike(activeVariantBike);
      loadBikes(); // refresh variant counts
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Operation failed.';
      setVariantFormErrors({ general: msg });
    } finally {
      setIsSubmittingVariant(false);
    }
  };

  // Toggle Variant Status
  const handleToggleVariantStatus = async (variant) => {
    const nextStatus = !variant.isActive;
    try {
      await adminService.updateBikeVariantStatus(
        activeVariantBike._id,
        variant._id,
        nextStatus
      );
      setVariants((prev) =>
        prev.map((v) => (v._id === variant._id ? { ...v, isActive: nextStatus } : v))
      );
      setFeedback({
        type: 'success',
        message: `Variant '${variant.name}' ${nextStatus ? 'activated' : 'deactivated'} successfully.`
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err?.response?.data?.message || 'Failed to update variant status.'
      });
    }
  };

  // Delete / Deactivate Variant
  const handleConfirmDeleteVariant = async () => {
    if (!deleteVariantTarget || !activeVariantBike) return;
    setIsDeletingVariant(true);
    try {
      const res = await adminService.deleteBikeVariant(
        activeVariantBike._id,
        deleteVariantTarget._id
      );
      setFeedback({
        type: 'success',
        message: res?.message || `Variant '${deleteVariantTarget.name}' processed successfully.`
      });
      setDeleteVariantTarget(null);
      loadVariantsForBike(activeVariantBike);
      loadBikes();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err?.response?.data?.message || 'Failed to delete variant.'
      });
    } finally {
      setIsDeletingVariant(false);
    }
  };

  // Summary Metrics
  const activeCount = bikes.filter((b) => b.isActive).length;
  const featuredCount = bikes.filter((b) => b.isFeatured).length;
  const totalVariantsCount = bikes.reduce((acc, b) => acc + (b.variantCount || 0), 0);

  return (
    <motion.div
      variants={accessiblePageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-surface-50 tracking-tight flex items-center gap-2">
              <BikeIcon className="w-6 h-6 text-brand-red" />
              <span>Bike Catalogue Management</span>
            </h1>
            <Badge variant="brand" size="sm">Admin</Badge>
          </div>
          <p className="text-sm text-surface-200 mt-1">
            Manage motorcycle models, pricing tiers, specifications, and trims.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={loadBikes}
            className="text-xs border-border hover:bg-surface-800 text-surface-200"
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={handleOpenCreateBike}
            className="text-xs"
          >
            Add New Bike
          </Button>
        </div>
      </div>

      {/* Feedback Toast Banner */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-3.5 rounded-lg flex items-center justify-between text-xs font-medium border ${
              feedback.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-700'
                : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              ) : (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-muted-foreground hover:text-surface-50 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4 border-border/80">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Models</p>
          <p className="text-2xl font-bold text-surface-50 mt-1">{meta.total}</p>
        </Card>
        <Card className="p-4 border-border/80">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Active Models</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{activeCount}</p>
        </Card>
        <Card className="p-4 border-border/80">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Featured Models</p>
          <p className="text-2xl font-bold text-amber-700 mt-1">{featuredCount}</p>
        </Card>
        <Card className="p-4 border-border/80">
          <p className="text-xs font-semibold uppercase tracking-wider text-purple-700">Archived Models</p>
          <p className="text-2xl font-bold text-purple-700 mt-1">{inactiveCount}</p>
        </Card>
        <Card className="p-4 border-border/80">
          <p className="text-xs font-semibold uppercase tracking-wider text-sky-700">Page Variants</p>
          <p className="text-2xl font-bold text-sky-700 mt-1">{totalVariantsCount}</p>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 border-border/80">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search Input */}
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by bike name, slug, tagline..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 bg-white border border-border rounded-lg text-sm text-surface-50 placeholder-muted-foreground focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
            />
          </div>

          {/* Brand Filter */}
          <div className="md:col-span-2">
            <select
              aria-label="Filter by Brand"
              value={brandFilter}
              onChange={(e) => {
                setBrandFilter(e.target.value);
                setCurrentPage(1);
              }}
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

          {/* Category Filter */}
          <div className="md:col-span-2">
            <select
              aria-label="Filter by Category"
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm text-surface-100 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Fuel Type Filter */}
          <div className="md:col-span-2">
            <select
              aria-label="Filter by Fuel Type"
              value={fuelTypeFilter}
              onChange={(e) => {
                setFuelTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm text-surface-100 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
            >
              <option value="all">All Fuel Types</option>
              {FUEL_TYPES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Filter */}
          <div className="md:col-span-2">
            <select
              aria-label="Sort by"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm text-surface-100 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
            >
              <option value="newest">Newest First</option>
              <option value="priceLow">Price: Low to High</option>
              <option value="priceHigh">Price: High to Low</option>
              <option value="nameAsc">Name: A to Z</option>
              <option value="nameDesc">Name: Z to A</option>
            </select>
          </div>
        </div>

        {/* Quick Status Buttons */}
        <div className="mt-3 pt-3 border-t border-neutral-800/60 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-neutral-400">Status:</span>
            <button
              onClick={() => {
                setStatusFilter('all');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                statusFilter === 'all'
                  ? 'bg-neutral-800 text-white font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => {
                setStatusFilter('true');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                statusFilter === 'true'
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => {
                setStatusFilter('false');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                statusFilter === 'false'
                  ? 'bg-amber-950/60 text-amber-300 border border-amber-500/30'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Inactive
            </button>
          </div>

          {(search || brandFilter !== 'all' || categoryFilter !== 'all' || fuelTypeFilter !== 'all' || statusFilter !== 'all') && (
            <button
              onClick={() => {
                setSearch('');
                setBrandFilter('all');
                setCategoryFilter('all');
                setFuelTypeFilter('all');
                setStatusFilter('all');
                setCurrentPage(1);
              }}
              className="text-xs text-brand-red hover:underline flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Clear Filters
            </button>
          )}
        </div>
      </Card>

      {/* Main Bikes List Content */}
      {isLoading ? (
        <div className="py-16 flex justify-center">
          <Loading />
        </div>
      ) : error ? (
        <div className="p-6 rounded-xl bg-red-950/30 border border-red-500/30 text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-sm text-red-200 font-semibold">{error}</p>
          <Button variant="outline" size="sm" onClick={loadBikes} className="mt-4">
            Retry
          </Button>
        </div>
      ) : bikes.length === 0 ? (
        <EmptyState
          title="No bikes found"
          description="Try adjusting your search criteria or add a new motorcycle model."
          actionText="Add New Bike"
          onAction={handleOpenCreateBike}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {bikes.map((bike) => (
            <Card
              key={bike._id}
              className={`flex flex-col justify-between p-5 border-border/80 border transition-all duration-200 hover:border-border hover:shadow-card-hover group ${
                bike.isActive ? 'border-border/80' : 'border-border/50 opacity-75'
              }`}
            >
              <div>
                {/* Image and Header */}
                <div className="relative w-full h-40 bg-surface-800 rounded-lg overflow-hidden border border-border/80 mb-4 flex items-center justify-center">
                  {bike.images?.heroImage ? (
                    <img
                      src={bike.images.heroImage}
                      alt={bike.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-muted-foreground gap-1">
                      <BikeIcon className="w-10 h-10 stroke-1" />
                      <span className="text-[11px]">No Image Provided</span>
                    </div>
                  )}

                  <div className="absolute top-2 right-2 flex items-center gap-1.5">
                    {bike.isFeatured && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/90 text-neutral-950 shadow-xs flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5 fill-current" /> Featured
                      </span>
                    )}
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        bike.isActive
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : 'bg-surface-800 border-border text-muted-foreground'
                      }`}
                    >
                      {bike.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="absolute bottom-2 left-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white/90 backdrop-blur-sm border border-border text-surface-50">
                      {bike.category}
                    </span>
                  </div>
                </div>

                {/* Bike Model Details */}
                <div className="space-y-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <h2 className="text-base font-bold text-surface-50 group-hover:text-brand-red transition-colors line-clamp-1">
                      {bike.name}
                    </h2>
                    <span className="text-xs font-semibold text-muted-foreground shrink-0">
                      {bike.brand?.name || 'Hero'}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-500 font-mono">
                    /{bike.slug}
                  </p>

                  {bike.tagline && (
                    <p className="text-xs text-neutral-400 italic line-clamp-1 pt-0.5">
                      "{bike.tagline}"
                    </p>
                  )}
                </div>

                {/* Specifications Bar */}
                <div className="mt-3.5 pt-3 border-t border-neutral-800/80 grid grid-cols-2 gap-2 text-xs text-neutral-400">
                  <div className="flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5 text-neutral-500" />
                    <span>{bike.engine?.displacementCc ? `${bike.engine.displacementCc} cc` : 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Fuel className="w-3.5 h-3.5 text-neutral-500" />
                    <span>{bike.fuelType || 'Petrol'}</span>
                  </div>
                </div>

                {/* Price Range */}
                <div className="mt-3 p-2.5 rounded-lg bg-surface-500 border border-border flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Ex-Showroom</span>
                  <span className="text-xs font-bold text-emerald-700">
                    {formatPriceINR(bike.priceRange?.minPrice)} - {formatPriceINR(bike.priceRange?.maxPrice)}
                  </span>
                </div>
              </div>

              {/* Actions & Variants Footer */}
              <div className="mt-4 pt-3.5 border-t border-border flex flex-col gap-2.5">
                {/* Manage Variants Button */}
                <button
                  type="button"
                  onClick={() => handleOpenVariantManagement(bike)}
                  className="w-full py-1.5 px-3 rounded-lg bg-surface-500 hover:bg-surface-600 border border-border text-xs font-semibold text-surface-100 transition-colors flex items-center justify-between"
                >
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-purple-600" />
                    <span>Manage Variants</span>
                  </span>
                  <Badge variant="purple" size="sm" className="text-[10px]">
                    {bike.variantCount || 0} Trims
                  </Badge>
                </button>

                {/* Status Toggle & Edit/Delete Buttons */}
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleBikeStatus(bike)}
                    className={`text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 ${
                      bike.isActive
                        ? 'border-border hover:border-amber-500/40 hover:bg-amber-50 text-surface-200 hover:text-amber-700'
                        : 'border-emerald-500/40 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    {bike.isActive ? (
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

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditBike(bike)}
                      aria-label="Edit bike model"
                      className="p-1.5 rounded-lg border border-border hover:border-surface-200 bg-white text-surface-200 hover:text-surface-50 transition-colors shadow-sm"
                      title="Edit Bike"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteBikeTarget(bike)}
                      aria-label="Delete or deactivate bike model"
                      className="p-1.5 rounded-lg border border-border hover:border-red-400 bg-white text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors shadow-sm"
                      title="Delete or Safe-Deactivate"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {meta.pages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-neutral-800 text-xs text-neutral-400">
          <p>
            Showing page <span className="font-semibold text-white">{meta.page}</span> of{' '}
            <span className="font-semibold text-white">{meta.pages}</span> ({meta.total} models)
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={meta.page <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="text-xs border-neutral-800"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={meta.page >= meta.pages}
              onClick={() => setCurrentPage((p) => Math.min(meta.pages, p + 1))}
              className="text-xs border-neutral-800"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* BIKE CREATE / EDIT MODAL */}
      {/* ========================================================= */}
      <Modal
        isOpen={isBikeModalOpen}
        onClose={() => !isSubmittingBike && setIsBikeModalOpen(false)}
        title={editingBike ? `Edit Bike: ${editingBike.name}` : 'Add New Bike Model'}
        subtitle="Configure motorcycle specifications, pricing, brand association, and active status."
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleSubmitBike} className="space-y-4">
          {bikeFormErrors.general && (
            <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{bikeFormErrors.general}</span>
            </div>
          )}

          {/* Form Tabs */}
          <div className="flex items-center gap-2 border-b border-neutral-800 pb-2">
            <button
              type="button"
              onClick={() => setBikeFormTab('basic')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                bikeFormTab === 'basic'
                  ? 'bg-neutral-800 text-brand-red font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Basic Info & Pricing
            </button>
            <button
              type="button"
              onClick={() => setBikeFormTab('engine')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                bikeFormTab === 'engine'
                  ? 'bg-neutral-800 text-brand-red font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Engine & Specs
            </button>
            <button
              type="button"
              onClick={() => setBikeFormTab('media')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                bikeFormTab === 'media'
                  ? 'bg-neutral-800 text-brand-red font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Images & Flags
            </button>
          </div>

          {/* TAB 1: Basic Info & Pricing */}
          {bikeFormTab === 'basic' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Bike Name */}
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Bike Model Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hero Splendor Plus XTEC"
                    value={bikeFormData.name}
                    onChange={(e) => {
                      const nameVal = e.target.value;
                      setBikeFormData((prev) => ({
                        ...prev,
                        name: nameVal,
                        // Auto-slugify if creating new or if slug was pristine
                        slug: !editingBike ? slugify(nameVal) : prev.slug
                      }));
                    }}
                    className={`w-full px-3 py-2 bg-white border rounded-lg text-sm text-surface-50 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red ${
                      bikeFormErrors.name ? 'border-red-500' : 'border-border'
                    }`}
                  />
                  {bikeFormErrors.name && (
                    <p className="text-[11px] text-red-500 mt-1">{bikeFormErrors.name}</p>
                  )}
                </div>

                {/* Bike Slug */}
                <div>
                  <label className="block text-xs font-medium text-surface-200 mb-1">
                    URL Slug *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. hero-splendor-plus-xtec"
                    value={bikeFormData.slug}
                    onChange={(e) => setBikeFormData({ ...bikeFormData, slug: e.target.value })}
                    className={`w-full px-3 py-2 bg-white border rounded-lg text-sm text-surface-50 font-mono focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red ${
                      bikeFormErrors.slug ? 'border-red-500' : 'border-border'
                    }`}
                  />
                  {bikeFormErrors.slug && (
                    <p className="text-[11px] text-red-500 mt-1">{bikeFormErrors.slug}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Brand Selector */}
                <div>
                  <label className="block text-xs font-medium text-surface-200 mb-1">
                    Brand *
                  </label>
                  <select
                    required
                    value={bikeFormData.brand}
                    onChange={(e) => setBikeFormData({ ...bikeFormData, brand: e.target.value })}
                    className={`w-full px-3 py-2 bg-white border rounded-lg text-sm text-surface-100 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red ${
                      bikeFormErrors.brand ? 'border-red-500' : 'border-border'
                    }`}
                  >
                    <option value="" disabled>Select Brand</option>
                    {brands.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                  {bikeFormErrors.brand && (
                    <p className="text-[11px] text-red-500 mt-1">{bikeFormErrors.brand}</p>
                  )}
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-medium text-surface-200 mb-1">
                    Category *
                  </label>
                  <select
                    required
                    value={bikeFormData.category}
                    onChange={(e) => setBikeFormData({ ...bikeFormData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm text-surface-100 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Price Range */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 rounded-lg bg-surface-500 border border-border">
                <div>
                  <label className="block text-xs font-medium text-surface-200 mb-1">
                    Min Ex-Showroom Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="e.g. 75000"
                    value={bikeFormData.minPrice}
                    onChange={(e) => setBikeFormData({ ...bikeFormData, minPrice: e.target.value })}
                    className={`w-full px-3 py-2 bg-white border rounded-lg text-sm text-surface-50 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red ${
                      bikeFormErrors.minPrice ? 'border-red-500' : 'border-border'
                    }`}
                  />
                  {bikeFormErrors.minPrice && (
                    <p className="text-[11px] text-red-500 mt-1">{bikeFormErrors.minPrice}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-surface-200 mb-1">
                    Max Ex-Showroom Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="e.g. 85000"
                    value={bikeFormData.maxPrice}
                    onChange={(e) => setBikeFormData({ ...bikeFormData, maxPrice: e.target.value })}
                    className={`w-full px-3 py-2 bg-white border rounded-lg text-sm text-surface-50 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red ${
                      bikeFormErrors.maxPrice ? 'border-red-500' : 'border-border'
                    }`}
                  />
                  {bikeFormErrors.maxPrice && (
                    <p className="text-[11px] text-red-500 mt-1">{bikeFormErrors.maxPrice}</p>
                  )}
                </div>
              </div>

              {/* Tagline */}
              <div>
                <label className="block text-xs font-medium text-surface-200 mb-1">
                  Marketing Tagline
                </label>
                <input
                  type="text"
                  placeholder="e.g. India's Most Trusted Commuter"
                  value={bikeFormData.tagline}
                  onChange={(e) => setBikeFormData({ ...bikeFormData, tagline: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm text-surface-50 placeholder-muted-foreground focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-surface-200 mb-1">
                  Full Description
                </label>
                <textarea
                  rows="3"
                  placeholder="Comprehensive model description..."
                  value={bikeFormData.description}
                  onChange={(e) => setBikeFormData({ ...bikeFormData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm text-surface-50 placeholder-muted-foreground focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
                />
              </div>
            </div>
          )}

          {/* TAB 2: Engine & Specifications */}
          {bikeFormTab === 'engine' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-surface-200 mb-1">
                    Displacement (cc)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 97.2"
                    value={bikeFormData.displacementCc}
                    onChange={(e) => setBikeFormData({ ...bikeFormData, displacementCc: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm text-surface-50 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-surface-200 mb-1">
                    Max Power
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 8.02 PS @ 8000 rpm"
                    value={bikeFormData.maxPower}
                    onChange={(e) => setBikeFormData({ ...bikeFormData, maxPower: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm text-surface-50 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-surface-200 mb-1">
                    Max Torque
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 8.05 Nm @ 6000 rpm"
                    value={bikeFormData.maxTorque}
                    onChange={(e) => setBikeFormData({ ...bikeFormData, maxTorque: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm text-surface-50 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-surface-200 mb-1">
                    Fuel Type
                  </label>
                  <select
                    value={bikeFormData.fuelType}
                    onChange={(e) => setBikeFormData({ ...bikeFormData, fuelType: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm text-surface-100 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
                  >
                    {FUEL_TYPES.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-surface-200 mb-1">
                    Transmission
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 4 Speed Constant Mesh"
                    value={bikeFormData.transmission}
                    onChange={(e) => setBikeFormData({ ...bikeFormData, transmission: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm text-surface-50 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-surface-200 mb-1">
                    Cooling System
                  </label>
                  <select
                    value={bikeFormData.cooling}
                    onChange={(e) => setBikeFormData({ ...bikeFormData, cooling: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm text-surface-100 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
                  >
                    {COOLING_TYPES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-surface-200 mb-1">
                    Estimated Mileage (kmpl)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 65"
                    value={bikeFormData.estimatedKmpl}
                    onChange={(e) => setBikeFormData({ ...bikeFormData, estimatedKmpl: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm text-surface-50 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-surface-200 mb-1">
                    Certified Range / Battery (km)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 0 (or range for EV)"
                    value={bikeFormData.certifiedRangeKm}
                    onChange={(e) => setBikeFormData({ ...bikeFormData, certifiedRangeKm: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm text-surface-50 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-surface-200 mb-1">
                    Front Brake
                  </label>
                  <select
                    value={bikeFormData.frontBrake}
                    onChange={(e) => setBikeFormData({ ...bikeFormData, frontBrake: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm text-surface-100 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
                  >
                    {BRAKE_TYPES.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-surface-200 mb-1">
                    Rear Brake
                  </label>
                  <select
                    value={bikeFormData.rearBrake}
                    onChange={(e) => setBikeFormData({ ...bikeFormData, rearBrake: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm text-surface-100 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
                  >
                    {BRAKE_TYPES.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-surface-200 mb-1">
                    ABS Type
                  </label>
                  <select
                    value={bikeFormData.absType}
                    onChange={(e) => setBikeFormData({ ...bikeFormData, absType: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm text-surface-100 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
                  >
                    {ABS_TYPES.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Media & Visibility Flags */}
          {bikeFormTab === 'media' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-surface-200 mb-1">
                  Hero Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://images.example.com/bikes/hero-splendor.jpg"
                  value={bikeFormData.heroImage}
                  onChange={(e) => setBikeFormData({ ...bikeFormData, heroImage: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm text-surface-50 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-surface-200 mb-1">
                  Gallery Image URLs (one per line)
                </label>
                <textarea
                  rows="3"
                  placeholder="https://images.example.com/bikes/gallery-1.jpg&#10;https://images.example.com/bikes/gallery-2.jpg"
                  value={bikeFormData.galleryText}
                  onChange={(e) => setBikeFormData({ ...bikeFormData, galleryText: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm text-surface-50 font-mono focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
                />
              </div>

              <div className="pt-2 flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-surface-100">
                  <input
                    type="checkbox"
                    checked={bikeFormData.isFeatured}
                    onChange={(e) => setBikeFormData({ ...bikeFormData, isFeatured: e.target.checked })}
                    className="w-4 h-4 rounded border-border text-brand-red focus:ring-brand-red focus:ring-offset-white"
                  />
                  <span>Featured on Home / Top of Catalogue</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-surface-100">
                  <input
                    type="checkbox"
                    checked={bikeFormData.isActive}
                    onChange={(e) => setBikeFormData({ ...bikeFormData, isActive: e.target.checked })}
                    className="w-4 h-4 rounded border-border text-brand-red focus:ring-brand-red focus:ring-offset-white"
                  />
                  <span>Active in Public Catalogue</span>
                </label>
              </div>
            </div>
          )}

          {/* Form Actions Footer */}
          <div className="pt-4 border-t border-border flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsBikeModalOpen(false)}
              disabled={isSubmittingBike}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmittingBike}
            >
              {isSubmittingBike ? 'Saving Bike...' : editingBike ? 'Update Bike Model' : 'Create Bike Model'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================= */}
      {/* DELETE / DEACTIVATE BIKE CONFIRMATION MODAL */}
      {/* ========================================================= */}
      <Modal
        isOpen={Boolean(deleteBikeTarget)}
        onClose={() => !isDeletingBike && setDeleteBikeTarget(null)}
        title="Delete or Safe-Deactivate Bike Model"
        subtitle="Referential integrity enforcement will prevent data loss."
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-lg bg-amber-950/30 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Safety Guard Active</p>
              <p className="mt-0.5 text-amber-300/90 leading-relaxed">
                If <span className="font-bold text-white">{deleteBikeTarget?.name}</span> is associated with catalogue variants, customer leads, test rides, offers, or favorites, it will be <strong>safely deactivated</strong> instead of deleted.
              </p>
            </div>
          </div>

          <p className="text-xs text-neutral-300">
            Are you sure you want to proceed with removing{' '}
            <span className="font-semibold text-white">"{deleteBikeTarget?.name}"</span>?
          </p>

          <div className="pt-3 border-t border-neutral-800 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeleteBikeTarget(null)}
              disabled={isDeletingBike}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={handleConfirmDeleteBike}
              disabled={isDeletingBike}
            >
              {isDeletingBike ? 'Processing...' : 'Confirm Remove'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ========================================================= */}
      {/* VARIANT MANAGEMENT MODAL */}
      {/* ========================================================= */}
      <Modal
        isOpen={Boolean(activeVariantBike)}
        onClose={() => {
          if (!isSubmittingVariant && !isDeletingVariant) {
            setActiveVariantBike(null);
            setIsVariantFormOpen(false);
          }
        }}
        title={`Variants: ${activeVariantBike?.name || ''}`}
        subtitle={`Catalogue Trims & Colorways for ${activeVariantBike?.brand?.name || 'Hero'} ${activeVariantBike?.name || ''}`}
        maxWidth="max-w-4xl"
      >
        <div className="space-y-4">
          {/* Header Action Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <div>
              <p className="text-xs text-neutral-400">
                Model Category: <span className="text-white font-medium">{activeVariantBike?.category}</span> &bull; Base Range:{' '}
                <span className="text-emerald-400 font-medium">
                  {formatPriceINR(activeVariantBike?.priceRange?.minPrice)} - {formatPriceINR(activeVariantBike?.priceRange?.maxPrice)}
                </span>
              </p>
            </div>

            {!isVariantFormOpen && (
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={handleOpenCreateVariant}
                className="text-xs"
              >
                Add Variant Trim
              </Button>
            )}
          </div>

          {/* Variant Form (Create/Edit) */}
          {isVariantFormOpen ? (
            <Card className="p-4 bg-surface-500 border-border">
              <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
                <h3 className="text-sm font-bold text-surface-50 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-brand-red" />
                  <span>{editingVariant ? `Edit Variant: ${editingVariant.name}` : 'New Variant Trim'}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsVariantFormOpen(false)}
                  className="text-xs text-muted-foreground hover:text-surface-50"
                >
                  Back to List
                </button>
              </div>

              <form onSubmit={handleSubmitVariant} className="space-y-4">
                {variantFormErrors.general && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs">
                    {variantFormErrors.general}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Variant Name */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-surface-200 mb-1">
                      Variant Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Self Start Drum Alloy Wheel BS6"
                      value={variantFormData.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setVariantFormData((prev) => ({
                          ...prev,
                          name: val,
                          slug: !editingVariant ? slugify(val) : prev.slug
                        }));
                      }}
                      className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm text-surface-50 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
                    />
                    {variantFormErrors.name && (
                      <p className="text-[11px] text-red-500 mt-1">{variantFormErrors.name}</p>
                    )}
                  </div>

                  {/* Ex-Showroom Price */}
                  <div>
                    <label className="block text-xs font-medium text-surface-200 mb-1">
                      Ex-Showroom Price (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      placeholder="e.g. 78000"
                      value={variantFormData.exShowroomPrice}
                      onChange={(e) => setVariantFormData({ ...variantFormData, exShowroomPrice: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm text-surface-50 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
                    />
                    {variantFormErrors.exShowroomPrice && (
                      <p className="text-[11px] text-red-500 mt-1">{variantFormErrors.exShowroomPrice}</p>
                    )}
                  </div>
                </div>

                {/* Slug */}
                <div>
                  <label className="block text-xs font-medium text-surface-200 mb-1">
                    Variant Slug *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. self-start-drum-alloy"
                    value={variantFormData.slug}
                    onChange={(e) => setVariantFormData({ ...variantFormData, slug: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm text-surface-50 font-mono focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
                  />
                  {variantFormErrors.slug && (
                    <p className="text-[11px] text-red-500 mt-1">{variantFormErrors.slug}</p>
                  )}
                </div>

                {/* Colorways Dynamic Editor */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-surface-200">
                      Colorways & Hex Codes
                    </label>
                    <button
                      type="button"
                      onClick={handleAddColorRow}
                      className="text-[11px] text-brand-red hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Plus className="w-3 h-3" /> Add Color
                    </button>
                  </div>

                  <div className="space-y-2">
                    {variantFormData.colors.map((color, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="color"
                          value={color.hexCode || '#000000'}
                          onChange={(e) => handleColorChange(idx, 'hexCode', e.target.value)}
                          className="w-9 h-8 rounded bg-white border border-border cursor-pointer p-0.5 shrink-0"
                          title="Choose Color Hex"
                        />
                        <input
                          type="text"
                          placeholder="Color Name (e.g. Canvas Black)"
                          value={color.name}
                          onChange={(e) => handleColorChange(idx, 'name', e.target.value)}
                          className="flex-1 px-3 py-1.5 bg-white border border-border rounded-lg text-xs text-surface-50 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
                        />
                        <input
                          type="url"
                          placeholder="Image URL (optional)"
                          value={color.image}
                          onChange={(e) => handleColorChange(idx, 'image', e.target.value)}
                          className="flex-1 px-3 py-1.5 bg-white border border-border rounded-lg text-xs text-surface-50 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red hidden sm:block"
                        />
                        {variantFormData.colors.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveColorRow(idx)}
                            className="p-1.5 text-muted-foreground hover:text-red-500"
                            title="Remove Color"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Key Specifications */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-lg bg-surface-500 border border-border">
                  <div>
                    <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                      Kerb Weight (kg)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 112"
                      value={variantFormData.kerbWeightKg}
                      onChange={(e) => setVariantFormData({ ...variantFormData, kerbWeightKg: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-border rounded text-xs text-surface-50 focus:outline-none focus:border-brand-red"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                      Fuel Tank (L)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 9.8"
                      value={variantFormData.fuelCapacityLitres}
                      onChange={(e) => setVariantFormData({ ...variantFormData, fuelCapacityLitres: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-border rounded text-xs text-surface-50 focus:outline-none focus:border-brand-red"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                      Seat Height (mm)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 785"
                      value={variantFormData.seatHeightMm}
                      onChange={(e) => setVariantFormData({ ...variantFormData, seatHeightMm: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-border rounded text-xs text-surface-50 focus:outline-none focus:border-brand-red"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                      Ground Clear. (mm)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 165"
                      value={variantFormData.groundClearanceMm}
                      onChange={(e) => setVariantFormData({ ...variantFormData, groundClearanceMm: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-border rounded text-xs text-surface-50 focus:outline-none focus:border-brand-red"
                    />
                  </div>
                </div>

                {/* Key Features & Status */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-surface-200 mb-1">
                      Key Highlights (comma-separated)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. i3S Technology, LED Headlamp, Digital Meter"
                      value={variantFormData.keyFeaturesText}
                      onChange={(e) => setVariantFormData({ ...variantFormData, keyFeaturesText: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-border rounded-lg text-xs text-surface-50 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
                    />
                  </div>

                  <div className="pt-4">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-surface-100">
                      <input
                        type="checkbox"
                        checked={variantFormData.isActive}
                        onChange={(e) => setVariantFormData({ ...variantFormData, isActive: e.target.checked })}
                        className="w-4 h-4 rounded border-border text-brand-red focus:ring-brand-red focus:ring-offset-white"
                      />
                      <span>Active Variant</span>
                    </label>
                  </div>
                </div>

                {/* Buttons */}
                <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsVariantFormOpen(false)}
                    disabled={isSubmittingVariant}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={isSubmittingVariant}
                  >
                    {isSubmittingVariant ? 'Saving Trim...' : editingVariant ? 'Update Variant' : 'Create Variant'}
                  </Button>
                </div>
              </form>
            </Card>
          ) : null}

          {/* Variants List Table */}
          {isLoadingVariants ? (
            <div className="py-8 flex justify-center">
              <Loading />
            </div>
          ) : variantError ? (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
              {variantError}
            </div>
          ) : variants.length === 0 ? (
            <div className="text-center py-10 bg-surface-500 rounded-xl border border-border p-6">
              <Layers className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-semibold text-surface-50">No variants configured yet</p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">
                Add trims like Drum Brake, Disc Brake, Alloy Wheels, or XTEC editions.
              </p>
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={handleOpenCreateVariant}
                className="text-xs"
              >
                Add First Variant
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {variants.map((v) => (
                <div
                  key={v._id}
                  className={`p-3.5 rounded-lg border transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
                    v.isActive
                      ? 'bg-neutral-900/40 border-neutral-800 hover:border-neutral-700'
                      : 'bg-neutral-900/20 border-neutral-800/40 opacity-70'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">{v.name}</h4>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${
                          v.isActive
                            ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300'
                            : 'bg-neutral-900 border-neutral-700 text-neutral-400'
                        }`}
                      >
                        {v.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <p className="text-xs font-mono text-neutral-500">
                      slug: {v.slug}
                    </p>

                    {/* Color Chips */}
                    {Array.isArray(v.colors) && v.colors.length > 0 && (
                      <div className="flex items-center gap-1.5 pt-1">
                        <span className="text-[11px] text-neutral-400">Colors:</span>
                        {v.colors.map((c, i) => (
                          <span
                            key={i}
                            className="w-3.5 h-3.5 rounded-full border border-neutral-700 shrink-0"
                            style={{ backgroundColor: c.hexCode || '#000' }}
                            title={c.name}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-800">
                    <span className="text-sm font-bold text-emerald-400">
                      {formatPriceINR(v.exShowroomPrice)}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleToggleVariantStatus(v)}
                        className={`text-xs px-2 py-1 rounded border transition-colors ${
                          v.isActive
                            ? 'border-neutral-800 text-neutral-400 hover:text-amber-300'
                            : 'border-emerald-800 text-emerald-300 hover:bg-emerald-950/40'
                        }`}
                        title={v.isActive ? 'Deactivate Variant' : 'Activate Variant'}
                      >
                        {v.isActive ? 'Deactivate' : 'Activate'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEditVariant(v)}
                        className="p-1.5 rounded border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white"
                        title="Edit Variant"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteVariantTarget(v)}
                        className="p-1.5 rounded border border-neutral-800 hover:border-red-900/40 text-neutral-400 hover:text-red-400 hover:bg-red-950/20"
                        title="Delete Variant"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* ========================================================= */}
      {/* DELETE / DEACTIVATE VARIANT CONFIRMATION MODAL */}
      {/* ========================================================= */}
      <Modal
        isOpen={Boolean(deleteVariantTarget)}
        onClose={() => !isDeletingVariant && setDeleteVariantTarget(null)}
        title="Delete or Safe-Deactivate Variant"
        subtitle="Referential integrity enforcement active."
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-lg bg-amber-950/30 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Safety Guard Active</p>
              <p className="mt-0.5 text-amber-300/90 leading-relaxed">
                If variant <span className="font-bold text-white">{deleteVariantTarget?.name}</span> is referenced by leads, test rides, or offers, it will be <strong>safely deactivated</strong> instead of deleted.
              </p>
            </div>
          </div>

          <p className="text-xs text-neutral-300">
            Confirm removal of variant{' '}
            <span className="font-semibold text-white">"{deleteVariantTarget?.name}"</span>?
          </p>

          <div className="pt-3 border-t border-neutral-800 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeleteVariantTarget(null)}
              disabled={isDeletingVariant}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={handleConfirmDeleteVariant}
              disabled={isDeletingVariant}
            >
              {isDeletingVariant ? 'Processing...' : 'Confirm Remove'}
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
};

export default AdminBikesPage;
