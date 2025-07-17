import {
  QueryKey,
  useQuery,
  UseQueryOptions,
  useMutation,
  UseMutationOptions,
} from '@tanstack/react-query';
import { sdk } from '../../lib/client';
import { queryKeysFactory } from '../../lib/query-key-factory';
import { FetchError } from '@medusajs/js-sdk';
import { fetchQuery } from '../../lib/client/client';

const PRODUCT_VARIANT_QUERY_KEY =
  'product_variant' as const;
export const productVariantQueryKeys = queryKeysFactory(
  PRODUCT_VARIANT_QUERY_KEY
);

export const useVariants = (
  query?: Record<string, any>,
  options?: Omit<
    UseQueryOptions<any, FetchError, any, QueryKey>,
    'queryFn' | 'queryKey'
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.admin.productVariant.list(query),
    queryKey: productVariantQueryKeys.list(query),
    ...options,
  });

  return { ...data, ...rest };
};

/**
 * Custom hook to fetch a product variant using the vendor API endpoint
 * This avoids CORS issues when accessing admin endpoints from the vendor panel
 */
export const useVendorProductVariant = (
  productId: string,
  variantId: string,
  options?: Omit<
    UseQueryOptions<any, FetchError, any, QueryKey>,
    'queryFn' | 'queryKey'
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: async () => {
      try {
        const result = await fetchQuery(`/vendor/products/${productId}/variants/${variantId}`, {
          method: 'GET',
        });
        return result;
      } catch (error) {
        console.error(`Error fetching variant ${variantId} for product ${productId}:`, error);
        throw error;
      }
    },
    queryKey: productVariantQueryKeys.detail(variantId),
    ...options,
  });

  return { variant: data?.variant, ...rest };
};

/**
 * Custom hook to update a product variant using the vendor API endpoint
 */
export const useUpdateVendorProductVariant = (
  productId: string,
  variantId: string,
  options?: UseMutationOptions<any, FetchError, any>
) => {
  return useMutation({
    mutationFn: async (data: any) => {
      try {
        return await fetchQuery(`/vendor/products/${productId}/variants/${variantId}`, {
          method: 'POST',
          body: data,
        });
      } catch (error) {
        console.error(`Error updating variant ${variantId} for product ${productId}:`, error);
        throw error;
      }
    },
    ...options,
  });
};
