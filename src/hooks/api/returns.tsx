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
  // Extract fields for backend query and keep other filters for client-side filtering
  const fields = query?.fields || '';
  const limit = query?.limit;
  const offset = query?.offset;
  
  // Store filters for client-side filtering
  const status = query?.status;
  const orderId = query?.order_id;
  
  const { data, ...rest } = useQuery({
    queryFn: async () => {
      // Only send supported query params to backend
      const supportedQuery: Record<string, string | number> = {};
      
      if (fields) supportedQuery.fields = fields;
      if (limit) supportedQuery.limit = limit;
      if (offset) supportedQuery.offset = offset;
      
      try {
        const response = await fetchQuery('/vendor/returns', {
          method: 'GET',
          query: supportedQuery,
        });
        
        // The fetchQuery returns the data directly, not nested under .data
        const result = response.data || response;
      
      // Ensure we always return a valid structure
      if (!result) {
        return {
          returns: [],
          count: 0,
          offset: 0,
          limit: 50
        };
      }
      
      // Apply client-side filtering if needed
      if (result && result.returns && (status || orderId)) {
        console.log('🔍 Frontend: Applying client-side filters:', { status, orderId })
        console.log('🔍 Frontend: Before filtering:', result.returns.length, 'returns')
        
        result.returns = result.returns.filter((returnItem: any) => {
          let matches = true;
          
          if (status && returnItem.status !== status) {
            console.log('🔍 Frontend: Status mismatch:', { expected: status, actual: returnItem.status })
            matches = false;
          }
          
          if (orderId && returnItem.order_id !== orderId) {
            console.log('🔍 Frontend: Order ID mismatch:', { expected: orderId, actual: returnItem.order_id })
            matches = false;
          }
          
          return matches;
        });
        
        console.log('🔍 Frontend: After filtering:', result.returns.length, 'returns')
        
        // Update count to reflect client-side filtering
        result.count = result.returns.length;
      }
      
        // Ensure returns is always an array
        if (!result.returns) {
          result.returns = [];
        }
        
        return result;
      } catch (error) {
        console.error('🔍 Frontend: Error in fetchQuery:', error)
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
