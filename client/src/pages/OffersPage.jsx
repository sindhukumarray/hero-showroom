import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Tag, Sparkles, Filter, RefreshCw, Bike, Building2 } from 'lucide-react';
import { Container, Section, Button, Loading, ErrorState, EmptyState, Modal, LeadForm } from '../components';
import OfferCard from '../components/offers/OfferCard';
import { offerService } from '../services';
import { useSEO } from '../hooks/useSEO';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { pageTransition, staggerContainer, fadeIn, getAccessibleVariant } from '../animations/variants';

const OffersPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const shouldReduceMotion = usePrefersReducedMotion();

  const accessiblePageTransition = getAccessibleVariant(pageTransition, shouldReduceMotion);
  const accessibleStagger = getAccessibleVariant(staggerContainer, shouldReduceMotion);
  const accessibleFadeIn = getAccessibleVariant(fadeIn, shouldReduceMotion);

  useSEO({
    title: 'Promotional Offers & Festive Deals',
    description: 'Explore the latest cashback deals, exchange bonuses, zero-down-payment schemes, and festive offers on flagship motorcycles.'
  });

  const [offers, setOffers] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 12, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State for Enquire
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter state
  const selectedType = searchParams.get('offerType') || '';

  const fetchOffers = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        active: 'true',
        limit: 12,
        page: searchParams.get('page') || 1
      };

      if (selectedType) {
        params.offerType = selectedType;
      }
      if (searchParams.get('bike')) {
        params.bike = searchParams.get('bike');
      }
      if (searchParams.get('showroom')) {
        params.showroom = searchParams.get('showroom');
      }

      const res = await offerService.getOffers(params);
      if (res && res.data) {
        setOffers(res.data);
        if (res.meta) setMeta(res.meta);
      } else {
        setOffers([]);
      }
    } catch (err) {
      setError(err?.message || 'Failed to retrieve promotional offers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, [searchParams]);

  const handleTypeFilter = (type) => {
    const nextParams = new URLSearchParams(searchParams);
    if (type) {
      nextParams.set('offerType', type);
    } else {
      nextParams.delete('offerType');
    }
    nextParams.delete('page');
    setSearchParams(nextParams);
  };

  const handleOpenEnquiry = (offer) => {
    setSelectedOffer(offer);
    setIsModalOpen(true);
  };

  const filterOptions = [
    { label: 'All Offers', value: '' },
    { label: 'Cashback', value: 'cashback' },
    { label: 'Discount', value: 'discount' },
    { label: 'Exchange Bonus', value: 'exchange' },
    { label: 'Accessories', value: 'accessories' },
    { label: 'Service Packages', value: 'service' },
    { label: 'Special Deals', value: 'special' }
  ];

  return (
    <motion.div
      variants={accessiblePageTransition}
      initial="hidden"
      animate="visible"
      className="min-h-screen py-8 md:py-12"
    >
      <Container className="space-y-8">
        {/* Header Hero Section */}
        <div className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-red/10 border border-brand-red/30 text-brand-red text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Limited-Time Incentives & Savings</span>
          </div>
          <h1 className="typography-h1 text-surface-50 font-black tracking-tight">
            Motorcycle Offers & Deals
          </h1>
          <p className="typography-body text-muted-foreground text-sm md:text-base">
            Discover authorized manufacturer benefits, festive bonuses, and special financing packages available across our premium dealer network.
          </p>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-card glass-surface border border-border">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5 mr-2">
              <Filter className="w-3.5 h-3.5 text-brand-red" aria-hidden="true" /> Categories:
            </span>
            {filterOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleTypeFilter(opt.value)}
                className={`
                  px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                  ${selectedType === opt.value
                    ? 'bg-brand-red text-white shadow-md'
                    : 'bg-surface-800 text-surface-200 hover:bg-surface-700'}
                `}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <Button
            variant="ghost"
            size="sm"
            icon={RefreshCw}
            onClick={fetchOffers}
            disabled={loading}
            className="text-xs text-muted-foreground hover:text-white"
          >
            Refresh
          </Button>
        </div>

        {/* Offer Cards Grid */}
        {loading ? (
          <div className="py-20">
            <Loading type="spinner" text="Fetching active promotional offers..." size="lg" />
          </div>
        ) : error ? (
          <ErrorState
            title="Unable to Load Offers"
            message={error}
            onRetry={fetchOffers}
            retryLabel="Try Again"
          />
        ) : offers.length === 0 ? (
          <EmptyState
            title="No Active Offers Found"
            message={
              selectedType
                ? `No promotional offers currently match the '${selectedType}' filter. Try selecting 'All Offers'.`
                : 'There are currently no active promotional campaigns available. Please check back soon!'
            }
            actionLabel="Reset Filters"
            onAction={() => handleTypeFilter('')}
          />
        ) : (
          <motion.div
            variants={accessibleStagger}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {offers.map((offer) => (
              <motion.div key={offer._id} variants={accessibleFadeIn} className="h-full">
                <OfferCard offer={offer} onEnquire={handleOpenEnquiry} />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Lead Enquiry Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={selectedOffer ? `Enquire: ${selectedOffer.title}` : 'Special Offer Enquiry'}
        >
          {selectedOffer && (
            <LeadForm
              offer={selectedOffer}
              bike={selectedOffer.bike}
              showroom={selectedOffer.showroom}
              variant={selectedOffer.variant}
              source="offer"
              onSuccess={() => {}}
              onCancel={() => setIsModalOpen(false)}
            />
          )}
        </Modal>
      </Container>
    </motion.div>
  );
};

export default OffersPage;
