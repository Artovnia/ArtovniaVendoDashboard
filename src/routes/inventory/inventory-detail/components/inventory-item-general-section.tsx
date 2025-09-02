import { Container, Heading } from '@medusajs/ui';
import { HttpTypes } from '@medusajs/types';
import { PencilSquare } from '@medusajs/icons';
import { useTranslation } from 'react-i18next';

import { ActionMenu } from '../../../../components/common/action-menu';
import { SectionRow } from '../../../../components/common/section';

// Extend the inventory item type with additional properties
type InventoryItemType = HttpTypes.AdminInventoryItemResponse['inventory_item'];

// Export the interface so it can be used by other components
export interface ExtendedInventoryItem extends InventoryItemType {
  title?: string;
  stocked_quantity?: number;
  reserved_quantity?: number;
}

type InventoryItemGeneralSectionProps = {
  inventoryItem: ExtendedInventoryItem;
};
export const InventoryItemGeneralSection = ({
  inventoryItem,
}: InventoryItemGeneralSectionProps) => {
  const { t } = useTranslation();
  return (
    <Container className='divide-y p-0'>
      <div className='flex items-center justify-between px-6 py-4'>
        <Heading>
          {inventoryItem.title ?? inventoryItem.sku}{' '}
          {t('fields.details')}
        </Heading>
        <ActionMenu
          groups={[
            {
              actions: [
                {
                  icon: <PencilSquare />,
                  label: t('actions.edit'),
                  to: 'edit',
                },
              ],
            },
          ]}
        />
      </div>
      <SectionRow
        title={t('fields.sku')}
        value={inventoryItem.sku ?? '-'}
      />
      <SectionRow
        title={t('fields.inStock')}
        value={getQuantityFormat(
          inventoryItem.stocked_quantity,
          t,
          inventoryItem.location_levels?.length
        )}
      />

      <SectionRow
        title={t('inventory.reserved')}
        value={getQuantityFormat(
          inventoryItem.reserved_quantity,
          t,
          inventoryItem.location_levels?.length
        )}
      />
      <SectionRow
        title={t('inventory.available')}
        value={getQuantityFormat(
          calculateAvailableQuantity(
            inventoryItem.stocked_quantity,
            inventoryItem.reserved_quantity
          ),
          t,
          inventoryItem.location_levels?.length
        )}
      />
    </Container>
  );
};

const getQuantityFormat = (
  quantity: number | undefined,
  t: any,
  locations?: number
): string => {
  if (quantity !== undefined && !isNaN(quantity)) {
    const locationCount = locations ?? 0;
    return t('products.variant.tableItem', {
      count: locationCount,
      availableCount: quantity,
      locationCount: locationCount
    });
  }

  return '-';
};

// Helper function to safely calculate available quantity
const calculateAvailableQuantity = (
  stocked?: number,
  reserved?: number
): number | undefined => {
  if (stocked === undefined) return undefined;
  const reservedValue = reserved || 0;
  return stocked - reservedValue;
};
