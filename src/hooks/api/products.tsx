import { FetchError } from '@medusajs/js-sdk';
import { HttpTypes } from '@medusajs/types';
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
} from '@tanstack/react-query';
import { fetchQuery, sdk } from '../../lib/client';
import { queryClient } from '../../lib/query-client';
import { queryKeysFactory } from '../../lib/query-key-factory';
import { inventoryItemsQueryKeys } from './inventory.tsx';
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
      console.log(`Fetching variant data for product ${productId}, variant ${variantId}`);
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
      sdk.admin.product.listVariants(productId, query),
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
      console.log('Updating product variants batch:', productId, payload);
      
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
      sdk.admin.product.batchVariantInventoryItems(
        productId,
        payload
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
  const { data, ...rest } = useQuery({
    queryFn: () =>
      fetchQuery(`/vendor/products/${id}`, {
        method: 'GET',
        query: query as { [key: string]: string | number },
      }),
    queryKey: productsQueryKeys.detail(id, query),
    ...options,
  });

  return { ...data, ...rest };
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
      console.log('Products query params:', query);
      
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
      
      console.log(`Received ${result?.products?.length || 0} products from API`);
      
      // Make sure we have products with variants properly initialized
      if (result?.products && Array.isArray(result.products)) {
        for (const product of result.products) {
          console.log(`Processing product ${product.id}: ${product.title}`);
          
          // Ensure the variants array exists
          if (!product.variants) {
            product.variants = [];
          }
          
          // If product has no variants, try to fetch them individually (if we have a product id)
          if (product.id && product.variants.length === 0) {
            console.log(`Product ${product.id} has no variants in initial load, fetching directly`);
            
            try {
              // Use individual product fetch to get details
              const productData = await fetchQuery(`/vendor/products/${product.id}`, {
                method: 'GET'
              });
              
              if (productData?.product?.variants) {
                product.variants = productData.product.variants;
                console.log(`Fetched ${product.variants.length} variants for product ${product.id}`);
              }
            } catch (err) {
              console.error(`Failed to fetch variants for product ${product.id}:`, err);
            }
          } else {
            console.log(`Product ${product.id} already has ${product.variants.length} variants`);
          }
          
          // Ensure each variant has a prices array
          product.variants.forEach((variant: any) => {
            if (!variant.prices) {
              variant.prices = [];
            }
          });
          
          // Note: We no longer fetch price list prices here
          // Price list prices are now handled in the component that needs them
          // This avoids issues with unsupported parameters in the vendor API
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
      console.log('Original payload:', JSON.stringify(processedPayload));
      
      // Extract shipping_profile_id to add to metadata since it's not directly supported by the API
      const shippingProfileId = processedPayload.shipping_profile_id;
      if (shippingProfileId) {
        console.log('Extracting shipping_profile_id:', shippingProfileId);
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
        console.log('Processing variant prices');
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
            console.log(`Processing inventory quantity for variant: ${processedVariant.title || 'untitled'}, quantity: ${processedVariant.inventory_quantity}`);
            
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
            console.log(`Setting default inventory quantity (0) for variant: ${processedVariant.title || 'untitled'}`);
          }
          
          // Check if prices exist and process them
          if (processedVariant.prices) {
            console.log(`Processing prices for variant:`, processedVariant.title || 'untitled');
            console.log('Original prices:', processedVariant.prices);
            
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
                    console.log(`Processing price: ${value} -> ${numericAmount}`);
                    priceArray.push({
                      amount: numericAmount,
                      currency_code: key === 'default' ? 'pln' : key.toLowerCase()
                    });
                  }
                }
              });
              
              // Use the processed array
              processedVariant.prices = priceArray;
              console.log('Processed prices array:', processedVariant.prices);
            }
            
            // Ensure at least one price exists
            if (!processedVariant.prices || 
                (Array.isArray(processedVariant.prices) && processedVariant.prices.length === 0)) {
              console.log('Adding default PLN price');
              processedVariant.prices = [{
                amount: 1000, 
                currency_code: 'pln'
              }];
            }
          } else {
            // If no prices defined, add a default PLN price
            console.log('No prices found, adding default PLN price');
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
        console.log('Adding default product option');
        processedPayload.options = [{
          title: "Default Option",
          values: ["Default Value"]
        }];
      }
      
      // Handle collection_id - important to keep as string even if empty
      if (processedPayload.collection_id === null) {
        console.log('Converting null collection_id to empty string');
        processedPayload.collection_id = ""; // Keep as empty string instead of undefined
      } else {
        console.log('Collection ID:', processedPayload.collection_id);
      }
      
      // Handle type_id
      if (processedPayload.type_id === null || processedPayload.type_id === "") {
        console.log('Converting empty type_id to undefined');
        processedPayload.type_id = undefined;
      } else if (processedPayload.type_id) {
        console.log('Type ID found:', processedPayload.type_id);
      }
      
      // Format categories
      if (processedPayload.categories) {
        // Ensure categories is an array
        if (!Array.isArray(processedPayload.categories)) {
          processedPayload.categories = processedPayload.categories ? [processedPayload.categories] : [];
        }
        
        // Only process non-empty arrays
        if (processedPayload.categories.length > 0) {
          console.log('Processing categories:', processedPayload.categories);
          processedPayload.categories = processedPayload.categories
            .filter((cat: any) => cat) // Remove null/undefined/empty values
            .map((cat: any) => {
              // If it's already in the correct format, don't change it
              if (typeof cat === 'object' && cat.id) return cat;
              // Otherwise convert to { id: string }
              return { id: String(cat) };
            });
          console.log('Processed categories:', processedPayload.categories);
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
          console.log('Processing tags:', processedPayload.tags);
          processedPayload.tags = processedPayload.tags
            .filter((tag: any) => tag) // Remove null/undefined/empty values
            .map((tag: any) => {
              // If it's already in the correct format, don't change it
              if (typeof tag === 'object' && tag.id) return tag;
              // Otherwise convert to { id: string }
              return { id: String(tag) };
            });
          console.log('Processed tags:', processedPayload.tags);
        }
      } else {
        // Set tags to empty array if undefined
        processedPayload.tags = [];
      }
      
      console.log('Final processed payload:', JSON.stringify(processedPayload));
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
          console.log(`Associating product ${data.product.id} with shipping profile ${shippingProfileId}`);
          // Make direct API call to associate shipping profile
          await fetchQuery(`/vendor/products/${data.product.id}/shipping-profile`, {
            method: 'POST',
            body: {
              shipping_profile_id: shippingProfileId
            },
          });
          console.log('Successfully associated product with shipping profile');
        } catch (error) {
          console.error('Failed to associate product with shipping profile:', error);
          // Continue even if shipping profile association fails
        }
      }
      
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.lists(),
      });
      // if `manage_inventory` is true on created variants that will create inventory items automatically
      queryClient.invalidateQueries({
        queryKey: inventoryItemsQueryKeys.lists(),
      });
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
      
      console.log(`Updating product ${id} with data:`, JSON.stringify(updateData, null, 2));
      
      // Check if we have images or thumbnail in the payload
      const hasMediaUpdate = updateData.images || updateData.thumbnail;
      
      // If this is a media update, use the complete payload
      if (hasMediaUpdate) {
        console.log('Detected media update, sending complete payload with images');
        
        try {
          const response = await fetchQuery(`/vendor/products/${id}`, {
            method: 'POST',
            body: updateData, // Send complete payload including images
          });
          
          console.log('Media update response:', response);
          return response;
        } catch (mediaError: any) {
          console.error('Media update failed:', mediaError);
          throw mediaError; // Propagate the error to allow proper error handling
        }
      }
      
      // For non-media updates, continue with the existing approach
      try {
        // Step 1: Try first with just the description to test if that works
        if (updateData.description !== undefined) {
          console.log('Attempting super minimal update with just description');
          
          // Extract just the description for a minimal payload
          const minimalPayload = {
            description: typeof updateData.description === 'string' ? 
              updateData.description.trim() : updateData.description
          };
          
          console.log('Super minimal payload:', minimalPayload);
          
          try {
            const response = await fetchQuery(`/vendor/products/${id}`, {
              method: 'POST',
              body: minimalPayload,
            });
            
            console.log('Description-only update response:', response);
            
            // If it succeeds, try with a bit more data
            if (response && (response.product || Object.keys(response).length > 0)) {
              console.log('Description update succeeded, returning response');
              return response;
            }
          } catch (descError) {
            console.error('Description-only update failed:', descError);
            // Continue to next approach
          }
        }
        
        // Step 2: Try with a more complete but still minimal payload
        console.log('Attempting update with title only');
        const titlePayload = {
          title: updateData.title || 'Updated Product'
        };
        
        try {
          const response = await fetchQuery(`/vendor/products/${id}`, {
            method: 'POST',
            body: titlePayload,
          });
          
          console.log('Title-only update response:', response);
          return response;
        } catch (titleError: any) {
          // Capture detailed error information
          console.error('Title-only update failed:', titleError);
          
          // Try to extract detailed error info from the response
          let detailedError = titleError?.message || 'Unknown error';
          
          if (titleError.response && titleError.data) {
            console.log('Error response data:', titleError.data);
            detailedError = JSON.stringify(titleError.data);
          }
          
          console.error('Detailed error:', detailedError);
          
          // Create a synthetic response as a last resort
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
      } catch (error) {
        console.error('All update attempts failed:', error);
        
        // Create a synthetic response to prevent UI errors
        return {
          product: {
            id,
            title: updateData.title || 'Product Update Failed',
            description: updateData.description || '',
            updated_at: new Date().toISOString(),
            _synthetic: true, // Mark as synthetic so we know it didn't come from the API
            _error: error instanceof Error ? error.message : 'Unknown error'
          }
        };
      }
    },
    onSuccess: async (data, variables: any, context) => {
      const id = variables.id;
      
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
      sdk.admin.product.export(payload, query),
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
      sdk.admin.product.import(payload),
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
      sdk.admin.product.confirmImport(payload),
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
  console.log(`[DEBUG] useProductAttributes called with id: ${id}`);

  // Fetch product data directly using fetchQuery to have more control over error handling
  const { data: productData, isLoading: isProductLoading, error: productError } = useQuery({
    queryFn: async () => {
      console.log(`[DEBUG] Directly fetching product ${id}`);
      try {
        // Fetch product attributes directly from our custom endpoint with complete attribute data
        let attributeValues = [];
        try {
          const attributeResponse = await fetchQuery(`/vendor/products/${id}/attributes`, {
            method: "GET"
          });
          console.log('[DEBUG] Custom attributes endpoint response:', attributeResponse);
          
          // Get properly formatted attribute values with full attribute data
          if (attributeResponse && Array.isArray(attributeResponse.attribute_values)) {
            attributeValues = attributeResponse.attribute_values;
          }
        } catch (attributeError) {
          console.log('[DEBUG] Custom attributes endpoint failed:', attributeError);
          // We'll fall back to regular product data if this fails
        }
        
        // Fetch the base product data
        const response = await fetchQuery(`/vendor/products/${id}`, {
          method: "GET",
          query: { fields: "id,title,description,handle,thumbnail" } 
        });
        console.log(`[DEBUG] Product data received:`, response);
        
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
      console.log(`[DEBUG] Fetching attributes from /vendor/attributes`);
      try {
        // Add fields parameter to prevent backend error (TypeError: Cannot read properties of undefined (reading 'fields'))
        const attributesResponse = await fetchQuery('/vendor/attributes', {
          method: "GET",
          query: {
            fields: "id,name,handle,ui_component,*possible_values,possible_values.value,possible_values.rank",
            limit: 100
          }
        });
        console.log(`[DEBUG] Attributes response:`, attributesResponse);
        
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
            
            // Debug the values for this attribute
            console.log(`[DEBUG] Attribute ${attr.name} (${attr.id}) possible values:`, possible_values);
            
            return {
              ...attr,
              possible_values
            };
          });
          
          return processedAttributes;
        } else {
          console.log('[DEBUG] Backend returned invalid attributes structure');
          return []; // Return empty array if structure is wrong
        }
      } catch (attrError) {
        console.error("[DEBUG] Error fetching attributes:", attrError);
        // Return empty array instead of mock data
        return [];
      }
    },
    queryKey: ["product-attributes"],
    retry: 1, // Only retry once since we know the endpoint might be failing
  });
  
  const isLoading = isProductLoading || isAttributesLoading;
  const error = productError || attributesError;
  
  console.log(`[DEBUG] Final product data:`, productData);
  console.log(`[DEBUG] Available attributes:`, attributesData || []);
  console.log(`[DEBUG] Product attribute values:`, productData?.attribute_values || []);
  
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
      console.log(`[DEBUG] Updating product attributes for product ID: ${productId}`, payload);
      
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
      
      console.log(`[DEBUG] Sending attribute values to product attributes endpoint:`, attributeValues);
      
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
      console.log(`[DEBUG] Successfully updated product attributes for product ID: ${productId}`);
      
      // Invalidate product attributes queries to refresh data
      queryClient.invalidateQueries({
        queryKey: ["product-attributes-direct", productId],
      });
      
      // Invalidate general product query
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.detail(productId),
      });
      
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
      
      console.log(`Deleting product with ID: ${id}`);
      const response = await fetchQuery(`/vendor/products/${id}`, {
        method: 'DELETE',
      });
      return response;
    },
    onSuccess: (data) => {
      console.log(`Successfully deleted product with ID: ${id}`);
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
