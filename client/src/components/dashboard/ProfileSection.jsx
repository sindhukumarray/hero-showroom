import React from 'react';
import { User, Mail, Phone, Calendar, ShieldCheck, LogOut, Bike, CheckCircle } from 'lucide-react';
import Card from '../Card';
import Badge from '../Badge';
import Button from '../Button';

/**
 * Customer Profile / Account Section
 * Clean read-only view displaying non-sensitive customer account details.
 * User-safe presentation of profile metadata.
 *
 * @param {object} props
 * @param {object} props.user - Authenticated user entity from AuthContext
 * @param {function} props.onLogout - Logout callback
 * @param {function} props.onExplore - Navigation callback to motorcycle catalogue
 */
const ProfileSection = ({ user, onLogout, onExplore }) => {
  const displayName = user?.name || 'Rider';
  const userEmail = user?.email || 'Not provided';
  const userPhone = user?.phone && user.phone.trim() ? user.phone.trim() : 'Not provided';
  const userRole = user?.role ? user.role.toUpperCase() : 'CUSTOMER';
  const accountStatus = user?.isActive !== false ? 'Active' : 'Inactive';
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    : 'Recent Member';
  const accountRefId = user?._id ? user._id.slice(-8).toUpperCase() : 'N/A';

  return (
    <div className="space-y-6">
      {/* Account Info Card */}
      <Card variant="elevated" className="p-6 md:p-8 border-border/80 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-surface-800 border-2 border-brand-red flex items-center justify-center text-brand-red text-xl font-bold font-display">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="typography-h3 text-surface-50 font-bold">{displayName}</h3>
                <Badge variant="brand" size="sm" className="font-mono text-[10px]">
                  {userRole}
                </Badge>
              </div>
              <p className="typography-small text-muted-foreground text-xs">
                Customer Reference ID: <span className="font-mono font-medium text-surface-200">#{accountRefId}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium bg-emerald-950/40 border border-emerald-800/60 px-3 py-1.5 rounded-full">
              <CheckCircle className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{accountStatus} Account</span>
            </div>
          </div>
        </div>

        {/* Account Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Full Name */}
          <div className="space-y-1.5">
            <span className="text-xs uppercase font-medium tracking-wider text-muted-foreground flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-brand-red" aria-hidden="true" />
              Full Name
            </span>
            <p className="font-sans font-semibold text-surface-100 text-sm md:text-base">
              {displayName}
            </p>
          </div>

          {/* Email Address */}
          <div className="space-y-1.5">
            <span className="text-xs uppercase font-medium tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-brand-red" aria-hidden="true" />
              Email Address
            </span>
            <p className="font-sans font-semibold text-surface-100 text-sm md:text-base truncate">
              {userEmail}
            </p>
          </div>

          {/* Phone Number */}
          <div className="space-y-1.5">
            <span className="text-xs uppercase font-medium tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-brand-red" aria-hidden="true" />
              Phone Number
            </span>
            <p className="font-sans font-semibold text-surface-100 text-sm md:text-base">
              {userPhone}
            </p>
          </div>

          {/* Member Since */}
          <div className="space-y-1.5">
            <span className="text-xs uppercase font-medium tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-brand-red" aria-hidden="true" />
              Member Since
            </span>
            <p className="font-sans font-semibold text-surface-100 text-sm md:text-base">
              {memberSince}
            </p>
          </div>
        </div>

        {/* Security & Verification Banner */}
        <div className="pt-4 border-t border-border/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-muted-foreground bg-surface-900/40 p-4 rounded-xl">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" aria-hidden="true" />
            <div>
              <p className="text-surface-100 font-medium">Session & Identity Protected</p>
              <p className="text-surface-200">Your profile is authenticated through secure encrypted sessions.</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            {onLogout && (
              <Button
                variant="outline"
                size="sm"
                icon={LogOut}
                onClick={onLogout}
                className="text-xs border-border/80 hover:border-brand-red hover:text-brand-red"
              >
                Sign Out
              </Button>
            )}
            {onExplore && (
              <Button
                variant="primary"
                size="sm"
                icon={Bike}
                onClick={onExplore}
                className="text-xs"
              >
                Browse Catalogue
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ProfileSection;
