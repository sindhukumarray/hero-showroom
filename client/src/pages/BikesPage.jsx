import React, { useEffect, useState, useTransition } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  Bike as BikeIcon,
  Gauge,
  Fuel,
  ArrowRight,
  RotateCcw,
  SlidersHorizontal
} from 'lucide-react';
import {
  Container,
  Card,
  Badge,
  Button,
  Input,
  Loading,
  ErrorState,
  EmptyState,
  FavoriteButton,
  CompareButton
} from '../components';
import { bikeService, brandService } from '../services';
import { formatPriceRange } from '../utils/formatters';
import { getBikeImageUrl, handleImageError } from '../utils/bikeImages';
import { useSEO } from '../hooks/useSEO';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { pageTransition, getAccessibleVariant } from '../animations/variants';

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

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest Arrivals' },
  { value: 'priceLow', label: 'Price: Low to High' },
  { value: 'priceHigh', label: 'Price: High to Low' },
  { value: 'nameAsc', label: 'Model Name (A to Z)' },
  { value: 'nameDesc', label: 'Model Name (Z to A)' }
];

const isLiveBike = (b) => {
  if (!b || b.isActive === false) return false;
  const slug = (b.slug || '').toLowerCase();
  const name = (b.name || '').toLowerCase();
  if (slug.startsWith('fav-test-bike') || slug.startsWith('inactive-fav-bike')) return false;
  if (name.includes('test bike') || name.includes('inactive bike')) return false;
  return true;
};

const BikesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const shouldReduceMotion = usePrefersReducedMotion();
  const accessiblePageTransition = getAccessibleVariant(pageTransition, shouldReduceMotion);
  const [, startTransition] = useTransition();

  useSEO({
    title: 'Motorcycle Model Catalogue & Specifications',
    description: 'Browse the latest motorcycle models, engine displacement specs, power metrics, and ex-showroom price ranges across top brands.'
  });

  // Query parameter state
  const brandParam = searchParams.get('brand') || '';
  const categoryParam = searchParams.get('category') || '';
  const fuelTypeParam = searchParams.get('fuelType') || '';
  const searchParam = searchParams.get('search') || '';
  const minPriceParam = searchParams.get('minPrice') || '';
  const maxPriceParam = searchParams.get('maxPrice') || '';
  const sortParam = searchParams.get('sort') || 'newest';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);

  // Local filter inputs
  const [searchInput, setSearchInput] = useState(searchParam);
  const [minPriceInput, setMinPriceInput] = useState(minPriceParam);
  const [maxPriceInput, setMaxPriceInput] = useState(maxPriceParam);

  // Data states
  const [bikes, setBikes] = useState([]);
  const [brands, setBrands] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 12, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setSearchInput(searchParam);
    setMinPriceInput(minPriceParam);
    setMaxPriceInput(maxPriceParam);
  }, [searchParam, minPriceParam, maxPriceParam]);

  // Load brands once for filter dropdown
  useEffect(() => {
    const loadBrands = async () => {
      try {
        const res = await brandService.getBrands({ limit: 100 });
        setBrands(res.data || []);
      } catch (err) {
        console.error('Failed to load brands for filters:', err);
      }
    };
    loadBrands();
  }, []);

  // Fetch bikes whenever query parameters change
  const fetchBikes = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page: pageParam,
        limit: 12,
        sort: sortParam,
        isActive: 'true'
      };
      if (brandParam) params.brand = brandParam;
      if (categoryParam) params.category = categoryParam;
      if (fuelTypeParam) params.fuelType = fuelTypeParam;
      if (searchParam) params.search = searchParam;
      if (minPriceParam) params.minPrice = minPriceParam;
      if (maxPriceParam) params.maxPrice = maxPriceParam;

      const res = await bikeService.getBikes(params);
      if (res.success) {
        const liveBikes = (res.data || []).filter(isLiveBike);
        setBikes(liveBikes);
        setMeta(res.meta || { page: 1, limit: 12, total: liveBikes.length, pages: 1 });
      } else {
        setError(res.message || 'Failed to retrieve bikes.');
      }
    } catch (err) {
      setError(err.message || 'Failed to connect to the bike catalogue service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBikes();
  }, [brandParam, categoryParam, fuelTypeParam, searchParam, minPriceParam, maxPriceParam, sortParam, pageParam]);

  const updateFilters = (updates) => {
    startTransition(() => {
      const newParams = new URLSearchParams(searchParams);
      Object.entries(updates).forEach(([key, val]) => {
        if (val === '' || val === null || val === undefined) {
          newParams.delete(key);
        } else {
          newParams.set(key, val);
        }
      });
      if (!('page' in updates)) {
        newParams.set('page', '1');
      }
      setSearchParams(newParams);
    });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateFilters({ search: searchInput.trim() });
  };

  const handlePriceApply = (e) => {
    e.preventDefault();
    updateFilters({
      minPrice: minPriceInput.trim(),
      maxPrice: maxPriceInput.trim()
    });
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setMinPriceInput('');
    setMaxPriceInput('');
    setSearchParams({});
  };

  const hasActiveFilters = Boolean(
    brandParam || categoryParam || fuelTypeParam || searchParam || minPriceParam || maxPriceParam
  );

  return (
    <Container className="py-8 md:py-14 space-y-8">
      {/* Header */}
      <motion.div
        variants={accessiblePageTransition}
        initial="initial"
        animate="animate"
        className="space-y-3"
      >
        <Badge variant="brand" size="sm" dot>
          Active Model Lineup
        </Badge>
        <h1 className="typography-h1 text-surface-50 font-black">Flagship Motorcycle Catalogue</h1>
        <p className="typography-body max-w-2xl text-surface-200">
          Browse verified motorcycle specifications, engine displacements, power figures, and ex-showroom price ranges.
        </p>
      </motion.div>

      {/* Horizontal Category Chips matching reference */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 -mt-2">
        <button
          type="button"
          onClick={() => updateFilters({ category: '' })}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
            !categoryParam
              ? 'bg-brand-red text-white shadow-button'
              : 'bg-white hover:bg-surface-800 text-surface-200 hover:text-surface-50 border border-border'
          }`}
        >
          All Categories
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => updateFilters({ category: cat })}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
              categoryParam === cat
                ? 'bg-brand-red text-white shadow-button'
                : 'bg-white hover:bg-surface-800 text-surface-200 hover:text-surface-50 border border-border'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Filter and Search Panel */}
      <div className="bg-white p-5 rounded-2xl border border-border shadow-xs space-y-4">
        {/* Search bar */}
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Input
              icon={Search}
              placeholder="Search by bike model name, tagline, or specs..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="bg-white border-border"
            />
          </div>
          <Button type="submit" variant="primary" size="md" icon={Search} className="shrink-0 bg-brand-red hover:bg-brand-red-hover text-white">
            Search
          </Button>
          {hasActiveFilters && (
            <Button
              type="button"
              variant="outline"
              size="md"
              icon={RotateCcw}
              onClick={handleResetFilters}
              className="shrink-0 text-xs"
            >
              Reset Filters
            </Button>
          )}
        </form>

        {/* Dropdown Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-border/80 text-xs">
          {/* Brand Filter */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-surface-200 mb-1">
              Brand
            </label>
            <select
              value={brandParam}
              onChange={(e) => updateFilters({ brand: e.target.value })}
              className="w-full bg-white border border-border text-surface-100 rounded-lg px-3 py-2 outline-none focus:border-brand-red text-xs shadow-xs"
            >
              <option value="">All Brands ({brands.length})</option>
              {brands.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-surface-200 mb-1">
              Category
            </label>
            <select
              value={categoryParam}
              onChange={(e) => updateFilters({ category: e.target.value })}
              className="w-full bg-white border border-border text-surface-100 rounded-lg px-3 py-2 outline-none focus:border-brand-red text-xs shadow-xs"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Fuel Type Filter */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-surface-200 mb-1">
              Fuel Type
            </label>
            <select
              value={fuelTypeParam}
              onChange={(e) => updateFilters({ fuelType: e.target.value })}
              className="w-full bg-white border border-border text-surface-100 rounded-lg px-3 py-2 outline-none focus:border-brand-red text-xs shadow-xs"
            >
              <option value="">All Fuel Types</option>
              {FUEL_TYPES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          {/* Sorting */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-surface-200 mb-1">
              Sort By
            </label>
            <select
              value={sortParam}
              onChange={(e) => updateFilters({ sort: e.target.value })}
              className="w-full bg-white border border-border text-surface-100 rounded-lg px-3 py-2 outline-none focus:border-brand-red text-xs shadow-xs"
            >
              {SORT_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Price Range Filter Row */}
        <form onSubmit={handlePriceApply} className="flex flex-wrap items-center gap-3 pt-3 border-t border-border/80 text-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-surface-200">
            Price Range (₹):
          </span>
          <div className="w-28">
            <input
              type="number"
              placeholder="Min Price"
              value={minPriceInput}
              onChange={(e) => setMinPriceInput(e.target.value)}
              className="w-full bg-white border border-border text-surface-100 rounded-lg px-2.5 py-1.5 outline-none focus:border-brand-red text-xs shadow-xs"
            />
          </div>
          <span className="text-surface-200">to</span>
          <div className="w-28">
            <input
              type="number"
              placeholder="Max Price"
              value={maxPriceInput}
              onChange={(e) => setMaxPriceInput(e.target.value)}
              className="w-full bg-white border border-border text-surface-100 rounded-lg px-2.5 py-1.5 outline-none focus:border-brand-red text-xs shadow-xs"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm" className="text-xs py-1.5 px-3 bg-white hover:bg-surface-800 text-surface-100 border border-border">
            Apply Price
          </Button>
        </form>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-surface-200">
        <span>
          Showing <strong className="text-surface-50">{bikes.length}</strong> of{' '}
          <strong className="text-surface-50">{meta.total}</strong> active models
        </span>
        {meta.pages > 1 && (
          <span>
            Page {meta.page} of {meta.pages}
          </span>
        )}
      </div>

      {/* Content Rendering: Loading / Error / Empty / Cards */}
      {loading ? (
        <div className="py-12">
          <Loading type="skeleton" rows={4} />
        </div>
      ) : error ? (
        <ErrorState
          title="Could Not Load Catalogue"
          message={error}
          onRetry={fetchBikes}
          retryLabel="Retry Catalogue"
        />
      ) : bikes.length === 0 ? (
        <EmptyState
          title="No motorcycles match your criteria"
          message="Try adjusting your brand, category, or price range filters to view available models."
          actionLabel="Clear All Filters"
          onAction={handleResetFilters}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bikes.map((bike) => {
            const imageUrl = getBikeImageUrl(bike);

            return (
              <Card
                key={bike._id}
                variant="elevated"
                interactive
                className="flex flex-col justify-between space-y-5 group bg-white border border-border shadow-card hover:shadow-card-hover rounded-2xl overflow-hidden p-5"
              >
                <div className="space-y-4">
                  {/* Header Badges + Favorite Toggle */}
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="brand" size="sm">
                      {bike.brand?.name || 'Brand'}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-surface-200 font-semibold uppercase tracking-wider">
                        {bike.category}
                      </span>
                      <FavoriteButton entityType="bike" entityId={bike._id} size="sm" />
                    </div>
                  </div>

                  {/* Bike Image / Representation Box */}
                  <div className="w-full h-44 rounded-xl bg-surface-900 border border-border/80 flex flex-col items-center justify-center p-2 text-center relative overflow-hidden group-hover:border-brand-red/30 transition-all">
                    <img
                      src={imageUrl}
                      alt={bike.name}
                      className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
                      onError={handleImageError}
                      loading="lazy"
                    />
                  </div>

                  {/* Title & Tagline */}
                  <div>
                    <h3 className="font-display font-bold text-surface-50 text-base line-clamp-1 group-hover:text-brand-red transition-colors">
                      {bike.name}
                    </h3>
                    {bike.tagline && (
                      <p className="text-xs text-surface-200 truncate mt-0.5">
                        {bike.tagline}
                      </p>
                    )}
                  </div>

                  {/* Technical Specs Indicators */}
                  <div className="space-y-2 text-xs pt-1 border-t border-border/60">
                    <div className="flex items-center justify-between text-surface-200">
                      <span className="flex items-center gap-1.5 text-surface-200">
                        <Gauge className="w-3.5 h-3.5 text-brand-red" /> Power & Engine
                      </span>
                      <span className="font-semibold text-surface-50">
                        {bike.engine?.displacementCc ? `${bike.engine.displacementCc} cc` : bike.engine?.maxPower || 'Electric'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-surface-200">
                      <span className="flex items-center gap-1.5 text-surface-200">
                        <Fuel className="w-3.5 h-3.5 text-brand-red" /> Fuel & Mileage
                      </span>
                      <span className="font-semibold text-surface-50">
                        {bike.mileage?.estimatedKmpl
                          ? `${bike.mileage.estimatedKmpl} kmpl`
                          : bike.mileage?.certifiedRangeKm
                          ? `${bike.mileage.certifiedRangeKm} km`
                          : bike.fuelType}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pricing & CTA Buttons */}
                <div className="pt-4 border-t border-border/80 flex items-center justify-between gap-2">
                  <div>
                    <div className="font-display font-black text-surface-50 text-base leading-tight">
                      {formatPriceRange(bike.priceRange?.minPrice, bike.priceRange?.maxPrice)}
                    </div>
                    <span className="text-[10px] text-surface-200">Ex-Showroom Range</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CompareButton bike={bike} size="sm" />
                    <Link to={`/bikes/${bike.slug}`}>
                      <Button
                        variant="primary"
                        size="sm"
                        icon={ArrowRight}
                        iconPosition="right"
                        className="text-xs bg-brand-red hover:bg-brand-red-hover text-white shadow-button px-3.5 py-1.5 rounded-lg font-semibold"
                      >
                        Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {meta.pages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <Button
            variant="secondary"
            size="sm"
            disabled={pageParam <= 1}
            onClick={() => updateFilters({ page: String(pageParam - 1) })}
          >
            Previous
          </Button>

          <span className="px-4 py-2 text-xs font-semibold text-surface-200">
            Page {meta.page} of {meta.pages}
          </span>

          <Button
            variant="secondary"
            size="sm"
            disabled={pageParam >= meta.pages}
            onClick={() => updateFilters({ page: String(pageParam + 1) })}
          >
            Next
          </Button>
        </div>
      )}
    </Container>
  );
};

export default BikesPage;
