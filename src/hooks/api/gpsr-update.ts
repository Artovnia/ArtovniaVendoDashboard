import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from '@medusajs/ui';

import { fetchQuery } from '../../lib/client';
import { GPSRData } from './gpsr';

/**
 * Update GPSR data for a product
 */
export const useUpdateGPSRData = () => {
  const { t } = useTranslation();
  
  return useMutation({
    mutationFn: async ({ productId, gpsr }: { productId: string; gpsr: GPSRData }) => {
      const data = await fetchQuery(`/vendor/products/${productId}/gpsr`, {
        method: 'POST',
        body: { gpsr }
      });
      return data;
    },
    onSuccess: () => {
      toast.success(t('products.gpsr.update_success', 'GPSR information updated successfully'));
    },
    onError: (error: any) => {
      toast.error(
        t(
          'products.gpsr.update_error',
          'Failed to update GPSR information: {{message}}',
          {
            message: error.response?.data?.message || error.message,
          }
        )
      );
    },
  });
};
