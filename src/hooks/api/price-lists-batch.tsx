import { FetchError } from "@medusajs/js-sdk"
import {
  useMutation,
  UseMutationOptions,
  useQueryClient,
} from '@tanstack/react-query'
import { toast } from '@medusajs/ui'
import { fetchQuery } from "../../lib/client"
import { priceListsQueryKeys } from "./price-lists"
import { productsQueryKeys } from "./products"

/**
 * Hook for invalidating price list queries
 */
const useInvalidatePriceListQueries = () => {
  const queryClient = useQueryClient();
  
  return (id?: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`Invalidating price list queries ${id ? `for ID: ${id}` : '(all)'}`);
    }
    
    // Immediately force invalidation of all price list queries
    if (id) {
      queryClient.invalidateQueries({
        queryKey: priceListsQueryKeys.detail(id),
        refetchType: 'all',
      })
    }
    
    // Force refetch of all price lists
    queryClient.invalidateQueries({
      queryKey: priceListsQueryKeys.lists(),
      refetchType: 'all',
    })
  }
}

/**
 * Hook for batch creating/updating/deleting prices in a price list
 * This implementation properly handles both product IDs and variant IDs
 */
export const useBatchPriceListPrices = (
  id: string,
  options?: UseMutationOptions<
    any,
    FetchError,
    any
  >
) => {
  const invalidateQueries = useInvalidatePriceListQueries();
  
  return useMutation<
    any,
    FetchError,
    any
  >({
    mutationFn: async (payload) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('Starting batch price list update with payload:', JSON.stringify(payload, null, 2));
      }
      
      // Determine which format we're working with
      let requestData: { prices: any[] };

      if (payload?.prices && Array.isArray(payload.prices)) {
        // New format - already has prices array
        requestData = { prices: payload.prices.map((price: any) => {
          // Ensure amount is a number
          if (price.amount && typeof price.amount === 'string') {
            return { ...price, amount: parseFloat(price.amount) };
          }
          return price;
        })};

        if (process.env.NODE_ENV === 'development') {
          console.log(`Using direct prices array with ${payload.prices.length} prices`);
        }
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

        if (process.env.NODE_ENV === 'development') {
          console.log(`Converted to direct prices format with ${prices.length} prices`);
        }
      } else {
        throw new Error('Invalid payload format for price list update');
      }
      
      // Filter out any invalid prices
      requestData.prices = requestData.prices.filter(price => {
        // Must have variant_id and amount
        if (!price.variant_id || price.amount === undefined) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('Skipping invalid price:', price);
          }
          return false;
        }
        
        // Ensure currency_code or region_id is present
        if (!price.currency_code && !price.region_id) {
          // Add default currency if missing
          price.currency_code = 'PLN';
          if (process.env.NODE_ENV === 'development') {
            console.warn('Adding default currency_code to price:', price);
          }
        }
        
        return true;
      });
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Sending to API:', { totalPrices: requestData.prices.length, sample: requestData.prices.slice(0, 2) });
      }
      
      try {
        // Skip the batch endpoint due to known backend issue with priceListService resolution
        // Instead, update prices individually
        if (process.env.NODE_ENV === 'development') {
          console.log('Skipping batch endpoint due to known backend issue with priceListService resolution');
        }
        
        // Process each price individually
        const results: any[] = [];
        for (const priceItem of requestData.prices) {
          try {
            let result;
            if (priceItem.id) {
              // Update existing price
              result = await fetchQuery(`/vendor/price-lists/${id}/prices/${priceItem.id}`, {
                method: "POST",
                body: {
                  amount: priceItem.amount,
                  currency_code: priceItem.currency_code,
                  region_id: priceItem.region_id,
                  min_quantity: priceItem.min_quantity,
                  max_quantity: priceItem.max_quantity
                }
              });
            } else {
              // Create new price
              result = await fetchQuery(`/vendor/price-lists/${id}/prices`, {
                method: "POST",
                body: {
                  variant_id: priceItem.variant_id,
                  amount: priceItem.amount,
                  currency_code: priceItem.currency_code,
                  region_id: priceItem.region_id,
                  min_quantity: priceItem.min_quantity,
                  max_quantity: priceItem.max_quantity
                }
              });
            }
            results.push(result);
          } catch (priceError) {
            if (process.env.NODE_ENV === 'development') {
              console.error(`Failed to update price for variant ${priceItem.variant_id}:`, priceError);
            }
            // Continue with other prices
          }
        }
        
        // Get the updated price list
        const updatedPriceList = await fetchQuery(`/vendor/price-lists/${id}`, {
          method: "GET"
        });
        
        if (process.env.NODE_ENV === 'development') {
          console.log('Individual price updates completed');
        }
        invalidateQueries(id);
        return updatedPriceList;
      } catch (error) {
        console.error('All API attempts failed:', error);
        throw error;
      }
    },
    onSuccess: (data, variables, context) => {
      toast.success("Price list prices updated successfully");
      invalidateQueries(id);
      options?.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      toast.error(`Failed to update prices: ${error.message}`);
      options?.onError?.(error, variables, context);
    },
  });
};

/**
 * Hook for adding products to a price list and setting their initial prices
 */
export const usePriceListAddProducts = (
  id: string,
  options?: UseMutationOptions<
    any,
    FetchError,
    { product_ids: string[], initial_price?: number }
  >
) => {
  const invalidateQueries = useInvalidatePriceListQueries();
  const queryClient = useQueryClient();
  
  return useMutation<
    any,
    FetchError,
    { product_ids: string[], initial_price?: number }
  >({
    mutationFn: async ({ product_ids, initial_price = 0 }) => {
      if (!product_ids.length) {
        throw new Error('No product IDs provided');
      }
      
      try {
        // First try the dedicated endpoint for adding products to price list
        try {
          const result = await fetchQuery(`/vendor/price-lists/${id}/products/batch`, {
            method: "POST",
            body: { 
              product_ids,
              amount: initial_price
            }
          });
          
          return result;
        } catch (error: any) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Batch product endpoint failed:', error);
          }
          
          // Fallback: fetch all variants for each product and add them manually
          const allVariants: any[] = [];
          
          // Fetch variants for each product
          for (const productId of product_ids) {
            try {
              const productData = await fetchQuery(`/vendor/products/${productId}`, {
                method: 'GET',
                query: { expand: 'variants' }
              });
              
              if (productData?.product?.variants) {
                allVariants.push(...productData.product.variants);
              }
            } catch (productError) {
              if (process.env.NODE_ENV === 'development') {
                console.error(`Failed to fetch product ${productId}:`, productError);
              }
            }
          }
          
          if (allVariants.length === 0) {
            throw new Error('No variants found for the selected products');
          }
          
          // Use the default store currency
          const defaultCurrency = 'PLN';
          
          // Create prices for all variants
          const prices = allVariants.map(variant => ({
            variant_id: variant.id,
            amount: initial_price,
            currency_code: defaultCurrency
          }));
          
          // Add all prices in a batch
          await fetchQuery(`/vendor/price-lists/${id}/prices/batch`, {
            method: 'POST',
            body: { prices }
          });
          
          // Return the updated price list
          const updated = await fetchQuery(`/vendor/price-lists/${id}`, {
            method: 'GET'
          });
          
          return updated;
        }
      } catch (error: any) {
        console.error('Failed to add products to price list:', error);
        throw error as FetchError;
      }
    },
    onSuccess: (data, variables, context) => {
      toast.success(`Successfully added ${variables.product_ids.length} products to price list`);
      
      // Invalidate both price list and product queries
      invalidateQueries(id);
      
      // Also invalidate product queries since they might show price list data
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.lists(),
        refetchType: 'all',
      });
      
      options?.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      toast.error(`Failed to add products: ${error.message}`);
      options?.onError?.(error, variables, context);
    },
  });
};
