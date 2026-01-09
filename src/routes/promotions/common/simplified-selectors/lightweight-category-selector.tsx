import { Badge, Text } from '@medusajs/ui'
import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useProductCategories } from '../../../../hooks/api/categories'
import { X } from '@medusajs/icons'

type LightweightCategorySelectorProps = {
  selectedCategoryIds: string[]
  onChange: (categoryIds: string[]) => void
  disabled?: boolean
}

export const LightweightCategorySelector = ({
  selectedCategoryIds,
  onChange,
  disabled = false,
}: LightweightCategorySelectorProps) => {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  // Fetch all categories (usually not too many)
  const { product_categories: allCategories, isLoading } = useProductCategories({
    fields: 'id,name,parent_category_id',
  })

  // Create a Set for O(1) lookup
  const selectedIdsSet = useMemo(() => new Set(selectedCategoryIds), [selectedCategoryIds])

  // Get selected categories for display
  const selectedCategories = useMemo(() => {
    if (!allCategories) return []
    return allCategories.filter((cat) => selectedIdsSet.has(cat.id))
  }, [allCategories, selectedIdsSet])

  // Filter categories by search
  const filteredCategories = useMemo(() => {
    if (!allCategories) return []
    
    let filtered = allCategories.filter((cat) => !selectedIdsSet.has(cat.id))
    
    if (searchQuery.length > 0) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((cat) =>
        cat.name.toLowerCase().includes(query)
      )
    }
    
    return filtered.slice(0, 20) // Limit to 20 results
  }, [allCategories, selectedIdsSet, searchQuery])

  const handleAddCategory = (categoryId: string) => {
    if (!selectedIdsSet.has(categoryId)) {
      onChange([...selectedCategoryIds, categoryId])
    }
    setSearchQuery('')
    setIsSearching(false)
  }

  const handleRemoveCategory = (categoryId: string) => {
    onChange(selectedCategoryIds.filter((id) => id !== categoryId))
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Text size="small" weight="plus">
          {t('promotions.fields.selectCategories')} ({selectedCategoryIds.length}{' '}
          {t('promotions.fields.selected')})
        </Text>
      </div>

      {/* Selected Categories Display */}
      {selectedCategories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedCategories.map((category) => (
            <Badge key={category.id} size="small" className="flex items-center gap-1.5">
              <span className="max-w-[200px] truncate">{category.name}</span>
              <button
                type="button"
                onClick={() => !disabled && handleRemoveCategory(category.id)}
                disabled={disabled}
                className="hover:text-ui-fg-base transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          placeholder={t('promotions.fields.searchCategories')}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            setIsSearching(true)
          }}
          onFocus={() => setIsSearching(true)}
          className="bg-ui-bg-field shadow-borders-base placeholder:text-ui-fg-muted text-ui-fg-base transition-fg flex h-8 w-full items-center gap-x-2 rounded-md px-2 text-sm outline-none focus:shadow-borders-interactive-with-active"
          disabled={disabled}
        />

        {/* Dropdown Results */}
        {isSearching && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-ui-bg-base border border-ui-border-base rounded-md shadow-elevation-flyout z-50 max-h-[300px] overflow-y-auto">
            {isLoading ? (
              <div className="px-3 py-2 text-sm text-ui-fg-subtle">
                {t('general.loading')}...
              </div>
            ) : filteredCategories.length > 0 ? (
              <div className="py-1">
                {filteredCategories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => handleAddCategory(category.id)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-ui-bg-subtle-hover transition-colors"
                    disabled={disabled}
                  >
                    <Text size="small">{category.name}</Text>
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-3 py-2 text-sm text-ui-fg-subtle">
                {t('promotions.fields.noCategories')}
              </div>
            )}
          </div>
        )}
      </div>

      {selectedCategoryIds.length === 0 && (
        <Text size="xsmall" className="text-ui-fg-subtle">
          {t('promotions.fields.searchToAddCategories')}
        </Text>
      )}
    </div>
  )
}
