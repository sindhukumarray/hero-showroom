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
  EmptyState
} from '../components';
import { bikeService, brandService } from '../services';
import { formatPriceRange } from '../utils/formatters';
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
        sort: sortParam
      };
      if (brandParam) params.brand = brandParam;
      if (categoryParam) params.category = categoryParam;
      if (fuelTypeParam) params.fuelType = fuelTypeParam;
      if (searchParam) params.search = searchParam;
      if (minPriceParam) params.minPrice = minPriceParam;
      if (maxPriceParam) params.maxPrice = maxPriceParam;

      const res = await bikeService.getBikes(params);
      if (res.success) {
        setBikes(res.data || []);
        setMeta(res.meta || { page: 1, limit: 12, total: 0, pages: 1 });
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

      {/* Filter and Search Panel */}
      <div className="glass-surface p-5 rounded-card border border-border space-y-4">
        {/* Search bar */}
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Input
              icon={Search}
              placeholder="Search by bike model name, tagline, or specs..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="bg-background-deep"
            />
          </div>
          <Button type="submit" variant="primary" size="md" icon={Search} className="shrink-0">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-border/60 text-xs">
          {/* Brand Filter */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
              Brand
            </label>
            <select
              value={brandParam}
              onChange={(e) => updateFilters({ brand: e.target.value })}
              className="w-full bg-background-elevated border border-border text-surface-100 rounded-lg px-3 py-2 outline-none focus:border-brand-red text-xs"
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
            <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
              Category
            </label>
            <select
              value={categoryParam}
              onChange={(e) => updateFilters({ category: e.target.value })}
              className="w-full bg-background-elevated border border-border text-surface-100 rounded-lg px-3 py-2 outline-none focus:border-brand-red text-xs"
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
            <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
              Fuel Type
            </label>
            <select
              value={fuelTypeParam}
              onChange={(e) => updateFilters({ fuelType: e.target.value })}
              className="w-full bg-background-elevated border border-border text-surface-100 rounded-lg px-3 py-2 outline-none focus:border-brand-red text-xs"
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
            <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
              Sort By
            </label>
            <select
              value={sortParam}
              onChange={(e) => updateFilters({ sort: e.target.value })}
              className="w-full bg-background-elevated border border-border text-surface-100 rounded-lg px-3 py-2 outline-none focus:border-brand-red text-xs"
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
        <form onSubmit={handlePriceApply} className="flex flex-wrap items-center gap-3 pt-3 border-t border-border/40 text-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Price Range (₹):
          </span>
          <div className="w-28">
            <input
              type="number"
              placeholder="Min Price"
              value={minPriceInput}
              onChange={(e) => setMinPriceInput(e.target.value)}
              className="w-full bg-background-elevated border border-border text-surface-100 rounded-lg px-2.5 py-1.5 outline-none focus:border-brand-red text-xs"
            />
          </div>
          <span className="text-muted-foreground">to</span>
          <div className="w-28">
            <input
              type="number"
              placeholder="Max Price"
              value={maxPriceInput}
              onChange={(e) => setMaxPriceInput(e.target.value)}
              className="w-full bg-background-elevated border border-border text-surface-100 rounded-lg px-2.5 py-1.5 outline-none focus:border-brand-red text-xs"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm" className="text-xs py-1.5 px-3">
            Apply Price
          </Button>
        </form>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Showing <strong className="text-surface-100">{bikes.length}</strong> of{' '}
          <strong className="text-surface-100">{meta.total}</strong> active models
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
          {bikes.map((bike) => (
            <Card
              key={bike._id}
              variant="elevated"
              interactive
              className="flex flex-col justify-between space-y-5 group"
            >
              <div className="space-y-4">
                {/* Header Badges */}
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="brand" size="sm">
                    {bike.brand?.name || 'Brand'}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground font-semibold">
                    {bike.category}
                  </span>
                </div>

                {/* Bike Representation Box */}
                <div className="w-full h-36 rounded-card bg-surface-900 border border-border/70 flex flex-col items-center justify-center p-4 text-center relative overflow-hidden group-hover:border-brand-red/30 transition-colors">
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-red/5 to-transparent pointer-events-none" />
                  <BikeIcon className="w-12 h-12 text-surface-200 group-hover:text-brand-red transition-colors mb-2" />
                  <span className="font-display font-bold text-surface-50 text-sm line-clamp-1">
                    {bike.name}
                  </span>
                  {bike.tagline && (
                    <span className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                      {bike.tagline}
                    </span>
                  )}
                </div>

                {/* Technical Specs Indicators */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between text-surface-200">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Gauge className="w-3.5 h-3.5 text-brand-red" /> Power & Engine
                    </span>
                    <span className="font-medium text-surface-100">
                      {bike.engine?.displacementCc ? `${bike.engine.displacementCc} cc` : bike.engine?.maxPower || 'Electric'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-surface-200">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Fuel className="w-3.5 h-3.5 text-brand-red" /> Fuel & Mileage
                    </span>
                    <span className="font-medium text-surface-100">
                      {bike.mileage?.estimatedKmpl
                        ? `${bike.mileage.estimatedKmpl} kmpl`
                        : bike.mileage?.certifiedRangeKm
                        ? `${bike.mileage.certifiedRangeKm} km`
                        : bike.fuelType}
                    </span>
                  </div>
                </div>
              </div>

              {/* Pricing & CTA */}
              <div className="pt-4 border-t border-border/60 flex items-center justify-between">
                <div>
                  <div className="font-display font-bold text-surface-50 text-base leading-tight">
                    {formatPriceRange(bike.priceRange?.minPrice, bike.priceRange?.maxPrice)}
                  </div>
                  <span className="text-[10px] text-muted-foreground">Ex-Showroom Range</span>
                </div>
                <Link to={`/bikes/${bike.slug}`}>
                  <Button variant="outline" size="sm" icon={ArrowRight} iconPosition="right" className="text-xs">
                    View Specs
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
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
