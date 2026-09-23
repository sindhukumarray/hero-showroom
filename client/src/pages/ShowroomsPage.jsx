import React, { useEffect, useState, useTransition } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  MapPin,
  Building2,
  Phone,
  Star,
  Compass,
  ArrowRight,
  Filter,
  CheckCircle,
  Clock,
  RotateCcw
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
import { showroomService, brandService, cityService } from '../services';
import { useSEO } from '../hooks/useSEO';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { pageTransition, getAccessibleVariant } from '../animations/variants';

const SHOWROOM_TYPES = [
  'Standard Dealership',
  'Premia Flagship',
  'Experience Center',
  'Service Hub'
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'ratingDesc', label: 'Top Rated' },
  { value: 'nameAsc', label: 'Name (A to Z)' },
  { value: 'nameDesc', label: 'Name (Z to A)' }
];

const ShowroomsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const shouldReduceMotion = usePrefersReducedMotion();
  const accessiblePageTransition = getAccessibleVariant(pageTransition, shouldReduceMotion);
  const [, startTransition] = useTransition();

  useSEO({
    title: 'Authorized Showrooms & Dealership Outlets',
    description: 'Discover official motorcycle dealerships, Premia flagships, and experience centers across India with real-time verified data.'
  });

  // Query parameter state
  const brandParam = searchParams.get('brand') || '';
  const cityParam = searchParams.get('city') || '';
  const typeParam = searchParams.get('showroomType') || '';
  const searchParam = searchParams.get('search') || '';
  const sortParam = searchParams.get('sort') || 'newest';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);

  // Local inputs
  const [searchInput, setSearchInput] = useState(searchParam);

  // Data states
  const [showrooms, setShowrooms] = useState([]);
  const [brands, setBrands] = useState([]);
  const [cities, setCities] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 12, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sync search input when URL changes
  useEffect(() => {
    setSearchInput(searchParam);
  }, [searchParam]);

  // Load brands and cities once for filter dropdowns
  useEffect(() => {
    const loadFiltersData = async () => {
      try {
        const [brandRes, cityRes] = await Promise.all([
          brandService.getBrands({ limit: 100 }).catch(() => ({ data: [] })),
          cityService.getCities({ limit: 100 }).catch(() => ({ data: [] }))
        ]);
        setBrands(brandRes.data || []);
        setCities(cityRes.data || []);
      } catch (err) {
        console.error('Failed to load filter options:', err);
      }
    };
    loadFiltersData();
  }, []);

  // Fetch showrooms whenever query parameters change
  const fetchShowrooms = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page: pageParam,
        limit: 12,
        sort: sortParam
      };
      if (brandParam) params.brand = brandParam;
      if (cityParam) params.city = cityParam;
      if (typeParam) params.showroomType = typeParam;
      if (searchParam) params.search = searchParam;

      const res = await showroomService.getShowrooms(params);
      if (res.success) {
        setShowrooms(res.data || []);
        setMeta(res.meta || { page: 1, limit: 12, total: 0, pages: 1 });
      } else {
        setError(res.message || 'Failed to retrieve showrooms.');
      }
    } catch (err) {
      setError(err.message || 'Failed to connect to the showroom discovery service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShowrooms();
  }, [brandParam, cityParam, typeParam, searchParam, sortParam, pageParam]);

  // Helper to update URL search params
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
      // Reset page to 1 when filters change (unless page itself is updated)
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

  const handleResetFilters = () => {
    setSearchInput('');
    setSearchParams({});
  };

  const hasActiveFilters = Boolean(brandParam || cityParam || typeParam || searchParam);

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
          Live Dealership Network
        </Badge>
        <h1 className="typography-h1 text-surface-50 font-black">Authorized Dealership Showrooms</h1>
        <p className="typography-body max-w-2xl text-surface-200">
          Locate certified dealer outlets, Premia flagships, and experience lounges across India with verified staff and test-ride availability.
        </p>
      </motion.div>

      {/* Filter & Search Bar Controls */}
      <div className="glass-surface p-5 rounded-card border border-border space-y-4">
        {/* Search row */}
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Input
              icon={Search}
              placeholder="Search by showroom name, address, or dealer..."
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

          {/* City Filter */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
              City
            </label>
            <select
              value={cityParam}
              onChange={(e) => updateFilters({ city: e.target.value })}
              className="w-full bg-background-elevated border border-border text-surface-100 rounded-lg px-3 py-2 outline-none focus:border-brand-red text-xs"
            >
              <option value="">All Cities ({cities.length})</option>
              {cities.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}, {c.state}
                </option>
              ))}
            </select>
          </div>

          {/* Showroom Type Filter */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
              Outlet Type
            </label>
            <select
              value={typeParam}
              onChange={(e) => updateFilters({ showroomType: e.target.value })}
              className="w-full bg-background-elevated border border-border text-surface-100 rounded-lg px-3 py-2 outline-none focus:border-brand-red text-xs"
            >
              <option value="">All Outlets</option>
              {SHOWROOM_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
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
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Showing <strong className="text-surface-100">{showrooms.length}</strong> of{' '}
          <strong className="text-surface-100">{meta.total}</strong> verified showrooms
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
          title="Could Not Load Showrooms"
          message={error}
          onRetry={fetchShowrooms}
          retryLabel="Retry Discovery"
        />
      ) : showrooms.length === 0 ? (
        <EmptyState
          title="No showrooms match your search"
          message="Try adjusting your brand, city, or keyword filters to see available dealerships."
          actionLabel="Clear All Filters"
          onAction={handleResetFilters}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {showrooms.map((showroom) => (
            <Card
              key={showroom._id}
              variant="elevated"
              interactive
              className="flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3.5">
                {/* Header Tag & Badges */}
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="brand" size="sm">
                    {showroom.brand?.name || 'Dealership'}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground font-semibold">
                    {showroom.showroomType}
                  </span>
                </div>

                {/* Showroom Title */}
                <div>
                  <h3 className="typography-h3 text-surface-50 font-bold group-hover:text-brand-red transition-colors line-clamp-1">
                    {showroom.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-brand-red font-semibold mt-1">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {showroom.city?.name || 'City'}, {showroom.city?.state || 'State'}
                    </span>
                  </div>
                </div>

                {/* Full Address */}
                <p className="typography-small text-surface-200 text-xs line-clamp-2 leading-relaxed">
                  {showroom.address?.fullAddress}
                </p>

                {/* Facilities Pills */}
                {Array.isArray(showroom.facilities) && showroom.facilities.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {showroom.facilities.slice(0, 2).map((f, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded bg-surface-900 border border-border/60 text-muted-foreground"
                      >
                        ✓ {f}
                      </span>
                    ))}
                    {showroom.facilities.length > 2 && (
                      <span className="text-[10px] px-1.5 py-0.5 text-muted-foreground font-semibold">
                        +{showroom.facilities.length - 2} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Card Footer: Rating, Phone & CTA */}
              <div className="pt-4 border-t border-border/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-amber-400 font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{showroom.rating?.average ? showroom.rating.average.toFixed(1) : '4.5'}</span>
                  <span className="text-[10px] text-muted-foreground font-normal">
                    ({showroom.rating?.count || 12})
                  </span>
                </div>

                <Link to={`/showrooms/${showroom.slug}`}>
                  <Button variant="outline" size="sm" icon={ArrowRight} iconPosition="right" className="text-xs">
                    View Details
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

export default ShowroomsPage;
