import { FetchError } from "@medusajs/js-sdk"
import { HttpTypes } from "@medusajs/types"
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
import { queryClient } from "../../lib/query-client"
import { queryKeysFactory } from "../../lib/query-key-factory"
import { productsQueryKeys } from "./products"

// Consistent query key factory
const PRICE_LISTS_QUERY_KEY = "price-lists" as const
export const priceListsQueryKeys = queryKeysFactory(PRICE_LISTS_QUERY_KEY)

// Default price list structure to ensure consistent data format
const createDefaultPriceList = (id: string) => ({
  id: id || 'default-price-list', 
  prices: [],
  title: "Price List",
  description: "",
  type: "sale",
  status: "active",
  starts_at: null,
  ends_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  deleted_at: null,
  customer_groups: [],
})

/**
 * Ensures a price list object has all required fields
 */
const ensurePriceListFields = (priceList: any, id: string) => {
  const defaults = createDefaultPriceList(id)
  return { ...defaults, ...priceList }
}

/**
 * Normalize API response for price lists
 */
const normalizePriceListResponse = (result: any, id: string) => {
  if (!result) return { price_list: createDefaultPriceList(id) }
  
  let priceList = null
  
  // Handle various response formats
  if (result.price_list) {
    // Response has price_list property
    priceList = Array.isArray(result.price_list) 
      ? (result.price_list[0] || null)
      : result.price_list
  } else if (Array.isArray(result)) {
    // Response is array of price lists
    priceList = result[0] || null
  } else if (result && typeof result === 'object') {
    // Response is price list object directly
    priceList = result
  }
  
  if (!priceList || typeof priceList !== 'object') {
    priceList = createDefaultPriceList(id)
  } else {
    priceList = ensurePriceListFields(priceList, id)
  }
  
  return { price_list: priceList }
}

/**
 * IMPORTANT: Invalidate all relevant queries after price list operations
 * This is crucial for ensuring the dashboard shows updated data
 */
export const invalidatePriceListQueries = (id?: string, isDeleted: boolean = false) => {
  
  // Handle differently depending on whether we're deleting or updating
  if (id) {
    if (isDeleted) {
      // For deleted price lists, remove from cache instead of refetching
      queryClient.removeQueries({ queryKey: priceListsQueryKeys.detail(id) })
    } else {
      // For updates, invalidate and refetch to get fresh data
      queryClient.invalidateQueries({
        queryKey: priceListsQueryKeys.detail(id),
        refetchType: 'all',
      })
      
      // Then try to refetch it to ensure newest data
      queryClient.fetchQuery({
        queryKey: priceListsQueryKeys.detail(id),
        staleTime: 0,
      })
    }
  }
  
  // Always force refetch of the price lists collection
  queryClient.invalidateQueries({
    queryKey: priceListsQueryKeys.lists(),
    refetchType: 'all',
  })
  
  // Eagerly refetch the lists right away
  queryClient.fetchQuery({
    queryKey: priceListsQueryKeys.lists(),
    staleTime: 0,
  })
  
  // Also invalidate products since they might show price list data
  queryClient.invalidateQueries({
    queryKey: productsQueryKeys.lists(),
    refetchType: 'all',
  })
  
  // After a short delay, force refetch again to ensure data consistency
  setTimeout(() => {
    // For the dashboard specifically, force refresh all queries
    queryClient.invalidateQueries({
      refetchType: 'all',
    })
  }, 800)
}

/**
 * Hook to fetch a single price list by ID
 */
export const usePriceList = (
  id: string,
  query?: Record<string, string | number>,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminPriceListResponse,
      FetchError,
      any,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: async () => {
      try {
        if (!id) {
          return { price_list: createDefaultPriceList(id) }
        }

        // Convert query params to proper format
        const queryParams: Record<string, string | number> = {}
        if (query) {
          Object.entries(query).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              queryParams[key] = String(value);
            }
          })
        }

        const result = await fetchQuery(`/vendor/price-lists/${id}`, {
          method: "GET",
          query: queryParams,
        })
        
        return normalizePriceListResponse(result, id)
      } catch (error) {
        console.error("Error fetching price list:", error)
        return { price_list: createDefaultPriceList(id) }
      }
    },
    queryKey: priceListsQueryKeys.detail(id),
    staleTime: 15000, // 15 seconds (much shorter to ensure fresh data)
    ...options,
  })

  return { 
    price_list: data?.price_list || createDefaultPriceList(id), 
    ...rest 
  }
}

/**
 * Hook to fetch all price lists
 */
export const usePriceLists = (
  query?: HttpTypes.AdminPriceListListParams,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminPriceListListResponse,
      FetchError,
      HttpTypes.AdminPriceListListResponse,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: priceListsQueryKeys.lists(),
    queryFn: async () => {
      // Convert the typed params to a simple Record<string, string | number> that fetchQuery expects
      const queryParams: Record<string, string | number> = {};
      
      // Only add defined query parameters
      if (query) {
        Object.entries(query).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams[key] = String(value);
          }
        });
      }
      
      const data = await fetchQuery(`/vendor/price-lists`, { 
        method: "GET", 
        query: queryParams
      })
      return data
    },
    staleTime: 15000, // 15 seconds (much shorter to ensure fresh data)
    ...options,
  })

  return { ...data, ...rest }
}

/**
 * Hook to create a new price list
 */
export const useCreatePriceList = (
  options?: UseMutationOptions<
    HttpTypes.AdminPriceListResponse,
    FetchError,
    HttpTypes.AdminCreatePriceList
  >
) => {
  return useMutation<
    HttpTypes.AdminPriceListResponse,
    FetchError,
    HttpTypes.AdminCreatePriceList
  >({
    mutationFn: async (payload) => {
      /**
       * Define price object type
       */
      type PriceObject = {
        variant_id: string
        currency_code: string
        amount: number
        min_quantity?: number | null
        max_quantity?: number | null
        rules?: { region_id?: string }
      }

      const prices: PriceObject[] = payload.prices?.map(price => {
        const priceObj = {
          variant_id: price.variant_id,
          currency_code: price.currency_code,
          amount: price.amount,
          min_quantity: price.min_quantity,
          max_quantity: price.max_quantity,
          ...(price.rules && { rules: price.rules })
        };
        
        return priceObj;
      }) || []

      const result = await fetchQuery('/vendor/price-lists', {
        method: "POST",
        body: {
          ...payload,
          prices,
        }
      })
      
      return normalizePriceListResponse(result, result?.price_list?.id || 'temp-id')
    },
    onSuccess: (data, variables, context) => {
      toast.success("Price list created successfully")
      invalidatePriceListQueries()
      options?.onSuccess?.(data, variables, context)
    },
    onError: (error, variables, context) => {
      toast.error(`Failed to create price list: ${error.message}`)
      options?.onError?.(error, variables, context)
    },
    ...options,
  })
}

/**
 * Hook to update an existing price list
 */
export const useUpdatePriceList = (
  id: string,
  options?: UseMutationOptions<
    HttpTypes.AdminPriceListResponse,
    FetchError,
    HttpTypes.AdminUpdatePriceList
  >
) => {
  return useMutation<
    HttpTypes.AdminPriceListResponse,
    FetchError,
    HttpTypes.AdminUpdatePriceList
  >({
    mutationFn: async (payload) => {
      const result = await fetchQuery(`/vendor/price-lists/${id}`, {
        method: "POST",
        body: payload
      })
      return normalizePriceListResponse(result, id)
    },
    onSuccess: (data, variables, context) => {
      toast.success("Price list updated successfully")
      invalidatePriceListQueries(id)
      options?.onSuccess?.(data, variables, context)
    },
    onError: (error, variables, context) => {
      toast.error(`Failed to update price list: ${error.message}`)
      options?.onError?.(error, variables, context)
    },
    ...options,
  })
}

/**
 * Hook to delete a price list
 */
export const useDeletePriceList = (
  id: string,
  options?: UseMutationOptions<
    HttpTypes.AdminPriceListDeleteResponse,
    FetchError,
    void
  >
) => {
  const queryClient = useQueryClient()
  
  return useMutation<HttpTypes.AdminPriceListDeleteResponse, FetchError, void>({
    mutationFn: async () => {
      // Validate that we have a valid ID before making the request
      if (!id) {
        throw new Error('Price list ID is required for deletion')
      }
      

      
      // First, verify the price list exists
      try {
        const priceListData = await fetchQuery(`/vendor/price-lists/${id}`, {
          method: "GET",
        })
        
        if (!priceListData?.price_list) {
          console.warn(`Price list with ID ${id} not found, may already be deleted`)
        } else {
        }
      } catch (verifyError) {
        console.warn(`Could not verify price list ${id} before deletion:`, verifyError)
        // Continue with deletion attempt even if verification fails
      }
      
      // Attempt to delete the price list
      try {
        // Add a delay before deletion to ensure any pending operations are complete
        await new Promise(resolve => setTimeout(resolve, 300))
        
        try {
          const deleteResult = await fetchQuery(`/vendor/price-lists/${id}`, {
            method: "DELETE",
          })
          
          
          
          // If we get here, the deletion was successful
          // Immediately update the cache to reflect the deletion
          queryClient.setQueryData(
            priceListsQueryKeys.detail(id),
            null
          )
        } catch (deleteError: any) {
          // If we get a 500 error, the backend might have partially succeeded
          // Let's continue and check if the price list still exists
          console.warn(`Delete API call resulted in error:`, deleteError)
          
          // If it's not a 500 error and not a 404 (already deleted), rethrow
          if (deleteError?.status !== 500 && deleteError?.status !== 404) {
            throw deleteError
          }
          
          
        }
        
        // Verify deletion was successful by checking if the price list still exists
        try {
          const checkResult = await fetchQuery(`/vendor/price-lists/${id}`, {
            method: "GET",
          })
          
          if (checkResult?.price_list) {
            
          }
        } catch (checkError: any) {
          // If we get a 404, that's good - it means the price list is gone
          if (checkError?.status === 404) {
            
          } else {
            console.warn(`Error verifying deletion:`, checkError)
            // Continue anyway since we want to update the UI
          }
        }
        
        // Return the proper response format expected by Medusa API
        return {
          id,
          object: "price_list",
          deleted: true
        }
      } catch (error: any) {
        console.error(`Error deleting price list ${id}:`, error)
        
        // If the error is a 404, the price list doesn't exist, so we can consider it "deleted"
        if (error?.status === 404) {
          
          return {
            id,
            object: "price_list",
            deleted: true
          }
        }
        
        throw error
      }
    },
    onSuccess: (data, variables, context) => {
      
      
      // Force immediate invalidation of all price list related queries
      // Mark as deleted to prevent refetching and causing errors
      invalidatePriceListQueries(id, true)
      
      // No need to removeQueries again as that's now handled inside invalidatePriceListQueries
      
      // Update the lists cache to remove this price list
      queryClient.setQueriesData(
        { queryKey: priceListsQueryKeys.lists() },
        (oldData: any) => {
          if (!oldData) return oldData
          
          // Handle different response structures
          if (oldData.price_lists) {
            return {
              ...oldData,
              price_lists: oldData.price_lists.filter((pl: any) => pl.id !== id)
            }
          } else if (Array.isArray(oldData)) {
            return oldData.filter((pl: any) => pl.id !== id)
          }
          
          return oldData
        }
      )
      
      // Refresh all price list data to ensure consistency
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: priceListsQueryKeys.lists(),
          refetchType: 'all'
        })
      }, 500)
      
      toast.success("Price list deleted successfully")
      options?.onSuccess?.(data, variables, context)
    },
    onError: (error, variables, context) => {
      console.error(`Price list deletion error:`, error)
      
      // Even on error, update the UI to remove the price list
      // This improves user experience when backend has issues but the UI should be updated
      
      // Remove from cache anyway to improve user experience
      queryClient.removeQueries({ queryKey: priceListsQueryKeys.detail(id) })
      
      // Update lists to remove this price list from UI
      queryClient.setQueriesData(
        { queryKey: priceListsQueryKeys.lists() },
        (oldData: any) => {
          if (!oldData) return oldData
          
          if (oldData.price_lists) {
            return {
              ...oldData,
              price_lists: oldData.price_lists.filter((pl: any) => pl.id !== id)
            }
          } else if (Array.isArray(oldData)) {
            return oldData.filter((pl: any) => pl.id !== id)
          }
          
          return oldData
        }
      )
      
      // Show a warning toast instead of error for better UX
      toast.warning(`Price list removed from view. Backend reported: ${error.message}`)
      options?.onError?.(error, variables, context)
    },
    ...options,
  })
}

/**
 * Hook to delete a price from a price list
 */
export const useDeletePriceListPrice = (
  id: string,
  options?: UseMutationOptions<
    HttpTypes.AdminPriceListDeleteResponse,
    FetchError,
    { price_id: string }
  >
) => {
  return useMutation<
    HttpTypes.AdminPriceListDeleteResponse,
    FetchError,
    { price_id: string }
  >({
    mutationFn: async ({ price_id }) => {
      const result = await fetchQuery(`/vendor/price-lists/${id}/prices/${price_id}`, {
        method: "DELETE",
      })
      
      // Immediately invalidate queries to ensure UI freshness
      invalidatePriceListQueries(id)
      
      // Return the actual API response for data consistency
      return result || { price_list_id: id, price_id: price_id }
    },
    onSuccess: (data, variables, context) => {
      toast.success("Price deleted successfully")
      invalidatePriceListQueries(id)
      options?.onSuccess?.(data, variables, context)
    },
    onError: (error, variables, context) => {
      toast.error(`Failed to delete price: ${error.message}`)
      options?.onError?.(error, variables, context)
    },
    ...options,
  })
}

/**
 * Hook for batch updating prices in a price list
 */
export const useBatchPriceListPrices = (
  id: string,
  options?: UseMutationOptions<
    HttpTypes.AdminPriceListBatchResponse,
    FetchError,
    any
  >
) => {
  return useMutation<
    HttpTypes.AdminPriceListBatchResponse,
    FetchError,
    any
  >({
    mutationFn: async (payload) => {
      
      
      // Determine which format we're working with
      let requestData: { prices: any[] };
      
      if (payload?.prices && Array.isArray(payload.prices)) {
        // New format - already has prices array
        requestData = { prices: payload.prices };
      } else if (payload?.products) {
        // Old format with nested product structure
        const prices: any[] = [];
        
        // Process old format (products > variants > prices)
        Object.keys(payload.products).forEach(productId => {
          const product = payload.products[productId];
          if (!product?.variants) return;
          
          Object.keys(product.variants).forEach(variantOrProductId => {
            const variantData = product.variants[variantOrProductId];
            
            // Handle currency prices
            if (variantData.currency_prices) {
              Object.keys(variantData.currency_prices).forEach(currencyCode => {
                const price = variantData.currency_prices[currencyCode];
                if (price?.amount) {
                  prices.push({
                    variant_id: variantOrProductId, // Backend will handle prod_ IDs
                    amount: parseFloat(price.amount),
                    currency_code: currencyCode,
                    id: price.id // Include ID if it exists
                  });
                }
              });
            }
            
            // Handle region prices
            if (variantData.region_prices) {
              Object.keys(variantData.region_prices).forEach(regionId => {
                const price = variantData.region_prices[regionId];
                if (price?.amount) {
                  prices.push({
                    variant_id: variantOrProductId, // Backend will handle prod_ IDs
                    amount: parseFloat(price.amount),
                    region_id: regionId,
                    id: price.id // Include ID if it exists
                  });
                }
              });
            }
          });
        });
        
        requestData = { prices };
      } else {
        throw new Error('Invalid payload format. Expected prices array or products object');
      }
      
      // Guard against empty prices array
      if (!requestData.prices || requestData.prices.length === 0) {
        throw new Error('No valid prices to update');
      }
      
      try {
        // Make the API call
        const result = await fetchQuery(`/vendor/price-lists/${id}/prices/batch`, {
          method: "POST",
          body: requestData
        });
        
        // Invalidate queries to refresh data
        invalidatePriceListQueries(id);
        
        return result;
      } catch (error) {
        console.error('API error:', error);
        throw error;
      }
    },
    onSuccess: (data, variables, context) => {
      toast.success("Price list prices updated successfully")
      invalidatePriceListQueries(id)
      options?.onSuccess?.(data, variables, context)
    },
    onError: (error, variables, context) => {
      toast.error(`Failed to update prices: ${error.message}`)
      options?.onError?.(error, variables, context)
    },
    ...options,
  })
}

/**
 * Hook to link products to a price list using a batch operation
 */
export const usePriceListLinkProducts = (
  id: string,
  options?: UseMutationOptions<
    HttpTypes.AdminPriceListResponse,
    FetchError,
    { product_ids: string[], unlink?: boolean }
  >
) => {
  return useMutation<
    HttpTypes.AdminPriceListResponse,
    FetchError,
    { product_ids: string[], unlink?: boolean }
  >({
    mutationFn: async (payload: { product_ids: string[], unlink?: boolean }) => {
      if (!id) {
        throw new Error('Missing price list ID')
      }
      
      // Check if this is a deletion (unlinking) request
      if (payload.unlink) {
        if (!payload.product_ids?.length) {
          throw new Error('No product IDs specified for unlinking')
        }
        
        
        
        // Try removing products from price list
        try {
          // First approach: Try to use the dedicated unlink endpoint if available
          const result = await fetchQuery(`/vendor/price-lists/${id}/products/batch`, {
            method: "DELETE",
            body: { product_ids: payload.product_ids }
          });
          
          return normalizePriceListResponse(result, id);
        } catch (deleteError) {
          console.warn('Delete error using batch endpoint:', deleteError);
          
          // Second approach: If the first approach failed, try to delete all variant prices
          // for the products one by one
          try {
            // For each product, find all its variants and delete prices for each variant
            for (const productId of payload.product_ids) {
              try {
                // Fetch all prices for the price list
                const priceListData = await fetchQuery(`/vendor/price-lists/${id}`, {
                  method: 'GET'
                });
                
                if (!priceListData?.price_list?.prices) {
                  continue;
                }
                
                // Get all product variants
                const productData = await fetchQuery(`/vendor/products/${productId}`, {
                  method: 'GET',
                });
                
                const variantIds = productData?.product?.variants?.map((v: any) => v.id) || [];
                
                // Find price IDs that match this product's variants
                const pricesToDelete = priceListData.price_list.prices
                  .filter((p: any) => variantIds.includes(p.variant_id))
                  .map((p: any) => p.id);
                  
                // Delete each price one by one
                for (const priceId of pricesToDelete) {
                  await fetchQuery(`/vendor/price-lists/${id}/prices/${priceId}`, {
                    method: 'DELETE'
                  });
                }
              } catch (productError) {
                console.error(`Error deleting prices for product ${productId}:`, productError);
              }
            }
            
            // Return updated price list
            const updatedPriceList = await fetchQuery(`/vendor/price-lists/${id}`, {
              method: 'GET'
            });
            
            return normalizePriceListResponse(updatedPriceList, id);
          } catch (fallbackError) {
            console.error('Fallback deletion failed:', fallbackError);
            throw fallbackError;
          }
        }
      }
      
      // This is an add request
      if (!payload.product_ids?.length) {
        throw new Error('No product IDs specified for linking')
      }
      
      // Try using the dedicated endpoint for linking products to price list
      try {
        const result = await fetchQuery(`/vendor/price-lists/${id}/products/batch`, {
          method: "POST",
          body: { product_ids: payload.product_ids }
        })
        
        return normalizePriceListResponse(result, id)
      } catch (error) {
        // If the dedicated endpoint failed or doesn't exist,
        // we need to fetch all variants for each product and create prices
        
        // Step 1: Gather all variants from all products
        const allVariants = []
        
        for (const productId of payload.product_ids) {
          try {
            const productData = await fetchQuery(`/vendor/products/${productId}`, {
              method: 'GET',
              query: { expand: 'variants' }
            })
            
            if (productData?.product?.variants) {
              allVariants.push(...productData.product.variants)
            }
          } catch (productError) {
            // Continue with other products if one fails
            console.error(`Failed to fetch product ${productId}:`, productError)
          }
        }
        
        // Step 2: Create price entries for all variants at once
        if (allVariants.length === 0) {
          throw new Error('No valid variants found for the selected products')
        }
        
        // Use the default store currency or a fallback
        const defaultCurrency = 'PLN'
        
        // Create a batch of prices for all variants at once
        const prices = allVariants.map(variant => ({
          variant_id: variant.id,
          amount: 0, // Set default amount - user can update later
          currency_code: defaultCurrency
        }))
        
        await fetchQuery(`/vendor/price-lists/${id}/prices/batch`, {
          method: 'POST',
          body: { prices }
        })
        
        // Step 3: Return the updated price list
        const updated = await fetchQuery(`/vendor/price-lists/${id}`, {
          method: 'GET'
        })
        
        return normalizePriceListResponse(updated, id)
      }
    },
    onSuccess: (data, variables, context) => {
      const action = variables.unlink ? 'removed from' : 'linked to';
      toast.success(`Successfully ${action} ${variables.product_ids.length} products ${action} price list`)
      invalidatePriceListQueries(id)
      options?.onSuccess?.(data, variables, context)
    },
    onError: (error, variables, context) => {
      toast.error(`Failed to link products: ${error.message}`)
      options?.onError?.(error, variables, context)
    },
    ...options,
  })
}