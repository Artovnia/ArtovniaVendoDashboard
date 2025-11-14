import { FetchError } from "@medusajs/js-sdk"
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
} from "@tanstack/react-query"
import { fetchQuery } from '../../lib/client';
import { queryClient } from '../../lib/query-client';
import {
  queryKeysFactory,
  TQueryKey,
} from '../../lib/query-key-factory';

const PAYOUTS_QUERY_KEY = "payouts" as const
const PAYOUT_ACCOUNT_QUERY_KEY = "payout_account" as const

export const payoutsQueryKeys = queryKeysFactory(PAYOUTS_QUERY_KEY) as TQueryKey<"payouts">
export const payoutAccountQueryKeys = queryKeysFactory(PAYOUT_ACCOUNT_QUERY_KEY) as TQueryKey<"payout_account">

// Types based on backend models
export interface PayoutData {
  id: string
  currency_code: string
  amount: number
  data?: any
  created_at: string
  updated_at: string
  payout_account_id: string
}

export interface PayoutAccountData {
  id: string
  status: string
  metadata?: any
  bank_account_encrypted?: string
  bank_account_country?: string
  bank_account_data?: {
    iban: string
    country: string
    account_holder_name: string
  }
  created_at: string
  updated_at: string
}

export interface PayoutsListResponse {
  payouts: PayoutData[]
  count: number
  offset: number
  limit: number
}

export interface PayoutAccountResponse {
  payout_account: PayoutAccountData
}

export interface CreatePayoutAccountPayload {
  context?: {
    iban?: string
    country?: string
    account_holder_name?: string
    company_name?: string
    [key: string]: any
  }
}

export interface EarningsData {
  total_earnings: number
  pending_earnings: number
  total_paid_out: number
  available_for_payout: number
  completed_orders_count: number
  pending_orders_count: number
  currency_code: string
  gross_earnings: number
  commission_deductions: number
}

// Payout Account Hooks
export const usePayoutAccount = (
  query?: Record<string, any>,
  options?: Omit<
    UseQueryOptions<PayoutAccountResponse, FetchError, PayoutAccountResponse, QueryKey>,
    'queryFn' | 'queryKey'
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: async () =>
      fetchQuery('/vendor/payout-account', {
        method: 'GET',
        query,
      }),
    queryKey: payoutAccountQueryKeys.list(query),
    ...options,
  });

  return { ...data, ...rest };
};

export const useCreatePayoutAccount = (
  options?: UseMutationOptions<
    PayoutAccountResponse,
    FetchError,
    CreatePayoutAccountPayload
  >
) => {
  return useMutation({
    mutationFn: (payload: CreatePayoutAccountPayload) =>
      fetchQuery('/vendor/payout-account', {
        method: 'POST',
        body: payload,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: payoutAccountQueryKeys.all,
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

// Payouts Hooks
export const usePayouts = (
  query?: Record<string, any>,
  options?: Omit<
    UseQueryOptions<PayoutsListResponse, FetchError, PayoutsListResponse, QueryKey>,
    'queryFn' | 'queryKey'
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: async () =>
      fetchQuery('/vendor/payouts', {
        method: 'GET',
        query,
      }),
    queryKey: payoutsQueryKeys.list(query),
    ...options,
  });

  return { ...data, ...rest };
};

// Earnings calculation hook using dedicated earnings endpoint
export const useEarningsCalculation = (
  query?: Record<string, any>,
  options?: Omit<
    UseQueryOptions<EarningsData, FetchError, EarningsData, QueryKey>,
    'queryFn' | 'queryKey'
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: async () => {
      // Use the comprehensive earnings endpoint that calculates everything server-side
      // This includes: total earnings (order value - commission), pending earnings,
      // total paid out, available for payout, and order counts
      const response = await fetchQuery('/vendor/earnings', {
        method: 'GET',
        query,
      });

      console.log('📊 Earnings data received:', response);

      return response as EarningsData;
    },
    queryKey: ['earnings', query],
    ...options,
  });

  return { ...data, ...rest };
};

// Combined hook for payout overview
export const usePayoutOverview = (
  options?: {
    payoutAccountOptions?: Omit<UseQueryOptions<PayoutAccountResponse, FetchError, PayoutAccountResponse, QueryKey>, 'queryFn' | 'queryKey'>
    payoutsOptions?: Omit<UseQueryOptions<PayoutsListResponse, FetchError, PayoutsListResponse, QueryKey>, 'queryFn' | 'queryKey'>
    earningsOptions?: Omit<UseQueryOptions<EarningsData, FetchError, EarningsData, QueryKey>, 'queryFn' | 'queryKey'>
  }
) => {
  const payoutAccount = usePayoutAccount({}, options?.payoutAccountOptions);
  const payouts = usePayouts({}, options?.payoutsOptions);
  const earnings = useEarningsCalculation({}, options?.earningsOptions);

  // Use backend-calculated values from earnings endpoint
  // The /vendor/earnings endpoint now calculates:
  // - total_earnings (order value - commission)
  // - total_paid_out (sum of completed payouts)
  // - available_for_payout (total_earnings - total_paid_out)
  const totalPaidOut = earnings.total_paid_out || 0;
  const availableForPayout = earnings.available_for_payout || 0;

  return {
    payoutAccount: payoutAccount.payout_account,
    payouts: payouts.payouts || [],
    earnings: earnings,
    totalPaidOut,
    availableForPayout,
    isLoading: payoutAccount.isLoading || payouts.isLoading || earnings.isLoading,
    error: payoutAccount.error || payouts.error || earnings.error,
  };
};
