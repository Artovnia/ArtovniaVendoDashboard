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
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Text size="small" weight="plus">
          {t('promotions.fields.selectProducts')} ({selectedProductIds.length}{' '}
          {t('promotions.fields.selected')})
        </Text>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Text size="small" className="text-ui-fg-subtle">
            Loading...
          </Text>
        </div>
      ) : (
        <div className="rounded-md border border-ui-border-base overflow-hidden">
          {products && products.length > 0 ? (
            <>
              <div className="bg-ui-bg-subtle flex items-center gap-3 px-3 py-2 border-b border-ui-border-base">
                <Checkbox
                  checked={allCurrentPageSelected}
                  onCheckedChange={handleToggleAll}
                  disabled={disabled}
                />
                <Text size="xsmall" weight="plus" className="text-ui-fg-subtle">
                  {t('promotions.fields.selectAllOnPage')}
                </Text>
              </div>

              <div className="flex flex-col divide-y divide-ui-border-base">
                {products.map((product: HttpTypes.AdminProduct) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-3 px-3 py-2.5 bg-ui-bg-base hover:bg-ui-bg-subtle-hover transition-colors min-h-[44px]"
                  >
                    <Checkbox
                      checked={selectedIdsSet.has(product.id)}
                      onCheckedChange={() => handleToggleProduct(product.id)}
                      disabled={disabled}
                    />
                    <Thumbnail src={product.thumbnail || undefined} size="small" />
                    <Text size="small" weight="plus" className="truncate flex-1 min-w-0">
                      {product.title}
                    </Text>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center py-8">
              <Text size="small" className="text-ui-fg-subtle">
                {t('promotions.fields.noProducts')}
              </Text>
            </div>
          )}

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-3 py-2 bg-ui-bg-subtle border-t border-ui-border-base">
              <Text size="xsmall" className="text-ui-fg-muted">
                {currentPage * PAGE_SIZE + 1}–{Math.min((currentPage + 1) * PAGE_SIZE, count || 0)} z {count || 0}
              </Text>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                  disabled={currentPage === 0 || disabled}
                  className="px-2 py-1 text-xs rounded hover:bg-ui-bg-base-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  ‹
                </button>
                <Text size="xsmall" className="text-ui-fg-subtle px-1">
                  {currentPage + 1} / {totalPages}
                </Text>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={currentPage >= totalPages - 1 || disabled}
                  className="px-2 py-1 text-xs rounded hover:bg-ui-bg-base-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  ›
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
})
