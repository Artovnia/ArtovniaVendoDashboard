import { useState, useEffect, useMemo } from 'react'
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
import { ArrowPath, CheckCircleSolid } from '@medusajs/icons'
import { RouteFocusModal } from '../../../../../components/modals'
import {
  useProductsPreview,
  useCategoryMappings,
  useSaveCategoryMappings,
  useImportBulk,
} from '../../../../../hooks/api/baselinker'
import { CategorySelect } from '../../../../products/common/components/category-combobox/category-select'
import { ShippingProfileCombobox } from '../../../../../components/inputs/shipping-profile-combobox'
import type { ProductWithAssignment, CategoryMapping } from '../../../../../types/baselinker'

enum Tab {
  CATEGORIES = 'categories',
  PRODUCTS = 'products',
  IMPORTING = 'importing',
}

type TabState = Record<Tab, ProgressStatus>

export function BaseLinkerImport() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  
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

  // API hooks
  const { refetch: fetchPreview, isFetching: isLoadingProducts } = useProductsPreview()
  const { data: savedMappings, isLoading: isMappingsLoading } = useCategoryMappings()
  const saveMappings = useSaveCategoryMappings()
  const importBulk = useImportBulk()

  // Load products on mount
  useEffect(() => {
    loadProducts()
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
    } catch (error: any) {
      toast.error(t('baselinker.import.loadError', { defaultValue: 'Failed to load products from BaseLinker' }))
    }
  }

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
    // Save mappings if user wants
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

  const handleImport = async (defaultShippingProfileId: string, productsToImport?: ProductWithAssignment[]) => {
    setTab(Tab.IMPORTING)
    setTabState({
      [Tab.CATEGORIES]: 'completed',
      [Tab.PRODUCTS]: 'completed',
      [Tab.IMPORTING]: 'in-progress',
    })

    // Use selected products if provided, otherwise use all products
    const importProducts = productsToImport || products

    try {
      const categoryMapping: Record<string, string> = {}
      importProducts.forEach((p) => {
        if (p.baselinker_category_id && p.assigned_category_id) {
          categoryMapping[p.baselinker_category_id] = p.assigned_category_id
        }
      })

      const productAssignments = importProducts.map((p) => ({
        bl_product_id: p.id,
        category_id: p.assigned_category_id || undefined,
        shipping_profile_id: p.assigned_shipping_profile_id || undefined,
      }))

      const result = await importBulk.mutateAsync({
        bl_product_ids: importProducts.map((p) => p.id),
        connection_id: connectionId,
        category_mapping: categoryMapping,
        default_currency: 'pln',
        default_status: 'proposed',
        batch_size: 5,
        default_shipping_profile_id: defaultShippingProfileId || undefined,
        product_assignments: productAssignments,
      })

      setImportResult({
        successful: result.successful_imports || importProducts.length,
        failed: result.failed_imports || 0,
      })
      setIsComplete(true)
      setTabState({
        [Tab.CATEGORIES]: 'completed',
        [Tab.PRODUCTS]: 'completed',
        [Tab.IMPORTING]: 'completed',
      })
    } catch (error: any) {
      toast.error(t('baselinker.import.importError', { defaultValue: 'Import failed' }))
      setTab(Tab.PRODUCTS)
      setTabState({
        [Tab.CATEGORIES]: 'completed',
        [Tab.PRODUCTS]: 'in-progress',
        [Tab.IMPORTING]: 'not-started',
      })
    }
  }

  // Selected products for selective import
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])

  // Calculate counts
  const counts = useMemo(() => {
    const needsCategory = products.filter((p) => !p.assigned_category_id).length
    const needsShipping = products.filter((p) => !p.assigned_shipping_profile_id).length
    const ready = products.filter((p) => p.assigned_category_id && p.assigned_shipping_profile_id).length
    
    // Count selected products that are ready
    const selectedReady = selectedProductIds.filter(id => {
      const product = products.find(p => p.id === id)
      return product && product.assigned_category_id && product.assigned_shipping_profile_id
    }).length
    const selectedNeedsSetup = selectedProductIds.length - selectedReady
    
    return { 
      needsCategory, 
      needsShipping, 
      ready, 
      total: products.length,
      selectedCount: selectedProductIds.length,
      selectedReady,
      selectedNeedsSetup
    }
  }, [products, selectedProductIds])

  const mappedCategoriesCount = Array.from(mappings.values()).filter((v) => v !== null).length

  return (
    <RouteFocusModal prev="/settings/integrations/baselinker">
      <RouteFocusModal.Title asChild>
        <span className="sr-only">
          {t('baselinker.import.title')}
        </span>
      </RouteFocusModal.Title>
      <RouteFocusModal.Description asChild>
        <span className="sr-only">
          {t('baselinker.import.description')}
        </span>
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
          {/* Category Mapping Tab */}
          <ProgressTabs.Content className="size-full overflow-y-auto" value={Tab.CATEGORIES}>
            {isLoadingProducts || isMappingsLoading ? (
              <div className="flex h-full items-center justify-center">
                <ArrowPath className="animate-spin text-ui-fg-muted" />
                <Text className="ml-2 text-ui-fg-muted">
                  {t('baselinker.import.loading')}
                </Text>
              </div>
            ) : categories.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center p-8">
                <Text className="text-ui-fg-muted">
                  {t('baselinker.import.noCategories')}
                </Text>
                <Button className="mt-4" onClick={handleCategoryMappingNext}>
                  {t('baselinker.import.skipToProducts')}
                </Button>
              </div>
            ) : (
              <CategoryMappingContent
                categories={categories}
                mappings={mappings}
                setMappings={setMappings}
                mappedCount={mappedCategoriesCount}
              />
            )}
          </ProgressTabs.Content>

          {/* Product Review Tab */}
          <ProgressTabs.Content className="size-full overflow-y-auto" value={Tab.PRODUCTS}>
            <ProductReviewContent
              products={products}
              setProducts={setProducts}
              counts={counts}
              selectedProductIds={selectedProductIds}
              setSelectedProductIds={setSelectedProductIds}
            />
          </ProgressTabs.Content>

          {/* Importing Tab */}
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
                  {mappedCategoriesCount} / {categories.length}{' '}
                  {t('baselinker.import.categoriesMapped')}
                </Text>
              )}
              {tab === Tab.PRODUCTS && (
                <Text className="text-sm text-ui-fg-subtle">
                  {counts.ready} / {counts.total}{' '}
                  {t('baselinker.import.productsReady')}
                </Text>
              )}
            </div>
            <div className="flex items-center gap-x-2">
              <RouteFocusModal.Close asChild>
                <Button variant="secondary" size="small">
                  {isComplete
                    ? t('actions.close', { defaultValue: 'Close' })
                    : t('actions.cancel', { defaultValue: 'Cancel' })}
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
                        setTabState({
                          ...tabState,
                          [Tab.CATEGORIES]: 'in-progress',
                          [Tab.PRODUCTS]: 'not-started',
                        })
                      }}
                    >
                      {t('actions.back', { defaultValue: 'Back' })}
                    </Button>
                  )}
                  <Button
                    size="small"
                    onClick={() => {
                      // If products are selected, import only those; otherwise import all
                      if (counts.selectedCount > 0) {
                        const selectedProducts = products.filter(p => selectedProductIds.includes(p.id))
                        handleImport('', selectedProducts)
                      } else {
                        handleImport('')
                      }
                    }}
                    disabled={
                      counts.selectedCount > 0
                        ? counts.selectedNeedsSetup > 0  // Selected products must all be ready
                        : (counts.needsCategory > 0 || counts.needsShipping > 0)  // All products must be ready
                    }
                    isLoading={importBulk.isPending}
                  >
                    {counts.selectedCount > 0
                      ? t('baselinker.import.importSelected', { defaultValue: `Import Selected (${counts.selectedReady})` })
                      : t('baselinker.import.confirmImport', { defaultValue: 'Import Products' })
                    }
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

// Category Mapping Content
function CategoryMappingContent({
  categories,
  mappings,
  setMappings,
  mappedCount: _mappedCount,
}: {
  categories: Array<{ id: string; name: string; productCount: number }>
  mappings: Map<string, string | null>
  setMappings: React.Dispatch<React.SetStateAction<Map<string, string | null>>>
  mappedCount: number
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
            defaultValue: 'Connect your BaseLinker categories to marketplace categories. Products will be automatically assigned.',
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
}: {
  products: ProductWithAssignment[]
  setProducts: React.Dispatch<React.SetStateAction<ProductWithAssignment[]>>
  counts: { needsCategory: number; needsShipping: number; ready: number; total: number; selectedCount: number; selectedReady: number; selectedNeedsSetup: number }
  selectedProductIds: string[]
  setSelectedProductIds: React.Dispatch<React.SetStateAction<string[]>>
}) {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'missing-category' | 'missing-shipping'>('all')
  const [bulkCategoryId, setBulkCategoryId] = useState<string>('')
  const [bulkShippingProfileId, setBulkShippingProfileId] = useState<string>('')
  
  // Use the parent's selectedProductIds instead of local state
  const selectedIds = selectedProductIds
  const setSelectedIds = setSelectedProductIds

  const filteredProducts = useMemo(() => {
    let filtered = products
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
  }, [products, search, filter])

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

      {/* Product List */}
      <div className="flex-1 overflow-y-auto p-4 lg:space-y-0">
        <div className="space-y-2 lg:space-y-0">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="flex flex-col gap-3 rounded-lg border border-ui-border-base p-3 lg:flex-row lg:items-center"
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
        <ArrowPath className="h-12 w-12 animate-spin text-ui-fg-muted" />
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
        <CheckCircleSolid className="h-16 w-16 text-ui-fg-interactive" />
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
