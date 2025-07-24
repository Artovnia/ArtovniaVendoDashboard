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
  const { data, ...rest } = useQuery({
    queryFn: async () => {
      console.log('🔔 [NOTIFICATION] Fetching vendor notifications with query:', query);
      
      try {
        const result = await fetchQuery("/vendor/notifications", {
          method: "GET",
          query: query as Record<string, string | number>,
        });
        
        console.log('✅ [NOTIFICATION] Successfully fetched notifications:', {
          count: result?.notifications?.length || 0,
          total: result?.count || 0
        });
        
        return result;
      } catch (error) {
        console.error('❌ [NOTIFICATION] Error fetching notifications:', error);
        throw error;
      }
    },
    queryKey: notificationQueryKeys.list(query),
    ...options,
  });

  return { ...data, ...rest };
}