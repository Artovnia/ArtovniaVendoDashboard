/**
 * GPSR Data LocalStorage Utility
 * 
 * Manages persistent storage of GPSR (General Product Safety Regulation) data
 * to auto-fill forms for subsequent product creations.
 * 
 * Data persists across browser sessions until explicitly cleared.
 */

const GPSR_STORAGE_KEY = 'vendor_gpsr_defaults';
const STORAGE_VERSION = '1.0'; // For future migrations if needed

export interface GPSRStorageData {
  producerName: string;
  producerAddress: string;
  producerContact: string;
  importerName?: string;
  importerAddress?: string;
  importerContact?: string;
  instructions: string;
  certificates?: string;
  lastUpdated: string; // ISO timestamp
  version: string;
}

/**
 * Check if localStorage is available
 * (handles SSR, incognito mode, etc.)
 */
const isLocalStorageAvailable = (): boolean => {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Save GPSR defaults to localStorage
 * @param data - GPSR data to save
 * @returns boolean - true if saved successfully
 */
export const saveGPSRDefaults = (data: Omit<GPSRStorageData, 'lastUpdated' | 'version'>): boolean => {
  if (!isLocalStorageAvailable()) {
    console.warn('localStorage is not available');
    return false;
  }

  try {
    const storageData: GPSRStorageData = {
      ...data,
      lastUpdated: new Date().toISOString(),
      version: STORAGE_VERSION,
    };

    localStorage.setItem(GPSR_STORAGE_KEY, JSON.stringify(storageData));
    return true;
  } catch (error) {
    console.error('Failed to save GPSR defaults:', error);
    return false;
  }
};

/**
 * Get GPSR defaults from localStorage
 * @returns GPSRStorageData | null
 */
export const getGPSRDefaults = (): GPSRStorageData | null => {
  if (!isLocalStorageAvailable()) {
    return null;
  }

  try {
    const stored = localStorage.getItem(GPSR_STORAGE_KEY);
    
    if (!stored) {
      return null;
    }

    const data = JSON.parse(stored) as GPSRStorageData;
    
    // Basic validation
    if (!data.producerName && !data.producerAddress && !data.producerContact && !data.instructions) {
      clearGPSRDefaults();
      return null;
    }

    return data;
  } catch (error) {
    return null;
  }
};

/**
 * Clear GPSR defaults from localStorage
 * @returns boolean - true if cleared successfully
 */
export const clearGPSRDefaults = (): boolean => {
  if (!isLocalStorageAvailable()) {
    return false;
  }

  try {
    localStorage.removeItem(GPSR_STORAGE_KEY);
    console.log('🗑️ GPSR defaults cleared from localStorage');
    return true;
  } catch (error) {
    console.error('Failed to clear GPSR defaults:', error);
    return false;
  }
};

/**
 * Check if GPSR defaults exist in localStorage
 * @returns boolean
 */
export const hasGPSRDefaults = (): boolean => {
  if (!isLocalStorageAvailable()) {
    return false;
  }

  try {
    const stored = localStorage.getItem(GPSR_STORAGE_KEY);
    return stored !== null;
  } catch (error) {
    return false;
  }
};

/**
 * Get last updated timestamp of GPSR defaults
 * @returns Date | null
 */
export const getGPSRLastUpdated = (): Date | null => {
  const data = getGPSRDefaults();
  return data ? new Date(data.lastUpdated) : null;
};

/**
 * Update specific GPSR field without replacing all data
 * @param field - Field name to update
 * @param value - New value
 * @returns boolean - true if updated successfully
 */
export const updateGPSRField = (
  field: keyof Omit<GPSRStorageData, 'lastUpdated' | 'version'>,
  value: string
): boolean => {
  const existing = getGPSRDefaults();
  
  if (!existing) {
    console.warn('No existing GPSR data to update');
    return false;
  }

  return saveGPSRDefaults({
    ...existing,
    [field]: value,
  });
};
