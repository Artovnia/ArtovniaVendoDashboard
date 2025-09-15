import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { fetchQuery } from "../../lib/client"
import { toast } from "@medusajs/ui"

const PLATFORM_PROMOTIONS_QUERY_KEY = "platform_promotions" as const
const PLATFORM_PROMOTION_QUERY_KEY = "platform_promotion" as const

// Types
export interface PlatformPromotion {
  id: string
  code: string
  type: string
  value: number
  is_automatic: boolean
  created_at: string
  updated_at: string
  campaign_id: string | null
  application_method?: {
    id: string
    type: string
    target_type: string
    allocation: string
    value: number
    max_quantity: number | null
    buy_rules_min_quantity: number | null
    apply_to_quantity: number | null
    currency_code: string | null
  }
  campaign?: {
    id: string
    name: string
    description: string | null
    starts_at: string | null
    ends_at: string | null
    budget: any
  }
  rules?: Array<{
    id: string
    attribute: string
    operator: string
    values: string[]
  }>
  vendor_participation?: {
    has_products: boolean
    product_count: number
    product_ids?: string[]
    products_in_promotion?: Array<{
      id: string
      title: string
      handle: string
      thumbnail: string | null
      status: string
    }>
    available_products?: Array<{
      id: string
      title: string
      handle: string
      thumbnail: string | null
      status: string
    }>
  }
}

export interface PlatformPromotionsResponse {
  promotions: PlatformPromotion[]
  count: number
  offset: number
  limit: number
}

export interface PlatformPromotionResponse {
  promotion: PlatformPromotion
}

// Query parameters
export interface PlatformPromotionsQueryParams {
  limit?: number
  offset?: number
  q?: string
}

// Mutation payloads
export interface AddProductsToPromotionPayload {
  product_ids: string[]
}

export interface RemoveProductsFromPromotionPayload {
  product_ids: string[]
}

/**
 * Hook to list platform promotions
 */
export const usePlatformPromotions = (
  query?: PlatformPromotionsQueryParams,
  options?: {
    enabled?: boolean
  }
) => {
  return useQuery({
    queryKey: [PLATFORM_PROMOTIONS_QUERY_KEY, query],
    queryFn: async (): Promise<PlatformPromotionsResponse> => {
      const queryParams: Record<string, string | number> = {}
      
      if (query?.limit) queryParams.limit = query.limit
      if (query?.offset) queryParams.offset = query.offset
      if (query?.q) queryParams.q = query.q

      const result = await fetchQuery("/vendor/platform-promotions", {
        method: "GET",
        query: queryParams,
      })

      if (result.error) {
        throw new Error(result.error)
      }

      return result
    },
    enabled: options?.enabled ?? true,
  })
}

/**
 * Hook to get a specific platform promotion
 */
export const usePlatformPromotion = (
  id: string,
  options?: {
    enabled?: boolean
  }
) => {
  return useQuery({
    queryKey: [PLATFORM_PROMOTION_QUERY_KEY, id],
    queryFn: async (): Promise<PlatformPromotionResponse> => {
      const result = await fetchQuery(`/vendor/platform-promotions/${id}`, {
        method: "GET",
      })

      if (result.error) {
        throw new Error(result.error)
      }

      return result
    },
    enabled: options?.enabled ?? true,
  })
}

/**
 * Hook to add products to a platform promotion
 */
export const useAddProductsToPromotion = (promotionId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: AddProductsToPromotionPayload) => {
      try {
        const result = await fetchQuery(`/vendor/platform-promotions/${promotionId}/products`, {
          method: "POST",
          body: payload,
        })

        // Check if the response indicates an error
        if (result.error || result.code === 'promotion_update_error') {
          throw new Error(result.message || result.error || 'Failed to add products to promotion')
        }

        return result
      } catch (error: any) {
        // Ensure we properly throw the error for React Query to catch
        throw new Error(error.message || 'Failed to add products to promotion')
      }
    },
    onSuccess: (data) => {
      toast.success("Products added to promotion successfully")
      
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({
        queryKey: [PLATFORM_PROMOTIONS_QUERY_KEY],
      })
      queryClient.invalidateQueries({
        queryKey: [PLATFORM_PROMOTION_QUERY_KEY, promotionId],
      })
    },
    onError: (error: Error) => {
      toast.error(`Failed to add products: ${error.message}`)
    },
  })
}

/**
 * Hook to remove products from a platform promotion
 */
export const useRemoveProductsFromPromotion = (promotionId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: RemoveProductsFromPromotionPayload) => {
      const result = await fetchQuery(`/vendor/platform-promotions/${promotionId}/products`, {
        method: "DELETE",
        body: payload,
      })

      if (result.error) {
        throw new Error(result.error)
      }

      return result
    },
    onSuccess: (data) => {
      toast.success("Products removed from promotion successfully")
      
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({
        queryKey: [PLATFORM_PROMOTIONS_QUERY_KEY],
      })
      queryClient.invalidateQueries({
        queryKey: [PLATFORM_PROMOTION_QUERY_KEY, promotionId],
      })
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove products: ${error.message}`)
    },
  })
}
