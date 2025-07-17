import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';

import { Buildings } from '@medusajs/icons';

import { ActionMenu } from '../../../../../components/common/action-menu';
import { useVariant } from '../../../../../hooks/api/product-variants';

export const InventoryActions = ({
  item,
  inventoryItemId,
}: {
  item?: string;
  inventoryItemId?: string;
}) => {
  const { t } = useTranslation();
  const [targetItemId, setTargetItemId] = useState<string | null>(null);
  
  // Directly use inventory item ID if available
  useEffect(() => {
    if (inventoryItemId && inventoryItemId.startsWith('iitem_')) {
      setTargetItemId(inventoryItemId);
    } else if (item) {
      setTargetItemId(item);
    }
  }, [item, inventoryItemId]);
  
  // If no valid ID is available, don't render the menu
  if (!targetItemId) {
    return null;
  }
  
  // Only navigate to inventory if we have a valid inventory item ID (starts with iitem_)
  // Otherwise fallback to variant edit page
  const navigationTarget = targetItemId.startsWith('iitem_') 
    ? `/inventory/${targetItemId}` 
    : `edit?tab=inventory`;
  
  return (
    <ActionMenu
      groups={[
        {
          actions: [
            {
              icon: <Buildings />,
              label: t(
                'products.variant.inventory.navigateToItem'
              ),
              // This action should navigate to the inventory item detail page
              // but only if we have a valid inventory item ID
              to: navigationTarget,
            },
          ],
        },
      ]}
    />
  );
};
