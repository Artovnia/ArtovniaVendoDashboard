import { Button, Checkbox, Heading, Input, Select, Text, toast } from "@medusajs/ui"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { HttpTypes } from "@medusajs/types"
import { ChevronLeft, ChevronRight } from "@medusajs/icons"

import { RouteFocusModal } from "../../../../../components/modals"
import { useBulkSetDeliveryTimeframe } from "../../../../../hooks/api/delivery-timeframe"
import { DeliveryTimeframeSelect, DeliveryTimeframeValue } from "../../../../../components/inputs/delivery-timeframe-select"

const PAGE_SIZE = 20

type BulkDeliveryTimeframeModalProps = {
  products: HttpTypes.AdminProduct[]
  onClose: () => void
}

export const BulkDeliveryTimeframeModal = ({
  products,
  onClose,
}: BulkDeliveryTimeframeModalProps) => {
  const { t } = useTranslation()
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set())
  const [selectedTimeframe, setSelectedTimeframe] = useState<DeliveryTimeframeValue | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("")
  const [currentPage, setCurrentPage] = useState(1)

  const { mutateAsync: bulkSetTimeframe } = useBulkSetDeliveryTimeframe()

  // Filter products based on search and filters
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Search filter
      if (searchQuery && !product.title?.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }

      // Status filter
      if (filterStatus && product.status !== filterStatus) {
        return false
      }

      return true
    })
  }, [products, searchQuery, filterStatus])

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / PAGE_SIZE)
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredProducts.slice(start, start + PAGE_SIZE)
  }, [filteredProducts, currentPage])

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1)
  }, [searchQuery, filterStatus])

  const handleProductToggle = (productId: string) => {
    setSelectedProductIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(productId)) {
        newSet.delete(productId)
      } else {
        newSet.add(productId)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    if (selectedProductIds.size === filteredProducts.length) {
      setSelectedProductIds(new Set())
    } else {
      setSelectedProductIds(new Set(filteredProducts.map((p) => p.id)))
    }
  }

  const handleSubmit = async () => {
    if (selectedProductIds.size === 0) {
      toast.error(t("deliveryTimeframe.noProductsSelected"))
      return
    }

    if (!selectedTimeframe) {
      toast.error(t("deliveryTimeframe.noTimeframe"))
      return
    }

    setIsSubmitting(true)

    try {
      const payload: {
        product_ids: string[]
        preset?: "1-3" | "3-5" | "7-14"
        min_days?: number
        max_days?: number
        label?: string
      } = {
        product_ids: Array.from(selectedProductIds),
      }

      if (selectedTimeframe.preset && selectedTimeframe.preset !== "custom") {
        payload.preset = selectedTimeframe.preset as "1-3" | "3-5" | "7-14"
      } else {
        payload.min_days = selectedTimeframe.min_days
        payload.max_days = selectedTimeframe.max_days
        payload.label = selectedTimeframe.label
      }

      await bulkSetTimeframe(payload)

      toast.success(
        t("deliveryTimeframe.bulkSuccess", { count: selectedProductIds.size })
      )
      onClose()
    } catch (error: any) {
      toast.error(
        t("deliveryTimeframe.bulkError"),
        { description: error?.message }
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const allSelected = selectedProductIds.size === filteredProducts.length && filteredProducts.length > 0

  return (
    <RouteFocusModal>
      <RouteFocusModal.Header>
        <div className="flex flex-col gap-y-1">
          <Heading level="h2">
            {t("deliveryTimeframe.bulkTitle")}
          </Heading>
          <Text size="small" className="text-ui-fg-subtle">
            {t("deliveryTimeframe.bulkDescription")}
          </Text>
        </div>
      </RouteFocusModal.Header>
      <RouteFocusModal.Body className="flex flex-col gap-y-4 sm:gap-y-6 p-4 sm:p-6 overflow-y-auto">
        {/* Filters */}
        <div className="flex flex-col gap-y-2 sm:gap-y-3">
          <Text size="small" weight="plus">
            {t("filters.filters")}
          </Text>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            {/* Search */}
            <div className="col-span-1 sm:col-span-2">
              <Input
                placeholder={t("actions.search")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="small"
              />
            </div>

            {/* Status Filter */}
            <div className="col-span-1">
              <Select
                value={filterStatus || "all"}
                onValueChange={(value) => setFilterStatus(value === "all" ? "" : value)}
                size="small"
              >
                <Select.Trigger>
                  <Select.Value placeholder={t("fields.status")} />
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="all">
                    {t("filters.all")}
                  </Select.Item>
                  <Select.Item value="draft">
                    {t("productStatus.draft")}
                  </Select.Item>
                  <Select.Item value="proposed">
                    {t("productStatus.proposed")}
                  </Select.Item>
                  <Select.Item value="published">
                    {t("productStatus.published")}
                  </Select.Item>
                  <Select.Item value="rejected">
                    {t("productStatus.rejected")}
                  </Select.Item>
                </Select.Content>
              </Select>
            </div>
          </div>
        </div>

        {/* Product Selection */}
        <div className="flex flex-col gap-y-3">
          <div className="flex items-center justify-between pb-2">
            <Text size="small" weight="plus">
              {t("deliveryTimeframe.selectProducts")} ({selectedProductIds.size}/{filteredProducts.length})
            </Text>
            <Button
              size="small"
              variant="secondary"
              type="button"
              onClick={handleSelectAll}
            >
              {allSelected ? t("actions.deselectAll") : t("actions.selectAll")}
            </Button>
          </div>

          <div className="min-h-[300px] sm:min-h-[400px] md:min-h-[500px] max-h-[50vh] sm:max-h-[60vh] overflow-y-auto border rounded-lg divide-y">
            {filteredProducts.length === 0 ? (
              <div className="p-4 text-center">
                <Text size="small" className="text-ui-fg-subtle">
                  {searchQuery || filterStatus
                    ? t("filters.noResults")
                    : t("products.bulk.noProducts")}
                </Text>
              </div>
            ) : (
              paginatedProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center gap-x-2 sm:gap-x-3 p-2 sm:p-3"
                >
                  <div className="flex-shrink-0">
                    <Checkbox
                      checked={selectedProductIds.has(product.id)}
                      onCheckedChange={() => handleProductToggle(product.id)}
                    />
                  </div>
                  <div className="flex items-center gap-x-2 sm:gap-x-3 flex-1 min-w-0">
                    {product.thumbnail && (
                      <div className="flex-shrink-0">
                        <img
                          src={product.thumbnail}
                          alt={product.title}
                          className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded border border-ui-border-base"
                        />
                      </div>
                    )}
                    <div className="flex flex-col min-w-0 flex-1">
                      <Text size="small" weight="plus" className="truncate">
                        {product.title}
                      </Text>
                      {product.subtitle && (
                        <Text size="xsmall" className="text-ui-fg-subtle truncate hidden sm:block">
                          {product.subtitle}
                        </Text>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t">
              <Text size="xsmall" className="text-ui-fg-subtle">
                {t("general.showingOf", {
                  showing: `${(currentPage - 1) * PAGE_SIZE + 1}-${Math.min(currentPage * PAGE_SIZE, filteredProducts.length)}`,
                  total: filteredProducts.length,
                })}
              </Text>
              <div className="flex items-center gap-x-2">
                <Button
                  size="small"
                  variant="secondary"
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Text size="small" className="min-w-[60px] text-center">
                  {currentPage} / {totalPages}
                </Text>
                <Button
                  size="small"
                  variant="secondary"
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Delivery Timeframe Selection */}
        <div className="flex flex-col gap-y-3">
          <div className="flex flex-col gap-y-1">
            <Heading level="h2" className="text-ui-fg-success mb-2">
              {t("deliveryTimeframe.title")}
            </Heading>
            <Text size="xsmall" className="text-ui-fg-subtle">
              {t("deliveryTimeframe.hint")}
            </Text>
          </div>
          <DeliveryTimeframeSelect
            value={selectedTimeframe || undefined}
            onChange={(value) => setSelectedTimeframe(value)}
            showClearOption={false}
          />
        </div>
      </RouteFocusModal.Body>
      <RouteFocusModal.Footer>
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 w-full">
          <Button size="small" variant="secondary" onClick={onClose} className="w-full sm:w-auto">
            {t("actions.cancel")}
          </Button>
          <Button
            size="small"
            variant="primary"
            onClick={handleSubmit}
            disabled={selectedProductIds.size === 0 || !selectedTimeframe || isSubmitting}
            isLoading={isSubmitting}
            className="w-full sm:w-auto"
          >
            {t("actions.confirm")} ({selectedProductIds.size})
          </Button>
        </div>
      </RouteFocusModal.Footer>
    </RouteFocusModal>
  )
}
