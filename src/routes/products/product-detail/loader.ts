import { LoaderFunctionArgs } from 'react-router-dom';

import { productsQueryKeys } from '../../../hooks/api/products';
import { fetchQuery } from '../../../lib/client';
import { queryClient } from '../../../lib/query-client';
import { PRODUCT_DETAIL_FIELDS } from './constants';

// Define interfaces for inventory data
interface InventoryItem {
  id: string;
  inventory_item_id: string;
  variant_id: string;
}

interface ProductVariant {
  id: string;
  title: string;
  sku: string | null;
  inventory_quantity: number;
  inventory_items?: InventoryItem[];
  // Additional fields we'll add during processing
  available_quantity?: number;
  stocked_quantity?: number;
  reserved_quantity?: number;
}

interface InventoryDetail {
  id: string;
  stocked_quantity: number;
  reserved_quantity: number;
  available_quantity: number;
}

interface InventoryMap {
  [key: string]: InventoryDetail;
}

const productDetailQuery = (id: string) => ({
  queryKey: productsQueryKeys.detail(id, {
    fields: PRODUCT_DETAIL_FIELDS,
  }),
  queryFn: async () => {
    // Get product with all variants and inventory item IDs
    const productResponse = await fetchQuery(`/vendor/products/${id}`, {
      method: 'GET',
    });

    // If we have variants with inventory item IDs, fetch their inventory details
    if (productResponse?.product?.variants?.length) {
      // Extract inventory item IDs from all variants
      const inventoryItemIds = productResponse.product.variants
        .flatMap((variant: ProductVariant) => 
          variant.inventory_items?.map((item: InventoryItem) => item.inventory_item_id) || []
        )
        .filter((id: string) => id);

      // If we have inventory item IDs, fetch their details
      // Fetch inventory details for all variants
      
      if (inventoryItemIds.length > 0) {
        try {

          

          
          // FIXED: Use the correct batch endpoint with explicit fields query parameter
          const inventoryResponse = await fetchQuery('/vendor/inventory-items', {
            method: 'GET',
            query: {
              inventory_item_id: inventoryItemIds.join(','),
              fields: 'id,stocked_quantity,reserved_quantity,location_levels', // Add location_levels to fields
              expand: 'location_levels', // Ask for expanded location levels
              limit: 100
            }
          });
          


          // Create a map of inventory details by ID for easy lookup
          const inventoryMap: InventoryMap = {};
          if (inventoryResponse?.inventory_items?.length) {

            
            // Calculate quantities for each inventory item
            inventoryResponse.inventory_items.forEach((item: any) => {
              // Try to get quantities from the item directly first
              let stocked = 0;
              let reserved = 0;
              
              // First try getting quantities from location_levels if available
              if (item.location_levels?.length) {
                item.location_levels.forEach((level: any) => {
                  stocked += Number(level.stocked_quantity || 0);
                  reserved += Number(level.reserved_quantity || 0);
                });

              } 
              // Then fall back to direct properties
              else {
                stocked = typeof item.stocked_quantity === 'number' ? item.stocked_quantity : 0;
                reserved = typeof item.reserved_quantity === 'number' ? item.reserved_quantity : 0;

              }
              
              // Calculate available quantity
              const available = Math.max(0, stocked - reserved);

              
              // Store in map using the ID that matches the inventory_item_id from variant.inventory_items
              inventoryMap[item.id] = {
                id: item.id,
                stocked_quantity: stocked,
                reserved_quantity: reserved,
                available_quantity: available
              };
            });
            

          } else {

          }

          // Add inventory details to each variant

          
          productResponse.product.variants = productResponse.product.variants.map((variant: ProductVariant) => {


            
            // Safe check for inventory items array and its length
            if (variant.inventory_items && variant.inventory_items.length > 0) {

              
              const inventoryItemId = variant.inventory_items[0].inventory_item_id;

              
              // Use the exact inventory_item_id for lookup
              
              if (inventoryMap[inventoryItemId]) {

                
                variant.available_quantity = inventoryMap[inventoryItemId].available_quantity;
                variant.stocked_quantity = inventoryMap[inventoryItemId].stocked_quantity;
                variant.reserved_quantity = inventoryMap[inventoryItemId].reserved_quantity;
                

              } else {

              }
            } else {

            }
            return variant;
          });
          

        } catch (error) {
          console.error('Failed to fetch inventory details:', error);
        }
      }
    }

    return productResponse;
  },
});

export const productLoader = async ({
  params,
}: LoaderFunctionArgs) => {
  const id = params.id;
  const query = productDetailQuery(id!);

  const response = await queryClient.ensureQueryData({
    ...query,
    staleTime: 90000,
  });

  return response;
};
