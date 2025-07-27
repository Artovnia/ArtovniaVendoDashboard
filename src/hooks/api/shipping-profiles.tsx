// shipping-profiles.tsx - Frontend Hooks
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
} from '@tanstack/react-query';

import { FetchError } from '@medusajs/js-sdk';
import { HttpTypes } from '@medusajs/types';
import { fetchQuery } from '../../lib/client';
import { queryClient } from '../../lib/query-client';
import { queryKeysFactory } from '../../lib/query-key-factory';

const SHIPPING_PROFILE_QUERY_KEY = 'shipping_profile' as const;
export const shippingProfileQueryKeys = queryKeysFactory(SHIPPING_PROFILE_QUERY_KEY);

// Create shipping profile for vendor
export const useCreateShippingProfile = (
  options?: UseMutationOptions<
    HttpTypes.AdminShippingProfileResponse,
    FetchError,
    HttpTypes.AdminCreateShippingProfile
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      fetchQuery('/vendor/shipping-profiles', {
        method: 'POST',
        body: payload,
      }),
    onSuccess: (data, variables, context) => {
      // Make sure data and shipping_profile exist before proceeding
      if (data && data.shipping_profile) {
        queryClient.invalidateQueries({
          queryKey: shippingProfileQueryKeys.lists(),
        });
        options?.onSuccess?.(data, variables, context);
      } else {
        // This shouldn't happen with our improved backend, but just in case
        console.error('Received success response but missing shipping_profile data', data);
        // Just log the error and still call onSuccess to avoid disrupting the UI flow
        // The backend should always return shipping_profile: null for errors
        options?.onSuccess?.(data || { shipping_profile: null }, variables, context);
      }
    },
    onError: (error, variables, context) => {
      console.error('Error creating shipping profile:', error);
      options?.onError?.(error, variables, context);
    },
    ...options,
  });
};

// Get a single shipping profile
export const useShippingProfile = (
  id: string,
  query?: Record<string, any>,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminShippingProfileResponse,
      FetchError,
      HttpTypes.AdminShippingProfileResponse,
      QueryKey
    >,
    'queryFn' | 'queryKey'
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: async () => {
      const response = await fetchQuery(`/vendor/shipping-profiles/${id}`, {
        method: 'GET',
        query: query as { [key: string]: string | number },
      });
      console.log('API response in hook:', response);
      return response;
    },
    queryKey: shippingProfileQueryKeys.detail(id, query),
    ...options,
  });

  return { 
    shipping_profile: data?.shipping_profile,
    ...rest 
  };
};

// Get all shipping profiles
export const useShippingProfiles = (
  query?: HttpTypes.AdminShippingProfileListParams,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminShippingProfileListResponse,
      FetchError,
      HttpTypes.AdminShippingProfileListResponse,
      QueryKey
    >,
    'queryFn' | 'queryKey'
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      fetchQuery('/vendor/shipping-profiles', {
        method: 'GET',
        query: query as { [key: string]: string | number },
      }),
    queryKey: shippingProfileQueryKeys.list(query),
    ...options,
  });

  return { 
    shipping_profiles: data?.shipping_profiles,
    count: data?.count,
    ...rest 
  };
};

// Update a shipping profile
export const useUpdateShippingProfile = (
  id: string,
  options?: UseMutationOptions<
    HttpTypes.AdminShippingProfileResponse,
    FetchError,
    HttpTypes.AdminUpdateShippingProfile
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      fetchQuery(`/vendor/shipping-profiles/${id}`, {
        method: 'POST',
        body: payload,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: shippingProfileQueryKeys.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: shippingProfileQueryKeys.lists(),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

// Delete a shipping profile
export const useDeleteShippingProfile = (
  id: string,
  options?: UseMutationOptions<
    HttpTypes.AdminShippingProfileDeleteResponse,
    FetchError,
    void
  >
) => {
  return useMutation({
    mutationFn: () => 
      fetchQuery(`/vendor/shipping-profiles/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: shippingProfileQueryKeys.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: shippingProfileQueryKeys.lists(),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};
