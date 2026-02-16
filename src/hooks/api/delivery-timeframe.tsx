import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { fetchQuery } from "../../lib/client"

/**
 * Delivery Timeframe Types
 */
export interface DeliveryTimeframe {
  id: string
  product_id: string
  min_days: number
  max_days: number
  label: string | null
  is_custom: boolean
  created_at: string
  updated_at: string
}

export interface DeliveryTimeframePreset {
  key: string
  min_days: number
  max_days: number
  label: string
}

export const DELIVERY_TIMEFRAME_PRESETS = {
  "1-3": { min_days: 1, max_days: 3, label: "1-3 dni" },
  "3-5": { min_days: 3, max_days: 5, label: "3-5 dni" },
  "7-14": { min_days: 7, max_days: 14, label: "7-14 dni" },
} as const

export type DeliveryTimeframePresetKey = keyof typeof DELIVERY_TIMEFRAME_PRESETS

/**
 * Hook to get delivery timeframe for a product
 */
export const useProductDeliveryTimeframe = (productId: string, options?: { enabled?: boolean }) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["delivery-timeframe", productId],
    queryFn: async () => {
      const response = await fetchQuery(`/vendor/products/delivery-timeframe/${productId}`, {
        method: "GET",
      })
      return response as { delivery_timeframe: DeliveryTimeframe | null }
    },
    enabled: options?.enabled !== false && !!productId,
  })

  return {
    deliveryTimeframe: data?.delivery_timeframe,
    isLoading,
    error,
    refetch,
  }
}

/**
 * Hook to set delivery timeframe for a product
 */
export const useSetProductDeliveryTimeframe = (productId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      preset?: DeliveryTimeframePresetKey
      min_days?: number
      max_days?: number
      label?: string
      is_custom?: boolean
    }) => {
      const response = await fetchQuery(`/vendor/products/delivery-timeframe/${productId}`, {
        method: "POST",
        body: data,
      })
      return response as { delivery_timeframe: DeliveryTimeframe }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-timeframe", productId] })
      queryClient.invalidateQueries({ queryKey: ["products"] })
    },
  })
}

/**
 * Hook to delete delivery timeframe from a product
 */
export const useDeleteProductDeliveryTimeframe = (productId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await fetchQuery(`/vendor/products/delivery-timeframe/${productId}`, {
        method: "DELETE",
      })
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-timeframe", productId] })
      queryClient.invalidateQueries({ queryKey: ["products"] })
    },
  })
}

/**
 * Hook to bulk set delivery timeframe for multiple products
 */
export const useBulkSetDeliveryTimeframe = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      product_ids: string[]
      preset?: DeliveryTimeframePresetKey
      min_days?: number
      max_days?: number
      label?: string
    }) => {
      const response = await fetchQuery("/vendor/products/batch/delivery-timeframe", {
        method: "POST",
        body: data,
      })
      return response as {
        success: boolean
        updated_count: number
        failed_products: string[]
        skipped_products: string[]
        message: string
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-timeframe"] })
      queryClient.invalidateQueries({ queryKey: ["products"] })
    },
  })
}

/**
 * Hook to get delivery timeframe presets
 */
export const useDeliveryTimeframePresets = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["delivery-timeframe-presets"],
    queryFn: async () => {
      const response = await fetchQuery("/vendor/products/batch/delivery-timeframe", {
        method: "GET",
      })
      return response as { presets: DeliveryTimeframePreset[] }
    },
    staleTime: Infinity, // Presets don't change
  })

  return {
    presets: data?.presets || [],
    isLoading,
    error,
  }
}
