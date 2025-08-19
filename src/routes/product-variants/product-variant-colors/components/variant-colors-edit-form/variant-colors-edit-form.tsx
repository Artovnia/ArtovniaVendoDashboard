import { useState, useEffect } from 'react'
import {
  Button,
  Text,
  toast,
  Container,
  DropdownMenu,
} from '@medusajs/ui'
import { SquareTwoStack } from '@medusajs/icons'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import { useVariantColors, useAssignVariantColors, useColorTaxonomy } from '../../../../../hooks/api/colors'
import { useProductVariants } from '../../../../../hooks/api/products'
import { ColorSelector } from '../../../../../components/color-selector'
import { RouteDrawer } from '../../../../../components/modals'
import { useForm, FormProvider } from 'react-hook-form'
import { Form } from '../../../../../components/common/form'
import { KeyboundForm } from '../../../../../components/utilities/keybound-form'

type ColorType = {
  id: string
  display_name: string
  hex_code: string
  [key: string]: any
}

type VariantColorsFormType = {
  selectedColors: string[]
}

export const VariantColorsEditForm = () => {
  const { t } = useTranslation()
  const { product_id, variant_id } = useParams()
  const navigate = useNavigate()
  
  const form = useForm<VariantColorsFormType>({
    defaultValues: {
      selectedColors: [],
    }
  })
  
  const [selectedColorIds, setSelectedColorIds] = useState<string[]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  
  const { data: colorTaxonomy } = useColorTaxonomy()
  const { 
    data: variantColorsData, 
    isLoading,
    error: variantColorsError
  } = useVariantColors(product_id!, variant_id!)
  
  const { 
    mutateAsync: assignColors,
    isPending: isAssigning
  } = useAssignVariantColors()

  // Fetch all variants for this product to enable copying colors
  const { data: productVariantsData } = useProductVariants(product_id!, {
    fields: "id,title,options"
  })
  
  // Get all assigned colors
  const assignedColors = variantColorsData?.colors || []
  
  // Initialize selected colors from assigned colors
  useEffect(() => {
    if (assignedColors?.length > 0 && !isInitialized) {
      const colorIds = assignedColors.map((color: ColorType) => color.id)
      console.log('[Variant Colors Edit] Initializing with colors:', colorIds)
      setSelectedColorIds(colorIds)
      form.setValue('selectedColors', colorIds)
      setIsInitialized(true)
    } else if (assignedColors?.length === 0 && !isLoading && !isInitialized) {
      console.log('[Variant Colors Edit] No colors found, initializing empty')
      setSelectedColorIds([])
      form.setValue('selectedColors', [])
      setIsInitialized(true)
    }
  }, [assignedColors, form, isLoading, isInitialized])
  
  const handleToggleColor = (colorId: string) => {
    console.log('[Variant Colors Edit] Toggling color:', colorId)
    setSelectedColorIds(prev => {
      const newSelection = prev.includes(colorId)
        ? prev.filter(id => id !== colorId)
        : [...prev, colorId]
      
      console.log('[Variant Colors Edit] New selection:', newSelection)
      form.setValue('selectedColors', newSelection)
      return newSelection
    })
  }

  // Copy colors from another variant using direct API call
  const handleCopyFromVariant = async (sourceVariantId: string) => {
    try {
      const response = await fetch(`/vendor/products/${product_id}/variants/${sourceVariantId}/colors`)
      const sourceVariantColors = await response.json()
      
      if (sourceVariantColors?.colors) {
        const colorIds = sourceVariantColors.colors.map((color: ColorType) => color.id)
        setSelectedColorIds(colorIds)
        form.setValue('selectedColors', colorIds)
        toast.success(t('products.variant.colorsEditForm.copySuccess'))
      }
    } catch (error) {
      console.error('Error copying colors:', error)
      toast.error(t('products.variant.colorsEditForm.copyError'))
    }
  }
  
  const getColorById = (colorId: string) => {
    if (!colorTaxonomy) return null
    
    // Search for the color in all color families
    for (const family of colorTaxonomy.color_families) {
      const color = family.colors.find(c => c.id === colorId)
      if (color) return { ...color, family_name: family.name }
    }
    
    return null
  }

  const onSubmit = form.handleSubmit(async () => {
    try {
      console.log(`[Variant Colors Edit] Updating variant ${variant_id} with colors:`, selectedColorIds)
      
      await assignColors({ 
        productId: product_id!, 
        variantId: variant_id!, 
        colorIds: selectedColorIds 
      })
      
      console.log(`[Variant Colors Edit] Successfully updated variant ${variant_id} colors`)
      
      toast.success(
        t('products.variant.colors.successToast')
      )
      
      // Small delay to allow backend processing
      setTimeout(() => {
        // Navigate back to the product page after successful save
        navigate(`/products/${product_id}`)
      }, 500)
      
    } catch (error: any) {
      console.error(`[Variant Colors Edit] Error updating variant ${variant_id} colors:`, error)
      toast.error(
        t('products.variant.colors.errorToast')
      )
    }
  })

  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex flex-col gap-y-8 min-h-[400px]">
        <div className="flex items-center justify-center p-8">
          <Text className="text-ui-fg-subtle">{t('products.variant.colorsEditForm.loading')}</Text>
        </div>
      </div>
    )
  }

  // Handle error state
  if (variantColorsError) {
    return (
      <div className="flex flex-col gap-y-8 min-h-[400px]">
        <div className="flex items-center justify-center p-8">
          <Text className="text-ui-fg-on-color-danger">
            {t('products.variant.colorsEditForm.error', { message: variantColorsError.message })}
          </Text>
        </div>
      </div>
    )
  }

  return (
    <FormProvider {...form}>
      <KeyboundForm onSubmit={onSubmit} className="flex flex-1 flex-col h-full min-h-0">
        {/* Scrollable content area with proper mobile spacing */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className='flex flex-col gap-y-3 sm:gap-y-4 p-3 sm:p-4 pb-safe'>
            <div className='flex flex-col gap-y-3 sm:gap-y-4'>
              {/* Copy colors section */}
              {productVariantsData?.variants && productVariantsData.variants.length > 1 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Text weight="plus" size="small">{t('products.variant.colorsEditForm.copyFromVariant')}</Text>
                    <DropdownMenu>
                      <DropdownMenu.Trigger asChild>
                        <Button variant="secondary" size="small">
                          <SquareTwoStack className="h-4 w-4" />
                          {t('products.variant.colorsEditForm.copyColors')}
                        </Button>
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Content align="end">
                        {productVariantsData.variants
                          .filter(v => v.id !== variant_id)
                          .map(variant => (
                            <DropdownMenu.Item
                              key={variant.id}
                              onClick={() => handleCopyFromVariant(variant.id)}
                            >
                              <SquareTwoStack className="h-4 w-4" />
                              {t('products.variant.colorsEditForm.copyFrom', { variantTitle: variant.title || `Wariant ${variant.id}` })}
                            </DropdownMenu.Item>
                          ))
                        }
                      </DropdownMenu.Content>
                    </DropdownMenu>
                  </div>
                </div>
              )}

              {/* Current colors display */}
              <div className="space-y-2">
                <Text weight="plus" size="small">{t('products.variant.colorsEditForm.currentColors')}</Text>
                
                {assignedColors.length > 0 ? (
                  <div className="bg-ui-bg-subtle rounded-lg p-2 sm:p-3">
                    <div className="flex flex-wrap gap-1 sm:gap-2">
                      {assignedColors.map((color: ColorType) => (
                        <div key={color.id} className="flex items-center gap-1 bg-ui-bg-base rounded px-2 py-1 border text-xs sm:text-sm">
                          <div 
                            className="w-3 h-3 sm:w-4 sm:h-4 rounded-full border border-ui-border-base shadow-sm flex-shrink-0" 
                            style={{ backgroundColor: color.hex_code }}
                          />
                          <Text size="xsmall" className="whitespace-nowrap truncate max-w-[120px] sm:max-w-none">{color.display_name}</Text>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-ui-bg-subtle rounded-lg p-2 sm:p-3">
                    <Text size="small" className="text-ui-fg-subtle">
                      {t('products.variant.colorsEditForm.noCurrentColors')}
                    </Text>
                  </div>
                )}
              </div>
              
              {/* Color selector with responsive height */}
              <Form.Field
                control={form.control}
                name="selectedColors"
                render={() => {
                  return (
                    <Form.Item>
                      <Form.Label>{t('products.variant.colorsEditForm.addColors')}</Form.Label>
                      <Form.Control>
                        <Container className="p-0 border rounded-lg">
                          <div 
                            className="p-2 sm:p-3 overflow-y-auto"
                            style={{ 
                              maxHeight: 'min(50vh, 27rem)',
                              minHeight: '200px'
                            }}
                          >
                            <ColorSelector 
                              value={null} // Always null for multi-select behavior
                              onChange={(colorId) => {
                                if (colorId && !selectedColorIds.includes(colorId)) {
                                  handleToggleColor(colorId)
                                }
                              }}
                              placeholder={t('products.variant.colorsEditForm.searchPlaceholder')}
                              label={t('products.variant.colorsEditForm.searchLabel')}
                              showColorPreview={true}
                            />
                          </div>
                        </Container>
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  );
                }}
              />
              
              {/* Selected colors - Responsive container */}
              <div className="space-y-2">
                <Text weight="plus" size="small">{t('products.variant.colorsEditForm.selectedColors', { count: selectedColorIds.length })}</Text>
                
                <div className="min-h-[60px] bg-ui-bg-subtle rounded-lg p-2 sm:p-3">
                  {selectedColorIds.length > 0 ? (
                    <div className="flex flex-wrap gap-1 sm:gap-2">
                      {selectedColorIds.map((colorId: string) => {
                        const color = getColorById(colorId)
                        return color ? (
                          <div key={colorId} className="flex items-center gap-1 bg-ui-bg-base rounded px-2 py-1 border group text-xs sm:text-sm">
                            <div 
                              className="w-3 h-3 sm:w-4 sm:h-4 rounded-full border border-ui-border-base shadow-sm flex-shrink-0" 
                              style={{ backgroundColor: color.hex_code }}
                            />
                            <Text size="xsmall" className="whitespace-nowrap truncate max-w-[100px] sm:max-w-none">{color.display_name}</Text>
                            <Button
                              variant="transparent"
                              size="small"
                              className="p-0 ml-1 w-4 h-4 sm:w-3 sm:h-3 text-ui-fg-muted hover:text-ui-fg-subtle opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex items-center justify-center"
                              onClick={() => handleToggleColor(colorId)}
                              type="button"
                              title={t('products.variant.colorsEditForm.removeColor')}
                            >
                              ×
                            </Button>
                          </div>
                        ) : (
                          <div key={colorId} className="flex items-center gap-1 bg-ui-bg-base rounded px-2 py-1 border border-ui-border-error group text-xs sm:text-sm">
                            <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-ui-bg-disabled border border-ui-border-base shadow-sm flex-shrink-0" />
                            <Text size="xsmall" className="text-ui-fg-muted whitespace-nowrap truncate max-w-[100px] sm:max-w-none">{t('products.variant.colors.unknownColor')}</Text>
                            <Button
                              variant="transparent"
                              size="small"
                              className="p-0 ml-1 w-4 h-4 sm:w-3 sm:h-3 text-ui-fg-muted hover:text-ui-fg-subtle opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex items-center justify-center"
                              onClick={() => handleToggleColor(colorId)}
                              type="button"
                              title={t('products.variant.colorsEditForm.removeColor')}
                            >
                              ×
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-12">
                      <Text size="small" className="text-ui-fg-muted text-center">
                        {t('products.variant.colors.noColorsSelected')}
                      </Text>
                    </div>
                  )}
                </div>
              </div>

              {/* Help text */}
              <div className="bg-ui-bg-base border border-ui-border-base rounded-lg p-2 sm:p-3">
                <Text size="xsmall" className="text-ui-fg-subtle">
                  {t('products.variant.colors.helpText')}
                </Text>
              </div>
            </div>
          </div>
        </div>
        
        {/* Sticky footer with mobile-optimized layout */}
        <div className='sticky bottom-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-x-2 border-t bg-ui-bg-base p-3 sm:p-4 mt-auto safe-area-inset-bottom'>
          <RouteDrawer.Close asChild>
            <Button size='small' variant="secondary" className="w-full sm:w-auto order-2 sm:order-1">
              {t('actions.cancel')}
            </Button>
          </RouteDrawer.Close>
          <Button
            size='small'
            type='submit'
            variant='primary'
            isLoading={isAssigning}
            disabled={!isInitialized}
            className="w-full sm:w-auto order-1 sm:order-2"
          >
            {isAssigning ? t('actions.saving') : t('actions.save')}
          </Button>
        </div>
      </KeyboundForm>
    </FormProvider>
  )
}