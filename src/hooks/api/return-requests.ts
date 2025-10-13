import {
  QueryKey,
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
} from "@tanstack/react-query"

import { FetchError } from "@medusajs/js-sdk"
import { fetchQuery } from "../../lib/client"
import { queryClient } from "../../lib/query-client"
import { queryKeysFactory } from "../../lib/query-key-factory"

const VENDOR_RETURN_REQUESTS_QUERY_KEY = "vendor-return-requests" as const
export const vendorReturnRequestsQueryKeys = queryKeysFactory(VENDOR_RETURN_REQUESTS_QUERY_KEY)

export type ReturnRequestLineItem = {
  id: string
  line_item_id: string
  quantity: number
  reason_id?: string
  title?: string
  created_at: string
  updated_at: string
  deleted_at: string | null
  return_request_id: string
}

export type ReturnRequest = {
  id: string
  customer_id: string
  customer_note: string
  vendor_reviewer_id: string | null
  vendor_reviewer_note: string | null
  vendor_review_date: Date | null
  admin_reviewer_id: string | null
  admin_reviewer_note: string | null
  admin_review_date: Date | null
  status: string
  created_at: Date
  updated_at: Date
  shipping_option_id: string | null
  line_items?: Array<ReturnRequestLineItem>
  order?: {
    id: string
    display_id: number
    total?: number
    currency_code?: string
    customer?: {
      first_name: string
      last_name: string
      email: string
    }
    items?: Array<{
      id: string
      title: string
      quantity: number
      variant?: {
        id: string
        title: string
        product?: {
          title: string
          id: string
        }
      }
    }>
    payment_collection?: {
      id: string
      status: string
      amount: number
      payments?: Array<{
        id: string
        amount: number
        currency_code: string
        provider_id: string
        captured_at?: string
        refunds?: Array<{
          id: string
          amount: number
          created_at: string
        }>
      }>
    }
  }
}

type ReturnRequestListResponse = {
  order_return_request: ReturnRequest[]
  count: number
}

type ReturnRequestResponse = {
  order_return_request: ReturnRequest
}

type UpdateReturnRequestParams = {
  status: "approved" | "refunded" | "withdrawn" | "escalated"
  vendor_reviewer_note: string
}

type ReturnRequestsQueryParams = {
  filters?: Record<string, any>
  fields?: string[]
}

export const useVendorReturnRequests = (
  query?: ReturnRequestsQueryParams,
  options?: Omit<
    UseQueryOptions<
      ReturnRequestListResponse,
      FetchError,
      ReturnRequestListResponse,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const params = {
    fields: query?.fields?.join(",") || "id,status,customer_id,customer_note,vendor_reviewer_id,vendor_reviewer_note,vendor_review_date,admin_reviewer_id,admin_reviewer_note,admin_review_date,shipping_option_id,line_items.*,line_items.line_item_id,line_items.quantity,line_items.reason_id,order.id,order.display_id,order.customer.*,order.items.*,order.items.id,order.items.title,order.items.quantity,order.items.variant.*,order.items.variant.id,order.items.variant.title,order.items.variant.product.*,order.items.variant.product.id,order.items.variant.product.title,order.payment_status",
    ...query?.filters,
  }

  const { data, ...rest } = useQuery({
    queryFn: async () => fetchQuery("/vendor/return-request", { method: "GET", query: params }),
    queryKey: vendorReturnRequestsQueryKeys.list(params),
    ...options,
  })

  const processedReturnRequests = data?.order_return_request?.filter(request => request !== null)?.map((request: any) => {
    console.log('🔍 [ReturnRequests] Processing request:', {
      id: request?.id,
      status: request?.status,
      hasOrder: !!request?.order,
      hasCustomer: !!request?.order?.customer,
      hasLineItems: !!request?.line_items,
      lineItemCount: request?.line_items?.length || 0
    })
    
    let created_at = null
    if (request?.line_items && request.line_items.length > 0 && request.line_items[0]?.created_at) {
      try {
        created_at = new Date(request.line_items[0].created_at)
        if (isNaN(created_at.getTime())) {
          created_at = null
        }
      } catch (error) {
        console.error("Error processing line item date:", error)
        created_at = null
      }
    }
    
    const processed = {
      ...request,
      created_at: created_at,
      updated_at: request?.updated_at ? new Date(request.updated_at) : null,
      vendor_review_date: request?.vendor_review_date ? new Date(request.vendor_review_date) : null,
      admin_review_date: request?.admin_review_date ? new Date(request.admin_review_date) : null
    }
    return processed
  }) || []
  
  console.log('✅ [ReturnRequests] Total processed:', processedReturnRequests.length)

  return {
    return_requests: processedReturnRequests,
    count: data?.count || 0,
    ...rest,
  }
}

export const useVendorReturnRequest = (
  id: string,
  query?: ReturnRequestsQueryParams,
  options?: Omit<
    UseQueryOptions<
      ReturnRequestResponse,
      FetchError,
      ReturnRequestResponse,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const params = {
    fields: query?.fields?.join(",") || "id,status,customer_id,customer_note,vendor_reviewer_id,vendor_reviewer_note,vendor_review_date,admin_reviewer_id,admin_reviewer_note,admin_review_date,shipping_option_id,line_items.*,line_items.line_item_id,line_items.quantity,line_items.reason_id,order.id,order.display_id,order.customer.*,order.items.*,order.items.id,order.items.title,order.items.quantity,order.items.variant.*,order.items.variant.id,order.items.variant.title,order.items.variant.product.*,order.items.variant.product.id,order.items.variant.product.title,order.payment_status",
  }

  const { data, ...rest } = useQuery({
    queryFn: async () => fetchQuery(`/vendor/return-request/${id}`, { method: "GET", query: params }),
    queryKey: vendorReturnRequestsQueryKeys.detail(id, params),
    enabled: !!id,
    ...options,
  })

  const processedRequest = data?.order_return_request ? {
    ...data.order_return_request,
    // Process created_at from line_items since top-level field is missing
    created_at: (() => {
      try {
        if (data.order_return_request.line_items && 
            data.order_return_request.line_items.length > 0 && 
            data.order_return_request.line_items[0].created_at) {
          const date = new Date(data.order_return_request.line_items[0].created_at);
          return isNaN(date.getTime()) ? null : date;
        }
        return null;
      } catch (e) {
        console.error("Error creating date object:", e);
        return null;
      }
    })(),
    updated_at: data.order_return_request.updated_at ? new Date(data.order_return_request.updated_at) : null,
    vendor_review_date: data.order_return_request.vendor_review_date ? new Date(data.order_return_request.vendor_review_date) : null,
    admin_review_date: data.order_return_request.admin_review_date ? new Date(data.order_return_request.admin_review_date) : null
  } : undefined

  return {
    return_request: processedRequest,
    ...rest,
  }
}

export const useUpdateVendorReturnRequest = (
  options?: UseMutationOptions<
    ReturnRequestResponse,
    FetchError,
    { id: string; data: UpdateReturnRequestParams }
  >
) => {
  const mutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateReturnRequestParams }) => {
      return await fetchQuery(`/vendor/return-request/${id}`, {
        method: "POST",
        body: data,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vendorReturnRequestsQueryKeys.lists() })
    },
    ...options,
  })

  const updateReturnRequest = async (id: string, data: UpdateReturnRequestParams) => {
    return await mutation.mutateAsync({ id, data })
  }

  return {
    updateReturnRequest,
  }
}
