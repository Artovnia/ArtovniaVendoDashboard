import React from "react"
import { Input } from "@medusajs/ui"
import { AttributeSelect } from "./AttributeSelect"

/**
 * Get appropriate component based on attribute type
 * @param component - The UI component type (select, input, etc.)
 * @param values - Values for select components
 * @returns React component configured for the specific attribute type
 */
const getComponent = (component: string, values: any[] = []): React.ComponentType<{field: any}> => {
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

export const Components = ({
  attribute,
  field,
}: {
  attribute: any
  field: any
}) => {
  // Safely access property with fallbacks
  const ui_component = attribute?.ui_component || "input"
  const possible_values = attribute?.possible_values || []



  // Use the getComponent helper to determine which component to render
  const Component = getComponent(ui_component, possible_values)
  return <Component field={field} />
}
