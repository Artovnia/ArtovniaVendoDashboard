import { QueryClient } from '@tanstack/react-query';

import { HttpTypes } from '@medusajs/types';
import { productsQueryKeys } from '../../../hooks/api/products';
import { fetchQuery } from '../../../lib/client';
import { queryClient } from '../../../lib/query-client';

const productsListQuery = () => ({
  queryKey: productsQueryKeys.list({
    limit: 20,
    offset: 0,
    fields: '+thumbnail,+shipping_profile',
  }),
  queryFn: async () => {
    try {
      return await fetchQuery('/vendor/products', {
        method: 'GET',
        query: { limit: 20, offset: 0, fields: '+thumbnail,+shipping_profile' },
      })
    } catch (error: any) {
      // If shipping_profile causes issues, retry without it
      if (error.message?.includes('shipping_profile') || error.status === 500) {
        return await fetchQuery('/vendor/products', {
          method: 'GET',
          query: { limit: 20, offset: 0, fields: '+thumbnail' },
        })
      }
      
      throw error
    }
  },
});

export const productsLoader = (client: QueryClient) => {
  return async () => {
    const query = productsListQuery();

    return (
      queryClient.getQueryData<HttpTypes.AdminProductListResponse>(
        query.queryKey
      ) ?? (await client.fetchQuery(query))
    );
  };
};
