import { useMemo } from 'react'
import { HttpTypes } from '@medusajs/types'
import { useShippingProfiles } from './shipping-profiles'
import { useShippingOptions } from './shipping-options'

export interface ShippingProfileWithValidation {
  id: string
  name: string
  shipping_options_count?: number
  hasShippingOptions: boolean
  isValid: boolean
  validationMessage?: string
}

// Extended type for shipping profile with options count from backend
interface ShippingProfileWithCount extends HttpTypes.AdminShippingProfile {
  shipping_options_count?: number
}

/**
 * Hook to get shipping profiles with validation information
 * Checks if each profile has shipping options and provides validation status
 */
export const useShippingProfilesWithValidation = () => {
  const { shipping_profiles, isLoading: profilesLoading, error: profilesError } = useShippingProfiles()
  const { shipping_options, isLoading: optionsLoading, error: optionsError } = useShippingOptions()

  const profilesWithValidation = useMemo((): ShippingProfileWithValidation[] => {
    if (!shipping_profiles) return []
    
    // shipping_options might be undefined if the API call fails, so provide fallback
    const safeShippingOptions = shipping_options || []

    return shipping_profiles.map((profile) => {
      // Count shipping options for this profile
      const optionsForProfile = safeShippingOptions.filter(
        (option) => option.shipping_profile_id === profile.id
      )
      
      // Type assertion to handle the extended shipping profile type from backend
      const profileWithCount = profile as ShippingProfileWithCount
      
      // Prefer backend count if available, otherwise use client-side count
      const shipping_options_count = profileWithCount.shipping_options_count !== undefined 
        ? profileWithCount.shipping_options_count 
        : optionsForProfile.length
      
      const hasShippingOptions = shipping_options_count > 0
      
      let validationMessage: string | undefined
      if (!hasShippingOptions) {
        validationMessage = 'No shipping options configured. Customers cannot purchase products with this profile.'
      }

      return {
        ...profile,
        shipping_options_count,
        hasShippingOptions,
        isValid: hasShippingOptions,
        validationMessage
      }
    })
  }, [shipping_profiles, shipping_options])

  return {
    shipping_profiles: profilesWithValidation,
    isLoading: profilesLoading || optionsLoading,
    error: profilesError || optionsError
  }
}

/**
 * Hook to validate a specific shipping profile
 */
export const useShippingProfileValidation = (profileId?: string) => {
  const { shipping_profiles } = useShippingProfilesWithValidation()
  
  const validation = useMemo(() => {
    if (!profileId || !shipping_profiles) {
      return {
        isValid: false,
        hasShippingOptions: false,
        shipping_options_count: 0,
        validationMessage: 'No shipping profile selected'
      }
    }

    const profile = shipping_profiles.find(p => p.id === profileId)
    if (!profile) {
      return {
        isValid: false,
        hasShippingOptions: false,
        shipping_options_count: 0,
        validationMessage: 'Shipping profile not found'
      }
    }

    return {
      isValid: profile.isValid,
      hasShippingOptions: profile.hasShippingOptions,
      shipping_options_count: profile.shipping_options_count || 0,
      validationMessage: profile.validationMessage
    }
  }, [profileId, shipping_profiles])

  return validation
}
