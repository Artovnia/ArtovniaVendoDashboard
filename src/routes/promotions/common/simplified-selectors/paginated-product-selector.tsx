import { Checkbox, Text } from '@medusajs/ui'
import { Thumbnail } from "../../../../components/common/thumbnail"
import { useState, useMemo, useCallback, memo } from 'react'
import { useTranslation } from 'react-i18next'
import { useProducts } from '../../../../hooks/api/products'
import { HttpTypes } from '@medusajs/types'

type PaginatedProductSelectorProps = {
  selectedProductIds: string[]
  onChange: (productIds: string[]) => void
  disabled?: boolean
}

export const PaginatedProductSelector = memo(({
  selectedProductIds,
  onChange,
  disabled = false,
}: PaginatedProductSelectorProps) => {
  const { t } = useTranslation()
  const [currentPage, setCurrentPage] = useState(0)
  const PAGE_SIZE = 20

  const { products, count, isLoading } = useProducts({
    limit: PAGE_SIZE,
    offset: currentPage * PAGE_SIZE,
    fields: 'id,title,thumbnail',
  })

  // Create a Set for O(1) lookup
  const selectedIdsSet = useMemo(() => new Set(selectedProductIds), [selectedProductIds])

  const handleToggleProduct = useCallback((productId: string) => {
    if (selectedIdsSet.has(productId)) {
      onChange(selectedProductIds.filter((id) => id !== productId))
    } else {
      onChange([...selectedProductIds, productId])
    }
  }, [selectedProductIds, onChange, selectedIdsSet])

  const handleToggleAll = useCallback(() => {
    if (!products) return

    const currentPageIds = products.map((p) => p.id)
    const allSelected = currentPageIds.every((id) => selectedIdsSet.has(id))

    if (allSelected) {
      onChange(selectedProductIds.filter((id) => !currentPageIds.includes(id)))
    } else {
      const newIds = currentPageIds.filter((id) => !selectedIdsSet.has(id))
      onChange([...selectedProductIds, ...newIds])
    }
  }, [products, selectedProductIds, onChange, selectedIdsSet])

  const totalPages = Math.ceil((count || 0) / PAGE_SIZE)
  const allCurrentPageSelected = useMemo(() => {
    if (!products || products.length === 0) return false
    return products.every((p) => selectedIdsSet.has(p.id))
  }, [products, selectedIdsSet])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Text size="small" weight="plus">
          {t('promotions.fields.selectProducts')} ({selectedProductIds.length}{' '}
          {t('promotions.fields.selected')})
        </Text>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Text size="small" className="text-ui-fg-subtle">
            {t('general.loading')}...
          </Text>
        </div>
      ) : (
        <>
          <div className="border-ui-border-base flex flex-col divide-y rounded-lg border">
            {products && products.length > 0 ? (
              <>
                <div className="bg-ui-bg-subtle flex items-center gap-3 px-4 py-2">
                  <Checkbox
                    checked={allCurrentPageSelected}
                    onCheckedChange={handleToggleAll}
                    disabled={disabled}
                  />
                  <Text size="xsmall" weight="plus" className="text-ui-fg-subtle">
                    {t('promotions.fields.selectAllOnPage')}
                  </Text>
                </div>

                {products.map((product: HttpTypes.AdminProduct) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-ui-bg-subtle-hover transition-colors"
                  >
                    <Checkbox
                      checked={selectedIdsSet.has(product.id)}
                      onCheckedChange={() => handleToggleProduct(product.id)}
                      disabled={disabled}
                    />
                    <Thumbnail src={product.thumbnail || undefined} />
                    <Text size="small" weight="plus" className="flex-1">
                      {product.title}
                    </Text>
                  </div>
                ))}
              </>
            ) : (
              <div className="flex items-center justify-center py-8">
                <Text size="small" className="text-ui-fg-subtle">
                  {t('promotions.fields.noProducts')}
                </Text>
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0 || disabled}
                className="text-ui-fg-subtle hover:text-ui-fg-base disabled:text-ui-fg-disabled text-sm transition-colors disabled:cursor-not-allowed"
              >
                {t('general.previous')}
              </button>
              <Text size="small" className="text-ui-fg-subtle">
                {t('general.page')} {currentPage + 1} {t('general.of')}{' '}
                {totalPages}
              </Text>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages - 1, p + 1))
                }
                disabled={currentPage >= totalPages - 1 || disabled}
                className="text-ui-fg-subtle hover:text-ui-fg-base disabled:text-ui-fg-disabled text-sm transition-colors disabled:cursor-not-allowed"
              >
                {t('general.next')}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
})
