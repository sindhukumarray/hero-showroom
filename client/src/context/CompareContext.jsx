import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import * as bikeService from '../services/bikeService';

const CompareContext = createContext(null);

export const MAX_COMPARE_BIKES = 3;
export const MIN_COMPARE_BIKES = 2;
export const COMPARE_STORAGE_KEY = 'hero_compare_bike_ids';

/**
 * Safely read initial bike IDs from localStorage
 * @returns {Array<string>}
 */
const getInitialBikeIds = () => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(COMPARE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Validate that each item is a non-empty string, remove duplicates, cap at MAX_COMPARE_BIKES
      const valid = [...new Set(parsed.filter((id) => typeof id === 'string' && id.trim().length > 0))];
      return valid.slice(0, MAX_COMPARE_BIKES);
    }
    return [];
  } catch {
    return [];
  }
};

/**
 * Persist bike IDs to localStorage safely
 * @param {Array<string>} ids
 */
const saveBikeIds = (ids) => {
  if (typeof window === 'undefined') return;
  try {
    if (!ids || ids.length === 0) {
      localStorage.removeItem(COMPARE_STORAGE_KEY);
    } else {
      localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(ids));
    }
  } catch {
    // Graceful fallback for private/restricted storage modes
  }
};

/**
 * Compare Context Provider
 * Manages client-side motorcycle comparison list with localStorage persistence,
 * max-3 limit enforcement, duplicate prevention, and automatic stale ID pruning.
 */
export const CompareProvider = ({ children }) => {
  const [selectedBikeIds, setSelectedBikeIds] = useState(getInitialBikeIds);
  const [compareBikes, setCompareBikes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch and resolve full bike details for the selected bike IDs.
   * Handles partial data, stale IDs, and API errors gracefully.
   */
  const loadCompareBikes = useCallback(async (idsToLoad = selectedBikeIds) => {
    if (!idsToLoad || idsToLoad.length === 0) {
      setCompareBikes([]);
      setIsLoading(false);
      setError(null);
      return [];
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch all active catalogue bikes in a single efficient request
      const res = await bikeService.getBikes({ limit: 100, isActive: 'true' });
      const catalogue = (res?.data || []).filter((b) => {
        if (!b || b.isActive === false) return false;
        const slug = (b.slug || '').toLowerCase();
        const name = (b.name || '').toLowerCase();
        return !slug.startsWith('fav-test-bike') && !slug.startsWith('inactive-fav-bike') && !name.includes('test bike');
      });

      // Find matching bikes preserving the order of idsToLoad
      const matchedBikes = [];
      const validIds = [];

      for (const id of idsToLoad) {
        const found = catalogue.find((b) => b._id === id);
        if (found) {
          matchedBikes.push(found);
          validIds.push(id);
        }
      }

      // If any ID was stale or missing from the database, prune it
      if (validIds.length !== idsToLoad.length) {
        setSelectedBikeIds(validIds);
        saveBikeIds(validIds);
      }

      setCompareBikes(matchedBikes);
      return matchedBikes;
    } catch (err) {
      setError(err?.message || 'Failed to load comparison vehicle details.');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [selectedBikeIds]);

  // Load bike objects on initial mount if IDs exist in localStorage
  useEffect(() => {
    if (selectedBikeIds.length > 0 && compareBikes.length === 0) {
      loadCompareBikes(selectedBikeIds);
    }
  }, []);

  /**
   * Checks whether a bike is currently selected for comparison
   * @param {string} bikeId
   * @returns {boolean}
   */
  const isInCompare = useCallback(
    (bikeId) => {
      if (!bikeId) return false;
      return selectedBikeIds.includes(bikeId);
    },
    [selectedBikeIds]
  );

  /**
   * Adds a bike to the comparison list.
   * Enforces max-3 limit and prevents duplicates.
   * @param {object} bike
   * @returns {{ success: boolean, reason?: string, message?: string }}
   */
  const addBike = useCallback(
    (bike) => {
      if (!bike || !bike._id) {
        return { success: false, reason: 'invalid_bike', message: 'Invalid motorcycle data.' };
      }

      const id = String(bike._id);

      // Duplicate prevention
      if (selectedBikeIds.includes(id)) {
        return {
          success: false,
          reason: 'already_added',
          message: `${bike.name || 'Motorcycle'} is already in your comparison list.`
        };
      }

      // Max 3 limit enforcement
      if (selectedBikeIds.length >= MAX_COMPARE_BIKES) {
        return {
          success: false,
          reason: 'limit_reached',
          message: `You can compare a maximum of ${MAX_COMPARE_BIKES} motorcycles at a time. Remove one to add another.`
        };
      }

      const nextIds = [...selectedBikeIds, id];
      setSelectedBikeIds(nextIds);
      saveBikeIds(nextIds);

      // Update in-memory bike objects list
      setCompareBikes((prev) => {
        if (prev.some((b) => b._id === id)) return prev;
        return [...prev, bike];
      });

      return { success: true };
    },
    [selectedBikeIds]
  );

  /**
   * Removes a bike from the comparison list by ID.
   * @param {string} bikeId
   */
  const removeBike = useCallback((bikeId) => {
    if (!bikeId) return;
    const id = String(bikeId);

    setSelectedBikeIds((prev) => {
      const nextIds = prev.filter((item) => item !== id);
      saveBikeIds(nextIds);
      return nextIds;
    });

    setCompareBikes((prev) => prev.filter((b) => b._id !== id));
  }, []);

  /**
   * Toggles a bike in or out of the comparison list.
   * @param {object} bike
   * @returns {{ success: boolean, action: 'added' | 'removed', reason?: string, message?: string }}
   */
  const toggleBike = useCallback(
    (bike) => {
      if (!bike || !bike._id) {
        return { success: false, action: 'error', reason: 'invalid_bike', message: 'Invalid motorcycle data.' };
      }

      const id = String(bike._id);
      if (selectedBikeIds.includes(id)) {
        removeBike(id);
        return { success: true, action: 'removed' };
      } else {
        const res = addBike(bike);
        return { ...res, action: 'added' };
      }
    },
    [selectedBikeIds, addBike, removeBike]
  );

  /**
   * Clears all selected bikes from comparison.
   */
  const clearCompare = useCallback(() => {
    setSelectedBikeIds([]);
    setCompareBikes([]);
    saveBikeIds([]);
    setError(null);
  }, []);

  const value = useMemo(
    () => ({
      compareBikeIds: selectedBikeIds,
      compareBikes,
      compareCount: selectedBikeIds.length,
      isFull: selectedBikeIds.length >= MAX_COMPARE_BIKES,
      canCompare: selectedBikeIds.length >= MIN_COMPARE_BIKES,
      maxAllowed: MAX_COMPARE_BIKES,
      minRequired: MIN_COMPARE_BIKES,
      isLoading,
      error,
      isInCompare,
      addBike,
      removeBike,
      toggleBike,
      clearCompare,
      reloadCompareBikes: loadCompareBikes
    }),
    [
      selectedBikeIds,
      compareBikes,
      isLoading,
      error,
      isInCompare,
      addBike,
      removeBike,
      toggleBike,
      clearCompare,
      loadCompareBikes
    ]
  );

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
};

/**
 * Custom hook to consume the Compare context.
 * @returns {object}
 */
export const useCompare = () => {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error('useCompare must be used within a CompareProvider');
  }
  return context;
};

export default CompareContext;
