import { useOnboardingContext } from '../../../providers/onboarding-provider'
import { useLocation } from 'react-router-dom'
import { useEffect, useRef } from 'react'

/**
 * OnboardingIndicator - Animated arrow that points to important buttons during onboarding
 * 
 * Features:
 * - Pulsing/bouncing animation
 * - Auto-hides after first interaction
 * - Persists state in localStorage
 * - Only shows during onboarding
 * 
 * Usage:
 * <OnboardingIndicator stepId="store_general_edit" position="right">
 *   <Button>Edit</Button>
 * </OnboardingIndicator>
 */
interface OnboardingIndicatorProps {
  stepId: string
  children: React.ReactNode
  position?: 'top' | 'right' | 'bottom' | 'left'
  className?: string
  editRoute?: string // e.g., 'edit' or 'edit-company'
}

export const OnboardingIndicator = ({
  stepId,
  children,
  position = 'right',
  className = '',
  editRoute,
}: OnboardingIndicatorProps) => {
  const context = useOnboardingContext()
  const location = useLocation()
  const wasOnEditPageRef = useRef(false)

  // Safety check: If context is not available, just render children without indicator
  if (!context) {
    console.warn('OnboardingIndicator: Context not available, rendering children only')
    return <>{children}</>
  }

  const { isOnboarding, hasInteractedWithStep, markStepInteracted } = context
  
  // Check if we're on THIS indicator's specific edit page (for marking as interacted)
  const isOnThisEditPage = editRoute ? location.pathname.includes(`/${editRoute}`) : location.pathname.includes('/edit')
  
  // Hide indicator on ANY edit page (not just this one's specific route)
  const isOnAnyEditPage = location.pathname.includes('/edit')
  const showIndicator = isOnboarding && !hasInteractedWithStep(stepId) && !isOnAnyEditPage

  // Mark as interacted when user returns from THIS indicator's edit page
  useEffect(() => {
    const wasOnThisEditPage = wasOnEditPageRef.current
    
    // If we were on THIS edit page and now we're back on parent page, mark as interacted
    if (wasOnThisEditPage && !isOnThisEditPage && showIndicator) {
      markStepInteracted(stepId)
    }
    
    // Update ref
    wasOnEditPageRef.current = isOnThisEditPage
  }, [location.pathname, isOnThisEditPage, showIndicator, stepId, markStepInteracted, editRoute])
  

  if (!showIndicator) {
    return <>{children}</>
  }

  // Position-specific arrow styles
  const arrowStyles = {
    top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
    right: 'left-full ml-2 top-1/2 -translate-y-1/2',
    bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
    left: 'right-full mr-2 top-1/2 -translate-y-1/2',
  }

  const arrowRotation = {
    top: 'rotate-[-90deg]',
    right: 'rotate-0',
    bottom: 'rotate-90',
    left: 'rotate-180',
  }

  return (
    <div className={`relative ${className}`}>
      {children}
      
      {/* Animated Arrow Indicator - z-10 to stay below modals and backdrops */}
      <div className={`absolute ${arrowStyles[position]} pointer-events-none z-10`}>
        <div className="relative">
          {/* Pulsing glow effect */}
          <div className="absolute inset-0 animate-ping">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={`${arrowRotation[position]} opacity-75`}
            >
              <path
                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                stroke="#3B82F6"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          
          {/* Main arrow with bounce animation */}
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`${arrowRotation[position]} animate-bounce-horizontal`}
          >
            <path
              d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
              stroke="#3B82F6"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* Highlight ring around element - z-10 to stay below modals */}
      <div className="absolute inset-0 rounded-lg ring-2 ring-blue-500 ring-offset-2 animate-pulse-ring pointer-events-none z-10" />
    </div>
  )
}
