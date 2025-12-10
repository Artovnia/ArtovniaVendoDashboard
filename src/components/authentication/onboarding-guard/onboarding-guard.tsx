import { Spinner } from '@medusajs/icons'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useOnboarding } from '../../../hooks/api'

/**
 * OnboardingGuard - Enforces onboarding completion before accessing main app
 * 
 * Blocks all routes except:
 * - /onboarding (the wizard)
 * - /settings/store (step 1)
 * - /settings/locations/batch-setup (step 2)
 * - /stripe-connect (step 3)
 * - /products/create (step 4)
 * - /logout
 * 
 * Redirects incomplete sellers to /onboarding wizard
 */
export const OnboardingGuard = () => {
  const { onboarding, isPending } = useOnboarding()
  const location = useLocation()

  // Show loading spinner while checking onboarding status
  if (isPending) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <Spinner className='text-ui-fg-interactive animate-spin' />
      </div>
    )
  }

  // Define allowed routes during onboarding
  const allowedOnboardingRoutes = [
    '/onboarding',
    '/settings/store',
    '/settings/locations/batch-setup',
    '/stripe-connect',
    '/products/create',
    '/logout',
  ]

  const isOnboardingRoute = allowedOnboardingRoutes.some(route => 
    location.pathname.startsWith(route)
  )

  // Check if onboarding is complete
  const isOnboardingComplete = 
    onboarding?.store_information &&
    onboarding?.locations_shipping &&
    onboarding?.stripe_connection &&
    onboarding?.products

  // If onboarding incomplete and trying to access restricted route, redirect to wizard
  if (!isOnboardingComplete && !isOnboardingRoute) {
    return (
      <Navigate
        to='/onboarding'
        state={{ from: location }}
        replace
      />
    )
  }

  // If onboarding complete and on onboarding route, redirect to dashboard
  if (isOnboardingComplete && location.pathname === '/onboarding') {
    return <Navigate to='/' replace />
  }

  // Allow access
  return <Outlet />
}
