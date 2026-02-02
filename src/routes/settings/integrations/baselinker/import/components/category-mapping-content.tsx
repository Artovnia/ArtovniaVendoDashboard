import { useTranslation } from 'react-i18next'
import { Text, Badge } from '@medusajs/ui'
import { CategorySelect } from '../../../../../products/common/components/category-combobox/category-select'

interface CategoryMappingContentProps {
  categories: Array<{ id: string; name: string; productCount: number }>
  mappings: Map<string, string | null>
  setMappings: React.Dispatch<React.SetStateAction<Map<string, string | null>>>
}

export function CategoryMappingContent({
  categories,
  mappings,
  setMappings,
}: CategoryMappingContentProps) {
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
