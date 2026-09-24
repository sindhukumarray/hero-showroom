import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  ShieldCheck,
  Star,
  CheckCircle,
  ArrowLeft,
  Navigation,
  Compass,
  Bike,
  Send,
  Calendar,
  Tag
} from 'lucide-react';
import { Container, Card, Badge, Button, Loading, ErrorState, Modal, LeadForm, TestRideForm } from '../components';
import { showroomService, offerService } from '../services';
import { useSEO } from '../hooks/useSEO';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { fadeIn, getAccessibleVariant } from '../animations/variants';

const ShowroomDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const shouldReduceMotion = usePrefersReducedMotion();
  const accessibleFadeIn = getAccessibleVariant(fadeIn, shouldReduceMotion);

  const [showroom, setShowroom] = useState(null);
  const [showroomOffers, setShowroomOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isTestRideModalOpen, setIsTestRideModalOpen] = useState(false);

  useSEO({
    title: showroom ? `${showroom.name} — Authorized Showroom` : 'Showroom Details',
    description: showroom
      ? `Visit ${showroom.name} in ${showroom.city?.name || 'India'}. Address, facilities, working hours, and contact details.`
      : 'Authorized showroom details and amenities.'
  });

  const fetchShowroom = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await showroomService.getShowroomBySlug(slug);
      if (res.success && res.data) {
        setShowroom(res.data);
        // Fetch active offers for this showroom
        try {
          const offersRes = await offerService.getOffers({
            showroom: res.data._id,
            active: 'true',
            limit: 3
          });
          if (offersRes?.success && Array.isArray(offersRes?.data)) {
            setShowroomOffers(offersRes.data);
          }
        } catch {
          setShowroomOffers([]);
        }
      } else {
        setError('Showroom details could not be found.');
      }
    } catch (err) {
      setError(err.message || 'Failed to load showroom details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slug) {
      fetchShowroom();
    }
  }, [slug]);

  if (loading) {
    return (
      <Container className="py-12 md:py-16">
        <Loading type="spinner" text="Loading showroom details..." size="lg" />
      </Container>
    );
  }

  if (error || !showroom) {
    return (
      <Container className="py-12 md:py-16">
        <ErrorState
          title="Showroom Not Found"
          message={error || 'The requested dealership location does not exist or has been relocated.'}
          onRetry={fetchShowroom}
          retryLabel="Try Again"
        />
        <div className="text-center mt-6">
          <Button
            variant="secondary"
            size="sm"
            icon={ArrowLeft}
            onClick={() => navigate('/showrooms')}
          >
            Back to All Showrooms
          </Button>
        </div>
      </Container>
    );
  }

  const coordinates = showroom.location?.coordinates || [0, 0];
  const [longitude, latitude] = coordinates;

  return (
    <Container className="py-8 md:py-14 space-y-8">
      {/* Navigation Breadcrumb */}
      <motion.div variants={accessibleFadeIn} initial="hidden" animate="visible">
        <Button
          variant="ghost"
          size="sm"
          icon={ArrowLeft}
          onClick={() => navigate(-1)}
          className="text-muted-foreground hover:text-white"
        >
          Back
        </Button>
      </motion.div>

      {/* Hero Showcase Card */}
      <motion.div
        variants={accessibleFadeIn}
        initial="hidden"
        animate="visible"
        className="glass-surface p-6 sm:p-8 md:p-10 rounded-card-lg border border-border/80 shadow-card-hover relative overflow-hidden"
      >
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="space-y-4 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <Badge variant="brand" size="md">
                {showroom.brand?.name || 'Authorized Dealer'}
              </Badge>
              <Badge variant="default" size="md">
                {showroom.showroomType || 'Dealership'}
              </Badge>
              {showroom.isVerified && (
                <Badge variant="success" size="md" dot>
                  Verified Dealership
                </Badge>
              )}
            </div>

            <h1 className="typography-h1 text-surface-50 font-black">{showroom.name}</h1>

            {showroom.dealerName && (
              <p className="typography-small text-muted-foreground text-sm">
                Operated by <span className="text-surface-100 font-semibold">{showroom.dealerName}</span>
              </p>
            )}

            <div className="flex items-start gap-2 text-surface-200 text-sm pt-1">
              <MapPin className="w-5 h-5 text-brand-red shrink-0 mt-0.5" />
              <span>
                {showroom.address?.fullAddress || 'Address details available upon inquiry.'}
                {showroom.address?.pincode ? ` — ${showroom.address.pincode}` : ''}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-3">
              <Button
                variant="primary"
                size="md"
                icon={Send}
                onClick={() => setIsLeadModalOpen(true)}
              >
                Contact Showroom
              </Button>
              <Button
                variant="secondary"
                size="md"
                icon={Calendar}
                onClick={() => setIsTestRideModalOpen(true)}
              >
                Book Test Ride
              </Button>
              {showroomOffers.length > 0 && (
                <Link to={`/offers?showroom=${showroom._id}`}>
                  <Button
                    variant="outline"
                    size="md"
                    icon={Tag}
                    className="text-brand-red border-brand-red/40 hover:bg-brand-red/10"
                  >
                    Special Offers ({showroomOffers.length})
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Rating Summary Box */}
          <div className="shrink-0 bg-surface-900/90 border border-border p-5 rounded-card text-center min-w-[160px] space-y-2">
            <div className="flex items-center justify-center gap-1.5 text-amber-400">
              <Star className="w-5 h-5 fill-amber-400" />
              <span className="font-display font-black text-2xl text-surface-50">
                {showroom.rating?.average ? showroom.rating.average.toFixed(1) : '4.5'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {showroom.rating?.count ? `${showroom.rating.count} Customer Reviews` : 'Verified Rating'}
            </p>
            <div className="pt-2 border-t border-border/60">
              <span className="text-[11px] text-emerald-400 font-semibold flex items-center justify-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Official Outlet
              </span>
            </div>
          </div>
        </div>

        {/* Active Promotional Offer Banner */}
        {showroomOffers.length > 0 && (
          <div className="mt-6 pt-5 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-brand-red/5 p-4 rounded-card border border-brand-red/20">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-brand-red text-white flex items-center justify-center shrink-0 shadow-glow-red">
                <Tag className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-red">Dealership Offer</span>
                  {showroomOffers[0].offerType && (
                    <Badge variant="outline" size="sm" className="text-[10px] capitalize">
                      {showroomOffers[0].offerType}
                    </Badge>
                  )}
                </div>
                <h4 className="text-surface-50 font-bold text-sm">
                  {showroomOffers[0].title}
                </h4>
                {showroomOffers[0].description && (
                  <p className="text-xs text-surface-200 line-clamp-1">
                    {showroomOffers[0].description}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link to={`/offers/${showroomOffers[0].slug || showroomOffers[0]._id}`}>
                <Button variant="primary" size="sm" className="text-xs">
                  View Offer Details →
                </Button>
              </Link>
              {showroomOffers.length > 1 && (
                <Link to={`/offers?showroom=${showroom._id}`}>
                  <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-white">
                    All Offers ({showroomOffers.length})
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </motion.div>

      {/* Grid of Key Info Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Contact & Inquiries */}
        <Card variant="elevated" className="space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-border/60">
            <div className="w-8 h-8 rounded-lg bg-brand-red/10 border border-brand-red/30 flex items-center justify-center text-brand-red">
              <Phone className="w-4 h-4" />
            </div>
            <h3 className="typography-h3 text-surface-50 text-base">Contact & Desk</h3>
          </div>

          <div className="space-y-3 text-sm">
            {showroom.contact?.phone && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Phone className="w-4 h-4 text-brand-red" /> Phone
                </span>
                <a
                  href={`tel:${showroom.contact.phone}`}
                  className="font-medium text-surface-100 hover:text-brand-red transition-colors"
                >
                  {showroom.contact.phone}
                </a>
              </div>
            )}

            {showroom.contact?.alternatePhone && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Alternate</span>
                <a
                  href={`tel:${showroom.contact.alternatePhone}`}
                  className="font-medium text-surface-100 hover:text-brand-red transition-colors"
                >
                  {showroom.contact.alternatePhone}
                </a>
              </div>
            )}

            {showroom.contact?.email && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Mail className="w-4 h-4 text-brand-red" /> Email
                </span>
                <a
                  href={`mailto:${showroom.contact.email}`}
                  className="font-medium text-surface-100 hover:text-brand-red transition-colors text-xs truncate max-w-[180px]"
                >
                  {showroom.contact.email}
                </a>
              </div>
            )}

            {showroom.contact?.website && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Globe className="w-4 h-4 text-brand-red" /> Portal
                </span>
                <a
                  href={showroom.contact.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-brand-red hover:underline text-xs"
                >
                  Visit Website
                </a>
              </div>
            )}
          </div>
        </Card>

        {/* Operating Hours */}
        <Card variant="elevated" className="space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-border/60">
            <div className="w-8 h-8 rounded-lg bg-brand-red/10 border border-brand-red/30 flex items-center justify-center text-brand-red">
              <Clock className="w-4 h-4" />
            </div>
            <h3 className="typography-h3 text-surface-50 text-base">Operating Schedule</h3>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Working Hours</span>
              <span className="font-medium text-surface-100">
                {showroom.openingHours?.displayText || '9:00 AM - 8:00 PM'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Days Open</span>
              <span className="font-medium text-surface-100">
                {showroom.openingHours?.daysOpen || 'Monday to Sunday'}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-border/40">
              <span className="text-muted-foreground">City Hub</span>
              <span className="font-semibold text-brand-red">
                {showroom.city?.name || 'Regional Hub'}, {showroom.city?.state || 'India'}
              </span>
            </div>
          </div>
        </Card>

        {/* Geo Location Coordinates */}
        <Card variant="elevated" className="space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-border/60">
            <div className="w-8 h-8 rounded-lg bg-brand-red/10 border border-brand-red/30 flex items-center justify-center text-brand-red">
              <Navigation className="w-4 h-4" />
            </div>
            <h3 className="typography-h3 text-surface-50 text-base">Geographic Coordinates</h3>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Latitude</span>
              <span className="font-mono text-surface-100 font-medium">
                {latitude ? latitude.toFixed(4) : 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Longitude</span>
              <span className="font-mono text-surface-100 font-medium">
                {longitude ? longitude.toFixed(4) : 'N/A'}
              </span>
            </div>
            {latitude && longitude ? (
              <a
                href={`https://www.google.com/maps?q=${latitude},${longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block w-full pt-1"
              >
                <Button variant="outline" size="sm" fullWidth icon={Compass}>
                  Open in Maps
                </Button>
              </a>
            ) : null}
          </div>
        </Card>
      </div>

      {/* Facilities & Amenities */}
      {Array.isArray(showroom.facilities) && showroom.facilities.length > 0 && (
        <Card variant="default" className="space-y-4">
          <h3 className="typography-h3 text-surface-50">Dealership Amenities & Services</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {showroom.facilities.map((facility, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2.5 p-3 rounded-lg bg-surface-900 border border-border/60 text-sm text-surface-100"
              >
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{facility}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Action Strip */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-card glass-surface border border-border">
        <div>
          <h4 className="font-display font-bold text-surface-50 text-base">Get in Touch with this Dealership</h4>
          <p className="typography-small text-xs text-muted-foreground">
            Connect directly with {showroom.name} to enquire about models, pricing, or book a test ride.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <Button
            variant="primary"
            size="md"
            icon={Send}
            onClick={() => setIsLeadModalOpen(true)}
            className="w-full sm:w-auto"
          >
            Contact Showroom
          </Button>
          <Button
            variant="secondary"
            size="md"
            icon={Calendar}
            onClick={() => setIsTestRideModalOpen(true)}
            className="w-full sm:w-auto"
          >
            Book Test Ride
          </Button>
          {showroom.brand?._id && (
            <Link to={`/bikes?brand=${showroom.brand._id}`} className="w-full sm:w-auto">
              <Button variant="ghost" size="md" icon={Bike} fullWidth className="sm:w-auto">
                View Brand Bikes
              </Button>
            </Link>
          )}
          <Link to="/showrooms" className="w-full sm:w-auto">
            <Button variant="ghost" size="md" fullWidth className="sm:w-auto">
              All Showrooms
            </Button>
          </Link>
        </div>
      </div>

      {/* Lead / Enquiry Modal */}
      <Modal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        title={`Contact ${showroom.name}`}
      >
        <LeadForm
          showroom={showroom}
          source="showroom"
          onSuccess={() => {}}
          onCancel={() => setIsLeadModalOpen(false)}
        />
      </Modal>

      {/* Test Ride Modal */}
      <Modal
        isOpen={isTestRideModalOpen}
        onClose={() => setIsTestRideModalOpen(false)}
        title={`Schedule Test Ride at ${showroom.name}`}
      >
        <TestRideForm
          showroom={showroom}
          onSuccess={() => {}}
          onCancel={() => setIsTestRideModalOpen(false)}
        />
      </Modal>
    </Container>
  );
};

export default ShowroomDetailPage;
