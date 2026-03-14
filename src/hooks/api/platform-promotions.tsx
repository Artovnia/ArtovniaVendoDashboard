import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { fetchQuery } from "../../lib/client"
import { toast } from "@medusajs/ui"
import { i18n } from "../../components/utilities/i18n"

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

type PlatformPromotionApiError = Error & {
  body?: {
    message?: string
    conflicts?: Array<{ product_id?: string; reason?: string }>
    skipped_product_ids?: string[]
  }
  status?: number
}

const getAddProductsErrorMessage = (error: unknown) => {
  const apiError = error as PlatformPromotionApiError
  const conflicts = apiError?.body?.conflicts || []

  if (conflicts.length > 0) {
    return i18n.t("platformPromotions.errors.productsAlreadyInOtherPromotion", {
      count: conflicts.length,
    })
  }

  if (apiError?.status === 409) {
    return i18n.t("platformPromotions.errors.promotionConflict")
  }

  return i18n.t("platformPromotions.toasts.addProductsError")
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
      // ✅ FIX: Ensure token is available before making request
      const token = await window.localStorage.getItem('medusa_auth_token')
      if (!token) {
        throw new Error('Authentication token not available')
      }

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
    retry: (failureCount, error) => {
      // ✅ FIX: Retry on auth errors up to 3 times with delay
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        return failureCount < 3
      }
      return failureCount < 1
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000), // Exponential backoff
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
      // ✅ FIX: Add retry delay to ensure token is available
      const token = await window.localStorage.getItem('medusa_auth_token')
      if (!token) {
        throw new Error('Authentication token not available')
      }

      const result = await fetchQuery(`/vendor/platform-promotions/${id}`, {
        method: "GET",
      })

      if (result.error) {
        throw new Error(result.error)
      }

      return result
    },
    enabled: options?.enabled ?? true,
    retry: (failureCount, error) => {
      // ✅ FIX: Retry on auth errors up to 3 times with delay
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        return failureCount < 3
      }
      return failureCount < 1
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000), // Exponential backoff
  })
}

/**
 * Hook to add products to a platform promotion
 */
export const useAddProductsToPromotion = (promotionId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: AddProductsToPromotionPayload) => {
      const result = await fetchQuery(`/vendor/platform-promotions/${promotionId}/products`, {
        method: "POST",
        body: payload,
      })

      // Network helpers can return { error } instead of throwing.
      if (result.error || result.code === 'promotion_update_error') {
        throw new Error(result.message || result.error || i18n.t("platformPromotions.toasts.addProductsError"))
      }

      return result
    },
    onSuccess: (result: any) => {
      const skippedCount = result?.skipped_product_ids?.length || 0
      const addedCount = result?.added_products?.length || 0

      if (skippedCount > 0) {
        toast.warning(
          i18n.t("platformPromotions.toasts.productsAddedWithConflicts", {
            added: addedCount,
            skipped: skippedCount,
          })
        )
      } else {
        toast.success(i18n.t("platformPromotions.toasts.productsAdded"))
      }
      
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({
        queryKey: [PLATFORM_PROMOTIONS_QUERY_KEY],
      })
      queryClient.invalidateQueries({
        queryKey: [PLATFORM_PROMOTION_QUERY_KEY, promotionId],
      })
    },
    onError: (error: unknown) => {
      toast.error(getAddProductsErrorMessage(error))
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
    onSuccess: () => {
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
