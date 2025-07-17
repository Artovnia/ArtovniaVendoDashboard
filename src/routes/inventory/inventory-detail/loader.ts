import { LoaderFunctionArgs } from 'react-router-dom';

import { inventoryItemsQueryKeys } from '../../../hooks/api/inventory';
import { fetchQuery } from '../../../lib/client';
import { queryClient } from '../../../lib/query-client';
import { INVENTORY_DETAIL_FIELDS } from './constants';

const inventoryDetailQuery = (id: string) => ({
  queryKey: inventoryItemsQueryKeys.detail(id),
  queryFn: async () => {
    // Only proceed if we have a valid inventory item ID (starts with iitem_)
    if (id.startsWith('iitem_')) {
      console.log('Fetching inventory item with ID:', id);
      return fetchQuery(
        `/vendor/inventory-items/${id}?fields=${INVENTORY_DETAIL_FIELDS}`,
        {
          method: 'GET',
        }
      );
    } else {
      // If we don't have a valid inventory item ID, throw an error with a clear message
      console.error('Invalid inventory item ID:', id);
      throw new Error(`Invalid inventory item ID: ${id}. Expected ID to start with 'iitem_'.`);
    }
  },
});

export const inventoryItemLoader = async ({
  params,
}: LoaderFunctionArgs) => {
  const id = params.id;
  const query = inventoryDetailQuery(id!);

  return queryClient.ensureQueryData(query);
};
