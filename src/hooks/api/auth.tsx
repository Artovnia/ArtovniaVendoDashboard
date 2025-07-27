import { FetchError } from '@medusajs/js-sdk';
import { HttpTypes } from '@medusajs/types';
import {
  UseMutationOptions,
  useMutation,
} from '@tanstack/react-query';
import { fetchQuery, sdk } from '../../lib/client';

export const useSignInWithEmailPass = (
  options?: UseMutationOptions<
    | string
    | {
        location: string;
      },
    FetchError,
    HttpTypes.AdminSignUpWithEmailPassword
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.auth.login('seller', 'emailpass', payload),
    onSuccess: async (data, variables, context) => {
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useSignUpWithEmailPass = (
  options?: UseMutationOptions<
    string,
    FetchError,
    HttpTypes.AdminSignInWithEmailPassword & {
      confirmPassword: string;
      name: string;
      tax_id?: string;
      product_description?: string;
      portfolio_link?: string;
    }
  >
) => {
  return useMutation({
    mutationFn: (payload) => {
      // Prepare the registration payload with user metadata
      const registrationPayload = {
        ...payload,
        user_metadata: {
          tax_id: payload.tax_id,
          product_description: payload.product_description,
          portfolio_link: payload.portfolio_link,
        }
      };
      return sdk.auth.register('seller', 'emailpass', registrationPayload);
    },
    onSuccess: async (_, variables) => {
      const seller = {
        name: variables.name,
        tax_id: variables.tax_id,
        product_description: variables.product_description,
        portfolio_link: variables.portfolio_link,
        member: {
          name: variables.name,
          email: variables.email,
        },
      };
      // Just call fetchQuery - our backward compatibility fix makes it work with both old and new code
      await fetchQuery('/vendor/sellers', {
        method: 'POST',
        body: seller,
      });
    },
    ...options,
  });
};

export const useResetPasswordForEmailPass = (
  options?: UseMutationOptions<
    void,
    FetchError,
    { email: string }
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.auth.resetPassword('seller', 'emailpass', {
        identifier: payload.email,
      }),
    onSuccess: async (data, variables, context) => {
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useLogout = (
  options?: UseMutationOptions<void, FetchError>
) => {
  return useMutation({
    mutationFn: () => sdk.auth.logout(),
    ...options,
  });
};

export const useUpdateProviderForEmailPass = (
  token: string,
  options?: UseMutationOptions<
    void,
    FetchError,
    { password: string }
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.auth.updateProvider(
        'seller',
        'emailpass',
        payload,
        token
      ),
    onSuccess: async (data, variables, context) => {
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};
