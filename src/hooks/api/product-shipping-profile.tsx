// product-shipping-profile.tsx - Hooks for managing product shipping profile associations
import {
  useMutation,
  UseMutationOptions,
} from '@tanstack/react-query';

import { FetchError } from '@medusajs/js-sdk';
import { fetchQuery } from '../../lib/client';
import { queryClient } from '../../lib/query-client';
import { productsQueryKeys } from './products';

// We now have dedicated endpoints for associating products with shipping profiles
// that handle both the metadata and the database relationship

/**
 * Hook to directly associate a product with a shipping profile
 * This is needed because storing shipping_profile_id in metadata doesn't create the database association
 */
export const useAssociateProductWithShippingProfile = (
  options?: UseMutationOptions<
    any,
    FetchError,
    { productId: string; shippingProfileId: string }
  >
) => {
  return useMutation({
    mutationFn: async ({ productId, shippingProfileId }) => {
      console.log(`Associating product ${productId} with shipping profile ${shippingProfileId}`);
      
      try {
        // Use the dedicated endpoint to create the association
        const result = await fetchQuery(`/vendor/products/${productId}/shipping-profile`, {
          method: 'POST',
          body: {
            shipping_profile_id: shippingProfileId
          },
        });
        
        console.log(`Successfully associated product ${productId} with shipping profile ${shippingProfileId}`);
        return result;
      } catch (error) {
        console.error('Error associating product with shipping profile:', error);
        throw error;
      }
    },
    onSuccess: (data, variables, context) => {
      // Invalidate product queries to reflect the updated shipping profile
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.detail(variables.productId),
      });
      
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

/**
 * Hook to remove a product's association with a shipping profile
 */
export const useRemoveProductShippingProfile = (
  options?: UseMutationOptions<
    any,
    FetchError,
    { productId: string }
  >
) => {
  return useMutation({
    mutationFn: async ({ productId }) => {
      console.log(`Removing shipping profile from product ${productId}`);
      
      try {
        // Use the dedicated endpoint to remove the association
        const result = await fetchQuery(`/vendor/products/${productId}/shipping-profile`, {
          method: 'DELETE'
        });
        
        console.log(`Successfully removed shipping profile from product ${productId}`);
        return result;
      } catch (error) {
        console.error('Error removing shipping profile from product:', error);
        throw error;
      }
    },
    onSuccess: (data, variables, context) => {
      // Invalidate product queries to reflect the updated shipping profile
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.detail(variables.productId),
      });
      
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};
