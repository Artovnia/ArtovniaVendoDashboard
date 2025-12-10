import { Spinner } from '@medusajs/icons';
import {
  Navigate,
  useLocation,
} from 'react-router-dom';
import { useMe } from '../../../hooks/api/users';
import { SearchProvider } from '../../../providers/search-provider';
import { SidebarProvider } from '../../../providers/sidebar-provider';
import { OnboardingGuard } from '../onboarding-guard';
import { OnboardingProvider } from '../../../providers/onboarding-provider';

/**
 * ProtectedRoute - Handles authentication and onboarding enforcement
 * 
 * Flow:
 * 1. Check if user is authenticated
 * 2. If authenticated, wrap with OnboardingGuard to enforce onboarding completion
 * 3. OnboardingGuard redirects to /onboarding wizard if incomplete
 */
export const ProtectedRoute = () => {
  const { seller, isPending } = useMe();

  const location = useLocation();
  if (isPending) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <Spinner className='text-ui-fg-interactive animate-spin' />
      </div>
    );
  }

  if (!seller) {
    return (
      <Navigate
        to='/login'
        state={{ from: location }}
        replace
      />
    );
  }

  return (
    <OnboardingProvider>
      <SidebarProvider>
        <SearchProvider>
          {/* OnboardingGuard enforces onboarding completion */}
          <OnboardingGuard />
        </SearchProvider>
      </SidebarProvider>
    </OnboardingProvider>
  );
};
