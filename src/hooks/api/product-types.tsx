import { FetchError } from '@medusajs/js-sdk';
import { HttpTypes } from '@medusajs/types';
import {
  QueryKey,
  UseMutationOptions,
  UseQueryOptions,
  useMutation,
  useQuery,
} from '@tanstack/react-query';
import { fetchQuery, sdk } from '../../lib/client';
import { queryClient } from '../../lib/query-client';
import { queryKeysFactory } from '../../lib/query-key-factory';

const PRODUCT_TYPES_QUERY_KEY = 'product_types' as const;
export const productTypesQueryKeys = queryKeysFactory(
  PRODUCT_TYPES_QUERY_KEY
);

export const useProductType = (
  id: string,
  query?: HttpTypes.AdminProductTypeParams,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminProductTypeResponse,
      FetchError,
      HttpTypes.AdminProductTypeResponse,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      sdk.admin.productType.retrieve(id, query),
    queryKey: productTypesQueryKeys.detail(id),
    ...options,
  });

  return { ...data, ...rest };
};

export const useProductTypes = (
  query?: HttpTypes.AdminProductTypeListParams,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminProductTypeListResponse,
      FetchError,
      HttpTypes.AdminProductTypeListResponse,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      fetchQuery('/vendor/product-types', {
        method: 'GET',
        query: query as { [key: string]: string | number },
      }),
    queryKey: productTypesQueryKeys.list(query),
    ...options,
  });

  return { ...data, ...rest };
};

// Define a custom response type for product type requests
type VendorProductTypeRequestResponse = {
  request: {
    id: string;
    type: string;
    data: { value: string };
    status: string;
    created_at: Date;
  };
};

export const useCreateProductType = (
  options?: UseMutationOptions<
    VendorProductTypeRequestResponse,
    FetchError,
    HttpTypes.AdminCreateProductType
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      fetchQuery('/vendor/product-types', {
        method: 'POST',
        body: payload,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: productTypesQueryKeys.lists(),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useUpdateProductType = (
  id: string,
  options?: UseMutationOptions<
    HttpTypes.AdminProductTypeResponse,
    FetchError,
    HttpTypes.AdminUpdateProductType
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.productType.update(id, payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: productTypesQueryKeys.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: productTypesQueryKeys.lists(),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useDeleteProductType = (
  id: string,
  options?: UseMutationOptions<
    HttpTypes.AdminProductTypeDeleteResponse,
    FetchError,
    void
  >
) => {
  return useMutation({
    mutationFn: () => sdk.admin.productType.delete(id),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: productTypesQueryKeys.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: productTypesQueryKeys.lists(),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};
