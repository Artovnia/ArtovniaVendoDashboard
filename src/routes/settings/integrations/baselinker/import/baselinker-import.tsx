/**
 * BaseLinker Import Component
 * 
 * This component handles the import of products from BaseLinker.
 * 
 * STATE ARCHITECTURE:
 * - All selection state (selectedProductIds, selectedGroupIds) is managed in the parent component
 * - Child components receive state and setters as props
 * - No local state duplication in child components
 * 
 * IMPORT LOGIC:
 * - If user selects specific items (products or groups), ONLY those items are imported
 * - If user selects ONLY groups, NO standalone products are imported
 * - If user selects ONLY products, NO groups are imported
 * - If user selects NOTHING, everything is imported (all ungrouped products + all configured groups)
 */
import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  Button,
  ProgressStatus,
  ProgressTabs,
  toast,
  Text,
} from '@medusajs/ui'
import { RouteFocusModal } from '../../../../../components/modals'
import {
  useProductsPreview,
  useCategoryMappings,
  useSaveCategoryMappings,
  useImportBulk,
} from '../../../../../hooks/api/baselinker'
import { VariantGroupingModal } from './components/variant-grouping-modal'
import { WatermarkWarningModal } from './components/watermark-warning-modal'
import { CategoryMappingContent } from './components/category-mapping-content'
import { ProductReviewContent } from './components/product-review-content'
import { ImportingContent } from './components/importing-content'
import type { ProductWithAssignment, CategoryMapping, VariantGroup } from '../../../../../types/baselinker'

enum Tab {
  CATEGORIES = 'categories',
  PRODUCTS = 'products',
  IMPORTING = 'importing',
}

type TabState = Record<Tab, ProgressStatus>

/**
 * Selection state interface - centralized for clarity
 */
interface SelectionState {
  productIds: string[]
  groupIds: string[]
}

export function BaseLinkerImport() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  
  // Tab navigation state
  const [tab, setTab] = useState<Tab>(Tab.CATEGORIES)
  const [tabState, setTabState] = useState<TabState>({
    [Tab.CATEGORIES]: 'in-progress',
    [Tab.PRODUCTS]: 'not-started',
    [Tab.IMPORTING]: 'not-started',
  })

  // Data state
  const [products, setProducts] = useState<ProductWithAssignment[]>([])
  const [categories, setCategories] = useState<Array<{ id: string; name: string; productCount: number }>>([])
  const [mappings, setMappings] = useState<Map<string, string | null>>(new Map())
  const [connectionId, setConnectionId] = useState<string>('')
  const [isComplete, setIsComplete] = useState(false)
  const [importResult, setImportResult] = useState<{ successful: number; failed: number } | null>(null)
  
  // Variant grouping state
  const [variantGroups, setVariantGroups] = useState<VariantGroup[]>([])
  const [editingGroup, setEditingGroup] = useState<VariantGroup | null>(null)
  const [isGroupingModalOpen, setIsGroupingModalOpen] = useState(false)
  
  // Watermark warning modal state
  const [isWatermarkWarningOpen, setIsWatermarkWarningOpen] = useState(false)
  
  // CRITICAL: Selection state - using refs to ensure we always have latest values
  const [selection, setSelection] = useState<SelectionState>({
    productIds: [],
    groupIds: [],
  })
  
  // Refs to always have access to latest selection values (avoids stale closure issues)
  const selectionRef = useRef<SelectionState>(selection)
  useEffect(() => {
    selectionRef.current = selection
  }, [selection])
  
  // Setters that support callback syntax like React.Dispatch<SetStateAction>
  const setSelectedGroupIds: React.Dispatch<React.SetStateAction<string[]>> = useCallback((value) => {
    setSelection(prev => ({
      ...prev,
      groupIds: typeof value === 'function' ? value(prev.groupIds) : value
    }))
  }, [])
  
  const setSelectedProductIds: React.Dispatch<React.SetStateAction<string[]>> = useCallback((value) => {
    setSelection(prev => ({
      ...prev,
      productIds: typeof value === 'function' ? value(prev.productIds) : value
    }))
  }, [])

  // API hooks
  const { refetch: fetchPreview, isFetching: isLoadingProducts } = useProductsPreview()
  const { data: savedMappings, isLoading: isMappingsLoading } = useCategoryMappings()
  const saveMappings = useSaveCategoryMappings()
  const importBulk = useImportBulk()

  // Load products on mount
  useEffect(() => {
    loadProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Apply saved mappings when they load
  useEffect(() => {
    if (savedMappings?.mappings && savedMappings.mappings.length > 0 && categories.length > 0) {
      const newMap = new Map<string, string | null>()
      for (const cat of categories) {
        const existing = savedMappings.mappings.find(
          (m: CategoryMapping) => m.baselinker_category_id === cat.id
        )
        newMap.set(cat.id, existing?.platform_category_id ?? null)
      }
      setMappings(newMap)
    }
  }, [savedMappings, categories])

  const loadProducts = async () => {
    try {
      const { data } = await fetchPreview()
      if (!data) throw new Error('Failed to fetch products')

      const productsWithAssignment: ProductWithAssignment[] = data.products.map((p: any) => ({
        ...p,
        assigned_category_id: null,
        assigned_shipping_profile_id: null,
      }))

      setProducts(productsWithAssignment)
      setCategories(data.categories)
      setConnectionId(data.connection.id)

      // Initialize mappings
      const initialMappings = new Map<string, string | null>()
      for (const cat of data.categories) {
        initialMappings.set(cat.id, null)
      }
      setMappings(initialMappings)

      // Skip to products if no categories
      if (data.categories.length === 0) {
        setTab(Tab.PRODUCTS)
        setTabState({
          [Tab.CATEGORIES]: 'completed',
          [Tab.PRODUCTS]: 'in-progress',
          [Tab.IMPORTING]: 'not-started',
        })
      }
      
      // Detect potential variant groups (products with same name)
      detectVariantGroups(productsWithAssignment)
    } catch (error: any) {
      toast.error(t('baselinker.import.loadError', { defaultValue: 'Failed to load products from BaseLinker' }))
    }
  }
  
  // Detect products with the same name that could be variants
  const detectVariantGroups = useCallback((productList: ProductWithAssignment[]) => {
    const nameMap = new Map<string, ProductWithAssignment[]>()
    
    // Group products by name
    productList.forEach((product) => {
      const normalizedName = product.name.trim().toLowerCase()
      if (!nameMap.has(normalizedName)) {
        nameMap.set(normalizedName, [])
      }
      nameMap.get(normalizedName)!.push(product)
    })
    
    // Create variant groups for products with duplicate names (2+ products)
    const groups: VariantGroup[] = []
    let groupIndex = 0
    nameMap.forEach((productsWithSameName, normalizedName) => {
      if (productsWithSameName.length >= 2) {
        // Use a combination of index, normalized name hash, and first product ID for uniqueness
        const firstProductId = productsWithSameName[0].id
        groups.push({
          id: `group_${groupIndex}_${firstProductId}`,
          name: productsWithSameName[0].name,
          members: productsWithSameName.map((p) => ({
            product: p,
            optionValues: {},
          })),
          options: [],
          isConfigured: false,
          assigned_category_id: null,
          assigned_shipping_profile_id: null,
        })
        groupIndex++
      }
    })
    
    setVariantGroups(groups)
    
    if (groups.length > 0) {
      toast.success(
        t('baselinker.import.variantGroupsDetected', {
          defaultValue: `Wykryto ${groups.length} grup produktów o tej samej nazwie, które mogą być wariantami`,
          count: groups.length,
        })
      )
    }
  }, [t])

  // Handle saving variant group configuration
  const handleSaveVariantGroup = useCallback((updatedGroup: VariantGroup) => {
    setVariantGroups((prev) =>
      prev.map((g) => (g.id === updatedGroup.id ? updatedGroup : g))
    )
    setEditingGroup(null)
    setIsGroupingModalOpen(false)
  }, [])
  
  // Open variant grouping modal for a specific group
  const openGroupingModal = useCallback((group: VariantGroup) => {
    setEditingGroup(group)
    setIsGroupingModalOpen(true)
  }, [])
  
  // Get product IDs that are part of ANY variant group (configured or not)
  const groupedProductIds = useMemo(() => {
    const ids = new Set<string>()
    variantGroups.forEach((g) => {
      g.members.forEach((m) => ids.add(m.product.id))
    })
    return ids
  }, [variantGroups])
  
  // Products that are NOT part of any variant group (will be imported individually)
  const ungroupedProducts = useMemo(() => {
    return products.filter((p) => !groupedProductIds.has(p.id))
  }, [products, groupedProductIds])

  const applyMappingsToProducts = () => {
    setProducts((prev) =>
      prev.map((p) => ({
        ...p,
        assigned_category_id: p.baselinker_category_id
          ? mappings.get(p.baselinker_category_id) ?? null
          : null,
      }))
    )
  }

  const handleCategoryMappingNext = async () => {
    const mappingArray: CategoryMapping[] = categories.map((cat) => ({
      baselinker_category_id: cat.id,
      baselinker_category_name: cat.name,
      platform_category_id: mappings.get(cat.id) ?? null,
    }))

    try {
      await saveMappings.mutateAsync(mappingArray)
    } catch (error) {
      console.error('Failed to save mappings:', error)
    }

    applyMappingsToProducts()
    
    // Show watermark warning modal before proceeding to product review
    setIsWatermarkWarningOpen(true)
  }
  
  // Handle watermark warning confirmation - proceed to product review
  const handleWatermarkWarningConfirm = useCallback(() => {
    setIsWatermarkWarningOpen(false)
    setTab(Tab.PRODUCTS)
    setTabState({
      [Tab.CATEGORIES]: 'completed',
      [Tab.PRODUCTS]: 'in-progress',
      [Tab.IMPORTING]: 'not-started',
    })
  }, [])

  // Removed: watermark warning now shown after category mapping instead of before import

  // CRITICAL: Import handler - uses ref to get latest selection values
  const handleImport = useCallback(async (defaultShippingProfileId: string) => {
    // Get current selection from ref to avoid stale closure
    const currentSelection = selectionRef.current
    
    setTab(Tab.IMPORTING)
    setTabState({
      [Tab.CATEGORIES]: 'completed',
      [Tab.PRODUCTS]: 'completed',
      [Tab.IMPORTING]: 'in-progress',
    })

    const hasProductSelection = currentSelection.productIds.length > 0
    const hasGroupSelection = currentSelection.groupIds.length > 0
    const hasAnySelection = hasProductSelection || hasGroupSelection
    
    console.log('[IMPORT] Selection state:', {
      hasProductSelection,
      hasGroupSelection,
      hasAnySelection,
      productIds: currentSelection.productIds,
      groupIds: currentSelection.groupIds,
    })
    
    // Determine what to import based on selection
    let productsToImport: ProductWithAssignment[]
    let groupsToImport: VariantGroup[]
    let selectedButUnconfiguredGroups: VariantGroup[] = []
    
    if (hasAnySelection) {
      // User made explicit selection - ONLY import what they selected
      productsToImport = hasProductSelection 
        ? products.filter((p) => currentSelection.productIds.includes(p.id) && !groupedProductIds.has(p.id))
        : []
      
      // Get ALL selected groups first (including unconfigured ones for validation)
      const allSelectedGroups = hasGroupSelection
        ? variantGroups.filter((g) => currentSelection.groupIds.includes(g.id))
        : []
      
      // Separate configured from unconfigured
      groupsToImport = allSelectedGroups.filter((g) => g.isConfigured)
      selectedButUnconfiguredGroups = allSelectedGroups.filter((g) => !g.isConfigured)
    } else {
      // No selection = import everything
      productsToImport = ungroupedProducts
      groupsToImport = variantGroups.filter((g) => g.isConfigured)
      selectedButUnconfiguredGroups = variantGroups.filter((g) => !g.isConfigured)
    }
    
    console.log('[IMPORT] Final decision:', {
      productsCount: productsToImport.length,
      groupsCount: groupsToImport.length,
    })

    try {
      // CRITICAL VALIDATION: Check that all items have required category and shipping profile
      const productsWithoutCategory = productsToImport.filter(p => !p.assigned_category_id)
      const productsWithoutShipping = productsToImport.filter(p => !p.assigned_shipping_profile_id && !defaultShippingProfileId)
      const groupsWithoutCategory = groupsToImport.filter(g => !g.assigned_category_id)
      const groupsWithoutShipping = groupsToImport.filter(g => !g.assigned_shipping_profile_id && !defaultShippingProfileId)
      
      if (productsWithoutCategory.length > 0) {
        toast.error(t('baselinker.import.missingCategoryError', { 
          count: productsWithoutCategory.length,
          defaultValue: `${productsWithoutCategory.length} products are missing category assignment. Please assign categories before importing.`
        }))
        setTab(Tab.PRODUCTS)
        return
      }
      
      if (productsWithoutShipping.length > 0) {
        toast.error(t('baselinker.import.missingShippingError', { 
          count: productsWithoutShipping.length,
          defaultValue: `${productsWithoutShipping.length} products are missing shipping profile. Please assign shipping profiles before importing.`
        }))
        setTab(Tab.PRODUCTS)
        return
      }
      
      if (groupsWithoutCategory.length > 0) {
        toast.error(t('baselinker.import.groupMissingCategoryError', { 
          count: groupsWithoutCategory.length,
          defaultValue: `${groupsWithoutCategory.length} variant groups are missing category assignment. Please assign categories before importing.`
        }))
        setTab(Tab.PRODUCTS)
        return
      }
      
      if (groupsWithoutShipping.length > 0) {
        toast.error(t('baselinker.import.groupMissingShippingError', { 
          count: groupsWithoutShipping.length,
          defaultValue: `${groupsWithoutShipping.length} variant groups are missing shipping profile. Please assign shipping profiles before importing.`
        }))
        setTab(Tab.PRODUCTS)
        return
      }
      
      // Check for unconfigured groups BEFORE checking if nothing to import
      // This ensures proper error message when groups are selected but not configured
      if (selectedButUnconfiguredGroups.length > 0) {
        toast.error(t('baselinker.import.unconfiguredGroupsError', { 
          count: selectedButUnconfiguredGroups.length,
          defaultValue: `${selectedButUnconfiguredGroups.length} wybranych grup wariantów nie jest skonfigurowanych. Skonfiguruj opcje wariantów przed importem.`
        }))
        setTab(Tab.PRODUCTS)
        return
      }
      
      // Check if there's anything to import
      if (productsToImport.length === 0 && groupsToImport.length === 0) {
        toast.error(t('baselinker.import.nothingToImport', { 
          defaultValue: 'No products or groups selected for import. Please select items to import.'
        }))
        setTab(Tab.PRODUCTS)
        return
      }
      
      console.log('[IMPORT] Validation passed:', {
        productsCount: productsToImport.length,
        groupsCount: groupsToImport.length,
      })

      const categoryMapping: Record<string, string> = {}
      productsToImport.forEach((p) => {
        if (p.baselinker_category_id && p.assigned_category_id) {
          categoryMapping[p.baselinker_category_id] = p.assigned_category_id
        }
      })

      const productAssignments = productsToImport.map((p) => ({
        bl_product_id: p.id,
        category_id: p.assigned_category_id!, // Now guaranteed to exist
        shipping_profile_id: p.assigned_shipping_profile_id || defaultShippingProfileId!, // Now guaranteed
      }))
      
      const groupedAssignments = groupsToImport.map((group) => ({
        group_id: group.id,
        group_name: group.name,
        bl_product_ids: group.members.map((m) => m.product.id),
        options: group.options,
        variants: group.members.map((m) => ({
          bl_product_id: m.product.id,
          option_values: m.optionValues,
          sku: m.product.sku || '',
          price: m.product.price,
          quantity: m.product.quantity || 0,
          ean: m.product.ean,
          images: m.product.images,
        })),
        category_id: group.assigned_category_id!, // Now guaranteed
        shipping_profile_id: group.assigned_shipping_profile_id || defaultShippingProfileId!, // Now guaranteed
      }))

      const payload = {
        bl_product_ids: productsToImport.map((p) => p.id),
        connection_id: connectionId,
        category_mapping: categoryMapping,
        default_currency: 'pln',
        default_status: 'proposed' as const,
        batch_size: 5,
        default_shipping_profile_id: defaultShippingProfileId || undefined,
        product_assignments: productAssignments,
        grouped_products: groupedAssignments.length > 0 ? groupedAssignments : undefined,
      }
      
      console.log('[IMPORT] API payload:', payload)
      
      const result = await importBulk.mutateAsync(payload as any)

      setImportResult({
        successful: result.successful_imports || (productsToImport.length + groupsToImport.length),
        failed: result.failed_imports || 0,
      })
      setIsComplete(true)
      setTabState({
        [Tab.CATEGORIES]: 'completed',
        [Tab.PRODUCTS]: 'completed',
        [Tab.IMPORTING]: 'completed',
      })
    } catch (error: any) {
      console.error('[IMPORT] Error:', error)
      toast.error(t('baselinker.import.importError', { defaultValue: 'Import failed' }))
      setTab(Tab.PRODUCTS)
      setTabState({
        [Tab.CATEGORIES]: 'completed',
        [Tab.PRODUCTS]: 'in-progress',
        [Tab.IMPORTING]: 'not-started',
      })
    }
  }, [products, variantGroups, ungroupedProducts, groupedProductIds, connectionId, importBulk, t])


  // Calculate counts
  const counts = useMemo(() => {
    const needsCategory = products.filter((p) => !p.assigned_category_id).length
    const needsShipping = products.filter((p) => !p.assigned_shipping_profile_id).length
    const ready = products.filter((p) => p.assigned_category_id && p.assigned_shipping_profile_id).length
    
    const selectedReady = selection.productIds.filter(id => {
      const product = products.find(p => p.id === id)
      return product && product.assigned_category_id && product.assigned_shipping_profile_id
    }).length
    const selectedNeedsSetup = selection.productIds.length - selectedReady
    
    return { 
      needsCategory, 
      needsShipping, 
      ready, 
      total: products.length,
      selectedCount: selection.productIds.length,
      selectedReady,
      selectedNeedsSetup
    }
  }, [products, selection.productIds])

  const mappedCategoriesCount = Array.from(mappings.values()).filter((v) => v !== null).length
  
  // Button text based on selection
  const importButtonText = useMemo(() => {
    const hasProducts = selection.productIds.length > 0
    const hasGroups = selection.groupIds.length > 0
    
    if (hasProducts || hasGroups) {
      return `Importuj wybrane (${selection.productIds.length} produktów, ${selection.groupIds.length} grup)`
    }
    return t('baselinker.import.confirmImport', { defaultValue: 'Importuj wszystko' })
  }, [selection, t])
  
  // Button disabled state
  const isImportDisabled = useMemo(() => {
    const noSelection = selection.productIds.length === 0 && selection.groupIds.length === 0
    const hasUnconfiguredGroups = variantGroups.some((g) => !g.isConfigured)
    const selectedNeedsSetup = counts.selectedNeedsSetup > 0
    
    return (noSelection && hasUnconfiguredGroups) || (selection.productIds.length > 0 && selectedNeedsSetup)
  }, [selection, variantGroups, counts.selectedNeedsSetup])

  return (
    <RouteFocusModal prev="/settings/integrations/baselinker">
      <RouteFocusModal.Title asChild>
        <span className="sr-only">{t('baselinker.import.title')}</span>
      </RouteFocusModal.Title>
      <RouteFocusModal.Description asChild>
        <span className="sr-only">{t('baselinker.import.description')}</span>
      </RouteFocusModal.Description>

      <ProgressTabs
        value={tab}
        onValueChange={(newTab) => setTab(newTab as Tab)}
        className="flex h-full flex-col overflow-hidden"
      >
        <RouteFocusModal.Header>
          <div className="-my-2 w-full border-l">
            <ProgressTabs.List className="flex w-full items-center justify-start">
              <ProgressTabs.Trigger
                status={tabState[Tab.CATEGORIES]}
                value={Tab.CATEGORIES}
                className="max-w-[200px] truncate"
                disabled={isComplete}
              >
                {t('baselinker.import.tabs.categories')}
              </ProgressTabs.Trigger>
              <ProgressTabs.Trigger
                status={tabState[Tab.PRODUCTS]}
                value={Tab.PRODUCTS}
                className="max-w-[200px] truncate"
                disabled={tab === Tab.CATEGORIES || isComplete}
              >
                {t('baselinker.import.tabs.products')}
              </ProgressTabs.Trigger>
              <ProgressTabs.Trigger
                status={tabState[Tab.IMPORTING]}
                value={Tab.IMPORTING}
                className="max-w-[200px] truncate"
                disabled={!isComplete && tab !== Tab.IMPORTING}
              >
                {t('baselinker.import.tabs.importing')}
              </ProgressTabs.Trigger>
            </ProgressTabs.List>
          </div>
        </RouteFocusModal.Header>

        <RouteFocusModal.Body className="size-full overflow-hidden">
          <ProgressTabs.Content className="size-full overflow-y-auto" value={Tab.CATEGORIES}>
            {isLoadingProducts || isMappingsLoading ? (
              <div className="flex h-full items-center justify-center">
                <svg 
                  className="h-5 w-5 animate-spin text-ui-fg-muted" 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <Text className="ml-2 text-ui-fg-muted">{t('baselinker.import.loading')}</Text>
              </div>
            ) : categories.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center p-8">
                <Text className="text-ui-fg-muted">{t('baselinker.import.noCategories')}</Text>
                <Button className="mt-4" onClick={handleCategoryMappingNext}>
                  {t('baselinker.import.skipToProducts')}
                </Button>
              </div>
            ) : (
              <CategoryMappingContent
                categories={categories}
                mappings={mappings}
                setMappings={setMappings}
              />
            )}
          </ProgressTabs.Content>

          <ProgressTabs.Content className="size-full overflow-y-auto" value={Tab.PRODUCTS}>
            <ProductReviewContent
              products={products}
              setProducts={setProducts}
              counts={counts}
              selectedProductIds={selection.productIds}
              setSelectedProductIds={setSelectedProductIds}
              variantGroups={variantGroups}
              setVariantGroups={setVariantGroups}
              selectedGroupIds={selection.groupIds}
              setSelectedGroupIds={setSelectedGroupIds}
              onOpenGroupingModal={openGroupingModal}
              groupedProductIds={groupedProductIds}
            />
          </ProgressTabs.Content>

          <ProgressTabs.Content className="size-full overflow-y-auto" value={Tab.IMPORTING}>
            <ImportingContent
              isComplete={isComplete}
              importResult={importResult}
              isImporting={importBulk.isPending}
            />
          </ProgressTabs.Content>
        </RouteFocusModal.Body>

        <RouteFocusModal.Footer>
          <div className="flex items-center justify-between w-full">
            <div>
              {tab === Tab.CATEGORIES && categories.length > 0 && (
                <Text className="text-sm text-ui-fg-subtle">
                  {mappedCategoriesCount} / {categories.length} {t('baselinker.import.categoriesMapped')}
                </Text>
              )}
              {tab === Tab.PRODUCTS && (
                <Text className="text-sm text-ui-fg-subtle">
                  {counts.ready} / {counts.total} {t('baselinker.import.productsReady')}
                </Text>
              )}
            </div>
            <div className="flex items-center gap-x-2">
              <RouteFocusModal.Close asChild>
                <Button variant="secondary" size="small">
                  {isComplete ? t('actions.close', { defaultValue: 'Close' }) : t('actions.cancel', { defaultValue: 'Cancel' })}
                </Button>
              </RouteFocusModal.Close>

              {tab === Tab.CATEGORIES && categories.length > 0 && (
                <Button size="small" onClick={handleCategoryMappingNext}>
                  {t('actions.continue', { defaultValue: 'Continue' })}
                </Button>
              )}

              {tab === Tab.PRODUCTS && (
                <>
                  {categories.length > 0 && (
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => {
                        setTab(Tab.CATEGORIES)
                        setTabState(prev => ({
                          ...prev,
                          [Tab.CATEGORIES]: 'in-progress',
                          [Tab.PRODUCTS]: 'not-started',
                        }))
                      }}
                    >
                      {t('actions.back', { defaultValue: 'Back' })}
                    </Button>
                  )}
                  <Button
                    size="small"
                    onClick={() => handleImport('')}
                    disabled={isImportDisabled}
                    isLoading={importBulk.isPending}
                  >
                    {importButtonText}
                  </Button>
                </>
              )}

              {isComplete && (
                <Button size="small" onClick={() => navigate('/products')}>
                  {t('baselinker.import.viewProducts', { defaultValue: 'View Products' })}
                </Button>
              )}
            </div>
          </div>
        </RouteFocusModal.Footer>
      </ProgressTabs>
      
      {/* Watermark Warning Modal - shown after category mapping */}
      <WatermarkWarningModal
        open={isWatermarkWarningOpen}
        onClose={() => {
          setIsWatermarkWarningOpen(false)
          // Stay on categories tab if user cancels
        }}
        onConfirm={handleWatermarkWarningConfirm}
      />
      
      {/* Variant Grouping Modal */}
      {editingGroup && (
        <VariantGroupingModal
          open={isGroupingModalOpen}
          onClose={() => {
            setIsGroupingModalOpen(false)
            setEditingGroup(null)
          }}
          group={editingGroup}
          onSave={handleSaveVariantGroup}
        />
      )}
    </RouteFocusModal>
  )
}

export default BaseLinkerImport
