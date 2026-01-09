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
const ORDERS_WITHOUT_PAYOUTS_QUERY_KEY = "orders_without_payouts" as const
const PENALTIES_QUERY_KEY = "penalties" as const

export const payoutsQueryKeys = queryKeysFactory(PAYOUTS_QUERY_KEY) as TQueryKey<"payouts">
export const payoutAccountQueryKeys = queryKeysFactory(PAYOUT_ACCOUNT_QUERY_KEY) as TQueryKey<"payout_account">
export const ordersWithoutPayoutsQueryKeys = queryKeysFactory(ORDERS_WITHOUT_PAYOUTS_QUERY_KEY) as TQueryKey<"orders_without_payouts">
export const penaltiesQueryKeys = queryKeysFactory(PENALTIES_QUERY_KEY) as TQueryKey<"penalties">

// Types based on backend models
export interface PayoutData {
  id: string
  currency_code: string
  amount: number
  data?: {
    payout_status?: string // PENDING, PROCESSING, COMPLETED, FAILED (from Stripe webhooks)
    payout_status_updated_at?: string
    failure_message?: string
    [key: string]: any
  }
 
  status?: string // PENDING, PENDING_BATCH, BATCHED, PROCESSING, COMPLETED, FAILED
  bank_transfer_reference?: string
  processed_at?: string
  batch_id?: string
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
  absolute_available_for_payout: number // All delivered orders (no 14-day check)
  available_for_payout: number // Orders that passed 14-day hold
  completed_orders_count: number
  absolute_orders_count: number // Orders delivered (no 14-day check)
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
    queryFn: async () => {
      const response = await fetchQuery('/vendor/payouts', {
        method: 'GET',
        query,
      });
      

      return response;
    },
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

      return response as EarningsData;
    },
    queryKey: ['earnings', query],
    ...options,
  });

  return { ...data, ...rest };
};

// Combined hook for payout overview
export const usePayoutOverview = (
  query?: Record<string, any>,
  options?: Omit<UseQueryOptions<any, FetchError, any, QueryKey>, 'queryFn' | 'queryKey'>
) => {
  
  const payoutAccount = usePayoutAccount({}, options);
  const payouts = usePayouts(query, options);
  const earnings = useEarningsCalculation({}, options);
  

  // Use backend-calculated values from earnings endpoint
  // The /vendor/earnings endpoint now calculates:
  // - total_earnings (order value - commission)
  // - total_paid_out (sum of completed payouts)
  // - absolute_available_for_payout (all delivered orders, no 14-day check)
  // - available_for_payout (orders that passed 14-day hold)
  const totalPaidOut = earnings.total_paid_out || 0;
  const absoluteAvailableForPayout = earnings.absolute_available_for_payout || 0;
  const availableForPayout = earnings.available_for_payout || 0;

  const result = {
    payoutAccount: payoutAccount.payout_account,
    payouts: payouts.payouts || [],
    payoutsCount: payouts.count || 0,
    earnings: earnings,
    totalPaidOut,
    absoluteAvailableForPayout,
    availableForPayout,
    isLoading: payoutAccount.isLoading || payouts.isLoading || earnings.isLoading,
    error: payoutAccount.error || payouts.error || earnings.error,
  };
  
  
  return result;
};

// Hook to fetch orders without payouts (pending payouts)
export const useOrdersWithoutPayouts = (
  query?: Record<string, any>,
  options?: Omit<
    UseQueryOptions<
      { orders: any[]; count: number; offset: number; limit: number },
      FetchError,
      { orders: any[]; count: number; offset: number; limit: number },
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const queryParams = new URLSearchParams()
  
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value))
      }
    })
  }

  const { data, ...rest } = useQuery({
    queryKey: ordersWithoutPayoutsQueryKeys.list(query),
    queryFn: async () => {
      const response = await fetchQuery(`/vendor/payouts/pending?${queryParams.toString()}`, {
        method: 'GET'
      })
      
      return response
    },
    ...options,
  })

  return {
    orders: data?.orders || [],
    ordersCount: data?.count || 0,
    offset: data?.offset || 0,
    limit: data?.limit || 10,
    ...rest,
  }
}

// Hook to fetch completed payouts
export const useCompletedPayouts = (
  query?: Record<string, any>,
  options?: Omit<
    UseQueryOptions<
      { payouts: PayoutData[]; count: number; offset: number; limit: number },
      FetchError,
      { payouts: PayoutData[]; count: number; offset: number; limit: number },
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const queryParams = new URLSearchParams()
  
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value))
      }
    })
  }

  const { data, ...rest } = useQuery({
    queryKey: payoutsQueryKeys.list({ ...query, status: 'COMPLETED' }),
    queryFn: async () => {
      const response = await fetchQuery(`/vendor/payouts/completed?${queryParams.toString()}`, {
        method: 'GET'
      })
      
      return response
    },
    ...options,
  })

  return {
    payouts: data?.payouts || [],
    payoutsCount: data?.count || 0,
    offset: data?.offset || 0,
    limit: data?.limit || 10,
    ...rest,
  }
}

// Payout Statistics Hook
export interface PayoutStatisticsData {
  earnings: { date: string; amount: string }[]
  payouts: { date: string; amount: string }[]
  totalEarnings: number
  totalPayouts: number
}

export const usePayoutStatistics = (
  query?: { time_from?: string; time_to?: string },
  options?: Omit<
    UseQueryOptions<PayoutStatisticsData, FetchError, PayoutStatisticsData, QueryKey>,
    "queryFn" | "queryKey"
  >
) => {
  const queryParams = new URLSearchParams()
  
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value))
      }
    })
  }

  const { data, ...rest } = useQuery({
    queryKey: ['payout_statistics', query],
    queryFn: async () => {
      const response = await fetchQuery(`/vendor/payouts/statistics?${queryParams.toString()}`, {
        method: 'GET'
      })
      
      return response
    },
    ...options,
  })

  return {
    earnings: data?.earnings || [],
    payouts: data?.payouts || [],
    totalEarnings: data?.totalEarnings || 0,
    totalPayouts: data?.totalPayouts || 0,
    ...rest,
  }
}

// Commission Rule Types
// Penalty Types
export interface PenaltyData {
  id: string
  amount: number
  remaining_amount: number
  currency_code: string
  status: 'pending' | 'partially_deducted' | 'deducted' | 'paid' | 'waived'
  reason: string
  order_id: string
  created_at: string
  updated_at: string
}

export interface PenaltiesResponse {
  penalties: PenaltyData[]
  total_pending: number
  total_deducted: number
}

export interface CommissionRuleData {
  id: string
  name: string
  reference: string
  reference_id: string
  is_seller_specific: boolean
  fee_value: string
  type: string
  percentage_rate?: number
  include_tax: boolean
}

export interface CommissionRuleResponse {
  commission_rule: CommissionRuleData | null
}

// Hook to fetch seller's commission rule
export const useCommissionRule = (
  options?: Omit<
    UseQueryOptions<CommissionRuleResponse, FetchError, CommissionRuleResponse, QueryKey>,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: ['commission_rule'],
    queryFn: async () => {
      const response = await fetchQuery('/vendor/commission/rule', {
        method: 'GET'
      })
      
      return response
    },
    ...options,
  })

  return {
    commissionRule: data?.commission_rule || null,
    ...rest,
  }
}

// Hook to fetch penalties for vendor
export const usePenalties = (
  query?: { status?: string },
  options?: Omit<
    UseQueryOptions<PenaltiesResponse, FetchError, PenaltiesResponse, QueryKey>,
    "queryFn" | "queryKey"
  >
) => {
  const queryParams = new URLSearchParams()
  
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value))
      }
    })
  }

  const { data, ...rest } = useQuery({
    queryKey: penaltiesQueryKeys.list(query),
    queryFn: async () => {
      const response = await fetchQuery(`/vendor/payouts/penalties?${queryParams.toString()}`, {
        method: 'GET'
      })
      
      return response
    },
    ...options,
  })

  return {
    penalties: data?.penalties || [],
    totalPending: data?.total_pending || 0,
    totalDeducted: data?.total_deducted || 0,
    ...rest,
  }
}
