import { zodResolver } from '@hookform/resolvers/zod';
import { HttpTypes } from '@medusajs/types';
import { Button, toast } from '@medusajs/ui';
import { useRef } from 'react';
import { DefaultValues, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { DataGrid } from '../../../../../components/data-grid';
import {
  RouteFocusModal,
  useRouteModal,
} from '../../../../../components/modals';
import { KeyboundForm } from '../../../../../components/utilities/keybound-form';
import { useBatchInventoryItemsLocationLevels } from '../../../../../hooks/api';
import { castNumber } from '../../../../../lib/cast-number';
import { useInventoryStockColumns } from '../../hooks/use-inventory-stock-columns';
import { inventoryItemsQueryKeys } from '../../../../../hooks/api/inventory';
import {
  InventoryItemSchema,
  InventoryLocationsSchema,
  InventoryStockSchema,
} from '../../schema';

type InventoryStockFormProps = {
  items: HttpTypes.AdminInventoryItem[];
  locations: HttpTypes.AdminStockLocation[];
};

export const InventoryStockForm = ({
  items,
  locations,
}: InventoryStockFormProps) => {
  const { t } = useTranslation();
  const { setCloseOnEscape, handleSuccess } = useRouteModal();
  const queryClient = useQueryClient();

  const initialValues = useRef(
    getDefaultValues(items, locations)
  );

  const form = useForm<InventoryStockSchema>({
    defaultValues: getDefaultValues(items, locations),
    resolver: zodResolver(InventoryStockSchema),
  });

  const columns = useInventoryStockColumns(locations);

  const { mutateAsync, isPending } =
    useBatchInventoryItemsLocationLevels();

  const onSubmit = form.handleSubmit(async (data) => {
    const payload: HttpTypes.AdminBatchInventoryItemsLocationLevels =
      {
        create: [],
        update: [],
        delete: [],
        force: true,
      };

    // Track which inventory items are being modified for targeted refresh
    const modifiedItemIds = new Set<string>();

    for (const [inventory_item_id, item] of Object.entries(
      data.inventory_items
    )) {
      for (const [location_id, level] of Object.entries(
        item.locations
      )) {
        if (level.id) {
          const wasChecked =
            initialValues.current?.inventory_items?.[
              inventory_item_id
            ]?.locations?.[location_id]?.checked;

          if (wasChecked && !level.checked) {
            payload.delete.push(level.id);
            modifiedItemIds.add(inventory_item_id);
          } else {
            const newQuantity =
              level.quantity !== ''
                ? castNumber(level.quantity)
                : 0;
            const originalQuantity =
              initialValues.current?.inventory_items?.[
                inventory_item_id
              ]?.locations?.[location_id]?.quantity;

            if (newQuantity !== originalQuantity) {
              payload.update.push({
                id: level.id,
                inventory_item_id,
                location_id,
                stocked_quantity: newQuantity,
              });
              modifiedItemIds.add(inventory_item_id);
            }
          }
        }

        if (!level.id && level.quantity !== '') {
          payload.create.push({
            inventory_item_id,
            location_id,
            stocked_quantity: castNumber(level.quantity),
          });
          modifiedItemIds.add(inventory_item_id);
        }
      }
    }

    // Only proceed if we have changes to make
    if (payload.create.length || payload.update.length || payload.delete.length) {
      try {
        // First, make a local copy of the current items data for updating the UI
        const updatedItems = [...items].map(item => {
          // Only process items that are being modified
          if (!modifiedItemIds.has(item.id)) {
            return item;
          }
          
          // Create a deep copy to avoid mutating the original
          const updatedItem = { ...item };
          const updatedLevels = [...(updatedItem.location_levels || [])];
          
          // Process updates
          for (const update of payload.update) {
            if (update.inventory_item_id === item.id) {
              // Find the level to update
              const levelIndex = updatedLevels.findIndex(l => l.id === update.id);
              if (levelIndex >= 0) {
                // Update the level with new stocked quantity
                updatedLevels[levelIndex] = {
                  ...updatedLevels[levelIndex],
                  stocked_quantity: update.stocked_quantity,
                };
              }
            }
          }
          
          // Process creates
          for (const create of payload.create) {
            if (create.inventory_item_id === item.id) {
              // Add a temporary ID for new levels
              updatedLevels.push({
                id: `temp_${Date.now()}_${Math.random()}`,
                inventory_item_id: item.id,
                location_id: create.location_id,
                stocked_quantity: create.stocked_quantity,
                reserved_quantity: 0,
                incoming_quantity: 0,
                available_quantity: create.stocked_quantity
              });
            }
          }
          
          // Process deletes
          for (const deleteId of payload.delete) {
            const levelIndex = updatedLevels.findIndex(l => l.id === deleteId);
            if (levelIndex >= 0) {
              updatedLevels.splice(levelIndex, 1);
            }
          }
          
          // Update the item with the new levels
          updatedItem.location_levels = updatedLevels;
          
          // Recalculate totals
          const totalStocked = updatedLevels.reduce((sum, level) => sum + (level.stocked_quantity || 0), 0);
          const totalReserved = updatedLevels.reduce((sum, level) => sum + (level.reserved_quantity || 0), 0);
          
          // Update the item totals
          (updatedItem as any).stocked_quantity = totalStocked;
          (updatedItem as any).reserved_quantity = totalReserved;
          
          return updatedItem;
        });
        
        // Now perform the actual API call
        await mutateAsync(payload, {
          onSuccess: () => {
            toast.success(t('inventory.stock.successToast'));
            
            // Update the initialValues ref to match the current state
            // This ensures that future edits are compared against the updated values
            initialValues.current = form.getValues();
            
            // Force re-render with updated data before closing
            // This keeps the UI in sync with our changes
            form.reset(getDefaultValues(updatedItems, locations));
            
            // Force a refresh of all inventory data
            queryClient.invalidateQueries({
              queryKey: inventoryItemsQueryKeys.all,
              refetchType: 'all',
            });
            
            // Force refetch for inventory lists with active refresh
            queryClient.refetchQueries({
              queryKey: inventoryItemsQueryKeys.lists(),
              type: 'active',
            });
            
            // Slight delay before closing to ensure UI updates
            setTimeout(() => {
              handleSuccess();
            }, 300); // Longer delay to ensure data is refreshed
          },
          onError: (error) => {
            toast.error(error.message);
          },
        });
      } catch (error: any) {
        toast.error(error.message || 'An error occurred while updating inventory');
      }
    } else {
      // No changes to save
      toast.info(t('inventory.stock.noChangesToast') || 'No changes to save');
      handleSuccess();
    }
  });

  return (
    <RouteFocusModal.Form form={form}>
      <KeyboundForm
        onSubmit={onSubmit}
        className='flex size-full flex-col'
      >
        <RouteFocusModal.Header />
        <RouteFocusModal.Body className='size-full flex-1 overflow-y-auto'>
          <DataGrid
            columns={columns}
            data={items}
            state={form}
            onEditingChange={(editing) => {
              setCloseOnEscape(!editing);
            }}
          />
        </RouteFocusModal.Body>
        <RouteFocusModal.Footer>
          <div className='flex items-center justify-end gap-2'>
            <RouteFocusModal.Close asChild>
              <Button
                variant='secondary'
                size='small'
                type='button'
              >
                {t('actions.cancel')}
              </Button>
            </RouteFocusModal.Close>
            <Button
              type='submit'
              size='small'
              isLoading={isPending}
            >
              {t('actions.save')}
            </Button>
          </div>
        </RouteFocusModal.Footer>
      </KeyboundForm>
    </RouteFocusModal.Form>
  );
};

function getDefaultValues(
  items: HttpTypes.AdminInventoryItem[],
  locations: HttpTypes.AdminStockLocation[]
): DefaultValues<InventoryStockSchema> {
  return {
    inventory_items: items.reduce(
      (acc, item) => {
        const locationsMap = locations.reduce(
          (locationAcc, location) => {
            const level = item.location_levels?.find(
              (level) => level.location_id === location.id
            );

            locationAcc[location.id] = {
              id: level?.id,
              quantity:
                typeof level?.stocked_quantity === 'number'
                  ? level?.stocked_quantity
                  : '',
              checked: !!level,
              disabledToggle:
                (level?.incoming_quantity || 0) > 0 ||
                (level?.reserved_quantity || 0) > 0,
            };
            return locationAcc;
          },
          {} as InventoryLocationsSchema
        );

        acc[item.id] = { locations: locationsMap };
        return acc;
      },
      {} as Record<string, InventoryItemSchema>
    ),
  };
}
