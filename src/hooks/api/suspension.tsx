// vendor-panel/src/hooks/api/suspension.tsx
import { FetchError } from '@medusajs/js-sdk';
import { useQuery } from '@tanstack/react-query';
import { fetchQuery } from '../../lib/client';
import { queryKeysFactory } from '../../lib/query-key-factory';
import { useMe } from './users';

const SUSPENSION_QUERY_KEY = 'suspensionStatus' as const;
const suspensionKeys = queryKeysFactory([SUSPENSION_QUERY_KEY]);

export interface SuspensionData {
  // Suspension fields
  is_suspended: boolean;
  suspension_reason: string | null;
  suspended_at: string | null;
  suspended_by: string | null;
  suspension_expires_at: string | null;
  
  // Status
  status: 'active' | 'holiday' | 'suspended';
  
  // Added for expired suspensions
  is_expired?: boolean;
  expiry_date?: string | null;
}

/**
 * Hook for retrieving suspension status for the vendor
 * This uses the new dedicated suspension endpoint that properly checks expiration
 */
export const useSuspensionStatus = (vendorId?: string) => {
  // Use the existing useMe hook to get seller information
  const { seller } = useMe();
  const actualVendorId = vendorId || seller?.id;
  
  console.log('🔍 Suspension hook - seller:', seller);
  console.log('🔍 Suspension hook - actualVendorId:', actualVendorId);
  
  const { data, ...rest } = useQuery({
    queryKey: suspensionKeys.detail(actualVendorId || 'unknown', 'suspension-status'),
    queryFn: async () => {
      if (!actualVendorId) {
        console.error('❌ Vendor ID is not available, seller:', seller);
        throw new Error('Vendor ID is not available');
      }
      
      try {
        console.log(`🔍 Fetching suspension status for vendor: ${actualVendorId}`);
        const response = await fetchQuery(`/vendor/stores/${actualVendorId}/suspension`, { 
          method: 'GET' 
        });
        console.log(`✅ Suspension status received:`, response);
        return response as SuspensionData;
      } catch (e) {
        console.error(`❌ Error fetching suspension status:`, e);
        const error = e as FetchError;
        throw error;
      }
    },
    enabled: !!actualVendorId,
  });

  return { suspensionStatus: data, ...rest };
};
