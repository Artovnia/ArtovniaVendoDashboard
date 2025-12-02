/**
 * Hook: useBatchShippingSetup
 * 
 * Creates complete shipping infrastructure for vendor with one API call
 */

import { useMutation, UseMutationOptions } from "@tanstack/react-query"
import { FetchError } from "@medusajs/js-sdk"
import { fetchQuery } from "../../../lib/client"
import { queryClient } from "../../../lib/query-client"

type BatchShippingSetupRequest = {
  use_custom_location?: boolean
  location_name?: string
  location_address?: {
    address_1: string
    city: string
    country_code: string
    postal_code?: string
    province?: string
    phone?: string
  }
  create_eu_zone?: boolean
}

type BatchShippingSetupResponse = {
  success: boolean
  message: string
  data: {
    stock_location: {
      id: string
      name: string
      address: any
    }
    fulfillment_set: {
      id: string
      name: string
      type: string
    }
    service_zones: {
      poland: {
        id: string
        name: string
        countries: number
      }
      eu: {
        id: string
        name: string
        countries: number
      }
    }
    summary: {
      total_profiles: number
      total_options: number
      zones: string[]
      location_source: string
    }
  }
}

type BatchShippingSetupError = {
  type: string
  message: string
  details?: string
}

/**
 * Hook to create batch shipping setup
 * 
 * Creates:
 * - 1 Stock Location
 * - 1 Fulfillment Set
 * - 2 Service Zones (Poland + EU)
 * - 4 Shipping Profiles (mini, small, medium, big)
 * - 25 Shipping Options (all carriers)
 * 
 * @example
 * const { mutate, isPending, isSuccess, error } = useBatchShippingSetup()
 * 
 * mutate({}, {
 *   onSuccess: (data) => {
 *     console.log('Setup complete:', data)
 *   },
 *   onError: (error) => {
 *     console.error('Setup failed:', error)
 *   }
 * })
 */
export const useBatchShippingSetup = (
  options?: UseMutationOptions<
    BatchShippingSetupResponse,
    FetchError,
    BatchShippingSetupRequest
  >
) => {
  return useMutation<
    BatchShippingSetupResponse,
    FetchError,
    BatchShippingSetupRequest
  >({
    mutationFn: (payload) =>
      fetchQuery("/vendor/batch-shipping/setup", {
        method: "POST",
        body: payload,
      }),
    onSuccess: async (data, variables, context) => {
      // Invalidate related queries
      await queryClient.invalidateQueries({
        queryKey: ["stock_locations"],
      })
      await queryClient.invalidateQueries({
        queryKey: ["shipping_profiles"],
      })
      await queryClient.invalidateQueries({
        queryKey: ["shipping_options"],
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

/**
 * Hook to check if vendor profile is complete
 * 
 * Validates required fields for shipping setup
 */
export const useVendorProfileComplete = () => {
  // This would typically fetch the vendor profile and check completeness
  // For now, we'll create a simple version
  
  const checkProfile = (seller: any): { 
    isComplete: boolean
    missingFields: string[] 
  } => {
    const requiredFields = [
      "name",
      "email", 
      "phone",
      "address_line",
      "city",
      "country_code",
      "postal_code",
    ]

    const missingFields = requiredFields.filter(
      (field) => !seller?.[field] || seller[field].trim() === ""
    )

    return {
      isComplete: missingFields.length === 0,
      missingFields,
    }
  }

  return { checkProfile }
}
