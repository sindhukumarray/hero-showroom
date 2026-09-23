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
  Info
} from 'lucide-react';
import { Container, Card, Badge, Button, Loading, ErrorState, EmptyState } from '../components';
import { bikeService } from '../services';
import { formatCurrency, formatPriceRange } from '../utils/formatters';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
          className="text-muted-foreground hover:text-white"
        >
          Back to Catalogue
        </Button>
      </motion.div>

      {/* Hero Showcase Card */}
      <motion.div
        variants={accessibleFadeIn}
        initial="hidden"
        animate="visible"
        className="glass-surface p-6 sm:p-8 md:p-10 rounded-card-lg border border-border/80 shadow-card-hover relative overflow-hidden"
      >
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <Badge variant="brand" size="md">
                {bike.brand?.name || 'Manufacturer'}
              </Badge>
              <Badge variant="default" size="md">
                {bike.category}
              </Badge>
              <Badge variant="info" size="md">
                {bike.fuelType}
              </Badge>
              {bike.isFeatured && (
                <Badge variant="warning" size="md" dot>
                  Featured Model
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
              <p className="typography-small text-surface-200 text-sm leading-relaxed max-w-xl">
                {bike.description}
              </p>
            )}
          </div>

          {/* Pricing Highlight Box */}
          <div className="shrink-0 bg-surface-900/90 border border-border p-6 rounded-card text-center min-w-[220px] space-y-3">
            <span className="text-xs uppercase font-bold tracking-widest text-muted-foreground">
              Ex-Showroom Price Range
            </span>
            <div className="font-display font-black text-2xl sm:text-3xl text-surface-50">
              {formatPriceRange(bike.priceRange?.minPrice, bike.priceRange?.maxPrice)}
            </div>
            <span className="inline-block text-[11px] text-muted-foreground">
              Indicative base pricing excluding RTO & Insurance
            </span>
            <div className="pt-2 border-t border-border/60">
              {bike.brand?._id && (
                <Link to={`/showrooms?brand=${bike.brand._id}`}>
                  <Button variant="outline" size="sm" fullWidth icon={Compass} className="text-xs">
                    Find Dealerships
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
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

      {/* Action Strip */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-card glass-surface border border-border">
        <div>
          <h4 className="font-display font-bold text-surface-50 text-base">Ready to Experience {bike.name}?</h4>
          <p className="typography-small text-xs text-muted-foreground">
            Locate authorized dealer showrooms to inspect the vehicle in person
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {bike.brand?._id ? (
            <Link to={`/showrooms?brand=${bike.brand._id}`} className="w-full sm:w-auto">
              <Button variant="primary" size="md" icon={Compass} fullWidth className="sm:w-auto">
                Find Showrooms
              </Button>
            </Link>
          ) : (
            <Link to="/showrooms" className="w-full sm:w-auto">
              <Button variant="primary" size="md" icon={Compass} fullWidth className="sm:w-auto">
                All Showrooms
              </Button>
            </Link>
          )}
          <Link to="/bikes" className="w-full sm:w-auto">
            <Button variant="secondary" size="md" fullWidth className="sm:w-auto">
              Browse More Bikes
            </Button>
          </Link>
        </div>
      </div>
    </Container>
  );
};

export default BikeDetailPage;
