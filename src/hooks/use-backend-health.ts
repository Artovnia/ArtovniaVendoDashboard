/**
 * Hook for checking backend health status
 *
 * Provides reactive state for backend availability
 * with automatic retry functionality.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  checkBackendHealth,
  clearHealthCache,
  getCachedHealthStatus,
} from '../lib/backend-health';

interface UseBackendHealthOptions {
  /** Check health on mount (default: true) */
  checkOnMount?: boolean;
  /** Auto-retry interval in ms when unhealthy (default: 30000 = 30s) */
  retryInterval?: number;
  /** Enable auto-retry when unhealthy (default: true) */
  autoRetry?: boolean;
}

interface UseBackendHealthResult {
  /** Whether the backend is healthy */
  isHealthy: boolean | null;
  /** Whether a health check is in progress */
  isChecking: boolean;
  /** Error message if health check failed */
  error: string | null;
  /** Manually trigger a health check */
  checkHealth: () => Promise<boolean>;
  /** Clear the health cache and recheck */
  refresh: () => Promise<boolean>;
}

export function useBackendHealth(
  options: UseBackendHealthOptions = {}
): UseBackendHealthResult {
  const {
    checkOnMount = true,
    retryInterval = 30000,
    autoRetry = true,
  } = options;

  // Don't initialize from cache - always start fresh to detect backend recovery
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = useCallback(async (): Promise<boolean> => {
    setIsChecking(true);
    setError(null);

    try {
      const healthy = await checkBackendHealth();
      setIsHealthy(healthy);

      if (!healthy) {
        const cached = getCachedHealthStatus();
        setError(cached?.error || 'Backend is unavailable');
      }

      return healthy;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Health check failed';
      setError(errorMessage);
      setIsHealthy(false);
      return false;
    } finally {
      setIsChecking(false);
    }
  }, []);

  const refresh = useCallback(async (): Promise<boolean> => {
    clearHealthCache();
    return checkHealth();
  }, [checkHealth]);

  // Check health on mount
  useEffect(() => {
    if (checkOnMount) {
      checkHealth();
    }
  }, [checkOnMount, checkHealth]);

  // Auto-retry when unhealthy
  useEffect(() => {
    if (!autoRetry || isHealthy !== false) {
      return;
    }

    const intervalId = setInterval(() => {
      checkHealth();
    }, retryInterval);

    return () => clearInterval(intervalId);
  }, [autoRetry, isHealthy, retryInterval, checkHealth]);

  return {
    isHealthy,
    isChecking,
    error,
    checkHealth,
    refresh,
  };
}
