import {
  useMutation,
  UseMutationOptions,
  useQuery,
} from '@tanstack/react-query';
import { fetchQuery } from '../../lib/client';
import { queryClient } from '../../lib/query-client';
import { FetchError } from '@medusajs/js-sdk';
import { queryKeysFactory } from '../../lib/query-key-factory';

const STRIPE_QUERY_KEY = 'stripe' as const;
export const stripeQueryKeys = queryKeysFactory(
  STRIPE_QUERY_KEY
);


export const useStripeAccount = () => {
  const { data, ...rest } = useQuery({
    queryFn: async () => {
      try {
        const response = await fetchQuery('/vendor/payout-account', {
          method: 'GET',
        });
        return response;
      } catch (error) {
        // Re-throw to let React Query handle the error state
        throw error;
      }
    },
    queryKey: [STRIPE_QUERY_KEY, 'account'],
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  return { ...data, ...rest };
};

export const useCreateStripeAccount = (
  options?: UseMutationOptions<any, FetchError, any>
) => {
  return useMutation({
    mutationFn: async (payload) => {
      try {
        const response = await fetchQuery('/vendor/payout-account', {
          method: 'POST',
          body: payload,
        });
        return response;
      } catch (error) {
        // Enhance error message for better user feedback
        if (error instanceof FetchError) {
          const enhancedError = new Error(
            error.message || 'Failed to create Stripe account. Please try again.'
          );
          enhancedError.name = 'StripeAccountCreationError';
          throw enhancedError;
        }
        throw error;
      }
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: [STRIPE_QUERY_KEY, 'account'],
      });

      options?.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      // Log error in non-production for debugging
      if (process.env.NODE_ENV !== 'production') {
        console.error('[Stripe] Account creation failed:', error);
      }
      options?.onError?.(error, variables, context);
    },
    ...options,
  });
};

export const useCreateStripeOnboarding = (
  options?: UseMutationOptions<any, FetchError, any>
) => {
  return useMutation({
    mutationFn: async (payload) => {
      try {
        const response = await fetchQuery('/vendor/payout-account/onboarding', {
          method: 'POST',
          body: payload,
        });
        
        // Validate response has onboarding URL
        const onboardingUrl = response?.payout_account?.onboarding?.data?.url || 
                             response?.onboarding?.data?.url;
        
        if (!onboardingUrl) {
          throw new Error('No onboarding URL received from server');
        }
        
        return response;
      } catch (error) {
        // Enhance error message for better user feedback
        if (error instanceof FetchError) {
          const enhancedError = new Error(
            error.message || 'Failed to initialize Stripe onboarding. Please try again.'
          );
          enhancedError.name = 'StripeOnboardingError';
          throw enhancedError;
        }
        throw error;
      }
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: [STRIPE_QUERY_KEY, 'account'],
      });
      queryClient.invalidateQueries({
        queryKey: [STRIPE_QUERY_KEY, 'onboarding'],
      });

      options?.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      // Log error in non-production for debugging
      if (process.env.NODE_ENV !== 'production') {
        console.error('[Stripe] Onboarding initialization failed:', error);
      }
      options?.onError?.(error, variables, context);
    },
    ...options,
  });
};

export const useCompleteVerification = (
  options?: UseMutationOptions<any, FetchError, any>
) => {
  return useMutation({
    mutationFn: async () => {
      try {
        const response = await fetchQuery('/vendor/payout-account/complete-verification', {
          method: 'POST',
        });
        return response;
      } catch (error) {
        // Enhance error message for better user feedback
        if (error instanceof FetchError) {
          const enhancedError = new Error(
            error.message || 'Failed to complete verification. Please try again.'
          );
          enhancedError.name = 'StripeVerificationError';
          throw enhancedError;
        }
        throw error;
      }
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: [STRIPE_QUERY_KEY, 'account'],
      });

      options?.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      // Log error in non-production for debugging
      if (process.env.NODE_ENV !== 'production') {
        console.error('[Stripe] Verification completion failed:', error);
      }
      options?.onError?.(error, variables, context);
    },
    ...options,
  });
};
