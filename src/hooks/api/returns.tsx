import { HttpTypes } from "@medusajs/types"
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
} from "@tanstack/react-query"

import { FetchError } from "@medusajs/js-sdk"
import { sdk } from "../../lib/client/client"
import { fetchQuery } from "../../lib/client/client"
import { queryClient } from "../../lib/query-client"
import { queryKeysFactory } from "../../lib/query-key-factory"
import { ordersQueryKeys } from "./orders"

const RETURNS_QUERY_KEY = "returns" as const
export const returnsQueryKeys = queryKeysFactory(RETURNS_QUERY_KEY)

export const useReturn = (
  id: string,
  query?: Record<string, any>,
  options?: Omit<
    UseQueryOptions<any, FetchError, any, QueryKey>,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: async () => {
      const response = await fetchQuery(`/vendor/returns/${id}`, {
        method: 'GET',
        query: query as { [key: string]: string | number },
      });
      
      console.log("🔍 useReturn fetchQuery response:", {
        returnId: id,
        response,
        responseData: response.data,
        responseReturn: response.return
      })
      
      // The backend returns { return: result }, extract the return object
      const result = response.data || response;
      
      // If result has a 'return' property, extract it
      if (result && result.return) {
        // If the return is an array, take the first item, otherwise use as is
        const returnData = Array.isArray(result.return) ? result.return[0] : result.return;
        return { return: returnData };
      }
      
      return result;
    },
    queryKey: returnsQueryKeys.detail(id, query),
    ...options,
  })

  return { ...data, ...rest }
}

export const useReturns = (
  query?: HttpTypes.AdminReturnFilters,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminReturnFilters,
      FetchError,
      HttpTypes.AdminReturnsResponse,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: async () => {
      // Only send fields, limit, offset to backend
      // Backend can't filter by order_id/status at link table level
      const backendQuery: Record<string, any> = {};
      
      if (query?.fields) backendQuery.fields = query.fields;
      // CRITICAL: If filtering by order_id, fetch ALL returns (not just 50)
      // The return we're looking for might be on page 2+
      if (query?.order_id || query?.status) {
        backendQuery.limit = 1000; // Fetch all returns when filtering
      } else {
        backendQuery.limit = query?.limit || 50;
      }
      if (query?.offset) backendQuery.offset = query.offset;
      
      try {
        console.log('🔍 [useReturns] Fetching with query:', backendQuery)
        console.log('🔍 [useReturns] Will filter by:', { order_id: query?.order_id, status: query?.status })
        
        const response = await fetchQuery('/vendor/returns', {
          method: 'GET',
          query: backendQuery,
        });
        
        // The fetchQuery returns the data directly, not nested under .data
        let result = response.data || response;
        
        console.log('🔍 [useReturns] Backend response:', {
          hasResult: !!result,
          returnsCount: result?.returns?.length,
          firstThreeReturns: result?.returns?.slice(0, 3).map((r: any) => ({ id: r.id, order_id: r.order_id, status: r.status }))
        })
      
        // Ensure we always return a valid structure
        if (!result) {
          console.warn('⚠️  [useReturns] No result from backend')
          return {
            returns: [],
            count: 0,
            offset: 0,
            limit: 50
          };
        }
      
        // Ensure returns is always an array
        if (!result.returns) {
          console.warn('⚠️  [useReturns] No returns array in result')
          result.returns = [];
        }
        
        // Client-side filtering by order_id and status
        let filteredReturns = result.returns;
        
        if (query?.order_id) {
          console.log('🔍 [useReturns] Filtering by order_id:', query.order_id)
          filteredReturns = filteredReturns.filter((r: any) => r.order_id === query.order_id);
          console.log('🔍 [useReturns] After order_id filter:', filteredReturns.length, 'returns')
        }
        
        if (query?.status) {
          console.log('🔍 [useReturns] Filtering by status:', query.status)
          filteredReturns = filteredReturns.filter((r: any) => r.status === query.status);
          console.log('🔍 [useReturns] After status filter:', filteredReturns.length, 'returns')
        }
        
        console.log('🔍 [useReturns] Final result:', {
          filteredCount: filteredReturns.length,
          filteredReturns: filteredReturns.map((r: any) => ({ id: r.id, order_id: r.order_id, status: r.status }))
        })
        
        return {
          ...result,
          returns: filteredReturns,
          count: filteredReturns.length
        };
      } catch (error) {
        console.error('❌ [useReturns] Error in fetchQuery:', error)
        return {
          returns: [],
          count: 0,
          offset: 0,
          limit: 50
        };
      }
    },
    queryKey: returnsQueryKeys.list(query),
    ...options,
  })

  return { ...data, ...rest }
}

export const useInitiateReturn = (
  orderId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminReturnResponse,
    FetchError,
    HttpTypes.AdminInitiateReturnRequest
  >
) => {
  return useMutation({
    mutationFn: async (payload: HttpTypes.AdminInitiateReturnRequest) => {
      const response = await fetchQuery('/vendor/returns/request', {
        method: 'POST',
        body: payload,
      });
      return response.data;
    },
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.details(),
      })

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      })

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useCancelReturn = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<HttpTypes.AdminReturnResponse, FetchError>
) => {
  return useMutation({
    mutationFn: async () => {
      const response = await fetchQuery(`/vendor/returns/${id}/cancel`, {
        method: 'POST',
      });
      return response.data;
    },
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.details(),
      })

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
        refetchType: "all", // We want preview to be updated in the cache immediately
      })

      queryClient.invalidateQueries({
        queryKey: returnsQueryKeys.details(),
      })
      queryClient.invalidateQueries({
        queryKey: returnsQueryKeys.lists(),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

/**
 * REQUEST RETURN
 */

export const useConfirmReturnRequest = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminReturnResponse,
    FetchError,
    HttpTypes.AdminConfirmReturnRequest
  >
) => {
  return useMutation({
    mutationFn: async (payload: HttpTypes.AdminConfirmReturnRequest) => {
      const response = await fetchQuery(`/vendor/returns/${id}/confirm-request`, {
        method: 'POST',
        body: payload,
      });
      return response.data;
    },
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.details(),
      })

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      })

      queryClient.invalidateQueries({
        queryKey: returnsQueryKeys.details(),
      })
      queryClient.invalidateQueries({
        queryKey: returnsQueryKeys.lists(),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useCancelReturnRequest = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<HttpTypes.AdminReturnResponse, FetchError>
) => {
  return useMutation({
    mutationFn: async () => {
      const response = await fetchQuery(`/vendor/returns/${id}/cancel-request`, {
        method: 'POST',
      });
      return response.data;
    },
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.details(),
      })

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
        refetchType: "all", // We want preview to be updated in the cache immediately
      })

      queryClient.invalidateQueries({
        queryKey: returnsQueryKeys.details(),
      })

      queryClient.invalidateQueries({
        queryKey: returnsQueryKeys.lists(),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useAddReturnItem = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminReturnResponse,
    FetchError,
    HttpTypes.AdminAddReturnItems
  >
) => {
  return useMutation({
    mutationFn: async (payload: HttpTypes.AdminAddReturnItems) => {
      const response = await fetchQuery(`/vendor/returns/${id}/items`, {
        method: 'POST',
        body: payload,
      });
      return response.data;
    },
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.details(),
      })

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useUpdateReturnItem = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminReturnResponse,
    FetchError,
    HttpTypes.AdminUpdateReturnItems & { actionId: string }
  >
) => {
  return useMutation({
    mutationFn: async ({
      actionId,
      ...payload
    }: HttpTypes.AdminUpdateReturnItems & { actionId: string }) => {
      const response = await fetchQuery(`/vendor/returns/${id}/items/${actionId}`, {
        method: 'POST',
        body: payload,
      });
      return response.data;
    },
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.details(),
      })

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useRemoveReturnItem = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminReturnResponse,
    FetchError,
    string
  >
) => {
  return useMutation({
    mutationFn: async (actionId: string) => {
      const response = await fetchQuery(`/vendor/returns/${id}/items/${actionId}`, {
        method: 'DELETE',
      });
      return response.data;
    },
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.details(),
      })

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      })

      queryClient.invalidateQueries({
        queryKey: returnsQueryKeys.details(),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useUpdateReturn = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminReturnResponse,
    FetchError,
    HttpTypes.AdminUpdateReturnRequest
  >
) => {
  return useMutation({
    mutationFn: async (payload: HttpTypes.AdminUpdateReturnRequest) => {
      const response = await fetchQuery(`/vendor/returns/${id}`, {
        method: 'POST',
        body: payload,
      });
      return response.data;
    },
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.details(),
      })

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useAddReturnShipping = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminReturnResponse,
    FetchError,
    HttpTypes.AdminAddReturnShipping
  >
) => {
  return useMutation({
    mutationFn: async (payload: HttpTypes.AdminAddReturnShipping) => {
      const response = await fetchQuery(`/vendor/returns/${id}/shipping`, {
        method: 'POST',
        body: payload,
      });
      return response.data;
    },
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.details(),
      })

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useUpdateReturnShipping = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminReturnResponse,
    FetchError,
    HttpTypes.AdminAddReturnShipping
  >
) => {
  return useMutation({
    mutationFn: async ({
      actionId,
      ...payload
    }: HttpTypes.AdminAddReturnShipping & { actionId: string }) => {
      const response = await fetchQuery(`/vendor/returns/${id}/shipping/${actionId}`, {
        method: 'POST',
        body: payload,
      });
      return response.data;
    },
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.details(),
      })

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useDeleteReturnShipping = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminReturnResponse,
    FetchError,
    string
  >
) => {
  return useMutation({
    mutationFn: async (actionId: string) => {
      const response = await fetchQuery(`/vendor/returns/${id}/shipping/${actionId}`, {
        method: 'DELETE',
      });
      return response.data;
    },
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.details(),
      })

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      })

      queryClient.invalidateQueries({
        queryKey: returnsQueryKeys.details(),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

/**
 * RECEIVE RETURN
 */

export const useInitiateReceiveReturn = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminReturnResponse,
    FetchError,
    HttpTypes.AdminInitiateReturnRequest
  >
) => {
  return useMutation({
    mutationFn: async (payload: HttpTypes.AdminInitiateReturnRequest) => {
      const response = await fetchQuery(`/vendor/returns/${id}/receive`, {
        method: 'POST',
        body: payload,
      });
      // The fetchQuery returns the data directly, not nested under .data
      return response.data || response;
    },
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.details(),
      })

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useAddReceiveItems = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminReturnResponse,
    FetchError,
    HttpTypes.AdminReceiveItems
  >
) => {
  return useMutation({
    mutationFn: async (payload: HttpTypes.AdminReceiveItems) => {
      const response = await fetchQuery(`/vendor/returns/${id}/receive/items`, {
        method: 'POST',
        body: payload,
      });
      return response.data;
    },
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.details(),
      })

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useUpdateReceiveItem = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminReturnResponse,
    FetchError,
    HttpTypes.AdminUpdateReceiveItems & { actionId: string }
  >
) => {
  return useMutation({
    mutationFn: async ({
      actionId,
      ...payload
    }: HttpTypes.AdminUpdateReceiveItems & { actionId: string }) => {
      const response = await fetchQuery(`/vendor/returns/${id}/receive/items/${actionId}`, {
        method: 'POST',
        body: payload,
      });
      return response.data;
    },
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.details(),
      })

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useRemoveReceiveItems = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminReturnResponse,
    FetchError,
    string
  >
) => {
  return useMutation({
    mutationFn: async (actionId: string) => {
      const response = await fetchQuery(`/vendor/returns/${id}/receive/items/${actionId}`, {
        method: 'DELETE',
      });
      return response.data;
    },
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.details(),
      })

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useAddDismissItems = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminReturnResponse,
    FetchError,
    HttpTypes.AdminDismissItems
  >
) => {
  return useMutation({
    mutationFn: async (payload: HttpTypes.AdminDismissItems) => {
      const response = await fetchQuery(`/vendor/returns/${id}/dismiss`, {
        method: 'POST',
        body: payload,
      });
      return response.data;
    },
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.details(),
      })

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useUpdateDismissItem = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminReturnResponse,
    FetchError,
    HttpTypes.AdminUpdateDismissItems & { actionId: string }
  >
) => {
  return useMutation({
    mutationFn: async ({
      actionId,
      ...payload
    }: HttpTypes.AdminUpdateDismissItems & { actionId: string }) => {
      const response = await fetchQuery(`/vendor/returns/${id}/dismiss/${actionId}`, {
        method: 'POST',
        body: payload,
      });
      return response.data;
    },
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.details(),
      })

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useRemoveDismissItem = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminReturnResponse,
    FetchError,
    string
  >
) => {
  return useMutation({
    mutationFn: async (actionId: string) => {
      const response = await fetchQuery(`/vendor/returns/${id}/dismiss/${actionId}`, {
        method: 'DELETE',
      });
      return response.data;
    },
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.details(),
      })

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      })

      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useConfirmReturnReceive = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminReturnResponse,
    FetchError,
    HttpTypes.AdminConfirmReceiveReturn
  >
) => {
  return useMutation({
    mutationFn: async (payload: HttpTypes.AdminConfirmReceiveReturn) => {
      const response = await fetchQuery(`/vendor/returns/${id}/receive/confirm`, {
        method: 'POST',
        body: payload,
      });
      return response.data;
    },
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.details(),
      })

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
      })

      queryClient.invalidateQueries({
        queryKey: returnsQueryKeys.details(),
      })
      queryClient.invalidateQueries({
        queryKey: returnsQueryKeys.lists(),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useCancelReceiveReturn = (
  id: string,
  orderId: string,
  options?: UseMutationOptions<HttpTypes.AdminReturnResponse, FetchError>
) => {
  return useMutation({
    mutationFn: () => sdk.admin.return.cancelReceive(id),
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.details(),
      })

      queryClient.invalidateQueries({
        queryKey: ordersQueryKeys.preview(orderId),
        refetchType: "all", // We want preview to be updated in the cache immediately
      })

      queryClient.invalidateQueries({
        queryKey: returnsQueryKeys.details(),
      })
      queryClient.invalidateQueries({
        queryKey: returnsQueryKeys.lists(),
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
