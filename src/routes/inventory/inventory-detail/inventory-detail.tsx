import { useLoaderData, useParams } from 'react-router-dom';
import { useEffect, useState, useMemo } from 'react';
import { HttpTypes } from '@medusajs/types';

import { TwoColumnPageSkeleton } from '../../../components/common/skeleton';
import { TwoColumnPage } from '../../../components/layout/pages';
import { useInventoryItem } from '../../../hooks/api/inventory';
import { InventoryItemAttributeSection } from './components/inventory-item-attributes/attributes-section';
import { InventoryItemGeneralSection } from './components/inventory-item-general-section';
import { InventoryItemLocationLevelsSection } from './components/inventory-item-location-levels';
import { InventoryItemReservationsSection } from './components/inventory-item-reservations';
import { InventoryItemVariantsSection } from './components/inventory-item-variants/variants-section';
import { VariantAttributesSection } from './components/variant-attributes-section';
import { inventoryItemLoader } from './loader';

import { useDashboardExtension } from '../../../extensions';
import { INVENTORY_DETAIL_FIELDS } from './constants';

// Define a type that handles null values in title and includes variants
type SafeInventoryItem = Omit<HttpTypes.AdminInventoryItem, 'title'> & {
  title?: string; // Make title optional string (not null)
  stocked_quantity?: number;
  reserved_quantity?: number;
  variants?: any[];
};

export const InventoryDetail = () => {
  const { id } = useParams();
  // State to store and preserve variant data between renders
  const [cachedVariants, setCachedVariants] = useState<any[]>([]);

  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof inventoryItemLoader>
  >;

  // Configure query options with more conservative settings
  const queryOptions = {
    initialData,
    staleTime: 1000, // Consider data fresh for 1 second
    refetchOnWindowFocus: false, // Don't refetch on window focus to reduce flickering
  };

  const {
    inventory_item,
    isPending: isLoading,
    isError,
    error,
  } = useInventoryItem(
    id!,
    {
      fields: INVENTORY_DETAIL_FIELDS,
    },
    queryOptions
  );

  // Effect to cache variant data when it's available
  useEffect(() => {
    if (inventory_item && (inventory_item as any).variants?.length > 0) {
      setCachedVariants((inventory_item as any).variants);
    }
  }, [inventory_item]);

  // Combine current inventory item with cached variants if needed
  const enhancedInventoryItem = useMemo<SafeInventoryItem | null>(() => {
    if (!inventory_item) return null;
    
    // If the current item has variants, use those
    if ((inventory_item as any).variants?.length > 0) {
      // Convert inventory_item to our safe type that handles null values
      return {
        ...inventory_item,
        title: inventory_item.title || undefined, // Convert null to undefined
        variants: (inventory_item as any).variants
      } as SafeInventoryItem;
    }
    
    // If we have cached variants but the current item doesn't, merge them
    if (cachedVariants.length > 0) {
      return {
        ...inventory_item,
        title: inventory_item.title || undefined, // Convert null to undefined
        variants: cachedVariants
      } as SafeInventoryItem;
    }
    
    // Default case - just convert to safe type
    return {
      ...inventory_item,
      title: inventory_item.title || undefined // Convert null to undefined
    } as SafeInventoryItem;
  }, [inventory_item, cachedVariants]);

  const { getWidgets } = useDashboardExtension();

  if (isLoading || !enhancedInventoryItem) {
    return (
      <TwoColumnPageSkeleton
        showJSON
        mainSections={3}
        sidebarSections={2}
        showMetadata
      />
    );
  }

  if (isError) {
    throw error;
  }

  // At this point enhancedInventoryItem is guaranteed to be non-null
  const item = enhancedInventoryItem as SafeInventoryItem;
  
  return (
    <TwoColumnPage
      widgets={{
        after: getWidgets('inventory_item.details.after'),
        before: getWidgets('inventory_item.details.before'),
        sideAfter: getWidgets(
          'inventory_item.details.side.after'
        ),
        sideBefore: getWidgets(
          'inventory_item.details.side.before'
        ),
      }}
      data={item}
    >
      <TwoColumnPage.Main>
        <InventoryItemGeneralSection
          inventoryItem={item}
        />
        <InventoryItemLocationLevelsSection
          inventoryItem={item}
        />
        <InventoryItemReservationsSection
          inventoryItem={item}
        />
      </TwoColumnPage.Main>
      <TwoColumnPage.Sidebar>
        <InventoryItemVariantsSection
          variants={item.variants || []}
        />
       {/* <InventoryItemAttributeSection
          inventoryItem={item as any}
        /> */}

       {/* {item.variants && item.variants.length > 0 && (
          <VariantAttributesSection
            inventoryItem={item as any}
            variant={{
              id: item.variants[0].id,
              product_id: item.variants[0].product?.id
            }}
          />
        )} */}
      </TwoColumnPage.Sidebar>
    </TwoColumnPage>
  );
};
