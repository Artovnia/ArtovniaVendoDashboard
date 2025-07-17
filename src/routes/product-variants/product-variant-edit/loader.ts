import { LoaderFunctionArgs } from "react-router-dom"

import { productVariantQueryKeys } from "../../../hooks/api"
import { queryClient } from "../../../lib/query-client"
import { fetchQuery } from "../../../lib/client/client"

/**
 * Fetches product variant data using the vendor API endpoint
 * This avoids CORS issues when accessing admin endpoints from the vendor panel
 */
const queryFn = async (id: string, variantId: string) => {
  try {
    console.log(`[DEBUG] Fetching variant ${variantId} for product ${id}`);
    
    // Use the vendor API endpoint instead of the admin API with explicit auth headers
    const result = await fetchQuery(`/vendor/products/${id}/variants/${variantId}`, {
      method: 'GET',
      headers: {
        // The fetchQuery function will automatically add the authorization and publishable API key headers
      }
    });
    
    console.log(`[DEBUG] Successfully fetched variant data:`, result ? 'data received' : 'no data');
    return result;
  } catch (error) {
    console.error(`Error fetching variant ${variantId} for product ${id}:`, error);
    throw error;
  }
}

const editProductVariantQuery = (id: string, variantId: string) => ({
  queryKey: productVariantQueryKeys.detail(variantId),
  queryFn: async () => queryFn(id, variantId),
})

export const editProductVariantLoader = async ({
  params,
  request,
}: LoaderFunctionArgs) => {
  const id = params.id

  const searchParams = new URL(request.url).searchParams
  const searchVariantId = searchParams.get("variant_id")

  const variantId = params.variant_id || searchVariantId

  const query = editProductVariantQuery(id!, variantId || searchVariantId!)

  return (
    queryClient.getQueryData<ReturnType<typeof queryFn>>(query.queryKey) ??
    (await queryClient.fetchQuery(query))
  )
}
