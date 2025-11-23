/**
 * Predefined country bundles for quick service zone creation
 */

export interface CountryBundle {
  id: string
  nameKey: string
  descriptionKey: string
  countries: string[] // ISO 2-letter codes
}

/**
 * EU countries bundle - all European Union member states
 */
export const EU_COUNTRIES: CountryBundle = {
  id: 'eu',
  nameKey: 'stockLocations.serviceZones.bundles.eu.name',
  descriptionKey: 'stockLocations.serviceZones.bundles.eu.description',
  countries: [
    'at', // Austria
    'be', // Belgium
    'bg', // Bulgaria
    'hr', // Croatia
    'cy', // Cyprus
    'cz', // Czech Republic
    'dk', // Denmark
    'ee', // Estonia
    'fi', // Finland
    'fr', // France
    'de', // Germany
    'gr', // Greece
    'hu', // Hungary
    'ie', // Ireland
    'it', // Italy
    'lv', // Latvia
    'lt', // Lithuania
    'lu', // Luxembourg
    'mt', // Malta
    'nl', // Netherlands
    'pl', // Poland (note: vendors might want separate zone for Poland)
    'pt', // Portugal
    'ro', // Romania
    'sk', // Slovakia
    'si', // Slovenia
    'es', // Spain
    'se', // Sweden
  ]
}

/**
 * EU countries excluding Poland (for vendors who want separate Poland zone)
 */
export const EU_WITHOUT_POLAND: CountryBundle = {
  id: 'eu-no-pl',
  nameKey: 'stockLocations.serviceZones.bundles.euWithoutPoland.name',
  descriptionKey: 'stockLocations.serviceZones.bundles.euWithoutPoland.description',
  countries: EU_COUNTRIES.countries.filter(code => code !== 'pl')
}

/**
 * North America bundle
 */
export const NORTH_AMERICA: CountryBundle = {
  id: 'north-america',
  nameKey: 'stockLocations.serviceZones.bundles.northAmerica.name',
  descriptionKey: 'stockLocations.serviceZones.bundles.northAmerica.description',
  countries: [
    'us', // United States
    'ca', // Canada
    'mx', // Mexico
  ]
}

/**
 * All available country bundles
 */
export const COUNTRY_BUNDLES: CountryBundle[] = [
  EU_COUNTRIES,
  EU_WITHOUT_POLAND,
  NORTH_AMERICA,
]
