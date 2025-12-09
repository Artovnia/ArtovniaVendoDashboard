import { FetchError } from '@medusajs/js-sdk';
import { HttpTypes } from '@medusajs/types';
import {
  QueryKey,
  UseMutationOptions,
  UseQueryOptions,
  useMutation,
  useQuery,
} from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';

import { fetchQuery, sdk } from '../../lib/client';
import { queryClient } from '../../lib/query-client';
import { queryKeysFactory } from '../../lib/query-key-factory';
import { variantsQueryKeys } from './products';

const INVENTORY_ITEMS_QUERY_KEY =
  'inventory_items' as const;
export const inventoryItemsQueryKeys = queryKeysFactory(
  INVENTORY_ITEMS_QUERY_KEY
);

const INVENTORY_ITEM_LEVELS_QUERY_KEY =
  'inventory_item_levels' as const;
export const inventoryItemLevelsQueryKeys =
  queryKeysFactory(INVENTORY_ITEM_LEVELS_QUERY_KEY);

export const useInventoryItems = (
  query?: HttpTypes.AdminInventoryItemsParams,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminInventoryItemListResponse,
      FetchError,
      HttpTypes.AdminInventoryItemListResponse,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
) => {
  // Create a stable query key that includes all query parameters
  const stableQuery = useMemo(() => query, [JSON.stringify(query || {})]);
  
  const { data, ...rest } = useQuery({
    queryFn: () =>
      fetchQuery('/vendor/inventory-items', {
        method: 'GET',
        query: stableQuery as { [key: string]: string | number },
      }),
    queryKey: inventoryItemsQueryKeys.list(stableQuery),
    // Set staleTime to 0 to ensure data is always considered stale and will be refetched
    staleTime: 0,
    // Set gcTime (garbage collection time) to a lower value to ensure the cache is cleared more frequently
    gcTime: 30000, // 30 seconds
    // Refetch on window focus to ensure we always have the latest data
    refetchOnWindowFocus: true,
    // Always refetch on mount to ensure fresh data
    refetchOnMount: true,
    // Add refetchInterval to periodically refresh the data
    refetchInterval: 10000, // 10 seconds
    ...options,
  });

  return { ...data, ...rest };
};

export const useInventoryItem = (
  id: string,
  query?: Record<string, any>,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminInventoryItemResponse,
      FetchError,
      HttpTypes.AdminInventoryItemResponse,
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      fetchQuery(`/vendor/inventory-items/${id}`, {
        method: 'GET',
        query: query as { [key: string]: string | number },
      }),
    queryKey: inventoryItemsQueryKeys.detail(id),
    ...options,
  });

  return { ...data, ...rest };
};

export const useCreateInventoryItem = (
  options?: UseMutationOptions<
    HttpTypes.AdminInventoryItemResponse,
    FetchError,
    HttpTypes.AdminCreateInventoryItem
  >
) => {
  return useMutation({
    mutationFn: (
      payload: HttpTypes.AdminCreateInventoryItem
    ) => sdk.admin.inventoryItem.create(payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: inventoryItemsQueryKeys.lists(),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useUpdateInventoryItem = (
  id: string,
  options?: UseMutationOptions<
    HttpTypes.AdminInventoryItemResponse,
    FetchError,
    HttpTypes.AdminUpdateInventoryItem
  >
) => {
  return useMutation({
    mutationFn: (
      payload: HttpTypes.AdminUpdateInventoryItem
    ) =>
      fetchQuery(`/vendor/inventory-items/${id}`, {
        method: 'POST',
        body: payload,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: inventoryItemsQueryKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: inventoryItemsQueryKeys.detail(id),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useDeleteInventoryItem = (
  id: string,
  options?: UseMutationOptions<
    HttpTypes.AdminInventoryItemDeleteResponse,
    FetchError,
    void
  >
) => {
  return useMutation({
    mutationFn: () =>
      fetchQuery(`/vendor/inventory-items/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: inventoryItemsQueryKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: inventoryItemsQueryKeys.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: variantsQueryKeys.lists(),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useDeleteInventoryItemLevel = (
  inventoryItemId: string,
  locationId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminInventoryLevelDeleteResponse,
    FetchError,
    void
  >
) => {
  return useMutation({
    mutationFn: () =>
      sdk.admin.inventoryItem.deleteLevel(
        inventoryItemId,
        locationId
      ),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: inventoryItemsQueryKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey:
          inventoryItemsQueryKeys.detail(inventoryItemId),
      });
      queryClient.invalidateQueries({
        queryKey:
          inventoryItemLevelsQueryKeys.detail(
            inventoryItemId
          ),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useInventoryItemLevels = (
  inventoryItemId: string,
  query?: Record<string, any>,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminInventoryLevelListResponse,
      FetchError,
      HttpTypes.AdminInventoryLevelListResponse & {
        location_levels: any[];
      },
      QueryKey
    >,
    'queryKey' | 'queryFn'
  >
) => {
  // Create a stable query key that includes all query parameters
  const stableQuery = useMemo(() => query, [JSON.stringify(query || {})]);
  
  // Force invalidate the query before fetching to ensure fresh data
  useEffect(() => {
    queryClient.invalidateQueries({
      queryKey: inventoryItemLevelsQueryKeys.detail(inventoryItemId)
    });
  }, [inventoryItemId]);
  
  const { data, ...rest } = useQuery({
    queryFn: () =>
      fetchQuery(
        `/vendor/inventory-items/${inventoryItemId}/location-levels`,
        {
          method: 'GET',
          query: stableQuery as {
            [key: string]: string | number;
          },
        }
      ),
    queryKey:
      inventoryItemLevelsQueryKeys.detail(inventoryItemId, stableQuery),
    // Set staleTime to 0 to ensure data is always refetched when the component mounts
    staleTime: 0,
    // Refetch on window focus to ensure we always have the latest data
    refetchOnWindowFocus: true,
    // Always refetch on mount to ensure fresh data
    refetchOnMount: true,
    ...options,
  });

  return { ...data, ...rest };
};

export const useUpdateInventoryLevel = (
  inventoryItemId: string,
  locationId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminInventoryItemResponse,
    FetchError,
    HttpTypes.AdminUpdateInventoryLevel
  >
) => {
  return useMutation({
    mutationFn: (
      payload: HttpTypes.AdminUpdateInventoryLevel
    ) =>
      fetchQuery(
        `/vendor/inventory-items/${inventoryItemId}/location-levels/${locationId}`,
        { method: 'POST', body: payload }
      ),
    onSuccess: (data, variables, context) => {
      // Get the current data from the cache before invalidating
      const previousData = queryClient.getQueryData<HttpTypes.AdminInventoryItemResponse>(
        inventoryItemsQueryKeys.detail(inventoryItemId)
      );
      
      // Calculate updated stocked and reserved quantities
      // Use type assertion since these properties might not be in the standard type
      let updatedStockedQuantity = (data?.inventory_item as any)?.stocked_quantity;
      let updatedReservedQuantity = (data?.inventory_item as any)?.reserved_quantity;
      
      // If the response doesn't include these values, try to calculate them from location levels
      if (data?.inventory_item?.location_levels) {
        // Calculate totals from location levels if not provided directly
        if (updatedStockedQuantity === undefined) {
          updatedStockedQuantity = data.inventory_item.location_levels.reduce(
            (sum, level) => sum + (level.stocked_quantity || 0), 
            0
          );
        }
        
        if (updatedReservedQuantity === undefined) {
          updatedReservedQuantity = data.inventory_item.location_levels.reduce(
            (sum, level) => sum + (level.reserved_quantity || 0), 
            0
          );
        }
      }
      
      // Update the cache with merged data to preserve all important information
      if (previousData?.inventory_item && data?.inventory_item) {
        // Create a merged inventory item with all data preserved
        // Use type assertion to handle custom properties
        const mergedInventoryItem = {
          ...previousData.inventory_item,
          ...data.inventory_item,
          // Preserve variant from previous data if not in the response
          variant: (data.inventory_item as any).variant || (previousData.inventory_item as any).variant,
          // Ensure stocked and reserved quantities are updated
          stocked_quantity: updatedStockedQuantity,
          reserved_quantity: updatedReservedQuantity,
        };
        
        // Create the final merged response
        const mergedData: HttpTypes.AdminInventoryItemResponse = {
          ...data,
          inventory_item: mergedInventoryItem,
        };
        
        // Update the cache with our merged data
        queryClient.setQueryData(
          inventoryItemsQueryKeys.detail(inventoryItemId),
          mergedData
        );
      }
      
      // Invalidate all inventory-related queries
      queryClient.invalidateQueries({
        queryKey: inventoryItemsQueryKeys.lists(),
      });
      
      // Invalidate the specific inventory item detail
      queryClient.invalidateQueries({
        queryKey: inventoryItemsQueryKeys.detail(inventoryItemId),
      });
      
      // Force an immediate refetch of the inventory item detail
      queryClient.refetchQueries({
        queryKey: inventoryItemsQueryKeys.detail(inventoryItemId),
        exact: true,
      });
      
      // Invalidate inventory levels
      queryClient.invalidateQueries({
        queryKey: inventoryItemLevelsQueryKeys.detail(inventoryItemId),
      });
      
      // Invalidate variant-related queries to ensure they're refreshed
      queryClient.invalidateQueries({
        queryKey: variantsQueryKeys.lists(),
      });
      
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useBatchInventoryItemLocationLevels = (
  inventoryItemId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminBatchInventoryItemLocationLevelsResponse,
    FetchError,
    HttpTypes.AdminBatchInventoryItemLocationLevels
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      fetchQuery(
        `/vendor/inventory-items/${inventoryItemId}/location-levels`,
        { method: 'POST', body: payload }
      ),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: inventoryItemsQueryKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey:
          inventoryItemsQueryKeys.detail(inventoryItemId),
      });
      queryClient.invalidateQueries({
        queryKey:
          inventoryItemLevelsQueryKeys.detail(
            inventoryItemId
          ),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useBatchInventoryItemsLocationLevels = (
  options?: UseMutationOptions<
    HttpTypes.AdminBatchInventoryItemsLocationLevelsResponse,
    FetchError,
    HttpTypes.AdminBatchInventoryItemsLocationLevels
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.inventoryItem.batchInventoryItemsLocationLevels(
        payload
      ),
    onSuccess: (data, variables, context) => {
      // Create a set of all affected inventory item IDs
      const affectedItemIds = new Set<string>();
      
      // Track all items affected by the batch operation
      if (variables?.create) {
        variables.create.forEach(item => {
          if (item.inventory_item_id) {
            affectedItemIds.add(item.inventory_item_id);
          }
        });
      }
      
      if (variables?.update) {
        variables.update.forEach(item => {
          if (item.inventory_item_id) {
            affectedItemIds.add(item.inventory_item_id);
          }
        });
      }
      
      if (variables?.delete) {
        // For delete operations, we need to find the inventory item IDs
        // by looking at the level IDs in the cache
        const allLists = queryClient.getQueriesData<HttpTypes.AdminInventoryItemListResponse>({
          queryKey: inventoryItemsQueryKeys.lists(),
        });
        
        allLists.forEach(([_, listData]) => {
          if (listData?.inventory_items) {
            listData.inventory_items.forEach(item => {
              if (item.location_levels) {
                item.location_levels.forEach(level => {
                  if (variables.delete.includes(level.id)) {
                    affectedItemIds.add(item.id);
                  }
                });
              }
            });
          }
        });
      }
      
      // Update the cache for each affected item
      affectedItemIds.forEach(itemId => {
        // Get the current item data from the cache
        const itemData = queryClient.getQueryData<HttpTypes.AdminInventoryItemResponse>(
          inventoryItemsQueryKeys.detail(itemId)
        );
        
        if (itemData?.inventory_item) {
          // Create a copy of the item to update
          const updatedItem = { ...itemData.inventory_item };
          const updatedLevels = [...(updatedItem.location_levels || [])];
          
          // Process creates and updates
          if (variables?.create) {
            variables.create
              .filter(level => level.inventory_item_id === itemId)
              .forEach(level => {
                // Use type assertion to any to avoid TypeScript errors
                updatedLevels.push({
                  id: `temp_${Date.now()}_${Math.random()}`,
                  inventory_item_id: itemId,
                  location_id: level.location_id,
                  stocked_quantity: level.stocked_quantity || 0,
                  reserved_quantity: 0,
                  incoming_quantity: 0,
                  available_quantity: (level.stocked_quantity || 0) - 0
                } as any);
              });
          }
          
          if (variables?.update) {
            variables.update
              .filter(level => level.inventory_item_id === itemId)
              .forEach(level => {
                // Find and update the level
                const levelIndex = updatedLevels.findIndex(l => l.id === level.id);
                if (levelIndex >= 0) {
                  updatedLevels[levelIndex] = {
                    ...updatedLevels[levelIndex],
                    stocked_quantity: level.stocked_quantity || 0,
                  };
                }
              });
          }
          
          if (variables?.delete) {
            // Remove deleted levels
            const newLevels = updatedLevels.filter(level => !variables.delete.includes(level.id));
            updatedItem.location_levels = newLevels;
          } else {
            updatedItem.location_levels = updatedLevels;
          }
          
          // Recalculate totals
          const totalStocked = updatedItem.location_levels.reduce(
            (sum, level) => sum + (level.stocked_quantity || 0),
            0
          );
          
          const totalReserved = updatedItem.location_levels.reduce(
            (sum, level) => sum + (level.reserved_quantity || 0),
            0
          );
          
          // Update the item totals
          (updatedItem as any).stocked_quantity = totalStocked;
          (updatedItem as any).reserved_quantity = totalReserved;
          
          // Update the cache
          queryClient.setQueryData(
            inventoryItemsQueryKeys.detail(itemId),
            {
              ...itemData,
              inventory_item: updatedItem,
            }
          );
          
          // Also update the item in any lists
          const listQueries = queryClient.getQueriesData<HttpTypes.AdminInventoryItemListResponse>({
            queryKey: inventoryItemsQueryKeys.lists(),
          });
          
          listQueries.forEach(([queryKey, queryData]) => {
            if (queryData?.inventory_items) {
              const updatedItems = queryData.inventory_items.map(item => {
                if (item.id === itemId) {
                  return {
                    ...item,
                    location_levels: updatedItem.location_levels,
                    stocked_quantity: (updatedItem as any).stocked_quantity,
                    reserved_quantity: (updatedItem as any).reserved_quantity,
                  };
                }
                return item;
              });
              
              queryClient.setQueryData(queryKey, {
                ...queryData,
                inventory_items: updatedItems,
              });
            }
          });
        }
      });
      
      // Invalidate all inventory items
      queryClient.invalidateQueries({
        queryKey: inventoryItemsQueryKeys.all,
      });
      
      // Invalidate all inventory item details
      queryClient.invalidateQueries({
        queryKey: inventoryItemsQueryKeys.details(),
      });
      
      // Invalidate all inventory item levels
      queryClient.invalidateQueries({
        queryKey: inventoryItemLevelsQueryKeys.all,
      });
      
      // Invalidate variants lists as they may display inventory information
      queryClient.invalidateQueries({
        queryKey: variantsQueryKeys.lists(),
      });
      
      // If we have specific item IDs in the payload, invalidate them individually
      if (variables && variables.create) {
        variables.create.forEach(item => {
          if (item.inventory_item_id) {
            queryClient.invalidateQueries({
              queryKey: inventoryItemsQueryKeys.detail(item.inventory_item_id),
            });
            queryClient.invalidateQueries({
              queryKey: inventoryItemLevelsQueryKeys.detail(item.inventory_item_id),
            });
          }
        });
      }
      
      if (variables && variables.update) {
        variables.update.forEach(item => {
          if (item.inventory_item_id) {
            queryClient.invalidateQueries({
              queryKey: inventoryItemsQueryKeys.detail(item.inventory_item_id),
            });
            queryClient.invalidateQueries({
              queryKey: inventoryItemLevelsQueryKeys.detail(item.inventory_item_id),
            });
          }
        });
      }
      
      // Force refetch for affected items
      affectedItemIds.forEach(itemId => {
        queryClient.refetchQueries({
          queryKey: inventoryItemsQueryKeys.detail(itemId),
          exact: true,
        });
      });
      
      // Force refetch for inventory lists
      queryClient.refetchQueries({
        queryKey: inventoryItemsQueryKeys.lists(),
      });
      
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};
