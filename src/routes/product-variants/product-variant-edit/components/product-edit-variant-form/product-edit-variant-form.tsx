// product-edit-variant-form.tsx
import { zodResolver } from "@hookform/resolvers/zod"
import { Button, Divider, Heading, Input, Switch, toast } from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import { useMemo } from "react"

import { HttpTypes } from "@medusajs/types"
import { Form } from "../../../../../components/common/form"
import { Combobox } from "../../../../../components/inputs/combobox"
import { CountrySelect } from "../../../../../components/inputs/country-select"
import { RouteDrawer, useRouteModal } from "../../../../../components/modals"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import { useUpdateProductVariant } from "../../../../../hooks/api/products"
import { useProductVariantAttributes, useUpdateProductVariantAttributes } from "../../../../../hooks/api/product-variant-additional-attributes"
import {
  transformNullableFormData,
  transformNullableFormNumber,
} from "../../../../../lib/form-helpers"
import { optionalInt } from "../../../../../lib/validation"

type ProductEditVariantFormProps = {
  product: HttpTypes.AdminProduct
  variant: HttpTypes.AdminProductVariant
}

const ProductEditVariantSchema = z.object({
  title: z.string().min(1),
  material: z.string().optional(),
  sku: z.string().optional(),
  ean: z.string().optional(),
  upc: z.string().optional(),
  barcode: z.string().optional(),
  manage_inventory: z.boolean(),
  allow_backorder: z.boolean(),
  weight: optionalInt,
  height: optionalInt,
  width: optionalInt,
  length: optionalInt,
  mid_code: z.string().optional(),
  hs_code: z.string().optional(),
  origin_country: z.string().optional(),
  options: z.record(z.string()),
  variant_attributes: z.record(z.string()).optional(),
})

export const ProductEditVariantForm = ({
  variant,
  product,
}: ProductEditVariantFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()
  
  // Fetch variant attributes
  const { data: variantAttributesData, isLoading: isAttributesLoading } = useProductVariantAttributes(product.id, variant.id)
  const updateVariantAttributes = useUpdateProductVariantAttributes(product.id, variant.id)

  // Memoize default options to prevent unnecessary re-renders
  const defaultOptions = useMemo(() => {
    return product.options?.reduce((acc: any, option: any) => {
      const varOpt = variant.options?.find((o: any) => o.option_id === option.id)
      acc[option.title] = varOpt?.value || ""
      return acc
    }, {}) || {}
  }, [product.options, variant.options])

  // Memoize variant attributes - THIS IS THE KEY CHANGE
  const variantAttributesValues = useMemo(() => {
    if (!variantAttributesData?.attributes?.length) return {}
    
    return variantAttributesData.attributes.reduce((acc: any, attr: any) => {
      const existingValue = variantAttributesData.attribute_values?.find(
        (av) => av.attribute?.handle === attr.handle
      )
      acc[attr.handle] = existingValue?.value || ""
      return acc
    }, {})
  }, [variantAttributesData])

  // Create form with computed values - NO useEffect needed
  const form = useForm<z.infer<typeof ProductEditVariantSchema>>({
    values: { // Use 'values' instead of 'defaultValues' to make it reactive
      title: variant.title || "",
      material: variant.material || "",
      sku: variant.sku || "",
      ean: variant.ean || "",
      upc: variant.upc || "",
      barcode: variant.barcode || "",
      manage_inventory: variant.manage_inventory || false,
      allow_backorder: variant.allow_backorder || false,
      weight: variant.weight || "",
      height: variant.height || "",
      width: variant.width || "",
      length: variant.length || "",
      mid_code: variant.mid_code || "",
      hs_code: variant.hs_code || "",
      origin_country: variant.origin_country || "",
      options: defaultOptions,
      variant_attributes: variantAttributesValues,
    },
    resolver: zodResolver(ProductEditVariantSchema),
  })

  // REMOVED THE PROBLEMATIC useEffect

  const { mutateAsync, isPending } = useUpdateProductVariant(
    variant.product_id!,
    variant.id
  )

  const onSubmit = form.handleSubmit(async (values) => {
    const { title, origin_country, material, sku, ean, upc, barcode, hs_code, mid_code, allow_backorder, manage_inventory, options, weight, height, width, length, variant_attributes } = values

    const nullableData = transformNullableFormData({
      material,
      sku,
      ean,
      upc,
      barcode,
      hs_code,
      mid_code,
      origin_country,
    })

    try {
      // Step 1: Update general variant info
      await mutateAsync({
        weight: transformNullableFormNumber(weight),
        height: transformNullableFormNumber(height),
        width: transformNullableFormNumber(width),
        length: transformNullableFormNumber(length),
        title,
        allow_backorder,
        manage_inventory,
        options,
        ...nullableData,
      })

      // Step 2: Process variant attributes if they exist
      if (variant_attributes && Object.keys(variant_attributes).length > 0) {
      
        const attributeValues = Object.entries(variant_attributes)
          .map(([handle, value]) => {
            const attribute = variantAttributesData?.attributes?.find(
              (attr) => attr.handle === handle
            )

            if (!attribute?.id || !value) {
              return null
            }

            return {
              attribute_id: attribute.id,
              value: value as string,
            }
          })
          .filter((item): item is { attribute_id: string; value: string } => item !== null)

        console.log(`[DEBUG] Filtered attribute values for submission:`, attributeValues)

        if (attributeValues.length > 0) {
          await updateVariantAttributes.mutateAsync({
            attribute_values: attributeValues,
          })
        }
      }

      toast.success(t("products.variant.edit.success"))
      handleSuccess()
    } catch (error: any) {
      console.error("Error updating variant:", error)
      toast.error(error.message || "Error updating variant")
    }
  })

  return (
    <RouteDrawer.Form form={form}>
      <KeyboundForm
        onSubmit={onSubmit}
        className="flex size-full flex-col overflow-hidden"
      >
        <RouteDrawer.Body className="flex size-full flex-col gap-y-8 overflow-auto">
          <div className="flex flex-col gap-y-4">
            <Form.Field
              control={form.control}
              name="title"
              render={({ field }) => {
                return (
                  <Form.Item>
                    <Form.Label>{t("fields.title")}</Form.Label>
                    <Form.Control>
                      <Input {...field} />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )
              }}
            />
            <Form.Field
              control={form.control}
              name="material"
              render={({ field }) => {
                return (
                  <Form.Item>
                    <Form.Label optional>{t("fields.material")}</Form.Label>
                    <Form.Control>
                      <Input {...field} />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )
              }}
            />
            {product.options?.map((option: any) => {
              return (
                <Form.Field
                  key={option.id}
                  control={form.control}
                  name={`options.${option.title}`}
                  render={({ field }) => {
                    return (
                      <Form.Item>
                        <Form.Label>{option.title}</Form.Label>
                        <Form.Control>
                          <Combobox
                            value={field.value || ""}
                            onChange={(value) => {
                              field.onChange(value || "")
                            }}
                            placeholder="Wybierz opcję"
                            options={option.values.map((v: any) => ({
                              label: v.value,
                              value: v.value,
                            }))}
                          />
                        </Form.Control>
                      </Form.Item>
                    )
                  }}
                />
              )
            })}
          </div>
          <Divider />
          <div className="flex flex-col gap-y-8">
            <div className="flex flex-col gap-y-4">
              <Heading level="h2">
                {t("products.variant.inventory.header")}
              </Heading>
              <Form.Field
                control={form.control}
                name="sku"
                render={({ field }) => {
                  return (
                    <Form.Item>
                      <Form.Label optional>{t("fields.sku")}</Form.Label>
                      <Form.Control>
                        <Input {...field} />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )
                }}
              />
              <Form.Field
                control={form.control}
                name="ean"
                render={({ field }) => {
                  return (
                    <Form.Item>
                      <Form.Label optional>{t("fields.ean")}</Form.Label>
                      <Form.Control>
                        <Input {...field} />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )
                }}
              />
              <Form.Field
                control={form.control}
                name="upc"
                render={({ field }) => {
                  return (
                    <Form.Item>
                      <Form.Label optional>{t("fields.upc")}</Form.Label>
                      <Form.Control>
                        <Input {...field} />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )
                }}
              />
              <Form.Field
                control={form.control}
                name="barcode"
                render={({ field }) => {
                  return (
                    <Form.Item>
                      <Form.Label optional>{t("fields.barcode")}</Form.Label>
                      <Form.Control>
                        <Input {...field} />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )
                }}
              />
            </div>
            <Form.Field
              control={form.control}
              name="manage_inventory"
              render={({ field: { value, onChange, ...field } }) => {
                return (
                  <Form.Item>
                    <div className="flex flex-col gap-y-1">
                      <div className="flex items-center justify-between">
                        <Form.Label>
                          {t("products.variant.inventory.manageInventoryLabel")}
                        </Form.Label>
                        <Form.Control>
                          <Switch
                            checked={value}
                            onCheckedChange={(checked) => onChange(!!checked)}
                            {...field}
                          />
                        </Form.Control>
                      </div>
                      <Form.Hint>
                        {t("products.variant.inventory.manageInventoryHint")}
                      </Form.Hint>
                    </div>
                    <Form.ErrorMessage />
                  </Form.Item>
                )
              }}
            />
            <Form.Field
              control={form.control}
              name="allow_backorder"
              render={({ field: { value, onChange, ...field } }) => {
                return (
                  <Form.Item>
                    <div className="flex flex-col gap-y-1">
                      <div className="flex items-center justify-between">
                        <Form.Label>
                          {t("products.variant.inventory.allowBackordersLabel")}
                        </Form.Label>
                        <Form.Control>
                          <Switch
                            checked={value}
                            onCheckedChange={(checked) => onChange(!!checked)}
                            {...field}
                          />
                        </Form.Control>
                      </div>
                      <Form.Hint>
                        {t("products.variant.inventory.allowBackordersHint")}
                      </Form.Hint>
                    </div>
                    <Form.ErrorMessage />
                  </Form.Item>
                )
              }}
            />
          </div>
          <Divider />
          <div className="flex flex-col gap-y-4">
            <Heading level="h2">{t("products.attributes")}</Heading>
            <Form.Field
              control={form.control}
              name="weight"
              render={({ field }) => {
                return (
                  <Form.Item>
                    <Form.Label optional>{t("fields.weight")}</Form.Label>
                    <Form.Control>
                      <Input type="number" {...field} />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )
              }}
            />
            <Form.Field
              control={form.control}
              name="width"
              render={({ field }) => {
                return (
                  <Form.Item>
                    <Form.Label optional>{t("fields.width")}</Form.Label>
                    <Form.Control>
                      <Input type="number" {...field} />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )
              }}
            />
            <Form.Field
              control={form.control}
              name="length"
              render={({ field }) => {
                return (
                  <Form.Item>
                    <Form.Label optional>{t("fields.length")}</Form.Label>
                    <Form.Control>
                      <Input type="number" {...field} />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )
              }}
            />
            <Form.Field
              control={form.control}
              name="height"
              render={({ field }) => {
                return (
                  <Form.Item>
                    <Form.Label optional>{t("fields.height")}</Form.Label>
                    <Form.Control>
                      <Input type="number" {...field} />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )
              }}
            />
            <Form.Field
              control={form.control}
              name="mid_code"
              render={({ field }) => {
                return (
                  <Form.Item>
                    <Form.Label optional>{t("fields.midCode")}</Form.Label>
                    <Form.Control>
                      <Input {...field} />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )
              }}
            />
            <Form.Field
              control={form.control}
              name="hs_code"
              render={({ field }) => {
                return (
                  <Form.Item>
                    <Form.Label optional>{t("fields.hsCode")}</Form.Label>
                    <Form.Control>
                      <Input {...field} />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )
              }}
            />
            <Form.Field
              control={form.control}
              name="origin_country"
              render={({ field }) => {
                return (
                  <Form.Item>
                    <Form.Label optional>
                      {t("fields.countryOfOrigin")}
                    </Form.Label>
                    <Form.Control>
                      <CountrySelect {...field} />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )
              }}
            />
          </div>
          <Divider />
          {/* Custom Variant Attributes Section */}
          <div className="flex flex-col gap-y-4">
            <Heading level="h2">{t('products.additionalAttributes.title')}</Heading>
            {!isAttributesLoading && variantAttributesData?.attributes?.length > 0 && (
              <div className="flex flex-col gap-y-4">
                {variantAttributesData.attributes.map((attribute) => (
                  <Form.Field
                    key={attribute.id}
                    control={form.control}
                    name={`variant_attributes.${attribute.handle}`}
                    render={({ field }) => (
                      <Form.Item>
                        <Form.Label>{attribute.name}</Form.Label>
                        <Form.Control>
                          {attribute.ui_component === "select" && attribute.possible_values?.length ? (
                            <Combobox
                              value={field.value || ""}
                              onChange={(value) => {
                                field.onChange(value || "")
                              }}
                              placeholder={t('products.additionalAttributes.selectOption')}
                              options={attribute.possible_values.map((val) => ({
                                label: val,
                                value: val,
                              }))}
                            />
                          ) : (
                            <Input 
                              {...field}
                              value={field.value || ""} 
                              placeholder={t('products.additionalAttributes.enterValue')} 
                            />
                          )}
                        </Form.Control>
                        <Form.ErrorMessage />
                      </Form.Item>
                    )}
                  />
                ))}
              </div>
            )}
            {isAttributesLoading && (
              <div className="flex flex-col gap-y-2 py-4">
                <div className="h-6 w-32 animate-pulse rounded-md " />
                <div className="h-4 w-48 animate-pulse rounded-md " />
              </div>
            )}
            {!isAttributesLoading && (!variantAttributesData?.attributes?.length) && (
              <p className="text-ui-fg-subtle">{t('products.additionalAttributes.noAttributes.title')}</p>
            )}
          </div>
        </RouteDrawer.Body>
        <RouteDrawer.Footer>
          <div className="flex items-center justify-end gap-x-2">
            <RouteDrawer.Close asChild>
              <Button variant="secondary" size="small">
                {t('actions.cancel')}
              </Button>
            </RouteDrawer.Close>
            <Button type="submit" size="small" isLoading={isPending || updateVariantAttributes.isPending}>
              {t('actions.save')}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}