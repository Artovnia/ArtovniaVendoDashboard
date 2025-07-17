import { ProductVariantDTO } from '@medusajs/types';

import { InventoryActions } from './inventory-actions';
import { PlaceholderCell } from '../../../../../components/table/table-cells/common/placeholder-cell';
import { createColumnHelper } from '@tanstack/react-table';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export interface ExtendedInventoryItem {
  required_quantity: number;
  variant: ProductVariantDTO & {
    inventory_items?: any[];
    id: string;
  };
  id?: string;
  inventory_item_id?: string;
}

const columnHelper =
  createColumnHelper<ExtendedInventoryItem>();

export const useInventoryTableColumns = () => {
  const { t } = useTranslation();

  return useMemo(
    () => [
      columnHelper.accessor('variant.title', {
        header: t('fields.title'),
        cell: ({ getValue }) => {
          const title = getValue() as string;

          if (!title) {
            return <PlaceholderCell />;
          }

          return (
            <div className='flex size-full items-center overflow-hidden'>
              <span className='truncate'>{title}</span>
            </div>
          );
        },
      }),
      columnHelper.accessor('variant.sku', {
        header: t('fields.sku'),
        cell: ({ getValue }) => {
          const sku = getValue() as string;

          if (!sku) {
            return <PlaceholderCell />;
          }

          return (
            <div className='flex size-full items-center overflow-hidden'>
              <span className='truncate'>{sku}</span>
            </div>
          );
        },
      }),
      columnHelper.accessor('required_quantity', {
        header: t('fields.requiredQuantity'),
        cell: ({ getValue }) => {
          const quantity = getValue() as number;

          if (Number.isNaN(quantity)) {
            return <PlaceholderCell />;
          }

          return (
            <div className='flex size-full items-center overflow-hidden'>
              <span className='truncate'>{quantity}</span>
            </div>
          );
        },
      }),
      columnHelper.display({
        id: 'inventory_quantity',
        header: t('fields.inventory'),
        cell: ({
          row: {
            original,
          },
        }) => {
          // Safely access variant and inventory_items
          const variant = original?.variant;
          if (!variant || !variant.inventory_items || !variant.inventory_items.length) {
            return <PlaceholderCell />;
          }

          const quantity = variant.inventory_items.length;

          return (
            <div className='flex size-full items-center overflow-hidden'>
              <span className='truncate'>
                {`${quantity} available`}
              </span>
            </div>
          );
        },
      }),
      columnHelper.display({
        id: 'actions',
        cell: ({ row }) => {
          const originalData = row.original;
          
          // Extract inventory item ID using a consistent approach
          let inventoryItemId = null;
          
          // Priority 1: Check if the inventory_item_id property exists directly on the original data
          if (originalData.inventory_item_id && 
              typeof originalData.inventory_item_id === 'string' && 
              originalData.inventory_item_id.startsWith('iitem_')) {
            inventoryItemId = originalData.inventory_item_id;
          }
          // Priority 2: Check if the id property is a valid inventory item ID
          else if (originalData.id && 
                   typeof originalData.id === 'string' && 
                   originalData.id.startsWith('iitem_')) {
            inventoryItemId = originalData.id;
          }
          // Priority 3: Look for inventory_item_id in the variant's inventory_items array
          else if (originalData.variant?.inventory_items && 
                   Array.isArray(originalData.variant.inventory_items)) {
            // First try to find an item with inventory_item_id
            const inventoryItem = originalData.variant.inventory_items.find(item => 
              item.inventory_item_id && 
              typeof item.inventory_item_id === 'string' && 
              item.inventory_item_id.startsWith('iitem_')
            );
            
            if (inventoryItem) {
              inventoryItemId = inventoryItem.inventory_item_id;
            }
            // If no inventory_item_id, try to find an item with id
            else {
              const itemWithId = originalData.variant.inventory_items.find(item => 
                item.id && 
                typeof item.id === 'string' && 
                item.id.startsWith('iitem_')
              );
              
              if (itemWithId) {
                inventoryItemId = itemWithId.id;
              }
            }
          }
          
          // Pass both the variant ID and inventory item ID to InventoryActions
          return (
            <InventoryActions 
              item={originalData.variant?.id} 
              inventoryItemId={inventoryItemId} 
            />
          );
        },
      }),
    ],
    [t]
  );
};
