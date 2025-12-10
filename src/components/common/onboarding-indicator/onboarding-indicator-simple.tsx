import { useOnboardingContext } from '../../../providers/onboarding-provider'
import { useLocation } from 'react-router-dom'
import { useEffect, useRef } from 'react'

/**
 * Simplified OnboardingIndicator for debugging
 * Shows a bright red box instead of animated arrow
 */
export const OnboardingIndicatorSimple = ({
  stepId,
  children,
  position = 'right',
  editRoute,
}: {
  stepId: string
  children: React.ReactNode
  position?: 'top' | 'right' | 'bottom' | 'left'
  editRoute?: string // e.g., 'edit' or 'edit-company'
}) => {
  const { isOnboarding, hasInteractedWithStep, markStepInteracted } = useOnboardingContext()
  const location = useLocation()
  const previousPathRef = useRef(location.pathname)
  const wasOnEditPageRef = useRef(false)

  // Check if we're on THIS indicator's specific edit page (for marking as interacted)
  const isOnThisEditPage = editRoute ? location.pathname.includes(`/${editRoute}`) : location.pathname.includes('/edit')

  // Hide indicator on ANY edit page (not just this one's specific route)
  const isOnAnyEditPage = location.pathname.includes('/edit')
  const showIndicator = isOnboarding && !hasInteractedWithStep(stepId) && !isOnAnyEditPage

  // Mark as interacted when user returns from THIS indicator's edit page
  useEffect(() => {
    const currentPath = location.pathname
    const previousPath = previousPathRef.current
    const wasOnThisEditPage = wasOnEditPageRef.current
    
    // If we were on THIS edit page and now we're back on parent page, mark as interacted
    if (wasOnThisEditPage && !isOnThisEditPage && showIndicator) {
      markStepInteracted(stepId)
    }
    
    // Update refs
    previousPathRef.current = currentPath
    wasOnEditPageRef.current = isOnThisEditPage
  }, [location.pathname, isOnThisEditPage, showIndicator, stepId, markStepInteracted, editRoute])

  

  if (!showIndicator) {
    return <>{children}</>
  }

  const positionClasses = {
    top: 'bottom-full mb-4 left-1/2 -translate-x-1/2',
    right: 'left-full ml-4 top-1/2 -translate-y-1/2',
    bottom: 'top-full mt-4 left-1/2 -translate-x-1/2',
    left: 'right-full mr-4 top-1/2 -translate-y-1/2',
  }

  return (
    <div className="relative">
      {children}

      {/* Highlight ring around the element */}
      <div
        className="absolute inset-0 rounded-lg pointer-events-none z-10 
                   onboarding-indicator-ring"
        style={{
          border: '2px solid rgb(59, 130, 246)',
          background: 'rgba(59, 130, 246, 0.05)',
        }}
      />

      {/* Modern pulsing indicator dot */}
      <div
        className={`absolute ${positionClasses[position]} 
                    pointer-events-none z-10`}
      >
        <div className="relative flex items-center justify-center">
          {/* Outer ripple effects (3 layers) */}
          {[0, 0.3, 0.6].map((delay, i) => (
            <div
              key={i}
              className="absolute w-6 h-6 rounded-full bg-blue-500 
                         onboarding-indicator-ripple"
              style={{
                animationDelay: `${delay}s`,
                opacity: 0.3 - i * 0.1,
              }}
            />
          ))}

          {/* Middle glow ring */}
          <div
            className="absolute w-6 h-6 rounded-full"
            style={{
              background:
                'radial-gradient(circle, rgba(59,130,246,0.4) 0%, ' +
                'rgba(59,130,246,0) 70%)',
              filter: 'blur(4px)',
            }}
          />

          {/* Main pulsing dot */}
          <div
            className="relative w-3 h-3 rounded-full 
                       onboarding-indicator-dot"
            style={{
              background:
                'linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)',
              boxShadow:
                '0 0 12px rgba(59, 130, 246, 0.8), ' +
                '0 0 24px rgba(59, 130, 246, 0.4)',
            }}
          >
            {/* Inner highlight */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background:
                  'radial-gradient(circle at 30% 30%, ' +
                  'rgba(255,255,255,0.8) 0%, transparent 60%)',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}