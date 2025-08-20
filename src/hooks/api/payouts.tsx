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

// Earnings calculation hook based on order transactions
export const useEarningsCalculation = (
  query?: Record<string, any>,
  options?: Omit<
    UseQueryOptions<any, FetchError, any, QueryKey>,
    'queryFn' | 'queryKey'
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: async () => {
      // First, let's try to get order transactions which should show actual captured amounts
      try {
        const transactionsResponse = await fetchQuery('/vendor/order-transactions', {
          method: 'GET',
          query: {
            ...query,
            fields: 'id,order_id,amount,currency_code,type,created_at',
            limit: 1000,
          },
        });
        
        if (transactionsResponse.order_transactions?.length > 0) {
          // Filter for capture transactions (actual earnings)
          const captureTransactions = transactionsResponse.order_transactions.filter((tx: any) => 
            tx.type === 'capture' && tx.amount > 0
          );

          const totalEarnings = captureTransactions.reduce((sum: number, tx: any) => {
            return sum + (tx.amount || 0);
          }, 0);

          return {
            total_earnings: totalEarnings,
            pending_earnings: 0, // Will calculate from pending orders if needed
            completed_transactions_count: captureTransactions.length,
            currency_code: captureTransactions[0]?.currency_code || 'PLN',
          };
        }
      } catch (error) {
        console.log('🔍 DEBUG: Order transactions endpoint not available, falling back to orders');
      }

      // Fallback: Use orders but with better logic and commission calculation
      const ordersResponse = await fetchQuery('/vendor/orders', {
        method: 'GET',
        query: {
          ...query,
          fields: 'id,total,currency_code,status,created_at,payment_status,fulfillment_status,payment_collections',
          limit: 1000,
        },
      });

      // Analyze the actual data structure
      if (ordersResponse.orders?.length > 0) {
        
        // Look for orders with captured payments
        const ordersWithCapturedPayments = ordersResponse.orders.filter((order: any) => {
          // Check if payment is actually captured/completed
          const hasValidPayment = order.payment_status === 'captured';
          const isCompleted = order.status === 'completed';
          
          return hasValidPayment && isCompleted;
        });

        // Calculate gross earnings and commission deductions
        let totalGrossEarnings = 0;
        let totalCommissionDeductions = 0;

        for (const order of ordersWithCapturedPayments) {
          const orderTotal = order.total || 0;
          totalGrossEarnings += orderTotal;

          // Fetch commission lines for this order
          try {
            const commissionResponse = await fetchQuery(`/vendor/orders/${order.id}/commission-lines`, {
              method: 'GET',
            });

            if (commissionResponse.commission_lines?.length > 0) {
              const orderCommission = commissionResponse.commission_lines.reduce((sum: number, line: any) => 
                sum + (line.value || 0), 0
              );
              totalCommissionDeductions += orderCommission;
            }
          } catch (error) {
            console.log(`🔍 DEBUG: Could not fetch commission for order ${order.id}:`, error);
          }
        }

        const netEarnings = totalGrossEarnings - totalCommissionDeductions;

        return {
          total_earnings: netEarnings,
          gross_earnings: totalGrossEarnings,
          commission_deductions: totalCommissionDeductions,
          pending_earnings: 0,
          completed_orders_count: ordersWithCapturedPayments.length,
          currency_code: ordersWithCapturedPayments[0]?.currency_code || 'PLN',
        };
      }

      return {
        total_earnings: 0,
        pending_earnings: 0,
        completed_orders_count: 0,
        currency_code: 'PLN',
      };
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
    earningsOptions?: Omit<UseQueryOptions<any, FetchError, any, QueryKey>, 'queryFn' | 'queryKey'>
  }
) => {
  const payoutAccount = usePayoutAccount({}, options?.payoutAccountOptions);
  const payouts = usePayouts({}, options?.payoutsOptions);
  const earnings = useEarningsCalculation({}, options?.earningsOptions);

  // Calculate total paid out
  const totalPaidOut = payouts.payouts?.reduce((sum: number, payout: PayoutData) => 
    sum + (payout.amount || 0), 0
  ) || 0;

  // Calculate available for payout (earnings - already paid out)
  const availableForPayout = (earnings.total_earnings || 0) - totalPaidOut;

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
