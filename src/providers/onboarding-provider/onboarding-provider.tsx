import { ReactNode, useState, useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { useOnboarding, useMe } from '../../hooks/api'
import { OnboardingContext, OnboardingContextValue } from './onboarding-context'

/**
 * OnboardingProvider - Manages onboarding state and step tracking
 * 
 * Features:
 * - Detects if user is on onboarding-related routes
 * - Tracks step interactions in localStorage
 * - Provides context for blur overlay and indicators
 */
export const OnboardingProvider = ({ children }: { children: ReactNode }) => {
  const location = useLocation()
  const { onboarding } = useOnboarding()
  const { seller } = useMe()
  
  // Get seller-specific localStorage key (memoized to avoid recalculation)
  const storageKey = useMemo(() => {
    const sellerId = seller?.id || onboarding?.seller_id
    const key = sellerId ? `onboarding_interacted_steps_${sellerId}` : 'onboarding_interacted_steps'
    return key
  }, [seller?.id, onboarding?.seller_id])
  
  // Track which steps user has interacted with (persisted in localStorage, per seller)
  const [interactedSteps, setInteractedSteps] = useState<Set<string>>(() => {
    try {
      // Initial load - use fallback key since seller might not be loaded yet
      const fallbackKey = 'onboarding_interacted_steps'
      const stored = localStorage.getItem(fallbackKey)
      return stored ? new Set(JSON.parse(stored)) : new Set()
    } catch {
      return new Set()
    }
  })
  
  // Update interactedSteps when seller ID becomes available
  useEffect(() => {
    if (storageKey !== 'onboarding_interacted_steps') {
      try {
        const stored = localStorage.getItem(storageKey)
        if (stored) {
          setInteractedSteps(new Set(JSON.parse(stored)))
        } else {
          // Clear interactions for new seller
          setInteractedSteps(new Set())
        }
      } catch (e) {
        console.warn('Failed to load seller-specific interactions', e)
      }
    }
  }, [storageKey])

  // Onboarding-related routes
  const onboardingRoutes = [
    '/onboarding',
    '/settings/store',
    '/settings/locations/batch-setup',
    '/stripe-connect',
    '/products/create',
  ]

  // Check if current route is onboarding-related
  const isStepRoute = (pathname: string) => {
    return onboardingRoutes.some(route => pathname.startsWith(route))
  }

  const isOnboarding = useMemo(() => {
    // User is in onboarding if:
    // 1. Onboarding is incomplete
    // 2. Currently on an onboarding-related route
    
    // Handle fresh accounts where onboarding might be null/undefined
    if (!onboarding) {
      return isStepRoute(location.pathname)
    }
    
    const isIncomplete = !onboarding.store_information || 
                         !onboarding.locations_shipping || 
                         !onboarding.stripe_connection || 
                         !onboarding.products
    
    
    return isIncomplete && isStepRoute(location.pathname)
  }, [onboarding, location.pathname])

  // Determine current step based on route
  const currentStep = useMemo(() => {
    if (location.pathname.startsWith('/settings/store')) return 1
    if (location.pathname.startsWith('/settings/locations/batch-setup')) return 2
    if (location.pathname.startsWith('/stripe-connect')) return 3
    if (location.pathname.startsWith('/products/create')) return 4
    return null
  }, [location.pathname])

  // Mark step as interacted
  const markStepInteracted = (step: string) => {
    setInteractedSteps(prev => {
      const updated = new Set(prev)
      updated.add(step)
      
      // Persist to localStorage with seller-specific key
      try {
        localStorage.setItem(storageKey, JSON.stringify([...updated]))
      } catch (e) {
        console.warn('Failed to save onboarding progress', e)
      }
      
      return updated
    })
  }

  // Check if step has been interacted with
  const hasInteractedWithStep = (step: string) => {
    return interactedSteps.has(step)
  }

  // Clear interactions when onboarding is complete
  useEffect(() => {
    const isComplete = onboarding?.store_information && 
                       onboarding?.locations_shipping && 
                       onboarding?.stripe_connection && 
                       onboarding?.products
    
    if (isComplete) {
      // Clear localStorage when onboarding complete (both old and new keys)
      try {
        localStorage.removeItem(storageKey)
        localStorage.removeItem('onboarding_interacted_steps') // Clear old key too
      } catch (e) {
        console.warn('Failed to clear onboarding progress', e)
      }
    }
  }, [onboarding, storageKey])

  const value: OnboardingContextValue = {
    isOnboarding,
    currentStep,
    hasInteractedWithStep,
    markStepInteracted,
    isStepRoute,
  }

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  )
}
