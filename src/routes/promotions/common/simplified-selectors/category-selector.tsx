import { Checkbox, Text } from '@medusajs/ui'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useProductCategories } from '../../../../hooks/api/categories'

type CategorySelectorProps = {
  selectedCategoryIds: string[]
  onChange: (categoryIds: string[]) => void
  disabled?: boolean
}

type CategoryNode = {
  id: string
  name: string
  handle: string
  children: CategoryNode[]
  level: number
}

export const CategorySelector = ({
  selectedCategoryIds,
  onChange,
  disabled = false,
}: CategorySelectorProps) => {
  const { t } = useTranslation()

  const { product_categories, isLoading } = useProductCategories({
    fields: 'id,name,handle,parent_category_id',
    limit: 1000,
  })

  const categoryTree = useMemo(() => {
    if (!product_categories) return []

    const buildTree = (
      categories: any[],
      parentId: string | null = null,
      level: number = 0
    ): CategoryNode[] => {
      return categories
        .filter((cat) => cat.parent_category_id === parentId)
        .map((cat) => ({
          id: cat.id,
          name: cat.name,
          handle: cat.handle,
          level,
          children: buildTree(categories, cat.id, level + 1),
        }))
    }

    return buildTree(product_categories)
  }, [product_categories])

  const handleToggleCategory = (categoryId: string) => {
    if (selectedCategoryIds.includes(categoryId)) {
      onChange(selectedCategoryIds.filter((id) => id !== categoryId))
    } else {
      onChange([...selectedCategoryIds, categoryId])
    }
  }

  const renderCategory = (category: CategoryNode) => {
    const isSelected = selectedCategoryIds.includes(category.id)
    const hasChildren = category.children.length > 0

    return (
      <div key={category.id} className="flex flex-col">
        <div
          className="flex items-center gap-3 px-4 py-2 hover:bg-ui-bg-subtle-hover transition-colors"
          style={{ paddingLeft: `${16 + category.level * 24}px` }}
        >
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => handleToggleCategory(category.id)}
            disabled={disabled}
          />
          <Text size="small" weight={hasChildren ? 'plus' : 'regular'}>
            {category.name}
          </Text>
        </div>
        {hasChildren && (
          <div className="flex flex-col">
            {category.children.map((child) => renderCategory(child))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Text size="small" weight="plus">
          {t('promotions.fields.selectCategories')} (
          {selectedCategoryIds.length} {t('promotions.fields.selected')})
        </Text>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Text size="small" className="text-ui-fg-subtle">
            {t('general.loading')}...
          </Text>
        </div>
      ) : (
        <div className="border-ui-border-base flex flex-col rounded-lg border max-h-96 overflow-y-auto">
          {categoryTree.length > 0 ? (
            categoryTree.map((category) => renderCategory(category))
          ) : (
            <div className="flex items-center justify-center py-8">
              <Text size="small" className="text-ui-fg-subtle">
                {t('promotions.fields.noCategories')}
              </Text>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
