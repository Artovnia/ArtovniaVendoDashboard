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
  Badge,
  Checkbox,
  Input,
  Select,
} from '@medusajs/ui'
import { ArrowPath, CheckCircleSolid, SquaresPlus } from '@medusajs/icons'
import { RouteFocusModal } from '../../../../../components/modals'
import {
  useProductsPreview,
  useCategoryMappings,
  useSaveCategoryMappings,
  useImportBulk,
} from '../../../../../hooks/api/baselinker'
import { CategorySelect } from '../../../../products/common/components/category-combobox/category-select'
import { ShippingProfileCombobox } from '../../../../../components/inputs/shipping-profile-combobox'
import { VariantGroupingModal } from './components/variant-grouping-modal'
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
    setTab(Tab.PRODUCTS)
    setTabState({
      [Tab.CATEGORIES]: 'completed',
      [Tab.PRODUCTS]: 'in-progress',
      [Tab.IMPORTING]: 'not-started',
    })
  }

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
    
    if (hasAnySelection) {
      // User made explicit selection - ONLY import what they selected
      productsToImport = hasProductSelection 
        ? products.filter((p) => currentSelection.productIds.includes(p.id) && !groupedProductIds.has(p.id))
        : []
      
      groupsToImport = hasGroupSelection
        ? variantGroups.filter((g) => currentSelection.groupIds.includes(g.id) && g.isConfigured)
        : []
    } else {
      // No selection = import everything
      productsToImport = ungroupedProducts
      groupsToImport = variantGroups.filter((g) => g.isConfigured)
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
      
      // Validate that groups are configured
      const unconfiguredGroups = groupsToImport.filter(g => !g.isConfigured)
      if (unconfiguredGroups.length > 0) {
        toast.error(t('baselinker.import.unconfiguredGroupsError', { 
          count: unconfiguredGroups.length,
          defaultValue: `${unconfiguredGroups.length} variant groups are not configured. Please configure variant options before importing.`
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
    </RouteFocusModal>
  )
}

// ============================================================================
// Category Mapping Content
// ============================================================================
function CategoryMappingContent({
  categories,
  mappings,
  setMappings,
}: {
  categories: Array<{ id: string; name: string; productCount: number }>
  mappings: Map<string, string | null>
  setMappings: React.Dispatch<React.SetStateAction<Map<string, string | null>>>
}) {
  const { t } = useTranslation()

  const updateMapping = (blCategoryId: string, platformCategoryId: string | null) => {
    setMappings((prev) => new Map(prev).set(blCategoryId, platformCategoryId))
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Text className="font-medium text-ui-fg-base">
          {t('baselinker.import.categoryMappingTitle', { defaultValue: 'Map BaseLinker Categories' })}
        </Text>
        <Text className="text-sm text-ui-fg-subtle">
          {t('baselinker.import.categoryMappingDescription', {
            defaultValue: 'Connect your BaseLinker categories to marketplace categories.',
          })}
        </Text>
      </div>

      <div className="rounded-lg border border-ui-border-base">
        <table className="w-full">
          <thead className="border-b border-ui-border-base bg-ui-bg-subtle">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-ui-fg-base">
                {t('baselinker.import.baselinkerCategory', { defaultValue: 'BaseLinker Category' })}
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-ui-fg-base w-24">
                {t('baselinker.import.products', { defaultValue: 'Products' })}
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-ui-fg-base">
                {t('baselinker.import.marketplaceCategory', { defaultValue: 'Marketplace Category' })}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ui-border-base">
            {categories.map((cat) => (
              <tr key={cat.id}>
                <td className="px-4 py-3">
                  <Text className="font-medium">{cat.name}</Text>
                </td>
                <td className="px-4 py-3">
                  <Badge color="grey">{cat.productCount}</Badge>
                </td>
                <td className="px-4 py-3">
                  <CategorySelect
                    value={mappings.get(cat.id) ? [mappings.get(cat.id)!] : []}
                    onChange={(value) => updateMapping(cat.id, value[0] || null)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Product Review Content
function ProductReviewContent({
  products,
  setProducts,
  counts,
  selectedProductIds,
  setSelectedProductIds,
  variantGroups,
  setVariantGroups,
  selectedGroupIds,
  setSelectedGroupIds,
  onOpenGroupingModal,
  groupedProductIds,
}: {
  products: ProductWithAssignment[]
  setProducts: React.Dispatch<React.SetStateAction<ProductWithAssignment[]>>
  counts: { needsCategory: number; needsShipping: number; ready: number; total: number; selectedCount: number; selectedReady: number; selectedNeedsSetup: number }
  selectedProductIds: string[]
  setSelectedProductIds: React.Dispatch<React.SetStateAction<string[]>>
  variantGroups: VariantGroup[]
  setVariantGroups: React.Dispatch<React.SetStateAction<VariantGroup[]>>
  selectedGroupIds: string[]
  setSelectedGroupIds: React.Dispatch<React.SetStateAction<string[]>>
  onOpenGroupingModal: (group: VariantGroup) => void
  groupedProductIds: Set<string>
}) {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'missing-category' | 'missing-shipping'>('all')
  const [bulkCategoryId, setBulkCategoryId] = useState<string>('')
  const [bulkShippingProfileId, setBulkShippingProfileId] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'single' | 'groups'>('single')
  
  // Use the parent's selectedProductIds instead of local state
  const selectedIds = selectedProductIds
  const setSelectedIds = setSelectedProductIds

  // Filter out products that are part of variant groups - they will be shown as group entries
  const standaloneProducts = useMemo(() => {
    return products.filter((p) => !groupedProductIds.has(p.id))
  }, [products, groupedProductIds])
  
  const filteredProducts = useMemo(() => {
    let filtered = standaloneProducts
    if (filter === 'missing-category') {
      filtered = filtered.filter((p) => !p.assigned_category_id)
    } else if (filter === 'missing-shipping') {
      filtered = filtered.filter((p) => !p.assigned_shipping_profile_id)
    }
    if (search.trim()) {
      const term = search.toLowerCase()
      filtered = filtered.filter(
        (p) => p.name.toLowerCase().includes(term) || p.sku?.toLowerCase().includes(term)
      )
    }
    return filtered
  }, [standaloneProducts, search, filter])
  
  // Filter variant groups based on search
  const filteredVariantGroups = useMemo(() => {
    if (!search.trim()) return variantGroups
    const term = search.toLowerCase()
    return variantGroups.filter((g) => 
      g.name.toLowerCase().includes(term) ||
      g.members.some((m) => m.product.sku?.toLowerCase().includes(term))
    )
  }, [variantGroups, search])

  const updateProductCategory = (productId: string, categoryId: string | null) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, assigned_category_id: categoryId } : p))
    )
  }

  const updateProductShippingProfile = (productId: string, shippingProfileId: string | null) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, assigned_shipping_profile_id: shippingProfileId } : p))
    )
  }
  
  // Update variant group category
  const updateGroupCategory = (groupId: string, categoryId: string | null) => {
    setVariantGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, assigned_category_id: categoryId } : g))
    )
  }
  
  // Update variant group shipping profile
  const updateGroupShippingProfile = (groupId: string, shippingProfileId: string | null) => {
    setVariantGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, assigned_shipping_profile_id: shippingProfileId } : g))
    )
  }

  const applyBulkCategory = () => {
    if (!bulkCategoryId || selectedIds.length === 0) return
    setProducts((prev) =>
      prev.map((p) =>
        selectedIds.includes(p.id) ? { ...p, assigned_category_id: bulkCategoryId } : p
      )
    )
    setBulkCategoryId('')
  }

  const applyBulkShippingProfile = () => {
    if (!bulkShippingProfileId || selectedIds.length === 0) return
    setProducts((prev) =>
      prev.map((p) =>
        selectedIds.includes(p.id) ? { ...p, assigned_shipping_profile_id: bulkShippingProfileId } : p
      )
    )
    setBulkShippingProfileId('')
  }

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="border-b border-ui-border-base p-4 space-y-4">
        {/* Selection and bulk actions */}
        <div className="flex items-center gap-4">
          <Checkbox
            checked={selectedIds.length === filteredProducts.length && filteredProducts.length > 0}
            onCheckedChange={(checked) => {
              setSelectedIds(checked ? filteredProducts.map((p) => p.id) : [])
            }}
          />
          <Text className="text-sm text-ui-fg-subtle min-w-[80px]">
            {selectedIds.length} {t('baselinker.import.selected', { defaultValue: 'selected' })}
          </Text>
        </div>

        {/* Bulk Category Assignment */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <Text className="text-sm font-medium sm:min-w-[120px]">
            {t('baselinker.import.bulkCategory', { defaultValue: 'Bulk Category:' })}
          </Text>
          <div className="flex-1 flex gap-2">
            <div className="flex-1">
              <CategorySelect
                placeholder={t('baselinker.import.selectCategory', { defaultValue: 'Select category...' })}
                value={bulkCategoryId ? [bulkCategoryId] : []}
                onChange={(value) => setBulkCategoryId(value[0] || '')}
              />
            </div>
            <Button
              size="small"
              variant="secondary"
              onClick={applyBulkCategory}
              disabled={!bulkCategoryId || selectedIds.length === 0}
            >
              {t('baselinker.import.apply', { defaultValue: 'Apply' })}
            </Button>
          </div>
        </div>

        {/* Bulk Shipping Profile Assignment */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <Text className="text-sm font-medium sm:min-w-[120px]">
            {t('baselinker.import.bulkShipping', { defaultValue: 'Bulk Shipping:' })}
          </Text>
          <div className="flex-1 flex gap-2">
            <div className="flex-1">
              <ShippingProfileCombobox
                placeholder={t('baselinker.import.selectShippingProfile', { defaultValue: 'Select shipping profile...' })}
                value={bulkShippingProfileId}
                onChange={(value) => setBulkShippingProfileId(value as string || '')}
                showValidationBadges={false}
                showWarningMessages={false}
              />
            </div>
            <Button
              size="small"
              variant="secondary"
              onClick={applyBulkShippingProfile}
              disabled={!bulkShippingProfileId || selectedIds.length === 0}
            >
              {t('baselinker.import.apply', { defaultValue: 'Apply' })}
            </Button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          <Input
            type="text"
            placeholder={t('baselinker.import.searchPlaceholder', { defaultValue: 'Search by name or SKU...' })}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
          />
          <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
            <Select.Trigger className="w-full sm:w-48">
              <Select.Value />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="all">
                {t('baselinker.import.allProducts', { defaultValue: 'All Products' })}
              </Select.Item>
              <Select.Item value="missing-category">
                {t('baselinker.import.missingCategory', { defaultValue: 'Missing Category' })}
              </Select.Item>
              <Select.Item value="missing-shipping">
                {t('baselinker.import.missingShipping', { defaultValue: 'Missing Shipping' })}
              </Select.Item>
            </Select.Content>
          </Select>
        </div>
      </div>

      {/* Tab Navigation - only show if both single products and groups exist */}
      {filteredProducts.length > 0 && filteredVariantGroups.length > 0 && (
        <div className="border-b border-ui-border-base p-2 bg-ui-bg-subtle flex gap-2">
          <Button
            variant={activeTab === 'single' ? 'primary' : 'secondary'}
            size="small"
            onClick={() => setActiveTab('single')}
          >
            {t('baselinker.import.standaloneProducts', { defaultValue: 'Pojedyncze produkty' })}
            <Badge color={activeTab === 'single' ? 'green' : 'grey'} size="small" className="ml-2">
              {filteredProducts.length}
            </Badge>
          </Button>
          <Button
            variant={activeTab === 'groups' ? 'primary' : 'secondary'}
            size="small"
            onClick={() => setActiveTab('groups')}
          >
            <SquaresPlus className="mr-1" />
            {t('baselinker.import.variantGroups', { defaultValue: 'Grupy wariantów' })}
            <Badge color={activeTab === 'groups' ? 'purple' : 'grey'} size="small" className="ml-2">
              {filteredVariantGroups.length}
            </Badge>
          </Button>
        </div>
      )}

      {/* Variant Groups Tab Content */}
      {filteredVariantGroups.length > 0 && (activeTab === 'groups' || filteredProducts.length === 0) && (
        <div className="border-b border-ui-border-base p-4 bg-ui-bg-subtle-hover">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={selectedGroupIds.length === filteredVariantGroups.length && filteredVariantGroups.length > 0}
                onCheckedChange={(checked) => {
                  setSelectedGroupIds(checked ? filteredVariantGroups.map((g) => g.id) : [])
                }}
              />
              <div>
                <Text className="font-medium text-ui-fg-base flex items-center gap-2">
                  <SquaresPlus className="text-ui-fg-muted" />
                  {t('baselinker.import.variantGroups', { defaultValue: 'Grupy wariantów' })}
                  <Badge color="purple" size="small">
                    {filteredVariantGroups.length}
                  </Badge>
                </Text>
                <Text className="text-sm text-ui-fg-subtle">
                  {t('baselinker.import.variantGroupsDescription', { 
                    defaultValue: 'Produkty o tej samej nazwie - zostaną zaimportowane jako jeden produkt z wariantami' 
                  })}
                </Text>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            {filteredVariantGroups.map((group, index) => (
              <div
                key={`group-${index}-${group.id}`}
                className={`flex flex-col gap-3 rounded-lg border p-3 lg:flex-row lg:items-center ${
                  selectedGroupIds.includes(group.id)
                    ? 'border-ui-fg-interactive bg-ui-bg-base'
                    : 'border-ui-border-base bg-ui-bg-base'
                }`}
              >
                {/* Checkbox + Group Info */}
                <div className="flex items-start gap-3 lg:flex-1 lg:min-w-0">
                  <Checkbox
                    checked={selectedGroupIds.includes(group.id)}
                    onCheckedChange={(checked) => {
                      setSelectedGroupIds((prev) =>
                        checked ? [...prev, group.id] : prev.filter((id) => id !== group.id)
                      )
                    }}
                    className="mt-1 lg:mt-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Text className="font-medium" title={group.name}>
                        {group.name}
                      </Text>
                      <Badge color="purple" size="small">
                        {group.members.length} {t('baselinker.import.variants', { defaultValue: 'wariantów' })}
                      </Badge>
                      {group.isConfigured ? (
                        <Badge color="green" size="small">
                          {t('baselinker.import.configured', { defaultValue: 'Skonfigurowano ✓' })}
                        </Badge>
                      ) : (
                        <Badge color="orange" size="small">
                          {t('baselinker.import.notConfigured', { defaultValue: 'Wymaga konfiguracji' })}
                        </Badge>
                      )}
                    </div>
                    <Text className="text-sm text-ui-fg-subtle mt-1">
                      {t('baselinker.import.totalStock', { defaultValue: 'Łączny stan' })}: {group.members.reduce((sum, m) => sum + (m.product.quantity || 0), 0)} | 
                      {t('baselinker.import.priceRange', { defaultValue: ' Ceny' })}: {Math.min(...group.members.map(m => m.product.price)).toFixed(2)} - {Math.max(...group.members.map(m => m.product.price)).toFixed(2)} zł
                    </Text>
                    {group.isConfigured && group.options.length > 0 && (
                      <Text className="text-xs text-ui-fg-muted mt-1">
                        {t('baselinker.import.optionsConfigured', { 
                          defaultValue: `Opcje: ${group.options.map(o => o.title).join(', ')}` 
                        })}
                      </Text>
                    )}
                  </div>
                </div>
                
                {/* Category and Shipping Selects */}
                <div className="flex flex-col gap-2 lg:flex-row lg:gap-3">
                  <div className="w-full lg:w-56">
                    <CategorySelect
                      value={group.assigned_category_id ? [group.assigned_category_id] : []}
                      onChange={(value) => updateGroupCategory(group.id, value[0] || null)}
                    />
                  </div>
                  <div className="w-full lg:w-56 mt-2">
                    <ShippingProfileCombobox
                      placeholder={t('baselinker.import.selectShippingProfile', { defaultValue: 'Select shipping...' })}
                      value={group.assigned_shipping_profile_id || ''}
                      onChange={(value) => updateGroupShippingProfile(group.id, value as string || null)}
                      showValidationBadges={false}
                      showWarningMessages={false}
                    />
                  </div>
                </div>
                
                {/* Configure Button */}
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => onOpenGroupingModal(group)}
                >
                  {group.isConfigured 
                    ? t('baselinker.import.editVariants', { defaultValue: 'Edytuj' })
                    : t('baselinker.import.configureVariants', { defaultValue: 'Konfiguruj' })
                  }
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Standalone Products Header - only show when single tab is active or no groups exist */}
      {filteredProducts.length > 0 && (activeTab === 'single' || filteredVariantGroups.length === 0) && (
        <div className="border-b border-ui-border-base p-4 bg-ui-bg-base">
          <div className="flex items-center gap-3 mb-3">
            <Checkbox
              checked={selectedIds.length === filteredProducts.length && filteredProducts.length > 0}
              onCheckedChange={(checked) => {
                setSelectedIds(checked ? filteredProducts.map((p) => p.id) : [])
              }}
            />
            <Text className="font-medium text-ui-fg-base">
              {t('baselinker.import.standaloneProducts', { defaultValue: 'Pojedyncze produkty' })}
              <Badge color="grey" size="small" className="ml-2">
                {filteredProducts.length}
              </Badge>
            </Text>
          </div>
        </div>
      )}
      
      {/* Product List - only show when single tab is active or no groups exist */}
      {filteredProducts.length > 0 && (activeTab === 'single' || filteredVariantGroups.length === 0) && (
      <div className="flex-1 overflow-y-auto p-4 lg:space-y-0">
        <div className="space-y-2 lg:space-y-0">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className={`flex flex-col gap-3 rounded-lg border p-3 lg:flex-row lg:items-center ${
                selectedIds.includes(product.id)
                  ? 'border-ui-fg-interactive bg-ui-bg-subtle-hover' 
                  : 'border-ui-border-base'
              }`}
            >
              {/* Mobile: Checkbox + Product Info Row */}
              <div className="flex items-start gap-3 lg:flex-1 lg:min-w-0">
                <Checkbox
                  checked={selectedIds.includes(product.id)}
                  onCheckedChange={(checked) => {
                    setSelectedIds((prev) =>
                      checked ? [...prev, product.id] : prev.filter((id) => id !== product.id)
                    )
                  }}
                  className="mt-1 lg:mt-0"
                />
                <div className="flex-1 min-w-0">
                  <Text className="truncate text-md" title={product.name}>
                    {product.name || 'Untitled Product'}
                  </Text>
                  <Text className="text-sm text-ui-fg-subtle">
                    <span className="font-medium">SKU:</span> {product.sku || '-'}
                  </Text>
                  {/* Mobile: Show price and stock inline */}
                  <div className="flex items-center gap-3 mt-1 lg:hidden">
                    <Text className="font-medium text-sm">{product.price.toFixed(2)} zł</Text>
                    <Text className="text-xs text-ui-fg-subtle">
                      {t('baselinker.import.stock', { defaultValue: 'Stock' })}: {product.quantity}
                    </Text>
                  </div>
                  {/* Mobile: Show badges inline */}
                  <div className="flex flex-wrap gap-1 mt-2 lg:hidden">
                    {!product.assigned_category_id && (
                      <Badge color="orange" size="small">
                        {t('baselinker.import.noCategory', { defaultValue: 'No category' })}
                      </Badge>
                    )}
                    {!product.assigned_shipping_profile_id && (
                      <Badge color="orange" size="small">
                        {t('baselinker.import.noShipping', { defaultValue: 'No shipping' })}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Desktop: Price and Stock */}
              <div className="hidden md:block w-20 text-right">
                <Text className="font-medium text-sm">{product.price.toFixed(2)} zł</Text>
                <Text className="text-xs text-ui-fg-subtle">
                  {t('baselinker.import.stock', { defaultValue: 'Stock' })}: {product.quantity}
                </Text>
              </div>
              
              {/* Category and Shipping Selects - Stack on mobile */}
              <div className="flex flex-col gap-2 lg:flex-row lg:gap-3">
                <div className="w-full lg:w-56">
                  <CategorySelect
                    value={product.assigned_category_id ? [product.assigned_category_id] : []}
                    onChange={(value) => updateProductCategory(product.id, value[0] || null)}
                  />
                </div>
                <div className="w-full md:w-56 mt-2">
                  <ShippingProfileCombobox
                    placeholder={t('baselinker.import.selectShippingProfile', { defaultValue: 'Select shipping...' })}
                    value={product.assigned_shipping_profile_id || ''}
                    onChange={(value) => updateProductShippingProfile(product.id, value as string || null)}
                    showValidationBadges={false}
                    showWarningMessages={false}
                  />
                </div>
              </div>
              
              {/* Desktop: Badges */}
              <div className="hidden md:flex gap-1">
                {!product.assigned_category_id && (
                  <Badge color="orange" size="small">
                    {t('baselinker.import.noCategory', { defaultValue: 'No category' })}
                  </Badge>
                )}
                {!product.assigned_shipping_profile_id && (
                  <Badge color="orange" size="small">
                    {t('baselinker.import.noShipping', { defaultValue: 'No shipping' })}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      )}

      {/* Status Bar */}
      <div className="border-t border-ui-border-base bg-ui-bg-subtle p-4">
        <div className="flex flex-col gap-2">
          {counts.selectedCount > 0 ? (
            // Show selected products status
            <>
              {counts.selectedNeedsSetup > 0 ? (
                <Text className="text-amber-600">
                  ⚠️ {t('baselinker.import.selectedNeedSetup', { count: counts.selectedNeedsSetup, total: counts.selectedCount, defaultValue: '{{count}} of {{total}} selected products need category or shipping' })}
                </Text>
              ) : (
                <Text className="text-green-600">
                  ✓ {t('baselinker.import.selectedReady', { count: counts.selectedReady, defaultValue: '{{count}} selected products ready to import' })}
                </Text>
              )}
              <Text className="text-xs text-ui-fg-subtle">
                {t('baselinker.import.selectiveTip', { defaultValue: 'Tip: Only selected products will be imported' })}
              </Text>
            </>
          ) : (
            // Show all products status when none selected
            <>
              {(counts.needsCategory > 0 || counts.needsShipping > 0) ? (
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                  {counts.needsCategory > 0 && (
                    <Text className="text-amber-600">
                      ⚠️ {counts.needsCategory}{' '}
                      {t('baselinker.import.productsNeedCategory', { defaultValue: 'products need category' })}
                    </Text>
                  )}
                  {counts.needsShipping > 0 && (
                    <Text className="text-amber-600">
                      ⚠️ {counts.needsShipping}{' '}
                      {t('baselinker.import.productsNeedShipping', { defaultValue: 'products need shipping profile' })}
                    </Text>
                  )}
                </div>
              ) : (
                <Text className="text-green-600">
                  ✓ {t('baselinker.import.allReady', { count: counts.total, defaultValue: 'All {{count}} products ready to import' })}
                </Text>
              )}
              <Text className="text-xs text-ui-fg-subtle">
                {t('baselinker.import.selectAllTip', { defaultValue: 'Tip: Select specific products to import only those, or set up all products to import everything' })}
              </Text>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Importing Content
function ImportingContent({
  isComplete,
  importResult,
  isImporting,
}: {
  isComplete: boolean
  importResult: { successful: number; failed: number } | null
  isImporting: boolean
}) {
  const { t } = useTranslation()

  if (isImporting) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8">
        <svg 
          className="h-12 w-12 animate-spin text-ui-fg-muted" 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          />
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <Text className="mt-4 text-lg font-medium">
          {t('baselinker.import.importing', { defaultValue: 'Importing products...' })}
        </Text>
        <Text className="text-ui-fg-subtle">
          {t('baselinker.import.pleaseWait', { defaultValue: 'Please wait, this may take a few minutes.' })}
        </Text>
      </div>
    )
  }

  if (isComplete && importResult) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8">
        <svg 
          className="h-16 w-16 text-ui-fg-interactive" 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="currentColor"
        >
          <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
        </svg>
        <Text className="mt-4 text-2xl font-semibold text-ui-fg-base">
          {t('baselinker.import.complete', { defaultValue: 'Import Complete!' })}
        </Text>
        <Text className="mt-2 text-ui-fg-subtle">
          {t('baselinker.import.successMessage', {
            defaultValue: `Successfully imported ${importResult.successful} products.`,
            count: importResult.successful,
          })}
        </Text>
        {importResult.failed > 0 && (
          <Text className="mt-1 text-amber-600">
            {t('baselinker.import.failedMessage', {
              defaultValue: `${importResult.failed} products failed to import.`,
              count: importResult.failed,
            })}
          </Text>
        )}
      </div>
    )
  }

  return null
}

export default BaseLinkerImport
