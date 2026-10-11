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
  RotateCcw,
  Navigation,
  ExternalLink
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
import FavoriteButton from '../components/favorites/FavoriteButton';
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
      <div className="bg-white p-5 rounded-2xl border border-border shadow-xs space-y-4">
        {/* Search row */}
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Input
              icon={Search}
              placeholder="Search by showroom name, address, or dealer..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="bg-white border-border"
            />
          </div>
          <Button type="submit" variant="primary" size="md" icon={Search} className="shrink-0 bg-brand-red hover:bg-brand-red-hover text-white shadow-button">
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

          {/* City Filter */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-surface-200 mb-1">
              City
            </label>
            <select
              value={cityParam}
              onChange={(e) => updateFilters({ city: e.target.value })}
              className="w-full bg-white border border-border text-surface-100 rounded-lg px-3 py-2 outline-none focus:border-brand-red text-xs shadow-xs"
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
            <label className="block text-[11px] font-bold uppercase tracking-wider text-surface-200 mb-1">
              Outlet Type
            </label>
            <select
              value={typeParam}
              onChange={(e) => updateFilters({ showroomType: e.target.value })}
              className="w-full bg-white border border-border text-surface-100 rounded-lg px-3 py-2 outline-none focus:border-brand-red text-xs shadow-xs"
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
      </div>

      {/* Interactive Dealership Network Map Widget */}
      <div className="relative rounded-2xl overflow-hidden border border-border bg-gradient-to-br from-white to-background-deep p-4 sm:p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-red/10 border border-brand-red/20 flex items-center justify-center text-brand-red shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-surface-50 flex items-center gap-2">
              Pan-India Verified Dealership Network
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </h4>
            <p className="text-xs text-surface-200">
              Interactive GPS dealership discovery across 15+ metropolitan zones with verified OEM test ride tracks.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold shrink-0">
          <span className="px-3 py-1.5 rounded-lg bg-white border border-border text-surface-100 shadow-xs flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-brand-red" />
            {cities.length > 0 ? `${cities.length} Active Hubs` : '15+ Hubs'}
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-brand-red-subtle border border-brand-red/20 text-brand-red font-bold">
            Live Fleets
          </span>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-surface-200">
        <span>
          Showing <strong className="text-surface-50">{showrooms.length}</strong> of{' '}
          <strong className="text-surface-50">{meta.total}</strong> verified showrooms
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
          {showrooms.map((showroom) => {
            const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              `${showroom.name} ${showroom.address?.fullAddress || ''}`
            )}`;
            const phoneHref = showroom.contact?.phone ? `tel:${showroom.contact.phone}` : null;

            return (
              <Card
                key={showroom._id}
                variant="elevated"
                interactive
                className="flex flex-col justify-between space-y-4 group bg-white border border-border shadow-card hover:shadow-card-hover rounded-2xl p-5"
              >
                <div className="space-y-3.5">
                  {/* Header Tag & Badges + Favorite Button */}
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="brand" size="sm">
                      {showroom.brand?.name || 'Dealership'}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-surface-200 font-semibold uppercase tracking-wider">
                        {showroom.showroomType}
                      </span>
                      <FavoriteButton entityType="showroom" entityId={showroom._id} size="sm" />
                    </div>
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
                          className="text-[10px] px-2 py-0.5 rounded-md bg-surface-900 border border-border text-surface-200 font-medium"
                        >
                          ✓ {f}
                        </span>
                      ))}
                      {showroom.facilities.length > 2 && (
                        <span className="text-[10px] px-1.5 py-0.5 text-surface-200 font-semibold">
                          +{showroom.facilities.length - 2} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Quick Action Links: Directions & Call */}
                  <div className="flex items-center gap-2 pt-1 text-xs">
                    <a
                      href={directionsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-900 hover:bg-surface-800 text-surface-100 border border-border font-medium transition-colors"
                      title="Open Google Maps directions"
                    >
                      <Navigation className="w-3 h-3 text-brand-red" />
                      Directions
                    </a>
                    {phoneHref && (
                      <a
                        href={phoneHref}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-900 hover:bg-surface-800 text-surface-100 border border-border font-medium transition-colors"
                        title="Call dealership directly"
                      >
                        <Phone className="w-3 h-3 text-brand-red" />
                        Call
                      </a>
                    )}
                  </div>
                </div>

                {/* Card Footer: Rating, Phone & CTA */}
                <div className="pt-4 border-t border-border/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-amber-500 font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-500" />
                    <span>{showroom.rating?.average ? showroom.rating.average.toFixed(1) : '4.5'}</span>
                    <span className="text-[10px] text-surface-200 font-normal">
                      ({showroom.rating?.count || 12})
                    </span>
                  </div>

                  <Link to={`/showrooms/${showroom.slug}`}>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={ArrowRight}
                      iconPosition="right"
                      className="text-xs bg-brand-red hover:bg-brand-red-hover text-white shadow-button px-3.5 py-1.5 rounded-lg font-semibold"
                    >
                      View Details
                    </Button>
                  </Link>
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

export default ShowroomsPage;
