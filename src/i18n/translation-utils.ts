import { useTranslation } from 'react-i18next';

/**
 * A wrapper for the t function that provides better TypeScript support for interpolation objects
 * This utility ensures type safety when using translation keys with variables
 */
export const useTypedTranslation = () => {
  const { t, i18n } = useTranslation();
  
  /**
   * Type-safe translation function that properly handles interpolation variables
   * @param key Translation key
   * @param options Interpolation variables object or other options
   * @returns Translated string
   */
  const typedT = (key: string, options?: any) => {
    return t(key, options) as string;
  };

  return { 
    t: typedT,
    i18n 
  };
};
