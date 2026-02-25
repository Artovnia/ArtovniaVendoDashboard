/**
 * Health Check Wrapper Component
 *
 * Wraps route content and monitors backend health.
 * Redirects to maintenance page when backend is unavailable.
 */

import { useEffect, type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useBackendHealth } from '../../../hooks/use-backend-health';

interface HealthCheckWrapperProps {
  children: ReactNode;
}

export function HealthCheckWrapper({ children }: HealthCheckWrapperProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isHealthy, refresh } = useBackendHealth({
    checkOnMount: true,
    autoRetry: true,
    retryInterval: 30000, // Check every 30 seconds
  });

  // Listen for network errors from API calls and trigger health check
  useEffect(() => {
    const handleNetworkError = (event: CustomEvent) => {
      console.warn('[HealthCheckWrapper] Network error detected:', event.detail);
      // Clear cache and check health immediately
      refresh();
    };

    window.addEventListener('backend:network-error', handleNetworkError as EventListener);
    
    return () => {
      window.removeEventListener('backend:network-error', handleNetworkError as EventListener);
    };
  }, [refresh]);

  // Redirect to maintenance page when backend is unhealthy
  useEffect(() => {
    const isOnMaintenancePage = location.pathname === '/maintenance';

    // Only redirect if we've confirmed the backend is down (not during initial check)
    // isHealthy === false means we got a definitive "unhealthy" response
    // isHealthy === null means we haven't checked yet
    if (isHealthy === false && !isOnMaintenancePage) {
      console.warn('[HealthCheckWrapper] Backend unavailable, redirecting to maintenance page');
      navigate('/maintenance', { replace: true });
    }
  }, [isHealthy, location.pathname, navigate]);

  return <>{children}</>;
}
