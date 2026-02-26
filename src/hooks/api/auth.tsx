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

/**
 * Hook for vendor registration that handles the "claim existing identity" flow.
 * 
 * When a customer tries to register as a vendor with the same email:
 * 1. First attempts normal registration with sdk.auth.register()
 * 2. If "Identity with email already exists" error occurs, attempts login instead
 * 3. If login succeeds (password matches), uses that token to create the vendor
 * 4. If login fails (wrong password), throws appropriate error
 * 
 * This allows customers to become vendors using the same email/password.
 */
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
    mutationFn: async (payload) => {
      // Prepare the registration payload with user metadata
      const registrationPayload = {
        ...payload,
        user_metadata: {
          tax_id: payload.tax_id,
          product_description: payload.product_description,
          portfolio_link: payload.portfolio_link,
        }
      };
      
      try {
        // Step 1: Try normal registration
        const token = await sdk.auth.register('seller', 'emailpass', registrationPayload);
        return token;
      } catch (error: any) {
        // Step 2: Check if error is "Identity with email already exists"
        const errorMessage = error?.message || error?.body?.message || '';
        const isExistingIdentityError = 
          errorMessage.toLowerCase().includes('identity with email already exists') ||
          errorMessage.toLowerCase().includes('identity already exists') ||
          (error?.status === 401 && errorMessage.toLowerCase().includes('identity'));
        
        if (isExistingIdentityError) {
         
          
          try {
            // Step 3: Try to login with seller actor type to claim the identity
            // This will succeed if the password matches the existing identity
            const loginResult = await sdk.auth.login('seller', 'emailpass', {
              email: payload.email,
              password: payload.password,
            });
            
            
            // Return the login token - SDK automatically stores it
            return typeof loginResult === 'string' ? loginResult : loginResult.location || '';
          } catch (loginError: any) {
            // Step 4: Login failed - password doesn't match existing identity
            const loginErrorMessage = loginError?.message || loginError?.body?.message || '';
            
            if (loginErrorMessage.toLowerCase().includes('invalid') || 
                loginErrorMessage.toLowerCase().includes('password') ||
                loginError?.status === 401) {
              // Password doesn't match - this email belongs to someone else
              throw new Error('An account with this email already exists. Please use a different email or contact support.');
            }
            
            // Re-throw other login errors
            throw loginError;
          }
        }
        
        // Re-throw non-identity errors
        throw error;
      }
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
      // Create the vendor/seller record using the token from registration or login
      await fetchQuery('/vendor/sellers', {
        method: 'POST',
        body: seller,
      });
    },
    ...options,
  });
};

/**
 * Invite flow auth helper.
 * Creates or reuses seller auth identity, but does NOT create a seller profile/request.
 * This is required for team-member invite acceptance, where seller creation fields
 * like product_description are not part of the flow.
 */
export const useSignUpInviteWithEmailPass = (
  options?: UseMutationOptions<
    string,
    FetchError,
    HttpTypes.AdminSignInWithEmailPassword & {
      confirmPassword?: string;
    }
  >
) => {
  return useMutation({
    mutationFn: async (payload) => {
      try {
        const token = await sdk.auth.register('seller', 'emailpass', payload);
        return token;
      } catch (error: any) {
        const errorMessage = error?.message || error?.body?.message || '';
        const isExistingIdentityError =
          errorMessage.toLowerCase().includes('identity with email already exists') ||
          errorMessage.toLowerCase().includes('identity already exists') ||
          (error?.status === 401 && errorMessage.toLowerCase().includes('identity'));

        if (isExistingIdentityError) {
          try {
            const loginResult = await sdk.auth.login('seller', 'emailpass', {
              email: payload.email,
              password: payload.password,
            });

            return typeof loginResult === 'string'
              ? loginResult
              : loginResult.location || '';
          } catch (loginError: any) {
            const loginErrorMessage =
              loginError?.message || loginError?.body?.message || '';

            if (
              loginErrorMessage.toLowerCase().includes('invalid') ||
              loginErrorMessage.toLowerCase().includes('password') ||
              loginError?.status === 401
            ) {
              throw new Error(
                'An account with this email already exists. Please use a different email or contact support.'
              );
            }

            throw loginError;
          }
        }

        throw error;
      }
    },
    onSuccess: async (data, variables, context) => {
      options?.onSuccess?.(data, variables, context);
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

export const useChangePassword = (
  options?: UseMutationOptions<
    { success: boolean; message: string },
    FetchError,
    { current_password: string; new_password: string }
  >
) => {
  return useMutation({
    mutationFn: async (payload) => {
      const bearer = window.localStorage.getItem('medusa_auth_token') || '';
      
      const response = await fetch('/vendor/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authorization': `Bearer ${bearer}`,
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to change password');
      }

      return response.json();
    },
    onSuccess: async (data, variables, context) => {
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};
