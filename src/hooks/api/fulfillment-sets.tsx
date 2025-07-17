import { FetchError } from '@medusajs/js-sdk';
import { HttpTypes } from '@medusajs/types';
import {
  QueryKey,
  UseMutationOptions,
  UseQueryOptions,
  useMutation,
  useQuery,
} from '@tanstack/react-query';
import { fetchQuery } from '../../lib/client';
import { queryClient } from '../../lib/query-client';
import { queryKeysFactory } from '../../lib/query-key-factory';
import { shippingOptionsQueryKeys } from './shipping-options';
import { stockLocationsQueryKeys } from './stock-locations';

const FULFILLMENT_SETS_QUERY_KEY =
  'fulfillment_sets' as const;
export const fulfillmentSetsQueryKeys = queryKeysFactory(
  FULFILLMENT_SETS_QUERY_KEY
);

export const useDeleteFulfillmentSet = (
  id: string,
  options?: Omit<
    UseMutationOptions<
      HttpTypes.AdminFulfillmentSetDeleteResponse,
      FetchError,
      void
    >,
    'mutationFn'
  >
) => {
  return useMutation({
    mutationFn: () =>
      fetchQuery(`/vendor/fulfillment-sets/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries({
        queryKey: fulfillmentSetsQueryKeys.detail(id),
      });
      await queryClient.invalidateQueries({
        queryKey: fulfillmentSetsQueryKeys.lists(),
      });

      // We need to invalidate all related entities. We invalidate using `all` keys to ensure that all relevant entities are invalidated.
      await queryClient.invalidateQueries({
        queryKey: stockLocationsQueryKeys.all,
      });
      await queryClient.invalidateQueries({
        queryKey: shippingOptionsQueryKeys.all,
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useFulfillmentSetServiceZone = (
  fulfillmentSetId: string,
  serviceZoneId: string,
  query?: HttpTypes.SelectParams,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminServiceZoneResponse,
      FetchError,
      HttpTypes.AdminServiceZoneResponse,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: async () => {
      // Validate IDs to ensure they have the correct prefixes
      if (!fulfillmentSetId.startsWith('fuset_')) {
        console.warn('Warning: fulfillmentSetId does not start with fuset_ prefix');
      }
      if (!serviceZoneId.startsWith('serzo_')) {
        console.warn('Warning: serviceZoneId does not start with serzo_ prefix');
      }
      
      console.log(`Fetching service zone with ID: ${serviceZoneId} for fulfillment set: ${fulfillmentSetId}`);
      
      // Use fetchQuery with the vendor endpoint instead of the admin SDK
      return fetchQuery(
        `/vendor/fulfillment-sets/${fulfillmentSetId}/service-zones/${serviceZoneId}`,
        { 
          method: 'GET',
          query: query as { [key: string]: string | number }
        }
      );
    },
    queryKey: fulfillmentSetsQueryKeys.detail(
      `${fulfillmentSetId}_${serviceZoneId}`,
      query
    ),
    ...options,
  });

  return { ...data, ...rest };
};

export const useCreateFulfillmentSetServiceZone = (
  fulfillmentSetId: string,
  options?: Omit<
    UseMutationOptions<
      HttpTypes.AdminFulfillmentSetResponse,
      FetchError,
      HttpTypes.AdminCreateFulfillmentSetServiceZone,
      QueryKey
    >,
    'mutationFn'
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      fetchQuery(
        `/vendor/fulfillment-sets/${fulfillmentSetId}/service-zones`,
        { method: 'POST', body: payload }
      ),
    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries({
        queryKey: fulfillmentSetsQueryKeys.lists(),
      });
      await queryClient.invalidateQueries({
        queryKey: stockLocationsQueryKeys.all,
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useUpdateFulfillmentSetServiceZone = (
  fulfillmentSetId: string,
  serviceZoneId: string,
  options?: Omit<
    UseMutationOptions<
      HttpTypes.AdminFulfillmentSetResponse,
      FetchError,
      HttpTypes.AdminUpdateFulfillmentSetServiceZone,
      QueryKey
    >,
    'mutationFn'
  >
) => {
  return useMutation({
    mutationFn: (payload) => {
      // Validate IDs to ensure they have the correct prefixes
      if (!fulfillmentSetId.startsWith('fuset_')) {
        console.warn('Warning: fulfillmentSetId does not start with fuset_ prefix');
      }
      if (!serviceZoneId.startsWith('serzo_')) {
        console.warn('Warning: serviceZoneId does not start with serzo_ prefix');
      }
      
      console.log(`Updating service zone with ID: ${serviceZoneId} for fulfillment set: ${fulfillmentSetId}`);
      
      // Use fetchQuery with the vendor endpoint
      return fetchQuery(
        `/vendor/fulfillment-sets/${fulfillmentSetId}/service-zones/${serviceZoneId}`,
        { method: 'POST', body: payload }
      );
    },
    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries({
        queryKey: fulfillmentSetsQueryKeys.lists(),
      });
      await queryClient.invalidateQueries({
        queryKey: stockLocationsQueryKeys.all,
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useDeleteFulfillmentServiceZone = (
  fulfillmentSetId: string,
  serviceZoneId: string,
  options?: Omit<
    UseMutationOptions<
      HttpTypes.AdminServiceZoneDeleteResponse,
      FetchError,
      void
    >,
    'mutationFn'
  >
) => {
  return useMutation({
    mutationFn: () => {
      // Validate IDs to ensure they have the correct prefixes
      if (!fulfillmentSetId.startsWith('fuset_')) {
        console.warn('Warning: fulfillmentSetId does not start with fuset_ prefix');
      }
      if (!serviceZoneId.startsWith('serzo_')) {
        console.warn('Warning: serviceZoneId does not start with serzo_ prefix');
      }
      
      console.log(`Deleting service zone with ID: ${serviceZoneId} for fulfillment set: ${fulfillmentSetId}`);
      
      // Use fetchQuery with the vendor endpoint instead of the admin SDK
      return fetchQuery(
        `/vendor/fulfillment-sets/${fulfillmentSetId}/service-zones/${serviceZoneId}`,
        { method: 'DELETE' }
      );
    },
    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries({
        queryKey: fulfillmentSetsQueryKeys.lists(),
      });
      await queryClient.invalidateQueries({
        queryKey: shippingOptionsQueryKeys.lists(),
      });
      await queryClient.invalidateQueries({
        queryKey: stockLocationsQueryKeys.all,
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};
