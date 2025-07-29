import { useState, useEffect } from 'react'
import {
  Button,
  Text,
  toast,
  Container,
} from '@medusajs/ui'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import { useVariantColors, useAssignVariantColors, useColorTaxonomy } from '../../../../../hooks/api/colors'
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
          <Text className="text-ui-fg-subtle">Ładowanie kolorów wariantu...</Text>
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
            Błąd podczas ładowania kolorów wariantu: {variantColorsError.message}
          </Text>
        </div>
      </div>
    )
  }

  return (
    <FormProvider {...form}>
      <KeyboundForm onSubmit={onSubmit} className="flex flex-1 flex-col h-full">
        <div className="flex-1 overflow-y-auto">
          <div className='flex flex-col gap-y-4 p-4'>
            <div className='flex flex-col gap-y-4'>
              {/* Current colors display */}
              <div className="space-y-2">
                <Text weight="plus" size="small">Aktualne kolory</Text>
                
                {assignedColors.length > 0 ? (
                  <div className="bg-ui-bg-subtle rounded-lg p-2">
                    <div className="flex flex-wrap gap-1">
                      {assignedColors.map((color: ColorType) => (
                        <div key={color.id} className="flex items-center gap-1 bg-ui-bg-base rounded px-2 py-1 border">
                          <div 
                            className="w-3 h-3 rounded-full border border-ui-border-base shadow-sm flex-shrink-0" 
                            style={{ backgroundColor: color.hex_code }}
                          />
                          <Text size="xsmall" className="whitespace-nowrap">{color.display_name}</Text>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-ui-bg-subtle rounded-lg p-2">
                    <Text size="small" className="text-ui-fg-subtle">
                      Do tego wariantu nie przypisano żadnych kolorów.
                    </Text>
                  </div>
                )}
              </div>
              
              {/* Color selector */}
              <Form.Field
                control={form.control}
                name="selectedColors"
                render={() => {
                  return (
                    <Form.Item>
                      <Form.Label>Dodaj kolory</Form.Label>
                      <Form.Control>
                        <Container className="p-0 border rounded-lg">
                          <div className="p-2" style={{ maxHeight: '27rem', overflowY: 'auto' }}>
                            <ColorSelector 
                              value={null} // Always null for multi-select behavior
                              onChange={(colorId) => {
                                if (colorId && !selectedColorIds.includes(colorId)) {
                                  handleToggleColor(colorId)
                                }
                              }}
                              placeholder="Wyszukaj i wybierz kolory..."
                              label="Wyszukaj kolory"
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
              
              {/* Selected colors - Fixed container */}
              <div className="space-y-2">
                <Text weight="plus" size="small">Wybrane kolory ({selectedColorIds.length})</Text>
                
                <div className="min-h-[60px] bg-ui-bg-subtle rounded-lg p-2">
                  {selectedColorIds.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {selectedColorIds.map((colorId: string) => {
                        const color = getColorById(colorId)
                        return color ? (
                          <div key={colorId} className="flex items-center gap-1 bg-ui-bg-base rounded px-2 py-1 border group">
                            <div 
                              className="w-3 h-3 rounded-full border border-ui-border-base shadow-sm flex-shrink-0" 
                              style={{ backgroundColor: color.hex_code }}
                            />
                            <Text size="xsmall" className="whitespace-nowrap">{color.display_name}</Text>
                            <Button
                              variant="transparent"
                              size="small"
                              className="p-0 ml-1 w-3 h-3 text-ui-fg-muted hover:text-ui-fg-subtle opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                              onClick={() => handleToggleColor(colorId)}
                              type="button"
                              title="Usuń kolor"
                            >
                              ×
                            </Button>
                          </div>
                        ) : (
                          <div key={colorId} className="flex items-center gap-1 bg-ui-bg-base rounded px-2 py-1 border border-ui-border-error group">
                            <div className="w-3 h-3 rounded-full bg-ui-bg-disabled border border-ui-border-base shadow-sm flex-shrink-0" />
                            <Text size="xsmall" className="text-ui-fg-muted whitespace-nowrap">{t('products.variant.colors.unknownColor')}</Text>
                            <Button
                              variant="transparent"
                              size="small"
                              className="p-0 ml-1 w-3 h-3 text-ui-fg-muted hover:text-ui-fg-subtle opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                              onClick={() => handleToggleColor(colorId)}
                              type="button"
                              title="Usuń kolor"
                            >
                              ×
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-12">
                      <Text size="small" className="text-ui-fg-muted">
                        {t('products.variant.colors.noColorsSelected')}
                      </Text>
                    </div>
                  )}
                </div>
              </div>

              {/* Help text */}
              <div className="bg-ui-bg-base border border-ui-border-base rounded-lg p-2">
                <Text size="xsmall" className="text-ui-fg-subtle">
                  {t('products.variant.colors.helpText')}
                </Text>
              </div>
            </div>
          </div>
        </div>
        
        {/* Fixed footer inside form */}
        <div className='flex items-center justify-end gap-x-2 border-t bg-ui-bg-base p-3 mt-auto'>
          <RouteDrawer.Close asChild>
            <Button size='small' variant="secondary">
              {t('actions.cancel')}
            </Button>
          </RouteDrawer.Close>
          <Button
            size='small'
            type='submit'
            variant='primary'
            isLoading={isAssigning}
            disabled={!isInitialized}
          >
            {isAssigning ? t('actions.saving') : t('actions.save')}
          </Button>
        </div>
      </KeyboundForm>
    </FormProvider>
  )
}