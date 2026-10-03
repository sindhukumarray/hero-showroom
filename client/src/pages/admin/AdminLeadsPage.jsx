import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Mail,
  Phone,
  User,
  Bike as BikeIcon,
  Building2,
  Tag,
  Calendar,
  Clock,
  Search,
  RefreshCw,
  Eye,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Sparkles,
  MessageSquare,
  ArrowRight,
  ShieldAlert,
  SlidersHorizontal,
  Compass
} from 'lucide-react';
import { pageTransition, getAccessibleVariant } from '../../animations/variants';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { useSEO } from '../../hooks/useSEO';
import { adminService } from '../../services';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';

const LEAD_STATUS_CONFIG = {
  new: {
    label: 'New',
    badgeVariant: 'info',
    bgClass: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    description: 'Fresh enquiry awaiting initial dealership response'
  },
  contacted: {
    label: 'Contacted',
    badgeVariant: 'warning',
    bgClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    description: 'Customer contacted via phone/email by sales executive'
  },
  qualified: {
    label: 'Qualified',
    badgeVariant: 'brand',
    bgClass: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    description: 'High purchase intent verified; quotation or test ride discussed'
  },
  converted: {
    label: 'Converted',
    badgeVariant: 'success',
    bgClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    description: 'Booking or retail delivery successfully finalized'
  },
  closed: {
    label: 'Closed',
    badgeVariant: 'default',
    bgClass: 'bg-neutral-800 text-neutral-400 border-neutral-700',
    description: 'Enquiry dropped, postponed, or archived'
  }
};

const STATUS_KEYS = ['new', 'contacted', 'qualified', 'converted', 'closed'];

const SOURCE_OPTIONS = [
  { value: 'all', label: 'All Sources' },
  { value: 'bike', label: 'Bike Catalogue' },
  { value: 'showroom', label: 'Dealership Page' },
  { value: 'offer', label: 'Special Promotion' },
  { value: 'test_ride', label: 'Test Ride Flow' }
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'status', label: 'By Status' },
  { value: 'name', label: 'Customer Name (A-Z)' }
];

const AdminLeadsPage = () => {
  const shouldReduceMotion = usePrefersReducedMotion();
  const accessiblePageTransition = getAccessibleVariant(pageTransition, shouldReduceMotion);

  useSEO({
    title: 'Lead Management & Enquiries | Admin Console',
    description: 'Review customer dealership enquiries, vehicle interests, and manage lead lifecycle workflow.'
  });

  // Data states
  const [leads, setLeads] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Filter & Search states
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [showroomFilter, setShowroomFilter] = useState('all');
  const [bikeFilter, setBikeFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);

  // Aux state for dropdowns
  const [showroomsList, setShowroomsList] = useState([]);
  const [bikesList, setBikesList] = useState([]);

  // Detail Modal & Status Updating
  const [selectedLead, setSelectedLead] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [statusDraft, setStatusDraft] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Auto-dismiss feedback message after 4s
  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(timer);
  }, [feedback]);

  // Load auxiliary data for filters
  useEffect(() => {
    const fetchAuxiliary = async () => {
      try {
        const [showroomsRes, bikesRes] = await Promise.allSettled([
          adminService.getShowrooms({ limit: 100 }),
          adminService.getBikes({ limit: 100 })
        ]);

        if (showroomsRes.status === 'fulfilled' && showroomsRes.value?.data?.data) {
          setShowroomsList(showroomsRes.value.data.data);
        }
        if (bikesRes.status === 'fulfilled' && bikesRes.value?.data?.data) {
          setBikesList(bikesRes.value.data.data);
        }
      } catch (e) {
        // Aux load failure non-blocking
      }
    };
    fetchAuxiliary();
  }, []);

  // Fetch leads with server-side filtering and pagination
  const fetchLeads = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
        limit: 20,
        sort: sortOrder
      };

      if (search.trim()) params.search = search.trim();
      if (statusFilter !== 'all') params.status = statusFilter;
      if (sourceFilter !== 'all') params.source = sourceFilter;
      if (showroomFilter !== 'all') params.showroom = showroomFilter;
      if (bikeFilter !== 'all') params.bike = bikeFilter;

      const res = await adminService.getLeads(params);
      const dataPayload = res.data?.data || res.data || [];
      const metaPayload = res.data?.meta || {
        page: currentPage,
        limit: 20,
        total: dataPayload.length,
        pages: 1
      };

      setLeads(dataPayload);
      setMeta(metaPayload);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load lead enquiries.');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, search, statusFilter, sourceFilter, showroomFilter, bikeFilter, sortOrder]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Reset page to 1 when filters change
  const handleFilterChange = (setter, value) => {
    setter(value);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setSourceFilter('all');
    setShowroomFilter('all');
    setBikeFilter('all');
    setSortOrder('newest');
    setCurrentPage(1);
  };

  // Open detail modal and pre-fill status draft
  const handleOpenDetail = (lead) => {
    setSelectedLead(lead);
    setStatusDraft(lead.status);
    setIsDetailModalOpen(true);
  };

  // Update lead status handler
  const handleUpdateStatus = async (leadId, newStatus) => {
    if (!newStatus || !STATUS_KEYS.includes(newStatus)) return;
    setIsUpdatingStatus(true);
    try {
      const res = await adminService.updateLeadStatus(leadId, newStatus);
      const updated = res.data?.data || res.data;

      // Update state in local list
      setLeads((prev) =>
        prev.map((item) => (item._id === leadId ? { ...item, status: newStatus } : item))
      );

      // Update detail modal state if open
      if (selectedLead && selectedLead._id === leadId) {
        setSelectedLead((prev) => ({ ...prev, status: newStatus }));
        setStatusDraft(newStatus);
      }

      setFeedback({
        type: 'success',
        message: `Lead status updated to '${LEAD_STATUS_CONFIG[newStatus]?.label || newStatus}' successfully.`
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err?.response?.data?.message || 'Failed to update lead status.'
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Compute status summary metrics from current fetched data
  const totalLeads = meta?.total || leads.length;
  const newCount = leads.filter((l) => l.status === 'new').length;
  const inProgressCount = leads.filter((l) => ['contacted', 'qualified'].includes(l.status)).length;
  const convertedCount = leads.filter((l) => l.status === 'converted').length;

  return (
    <motion.div
      initial={accessiblePageTransition.initial}
      animate={accessiblePageTransition.animate}
      exit={accessiblePageTransition.exit}
      transition={accessiblePageTransition.transition}
      className="space-y-8"
    >
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-surface-800 text-brand-red">
              <Mail className="w-5 h-5" aria-hidden="true" />
            </span>
            <h1 className="font-display font-extrabold text-2xl md:text-3xl text-surface-50">
              Customer Leads & Enquiries
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Track customer enquiries, coordinate showroom sales follow-ups, and manage status transitions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={fetchLeads}
            disabled={isLoading}
            className="text-xs border-border/80"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className={`p-4 rounded-xl flex items-center justify-between text-sm ${
            feedback.type === 'success'
              ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
              : 'bg-rose-950/60 text-rose-300 border border-rose-800/40'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" aria-hidden="true" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="p-1 hover:opacity-80 rounded"
            aria-label="Dismiss feedback"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-surface-900/40 border-border/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Inquiries
            </span>
            <Mail className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
          </div>
          <p className="text-2xl font-bold text-surface-50 mt-2">{totalLeads}</p>
          <span className="text-[11px] text-muted-foreground mt-0.5 block">Lifetime customer enquiries</span>
        </Card>

        <Card className="p-4 bg-sky-950/20 border-sky-800/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">
              New Enquiries
            </span>
            <Sparkles className="w-4 h-4 text-sky-400" aria-hidden="true" />
          </div>
          <p className="text-2xl font-bold text-sky-400 mt-2">{newCount}</p>
          <span className="text-[11px] text-sky-300/80 mt-0.5 block">Awaiting sales outreach</span>
        </Card>

        <Card className="p-4 bg-amber-950/20 border-amber-800/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
              In Discussion
            </span>
            <Clock className="w-4 h-4 text-amber-400" aria-hidden="true" />
          </div>
          <p className="text-2xl font-bold text-amber-400 mt-2">{inProgressCount}</p>
          <span className="text-[11px] text-amber-300/80 mt-0.5 block">Contacted & qualified</span>
        </Card>

        <Card className="p-4 bg-emerald-950/20 border-emerald-800/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Converted Sales
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" aria-hidden="true" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 mt-2">{convertedCount}</p>
          <span className="text-[11px] text-emerald-300/80 mt-0.5 block">Successful bookings</span>
        </Card>
      </div>

      {/* Filter and Search Panel */}
      <Card className="p-4 bg-surface-900/30 border-border/80">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Search Input */}
            <div className="md:col-span-4 relative">
              <Search
                className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2"
                aria-hidden="true"
              />
              <input
                type="text"
                placeholder="Search customer name, email, phone..."
                value={search}
                onChange={(e) => handleFilterChange(setSearch, e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-surface-950 border border-border/80 rounded-lg text-sm text-surface-200 placeholder-muted-foreground focus:outline-none focus:border-brand-red/50"
              />
            </div>

            {/* Status Filter */}
            <div className="md:col-span-2">
              <select
                aria-label="Filter by Status"
                value={statusFilter}
                onChange={(e) => handleFilterChange(setStatusFilter, e.target.value)}
                className="w-full px-3 py-2 bg-surface-950 border border-border/80 rounded-lg text-sm text-surface-300 focus:outline-none focus:border-brand-red/50"
              >
                <option value="all">All Statuses</option>
                {STATUS_KEYS.map((k) => (
                  <option key={k} value={k}>
                    {LEAD_STATUS_CONFIG[k].label}
                  </option>
                ))}
              </select>
            </div>

            {/* Source Filter */}
            <div className="md:col-span-2">
              <select
                aria-label="Filter by Source"
                value={sourceFilter}
                onChange={(e) => handleFilterChange(setSourceFilter, e.target.value)}
                className="w-full px-3 py-2 bg-surface-950 border border-border/80 rounded-lg text-sm text-surface-300 focus:outline-none focus:border-brand-red/50"
              >
                {SOURCE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Selector */}
            <div className="md:col-span-2">
              <select
                aria-label="Sort Enquiries"
                value={sortOrder}
                onChange={(e) => handleFilterChange(setSortOrder, e.target.value)}
                className="w-full px-3 py-2 bg-surface-950 border border-border/80 rounded-lg text-sm text-surface-300 focus:outline-none focus:border-brand-red/50"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset Action */}
            <div className="md:col-span-2 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="text-xs text-muted-foreground hover:text-surface-100"
              >
                Clear Filters
              </Button>
            </div>
          </div>

          {/* Secondary Filter Row: Showroom & Bike */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2 border-t border-border/40 text-xs">
            <div className="md:col-span-6 flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
              <select
                aria-label="Filter by Showroom"
                value={showroomFilter}
                onChange={(e) => handleFilterChange(setShowroomFilter, e.target.value)}
                className="w-full px-2.5 py-1.5 bg-surface-950 border border-border/60 rounded-md text-xs text-surface-300 focus:outline-none focus:border-brand-red/50"
              >
                <option value="all">All Showrooms</option>
                {showroomsList.map((sr) => (
                  <option key={sr._id} value={sr._id}>
                    {sr.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-6 flex items-center gap-2">
              <BikeIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
              <select
                aria-label="Filter by Bike Model"
                value={bikeFilter}
                onChange={(e) => handleFilterChange(setBikeFilter, e.target.value)}
                className="w-full px-2.5 py-1.5 bg-surface-950 border border-border/60 rounded-md text-xs text-surface-300 focus:outline-none focus:border-brand-red/50"
              >
                <option value="all">All Bike Models</option>
                {bikesList.map((bk) => (
                  <option key={bk._id} value={bk._id}>
                    {bk.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Table / Content Section */}
      <Card className="overflow-hidden border-border/80 bg-surface-900/20">
        {isLoading ? (
          <div className="py-20 flex justify-center">
            <Loading message="Loading lead enquiries..." />
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-4">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" aria-hidden="true" />
            <h2 className="text-base font-bold text-surface-100">Unable to load leads</h2>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchLeads}>
              Try Again
            </Button>
          </div>
        ) : leads.length === 0 ? (
          <div className="py-16">
            <EmptyState
              icon={Mail}
              title="No lead enquiries found"
              description="No customer enquiries match your current search terms and filter criteria."
              actionLabel="Reset Filters"
              onAction={handleClearFilters}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/60 bg-surface-950/60 text-muted-foreground font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Vehicle Enquiry</th>
                  <th className="py-3 px-4">Dealership</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4">Status & Progression</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-surface-200">
                {leads.map((lead) => {
                  const statusInfo = LEAD_STATUS_CONFIG[lead.status] || LEAD_STATUS_CONFIG.new;

                  return (
                    <tr
                      key={lead._id}
                      className="hover:bg-surface-800/40 transition-colors group"
                    >
                      {/* Customer Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-surface-100 text-sm">{lead.name}</span>
                          <span className="text-muted-foreground text-[11px]">{lead.email}</span>
                          {lead.phone && (
                            <span className="text-muted-foreground text-[11px]">{lead.phone}</span>
                          )}
                        </div>
                      </td>

                      {/* Vehicle Enquiry */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-surface-100">
                            {lead.bike?.name || 'Unspecified Model'}
                          </span>
                          {lead.variant ? (
                            <span className="text-[11px] text-brand-red font-medium">
                              Variant: {lead.variant?.name}
                            </span>
                          ) : (
                            <span className="text-[11px] text-muted-foreground">
                              {lead.bike?.category || 'Standard Motorcycle'}
                            </span>
                          )}
                          {lead.offer && (
                            <span className="inline-block mt-0.5 text-[10px] text-amber-400 font-medium">
                              Offer: {lead.offer?.title}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Showroom / Dealership */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-surface-100">
                            {lead.showroom?.name || 'Any Authorized Showroom'}
                          </span>
                          <span className="text-muted-foreground text-[11px]">
                            {lead.showroom?.city?.name || lead.showroom?.address?.city || ''}
                          </span>
                        </div>
                      </td>

                      {/* Source */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-surface-800 text-surface-300 border border-border/40">
                          {lead.source?.replace('_', ' ') || 'direct'}
                        </span>
                      </td>

                      {/* Status & Quick Transition */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusInfo.bgClass}`}
                          >
                            {statusInfo.label}
                          </span>
                          <select
                            aria-label={`Change status for lead ${lead._id}`}
                            value={lead.status}
                            disabled={isUpdatingStatus}
                            onChange={(e) => handleUpdateStatus(lead._id, e.target.value)}
                            className="text-[11px] py-0.5 px-1.5 bg-surface-950 border border-border/60 rounded text-surface-300 hover:border-brand-red/40 focus:outline-none focus:border-brand-red cursor-pointer"
                          >
                            {STATUS_KEYS.map((k) => (
                              <option key={k} value={k}>
                                {LEAD_STATUS_CONFIG[k].label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>

                      {/* Created Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-muted-foreground text-[11px]">
                        <div>{new Date(lead.createdAt).toLocaleDateString()}</div>
                        <div className="text-[10px] opacity-75">
                          {new Date(lead.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Eye}
                          onClick={() => handleOpenDetail(lead)}
                          className="text-xs hover:text-surface-100"
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {meta && meta.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/40 bg-surface-950/40 text-xs text-muted-foreground">
            <div>
              Showing page <span className="font-bold text-surface-200">{meta.page}</span> of{' '}
              <span className="font-bold text-surface-200">{meta.pages}</span> ({meta.total} enquiries)
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                icon={ChevronLeft}
                disabled={meta.page <= 1 || isLoading}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="text-xs border-border/60"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={ChevronRight}
                disabled={meta.page >= meta.pages || isLoading}
                onClick={() => setCurrentPage((p) => Math.min(meta.pages, p + 1))}
                className="text-xs border-border/60"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Lead Detail & Workflow Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Lead Enquiry Details"
        subtitle={`Enquiry reference ID: ${selectedLead?._id || ''}`}
        maxWidth="max-w-2xl"
      >
        {selectedLead && (
          <div className="space-y-6 text-sm text-surface-200">
            {/* Status Workflow Ribbon */}
            <div className="p-4 rounded-xl bg-surface-950 border border-border/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Status Progression Workflow
                </span>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                    (LEAD_STATUS_CONFIG[selectedLead.status] || LEAD_STATUS_CONFIG.new).bgClass
                  }`}
                >
                  Current: {LEAD_STATUS_CONFIG[selectedLead.status]?.label || selectedLead.status}
                </span>
              </div>

              {/* Workflow Stepper Visualizer */}
              <div className="grid grid-cols-5 gap-1 pt-2">
                {STATUS_KEYS.map((stepKey, idx) => {
                  const isCurrent = selectedLead.status === stepKey;
                  const stepIndex = STATUS_KEYS.indexOf(selectedLead.status);
                  const isPassed = stepIndex >= idx && selectedLead.status !== 'closed';

                  return (
                    <div
                      key={stepKey}
                      className={`p-2 rounded-lg text-center border transition-all ${
                        isCurrent
                          ? 'border-brand-red bg-brand-red/10 text-white font-bold shadow-xs'
                          : isPassed
                          ? 'border-emerald-800/40 bg-emerald-950/20 text-emerald-400'
                          : 'border-border/40 bg-surface-900/40 text-muted-foreground'
                      }`}
                    >
                      <div className="text-[10px] font-mono uppercase tracking-wider">
                        Step {idx + 1}
                      </div>
                      <div className="text-xs truncate font-medium">
                        {LEAD_STATUS_CONFIG[stepKey].label}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Status Change Selector & Trigger */}
              <div className="flex items-center gap-3 pt-2">
                <select
                  aria-label="Update Lead Status"
                  value={statusDraft}
                  onChange={(e) => setStatusDraft(e.target.value)}
                  className="flex-1 px-3 py-2 bg-surface-900 border border-border/80 rounded-lg text-sm text-surface-200 focus:outline-none focus:border-brand-red"
                >
                  {STATUS_KEYS.map((k) => (
                    <option key={k} value={k}>
                      {LEAD_STATUS_CONFIG[k].label} — {LEAD_STATUS_CONFIG[k].description}
                    </option>
                  ))}
                </select>

                <Button
                  variant="brand"
                  size="sm"
                  onClick={() => handleUpdateStatus(selectedLead._id, statusDraft)}
                  disabled={isUpdatingStatus || statusDraft === selectedLead.status}
                >
                  {isUpdatingStatus ? 'Updating...' : 'Save Status'}
                </Button>
              </div>
            </div>

            {/* Customer Details Box */}
            <div className="p-4 rounded-xl bg-surface-950/60 border border-border/60 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <User className="w-3.5 h-3.5 text-brand-red" aria-hidden="true" />
                <span>Customer Contact Information</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-xs text-muted-foreground block">Customer Name</span>
                  <span className="font-semibold text-surface-100">{selectedLead.name}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Email Address</span>
                  <a
                    href={`mailto:${selectedLead.email}`}
                    className="text-brand-red hover:underline break-all"
                  >
                    {selectedLead.email}
                  </a>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Phone Number</span>
                  {selectedLead.phone ? (
                    <a
                      href={`tel:${selectedLead.phone}`}
                      className="text-surface-100 hover:text-brand-red"
                    >
                      {selectedLead.phone}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">Not provided</span>
                  )}
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Account Verification</span>
                  <span className="text-emerald-400 font-medium">
                    {selectedLead.user?.role ? `Verified (${selectedLead.user.role})` : 'Guest / Enquirer'}
                  </span>
                </div>
              </div>
            </div>

            {/* Vehicle & Dealership Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Bike Details */}
              <div className="p-4 rounded-xl bg-surface-950/60 border border-border/60 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <BikeIcon className="w-3.5 h-3.5 text-brand-red" aria-hidden="true" />
                  <span>Vehicle Interest</span>
                </div>
                <div>
                  <span className="font-bold text-surface-100 text-base">
                    {selectedLead.bike?.name || 'General Motorcycle Interest'}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    Category: {selectedLead.bike?.category || 'Standard'}
                  </span>
                  {selectedLead.variant && (
                    <div className="mt-2 p-2 rounded bg-surface-900/60 border border-border/40 text-xs">
                      <span className="text-muted-foreground block">Selected Trim / Variant:</span>
                      <span className="font-semibold text-surface-100">
                        {selectedLead.variant.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Showroom Details */}
              <div className="p-4 rounded-xl bg-surface-950/60 border border-border/60 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Building2 className="w-3.5 h-3.5 text-brand-red" aria-hidden="true" />
                  <span>Target Dealership</span>
                </div>
                <div>
                  <span className="font-bold text-surface-100 text-base">
                    {selectedLead.showroom?.name || 'Open Territory / Online'}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {selectedLead.showroom?.address?.street || selectedLead.showroom?.address?.fullAddress || ''}
                  </span>
                  {selectedLead.showroom?.contact?.phone && (
                    <span className="block text-xs text-surface-300 mt-1">
                      Outlet Contact: {selectedLead.showroom.contact.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Offer Information (if attached) */}
            {selectedLead.offer && (
              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/30 space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
                  <Tag className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Associated Special Promotion</span>
                </div>
                <div className="font-bold text-surface-100">{selectedLead.offer.title}</div>
                {selectedLead.offer.discountValue && (
                  <div className="text-xs text-amber-300">
                    Benefit Value: ₹{selectedLead.offer.discountValue.toLocaleString()}
                  </div>
                )}
              </div>
            )}

            {/* Customer Message / Notes */}
            {selectedLead.message && (
              <div className="p-4 rounded-xl bg-surface-950/60 border border-border/60 space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <MessageSquare className="w-3.5 h-3.5 text-brand-red" aria-hidden="true" />
                  <span>Customer Message</span>
                </div>
                <p className="text-xs text-surface-200 leading-relaxed whitespace-pre-wrap bg-surface-900/40 p-3 rounded-lg border border-border/30">
                  {selectedLead.message}
                </p>
              </div>
            )}

            {/* Audit & Timestamps */}
            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/40">
              <span>Submitted: {new Date(selectedLead.createdAt).toLocaleString()}</span>
              <span>Last Updated: {new Date(selectedLead.updatedAt || selectedLead.createdAt).toLocaleString()}</span>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDetailModalOpen(false)}
                className="text-xs"
              >
                Close Details
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
};

export default AdminLeadsPage;
