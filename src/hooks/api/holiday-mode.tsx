// F:\StronyInternetowe\mercur\vendor-panel\src\hooks\api\holiday-mode.tsx
import { FetchError } from '@medusajs/js-sdk';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchQuery } from '../../lib/client';
import { queryKeysFactory } from '../../lib/query-key-factory';
import { useMe } from './users'; // Import the existing useMe hook

const HOLIDAY_MODE_QUERY_KEY = 'holidayMode' as const;
const holidayModeKeys = queryKeysFactory([HOLIDAY_MODE_QUERY_KEY]);

export interface HolidayModeData {
  // Holiday fields
  is_holiday_mode: boolean;
  holiday_start_date: string | null;
  holiday_end_date: string | null;
  holiday_message: string | null;
  auto_reactivate?: boolean;
  
  // Suspension fields
  is_suspended: boolean;
  suspension_reason: string | null;
  suspended_at: string | null;
  suspended_by: string | null;
  suspension_expires_at: string | null;
  
  // Status
  status?: 'active' | 'holiday' | 'suspended';
}

export interface UpdateHolidayModeData {
  enabled: boolean; // Changed to match the schema expected by your route
  startDate?: string | null;
  endDate?: string | null;
  message?: string | null;
  auto_reactivate?: boolean;
}

/**
 * Hook for retrieving holiday mode settings for the vendor
 */
export const useHolidayMode = (vendorId?: string) => {
  // Use the existing useMe hook to get seller information
  const { seller } = useMe();
  const actualVendorId = vendorId || seller?.id;
  
  const { data, ...rest } = useQuery({
    queryKey: holidayModeKeys.detail(actualVendorId || 'unknown', 'holiday-mode'),
    queryFn: async () => {
      if (!actualVendorId) {
        console.error('❌ Vendor ID is not available, seller:', seller);
        throw new Error('Vendor ID is not available');
      }
      
      try {
        const response = await fetchQuery(`/vendor/stores/${actualVendorId}/holiday`, { 
          method: 'GET' 
        });
        return response as HolidayModeData;
      } catch (e) {
        console.error(`❌ Error fetching holiday mode data:`, e);
        const error = e as FetchError;
        throw error;
      }
    },
    enabled: !!actualVendorId,
  });

  return { holidayMode: data, ...rest };
};

/**
 * Hook for updating holiday mode settings
 */
export const useUpdateHolidayMode = (vendorId?: string) => {
  // Use the existing useMe hook to get seller information
  const { seller } = useMe();
  const actualVendorId = vendorId || seller?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateHolidayModeData) => {
      if (!actualVendorId) {
        console.error('❌ Vendor ID is not available for update, seller:', seller);
        throw new Error('Vendor ID is not available');
      }
      
      try {
        const response = await fetchQuery(
          `/vendor/stores/${actualVendorId}/holiday`, 
          {
            method: 'POST',
            body: data // Send the data as-is since it matches your schema
          }
        );
        return response;
      } catch (e) {
        console.error('❌ Failed to update holiday mode:', e);
        throw e;
      }
    },
    onSuccess: (response) => {
      if (actualVendorId) {
        queryClient.invalidateQueries({
          queryKey: holidayModeKeys.detail(actualVendorId, 'holiday-mode'),
        });
      }
    },
    onError: (error) => {
      console.error('❌ Failed to update holiday mode:', error);
    }
  });
};