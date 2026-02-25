/**
 * Health Check Provider for Vendor Panel
 *
 * Monitors backend health and redirects to maintenance page when unavailable.
 * Wraps the entire application to provide global health monitoring.
 */

import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useBackendHealth } from '../../hooks/use-backend-health';

interface HealthCheckContextValue {
  isHealthy: boolean | null;
  isChecking: boolean;
  error: string | null;
  checkHealth: () => Promise<boolean>;
  refresh: () => Promise<boolean>;
}

const HealthCheckContext = createContext<HealthCheckContextValue | null>(null);

export function useHealthCheck(): HealthCheckContextValue {
  const context = useContext(HealthCheckContext);
  if (!context) {
    throw new Error('useHealthCheck must be used within HealthCheckProvider');
  }
  return context;
}

interface HealthCheckProviderProps {
  children: ReactNode;
}

export function HealthCheckProvider({ children }: HealthCheckProviderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const healthState = useBackendHealth({
    checkOnMount: true,
    autoRetry: true,
    retryInterval: 30000, // Check every 30 seconds
  });

  const { isHealthy } = healthState;

  // Redirect to maintenance page when backend is unhealthy
  useEffect(() => {
    const isOnMaintenancePage = location.pathname === '/maintenance';

    // If backend is down and not already on maintenance page
    if (isHealthy === false && !isOnMaintenancePage) {
      console.warn('[HealthCheck] Backend unavailable, redirecting to maintenance page');
      navigate('/maintenance', { replace: true });
    }

    // If backend is healthy and on maintenance page, redirect to home or login
    if (isHealthy === true && isOnMaintenancePage) {
      console.info('[HealthCheck] Backend recovered, redirecting from maintenance');
      // Check if user has auth token to decide where to redirect
      const hasAuthToken = localStorage.getItem('medusa_auth_token');
      navigate(hasAuthToken ? '/' : '/login', { replace: true });
    }
  }, [isHealthy, location.pathname, navigate]);

  return (
    <HealthCheckContext.Provider value={healthState}>
      {children}
    </HealthCheckContext.Provider>
  );
}
