"use client"

import { Button, Heading, toast } from "@medusajs/ui"
import { RouteDrawer } from "../../../components/modals"
import { useProductAttributes, useUpdateProductAttributes } from "../../../hooks/api/products"
import React from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Components } from "./components/Components"
import { useForm } from "react-hook-form"
import { Form } from "../../../components/common/form"
import { useTranslation } from 'react-i18next'

export const ProductAdditionalAttributesForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  
  // Get product attributes data
  const { attributes = [], attribute_values = [], product, isLoading, error } = useProductAttributes(id!)
  
  // Initialize form 
  const form = useForm()
  
  // IMPORTANT: All hooks must be called at the top level before any conditional returns
  // This prevents the "Rendered more hooks than during the previous render" error
  const updateProductAttributes = useUpdateProductAttributes(id!)
  
  // Set default values when attribute values are loaded
  React.useEffect(() => {
    const values: Record<string, any> = {}
    
    // Match attribute values to their respective attributes by handle
    if (Array.isArray(attribute_values)) {
      attribute_values.forEach((av: any) => {
        if (av && av.attribute && av.attribute.handle) {
          values[av.attribute.handle] = av.value
        }
      })
    }
    
    // Reset the form with new values when they're loaded
    if (Object.keys(values).length > 0) {
      form.reset(values)
    }
  }, [attribute_values, form])
  


  if (isLoading) {
    return (
      <RouteDrawer>
        <RouteDrawer.Header>
          <Heading level="h2">{t('additionalAttributes.title')}</Heading>
        </RouteDrawer.Header>
        <RouteDrawer.Body>
          <div className="flex items-center justify-center p-8">
            <div className="animate-pulse">{t('additionalAttributes.loading')}</div>
          </div>
        </RouteDrawer.Body>
      </RouteDrawer>
    )
  }


  const onSubmit = async (data: any) => {
    
    try {
      // Transform form data into the format expected by the API
      // Expected format: { attribute_values: [{ attribute_id: string, value: string }] }
      // Define interface for attribute values to address TypeScript errors
      interface AttributeValue {
        attribute_id: string;
        value: string;
      }
      
      const attributeValues = attributes.map((attr: any) => {
        return {
          attribute_id: attr.id,
          value: data[attr.handle] || '' // Use empty string if no value is provided
        } as AttributeValue;
      }).filter((item: AttributeValue) => item.value !== ''); // Remove empty values
      
      // Call the mutation to update product attributes
      await updateProductAttributes.mutateAsync({
        attribute_values: attributeValues
      });
      
      toast.success(t('additionalAttributes.success'));
      
      // Navigate back to the product detail page after successful save
      navigate(`/products/${id}`);
    } catch (error) {

      toast.error(t('additionalAttributes.errorUpdate'));
    }
  }
  
  // Handle case where backend returns errors or empty attributes
  const hasAttributes = Array.isArray(attributes) && attributes.length > 0

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <Heading level="h2">{t('additionalAttributes.title')}</Heading>
      </RouteDrawer.Header>
      <RouteDrawer.Body>
        {error && (
          <div className="bg-rose-50 p-4 mb-4 rounded border border-rose-200">
            <p className="text-rose-700 font-medium">{t('additionalAttributes.error.title')}</p>
            <p className="text-rose-600 text-sm">{t('additionalAttributes.error.description')}</p>
          </div>
        )}
        
        {!hasAttributes && !error && (
          <div className="bg-blue-50 p-4 mb-4 rounded border border-blue-200">
            <p className="text-blue-700 font-medium">{t('additionalAttributes.noAttributes.title')}</p>
            <p className="text-blue-600 text-sm">{t('additionalAttributes.noAttributes.description')}</p>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {hasAttributes ? (
              <>
                {attributes.map((a: any) => (
                  <Form.Field
                    key={`form-field-${a.handle}-${a.id}`}
                    control={form.control}
                    name={a.handle}
                    render={({ field }) => {
                      return (
                        <Form.Item key={a.name} className="w-full mb-4">
                          <Form.Label className="flex flex-col gap-y-2 w-full">
                            {a.name}
                            <Form.Control>
                              <Components attribute={a} field={field} />
                            </Form.Control>
                          </Form.Label>
                        </Form.Item>
                      )
                    }}
                  />
                ))}
                <div className="flex justify-end mt-4">
                  <Button 
                    type="submit" 
                    isLoading={updateProductAttributes.isPending}
                    disabled={updateProductAttributes.isPending}
                  >
                    {updateProductAttributes.isPending ? t('additionalAttributes.saving') : t('additionalAttributes.save')}
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex justify-end mt-4">
                <Button onClick={() => window.history.back()} variant="secondary">{t('additionalAttributes.back')}</Button>
              </div>
            )}
          </form>
        </Form>
        
        <div className="mt-8 pt-4 border-t text-sm text-gray-500">
          <p>{t('additionalAttributes.description')}</p>
        </div>
      </RouteDrawer.Body>
    </RouteDrawer>
  )
}