import { Select } from "@medusajs/ui"

export const AttributeSelect = ({
  values,
  field,
}: {
  values: any[]
  field: any
}) => {
  // Make sure values is always an array even if it's undefined
  const optionValues = values || []
  console.log("[DEBUG] AttributeSelect values:", values)
  
  return (
    <Select onValueChange={field.onChange} value={field.value}>
      <Select.Trigger className="bg-ui-bg-base">
        <Select.Value placeholder="Select value" />
      </Select.Trigger>
      <Select.Content>
        {optionValues.map((item, index) => {
          // Handle both object format and string format
          const value = typeof item === 'string' ? item : item?.value
          const id = typeof item === 'string' ? `val-${index}` : (item?.id || `val-${index}`)
          const attribute_id = typeof item === 'string' ? 'attr' : (item?.attribute_id || 'attr')
          
          return (
            <Select.Item
              key={`select-option-${attribute_id}-${id}`}
              value={value}
            >
              {value}
            </Select.Item>
          )
        })}
      </Select.Content>
    </Select>
  )
}
