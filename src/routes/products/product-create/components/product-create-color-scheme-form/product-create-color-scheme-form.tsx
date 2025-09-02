import { FormProvider, UseFormReturn, useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Heading, Text, Button, Container, Badge, DropdownMenu } from '@medusajs/ui';
import { Swatch, Trash, EllipsisHorizontal, SquareTwoStack } from '@medusajs/icons';
import { useColorsByFamily, useColorTaxonomy, Color, ColorTaxonomyResponse } from '../../../../../hooks/api/colors';
import { useState, useEffect, useRef, useCallback } from 'react';
import { ColorSelector } from '../../../../../components/color-selector';
import { Link } from 'react-router-dom';

type ProductCreateColorSchemeFormProps = {
  form: UseFormReturn<any>;
};

export const ProductCreateColorSchemeForm = ({
  form,
}: ProductCreateColorSchemeFormProps) => {
  const { t } = useTranslation();
  const { control, setValue, getValues } = form;
  const formContext = useFormContext();
  
  // Get color taxonomy for organizing colors by family
  const { data: colorTaxonomy, isLoading: isLoadingTaxonomy } = useColorTaxonomy();
  
  // Watch variants to determine how many variant color sections to show
  const watchedVariants = useWatch({
    control,
    name: 'variants',
  });

  const { fields: options } = useFieldArray({
    control,
    name: 'options',
  });

  // Check if we have a color option among product options
  const hasColorOption = options.some((option: any) => 
    option.title?.toLowerCase() === 'color' || 
    option.title?.toLowerCase() === 'kolor'
  );

  // If we have explicit variants, we need to assign colors to each. If not, just the default variant.
  const hasVariants = watchedVariants && watchedVariants.length > 1;
  
  // Initialize selected colors for each variant - now an array of strings for multiple colors
  const [variantColors, setVariantColors] = useState<Record<string, string[]>>({});
  
  // Use a ref to track if we've initialized to prevent infinite loops
  const isInitialized = useRef(false);
  const previousVariantIds = useRef<string[]>([]);

  // Helper function to generate consistent variant IDs throughout the component
  const generateVariantId = useCallback((variant: any, index: number): string => {
    if (variant.id) return variant.id;
    
    // Use variant title if available (this matches the backend mapping)
    if (variant.title) {
      return `temp_option_${variant.title}`;
    }
    
    // Fall back to index-based ID
    return `temp_default_${index}`;
  }, []);
  
  // Initialize the variant colors map
  useEffect(() => {
    if (!watchedVariants || watchedVariants.length === 0) {
      return;
    }

    // Generate current variant IDs
    const currentVariantIds = watchedVariants.map((variant: any, index: number) => 
      generateVariantId(variant, index)
    );
    
    // Check if variant structure has actually changed
    const variantIdsChanged = JSON.stringify(currentVariantIds) !== JSON.stringify(previousVariantIds.current);
    
    if (!isInitialized.current || variantIdsChanged) {
      console.log('Initializing color assignments for variants:', currentVariantIds);
      
      // Get existing color assignments from form (without triggering watch)
      const existingColorAssignments = getValues('color_assignments') || {};
      
      // Create initial color map preserving existing assignments
      const initialColorMap: Record<string, string[]> = {};
      
      currentVariantIds.forEach((variantId: string) => {
        // Preserve existing colors or initialize with empty array
        initialColorMap[variantId] = existingColorAssignments[variantId] || [];
      });
      
      // Update state without triggering form setValue initially
      setVariantColors(initialColorMap);
      
      // Only update form if we don't have existing assignments or variants changed
      if (!isInitialized.current || variantIdsChanged) {
        setValue('color_assignments', initialColorMap);
        setValue('metadata.raw_color_assignments', initialColorMap);
        setValue('metadata.handle_colors_via_api', true);
      }
      
      // Mark as initialized and update previous variant IDs
      isInitialized.current = true;
      previousVariantIds.current = currentVariantIds;
      
      console.log('Initialized color assignments:', initialColorMap);
    }
  }, [watchedVariants, setValue, getValues, generateVariantId]);
  
  // Add a color to a variant's color list
  const handleAddColor = useCallback((variantId: string, colorId: string) => {
    if (!colorId) return;
    
    setVariantColors(prev => {
      const currentColors = [...(prev[variantId] || [])];
      
      // Only add if not already in the list
      if (!currentColors.includes(colorId)) {
        currentColors.push(colorId);
      }
      
      const newColors = {
        ...prev,
        [variantId]: currentColors
      };
      
      // Update form values for submission - both in direct field and metadata
      setValue('color_assignments', newColors);
      setValue('metadata.raw_color_assignments', newColors);
      setValue('metadata.handle_colors_via_api', true);
      
      return newColors;
    });
  }, [setValue]);
  
  // Remove a color from a variant's color list
  const handleRemoveColor = useCallback((variantId: string, colorId: string) => {
    setVariantColors(prev => {
      const currentColors = [...(prev[variantId] || [])];
      const newColors = {
        ...prev,
        [variantId]: currentColors.filter(c => c !== colorId)
      };
      
      // Update form values for submission - both in direct field and metadata
      setValue('color_assignments', newColors);
      setValue('metadata.raw_color_assignments', newColors);
      setValue('metadata.handle_colors_via_api', true);
      
      return newColors;
    });
  }, [setValue]);

  // Copy colors from previous variant that has colors assigned
  const handleCopyFromPrevious = useCallback((targetVariantId: string) => {
    const currentVariantIds = watchedVariants.map((variant: any, index: number) => 
      generateVariantId(variant, index)
    );
    
    const targetIndex = currentVariantIds.indexOf(targetVariantId);
    
    // Find the previous variant that has colors assigned
    let sourceVariantId: string | null = null;
    for (let i = targetIndex - 1; i >= 0; i--) {
      const variantId = currentVariantIds[i];
      if (variantColors[variantId] && variantColors[variantId].length > 0) {
        sourceVariantId = variantId;
        break;
      }
    }
    
    if (sourceVariantId) {
      const colorsToCopu = [...variantColors[sourceVariantId]];
      
      setVariantColors(prev => {
        const newColors = {
          ...prev,
          [targetVariantId]: colorsToCopu
        };
        
        // Update form values for submission
        setValue('color_assignments', newColors);
        setValue('metadata.raw_color_assignments', newColors);
        setValue('metadata.handle_colors_via_api', true);
        
        return newColors;
      });
    }
  }, [watchedVariants, generateVariantId, variantColors, setValue]);

  // Copy colors from any variant that has colors assigned
  const handleCopyFromVariant = useCallback((targetVariantId: string, sourceVariantId: string) => {
    if (variantColors[sourceVariantId] && variantColors[sourceVariantId].length > 0) {
      const colorsToCopu = [...variantColors[sourceVariantId]];
      
      setVariantColors(prev => {
        const newColors = {
          ...prev,
          [targetVariantId]: colorsToCopu
        };
        
        // Update form values for submission
        setValue('color_assignments', newColors);
        setValue('metadata.raw_color_assignments', newColors);
        setValue('metadata.handle_colors_via_api', true);
        
        return newColors;
      });
    }
  }, [variantColors, setValue]);
  
  // Show loading state while fetching color data
  if (isLoadingTaxonomy) {
    return (
      <div className="p-6 flex flex-col items-center justify-center space-y-6">
        <div className="h-8 w-40 bg-ui-bg-subtle animate-pulse rounded" />
        <div className="h-32 w-full max-w-lg bg-ui-bg-subtle animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 flex flex-col items-center">
      <div className="space-y-2 w-full max-w-3xl text-center">
        <Heading level="h2">{t('products.color_scheme.title')}</Heading>
        <Text className="text-ui-fg-subtle">
          {t('products.color_scheme.description')}
        </Text>
      </div>
      
      {!hasColorOption && (
        <div className="p-4 bg-ui-bg-base border border-ui-border-base rounded-lg w-full max-w-3xl">
          <div className="flex items-center gap-2 text-ui-fg-subtle">
            <Swatch className="h-5 w-5 flex-shrink-0" />
            <Text>
              {t('products.color_scheme.no_color_option_warning')}
            </Text>
          </div>
        </div>
      )}
      
      <div className="space-y-6 w-full max-w-3xl">
        <div className="border rounded-lg divide-y">
          {watchedVariants.map((variant: any, index: number) => {
            const variantId = generateVariantId(variant, index);
            
            const variantTitle = variant.title || 
              (Array.isArray(variant.options) && variant.options.length ? variant.options.map((o: any) => o.value).join(' / ') : 
                t('products.color_scheme.default_variant'));
            
            const variantColorIds = variantColors[variantId] || [];
            const hasAssignedColors = variantColorIds.length > 0;
            
            // Get available variants to copy from (variants that have colors assigned)
            const currentVariantIds = watchedVariants.map((v: any, i: number) => 
              generateVariantId(v, i)
            );
            
            const availableSourceVariants = currentVariantIds
              .map((id: string, i: number) => ({ id, index: i, variant: watchedVariants[i] }))
              .filter(({ id, index: i }: { id: string; index: number }) => 
                id !== variantId && 
                variantColors[id] && 
                variantColors[id].length > 0
              );
            
            // Check if there's a previous variant with colors
            const hasPreviousWithColors = index > 0 && availableSourceVariants.some(({ index: i }: { index: number }) => i < index);
            
            return (
              <div key={variantId} className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Text weight="plus">
                      {index === 0 && !hasVariants 
                        ? t('products.color_scheme.default_variant') 
                        : t('products.color_scheme.variant_name', { name: variantTitle })}
                    </Text>
                    
                    {/* Copy colors dropdown - only show if there are variants to copy from */}
                    {availableSourceVariants.length > 0 && (
                      <DropdownMenu>
                        <DropdownMenu.Trigger asChild>
                          <Button variant="secondary" size="small">
                            <SquareTwoStack className="h-4 w-4" />
                            {t('products.color_scheme.copy_colors')}
                          </Button>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Content align="end">
                          {hasPreviousWithColors && (
                            <DropdownMenu.Item
                              onClick={() => handleCopyFromPrevious(variantId)}
                            >
                              <SquareTwoStack className="h-4 w-4" />
                              {t('products.color_scheme.copy_from_previous')}
                            </DropdownMenu.Item>
                          )}
                          
                          {availableSourceVariants.length > 0 && hasPreviousWithColors && (
                            <DropdownMenu.Separator />
                          )}
                          
                          {availableSourceVariants.map(({ id: sourceId, variant: sourceVariant, index: sourceIndex }: { id: string; variant: any; index: number }) => {
                            const sourceTitle = sourceVariant.title || 
                              (Array.isArray(sourceVariant.options) && sourceVariant.options.length ? 
                                sourceVariant.options.map((o: any) => o.value).join(' / ') : 
                                `Wariant ${sourceIndex + 1}`);
                            
                            return (
                              <DropdownMenu.Item
                                key={sourceId}
                                onClick={() => handleCopyFromVariant(variantId, sourceId)}
                              >
                                <SquareTwoStack className="h-4 w-4" />
                                {t('products.color_scheme.copy_from_variant', { name: sourceTitle })}
                              </DropdownMenu.Item>
                            );
                          })}
                        </DropdownMenu.Content>
                      </DropdownMenu>
                    )}
                  </div>
                  
                  {/* Color selection section */}
                  <div className="space-y-4">
                    {/* Display assigned colors */}
                    {hasAssignedColors && (
                      <div className="mb-4">
                        <Text className="text-ui-fg-subtle font-medium mb-3">
                          {t('products.color_scheme.assigned_colors')}
                        </Text>
                        <div className="flex flex-wrap gap-3">
                          {variantColorIds.map(colorId => {
                            // Find color data in taxonomy - collect all colors from different families
                            let colorData: Color | undefined;
                            
                            // Search through all color families to find this color
                            colorTaxonomy?.color_families?.forEach(family => {
                              const foundColor = family.colors.find(c => c.id === colorId);
                              if (foundColor) {
                                colorData = foundColor;
                              }
                            });
                            
                            if (!colorData) return null;
                            
                            return (
                              <div 
                                key={colorId} 
                                className="flex items-center gap-2 border border-ui-border-base rounded-md px-3 py-2  group"
                              >
                                <div 
                                  className="w-4 h-4 rounded-full border border-ui-border-base flex-shrink-0" 
                                  style={{ backgroundColor: colorData.hex_code }}
                                />
                                <Text className="text-sm">{colorData.display_name}</Text>
                                <Button
                                  variant="transparent"
                                  size="small"
                                  onClick={() => handleRemoveColor(variantId, colorId)}
                                  className="opacity-0 group-hover:opacity-100 text-rose-500"
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {/* Add new color section */}
                    <div>
                      <Text className="font-medium mb-2">
                        {hasAssignedColors 
                          ? t('products.color_scheme.add_more_colors') 
                          : t('products.color_scheme.add_color')}
                      </Text>
                      <ColorSelector 
                        value={null}
                        onChange={(colorId) => colorId && handleAddColor(variantId, colorId)}
                        placeholder={t('products.color_scheme.select_color')}
                        label={t('products.color_scheme.color')}
                        showColorPreview={true}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};