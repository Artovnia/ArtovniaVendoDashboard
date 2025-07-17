import { useQuery, useMutation } from '@tanstack/react-query';

import { fetchQuery } from '../../lib/client/client';

/**
 * GPSRData type definition
 */
export type GPSRData = {
  producerName: string;
  producerAddress: string;
  producerContact: string;
  importerName?: string;
  importerAddress?: string;
  importerContact?: string;
  instructions: string;
  certificates?: string;
};

/**
 * Fetch GPSR data for a product
 */
export const useGPSRData = (productId: string) => {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['gpsr', productId],
    queryFn: async () => {
      try {
        const data = await fetchQuery(`/vendor/products/${productId}/gpsr`, {
          method: 'GET',
        });
        return data;
      } catch (error: any) {
        if (error?.response?.status === 404) {
          // Return empty GPSR data if not found
          return { gpsr: null };
        }
        throw error;
      }
    },
    retry: 1,
    enabled: !!productId, // Only run the query if productId is provided
  });

  return {
    gpsr: data?.gpsr,
    isLoading,
    isError,
    error,
    refetch,
  };
};

/**
 * Create or update GPSR data for a product
 */
export const useCreateUpdateGPSR = () => {
  const mutation = useMutation({
    mutationFn: async ({
      productId,
      gpsr,
    }: {
      productId: string;
      gpsr: GPSRData;
    }) => {
      return await fetchQuery(`/vendor/products/${productId}/gpsr`, {
        method: 'POST',
        body: { gpsr }, // Remove JSON.stringify - fetchQuery handles this internally
        headers: {
          'Content-Type': 'application/json',
        },
      }) as object;
    },
  });

  return mutation;
};
