import { Button, toast } from "@medusajs/ui"
import { RouteDrawer } from "../../../../../../components/modals"
import { useForm, Control, FieldValues } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"

import { Form } from "../../../../../../components/common/form"
import { useProductVariantAttributes, useUpdateProductVariantAttributes } from "../../../../../../hooks/api/product-variant-additional-attributes"

type EditVariantAttributesFormProps = {
  productId?: string
  variantId?: string
}

// Custom implementation of ProductVariantAttributesFormFields component
// to avoid type issues
type Attribute = {
  id: string
  name: string
  handle: string
  ui_component?: string
  possible_values?: string[]
}

const AttributeField = ({ attribute, field }: { attribute: Attribute; field: any }) => {
  // Ensure field.value is always defined
  const value = field.value || ''
  
  if (attribute.ui_component === "select" && attribute.possible_values?.length) {
    return (
      <select
        {...field}
        value={value}
        className="w-full rounded-md border border-ui-border-base bg-ui-bg-field p-2 text-ui-fg-base"
      >
        <option value="">Wybierz opcję</option>
        {attribute.possible_values.map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </select>
    )
  }
  
  return <input {...field} value={value} className="w-full rounded-md border border-ui-border-base bg-ui-bg-field p-2 text-ui-fg-base" placeholder="Wpisz wartość" />
}

const VariantAttributesFormFields = ({ 
  attributes, 
  control 
}: { attributes: Attribute[], control: Control<any> }) => {
  return (
    <div className="flex flex-col gap-y-4">
      {attributes.map((attribute) => (
        <Form.Field
          key={attribute.id}
          control={control}
          name={`variant_attributes.${attribute.id}`}
          render={({ field }) => (
            <Form.Item>
              <Form.Label>{attribute.name}</Form.Label>
              <Form.Control>
                <AttributeField attribute={attribute} field={field} />
              </Form.Control>
              <Form.ErrorMessage />
            </Form.Item>
          )}
        />
      ))}
    </div>
  )
}

export const EditVariantAttributesForm = ({
  productId,
  variantId,
}: EditVariantAttributesFormProps) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  
  console.log('[DEBUG] EditVariantAttributesForm rendering with:', { productId, variantId })
  
  // Use the proper hook to fetch variant attributes
  const { 
    data: { attributes = [], attribute_values = [] } = {},
    isLoading,
    error 
  } = useProductVariantAttributes(productId || '', variantId || '')
  
  console.log('[DEBUG] Attributes data:', { attributes, attribute_values })

  // Initialize form with proper typing
  const form = useForm<FieldValues>({
    defaultValues: {}
  })
  
  // Set default values when attribute values are loaded
  useEffect(() => {
    if (!Array.isArray(attribute_values) || attribute_values.length === 0) {
      return
    }

    // Create a map of attribute values
    const defaultValues: Record<string, any> = {}
    
    // Match attribute values to their respective attributes
    attribute_values.forEach((av: any) => {
      if (av && av.attribute && av.attribute.id) {
        defaultValues[av.attribute.id] = av.value || ''
      }
    })
    
    console.log('[DEBUG] Form default values:', defaultValues)
    // Reset the form with new values when they're loaded
    form.reset(defaultValues)
  }, [attribute_values, form])

  const { mutateAsync: updateVariantAttributes, isPending: isUpdating } = useUpdateProductVariantAttributes(
    productId || '',
    variantId || ''
  )

  // Fix the handleSubmit function - it should receive form data, not event
  const onSubmit = async (formData: FieldValues) => {
    if (!productId || !variantId) {
      toast.error(t("toast.missingIds", "Brak wymaganych identyfikatorów produktu lub wariantu"))
      return
    }
    
    console.log('[DEBUG] Form submitted with data:', formData)
    
    try {
      // Transform the formData to the format expected by the API
      const attributeValues = Object.entries(formData || {}).reduce((acc: any[], [attributeId, value]) => {
        // Skip empty values
        if (value === undefined || value === null || value === '') {
          return acc
        }
        
        // Add to accumulator
        acc.push({
          attribute_id: attributeId,
          value: String(value)
        })
        
        return acc
      }, [])
      
      console.log('[DEBUG] Sending attribute values to API:', attributeValues)
      
      await updateVariantAttributes({
        attribute_values: attributeValues
      })

      toast.success(t("toast.attributesUpdated", "Atrybuty zaktualizowane"))
      navigate(-1) // Navigate back to previous route
      
    } catch (error) {
      console.error("Error updating variant attributes:", error)
      toast.error(t("toast.error", "Wystąpił błąd podczas aktualizacji atrybutów"))
    }
  }

  return (
    <RouteDrawer.Body>
      <div className="flex flex-col gap-y-8">
        {isLoading ? (
          <div className="flex flex-col gap-y-4">
            <div className="h-8 w-32 animate-pulse rounded-md bg-gray-100" />
            <div className="h-10 w-full animate-pulse rounded-md bg-gray-100" />
            <div className="h-8 w-32 animate-pulse rounded-md bg-gray-100" />
            <div className="h-10 w-full animate-pulse rounded-md bg-gray-100" />
          </div>
        ) : error ? (
          <div className="bg-rose-50 p-4 mb-4 rounded border border-rose-200">
            <p className="text-rose-700 font-medium">Wystąpił błąd podczas ładowania atrybutów</p>
            <p className="text-rose-600 text-sm">Spróbuj ponownie później lub skontaktuj się z wsparciem.</p>
          </div>
        ) : !Array.isArray(attributes) || attributes.length === 0 ? (
          <div className="bg-blue-50 p-4 mb-4 rounded border border-blue-200">
            <p className="text-blue-700 font-medium">Brak dostępnych atrybutów</p>
            <p className="text-blue-600 text-sm">Obecnie nie są konfigurowane żadne dodatkowe atrybuty dla tego wariantu.</p>
          </div>
        ) : (
          <Form {...form}>
            <form id="variant-attributes-form" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="flex flex-col gap-y-4">
                {attributes.map((attr: any) => (
                  <Form.Field
                    key={`form-field-${attr.id}`}
                    control={form.control}
                    name={attr.id}
                    render={({ field }) => (
                      <Form.Item className="w-full">
                        <Form.Label>{attr.name}</Form.Label>
                        <Form.Control>
                          {attr.ui_component === "select" && attr.possible_values?.length > 0 ? (
                            <select
                              {...field}
                              value={field.value || ''}
                              className="w-full rounded-md border border-ui-border-base bg-ui-bg-field p-2 text-ui-fg-base"
                            >
                              <option value="">Wybierz opcję</option>
                              {attr.possible_values.map((value: string) => (
                                <option key={value} value={value}>
                                  {value}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input 
                              {...field} 
                              value={field.value || ''}
                              className="w-full rounded-md border border-ui-border-base bg-ui-bg-field p-2 text-ui-fg-base" 
                              placeholder="Wpisz wartość" 
                            />
                          )}
                        </Form.Control>
                        <Form.ErrorMessage />
                      </Form.Item>
                    )}
                  />
                ))}
              </div>
            </form>
          </Form>
        )}
      </div>
    </RouteDrawer.Body>
  )
}