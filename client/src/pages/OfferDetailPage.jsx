import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar,
  Tag,
  ArrowLeft,
  Building2,
  Bike as BikeIcon,
  CheckCircle2,
  FileText,
  Share2,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { Container, Card, Badge, Button, Loading, ErrorState, Modal, LeadForm } from '../components';
import { offerService } from '../services';
import { useSEO } from '../hooks/useSEO';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { formatCurrency } from '../utils/formatters';
import { fadeIn, getAccessibleVariant } from '../animations/variants';

const OfferDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const shouldReduceMotion = usePrefersReducedMotion();
  const accessibleFadeIn = getAccessibleVariant(fadeIn, shouldReduceMotion);

  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useSEO({
    title: offer ? `${offer.title} | Exclusive Offer` : 'Special Offer Details',
    description: offer
      ? offer.description
      : 'Review terms, benefits, and dealer availability for this motorcycle promotional offer.'
  });

  const fetchOffer = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await offerService.getOffer(id);
      if (res && res.data) {
        setOffer(res.data);
      } else {
        setError('Offer details could not be found.');
      }
    } catch (err) {
      setError(err?.message || 'Failed to load offer details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchOffer();
    }
  }, [id]);

  if (loading) {
    return (
      <Container className="py-16 md:py-24">
        <Loading type="spinner" text="Loading promotional offer..." size="lg" />
      </Container>
    );
  }

  if (error || !offer) {
    return (
      <Container className="py-16 md:py-24">
        <ErrorState
          title="Offer Not Found"
          message={error || 'The requested promotional campaign is either expired or does not exist.'}
          onRetry={fetchOffer}
          retryLabel="Try Again"
        />
        <div className="text-center mt-6">
          <Button
            variant="secondary"
            size="sm"
            icon={ArrowLeft}
            onClick={() => navigate('/offers')}
          >
            Back to All Offers
          </Button>
        </div>
      </Container>
    );
  }

  const validUntilFormatted = offer.validUntil
    ? new Date(offer.validUntil).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    : 'Limited Time';

  const validFromFormatted = offer.validFrom
    ? new Date(offer.validFrom).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    : null;

  return (
    <Container className="py-8 md:py-14 space-y-8 max-w-5xl">
      {/* Navigation Breadcrumb */}
      <motion.div variants={accessibleFadeIn} initial="hidden" animate="visible">
        <Button
          variant="ghost"
          size="sm"
          icon={ArrowLeft}
          onClick={() => navigate('/offers')}
          className="text-muted-foreground hover:text-white"
        >
          All Offers
        </Button>
      </motion.div>

      {/* Offer Header Showcase */}
      <motion.div
        variants={accessibleFadeIn}
        initial="hidden"
        animate="visible"
        className="glass-surface p-6 sm:p-8 md:p-10 rounded-card-lg border border-border/80 shadow-card-hover relative overflow-hidden"
      >
        <div className="space-y-4 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2.5">
            <Badge variant="brand" size="md" className="capitalize">
              <Tag className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
              {offer.offerType} Deal
            </Badge>
            {offer.isActive && (
              <Badge variant="success" size="md" dot>
                Active Campaign
              </Badge>
            )}
            <span className="text-xs text-muted-foreground flex items-center gap-1.5 ml-1">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
              Valid until {validUntilFormatted}
            </span>
          </div>

          <h1 className="typography-h1 text-surface-50 font-black tracking-tight text-2xl sm:text-3xl md:text-4xl">
            {offer.title}
          </h1>

          {offer.discountValue > 0 && (
            <div className="p-4 rounded-xl bg-brand-red/10 border border-brand-red/30 inline-block">
              <span className="text-xs uppercase tracking-wider font-semibold text-brand-red block">
                Total Value Proposition
              </span>
              <span className="text-2xl sm:text-3xl font-black text-surface-50 font-display">
                Up to {formatCurrency(offer.discountValue)} Benefits
              </span>
            </div>
          )}

          <p className="typography-body text-surface-200 text-sm md:text-base leading-relaxed pt-2">
            {offer.description}
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-4">
            <Button
              variant="primary"
              size="lg"
              icon={Sparkles}
              onClick={() => setIsModalOpen(true)}
            >
              Enquire About This Offer
            </Button>
            {offer.bike?.slug && (
              <Link to={`/bikes/${offer.bike.slug}`}>
                <Button variant="secondary" size="lg" icon={BikeIcon}>
                  View {offer.bike.name} Specs
                </Button>
              </Link>
            )}
          </div>
        </div>
      </motion.div>

      {/* Grid: Context & Terms */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Applicable Motorcycle Card */}
        <Card variant="elevated" className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border/60">
            <BikeIcon className="w-4 h-4 text-brand-red" aria-hidden="true" />
            <h3 className="typography-h3 text-surface-50 text-base">Applicable Model</h3>
          </div>

          {offer.bike ? (
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-bold text-surface-100 text-base">{offer.bike.name}</p>
                <p className="text-xs text-muted-foreground">{offer.bike.category || 'Motorcycle'}</p>
              </div>

              {offer.variant && (
                <div className="pt-2 border-t border-border/40 text-xs text-muted-foreground">
                  Trim Variant: <strong className="text-surface-100">{offer.variant.name}</strong>
                </div>
              )}

              <Link to={`/bikes/${offer.bike.slug}`} className="inline-block pt-1">
                <span className="text-xs text-brand-red font-semibold hover:underline inline-flex items-center gap-1">
                  Explore Model Details <ExternalLink className="w-3 h-3" />
                </span>
              </Link>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Applicable across models.</p>
          )}
        </Card>

        {/* Participating Dealership Card */}
        <Card variant="elevated" className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border/60">
            <Building2 className="w-4 h-4 text-brand-red" aria-hidden="true" />
            <h3 className="typography-h3 text-surface-50 text-base">Dealership Availability</h3>
          </div>

          <div className="space-y-3 text-sm">
            {offer.showroom ? (
              <>
                <div>
                  <p className="font-bold text-surface-100">{offer.showroom.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {offer.showroom.city?.name || 'Local Hub'}, {offer.showroom.city?.state || 'India'}
                  </p>
                </div>
                <Link to={`/showrooms/${offer.showroom.slug}`} className="inline-block pt-1">
                  <span className="text-xs text-brand-red font-semibold hover:underline inline-flex items-center gap-1">
                    Showroom Profile & Location <ExternalLink className="w-3 h-3" />
                  </span>
                </Link>
              </>
            ) : (
              <div>
                <Badge variant="default" size="sm" className="mb-2">
                  Nationwide Validity
                </Badge>
                <p className="text-xs text-muted-foreground">
                  Valid across all authorized Hero MotoCorp and Premia dealerships in India.
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Campaign Timeline Card */}
        <Card variant="elevated" className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border/60">
            <Calendar className="w-4 h-4 text-brand-red" aria-hidden="true" />
            <h3 className="typography-h3 text-surface-50 text-base">Campaign Schedule</h3>
          </div>

          <div className="space-y-2 text-sm">
            {validFromFormatted && (
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Commenced:</span>
                <span className="text-surface-100 font-medium">{validFromFormatted}</span>
              </div>
            )}
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Concluding:</span>
              <span className="text-brand-red font-semibold">{validUntilFormatted}</span>
            </div>
            <div className="pt-2 border-t border-border/40 text-[11px] text-muted-foreground">
              Bookings must be initiated before the concluding date to lock in promotional pricing.
            </div>
          </div>
        </Card>
      </div>

      {/* Offer Benefits Highlights */}
      {Array.isArray(offer.benefits) && offer.benefits.length > 0 && (
        <Card variant="default" className="space-y-4">
          <h3 className="typography-h3 text-surface-50 text-base flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" aria-hidden="true" />
            Included Campaign Benefits & Privileges
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {offer.benefits.map((benefit, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2.5 p-3 rounded-lg bg-surface-900 border border-border/60 text-sm text-surface-100"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Terms & Conditions */}
      {offer.terms && (
        <Card variant="default" className="space-y-2 p-5 bg-surface-950/70 border-border/60">
          <h4 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" aria-hidden="true" /> Terms & Conditions
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {offer.terms}
          </p>
        </Card>
      )}

      {/* Lead Enquiry Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Enquire About: ${offer.title}`}
      >
        <LeadForm
          offer={offer}
          bike={offer.bike}
          showroom={offer.showroom}
          variant={offer.variant}
          source="offer"
          onSuccess={() => {}}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </Container>
  );
};

export default OfferDetailPage;
