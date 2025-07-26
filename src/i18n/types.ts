import type { Locale } from "date-fns"
import enUS from "./translations/en.json"

const resources = {
  translation: enUS,
} as const

export type Resources = typeof resources

// Type to flatten nested objects
type FlattenObjectKeys<
  T extends Record<string, any>,
  Key = keyof T
> = Key extends string
  ? T[Key] extends Record<string, any>
    ? `${Key}.${FlattenObjectKeys<T[Key]>}`
    : Key
  : never;

// Create a string literal type with all possible translation keys
export type TranslationKeys = FlattenObjectKeys<typeof enUS>;

// This ensures that when you use t('some.key'), TypeScript validates it
declare module 'react-i18next' {
  interface CustomTypeOptions {
    resources: typeof resources;
    defaultNS: 'translation';
    allowObjectInHTMLChildren: true;
  }
}

export type Language = {
  code: string
  display_name: string
  ltr: boolean
  date_locale: Locale
}
