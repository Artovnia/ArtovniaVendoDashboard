import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

import { useProduct } from '../../../hooks/api/products';
import { ProductVariantDTO } from '@medusajs/types';
import { AdminProductVariantInventoryItemLink } from '@medusajs/medusa/dist/types/inventory';
import { Spinner } from '@medusajs/ui';

import { TwoColumnPageSkeleton } from '../../../components/common/skeleton';
import { TwoColumnPage } from '../../../components/layout/pages';
import { useDashboardExtension } from '../../../extensions';
import { VariantGeneralSection } from './components/variant-general-section';
import {
  InventorySectionPlaceholder,
  VariantInventorySection,
} from './components/variant-inventory-section';
import { VariantPricesSection } from './components/variant-prices-section';

export const ProductVariantDetail = () => {
  const { id, variant_id } = useParams();
  const navigate = useNavigate();
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  
  // Use a more robust query with error handling
  const { product, isLoading, isError, error, refetch } = useProduct(
    id!,
    {
      fields: '*variants.inventory_items,*variants.inventory_items.inventory,*variants.inventory_items.inventory.location_levels',
    },
    {
      retry: 1, // Limit built-in retries
      retryDelay: 1000,
      onError: (err) => {
        console.error('Error loading product variant:', err);
      }
    }
  );
  
  // Handle automatic retry for 404 errors
  useEffect(() => {
    if (isError && retryCount < 2 && !isRetrying) {
      setIsRetrying(true);
      const timer = setTimeout(() => {
        console.log(`Retrying product fetch (${retryCount + 1}/2)...`);
        refetch().then(() => {
          setIsRetrying(false);
          setRetryCount(prev => prev + 1);
        });
      }, 1500); // Wait 1.5 seconds before retrying
      
      return () => clearTimeout(timer);
    }
  }, [isError, retryCount, refetch, isRetrying]);

  const variant = product?.variants
    ? product?.variants.find(
        (item) => item.id === variant_id
      )
    : null;

  const { getWidgets } = useDashboardExtension();

  // Show loading state during initial load or retries
  if (isLoading || isRetrying) {
    return (
      <TwoColumnPageSkeleton
        mainSections={2}
        sidebarSections={1}
        showJSON
        showMetadata
      />
    );
  }

  // Handle error state after retries have been exhausted
  if (isError && retryCount >= 2) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <h2 className="text-xl font-bold mb-4">Unable to load product variant</h2>
        <p className="text-ui-fg-subtle mb-4">
          The product or variant you're looking for could not be found. It may have been deleted or you may not have permission to view it.
        </p>
        <button 
          onClick={() => navigate('/products')} 
          className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
        >
          Return to products
        </button>
      </div>
    );
  }
  
  // Handle case where product exists but variant is not found
  if (!variant) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <h2 className="text-xl font-bold mb-4">Variant not found</h2>
        <p className="text-ui-fg-subtle mb-4">
          The variant you're looking for could not be found in this product.
        </p>
        <button 
          onClick={() => navigate(`/products/${id}`)} 
          className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
        >
          Return to product
        </button>
      </div>
    );
  }

  return (
    <TwoColumnPage
      data={variant}
      hasOutlet
      widgets={{
        after: getWidgets('product_variant.details.after'),
        before: getWidgets(
          'product_variant.details.before'
        ),
        sideAfter: getWidgets(
          'product_variant.details.side.after'
        ),
        sideBefore: getWidgets(
          'product_variant.details.side.before'
        ),
      }}
    >
      <TwoColumnPage.Main>
        <VariantGeneralSection variant={variant} />
        {!variant.manage_inventory ? (
          <InventorySectionPlaceholder />
        ) : (
          variant.inventory_items && (
            <VariantInventorySection
              inventoryItems={variant.inventory_items.map(
                (i) => {
                  // Create a properly typed variant object that matches the ExtendedInventoryItem.variant type
                  const variantForInventory = {
                    ...(variant as unknown as ProductVariantDTO),
                    inventory_items: variant.inventory_items || [],
                    id: variant.id
                  } as ProductVariantDTO & { inventory_items: any[]; id: string };
                  
                  // Type the inventory item link with the required_quantity property
                  type ExtendedInventoryItemLink = AdminProductVariantInventoryItemLink & {
                    required_quantity?: number;
                    inventory?: any;
                  };
                  
                  const inventoryItemLink = i as ExtendedInventoryItemLink;
                  
                  return {
                    ...(inventoryItemLink.inventory || {}),
                    required_quantity: inventoryItemLink.required_quantity || 0,
                    variant: variantForInventory,
                    id: inventoryItemLink.inventory?.id || inventoryItemLink.inventory_item_id
                  };
                }
              )}
            />
          )
        )}
      </TwoColumnPage.Main>
      <TwoColumnPage.Sidebar>
        <VariantPricesSection variant={variant} />
      </TwoColumnPage.Sidebar>
    </TwoColumnPage>
  );
};
