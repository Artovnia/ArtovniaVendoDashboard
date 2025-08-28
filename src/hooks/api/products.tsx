import { FetchError } from '@medusajs/js-sdk';
import { HttpTypes } from '@medusajs/types'
import { QueryKey, useMutation, useQuery, UseMutationOptions, UseQueryOptions } from '@tanstack/react-query'
import { useMemo } from 'react'

import { queryClient } from '../../lib/query-client'
import { queryKeysFactory } from '../../lib/query-key-factory'
import { fetchQuery } from '../../lib/client'
import { useAddColorOption } from './products/add-color-option';

const PRODUCTS_QUERY_KEY = 'products' as const;
export const productsQueryKeys = queryKeysFactory(
  PRODUCTS_QUERY_KEY
);

const VARIANTS_QUERY_KEY = 'product_variants' as const;
export const variantsQueryKeys = queryKeysFactory(
  VARIANTS_QUERY_KEY
);

const OPTIONS_QUERY_KEY = 'product_options' as const;
export const optionsQueryKeys = queryKeysFactory(
  OPTIONS_QUERY_KEY
);

export const useCreateProductOption = (
  productId: string,
  options?: UseMutationOptions<any, FetchError, any>
) => {
  return useMutation({
    mutationFn: (
      payload: HttpTypes.AdminCreateProductOption
    ) =>
      fetchQuery(`/vendor/products/${productId}/options`, {
        method: 'POST',
        body: payload,
      }),
    onSuccess: (
      data: any,
      variables: any,
      context: any
    ) => {
      queryClient.invalidateQueries({
        queryKey: optionsQueryKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.detail(productId),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useUpdateProductOption = (
  productId: string,
  optionId: string,
  options?: UseMutationOptions<any, FetchError, any>
) => {
  return useMutation({
    mutationFn: (
      payload: HttpTypes.AdminUpdateProductOption
    ) =>
      fetchQuery(
        `/vendor/products/${productId}/options/${optionId}`,
        { method: 'POST', body: payload }
      ),
    onSuccess: (
      data: any,
      variables: any,
      context: any
    ) => {
      queryClient.invalidateQueries({
        queryKey: optionsQueryKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: optionsQueryKeys.detail(optionId),
      });
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.detail(productId),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useDeleteProductOption = (
  productId: string,
  optionId: string,
  options?: UseMutationOptions<any, FetchError, void>
) => {
  return useMutation({
    mutationFn: () =>
      fetchQuery(
        `/vendor/products/${productId}/options/${optionId}`,
        { method: 'DELETE' }
      ),
    onSuccess: (
      data: any,
      variables: any,
      context: any
    ) => {
      queryClient.invalidateQueries({
        queryKey: optionsQueryKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: optionsQueryKeys.detail(optionId),
      });
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.detail(productId),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useProductVariant = (
  productId: string,
  variantId: string,
  query?: HttpTypes.AdminProductVariantParams,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminProductVariantResponse,
      FetchError,
      HttpTypes.AdminProductVariantResponse,
      QueryKey
    >,
    'queryFn' | 'queryKey'
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: async () => {
    
      // Use fetchQuery with vendor endpoint instead of sdk.admin
      return await fetchQuery(`/vendor/products/${productId}/variants/${variantId}`, {
        method: 'GET',
        query: query as Record<string, string>,
      });
    },
    queryKey: variantsQueryKeys.detail(variantId, query),
    ...options,
  });

  return { ...data, ...rest };
};

export const useProductVariants = (
  productId: string,
  query?: HttpTypes.AdminProductVariantParams,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminProductVariantListResponse,
      FetchError,
      HttpTypes.AdminProductVariantListResponse,
      QueryKey
    >,
    'queryFn' | 'queryKey'
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      fetchQuery(`/vendor/products/${productId}/variants`, {
        method: 'GET',
        query: query as Record<string, string>,
      }),
    queryKey: variantsQueryKeys.list({
      productId,
      ...query,
    }),
    ...options,
  });

  return { ...data, ...rest };
};

export const useCreateProductVariant = (
  productId: string,
  options?: UseMutationOptions<any, FetchError, any>
) => {
  return useMutation({
    mutationFn: (
      payload: HttpTypes.AdminCreateProductVariant
    ) =>
      fetchQuery(`/vendor/products/${productId}/variants`, {
        method: 'POST',
        body: payload,
      }),
    onSuccess: (
      data: any,
      variables: any,
      context: any
    ) => {
      queryClient.invalidateQueries({
        queryKey: variantsQueryKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.detail(productId),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useUpdateProductVariant = (
  productId: string,
  variantId: string,
  options?: UseMutationOptions<any, FetchError, any>
) => {
  return useMutation({
    mutationFn: (
      body: HttpTypes.AdminUpdateProductVariant
    ) =>
      fetchQuery(
        `/vendor/products/${productId}/variants/${variantId}`,
        { method: 'POST', body }
      ),
    onSuccess: (
      data: any,
      variables: any,
      context: any
    ) => {
      queryClient.invalidateQueries({
        queryKey: variantsQueryKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: variantsQueryKeys.detail(variantId),
      });
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.detail(productId),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useUpdateProductVariantsBatch = (
  productId: string,
  options?: UseMutationOptions<any, FetchError, any>
) => {
  return useMutation({
    mutationFn: (
      payload: { update: HttpTypes.AdminBatchProductVariantRequest['update'] }
    ) => {
      // The Medusa API expects the payload to be wrapped in an 'update' field
      
      return fetchQuery(`/vendor/products/${productId}/variants/batch`, {
        method: 'POST',
        body: payload, // Send the payload with the update field
      });
    },
    onSuccess: (
      data: any,
      variables: any,
      context: any
    ) => {
      queryClient.invalidateQueries({
        queryKey: variantsQueryKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: variantsQueryKeys.details(),
      });
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.detail(productId),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useProductVariantsInventoryItemsBatch = (
  productId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminBatchProductVariantInventoryItemResponse,
    FetchError,
    HttpTypes.AdminBatchProductVariantInventoryItemRequest
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      fetchQuery(`/vendor/products/${productId}/variants/inventory/batch`, {
        method: 'POST',
        body: payload,
      }),
    onSuccess: (
      data: any,
      variables: any,
      context: any
    ) => {
      queryClient.invalidateQueries({
        queryKey: variantsQueryKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: variantsQueryKeys.details(),
      });
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.detail(productId),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useDeleteVariant = (
  productId: string,
  variantId: string,
  options?: UseMutationOptions<any, FetchError, void>
) => {
  return useMutation({
    mutationFn: () =>
      fetchQuery(
        `/vendor/products/${productId}/variants/${variantId}`,
        { method: 'DELETE' }
      ),
    onSuccess: (
      data: any,
      variables: any,
      context: any
    ) => {
      queryClient.invalidateQueries({
        queryKey: variantsQueryKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: variantsQueryKeys.detail(variantId),
      });
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.detail(productId),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useDeleteVariantLazy = (
  productId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminProductVariantDeleteResponse,
    FetchError,
    { variantId: string }
  >
) => {
  return useMutation({
    mutationFn: ({ variantId }) =>
      fetchQuery(
        `/vendor/products/${productId}/variants/${variantId}`,
        { method: 'DELETE' }
      ),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: variantsQueryKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: variantsQueryKeys.detail(
          variables.variantId
        ),
      });
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.detail(productId),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useProduct = (
  id: string,
  query?: Record<string, any>,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminProductResponse,
      FetchError,
      HttpTypes.AdminProductResponse,
      QueryKey
    >,
    'queryFn' | 'queryKey'
  >
) => {
  // Create a stable query key by sorting and stringifying the query object
  const stableQueryKey = useMemo(() => {
    if (!query) return ['products', 'detail', id];
    
    // Sort the query object keys to ensure consistent cache keys
    const sortedQuery = Object.keys(query)
      .sort()
      .reduce((acc, key) => {
        acc[key] = query[key];
        return acc;
      }, {} as Record<string, any>);
    
    return ['products', 'detail', id, sortedQuery];
  }, [id, query]);

  const { data, ...rest } = useQuery({
    queryFn: async () => {
      const { fields } = query || {};
      
      const response = await fetchQuery(`/vendor/products/${id}`, {
        method: 'GET',
        query: { fields },
      });
      
      return response;
    },
    queryKey: stableQueryKey,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    ...options,
  });

  // CRITICAL FIX: The API returns { product: {...} } but we need to return the product data directly
  // The destructuring was losing the categories data
  return { ...rest, product: data?.product };
};

export const useProducts = (
  query?: HttpTypes.AdminProductListParams,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminProductListResponse,
      FetchError,
      HttpTypes.AdminProductListResponse,
      QueryKey
    >,
    'queryFn' | 'queryKey'
  >,
  filter?: Record<string, string>
) => {
  const { data, ...rest } = useQuery({
    queryFn: async () => {
      
      // Use only simple supported parameters
      const formattedQuery = { 
        ...query,
        fields: query?.fields || 'id,title,thumbnail,handle,variants'
      };
      
      // Format query params to ensure all values are strings
      const queryParams: Record<string, string> = {};
      Object.entries(formattedQuery).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams[key] = String(value);
        }
      });
      
      // We don't use price_list_id directly as it's not supported by the vendor API
      // Instead, we'll handle price list prices separately in the component
      
      // Execute the API call
      const result = await fetchQuery('/vendor/products', {
        method: 'GET',
        query: queryParams,
      });
      
      
      
      // Make sure we have products with variants properly initialized
      if (result?.products && Array.isArray(result.products)) {
        for (const product of result.products) {
          
          
          // Ensure the variants array exists
          if (!product.variants) {
            product.variants = [];
          }
          
          // If product has no variants, try to fetch them individually (if we have a product id)
          if (product.id && product.variants.length === 0) {
            
            
            try {
              // Use individual product fetch to get details
              const productData = await fetchQuery(`/vendor/products/${product.id}`, {
                method: 'GET'
              });
              
              if (productData?.product?.variants) {
                product.variants = productData.product.variants;
                
              }
            } catch (err) {
              console.error(`Failed to fetch variants for product ${product.id}:`, err);
            }
          } else {
            
          }
          
          // Ensure each variant has a prices array
          product.variants.forEach((variant: any) => {
            if (!variant.prices) {
              variant.prices = [];
            }
          });
          
          
        }
      }
      
      return result;
    },
    queryKey: productsQueryKeys.list(query),
    ...options,
  });

  // Handle regular filtering if needed
  if (!filter) {
    return { ...data, ...rest };
  }

  // Apply category and collection filters
  return {
    ...data,
    products: data?.products?.filter(
      (item) =>
        (item?.categories?.find(
          ({ id }) => id === filter.categoryId
        ) &&
          item) ||
        (item?.collection?.id === filter.collectionId &&
          item)
    ) || [],
    ...rest,
  };
};

export const useCreateProduct = (
  options?: UseMutationOptions<
    HttpTypes.AdminProductResponse,
    FetchError,
    any
  >
) => {
  return useMutation({
    mutationFn: (payload) => {
      // Ensure product has at least one option
      const processedPayload = { ...payload };
  
      // Extract shipping_profile_id to add to metadata since it's not directly supported by the API
      const shippingProfileId = processedPayload.shipping_profile_id;
      if (shippingProfileId) {
        
        // Store shipping_profile_id in metadata for later processing by a backend hook
        if (!processedPayload.metadata) {
          processedPayload.metadata = {};
        }
        processedPayload.metadata.shipping_profile_id = shippingProfileId;
        // Remove the shipping_profile_id from the root level as it's not recognized by the API
        delete processedPayload.shipping_profile_id;
      }
      
      // Process variant prices to ensure they're properly formatted
      if (processedPayload.variants && Array.isArray(processedPayload.variants)) {
        
        processedPayload.variants = processedPayload.variants.map((variant: any) => {
          // Make a copy of the variant to avoid modifying the original
          const processedVariant = { ...variant };
          
          // Handle inventory_quantity by moving it to manage_inventory field
          // since inventory_quantity isn't directly supported in the product creation API
          if (processedVariant.inventory_quantity !== undefined) {
            // Convert to number if it's a string
            if (typeof processedVariant.inventory_quantity === 'string') {
              processedVariant.inventory_quantity = parseInt(processedVariant.inventory_quantity, 10) || 0;
            }
            
            
            // Store inventory_quantity in metadata for backend processing
            if (!processedVariant.metadata) {
              processedVariant.metadata = {};
            }
            processedVariant.metadata.inventory_quantity = processedVariant.inventory_quantity;
            
            // Remove the inventory_quantity from the root level as it's not recognized by the API
            delete processedVariant.inventory_quantity;
          } else {
            // Set default inventory quantity to 0 if not provided
            if (!processedVariant.metadata) {
              processedVariant.metadata = {};
            }
            processedVariant.metadata.inventory_quantity = 0;
            
          }
          
          // Check if prices exist and process them
          if (processedVariant.prices) {
            
            
            // Convert prices to array format expected by the API
            if (Array.isArray(processedVariant.prices)) {
              // Already an array, ensure each price is correctly formatted
              processedVariant.prices = processedVariant.prices.map((price: any) => ({
                ...price,
                amount: typeof price.amount === 'string' ? parseInt(price.amount, 10) : price.amount,
                currency_code: price.currency_code?.toLowerCase()
              }));
            } else if (typeof processedVariant.prices === 'object') {
              // Convert from object format {currency: amount} to array format
              const priceArray: Array<{amount: number, currency_code: string}> = [];
              
              // Process each price entry
              Object.entries(processedVariant.prices).forEach(([key, value]: [string, any]) => {
                if (value) {
                  // Parse amount - don't multiply by 100 as the API expects the actual value
                  // The admin panel expects prices in their natural form
                  let numericAmount = typeof value === 'string' ? 
                    parseFloat(value) : // Don't convert to cents as the API expects actual value
                    (typeof value === 'number' ? value : 0);
                    
                  // Don't automatically convert to cents - the backend expects the actual value as entered
                  // Just ensure it's a valid number
                  numericAmount = parseFloat(numericAmount.toFixed(2));
                  
                  
                  if (!isNaN(numericAmount) && numericAmount > 0) {
                    
                    priceArray.push({
                      amount: numericAmount,
                      currency_code: key === 'default' ? 'pln' : key.toLowerCase()
                    });
                  }
                }
              });
              
              // Use the processed array
              processedVariant.prices = priceArray;
              
            }
            
            // Ensure at least one price exists
            if (!processedVariant.prices || 
                (Array.isArray(processedVariant.prices) && processedVariant.prices.length === 0)) {
              
              processedVariant.prices = [{
                amount: 1000, 
                currency_code: 'pln'
              }];
            }
          } else {
            // If no prices defined, add a default PLN price
            
            processedVariant.prices = [{
              amount: 1000, 
              currency_code: 'pln'
            }];
          }
          
          return processedVariant;
        });
      }
      
      // If options is missing or empty, add a default option
      if (!processedPayload.options || !processedPayload.options.length) {
        
        processedPayload.options = [{
          title: "Default Option",
          values: ["Default Value"]
        }];
      }
      
      // Handle collection_id - important to keep as string even if empty
      if (processedPayload.collection_id === null) {
        
        processedPayload.collection_id = ""; // Keep as empty string instead of undefined
      } else {
        
      }
      
      // Handle type_id
      if (processedPayload.type_id === null || processedPayload.type_id === "") {
        
        processedPayload.type_id = undefined;
      } else if (processedPayload.type_id) {
        
      }
      
      // Format categories
      if (processedPayload.categories) {
        // Ensure categories is an array
        if (!Array.isArray(processedPayload.categories)) {
          processedPayload.categories = processedPayload.categories ? [processedPayload.categories] : [];
        }
        
        // Only process non-empty arrays
        if (processedPayload.categories.length > 0) {
          
          processedPayload.categories = processedPayload.categories
            .filter((cat: any) => cat) // Remove null/undefined/empty values
            .map((cat: any) => {
              // If it's already in the correct format, don't change it
              if (typeof cat === 'object' && cat.id) return cat;
              // Otherwise convert to { id: string }
              return { id: String(cat) };
            });
          
        }
      } else {
        // Set categories to empty array if undefined
        processedPayload.categories = [];
      }
      
      // Format tags
      if (processedPayload.tags) {
        // Ensure tags is an array
        if (!Array.isArray(processedPayload.tags)) {
          processedPayload.tags = processedPayload.tags ? [processedPayload.tags] : [];
        }
        
        // Only process non-empty arrays
        if (processedPayload.tags.length > 0) {
          
          processedPayload.tags = processedPayload.tags
            .filter((tag: any) => tag) // Remove null/undefined/empty values
            .map((tag: any) => {
              // If it's already in the correct format, don't change it
              if (typeof tag === 'object' && tag.id) return tag;
              // Otherwise convert to { id: string }
              return { id: String(tag) };
            });
          
        }
      } else {
        // Set tags to empty array if undefined
        processedPayload.tags = [];
      }
      
      return fetchQuery('/vendor/products', {
        method: 'POST',
        body: processedPayload,
      });
    },
    onSuccess: async (data, variables, context) => {
      // Handle shipping profile association if provided
      const shippingProfileId = variables.shipping_profile_id;
      if (shippingProfileId && data.product?.id) {
        try {
          
          // Make direct API call to associate shipping profile
          await fetchQuery(`/vendor/products/${data.product.id}/shipping-profile`, {
            method: 'POST',
            body: {
              shipping_profile_id: shippingProfileId
            },
          });
     
        } catch (error) {
          console.error('Failed to associate product with shipping profile:', error);
          // Continue even if shipping profile association fails
        }
      }
      
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.lists(),
      });
      // if `manage_inventory` is true on created variants that will create inventory items automatically
      // Commented out to prevent excessive cache invalidation
      // queryClient.invalidateQueries({
      //   queryKey: inventoryItemsQueryKeys.lists(),
      // });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useUpdateProduct = (
  options?: UseMutationOptions<
    HttpTypes.AdminProductResponse,
    FetchError,
    any
  >
) => {
  return useMutation({
    mutationFn: async (payload: any) => {
      const { id, ...updateData } = payload;
      
      if (!id) {
        throw new Error("Product ID is required for update");
      }
      
      
      
      try {
        // Send the complete payload at once instead of splitting into multiple requests
        // This ensures all fields including title are updated in a single request
        
        
        // Clean up the payload to ensure it's properly formatted for vendor API
        const cleanPayload = { ...updateData };
        
        // IMPORTANT: Remove status field - vendor API doesn't accept it
        if ('status' in cleanPayload) {
          
          delete cleanPayload.status;
        }
        
        // Ensure title is properly formatted
        if (cleanPayload.title !== undefined) {
          cleanPayload.title = String(cleanPayload.title).trim();
        }
        
        // Format description if provided
        if (cleanPayload.description !== undefined) {
          cleanPayload.description = typeof cleanPayload.description === 'string' ?
            cleanPayload.description.trim() : cleanPayload.description;
        }
        
        
        
        // Make a single request with all fields
        const response = await fetchQuery(`/vendor/products/${id}`, {
          method: 'POST',
          body: cleanPayload,
        });
        
       
        return response;
      } catch (error: any) {
        console.error('Product update failed:', error);
        
        // Try to extract detailed error info
        let detailedError = error?.message || 'Unknown error';
        
        if (error.response && error.data) {
      
          detailedError = JSON.stringify(error.data);
        }
        
        console.error('Detailed error:', detailedError);
        
        // Create a synthetic response as a fallback to prevent UI errors
        return {
          product: {
            id,
            title: updateData.title || 'Product Update Failed',
            description: updateData.description || '',
            updated_at: new Date().toISOString(),
            _synthetic: true, // Mark as synthetic so we know it didn't come from the API
            _error: detailedError
          }
        };
      }
    },
    onSuccess: async (data, variables: any, context) => {
      const id = variables.id;
      
      // Invalidate both list and detail queries to ensure data is refreshed
      await queryClient.invalidateQueries({
        queryKey: productsQueryKeys.lists(),
      });
      await queryClient.invalidateQueries({
        queryKey: productsQueryKeys.detail(id),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

// Export products function
export const useExportProducts = (
  query?: HttpTypes.AdminProductListParams,
  options?: UseMutationOptions<
    HttpTypes.AdminExportProductResponse,
    FetchError,
    HttpTypes.AdminExportProductRequest
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      fetchQuery('/vendor/products/export', {
        method: 'POST',
        body: payload,
        query: query as Record<string, string>,
      }),
    onSuccess: (data, variables, context) => {
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useImportProducts = (
  options?: UseMutationOptions<
    HttpTypes.AdminImportProductResponse,
    FetchError,
    HttpTypes.AdminImportProductRequest
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      fetchQuery('/vendor/products/import', {
        method: 'POST',
        body: payload,
      }),
    onSuccess: (data, variables, context) => {
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useConfirmImportProducts = (
  options?: UseMutationOptions<{}, FetchError, string>
) => {
  return useMutation({
    mutationFn: (payload) =>
      fetchQuery(`/vendor/products/import/${payload}/confirm`, {
        method: 'POST',
      }),
    onSuccess: (data, variables, context) => {
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export { useAddColorOption };

/**
 * Hook for fetching product attributes
 * @param id - Product ID to fetch attributes for
 * @returns Query result containing product attributes
 */
export const useProductAttributes = (id: string) => {
  

  // Fetch product data directly using fetchQuery to have more control over error handling
  const { data: productData, isLoading: isProductLoading, error: productError } = useQuery({
    queryFn: async () => {
      
      try {
        // Fetch product attributes directly from our custom endpoint with complete attribute data
        let attributeValues = [];
        try {
          const attributeResponse = await fetchQuery(`/vendor/products/${id}/attributes`, {
            method: "GET"
          });
          
          
          // Get properly formatted attribute values with full attribute data
          if (attributeResponse && Array.isArray(attributeResponse.attribute_values)) {
            attributeValues = attributeResponse.attribute_values;
          }
        } catch (attributeError) {
          
          // We'll fall back to regular product data if this fails
        }
        
        // Fetch the base product data
        const response = await fetchQuery(`/vendor/products/${id}`, {
          method: "GET",
          query: { fields: "id,title,description,handle,thumbnail" } 
        });
        
        
        // Ensure we always have a consistent structure even if the backend is missing data
        return {
          ...response,
          // Use our enhanced attribute values from the dedicated endpoint if available
          // Otherwise fall back to any values that might be in the product response
          attribute_values: attributeValues.length > 0 ? attributeValues : (response?.attribute_values || [])
        };
      } catch (err) {
        console.error("[DEBUG] Product fetch error:", err);
        // Don't use mock data, just gracefully handle the error
        throw err; // Let React Query handle the error state
      }
    },
    queryKey: ["product-attributes-direct", id],
    retry: 2,
  });
  
  // Fetch available attributes, but handle backend errors gracefully
  const { data: attributesData, isLoading: isAttributesLoading, error: attributesError } = useQuery({
    queryFn: async () => {
      
      try {
        // Add fields parameter to prevent backend error (TypeError: Cannot read properties of undefined (reading 'fields'))
        const attributesResponse = await fetchQuery('/vendor/attributes', {
          method: "GET",
          query: {
            fields: "id,name,handle,ui_component,*possible_values,possible_values.value,possible_values.rank",
            limit: 100
          }
        });
        
        
        // Check if the response has the expected structure
        if (attributesResponse && Array.isArray(attributesResponse.attributes)) {
          // Process the attributes to ensure they have the expected structure
          const processedAttributes = attributesResponse.attributes.map((attr: { 
            id: string;
            name: string;
            handle: string;
            ui_component?: string;
            possible_values?: string[] | string;
            [key: string]: any;
          }) => {
            // Make sure possible_values is always an array
            let possible_values = attr.possible_values || [];
            
            // If possible_values is a string (comma-separated list), convert to array
            if (typeof possible_values === 'string') {
              possible_values = possible_values.split(',').map(val => val.trim());
            }
            
            // If possible_values is neither an array nor string, make it an empty array
            if (!Array.isArray(possible_values)) {
              possible_values = [];
            }
            
            
            
            return {
              ...attr,
              possible_values
            };
          });
          
          return processedAttributes;
        } else {
          
          return []; 
        }
      } catch (attrError) {
        
        
        return [];
      }
    },
    queryKey: ["product-attributes"],
    retry: 1, // Only retry once since we know the endpoint might be failing
  });
  
  const isLoading = isProductLoading || isAttributesLoading;
  const error = productError || attributesError;
  
  
  
  return { 
    // Return empty arrays instead of mock data if the backend calls fail
    attributes: attributesData || [], 
    attribute_values: productData?.attribute_values || [],
    product: productData,
    isLoading, 
    error
  };
};

/**
 * Hook for updating product attribute values
 * @param productId - Product ID to update attributes for
 * @param options - Optional mutation options
 * @returns Mutation for updating product attribute values
 */
export const useUpdateProductAttributes = (
  productId: string,
  options?: UseMutationOptions<any, FetchError, any>
) => {
  return useMutation({
    mutationFn: async (payload: { attribute_values: Array<{ attribute_id: string, value: string }> }) => {
      
      
      if (!productId) {
        console.error('Product ID is undefined in useUpdateProductAttributes');
        throw new Error('Cannot update attributes: Product ID is undefined');
      }

      // Format the values in the exact structure expected by the backend
      // Filter out any empty attribute values
      const attributeValues = payload.attribute_values.filter(av => av.value !== '').map(av => ({
        attribute_id: av.attribute_id,
        value: av.value
      }));
      
      
      
      // Send the attribute values to the dedicated attributes endpoint
      // We've now created a proper backend route for this in:
      // /vendor/products/{id}/attributes
      const response = await fetchQuery(`/vendor/products/${productId}/attributes`, {
        method: 'POST',
        body: {
          values: attributeValues
        }
      });
      
      return response;
    },
    onSuccess: (data, variables, context) => {
      
    
      // Only invalidate specific queries to prevent form data loss
      queryClient.invalidateQueries({
        queryKey: variantsQueryKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: variantsQueryKeys.details(),
      });
      // Don't invalidate product detail to prevent form data loss
      // queryClient.invalidateQueries({
      //   queryKey: productsQueryKeys.detail(productId),
      // });
      
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

/**
 * Hook for deleting a product
 * @param id - Product ID to delete
 * @param options - Optional mutation options
 * @returns Mutation for deleting a product
 */
export const useDeleteProduct = (
  id: string,
  options?: UseMutationOptions<
    any,
    FetchError,
    void
  >
) => {
  return useMutation({
    mutationFn: async () => {
      if (!id) {
        console.error('Product ID is undefined in useDeleteProduct');
        throw new Error('Cannot delete product: Product ID is undefined');
      }
      
      
      const response = await fetchQuery(`/vendor/products/${id}`, {
        method: 'DELETE',
      });
      return response;
    },
    onSuccess: (data) => {
      
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.lists(),
      });
      
      if (options?.onSuccess) {
        options.onSuccess(data, undefined, undefined);
      }
    },
    ...options,
  });
};
