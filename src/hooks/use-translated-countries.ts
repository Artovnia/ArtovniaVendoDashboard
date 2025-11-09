import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { countries, StaticCountry } from '../lib/data/countries'

/**
 * Hook that returns the countries array with translated display names
 * based on the current i18n language setting.
 * 
 * For English: uses the original display_name from countries.ts
 * For Polish: uses translations from i18n files (countries.{iso_2})
 * 
 * @returns Array of countries with translated display names
 */
export const useTranslatedCountries = (): StaticCountry[] => {
  const { t, i18n } = useTranslation()
  
  return useMemo(() => {
    // If language is English, return original countries
    if (i18n.language === 'en') {
      return countries
    }
    
    // For other languages (Polish), translate the display names
    return countries.map((country) => ({
      ...country,
      display_name: t(`countries.${country.iso_2}`, { defaultValue: country.display_name })
    }))
  }, [i18n.language, t])
}

/**
 * Helper function to get a translated country name by ISO-2 code
 * 
 * @param iso2 - The ISO-2 country code
 * @param language - Current language
 * @param t - Translation function
 * @returns Translated country name
 */
export const getTranslatedCountryName = (
  iso2: string,
  language: string,
  t: (key: string, options?: any) => string
): string => {
  if (language === 'en') {
    const country = countries.find((c) => c.iso_2.toLowerCase() === iso2.toLowerCase())
    return country?.display_name || iso2.toUpperCase()
  }
  
  const country = countries.find((c) => c.iso_2.toLowerCase() === iso2.toLowerCase())
  return t(`countries.${iso2.toLowerCase()}`, { defaultValue: country?.display_name || iso2.toUpperCase() })
}
