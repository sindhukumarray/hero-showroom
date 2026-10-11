import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  MapPin,
  Bike as BikeIcon,
  Compass,
  ShieldCheck,
  Sparkles,
  SlidersHorizontal,
  ArrowRight,
  Zap,
  CheckCircle2,
  Calendar,
  Building2,
  Fuel,
  Gauge,
  Star
} from 'lucide-react';

import {
  Section,
  Container,
  Button,
  Card,
  Badge,
  Input,
  Loading,
  ErrorState,
  OfferCard,
  CompareButton,
  FavoriteButton,
  CinematicHero
} from '../components';
import { getBikeImageUrl, handleImageError } from '../utils/bikeImages';
import {
  heroHeadline,
  heroContainer,
  fadeIn,
  getAccessibleVariant
} from '../animations/variants';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { useSEO } from '../hooks/useSEO';
import {
  brandService,
  cityService,
  bikeService,
  showroomService,
  offerService
} from '../services';
import { formatPriceRange } from '../utils/formatters';

const DEMO_BENEFITS = [
  {
    icon: ShieldCheck,
    title: 'Verified Showroom Discovery',
    description: 'Find official authorized dealerships with verified physical addresses, verified staff, and active test ride fleets.'
  },
  {
    icon: SlidersHorizontal,
    title: 'Side-by-Side Model Comparison',
    description: 'Evaluate technical specifications, power outputs, estimated mileage, and on-road pricing diffs head-to-head.'
  },
  {
    icon: Calendar,
    title: 'Direct Test Ride Scheduling',
    description: 'Explore upcoming availability and connect directly with preferred dealership branches for priority test drives.'
  },
  {
    icon: Zap,
    title: 'Transparent Pricing Insights',
    description: 'Understand ex-showroom baselines, indicative RTO, and state-wise insurance estimates without showroom markup surprises.'
  }
];

const HomePage = () => {
  const navigate = useNavigate();
  const shouldReduceMotion = usePrefersReducedMotion();
  const accessibleHeroContainer = getAccessibleVariant(heroContainer, shouldReduceMotion);
  const accessibleHeadline = getAccessibleVariant(heroHeadline, shouldReduceMotion);
  const accessibleFadeIn = getAccessibleVariant(fadeIn, shouldReduceMotion);

  const [activeSearchTab, setActiveSearchTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Live data states
  const [brands, setBrands] = useState([]);
  const [brandsLoading, setBrandsLoading] = useState(true);
  const [brandsError, setBrandsError] = useState(null);

  const [cities, setCities] = useState([]);
  const [citiesLoading, setCitiesLoading] = useState(true);
  const [citiesError, setCitiesError] = useState(null);

  const [bikes, setBikes] = useState([]);
  const [bikesLoading, setBikesLoading] = useState(true);
  const [bikesError, setBikesError] = useState(null);

  const [showrooms, setShowrooms] = useState([]);
  const [showroomsLoading, setShowroomsLoading] = useState(true);
  const [showroomsError, setShowroomsError] = useState(null);

  const [offers, setOffers] = useState([]);

  useSEO({
    title: 'Hero Showroom — Discover Authorized Showrooms & Flagship Bikes',
    description: 'Explore verified dealer showrooms, flagship motorcycle catalogues, specs comparison, and transparent automotive discovery.'
  });

  // Fetch real catalogue data independently
  useEffect(() => {
    // 1. Fetch Top Brands
    brandService
      .getBrands({ limit: 4 })
      .then((res) => {
        if (res.success && res.data) setBrands(res.data);
      })
      .catch((err) => setBrandsError(err.message || 'Failed to load brands'))
      .finally(() => setBrandsLoading(false));

    // 2. Fetch Popular Cities
    cityService
      .getCities({ limit: 6 })
      .then((res) => {
        if (res.success && res.data) setCities(res.data);
      })
      .catch((err) => setCitiesError(err.message || 'Failed to load cities'))
      .finally(() => setCitiesLoading(false));

    // 3. Fetch Featured Bikes
    bikeService
      .getBikes({ limit: 4, sort: 'newest' })
      .then((res) => {
        if (res.success && res.data) setBikes(res.data);
      })
      .catch((err) => setBikesError(err.message || 'Failed to load bikes'))
      .finally(() => setBikesLoading(false));

    // 4. Fetch Featured Showrooms
    showroomService
      .getShowrooms({ limit: 3, sort: 'newest' })
      .then((res) => {
        if (res.success && res.data) setShowrooms(res.data);
      })
      .catch((err) => setShowroomsError(err.message || 'Failed to load showrooms'))
      .finally(() => setShowroomsLoading(false));

    // 5. Fetch Active Promotional Offers
    offerService
      .getOffers({ limit: 3, active: 'true' })
      .then((res) => {
        if (res.success && Array.isArray(res.data)) setOffers(res.data);
      })
      .catch(() => setOffers([]));
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const query = encodeURIComponent(searchQuery.trim());
    if (activeSearchTab === 'showrooms') {
      navigate(`/showrooms?search=${query}`);
    } else if (activeSearchTab === 'cities') {
      navigate(`/showrooms?search=${query}`);
    } else if (activeSearchTab === 'brands') {
      navigate(`/showrooms?search=${query}`);
    } else {
      navigate(`/bikes?search=${query}`);
    }
  };

  const handleChipClick = (query) => {
    setSearchQuery(query);
    navigate(`/bikes?search=${encodeURIComponent(query)}`);
  };

  return (
    <div className="space-y-6 md:space-y-12">
      {/* ================================================== */}
      {/* 1. CINEMATIC HERO SECTION: The Definitive Showroom */}
      {/* ================================================== */}
      <CinematicHero />

      {/* ================================================== */}
      {/* 2. SMART SEARCH FOUNDATION                         */}
      {/* ================================================== */}
      <section id="search-directory" className="relative z-20 pt-2 md:pt-4">
        <Container>
          <div className="bg-white p-5 sm:p-6 md:p-8 rounded-2xl border border-border shadow-card max-w-4xl mx-auto space-y-5">
            {/* Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-border/80">
              {[
                { id: 'all', label: 'All Categories' },
                { id: 'bikes', label: 'Bikes' },
                { id: 'brands', label: 'Brands' },
                { id: 'cities', label: 'Cities' },
                { id: 'showrooms', label: 'Showrooms' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveSearchTab(tab.id)}
                  className={`
                    px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer
                    ${
                      activeSearchTab === tab.id
                        ? 'bg-brand-red text-white shadow-button'
                        : 'text-surface-200 hover:text-surface-50 hover:bg-surface-800'
                    }
                  `}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input Bar */}
            <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative w-full flex-1">
                <Input
                  icon={Search}
                  placeholder={`Search ${
                    activeSearchTab === 'all'
                      ? 'models, cities, or authorized dealer showrooms...'
                      : `${activeSearchTab}...`
                  }`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white border-border text-surface-100 text-sm md:text-base focus:border-brand-red"
                />
              </div>
              <Button
                type="submit"
                variant="primary"
                size="md"
                icon={Search}
                className="w-full sm:w-auto shrink-0 bg-brand-red hover:bg-brand-red-hover text-white shadow-button font-semibold rounded-xl px-6 py-3"
              >
                Search Directory
              </Button>
            </form>

            {/* Quick Filter Tag Chips */}
            <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
              <span className="font-semibold text-surface-200">Popular Searches:</span>
              {['Splendor', 'Premia', 'Vida', 'Harley', 'Mumbai', 'Delhi'].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleChipClick(chip)}
                  className="px-2.5 py-1 rounded-md bg-surface-900 hover:bg-surface-800 text-surface-200 hover:text-surface-50 border border-border text-xs transition-colors cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* ================================================== */}
      {/* 3. TOP BRANDS SECTION                              */}
      {/* ================================================== */}
      <Section
        id="brands"
        eyebrow="Portfolio & Divisions"
        title="Official Brand Divisions"
        description="Explore authorized brand lines from world-leading commuter flagships to premium luxury outlets."
        actions={
          <NavLink to="/showrooms">
            <Button variant="outline" size="sm" icon={ArrowRight} iconPosition="right">
              View All Showrooms
            </Button>
          </NavLink>
        }
      >
        {brandsLoading ? (
          <Loading type="skeleton" rows={1} />
        ) : brandsError ? (
          <div className="p-6 text-center text-xs text-muted-foreground glass-surface rounded-card border border-border">
            Brands currently loading in background.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {brands.map((brand) => (
              <Card
                key={brand._id || brand.slug}
                interactive
                variant="elevated"
                onClick={() => navigate(`/showrooms?brand=${brand._id}`)}
                className="flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="brand" size="sm">
                      {brand.originCountry || 'Official'}
                    </Badge>
                    <Building2 className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="typography-h3 text-surface-50">{brand.name}</h3>
                    <p className="typography-small text-brand-red text-xs font-semibold">
                      {brand.originCountry || 'Automotive Division'}
                    </p>
                  </div>
                  <p className="typography-small text-surface-200 text-xs leading-relaxed line-clamp-2">
                    {brand.description || 'Authorized automotive manufacturer and dealership division.'}
                  </p>
                </div>

                <div className="pt-4 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Explore Dealerships</span>
                  <span className="text-brand-red font-semibold flex items-center gap-1">
                    Discover <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Section>

      {/* ================================================== */}
      {/* 4. POPULAR CITIES SECTION                          */}
      {/* ================================================== */}
      <Section
        id="cities"
        eyebrow="Dealership Network"
        title="Popular Dealer Cities"
        description="Find official showrooms in major metropolitan centers with verified test ride fleets."
        actions={
          <NavLink to="/showrooms">
            <Button variant="outline" size="sm" icon={ArrowRight} iconPosition="right">
              All Cities
            </Button>
          </NavLink>
        }
      >
        {citiesLoading ? (
          <Loading type="skeleton" rows={1} />
        ) : citiesError ? (
          <div className="p-6 text-center text-xs text-muted-foreground glass-surface rounded-card border border-border">
            Cities directory currently loading in background.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {cities.map((city) => (
              <Card
                key={city._id || city.slug}
                interactive
                variant="glass"
                onClick={() => navigate(`/showrooms?city=${city._id}`)}
                className="p-5 text-center flex flex-col items-center justify-between space-y-3 group"
              >
                <div className="w-10 h-10 rounded-full bg-surface-800 border border-border group-hover:border-brand-red/40 flex items-center justify-center text-brand-red transition-colors">
                  <MapPin className="w-5 h-5" aria-hidden="true" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="font-display font-bold text-surface-50 text-base">{city.name}</h4>
                  <p className="typography-small text-[11px] text-muted-foreground">{city.state}</p>
                </div>
                <Badge variant="default" size="sm">
                  {city.tier || 'Metro'}
                </Badge>
              </Card>
            ))}
          </div>
        )}
      </Section>

      {/* ================================================== */}
      {/* 5. FEATURED BIKES SECTION                          */}
      {/* ================================================== */}
      <Section
        id="featured-bikes"
        eyebrow="Flagship Lineup"
        title="Featured Motorcycles"
        description="Precision-engineered performance machines, roadsters, and connected electric mobility."
        actions={
          <NavLink to="/bikes">
            <Button variant="outline" size="sm" icon={ArrowRight} iconPosition="right">
              Full Catalogue
            </Button>
          </NavLink>
        }
      >
        {bikesLoading ? (
          <Loading type="skeleton" rows={2} />
        ) : bikesError ? (
          <div className="p-6 text-center text-xs text-muted-foreground glass-surface rounded-card border border-border">
            Motorcycle catalogue loading in background.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {bikes.map((bike) => {
              const imageUrl = getBikeImageUrl(bike);
              return (
                <Card
                  key={bike._id || bike.slug}
                  interactive
                  variant="elevated"
                  className="bg-white rounded-2xl border border-border/80 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between space-y-4 p-5 group"
                >
                  <div className="space-y-3">
                    {/* Header & Badges */}
                    <div className="flex items-center justify-between">
                      <Badge variant="brand" size="sm">
                        {bike.brand?.name || 'Hero'}
                      </Badge>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-surface-200 font-bold uppercase tracking-wider">
                          {bike.category}
                        </span>
                        <FavoriteButton itemType="bike" itemId={bike._id || bike.id} size="sm" />
                      </div>
                    </div>

                    {/* Real Bike Image */}
                    <div className="w-full h-40 rounded-xl bg-surface-900 border border-border/80 flex items-center justify-center p-2 relative overflow-hidden group-hover:border-brand-red/30 transition-all">
                      <img
                        src={imageUrl}
                        alt={bike.name}
                        className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
                        onError={handleImageError}
                        loading="lazy"
                      />
                    </div>

                    {/* Model Name */}
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
                    <div className="space-y-1.5 pt-2 border-t border-border/60 text-xs">
                      <div className="flex items-center justify-between text-surface-200">
                        <span className="flex items-center gap-1.5 text-surface-200">
                          <Gauge className="w-3.5 h-3.5 text-brand-red" /> Power & Engine
                        </span>
                        <span className="font-semibold text-surface-50">
                          {bike.engine?.displacementCc ? `${bike.engine.displacementCc} cc` : bike.fuelType}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-surface-200">
                        <span className="flex items-center gap-1.5 text-surface-200">
                          <Fuel className="w-3.5 h-3.5 text-brand-red" /> Fuel
                        </span>
                        <span className="font-semibold text-surface-50">{bike.fuelType}</span>
                      </div>
                    </div>
                  </div>

                  {/* Pricing & CTA */}
                  <div className="pt-3 border-t border-border/80 flex items-center justify-between gap-2">
                    <div>
                      <div className="font-display font-black text-surface-50 text-base leading-tight">
                        {formatPriceRange(bike.priceRange?.minPrice, bike.priceRange?.maxPrice)}
                      </div>
                      <span className="text-[10px] text-surface-200">Ex-Showroom</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CompareButton bike={bike} size="sm" />
                      <NavLink to={`/bikes/${bike.slug}`}>
                        <Button
                          variant="primary"
                          size="sm"
                          icon={ArrowRight}
                          iconPosition="right"
                          className="text-xs bg-brand-red hover:bg-brand-red-hover text-white shadow-button px-3.5 py-1.5 rounded-lg font-semibold"
                        >
                          Details
                        </Button>
                      </NavLink>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </Section>

      {/* ================================================== */}
      {/* 5B. EXCLUSIVE PROMOTIONAL OFFERS SECTION           */}
      {/* ================================================== */}
      {offers.length > 0 && (
        <Section
          id="promotional-offers"
          eyebrow="Limited-Time Deals"
          title="Exclusive Offers & Benefits"
          description="Explore seasonal discounts, exchange bonuses, zero-downpayment financing perks, and complimentary service packages."
          actions={
            <NavLink to="/offers">
              <Button variant="outline" size="sm" icon={ArrowRight} iconPosition="right">
                View All Offers
              </Button>
            </NavLink>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {offers.map((offer) => (
              <OfferCard key={offer._id} offer={offer} />
            ))}
          </div>
        </Section>
      )}

      {/* ================================================== */}
      {/* 6. FEATURED SHOWROOMS SECTION                      */}
      {/* ================================================== */}
      <Section
        id="featured-showrooms"
        eyebrow="Authorized Network"
        title="Featured Showrooms"
        description="Visit certified showroom locations featuring dedicated test ride tracks and VIP service lounges."
        actions={
          <NavLink to="/showrooms">
            <Button variant="outline" size="sm" icon={ArrowRight} iconPosition="right">
              Locate Showroom
            </Button>
          </NavLink>
        }
      >
        {showroomsLoading ? (
          <Loading type="skeleton" rows={2} />
        ) : showroomsError ? (
          <div className="p-6 text-center text-xs text-muted-foreground glass-surface rounded-card border border-border">
            Showroom directory loading in background.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {showrooms.map((showroom) => (
              <Card
                key={showroom._id || showroom.slug}
                interactive
                variant="default"
                className="flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="success" size="sm" dot>
                      {showroom.brand?.name || 'Verified Outlet'}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1 font-semibold">
                      <MapPin className="w-3.5 h-3.5 text-brand-red" />
                      {showroom.city?.name || 'City'}
                    </span>
                  </div>

                  <h3 className="typography-h3 text-surface-50 text-lg line-clamp-1">{showroom.name}</h3>

                  <p className="typography-small text-surface-200 text-xs line-clamp-2">
                    {showroom.address?.fullAddress}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-muted-foreground">
                    <span className="px-2 py-0.5 rounded bg-surface-800 border border-border flex items-center gap-1 text-amber-400">
                      <Star className="w-3 h-3 fill-amber-400" />
                      {showroom.rating?.average ? showroom.rating.average.toFixed(1) : '4.5'}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-surface-800 border border-border">
                      {showroom.showroomType}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-border/60 flex items-center justify-between">
                  <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Official
                  </span>
                  <NavLink to={`/showrooms/${showroom.slug}`}>
                    <Button variant="secondary" size="sm" className="text-xs">
                      View Dealer
                    </Button>
                  </NavLink>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Section>

      {/* ================================================== */}
      {/* 7. BENEFITS SECTION                                */}
      {/* ================================================== */}
      <Section
        id="benefits"
        eyebrow="Why Choose Platform"
        title="Built for the Discerning Rider"
        description="Experience transparent automotive discovery powered by verified dealer data and commercial-grade engineering."
        align="center"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {DEMO_BENEFITS.map((benefit) => (
            <Card
              key={benefit.title}
              variant="glass"
              className="p-6 space-y-4 text-left border-border/70"
            >
              <div className="w-12 h-12 rounded-card bg-brand-red-subtle border border-brand-red/30 flex items-center justify-center text-brand-red">
                <benefit.icon className="w-6 h-6" aria-hidden="true" />
              </div>
              <h3 className="typography-h3 text-surface-50 text-base">{benefit.title}</h3>
              <p className="typography-small text-xs leading-relaxed text-surface-200">
                {benefit.description}
              </p>
            </Card>
          ))}
        </div>
      </Section>

      {/* ================================================== */}
      {/* 8. FINAL CTA SECTION                               */}
      {/* ================================================== */}
      <section className="py-12 md:py-20">
        <Container>
          <div className="relative overflow-hidden rounded-card-lg border border-brand-red/40 bg-gradient-to-r from-background-deep via-background-card to-background-elevated p-8 md:p-14 shadow-card-hover text-center md:text-left">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-brand-red/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 max-w-5xl mx-auto">
              <div className="space-y-3 max-w-xl">
                <Badge variant="brand" size="sm" dot>
                  Take the Next Step
                </Badge>
                <h2 className="typography-h2 text-surface-50">
                  Ready to Experience Official Dealership Excellence?
                </h2>
                <p className="typography-body text-surface-200 text-sm md:text-base">
                  Locate official authorized showrooms in your city or explore detailed technical specifications and walkarounds across the full lineup.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0">
                <NavLink to="/showrooms" className="w-full sm:w-auto">
                  <Button
                    variant="primary"
                    size="lg"
                    icon={Compass}
                    fullWidth
                    className="sm:w-auto"
                  >
                    Find Showrooms
                  </Button>
                </NavLink>
                <NavLink to="/bikes" className="w-full sm:w-auto">
                  <Button
                    variant="secondary"
                    size="lg"
                    icon={BikeIcon}
                    fullWidth
                    className="sm:w-auto"
                  >
                    Browse Models
                  </Button>
                </NavLink>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
};

export default HomePage;
