import { createContext, useContext } from 'react'

/**
 * OnboardingContext - Tracks onboarding state and step interactions
 * 
 * Used to:
 * - Determine if user is in onboarding mode
 * - Track which steps have been interacted with
 * - Control blur overlay on sidebar
 * - Show/hide animated indicators
 */
export interface OnboardingContextValue {
  isOnboarding: boolean
  currentStep: number | null
  hasInteractedWithStep: (step: string) => boolean
  markStepInteracted: (step: string) => void
  isStepRoute: (pathname: string) => boolean
}

export const OnboardingContext = createContext<OnboardingContextValue | null>(null)

export const useOnboardingContext = () => {
  const context = useContext(OnboardingContext)
  if (!context) {
    // Return default values if provider not found (non-onboarding routes)
    return {
      isOnboarding: false,
      currentStep: null,
      hasInteractedWithStep: () => true, // Hide indicators by default
      markStepInteracted: () => {},
      isStepRoute: () => false,
    }
  }
  return context
}
