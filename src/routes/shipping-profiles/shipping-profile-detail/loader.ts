import { LoaderFunctionArgs } from "react-router-dom"

import { shippingProfileQueryKeys } from "../../../hooks/api/shipping-profiles"
import { fetchQuery } from "../../../lib/client"
import { queryClient } from "../../../lib/query-client"

const shippingProfileQuery = (id: string) => ({
  queryKey: shippingProfileQueryKeys.detail(id),
  queryFn: async () => {
    const response = await fetchQuery(`/vendor/shipping-profiles/${id}`, {
      method: "GET",
    });
    console.log('API response in loader:', response);
    // Return the full response, not just shipping_profile
    return response;
  },
})

export const shippingProfileLoader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.shipping_profile_id
  const query = shippingProfileQuery(id!)

  return queryClient.ensureQueryData(query)
}
