import { Button, Checkbox, Heading, Text, toast } from "@medusajs/ui"
import { createColumnHelper } from "@tanstack/react-table"
import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { HttpTypes } from "@medusajs/types"
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

import { Form } from "../../../../../components/common/form"
import { ShippingProfileCombobox } from "../../../../../components/inputs/shipping-profile-combobox"
import { RouteFocusModal } from "../../../../../components/modals"
import { useBulkAssociateProductsWithShippingProfile } from "../../../../../hooks/api/product-shipping-profile"
import { useDataTable } from "../../../../../hooks/use-data-table"
import { _DataTable, Filter } from "../../../../../components/table/data-table"
import { ProductCell } from "../../../../../components/table/table-cells/product/product-cell"
import { CollectionCell } from "../../../../../components/table/table-cells/product/collection-cell/collection-cell"
import { VariantCell } from "../../../../../components/table/table-cells/product/variant-cell"
import { ProductStatusCell } from "../../../../../components/table/table-cells/product/product-status-cell"
import { useShippingProfiles } from "../../../../../hooks/api/shipping-profiles"
import { useProducts } from "../../../../../hooks/api/products"

type BulkShippingProfileCombinedModalProps = {
  onClose: () => void
}

const columnHelper = createColumnHelper<HttpTypes.AdminProduct>()

const PAGE_SIZE = 10

const BulkShippingProfileSchema = z.object({
  shipping_profile_id: z.string().min(1, "Please select a shipping profile"),
})

export const BulkShippingProfileCombinedModal = ({
  onClose,
}: BulkShippingProfileCombinedModalProps) => {
  const { t } = useTranslation()
  const [step, setStep] = useState<"profile" | "products">("profile")
  const [selectedProfileId, setSelectedProfileId] = useState<string>("")
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchParams, setSearchParams] = useState<Record<string, any>>({})

  const form = useForm({
    defaultValues: {
      shipping_profile_id: "",
    },
    resolver: zodResolver(BulkShippingProfileSchema),
  })

  const { shipping_profiles } = useShippingProfiles({})
  
  const { products, count, isLoading } = useProducts({
    limit: PAGE_SIZE,
    offset: 0,
    ...searchParams,
  })

  const { mutateAsync: bulkAssign } = useBulkAssociateProductsWithShippingProfile()

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => {
              if (value) {
                const allIds = products?.map((p) => p.id) || []
                setSelectedProductIds(new Set(allIds))
              } else {
                setSelectedProductIds(new Set())
              }
            }}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={selectedProductIds.has(row.original.id)}
            onCheckedChange={(value) => {
              setSelectedProductIds((prev) => {
                const newSet = new Set(prev)
                if (value) {
                  newSet.add(row.original.id)
                } else {
                  newSet.delete(row.original.id)
                }
                return newSet
              })
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ),
      }),
      columnHelper.display({
        id: "product",
        header: () => t("fields.product"),
        cell: ({ row }) => <ProductCell product={row.original} />,
      }),
      columnHelper.accessor("collection", {
        header: () => t("fields.collection"),
        cell: ({ row }) => <CollectionCell collection={row.original.collection} />,
      }),
      columnHelper.accessor("variants", {
        header: () => t("fields.variants"),
        cell: ({ row }) => <VariantCell variants={row.original.variants} />,
      }),
      columnHelper.accessor("status", {
        header: () => t("fields.status"),
        cell: ({ row }) => <ProductStatusCell status={row.original.status} />,
      }),
    ],
    [products, selectedProductIds, t]
  )

  const filters: Filter[] = useMemo(() => {
    const baseFilters: Filter[] = []

    if (shipping_profiles && shipping_profiles.length > 0) {
      const profileOptions = shipping_profiles.map((profile) => ({
        label: profile.name,
        value: profile.id,
      }))

      profileOptions.unshift({
        label: t("products.bulk.noShippingProfile"),
        value: "null",
      })

      baseFilters.push({
        key: "shipping_profile_id",
        label: t("formFields.shipping_profile.label"),
        type: "select",
        multiple: false,
        options: profileOptions,
      })
    }

    baseFilters.push({
      key: "status",
      label: t("fields.status"),
      type: "select",
      multiple: true,
      options: [
        {
          label: t("productStatus.draft"),
          value: "draft",
        },
        {
          label: t("productStatus.proposed"),
          value: "proposed",
        },
        {
          label: t("productStatus.published"),
          value: "published",
        },
        {
          label: t("productStatus.rejected"),
          value: "rejected",
        },
      ],
    })

    return baseFilters
  }, [shipping_profiles, t])

  const { table } = useDataTable({
    data: (products ?? []) as HttpTypes.AdminProduct[],
    columns,
    count: count || 0,
    enablePagination: true,
    pageSize: PAGE_SIZE,
    getRowId: (row) => row.id,
  })

  const handleProfileSubmit = form.handleSubmit(async (data) => {
    setSelectedProfileId(data.shipping_profile_id)
    setStep("products")
  })

  const handleFinalSubmit = async () => {
    if (selectedProductIds.size === 0) {
      toast.error(t("products.bulk.noProductsSelected"))
      return
    }

    if (!selectedProfileId) {
      toast.error(t("products.bulk.noProfileSelected"))
      return
    }

    setIsSubmitting(true)

    try {
      await bulkAssign({
        productIds: Array.from(selectedProductIds),
        shippingProfileId: selectedProfileId,
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
  }

  const handleBack = () => {
    setStep("profile")
    setSelectedProductIds(new Set())
  }

  return (
    <RouteFocusModal>
      <RouteFocusModal.Header>
        <div className="flex items-center justify-between w-full">
          <div className="flex flex-col gap-y-1">
            <Heading level="h2">
              {step === "profile"
                ? t("products.bulk.assignShippingProfile")
                : t("products.bulk.selectProductsForProfile")}
            </Heading>
            {step === "profile" ? (
              <Text size="small" className="text-ui-fg-subtle">
                {t("products.bulk.selectProfileFirst")}
              </Text>
            ) : (
              selectedProductIds.size > 0 && (
                <span className="text-ui-fg-subtle text-sm">
                  {t("products.bulk.selectedCount", { count: selectedProductIds.size })}
                </span>
              )
            )}
          </div>
        </div>
      </RouteFocusModal.Header>
      
      <RouteFocusModal.Body className={step === "products" ? "flex flex-col h-full overflow-hidden" : "flex flex-col gap-y-6 p-6"}>
        {step === "profile" ? (
          <Form {...form}>
            <form onSubmit={handleProfileSubmit} className="flex flex-col gap-y-6">
              <Form.Field
                control={form.control}
                name="shipping_profile_id"
                render={({ field }) => {
                  return (
                    <Form.Item>
                      <Form.Label>
                        {t("formFields.shipping_profile.label")}
                      </Form.Label>
                      <Form.Control>
                        <ShippingProfileCombobox
                          {...field}
                          showValidationBadges={true}
                          showWarningMessages={true}
                        />
                      </Form.Control>
                      <Form.Hint>
                        {t("products.bulk.selectProfileToAssign")}
                      </Form.Hint>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )
                }}
              />
            </form>
          </Form>
        ) : (
          <div className="flex-1 overflow-hidden">
            <_DataTable
              table={table}
              columns={columns}
              count={count || 0}
              pageSize={PAGE_SIZE}
              filters={filters}
              search
              pagination
              isLoading={isLoading}
              queryObject={searchParams}
              layout="fill"
              noRecords={{
                message: t("products.list.noRecordsMessage"),
              }}
            />
          </div>
        )}
      </RouteFocusModal.Body>
      
      <RouteFocusModal.Footer>
        <div className="flex items-center justify-between w-full">
          <div>
            {step === "products" && (
              <Button size="small" variant="transparent" onClick={handleBack}>
                {t("actions.back")}
              </Button>
            )}
          </div>
          <div className="flex items-center gap-x-2">
            <Button size="small" variant="secondary" onClick={onClose}>
              {t("actions.cancel")}
            </Button>
            {step === "profile" ? (
              <Button
                size="small"
                variant="primary"
                onClick={handleProfileSubmit}
              >
                {t("actions.continue")}
              </Button>
            ) : (
              <Button
                size="small"
                variant="primary"
                onClick={handleFinalSubmit}
                disabled={selectedProductIds.size === 0 || isSubmitting}
                isLoading={isSubmitting}
              >
                {t("actions.confirm")} ({selectedProductIds.size})
              </Button>
            )}
          </div>
        </div>
      </RouteFocusModal.Footer>
    </RouteFocusModal>
  )
}
