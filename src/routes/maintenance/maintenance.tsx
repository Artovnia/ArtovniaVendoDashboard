/**
 * Maintenance Page for Vendor Panel
 *
 * Displayed when the backend is unavailable.
 */

import { Button, Container, Heading, Text } from '@medusajs/ui';
import { ArrowPath } from '@medusajs/icons';
import { useBackendHealth } from '../../hooks/use-backend-health';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const MaintenancePage = () => {
  const navigate = useNavigate();
  const { isHealthy, isChecking, refresh } = useBackendHealth({
    checkOnMount: true,
    autoRetry: true,
    retryInterval: 15000, // Check every 15 seconds
  });

  // Redirect to home when backend becomes healthy
  useEffect(() => {
    if (isHealthy === true) {
      navigate('/', { replace: true });
    }
  }, [isHealthy, navigate]);

  const handleRetry = async () => {
    const healthy = await refresh();
    if (healthy) {
      navigate('/', { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ui-bg-subtle">
      <Container className="max-w-2xl">
        <div className="text-center space-y-8">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="p-4 bg-ui-bg-base rounded-full shadow-elevation-card-rest">
              <img src="/logo.svg" alt="Logo" className="w-16 h-16 object-contain" />
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <Heading level="h1" className="text-ui-fg-base">
              Panel w trakcie konserwacji
            </Heading>
            <Text className="text-ui-fg-subtle text-lg">
              Przepraszamy za niedogodności. Serwer jest obecnie niedostępny.
            </Text>
          </div>

          {/* Info Box */}
          <div className="bg-ui-bg-base border border-ui-border-base rounded-lg p-6 text-left">
            <Text className="font-medium text-ui-fg-base mb-3">
              Co się dzieje?
            </Text>
            <Text className="text-ui-fg-subtle mb-4">
              Nasz serwer jest obecnie niedostępny. Może to być spowodowane:
            </Text>
            <ul className="space-y-2 text-ui-fg-subtle">
              <li className="flex items-start gap-2">
                <span className="text-ui-fg-muted">•</span>
                <span>Planowaną konserwacją systemu</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-ui-fg-muted">•</span>
                <span>Aktualizacją oprogramowania</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-ui-fg-muted">•</span>
                <span>Tymczasowymi problemami technicznymi</span>
              </li>
            </ul>
          </div>

          {/* Retry Button */}
          <div className="space-y-4">
            <Button
              variant="primary"
              size="large"
              onClick={handleRetry}
              isLoading={isChecking}
              disabled={isChecking}
            >
              <ArrowPath className="mr-2" />
              Spróbuj ponownie
            </Button>

            <Text className="text-ui-fg-muted text-sm">
              {isChecking
                ? 'Sprawdzanie dostępności serwera...'
                : 'Strona automatycznie sprawdza dostępność serwera co 15 sekund'}
            </Text>
          </div>

          {/* Contact Info */}
          <div className="pt-6 border-t border-ui-border-base">
            <Text className="text-ui-fg-subtle">
              Jeśli problem się utrzymuje, skontaktuj się z nami:
            </Text>
            <a
              href="mailto:sayuri.platform@gmail.com"
              className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover font-medium underline underline-offset-4"
            >
              sayuri.platform@gmail.com
            </a>
          </div>

          {/* Status Indicator */}
          <div className="flex items-center justify-center gap-2 text-sm text-ui-fg-muted">
            <div
              className={`w-2 h-2 rounded-full ${
                isHealthy === false
                  ? 'bg-ui-tag-red-icon animate-pulse'
                  : isHealthy === true
                    ? 'bg-ui-tag-green-icon'
                    : 'bg-ui-tag-orange-icon animate-pulse'
              }`}
            />
            <span>
              Status:{' '}
              {isHealthy === false
                ? 'Niedostępny'
                : isHealthy === true
                  ? 'Dostępny'
                  : 'Sprawdzanie...'}
            </span>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default MaintenancePage;

export const config = {
  name: 'maintenance',
};
