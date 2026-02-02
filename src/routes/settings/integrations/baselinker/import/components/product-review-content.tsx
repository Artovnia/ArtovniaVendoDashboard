import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Text, Badge, Checkbox, Input, Select, Button } from '@medusajs/ui'
import { SquaresPlus } from '@medusajs/icons'
import { CategorySelect } from '../../../../../products/common/components/category-combobox/category-select'
import { ShippingProfileCombobox } from '../../../../../../components/inputs/shipping-profile-combobox'
import type { ProductWithAssignment, VariantGroup } from '../../../../../../types/baselinker'

interface ProductReviewContentProps {
  products: ProductWithAssignment[]
  setProducts: React.Dispatch<React.SetStateAction<ProductWithAssignment[]>>
  counts: {
    needsCategory: number
    needsShipping: number
    ready: number
    total: number
    selectedCount: number
    selectedReady: number
    selectedNeedsSetup: number
  }
  selectedProductIds: string[]
  setSelectedProductIds: React.Dispatch<React.SetStateAction<string[]>>
  variantGroups: VariantGroup[]
  setVariantGroups: React.Dispatch<React.SetStateAction<VariantGroup[]>>
  selectedGroupIds: string[]
  setSelectedGroupIds: React.Dispatch<React.SetStateAction<string[]>>
  onOpenGroupingModal: (group: VariantGroup) => void
  groupedProductIds: Set<string>
}

export function ProductReviewContent({
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
}: ProductReviewContentProps) {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'missing-category' | 'missing-shipping'>('all')
  const [bulkCategoryId, setBulkCategoryId] = useState<string>('')
  const [bulkShippingProfileId, setBulkShippingProfileId] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'single' | 'groups'>('single')
  
  const selectedIds = selectedProductIds
  const setSelectedIds = setSelectedProductIds

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
  
  const updateGroupCategory = (groupId: string, categoryId: string | null) => {
    setVariantGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, assigned_category_id: categoryId } : g))
    )
  }
  
  const updateGroupShippingProfile = (groupId: string, shippingProfileId: string | null) => {
    setVariantGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, assigned_shipping_profile_id: shippingProfileId } : g))
    )
  }

  const applyBulkCategory = () => {
    if (!bulkCategoryId) return
    
    if (activeTab === 'groups') {
      if (selectedGroupIds.length === 0) return
      setVariantGroups((prev) =>
        prev.map((g) =>
          selectedGroupIds.includes(g.id) ? { ...g, assigned_category_id: bulkCategoryId } : g
        )
      )
    } else {
      if (selectedIds.length === 0) return
      setProducts((prev) =>
        prev.map((p) =>
          selectedIds.includes(p.id) ? { ...p, assigned_category_id: bulkCategoryId } : p
        )
      )
    }
    setBulkCategoryId('')
  }

  const applyBulkShippingProfile = () => {
    if (!bulkShippingProfileId) return
    
    if (activeTab === 'groups') {
      if (selectedGroupIds.length === 0) return
      setVariantGroups((prev) =>
        prev.map((g) =>
          selectedGroupIds.includes(g.id) ? { ...g, assigned_shipping_profile_id: bulkShippingProfileId } : g
        )
      )
    } else {
      if (selectedIds.length === 0) return
      setProducts((prev) =>
        prev.map((p) =>
          selectedIds.includes(p.id) ? { ...p, assigned_shipping_profile_id: bulkShippingProfileId } : p
        )
      )
    }
    setBulkShippingProfileId('')
  }
  
  const currentSelectionCount = activeTab === 'groups' ? selectedGroupIds.length : selectedIds.length

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="border-b border-ui-border-base p-4 space-y-4">
        <div className="flex items-center gap-4">
          <Checkbox
            checked={
              activeTab === 'groups'
                ? selectedGroupIds.length === filteredVariantGroups.length && filteredVariantGroups.length > 0
                : selectedIds.length === filteredProducts.length && filteredProducts.length > 0
            }
            onCheckedChange={(checked) => {
              if (activeTab === 'groups') {
                setSelectedGroupIds(checked ? filteredVariantGroups.map((g) => g.id) : [])
              } else {
                setSelectedIds(checked ? filteredProducts.map((p) => p.id) : [])
              }
            }}
          />
          <Text className="text-sm text-ui-fg-subtle min-w-[80px]">
            {currentSelectionCount} {t('baselinker.import.selected', { defaultValue: 'selected' })}
            {activeTab === 'groups' && ' (grup)'}
          </Text>
        </div>

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
              disabled={!bulkCategoryId || currentSelectionCount === 0}
            >
              {t('baselinker.import.apply', { defaultValue: 'Apply' })}
            </Button>
          </div>
        </div>

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
              disabled={!bulkShippingProfileId || currentSelectionCount === 0}
            >
              {t('baselinker.import.apply', { defaultValue: 'Apply' })}
            </Button>
          </div>
        </div>

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

      {/* Tab Navigation */}
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

      {/* Variant Groups Tab */}
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

      {/* Standalone Products Header */}
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
      
      {/* Product List */}
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
                  <div className="flex items-center gap-3 mt-1 lg:hidden">
                    <Text className="font-medium text-sm">{product.price.toFixed(2)} zł</Text>
                    <Text className="text-xs text-ui-fg-subtle">
                      {t('baselinker.import.stock', { defaultValue: 'Stock' })}: {product.quantity}
                    </Text>
                  </div>
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
              
              <div className="hidden md:block w-20 text-right">
                <Text className="font-medium text-sm">{product.price.toFixed(2)} zł</Text>
                <Text className="text-xs text-ui-fg-subtle">
                  {t('baselinker.import.stock', { defaultValue: 'Stock' })}: {product.quantity}
                </Text>
              </div>
              
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
