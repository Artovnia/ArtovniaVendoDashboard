import React from "react"
import { Input } from "@medusajs/ui"
import { AttributeSelect } from "./components/AttributeSelect"

/**
 * Get appropriate component based on attribute type
 * @param component - The UI component type (select, input, etc.)
 * @param values - Values for select components
 * @returns React component configured for the specific attribute type
 */
export const getComponent = (component: string, values: any[] = []): React.ComponentType<{field: any}> => {
  switch (component) {
    case "select":
      return function SelectComponent({ field }) {
        return <AttributeSelect values={values} field={field} />
      }
      
    case "input":
    case "text":
      return function TextComponent({ field }) {
        return <Input {...field} />
      }
      
    default:
      // Default to standard input
      return function DefaultComponent({ field }) {
        return <Input {...field} />
      }
  }
}
