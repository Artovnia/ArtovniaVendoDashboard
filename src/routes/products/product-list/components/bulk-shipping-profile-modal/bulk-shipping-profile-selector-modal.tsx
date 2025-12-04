import { Button, Checkbox, Heading, Input, Select, Text, toast } from "@medusajs/ui"
import { useState, useMemo } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { HttpTypes } from "@medusajs/types"

import { Form } from "../../../../../components/common/form"
import { ShippingProfileCombobox } from "../../../../../components/inputs/shipping-profile-combobox"
import { RouteFocusModal } from "../../../../../components/modals"
import { useBulkAssociateProductsWithShippingProfile } from "../../../../../hooks/api/product-shipping-profile"
import { useShippingProfiles } from "../../../../../hooks/api/shipping-profiles"
import { translateShippingProfileKey } from "../../../../../lib/shipping-profile-i18n"

type BulkShippingProfileSelectorModalProps = {
  products: HttpTypes.AdminProduct[]
  onClose: () => void
}

const BulkShippingProfileSchema = z.object({
  shipping_profile_id: z.string().optional(),
})

export const BulkShippingProfileSelectorModal = ({
  products,
  onClose,
}: BulkShippingProfileSelectorModalProps) => {
  const { t } = useTranslation()
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterProfileId, setFilterProfileId] = useState<string>("")
  const [filterStatus, setFilterStatus] = useState<string>("")

  const { shipping_profiles } = useShippingProfiles({})

  const form = useForm({
    defaultValues: {
      shipping_profile_id: "",
    },
    resolver: zodResolver(BulkShippingProfileSchema),
  })

  const { mutateAsync: bulkAssign } = useBulkAssociateProductsWithShippingProfile()

  // Filter products based on search and filters
  const filteredProducts = useMemo(() => {
    
    return products.filter((product) => {
      // Search filter
      if (searchQuery && !product.title?.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }

      // Shipping profile filter
      if (filterProfileId) {
        if (filterProfileId === "null") {
          // Show products without shipping profile
          if (product.shipping_profile) return false
        } else {
          // Show products with specific profile
          if (product.shipping_profile?.id !== filterProfileId) return false
        }
      }

      // Status filter
      if (filterStatus && product.status !== filterStatus) {
        return false
      }

      return true
    })
  }, [products, searchQuery, filterProfileId, filterStatus])

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

  const handleSubmit = form.handleSubmit(async (data) => {
    if (selectedProductIds.size === 0) {
      toast.error(t("products.bulk.noProductsSelected"))
      return
    }

    setIsSubmitting(true)
    const shippingProfileId = data.shipping_profile_id === "" ? null : data.shipping_profile_id

    try {
      await bulkAssign({
        productIds: Array.from(selectedProductIds),
        shippingProfileId,
      })

      toast.success(
        t("products.bulk.assignSuccess", { count: selectedProductIds.size })
      )
      onClose()
    } catch (error: any) {
      toast.error(
        t("products.bulk.error"),
        { description: error?.message || t("products.bulk.unknownError") }
      )
    } finally {
      setIsSubmitting(false)
    }
  })

  const allSelected = selectedProductIds.size === products.length && products.length > 0
  const someSelected = selectedProductIds.size > 0 && selectedProductIds.size < products.length

  return (
    <RouteFocusModal>
      <RouteFocusModal.Header>
        <div className="flex flex-col gap-y-1">
          <Heading level="h2">
            {t("products.bulk.assignShippingProfile")}
          </Heading>
          <Text size="small" className="text-ui-fg-subtle">
            {t("products.bulk.selectProductsAndProfile")}
          </Text>
        </div>
      </RouteFocusModal.Header>
      <RouteFocusModal.Body className="flex flex-col gap-y-6 p-6">
        <Form {...form}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-y-6">
            {/* Filters */}
            <div className="flex flex-col gap-y-3">
              <Text size="small" weight="plus">
                {t("filters.filters")}
              </Text>
              <div className="grid grid-cols-2 gap-3">
                {/* Search */}
                <div className="col-span-2">
                  <Input
                    placeholder={t("actions.search")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    size="small"
                  />
                </div>

                {/* Shipping Profile Filter */}
                <div>
                  <Select
                    value={filterProfileId || "all"}
                    onValueChange={(value) => setFilterProfileId(value === "all" ? "" : value)}
                    size="small"
                  >
                    <Select.Trigger>
                      <Select.Value placeholder={t("formFields.shipping_profile.label")} />
                    </Select.Trigger>
                    <Select.Content>
                      <Select.Item value="all">
                        {t("filters.all")}
                      </Select.Item>
                      <Select.Item value="null">
                        {t("products.bulk.noShippingProfile")}
                      </Select.Item>
                      {shipping_profiles?.map((profile) => (
                        <Select.Item key={profile.id} value={profile.id}>
                          {translateShippingProfileKey(profile.name, false, t)}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select>
                </div>

                {/* Status Filter */}
                <div>
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
                  {t("products.bulk.selectProducts")} ({selectedProductIds.size}/{filteredProducts.length})
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

              <div className="max-h-[600px] overflow-y-auto border rounded-lg divide-y">
                {filteredProducts.length === 0 ? (
                  <div className="p-4 text-center">
                    <Text size="small" className="text-ui-fg-subtle">
                      {searchQuery || filterProfileId || filterStatus
                        ? t("filters.noResults")
                        : t("products.bulk.noProducts")}
                    </Text>
                  </div>
                ) : (
                  filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center gap-x-3 p-3"
                    >
                      <div className="flex-shrink-0">
                        <Checkbox
                          checked={selectedProductIds.has(product.id)}
                          onCheckedChange={() => handleProductToggle(product.id)}
                        />
                      </div>
                      <div className="flex items-center gap-x-3 flex-1 min-w-0">
                        {product.thumbnail && (
                          <div className="flex-shrink-0">
                            <img
                              src={product.thumbnail}
                              alt={product.title}
                              className="w-12 h-12 object-cover rounded border border-ui-border-base"
                            />
                          </div>
                        )}
                        <div className="flex flex-col min-w-0 flex-1">
                          <Text size="small" weight="plus" className="truncate">
                            {product.title}
                          </Text>
                          {product.subtitle && (
                            <Text size="xsmall" className="text-ui-fg-subtle truncate">
                              {product.subtitle}
                            </Text>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Shipping Profile Selection - Moved below product list */}
            <div className="flex flex-col gap-y-3">
              <div className="flex flex-col gap-y-1">
                <Heading level="h2" className="text-ui-fg-success mb-2" >
                  {t("products.bulk.assignToProfile")}
                </Heading>
                <Text size="xsmall" className="text-ui-fg-subtle">
                  {t("products.bulk.assignToProfileDescription")}
                </Text>
              </div>
              <Form.Field
                control={form.control}
                name="shipping_profile_id"
                render={({ field }) => {
                  return (
                    <Form.Item>
                      <Form.Control>
                        <ShippingProfileCombobox
                          {...field}
                          allowClear
                          showValidationBadges={true}
                          showWarningMessages={true}
                        />
                      </Form.Control>
                      <Form.Hint>
                        {t("products.bulk.selectProfileHint")}
                      </Form.Hint>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )
                }}
              />
            </div>
          </form>
        </Form>
      </RouteFocusModal.Body>
      <RouteFocusModal.Footer>
        <div className="flex items-center justify-end gap-x-2">
          <Button size="small" variant="secondary" onClick={onClose}>
            {t("actions.cancel")}
          </Button>
          <Button
            size="small"
            variant="primary"
            onClick={handleSubmit}
            disabled={selectedProductIds.size === 0 || isSubmitting}
            isLoading={isSubmitting}
          >
            {t("actions.confirm")} ({selectedProductIds.size})
          </Button>
        </div>
      </RouteFocusModal.Footer>
    </RouteFocusModal>
  )
}
