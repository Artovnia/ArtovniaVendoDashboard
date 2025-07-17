import { FetchError } from "@medusajs/js-sdk"
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
  useQueryClient,
} from '@tanstack/react-query'
import { toast } from '@medusajs/ui'
import { fetchQuery } from "../../lib/client"
import { queryKeysFactory } from "../../lib/query-key-factory"
import { priceListsQueryKeys } from "./price-lists"

// Create dedicated query keys for price list variants
const PRICE_LIST_VARIANTS_QUERY_KEY = "price-list-variants" as const
export const priceListVariantsQueryKeys = queryKeysFactory(PRICE_LIST_VARIANTS_QUERY_KEY)

/**
 * This hook fetches variants that have prices in a price list.
 * Since prices can only be assigned to variants (not products directly),
 * we need to get all variants with their prices from the price list.
 */

/**
 * Hook to fetch all variants in a price list
 * This retrieves variants with their associated prices in the price list
 */
export const usePriceListVariants = (
  priceListId: string,
  query?: Record<string, any>,
  options?: Omit<
    UseQueryOptions<any, FetchError, any, QueryKey>,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery({
    queryKey: priceListVariantsQueryKeys.list({ priceListId, ...query }),
    queryFn: async () => {
      try {
        // Get the price list data
        const priceListData = await fetchQuery(`/vendor/price-lists/${priceListId}`, {
          method: 'GET'
        })
        
        // Check if we have the price list data
        if (!priceListData?.price_list) {
          console.error('Price list not found or invalid response format')
          return { variants: [] }
        }
        
        // Get prices from the price list
        const prices = priceListData.price_list.prices || []
        
        if (!Array.isArray(prices) || prices.length === 0) {
          console.warn('No prices found for price list')
          return { variants: [] }
        }
        
        // Extract unique variant IDs from the prices
        const variantIds = [...new Set(
          prices
            .filter((price: any) => price.variant_id)
            .map((price: any) => price.variant_id)
        )]
        
        if (variantIds.length === 0) {
          console.warn('No variant IDs found in price list')
          return { variants: [] }
        }
        
        console.log(`Found ${variantIds.length} unique variant IDs in price list ${priceListId}`)
        
        // Create a map of variant IDs to their prices for easy lookup
        const variantPricesMap: Record<string, any> = {}
        
        prices.forEach((price: any) => {
          if (price.variant_id) {
            variantPricesMap[price.variant_id] = {
              id: price.id,
              amount: price.amount,
              currency_code: price.currency_code,
              region_id: price.region_id,
              min_quantity: price.min_quantity,
              max_quantity: price.max_quantity
            }
          }
        })
        
        // Fetch all products with their variants
        const productsResponse = await fetchQuery('/vendor/products', {
          method: 'GET',
          query: { limit: 100, expand: 'variants' }
        })
        
        if (!productsResponse?.products || !Array.isArray(productsResponse.products)) {
          console.warn('No products found or invalid response format')
          return { variants: [] }
        }
        
        // Extract all variants from all products
        const allVariants: any[] = []
        
        productsResponse.products.forEach((product: any) => {
          if (product.variants && Array.isArray(product.variants)) {
            product.variants.forEach((variant: any) => {
              // Only include variants that are in our price list
              if (variantIds.includes(variant.id)) {
                allVariants.push({
                  ...variant,
                  product: {
                    id: product.id,
                    title: product.title,
                    thumbnail: product.thumbnail
                  },
                  price_list_price: variantPricesMap[variant.id] || null
                })
              }
            })
          }
        })
        
        console.log(`Found ${allVariants.length} variants from products that match price list variants`)
        
        return { variants: allVariants }
      } catch (error) {
        console.error(`Error fetching price list variants for ${priceListId}:`, error)
        throw error
      }
    },
    ...options
  })
}

/**
 * Hook to fetch a single variant with its price list price
 */
export const usePriceListVariant = (
  priceListId: string,
  variantId: string,
  options?: Omit<
    UseQueryOptions<any, FetchError, any, QueryKey>,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery({
    queryKey: priceListVariantsQueryKeys.detail(variantId, { priceListId }),
    queryFn: async () => {
      try {
        // First get the price list with the specific price for this variant
        const priceListData = await fetchQuery(`/vendor/price-lists/${priceListId}`, {
          method: 'GET'
        })
        
        if (!priceListData?.price_list?.prices) {
          throw new Error(`No prices found for price list ${priceListId}`)
        }
        
        // Find prices for this variant
        const variantPrices = priceListData.price_list.prices
          .filter((price: any) => price.variant_id === variantId)
        
        // Fetch the variant details
        const variantData = await fetchQuery(`/vendor/product-variants/${variantId}`, {
          method: 'GET'
        })
        
        if (!variantData?.variant) {
          throw new Error(`Variant ${variantId} not found`)
        }
        
        // Combine the data
        return {
          variant: {
            ...variantData.variant,
            price_list_prices: variantPrices,
            price_list_price: variantPrices[0] || null
          }
        }
      } catch (error) {
        console.error(`Error fetching price list variant ${variantId} in price list ${priceListId}:`, error)
        throw error
      }
    },
    ...options
  })
}

/**
 * Hook to update a variant's price in a price list
 */
export const useUpdatePriceListVariantPrice = (
  priceListId: string,
  options?: UseMutationOptions<any, FetchError, any>
) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (payload: {
      variant_id: string,
      price_id?: string,
      amount: number,
      currency_code?: string,
      region_id?: string,
      min_quantity?: number,
      max_quantity?: number
    }) => {
      try {
        const { variant_id, price_id, ...priceData } = payload
        
        if (price_id) {
          // Update existing price
          const result = await fetchQuery(`/vendor/price-lists/${priceListId}/prices/${price_id}`, {
            method: 'POST',
            body: priceData
          })
          return result
        } else {
          // Create new price
          const result = await fetchQuery(`/vendor/price-lists/${priceListId}/prices`, {
            method: 'POST',
            body: {
              variant_id,
              ...priceData
            }
          })
          return result
        }
      } catch (error) {
        console.error(`Error updating price for variant in price list ${priceListId}:`, error)
        
        // Fallback to batch endpoint if individual price update fails
        try {
          const result = await fetchQuery(`/vendor/price-lists/${priceListId}/prices/batch`, {
            method: 'POST',
            body: {
              prices: [{
                variant_id: payload.variant_id,
                amount: payload.amount,
                currency_code: payload.currency_code,
                region_id: payload.region_id,
                min_quantity: payload.min_quantity,
                max_quantity: payload.max_quantity
              }]
            }
          })
          return result
        } catch (fallbackError) {
          console.error('Fallback to batch endpoint failed:', fallbackError)
          throw error // Throw the original error
        }
      }
    },
    onSuccess: () => {
      toast.success('Price updated successfully')
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({
        queryKey: priceListVariantsQueryKeys.lists(),
      })
      
      queryClient.invalidateQueries({
        queryKey: priceListsQueryKeys.detail(priceListId),
      })
    },
    onError: (error) => {
      toast.error(`Failed to update price: ${error.message}`)
    },
    ...options
  })
}

/**
 * Hook to delete a variant's price from a price list
 */
export const useDeletePriceListVariantPrice = (
  priceListId: string,
  options?: UseMutationOptions<any, FetchError, { price_id: string }>
) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ price_id }: { price_id: string }) => {
      try {
        const result = await fetchQuery(`/vendor/price-lists/${priceListId}/prices/${price_id}`, {
          method: 'DELETE'
        })
        return result
      } catch (error) {
        console.error(`Error deleting price ${price_id} from price list ${priceListId}:`, error)
        throw error
      }
    },
    onSuccess: () => {
      toast.success('Price removed successfully')
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({
        queryKey: priceListVariantsQueryKeys.lists(),
      })
      
      queryClient.invalidateQueries({
        queryKey: priceListsQueryKeys.detail(priceListId),
      })
    },
    onError: (error) => {
      toast.error(`Failed to remove price: ${error.message}`)
    },
    ...options
  })
}

/**
 * Hook to batch update multiple variant prices in a price list
 */
export const useUpdatePriceListVariantPrices = (
  priceListId: string,
  options?: UseMutationOptions<any, FetchError, any>
) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (payload: {
      prices: Array<{
        variant_id: string,
        price_id?: string,
        amount: number,
        currency_code?: string,
        region_id?: string,
        min_quantity?: number,
        max_quantity?: number
      }>
    }) => {
      try {
        // Format the payload for the batch endpoint
        const batchPayload = {
          prices: payload.prices.map(({ price_id, ...price }) => ({
            ...price,
            id: price_id // Include ID if it exists for updates
          }))
        }
        
        const result = await fetchQuery(`/vendor/price-lists/${priceListId}/prices/batch`, {
          method: 'POST',
          body: batchPayload
        })
        
        return result
      } catch (error) {
        console.error(`Error batch updating prices for price list ${priceListId}:`, error)
        throw error
      }
    },
    onSuccess: () => {
      toast.success('Prices updated successfully')
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({
        queryKey: priceListVariantsQueryKeys.lists(),
      })
      
      queryClient.invalidateQueries({
        queryKey: priceListsQueryKeys.detail(priceListId),
      })
    },
    onError: (error) => {
      toast.error(`Failed to update prices: ${error.message}`)
    },
    ...options
  })
}
