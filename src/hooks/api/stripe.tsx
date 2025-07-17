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
      console.log('[Stripe][Frontend] GET /vendor/payout-account');
      try {
        const response = await fetchQuery('/vendor/payout-account', {
          method: 'GET',
        });
        console.log('[Stripe][Frontend] Response:', response);
        return response;
      } catch (error) {
        console.error('[Stripe][Frontend] Error:', error);
if (error && typeof error === 'object' && error.message && error.message.includes('supersecret')) {
  console.error('[Stripe][Frontend][DEBUG] Received supersecret error at useStripeAccount > queryFn (stripe.tsx)');
  console.error('[Stripe][Frontend][DEBUG] Error object:', error);
  if (error.stack) {
    console.error('[Stripe][Frontend][DEBUG] Stack trace:', error.stack);
  }
}

        throw error;
      }
    },
    queryKey: [STRIPE_QUERY_KEY, 'account'],
  });

  return { ...data, ...rest };
};

export const useCreateStripeAccount = (
  options?: UseMutationOptions<any, FetchError, any>
) => {
  return useMutation({
    mutationFn: async (payload) => {
      console.log('[Stripe][Frontend] POST /vendor/payout-account payload:', payload);
      try {
        const response = await fetchQuery('/vendor/payout-account', {
          method: 'POST',
          body: payload,
        });
        console.log('[Stripe][Frontend] Response:', response);
        return response;
      } catch (error) {
        console.error('[Stripe][Frontend] Error:', error);
if (error && typeof error === 'object' && error.message && error.message.includes('supersecret')) {
  console.error('[Stripe][Frontend][DEBUG] Received supersecret error at useStripeAccount > queryFn (stripe.tsx)');
  console.error('[Stripe][Frontend][DEBUG] Error object:', error);
  if (error.stack) {
    console.error('[Stripe][Frontend][DEBUG] Stack trace:', error.stack);
  }
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
    ...options,
  });
};

export const useCreateStripeOnboarding = (
  options?: UseMutationOptions<any, FetchError, any>
) => {
  return useMutation({
    mutationFn: async (payload) => {
      console.log('[Stripe][Frontend] POST /vendor/payout-account/onboarding payload:', payload);
      try {
        const response = await fetchQuery('/vendor/payout-account/onboarding', {
          method: 'POST',
          body: payload,
        });
        console.log('[Stripe][Frontend] Response:', response);
        return response;
      } catch (error) {
        console.error('[Stripe][Frontend] Error:', error);
if (error && typeof error === 'object' && error.message && error.message.includes('supersecret')) {
  console.error('[Stripe][Frontend][DEBUG] Received supersecret error at useStripeAccount > queryFn (stripe.tsx)');
  console.error('[Stripe][Frontend][DEBUG] Error object:', error);
  if (error.stack) {
    console.error('[Stripe][Frontend][DEBUG] Stack trace:', error.stack);
  }
}

        throw error;
      }
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: [STRIPE_QUERY_KEY, 'onboarding'],
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};
