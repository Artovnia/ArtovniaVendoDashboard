import { format, formatDistance, sub } from "date-fns"
import { enUS } from "date-fns/locale"
import { useTranslation } from "react-i18next"

import { languages } from "../i18n/languages"

// TODO: We rely on the current language to determine the date locale. This is not ideal, as we use en-US for the english translation.
// We either need to also have an en-GB translation or we need to separate the date locale from the translation language.
export const useDate = () => {
  const { i18n } = useTranslation()

  const locale =
    languages.find((l) => l.code === i18n.language)?.date_locale || enUS

  const getFullDate = ({
    date,
    includeTime = false,
  }: {
    date: string | Date
    includeTime?: boolean
  }) => {
    console.log("useDate getFullDate called with:", date, typeof date)
    
    // Handle null or undefined
    if (!date) {
      console.log("Date is empty/falsy")
      return "-"
    }
    
    const ensuredDate = new Date(date)
    console.log("Converted to Date object:", ensuredDate, ensuredDate.toString())

    if (isNaN(ensuredDate.getTime())) {
      console.log("Invalid date detected")
      return "-"
    }

    const timeFormat = includeTime ? "p" : ""
    
    try {
      const formatted = format(ensuredDate, `PP ${timeFormat}`, {
        locale,
      })
      console.log("Formatted date result:", formatted)
      return formatted
    } catch (error) {
      console.error("Date formatting error:", error)
      return ensuredDate.toString()
    }
  }

  function getRelativeDate(date: string | Date): string {
    const now = new Date()

    return formatDistance(sub(new Date(date), { minutes: 0 }), now, {
      addSuffix: true,
      locale,
    })
  }

  return {
    getFullDate,
    getRelativeDate,
  }
}
