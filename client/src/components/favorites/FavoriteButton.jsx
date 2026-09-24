import React, { useState, useEffect, useCallback } from 'react';
import { Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { favoriteService } from '../../services';

/**
 * FavoriteButton Component
 * A toggle button to add/remove a bike or showroom from the customer's favorites.
 *
 * - Unauthenticated users are redirected to /login on click.
 * - Authenticated users get an optimistic toggle with error rollback.
 * - Supports size variants: 'sm', 'md', 'lg'.
 * - Supports showLabel prop to render text alongside the icon.
 *
 * @param {object} props
 * @param {'bike'|'showroom'} props.entityType - The type of entity being favorited
 * @param {string}            props.entityId   - MongoDB ObjectId of the entity
 * @param {'sm'|'md'|'lg'}   [props.size='md'] - Button size
 * @param {boolean}           [props.showLabel=false] - Show "Save" / "Saved" label
 * @param {string}            [props.className='']    - Additional CSS classes
 */
const FavoriteButton = ({
  entityType,
  entityId,
  size = 'md',
  showLabel = false,
  className = ''
}) => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [isFavorited, setIsFavorited] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  // Fetch initial favorite status for authenticated users
  const fetchStatus = useCallback(async () => {
    if (!user || !entityId || !entityType) return;
    setIsChecking(true);
    try {
      const res = await favoriteService.checkFavorite({ entityType, entityId });
      setIsFavorited(Boolean(res?.data?.favorited));
    } catch {
      // Graceful silent failure — default to unfavorited
      setIsFavorited(false);
    } finally {
      setIsChecking(false);
    }
  }, [user, entityType, entityId]);

  useEffect(() => {
    if (!authLoading) {
      fetchStatus();
    }
  }, [authLoading, fetchStatus]);

  const handleToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Redirect unauthenticated users to login
    if (!user) {
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }

    if (isToggling || !entityId || !entityType) return;

    // Optimistic UI update
    const previousState = isFavorited;
    setIsFavorited((prev) => !prev);
    setIsToggling(true);

    try {
      const res = await favoriteService.toggleFavorite({ entityType, entityId });
      // Sync with server truth
      setIsFavorited(Boolean(res?.data?.favorited));
    } catch {
      // Rollback on error
      setIsFavorited(previousState);
    } finally {
      setIsToggling(false);
    }
  };

  // Size-driven dimensions
  const sizeConfig = {
    sm: {
      btn: 'w-7 h-7',
      icon: 'w-3.5 h-3.5',
      text: 'text-[10px]',
      gap: 'gap-1'
    },
    md: {
      btn: 'w-9 h-9',
      icon: 'w-4 h-4',
      text: 'text-xs',
      gap: 'gap-1.5'
    },
    lg: {
      btn: 'w-10 h-10',
      icon: 'w-5 h-5',
      text: 'text-sm',
      gap: 'gap-2'
    }
  };

  const config = sizeConfig[size] || sizeConfig.md;
  const busy = isChecking || isToggling;

  return (
    <button
      type="button"
      aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
      aria-pressed={isFavorited}
      onClick={handleToggle}
      disabled={busy}
      className={[
        'group inline-flex items-center justify-center rounded-full border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-900',
        showLabel ? `px-3 py-1.5 ${config.gap}` : config.btn,
        isFavorited
          ? 'bg-rose-500/15 border-rose-500/60 text-rose-400 hover:bg-rose-500/25'
          : 'bg-surface-800/80 border-border/60 text-muted-foreground hover:text-rose-400 hover:border-rose-500/50 hover:bg-rose-500/10',
        busy ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
        className
      ].join(' ')}
    >
      <Heart
        className={[
          config.icon,
          'transition-all duration-200',
          isFavorited
            ? 'fill-rose-500 text-rose-400 scale-110'
            : 'fill-transparent group-hover:scale-110',
          busy ? 'animate-pulse' : ''
        ].join(' ')}
        aria-hidden="true"
      />
      {showLabel && (
        <span className={`font-semibold ${config.text} ${isFavorited ? 'text-rose-400' : 'text-muted-foreground group-hover:text-rose-400'}`}>
          {isFavorited ? 'Saved' : 'Save'}
        </span>
      )}
    </button>
  );
};

export default FavoriteButton;
