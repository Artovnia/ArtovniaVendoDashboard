/**
 * Custom hook for GPSR auto-fill functionality
 * 
 * Provides easy integration of GPSR localStorage into forms
 */

import { useCallback, useEffect, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';

import {
  clearGPSRDefaults,
  getGPSRDefaults,
  GPSRStorageData,
  hasGPSRDefaults,
  saveGPSRDefaults,
} from '../lib/gpsr-storage';

interface UseGPSRAutofillOptions {
  form: UseFormReturn<any>;
  autoFillOnMount?: boolean; // Auto-fill when component mounts
}

interface UseGPSRAutofillReturn {
  hasStoredData: boolean;
  storedData: GPSRStorageData | null;
  loadDefaults: () => void;
  saveDefaults: () => boolean;
  clearDefaults: () => boolean;
  isAutoFilled: boolean;
}

/**
 * Hook to manage GPSR auto-fill functionality
 */
export const useGPSRAutofill = ({
  form,
  autoFillOnMount = true,
}: UseGPSRAutofillOptions): UseGPSRAutofillReturn => {
  const [hasStoredData, setHasStoredData] = useState(false);
  const [storedData, setStoredData] = useState<GPSRStorageData | null>(null);
  const [isAutoFilled, setIsAutoFilled] = useState(false);

  /**
   * Load GPSR defaults into form
   */
  const loadDefaults = useCallback(() => {
    const data = getGPSRDefaults();
    
    if (!data) {
      console.warn('No GPSR defaults found');
      return;
    }

    // Set form values
    form.setValue('metadata.gpsr_producer_name', data.producerName || '');
    form.setValue('metadata.gpsr_producer_address', data.producerAddress || '');
    form.setValue('metadata.gpsr_producer_contact', data.producerContact || '');
    form.setValue('metadata.gpsr_importer_name', data.importerName || '');
    form.setValue('metadata.gpsr_importer_address', data.importerAddress || '');
    form.setValue('metadata.gpsr_importer_contact', data.importerContact || '');
    form.setValue('metadata.gpsr_instructions', data.instructions || '');
    form.setValue('metadata.gpsr_certificates', data.certificates || '');

    setIsAutoFilled(true);
  }, [form]);

  // Check for stored data on mount
  useEffect(() => {
    const hasData = hasGPSRDefaults();
    setHasStoredData(hasData);

    if (hasData) {
      const data = getGPSRDefaults();
      setStoredData(data);

      // Auto-fill if enabled and form fields are empty
      if (autoFillOnMount && data) {
        const currentProducerName = form.getValues('metadata.gpsr_producer_name');
        
        // Only auto-fill if the form field is empty or has default empty string
        if (!currentProducerName || currentProducerName === '') {
          loadDefaults();
        }
      }
    }
  }, [autoFillOnMount, form, loadDefaults]);

  /**
   * Save current form values as defaults
   */
  const saveDefaults = useCallback((): boolean => {
    const formData = {
      producerName: form.getValues('metadata.gpsr_producer_name') || '',
      producerAddress: form.getValues('metadata.gpsr_producer_address') || '',
      producerContact: form.getValues('metadata.gpsr_producer_contact') || '',
      importerName: form.getValues('metadata.gpsr_importer_name') || '',
      importerAddress: form.getValues('metadata.gpsr_importer_address') || '',
      importerContact: form.getValues('metadata.gpsr_importer_contact') || '',
      instructions: form.getValues('metadata.gpsr_instructions') || '',
      certificates: form.getValues('metadata.gpsr_certificates') || '',
    };

    // Only save if required fields are present
    if (!formData.producerName || !formData.producerAddress || !formData.producerContact) {
      console.warn('Cannot save GPSR defaults: missing required fields');
      return false;
    }

    const success = saveGPSRDefaults(formData);
    
    if (success) {
      setHasStoredData(true);
      setStoredData(getGPSRDefaults());
    }

    return success;
  }, [form]);

  /**
   * Clear stored defaults
   */
  const clearDefaults = useCallback((): boolean => {
    const success = clearGPSRDefaults();
    
    if (success) {
      setHasStoredData(false);
      setStoredData(null);
      setIsAutoFilled(false);
    }

    return success;
  }, []);

  return {
    hasStoredData,
    storedData,
    loadDefaults,
    saveDefaults,
    clearDefaults,
    isAutoFilled,
  };
};
