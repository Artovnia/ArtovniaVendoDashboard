import { QueryKey, UseQueryOptions, useQuery } from "@tanstack/react-query"

import { HttpTypes } from "@medusajs/types"
import { fetchQuery, sdk } from "../../lib/client"
import { queryKeysFactory } from "../../lib/query-key-factory"
import { FetchError } from "@medusajs/js-sdk"

const NOTIFICATION_QUERY_KEY = "notification" as const
export const notificationQueryKeys = queryKeysFactory(NOTIFICATION_QUERY_KEY)

export const useNotification = (
  id: string,
  query?: Record<string, any>,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminNotificationResponse,
      FetchError,
      HttpTypes.AdminNotificationResponse,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: notificationQueryKeys.detail(id),
    queryFn: async () => sdk.admin.notification.retrieve(id, query),
    ...options,
  })

  return { ...data, ...rest }
}

export const useNotifications = (
  query?: HttpTypes.AdminNotificationListParams,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminNotificationListResponse,
      FetchError,
      HttpTypes.AdminNotificationListResponse,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  // Log the auth token before making the request
  const checkAuthToken = async () => {
    const token = await window.localStorage.getItem('medusa_auth_token');
    console.log('Auth token available:', !!token, token ? `${token.substring(0, 10)}...` : 'none');
    return token;
  };
  
  const { data, ...rest } = useQuery({
    queryFn: async () => {
      await checkAuthToken();
      
      // Try using SDK method instead of direct fetchQuery
      try {
        return fetchQuery("/vendor/notifications", {
          method: "GET",
          query: query as Record<string, string | number>,
          headers: {
            // Ensure authentication headers are set
            'Cache-Control': 'no-cache',
          }
        });
      } catch (error) {
        console.error('Error fetching notifications:', error);
        throw error;
      }
    },
    queryKey: notificationQueryKeys.list(query),
    ...options,
  });

  return { ...data, ...rest };
}