import { TFunction } from 'i18next'

/**
 * Translates shipping profile name and type keys to localized strings
 * 
 * @param key - The shipping profile key (e.g., "mini_parcel", "standard_parcels")
 * @param isType - Whether this is a type key (true) or name key (false)
 * @param t - The translation function from react-i18next
 * @returns Translated string or the original key if no translation exists
 */
export function translateShippingProfileKey(
  key: string,
  isType: boolean,
  t: TFunction
): string {
  const prefix = isType ? 'shippingProfile.types' : 'shippingProfile.names'
  const translationKey = `${prefix}.${key}`
  
  // Try to get translation, fallback to the key itself if not found
  const translated = t(translationKey, { defaultValue: key })
  
  return String(translated)
}

/**
 * Formats a shipping profile display name with type
 * 
 * @param name - The profile name key
 * @param type - The profile type key
 * @param t - The translation function from react-i18next
 * @returns Formatted string like "Standard parcels - Mini parcel"
 */
export function formatShippingProfileDisplay(
  name: string,
  type: string,
  t: TFunction
): string {
  const translatedType = translateShippingProfileKey(type, true, t)
  const translatedName = translateShippingProfileKey(name, false, t)
  
  return `${translatedType} - ${translatedName}`
}
