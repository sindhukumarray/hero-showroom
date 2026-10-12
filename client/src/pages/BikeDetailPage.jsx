import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Bike,
  Gauge,
  Fuel,
  ShieldCheck,
  Zap,
  ArrowLeft,
  CheckCircle2,
  SlidersHorizontal,
  Compass,
  Layers,
  Sparkles,
  Info,
  Calendar,
  Send,
  Tag,
  Calculator
} from 'lucide-react';
import { Container, Card, Badge, Button, Loading, ErrorState, EmptyState, Modal, LeadForm, TestRideForm, FavoriteButton, CompareButton, EmiCalculator } from '../components';
import { bikeService, offerService } from '../services';
import { formatCurrency, formatPriceRange } from '../utils/formatters';
import { calculateEmi } from '../utils/emiCalculator';
import { getBikeImageUrl, getBikeGalleryImages, handleImageError } from '../utils/bikeImages';
import { useSEO } from '../hooks/useSEO';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { fadeIn, getAccessibleVariant } from '../animations/variants';

const BikeDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const shouldReduceMotion = usePrefersReducedMotion();
  const accessibleFadeIn = getAccessibleVariant(fadeIn, shouldReduceMotion);

  const [bike, setBike] = useState(null);
  const [variants, setVariants] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [bikeOffers, setBikeOffers] = useState([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTestRideModalOpen, setIsTestRideModalOpen] = useState(false);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);

  useSEO({
    title: bike ? `${bike.name} — Technical Specifications & Pricing` : 'Bike Model Details',
    description: bike
      ? `Explore ${bike.name} by ${bike.brand?.name || 'Manufacturer'}. Engine, mileage, power, ex-showroom price range, and trim variants.`
      : 'Motorcycle technical specifications and variant configurations.'
  });

  const fetchBikeData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [bikeRes, variantsRes] = await Promise.all([
        bikeService.getBikeBySlug(slug),
        bikeService.getBikeVariants(slug).catch(() => ({ success: true, data: [] }))
      ]);

      if (bikeRes.success && bikeRes.data) {
        setBike(bikeRes.data);
        const variantList = variantsRes.data || [];
        setVariants(variantList);
        if (variantList.length > 0) {
          setSelectedVariant(variantList[0]);
        }

        // Fetch active offers for this bike
        try {
          const offersRes = await offerService.getOffers({
            bike: bikeRes.data._id,
            active: 'true',
            limit: 3
          });
          if (offersRes?.success && Array.isArray(offersRes?.data)) {
            setBikeOffers(offersRes.data);
          }
        } catch {
          // Graceful fallback if offers cannot be loaded
          setBikeOffers([]);
        }
      } else {
        setError('Bike model could not be found.');
      }
    } catch (err) {
      setError(err.message || 'Failed to load motorcycle details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slug) {
      fetchBikeData();
    }
  }, [slug]);

  if (loading) {
    return (
      <Container className="py-12 md:py-16">
        <Loading type="spinner" text="Loading vehicle specifications & variants..." size="lg" />
      </Container>
    );
  }

  if (error || !bike) {
    return (
      <Container className="py-12 md:py-16">
        <ErrorState
          title="Vehicle Model Not Found"
          message={error || 'The requested motorcycle model does not exist in our active catalogue.'}
          onRetry={fetchBikeData}
          retryLabel="Try Again"
        />
        <div className="text-center mt-6">
          <Button
            variant="secondary"
            size="sm"
            icon={ArrowLeft}
            onClick={() => navigate('/bikes')}
          >
            Back to Bike Catalogue
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-8 md:py-14 space-y-10">
      {/* Back Button */}
      <motion.div variants={accessibleFadeIn} initial="hidden" animate="visible">
        <Button
          variant="ghost"
          size="sm"
          icon={ArrowLeft}
          onClick={() => navigate(-1)}
          className="text-muted-foreground hover:text-surface-50"
        >
          Back to Catalogue
        </Button>
      </motion.div>

      {/* Hero Showcase Card */}
      <motion.div
        variants={accessibleFadeIn}
        initial="hidden"
        animate="visible"
        className="bg-white p-6 sm:p-8 rounded-2xl border border-border shadow-card relative overflow-hidden"
      >
        {/* Header row with badges and title */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 pb-6 border-b border-border/80">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="brand" size="md">
                {bike.brand?.name || 'Hero'}
              </Badge>
              <Badge variant="default" size="md">
                {bike.category}
              </Badge>
              <Badge variant="info" size="md">
                {bike.fuelType}
              </Badge>
              {bike.isFeatured && (
                <Badge variant="warning" size="md" dot>
                  Featured Flagship
                </Badge>
              )}
            </div>

            <h1 className="typography-h1 text-surface-50 font-black tracking-tight">{bike.name}</h1>

            {bike.tagline && (
              <p className="typography-body text-brand-red text-base md:text-lg font-semibold">
                "{bike.tagline}"
              </p>
            )}

            {bike.description && (
              <p className="typography-small text-surface-200 text-sm leading-relaxed max-w-2xl">
                {bike.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <FavoriteButton
              entityType="bike"
              entityId={bike._id}
              size="md"
              showLabel
              className="bg-white border border-border"
            />
            <CompareButton bike={bike} size="md" />
          </div>
        </div>

        {/* Gallery Showcase & Pricing Action Column */}
        {(() => {
          const gallery = getBikeGalleryImages(bike);
          const activeSrc = gallery[activeImageIndex] || getBikeImageUrl(bike);
          const currentPrice = selectedVariant?.exShowroomPrice || bike.priceRange?.minPrice || 100000;
          const quickEmi = calculateEmi({
            vehiclePrice: currentPrice,
            downPayment: currentPrice * 0.2,
            annualInterestRate: 8.5,
            tenureMonths: 36
          });

          const VIEW_LABELS = [
            'Studio Profile Showcase',
            'CAD Chassis & Powertrain Blueprint',
            'Digital Cockpit & Telemetry Console'
          ];

          return (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6">
              {/* Left/Center: Large Motorcycle Showcase & Thumbnail Strip */}
              <div className="lg:col-span-8 space-y-4">
                <div className="w-full h-72 sm:h-96 md:h-[420px] rounded-2xl bg-surface-900 border border-border/90 flex items-center justify-center p-4 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-radial-gradient from-transparent to-black/10 pointer-events-none" />
                  <img
                    src={activeSrc}
                    alt={`${bike.name} showcase`}
                    className="w-full h-full object-cover rounded-xl transition-all duration-500 group-hover:scale-102"
                    onError={(e) => handleImageError(e, bike)}
                  />
                  <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white flex items-center gap-2 border border-white/10 shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-brand-red animate-pulse" />
                    <span>View {activeImageIndex + 1} of {gallery.length}: {VIEW_LABELS[activeImageIndex] || 'Vehicle Showcase'}</span>
                  </div>
                </div>

                {/* Thumbnails row */}
                {gallery.length > 1 && (
                  <div className="flex items-center gap-3 overflow-x-auto pb-1">
                    {gallery.map((imgSrc, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveImageIndex(idx)}
                        title={VIEW_LABELS[idx] || `View ${idx + 1}`}
                        aria-label={`${bike.name} - ${VIEW_LABELS[idx] || `View ${idx + 1}`}`}
                        className={`w-20 h-14 sm:w-24 sm:h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                          activeImageIndex === idx
                            ? 'border-brand-red ring-2 ring-brand-red/20 scale-102'
                            : 'border-border/80 hover:border-brand-red/50 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={imgSrc}
                          alt={`${bike.name} - ${VIEW_LABELS[idx] || `View ${idx + 1}`}`}
                          className="w-full h-full object-cover"
                          onError={(e) => handleImageError(e, bike)}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: Pricing Card & High-Impact Action Column */}
              <div className="lg:col-span-4 flex flex-col justify-between bg-surface-900 rounded-2xl border border-border p-6 space-y-6">
                <div className="space-y-4">
                  <div>
                    <span className="text-[11px] uppercase font-bold tracking-widest text-surface-200">
                      Ex-Showroom Price Range
                    </span>
                    <div className="font-display font-black text-2xl sm:text-3xl text-surface-50 mt-1">
                      {formatPriceRange(bike.priceRange?.minPrice, bike.priceRange?.maxPrice)}
                    </div>
                  </div>

                  {/* Calculated Quick EMI Indicator */}
                  <div className="p-3.5 rounded-xl bg-white border border-border space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-surface-200 font-medium">
                        Est. EMI from:
                      </span>
                      <a
                        href="#emi-calculator"
                        className="font-bold text-brand-red hover:underline flex items-center gap-1"
                        aria-label="Estimated EMI from ₹{quickEmi.monthlyEmi} per month, customize in EMI calculator"
                      >
                        {quickEmi?.monthlyEmi > 0 ? `${formatCurrency(quickEmi.monthlyEmi)}/mo*` : 'Calculate EMI'}
                      </a>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/60">
                      <span>Based on 20% down, 36 mo</span>
                      <a
                        href="#emi-calculator"
                        className="text-brand-red hover:underline font-semibold"
                      >
                        Customize EMI →
                      </a>
                    </div>
                  </div>

                  {/* Quick specs pill summary */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white p-2.5 rounded-lg border border-border">
                      <div className="text-[10px] text-surface-200 font-bold uppercase">Displacement</div>
                      <div className="font-bold text-surface-50 mt-0.5">
                        {bike.engine?.displacementCc ? `${bike.engine.displacementCc} cc` : 'N/A'}
                      </div>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-border">
                      <div className="text-[10px] text-surface-200 font-bold uppercase">Fuel / Range</div>
                      <div className="font-bold text-surface-50 mt-0.5 truncate">
                        {bike.mileage?.estimatedKmpl ? `${bike.mileage.estimatedKmpl} kmpl` : bike.fuelType}
                      </div>
                    </div>
                  </div>
                </div>

                {/* CTAs */}
                <div className="space-y-2.5 pt-4 border-t border-border">
                  <Button
                    variant="primary"
                    size="md"
                    fullWidth
                    icon={Calendar}
                    onClick={() => setIsTestRideModalOpen(true)}
                    className="bg-brand-red hover:bg-brand-red-hover text-white shadow-button font-bold py-3 rounded-xl"
                  >
                    Book Free Test Ride
                  </Button>
                  <Button
                    variant="outline"
                    size="md"
                    fullWidth
                    icon={Send}
                    onClick={() => setIsLeadModalOpen(true)}
                    className="border-border hover:bg-white text-surface-50 font-semibold py-3 rounded-xl"
                  >
                    Enquire / Get Dealership Quote
                  </Button>
                  {bike.brand?._id && (
                    <Link to={`/showrooms?brand=${bike.brand._id}`} className="block">
                      <Button
                        variant="ghost"
                        size="sm"
                        fullWidth
                        icon={Compass}
                        className="text-xs text-surface-200 hover:text-surface-50"
                      >
                        Find Authorized Dealerships Near You
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Active Promotional Offer Banner */}
        {bikeOffers.length > 0 && (
          <div className="mt-6 pt-5 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-brand-red/5 p-4 rounded-card border border-brand-red/20">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-brand-red text-white flex items-center justify-center shrink-0 shadow-glow-red">
                <Tag className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-red">Special Offer</span>
                  {bikeOffers[0].offerType && (
                    <Badge variant="outline" size="sm" className="text-[10px] capitalize">
                      {bikeOffers[0].offerType}
                    </Badge>
                  )}
                </div>
                <h4 className="text-surface-50 font-bold text-sm">
                  {bikeOffers[0].title}
                </h4>
                {bikeOffers[0].description && (
                  <p className="text-xs text-surface-200 line-clamp-1">
                    {bikeOffers[0].description}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link to={`/offers/${bikeOffers[0].slug || bikeOffers[0]._id}`}>
                <Button variant="primary" size="sm" className="text-xs">
                  View Offer Details →
                </Button>
              </Link>
              {bikeOffers.length > 1 && (
                <Link to={`/offers?bike=${bike._id}`}>
                  <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-surface-50">
                    All Offers ({bikeOffers.length})
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </motion.div>

      {/* Technical Specifications Grid */}
      <div className="space-y-4">
        <h2 className="typography-h2 text-surface-50 font-bold">Engineering Specifications</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Powertrain & Engine */}
          <Card variant="elevated" className="space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-border/60">
              <div className="w-8 h-8 rounded-lg bg-brand-red/10 border border-brand-red/30 flex items-center justify-center text-brand-red">
                <Gauge className="w-4 h-4" />
              </div>
              <h3 className="typography-h3 text-surface-50 text-base">Powertrain</h3>
            </div>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Displacement</span>
                <span className="font-medium text-surface-100">
                  {bike.engine?.displacementCc ? `${bike.engine.displacementCc} cc` : 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Max Power</span>
                <span className="font-medium text-surface-100">{bike.engine?.maxPower || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Max Torque</span>
                <span className="font-medium text-surface-100">{bike.engine?.maxTorque || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Cooling</span>
                <span className="font-medium text-surface-100">{bike.engine?.cooling || 'Air Cooled'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Emission Standard</span>
                <span className="font-medium text-surface-100">
                  {bike.engine?.emissionStandard || 'BS6 Phase 2'}
                </span>
              </div>
            </div>
          </Card>

          {/* Transmission & Fuel */}
          <Card variant="elevated" className="space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-border/60">
              <div className="w-8 h-8 rounded-lg bg-brand-red/10 border border-brand-red/30 flex items-center justify-center text-brand-red">
                <Fuel className="w-4 h-4" />
              </div>
              <h3 className="typography-h3 text-surface-50 text-base">Drivetrain</h3>
            </div>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Transmission</span>
                <span className="font-medium text-surface-100">{bike.transmission || 'Manual'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Fuel Type</span>
                <span className="font-medium text-surface-100">{bike.fuelType}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Category</span>
                <span className="font-medium text-surface-100">{bike.category}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Est. Mileage / Range</span>
                <span className="font-medium text-emerald-400">
                  {bike.mileage?.estimatedKmpl
                    ? `${bike.mileage.estimatedKmpl} kmpl`
                    : bike.mileage?.certifiedRangeKm
                    ? `${bike.mileage.certifiedRangeKm} km (IDC)`
                    : 'Class Leading'}
                </span>
              </div>
            </div>
          </Card>

          {/* Brakes & Safety */}
          <Card variant="elevated" className="space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-border/60">
              <div className="w-8 h-8 rounded-lg bg-brand-red/10 border border-brand-red/30 flex items-center justify-center text-brand-red">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="typography-h3 text-surface-50 text-base">Brakes & Safety</h3>
            </div>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Front Brake</span>
                <span className="font-medium text-surface-100">{bike.brakes?.front || 'Disc'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Rear Brake</span>
                <span className="font-medium text-surface-100">{bike.brakes?.rear || 'Drum'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">ABS Configuration</span>
                <span className="font-medium text-surface-100">
                  {bike.brakes?.absType || 'Single Channel ABS'}
                </span>
              </div>
            </div>
          </Card>

          {/* Brand Division Overview */}
          <Card variant="elevated" className="space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-border/60">
              <div className="w-8 h-8 rounded-lg bg-brand-red/10 border border-brand-red/30 flex items-center justify-center text-brand-red">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="typography-h3 text-surface-50 text-base">Brand Heritage</h3>
            </div>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Manufacturer</span>
                <span className="font-semibold text-brand-red">{bike.brand?.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Origin</span>
                <span className="font-medium text-surface-100">
                  {bike.brand?.originCountry || 'India'}
                </span>
              </div>
              {bike.brand?.website && (
                <div className="pt-2">
                  <a
                    href={bike.brand.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-brand-red hover:underline"
                  >
                    Official Portal →
                  </a>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Trim Variants Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="typography-h2 text-surface-50 font-bold">Trim Variants & Colorways</h2>
            <p className="typography-small text-muted-foreground text-sm">
              Explore available specification packages and ex-showroom price points
            </p>
          </div>
          <Badge variant="brand" size="md">
            {variants.length} {variants.length === 1 ? 'Variant' : 'Variants'}
          </Badge>
        </div>

        {variants.length === 0 ? (
          <EmptyState
            title="No variants configured"
            message="No specific variant packages have been registered for this model yet."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {variants.map((variant) => (
              <Card
                key={variant._id || variant.slug}
                variant={selectedVariant?.slug === variant.slug ? 'accent' : 'default'}
                interactive
                onClick={() => setSelectedVariant(variant)}
                className="space-y-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="typography-h3 text-surface-50 text-lg font-bold">{variant.name}</h3>
                    <p className="font-display font-black text-xl text-brand-red mt-1">
                      {formatCurrency(variant.exShowroomPrice)}
                    </p>
                    <span className="text-[10px] text-muted-foreground">Ex-Showroom Price</span>
                  </div>
                  {selectedVariant?.slug === variant.slug && (
                    <Badge variant="brand" size="sm">
                      Selected
                    </Badge>
                  )}
                </div>

                {/* Color swatches */}
                {Array.isArray(variant.colors) && variant.colors.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-surface-200">Colorways:</span>
                    <div className="flex flex-wrap gap-2">
                      {variant.colors.map((c, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-900 border border-border/80 text-xs"
                        >
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0"
                            style={{ backgroundColor: c.hexCode || '#222' }}
                            aria-hidden="true"
                          />
                          <span className="text-surface-100 text-[11px] truncate max-w-[120px]">
                            {c.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Key Dimensions & Specifications */}
                {variant.keySpecifications && (
                  <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-border/60">
                    {variant.keySpecifications.kerbWeightKg > 0 && (
                      <div className="text-surface-200">
                        <span className="text-muted-foreground block text-[10px]">Kerb Weight</span>
                        <span className="font-medium text-surface-100">
                          {variant.keySpecifications.kerbWeightKg} kg
                        </span>
                      </div>
                    )}
                    {variant.keySpecifications.fuelCapacityLitres > 0 && (
                      <div className="text-surface-200">
                        <span className="text-muted-foreground block text-[10px]">Fuel Tank</span>
                        <span className="font-medium text-surface-100">
                          {variant.keySpecifications.fuelCapacityLitres} L
                        </span>
                      </div>
                    )}
                    {variant.keySpecifications.seatHeightMm > 0 && (
                      <div className="text-surface-200">
                        <span className="text-muted-foreground block text-[10px]">Seat Height</span>
                        <span className="font-medium text-surface-100">
                          {variant.keySpecifications.seatHeightMm} mm
                        </span>
                      </div>
                    )}
                    {variant.keySpecifications.groundClearanceMm > 0 && (
                      <div className="text-surface-200">
                        <span className="text-muted-foreground block text-[10px]">Ground Clearance</span>
                        <span className="font-medium text-surface-100">
                          {variant.keySpecifications.groundClearanceMm} mm
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Key Features Tags */}
                {Array.isArray(variant.keyFeatures) && variant.keyFeatures.length > 0 && (
                  <div className="pt-2 border-t border-border/40 flex flex-wrap gap-1.5">
                    {variant.keyFeatures.map((f, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded bg-surface-800 text-surface-200 border border-border/40"
                      >
                        ✓ {f}
                      </span>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Finance & EMI Calculator Section */}
      <section id="emi-calculator" className="space-y-6 pt-4 scroll-mt-24">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="typography-h2 text-surface-50 font-bold">Finance & EMI Estimator</h2>
            <p className="typography-small text-muted-foreground text-sm">
              Calculate customized monthly installments, down payment, and tenure options for {bike.name}
            </p>
          </div>
          <Badge variant="brand" size="md">
            Flexible Financing
          </Badge>
        </div>

        <EmiCalculator
          initialPrice={selectedVariant?.exShowroomPrice || bike.priceRange?.minPrice || 100000}
          bikeName={`${bike.name}${selectedVariant?.name ? ` (${selectedVariant.name})` : ''}`}
        />
      </section>

      {/* Action Strip */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-card glass-surface border border-border">
        <div>
          <h4 className="font-display font-bold text-surface-50 text-base">Ready to Experience {bike.name}?</h4>
          <p className="typography-small text-xs text-muted-foreground">
            Schedule a free dealership test ride or request official on-road price quotes
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <Button
            variant="primary"
            size="md"
            icon={Calendar}
            onClick={() => setIsTestRideModalOpen(true)}
            className="w-full sm:w-auto"
          >
            Book Test Ride
          </Button>
          <Button
            variant="secondary"
            size="md"
            icon={Send}
            onClick={() => setIsLeadModalOpen(true)}
            className="w-full sm:w-auto"
          >
            Enquire Now
          </Button>
          {bike.brand?._id ? (
            <Link to={`/showrooms?brand=${bike.brand._id}`} className="w-full sm:w-auto">
              <Button variant="outline" size="md" icon={Compass} fullWidth className="sm:w-auto">
                Find Showrooms
              </Button>
            </Link>
          ) : (
            <Link to="/showrooms" className="w-full sm:w-auto">
              <Button variant="outline" size="md" icon={Compass} fullWidth className="sm:w-auto">
                All Showrooms
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Book Test Ride Modal */}
      <Modal
        isOpen={isTestRideModalOpen}
        onClose={() => setIsTestRideModalOpen(false)}
        title={`Book Test Ride: ${bike.name}`}
        subtitle="Choose your preferred appointment schedule at an authorized dealership."
      >
        <TestRideForm
          bike={bike}
          variant={selectedVariant}
          onSuccess={() => {}}
          onCancel={() => setIsTestRideModalOpen(false)}
        />
      </Modal>

      {/* Send Lead / Enquiry Modal */}
      <Modal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        title={`Request Quote: ${bike.name}`}
        subtitle="Get in touch with authorized dealers for immediate on-road pricing and stock availability."
      >
        <LeadForm
          bike={bike}
          variant={selectedVariant}
          source="bike"
          onSuccess={() => {}}
          onCancel={() => setIsLeadModalOpen(false)}
        />
      </Modal>
    </Container>
  );
};

export default BikeDetailPage;
