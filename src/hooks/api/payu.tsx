import { FetchError } from '@medusajs/js-sdk';
import { queryKeysFactory } from '../../lib/query-key-factory';
import { useMutation, useQuery, UseMutationOptions } from '@tanstack/react-query';
import { fetchQuery } from '../../lib/client';
import { queryClient } from '../../lib/query-client';
import { useState, useEffect, useCallback } from 'react';

const PAYU_QUERY_KEY = 'payu' as const;
export const payuQueryKeys = queryKeysFactory(PAYU_QUERY_KEY);

/**
 * PayU submerchant status types
 */
export type PayUSubmerchantStatus =
  | 'PENDING_VERIFICATION'
  | 'WAITING_FOR_DATA' // Added to match PayU's flow where bank data is submitted separately
  | 'BANK_DETAILS_SUBMITTED' // Status after bank details are submitted but before final verification
  | 'ACTIVE'
  | 'REJECTED'
  | 'BLOCKED';

/**
 * PayU legal form types according to PayU documentation
 */
export type PayULegalForm = 
  | 'SOLE_PROPRIETORSHIP'
  | 'CIVIL_LAW_PARTNERSHIP'
  | 'REGISTERED_PARTNERSHIP'
  | 'LIMITED_PARTNERSHIP'
  | 'PROFESSIONAL_PARTNERSHIP'
  | 'LIMITED_JOINT_STOCK_PARTNERSHIP'
  | 'LIMITED_LIABILITY_COMPANY'
  | 'JOINT_STOCK_COMPANY'
  | 'EUROPEAN_COMPANY';

/**
 * PayU submerchant registration data according to PayU API requirements
 */
export type PayUSubmerchantRegistrationData = {
  // Core business entity details
  legalName: string; // Was companyName previously
  dbaName?: string; // Doing business as name (optional)
  legalForm: PayULegalForm;
  taxId: string; // Format varies by country
  
  // Address information
  address: {
    street: string;
    postalCode: string;
    city: string;
    countryCode: string; // ISO 3166-1 alpha-2
  };
  
  // Contact information
  phone: string; // Direct property, not nested in contact
  email: string; // Direct property, not nested in contact
  websiteUrl?: string; // Added - optional, but useful for verification
  
  // Required by PayU for proper categorization
  mcc: string; // Merchant Category Code - required by PayU
  
  // Optional arrays for additional data
  representatives?: Array<{ name: string; role: string }>; // Legal representatives
  payTypeCategories?: string[]; // Payment type categories supported
};

/**
 * Bank account data to be submitted after initial registration
 */
export type PayUBankAccountData = {
  number: string; // IBAN format (for Poland: PL + 26 digits)
  country: string; // ISO 3166-1 alpha-2 (PL for Poland)
  accountHolderName: string; // Name of account holder
};

/**
 * AML verification request data structure
 */
export type PayUAmlVerificationRequest = {
  sellerId: string;
  documentType: string;
  documentNumber: string;
  additionalData?: Record<string, unknown>;
};

export const usePayuAccount = () => {
  const { data, isLoading, error, refetch, ...rest } = useQuery({
    queryFn: async () => {
      const response = await fetchQuery('/vendor/payout-account', {
        method: 'GET',
      });
      return response;
    },
    queryKey: [PAYU_QUERY_KEY, 'account'],
    // These options ensure fresh data after navigation
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0, // Consider data stale immediately
  });

  // Extract payout_account from the API response
  // Note: bank_account_data is now coming from the PayU account, not the payout account context
  const payoutAccount = data?.payout_account;
  
  return {
    data: payoutAccount,
    isLoading,
    error,
    refetch, // Expose refetch function
    ...rest
  };
};

export const useCreatePayuAccount = (
  options?: UseMutationOptions<any, FetchError, any>
) => {
  return useMutation({
    mutationFn: (payload) =>
      fetchQuery('/vendor/payout-account', {
        method: 'POST',
        body: payload,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: [PAYU_QUERY_KEY, 'account'],
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useCreatePayuOnboarding = (
  options?: UseMutationOptions<any, FetchError, any>
) => {
  return useMutation({
    mutationFn: (payload) =>
      fetchQuery('/vendor/payout-account/onboarding', {
        method: 'POST',
        body: payload,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: [PAYU_QUERY_KEY, 'onboarding'],
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

/**
 * Hook for creating a new submerchant registration with PayU
 * First step in the multi-step registration process
 */
export const useCreatePayuSubmerchant = (
  options?: UseMutationOptions<
    { extSubmerchantId: string; verificationId: string },
    FetchError,
    PayUSubmerchantRegistrationData
  >
) => {
  return useMutation({
    mutationFn: (payload: PayUSubmerchantRegistrationData) =>
      fetchQuery('/api/payout/submerchants/register', {
        method: 'POST',
        body: payload,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: payuQueryKeys.lists(),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

/**
 * Type for document upload tracking parameters
 */
export type TrackDocumentUploadParams = {
  extSubmerchantId: string;
  fileId: string;
  documentType: string;
};

/**
 * Hook for tracking document uploads for a submerchant
 */
export const useTrackPayuDocumentUpload = (
  options?: UseMutationOptions<
    any,
    FetchError,
    TrackDocumentUploadParams
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      fetchQuery('/api/payout/submerchants/document', {
        method: 'POST',
        body: payload,
      }),
    ...options,
  });
};



/**
 * Hook for submitting bank account data after initial registration
 * This is step 2 of the PayU registration process, which happens after
 * the submerchant status changes to WAITING_FOR_DATA
 */
export const useSubmitPayuBankAccount = (
  options?: UseMutationOptions<
    any,
    FetchError,
    { extSubmerchantId: string; verificationId: string; bankAccount: PayUBankAccountData }
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      fetchQuery(`/vendor/payout-account/bank-details`, {
        method: 'POST',
        body: {
          verificationId: payload.verificationId,
          extSubmerchantId: payload.extSubmerchantId,
          bankAccount: {
            number: payload.bankAccount.number,
            country: payload.bankAccount.country || 'PL', // Default to Poland if not specified
            accountHolderName: payload.bankAccount.accountHolderName,
          },
          // Include currency information - PLN for Polish accounts
          currency: 'PLN'
        },
      }),
    onSuccess: (data, variables, context) => {
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({
        queryKey: ['payu', 'submerchant-status', variables.extSubmerchantId],
      });
      queryClient.invalidateQueries({
        queryKey: [PAYU_QUERY_KEY, 'account'],
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

/**
 * Hook for initiating AML/KYC verification for a seller
 */
export const useInitiatePayuVerification = (
  options?: UseMutationOptions<
    any, 
    FetchError,
    PayUAmlVerificationRequest
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      fetchQuery('/api/payout/verification/initiate', {
        method: 'POST',
        body: payload,
      }),
    ...options,
  });
};

/**
 * Hook for checking AML/KYC verification status
 */
export const useCheckAmlVerificationStatus = (
  verificationId: string | undefined,
  options = {}
) => {
  return useQuery({
    queryKey: ['payu', 'verification-status', verificationId || 'undefined'],
    queryFn: async () => {
      if (!verificationId) {
        throw new Error('Verification ID is required');
      }
      const response = await fetchQuery(`/api/payout/verification/status/${verificationId}`, {
        method: 'GET',
      });
      return response;
    },
    enabled: !!verificationId,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    ...options,
  });
};

/**
 * Type for regulation acceptance tracking parameters
 */
export type TrackRegulationAcceptanceParams = {
  extSubmerchantId: string;
  acceptanceId: string;
};

/**
 * Hook for tracking regulations acceptance for a submerchant
 */
export const useTrackPayuRegulationAcceptance = (
  options?: UseMutationOptions<
    any,
    FetchError,
    TrackRegulationAcceptanceParams
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      fetchQuery('/api/payout/submerchants/accept-regulations', {
        method: 'POST',
        body: payload,
      }),
    ...options,
  });
};

/**
 * Response type for submerchant status API
 */
export type PayUStatusResponse = {
  data: {
    status: PayUSubmerchantStatus;
    rejectionReason?: string;
  };
};

/**
 * Hook for creating a simplified payout account with all required information in one call
 * This approach replaces the multi-step onboarding process with a direct creation flow
 */
export const useCreateSimplifiedPayuAccount = (
  options?: UseMutationOptions<
    any,
    FetchError,
    {
      legalName: string;
      taxId: string; // NIP number
      email: string;
      phone: string;
      address: {
        street: string;
        postalCode: string;
        city: string;
        countryCode: string; // Default 'PL'
      };
      bankAccount: {
        number: string; // IBAN format
        country: string; // Default 'PL'
        accountHolderName: string;
      };
      // These fields are removed from the payload to match backend validator
      // but kept optional in the type for backward compatibility
      currency?: string; // Default 'PLN'
      legalForm?: string; // Default 'SOLE_PROPRIETORSHIP'
    }
  >
) => {
  return useMutation({
    mutationFn: (payload) => {
      console.log('Creating payout account with payload:', payload);
      
      return fetchQuery(`/vendor/payout-account`, {
        method: 'POST',
        body: {
          // Transform the payload to match what the backend expects
          context: {
            company_name: payload.legalName,
            tax_id: payload.taxId,
            email: payload.email,
            phone: payload.phone,
            // Field name corrections to match backend validation
            address1: payload.address.street, // Changed from 'street' to 'address1'
            postal_code: payload.address.postalCode,
            city: payload.address.city,
            country: payload.address.countryCode, // Changed from 'country_code' to 'country'
            iban: payload.bankAccount.number, // Changed from 'bank_account' to 'iban'
            // Removed 'bank_account_country' as it's not expected by the validator
            account_holder_name: payload.bankAccount.accountHolderName
          }
        },
      });
    },
    onSuccess: (data, variables, context) => {
      console.log('Payout account created successfully:', data);
      queryClient.invalidateQueries({
        queryKey: [PAYU_QUERY_KEY, 'account'],
      });
      options?.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      console.error('Error creating payout account:', error);
      options?.onError?.(error, variables, context);
    },
    ...options,
  });
};

export const usePayuSubmerchantStatus = (
  extSubmerchantId: string | undefined,
  options = {}
) => {
  return useQuery({
    queryKey: ['payu', 'submerchant-status', extSubmerchantId || 'undefined'],
    queryFn: async () => {
      if (!extSubmerchantId) {
        throw new Error('Submerchant ID is required');
      }
      const response = await fetchQuery(`/api/payout/submerchants/status/${extSubmerchantId}`, {
        method: 'GET',
      });
      return response as PayUStatusResponse;
    },
    // Only run the query if an ID is provided
    enabled: !!extSubmerchantId,
    // Don't refetch in the background
    refetchIntervalInBackground: false,
    // Don't refetch when window regains focus
    refetchOnWindowFocus: false,
    ...options,
  });
};

/**
 * Custom hook to load PayU JavaScript SDK
 */
export const usePayuSdkLoader = () => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const script = document.createElement('script');
    
    // Use the appropriate URL based on environment
    const sdkUrl = process.env.NODE_ENV === 'production'
      ? 'https://secure.payu.com/javascript/sdk'
      : 'https://secure.snd.payu.com/javascript/sdk';
      
    script.src = sdkUrl;
    script.async = true;
    
    script.onload = () => {
      setLoaded(true);
    };
    
    script.onerror = () => {
      setError(new Error('Failed to load PayU SDK'));
    }
    document.body.appendChild(script);

    return () => {
      // Cleanup if component unmounts during loading
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  return { loaded, error };
};

/**
 * Hook to poll for submerchant status with a set interval
 * Returns the current status and a flag indicating if polling is active
 */
// Hook implementation moved below to avoid duplication


/**
 * Hook for updating a PayU account
 */
export const useUpdatePayuAccount = (
  options?: UseMutationOptions<any, FetchError, any>
) => {
  return useMutation({
    mutationFn: (payload) =>
      fetchQuery('/vendor/payout-account/update', {
        method: 'POST',
        body: payload,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: [PAYU_QUERY_KEY, 'account'],
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const usePayuSubmerchantStatusPolling = (
  extSubmerchantId: string | undefined,
  interval: number = 30000, // Default to 30 seconds
  shouldPoll = true
) => {
  const { data, refetch } = usePayuSubmerchantStatus(extSubmerchantId);
  const [polling, setPolling] = useState(shouldPoll);
  const [status, setStatus] = useState<PayUSubmerchantStatus | undefined>(undefined);
  const [error, setError] = useState<Error | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!extSubmerchantId) return;
    
    try {
      refetch();
    } catch (err: any) {
      setError(err);
      // Don't stop polling on error, we'll try again
    }
  }, [extSubmerchantId, refetch]);

  // Update status when data changes from the query
  useEffect(() => {
    // Safe access to nested properties
    const statusData = data?.data as any;
    if (statusData?.status) {
      const currentStatus = statusData.status as PayUSubmerchantStatus;
      setStatus(currentStatus);
      
      // Stop polling if we reach a terminal state
      if (currentStatus === 'ACTIVE' || 
          currentStatus === 'REJECTED' || 
          currentStatus === 'BLOCKED') {
        setPolling(false);
      }
    }
  }, [data]);

  // Handle errors and timeout
  useEffect(() => {
    if (error) {
      console.error('Error polling for status:', error);
      // Attempt to continue polling despite errors, but set error state
      setError(error instanceof Error ? error : new Error('Unknown error during status polling'));
    }
  }, [error]);

  useEffect(() => {
    if (!extSubmerchantId || !polling) return;

    // Set up polling interval
    const timer = setInterval(() => {
      fetchStatus();
    }, interval);

    return () => clearInterval(timer);
  }, [extSubmerchantId, polling, interval, fetchStatus]);

  return {
    status,
    data: data?.data as any,
    error,
    isPolling: polling,
    startPolling: () => setPolling(true),
    stopPolling: () => setPolling(false),
    refetch: fetchStatus
  };
};