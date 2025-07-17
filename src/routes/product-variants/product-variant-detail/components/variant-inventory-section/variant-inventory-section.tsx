import { useTranslation } from 'react-i18next';

import { Buildings, Component } from '@medusajs/icons';
import { Container, Heading } from '@medusajs/ui';

import { ActionMenu } from '../../../../../components/common/action-menu';
import { _DataTable } from '../../../../../components/table/data-table';

import { LinkButton } from '../../../../../components/common/link-button';
import { useDataTable } from '../../../../../hooks/use-data-table';
import {
  ExtendedInventoryItem,
  useInventoryTableColumns,
} from './use-inventory-table-columns';
import { InventoryActions } from './inventory-actions';

const PAGE_SIZE = 20;

type VariantInventorySectionProps = {
  inventoryItems: ExtendedInventoryItem[];
};

export function VariantInventorySection({
  inventoryItems,
}: VariantInventorySectionProps) {
  const { t } = useTranslation();

  const columns = useInventoryTableColumns();

  const { table } = useDataTable({
    data: inventoryItems ?? [],
    columns,
    count: inventoryItems.length,
    enablePagination: true,
    getRowId: (row) => row.variant.id,
    pageSize: PAGE_SIZE,
  });

  const hasKit = inventoryItems.length > 1;

  return (
    <Container className='divide-y p-0'>
      <div className='flex items-center justify-between px-6 py-4'>
        <div className='flex items-center gap-2'>
          <Heading level='h2'>
            {t('fields.inventoryItems')}
          </Heading>
        </div>
        <div className='flex items-center gap-x-4'>
          <ActionMenu
            groups={[
              {
                actions: [
                  {
                    label: t(
                      hasKit
                        ? 'products.variant.inventory.manageKit'
                        : 'products.variant.inventory.manageItems'
                    ),
                    to: 'manage-items',
                    icon: hasKit ? (
                      <Component />
                    ) : (
                      <Buildings />
                    ),
                  },
                ],
              },
            ]}
          />
        </div>
      </div>

      <_DataTable
        table={table}
        columns={[
          ...columns.slice(0, -1),
          {
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
              // Let InventoryActions handle the decision about where to navigate
              return (
                <InventoryActions 
                  item={originalData.variant?.id} 
                  inventoryItemId={inventoryItemId} 
                />
              );
            },
          }
        ]}
        pageSize={PAGE_SIZE}
        count={inventoryItems.length}
        navigateTo={(row) => {
          // First check if row exists
          if (!row) {
            console.error('Row is undefined in navigateTo');
            return '#'; // Return a safe fallback URL
          }
          
          // Access the data through row.original
          const originalData = row.original;
          console.log('Navigation data:', originalData);
          
          // Extract inventory item ID using a consistent approach
          let inventoryItemId = null;
          
          // Priority 1: Check if the inventory_item_id property exists directly on the original data
          if (originalData.inventory_item_id && 
              typeof originalData.inventory_item_id === 'string' && 
              originalData.inventory_item_id.startsWith('iitem_')) {
            inventoryItemId = originalData.inventory_item_id;
            console.log('Found inventory_item_id directly on data:', inventoryItemId);
          }
          // Priority 2: Check if the id property is a valid inventory item ID
          else if (originalData.id && 
                   typeof originalData.id === 'string' && 
                   originalData.id.startsWith('iitem_')) {
            inventoryItemId = originalData.id;
            console.log('Using id as inventory item ID:', inventoryItemId);
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
              console.log('Found inventory item ID in variant.inventory_items:', inventoryItemId);
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
                console.log('Found inventory item with id in variant.inventory_items:', inventoryItemId);
              }
            }
          }
          
          // If we found a valid inventory item ID, navigate to the inventory detail page
          if (inventoryItemId) {
            return `/inventory/${inventoryItemId}`;
          }
          
          // If we can't find a valid inventory item ID, navigate to the variant's edit page
          // NEVER use variant IDs for inventory navigation as the backend doesn't support it
          const variantId = originalData.variant?.id;
          if (variantId) {
            console.warn('No valid inventory item ID found, falling back to variant edit page');
            return `edit?tab=inventory`;
          }
          
          // Ultimate fallback
          console.error('No valid navigation target found');
          return '#';
        }}
      />
    </Container>
  );
}

export function InventorySectionPlaceholder() {
  const { t } = useTranslation();

  return (
    <Container className='divide-y p-0'>
      <div className='flex items-center justify-between px-6 py-4'>
        <div className='flex flex-col gap-1'>
          <Heading level='h2'>
            {t('fields.inventoryItems')}
          </Heading>
          <span className='txt-small text-ui-fg-subtle'>
            {t('products.variant.inventory.notManagedDesc')}
          </span>
        </div>
        <div className='flex items-center gap-x-4'>
          <LinkButton to='edit'>
            {t('products.variant.edit.header')}
          </LinkButton>
        </div>
      </div>
    </Container>
  );
}
