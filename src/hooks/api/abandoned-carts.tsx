import { FetchError } from '@medusajs/js-sdk'
import { QueryKey, UseMutationOptions, useMutation, useQuery } from '@tanstack/react-query'

import { fetchQuery } from '../../lib/client'
import { queryClient } from '../../lib/query-client'
import { queryKeysFactory } from '../../lib/query-key-factory'

const ABANDONED_CARTS_QUERY_KEY = 'abandoned_carts' as const

const abandonedCartsQueryKeys = {
  ...queryKeysFactory(ABANDONED_CARTS_QUERY_KEY),
  settings: () => [ABANDONED_CARTS_QUERY_KEY, 'settings']
}

export type AbandonedCartDiscountType = 'percentage' | 'fixed'

export type AbandonedCartSettings = {
  abandoned_cart_discount_enabled: boolean
  abandoned_cart_discount_mode: 'manual' | 'automatic'
  abandoned_cart_discount_type: AbandonedCartDiscountType | null
  abandoned_cart_discount_value: number | null
  abandoned_cart_discount_currency_code: string | null
  abandoned_cart_discount_delay_hours: number
}

export type VendorAbandonedCart = {
  id: string
  email: string | null
  created_at: string
  updated_at: string
  currency_code: string | null
  subtotal?: number | null
  total?: number | null
  notified_at: string | null
  can_send_discount: boolean
  discount_available_at: string
  discount_sent: {
    promotion_id: string
    promotion_code: string
    sent_at: string
  } | null
  vendor_items: Array<{
    id: string
    quantity: number
    title?: string | null
    unit_price?: number | null
    subtotal?: number | null
    discount_total?: number | null
    total?: number | null
    variant?: {
      id: string
      title?: string | null
      product?: {
        id: string
        title?: string | null
        thumbnail?: string | null
      } | null
    } | null
  }>
  all_items_count: number
}

type AbandonedCartsResponse = {
  abandoned_carts: VendorAbandonedCart[]
  count: number
}

type AbandonedCartSettingsResponse = {
  settings: AbandonedCartSettings
}

export type SendAbandonedCartDiscountPayload = {
  discount_type: AbandonedCartDiscountType
  discount_value: number
  currency_code?: string
}

export const useAbandonedCarts = () => {
  const { data, ...rest } = useQuery({
    queryKey: abandonedCartsQueryKeys.list(),
    queryFn: async () =>
      fetchQuery('/vendor/abandoned-carts', {
        method: 'GET'
      }) as Promise<AbandonedCartsResponse>
  })

  return {
    abandoned_carts: data?.abandoned_carts || [],
    count: data?.count || 0,
    ...rest
  }
}

export const useAbandonedCartSettings = () => {
  const { data, ...rest } = useQuery({
    queryKey: abandonedCartsQueryKeys.settings(),
    queryFn: async () =>
      fetchQuery('/vendor/abandoned-carts/settings', {
        method: 'GET'
      }) as Promise<AbandonedCartSettingsResponse>
  })

  return {
    settings: data?.settings,
    ...rest
  }
}

export const useUpdateAbandonedCartSettings = (
  options?: UseMutationOptions<
    AbandonedCartSettingsResponse,
    FetchError,
    AbandonedCartSettings,
    QueryKey
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      fetchQuery('/vendor/abandoned-carts/settings', {
        method: 'POST',
        body: payload
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: abandonedCartsQueryKeys.settings()
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options
  })
}

export const useSendAbandonedCartDiscount = (
  options?: UseMutationOptions<
    { message: string; promotion_code: string; promotion_id: string },
    FetchError,
    { cartId: string; payload: SendAbandonedCartDiscountPayload },
    QueryKey
  >
) => {
  return useMutation({
    mutationFn: ({ cartId, payload }) =>
      fetchQuery(`/vendor/abandoned-carts/${cartId}/discount`, {
        method: 'POST',
        body: payload
      }),
    onSuccess: (data, variables, context) => {
      queryClient.setQueryData(
        abandonedCartsQueryKeys.list(),
        (previous: AbandonedCartsResponse | undefined) => {
          if (!previous) {
            return previous
          }

          return {
            ...previous,
            abandoned_carts: previous.abandoned_carts.map((cart) => {
              if (cart.id !== variables.cartId) {
                return cart
              }

              return {
                ...cart,
                discount_sent: {
                  promotion_id: data.promotion_id,
                  promotion_code: data.promotion_code,
                  sent_at: new Date().toISOString()
                }
              }
            })
          }
        }
      )

      queryClient.invalidateQueries({
        queryKey: abandonedCartsQueryKeys.list()
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options
  })
}
