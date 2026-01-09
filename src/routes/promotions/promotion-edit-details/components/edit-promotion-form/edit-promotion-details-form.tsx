import { zodResolver } from "@hookform/resolvers/zod"
import { AdminPromotion } from "@medusajs/types"
import { Badge, Button, Input, RadioGroup, Text } from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { Trans, useTranslation } from "react-i18next"
import * as zod from "zod"
import { useMemo, useEffect, useState } from "react"

import { Form } from "../../../../../components/common/form"
import { Thumbnail } from "../../../../../components/common/thumbnail"
import { DeprecatedPercentageInput } from "../../../../../components/inputs/percentage-input"
import { RouteDrawer, useRouteModal } from "../../../../../components/modals"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import { useUpdatePromotion } from "../../../../../hooks/api/promotions"
import { useProductCategories } from "../../../../../hooks/api/categories"
import { fetchQuery } from "../../../../../lib/client"

type EditPromotionFormProps = {
  promotion: AdminPromotion
}

const EditPromotionSchema = zod.object({
  is_automatic: zod.string().toLowerCase(),
  code: zod.string().min(1),
  status: zod.enum(["active", "inactive", "draft"]),
  value_type: zod.enum(["fixed", "percentage"]),
  value: zod.number(),
})

export const EditPromotionDetailsForm = ({
  promotion,
}: EditPromotionFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  // Extract product and category IDs from target rules
  const { productIds, categoryIds } = useMemo(() => {
    const targetRules = promotion.application_method?.target_rules || []
    
    const productRule = targetRules.find(
      (rule) => rule.attribute === 'items.product.id'
    )
    const categoryRule = targetRules.find(
      (rule) => rule.attribute === 'items.product.categories.id'
    )

    // Extract string values from BasePromotionRuleValue objects
    const extractIds = (values: any[] | undefined): string[] => {
      if (!values) return []
      return values.map(v => typeof v === 'string' ? v : v.value)
    }

    return {
      productIds: extractIds(productRule?.values),
      categoryIds: extractIds(categoryRule?.values),
    }
  }, [promotion])

  // Fetch products individually since vendor API doesn't support id filter
  const [products, setProducts] = useState<any[]>([])

  useEffect(() => {
    const fetchProducts = async () => {
      if (productIds.length === 0) {
        setProducts([])
        return
      }

      try {
        const productPromises = productIds.map(id =>
          fetchQuery(`/vendor/products/${id}`, {
            method: 'GET',
            query: { fields: 'id,title,thumbnail' },
          })
        )
        const fetchedProducts = await Promise.all(productPromises)
        setProducts(fetchedProducts.map((p: any) => p.product))
      } catch (error) {
        console.error('[EditPromotionForm] Error fetching products:', error)
        setProducts([])
      }
    }

    fetchProducts()
  }, [productIds])

  // Fetch categories if we have category IDs
  const { product_categories } = useProductCategories(
    {
      id: categoryIds.length > 0 ? categoryIds : undefined,
      fields: 'id,name,handle',
      limit: 100,
    },
    {
      enabled: categoryIds.length > 0,
    }
  )

  const form = useForm<zod.infer<typeof EditPromotionSchema>>({
    defaultValues: {
      is_automatic: promotion.is_automatic!.toString(),
      code: promotion.code,
      status: promotion.status,
      value: promotion.application_method!.value,
      value_type: promotion.application_method!.type,
    },
    resolver: zodResolver(EditPromotionSchema),
  })

  const { mutateAsync, isPending } = useUpdatePromotion(promotion.id)

  const handleSubmit = form.handleSubmit(async (data) => {
    await mutateAsync(
      {
        is_automatic: data.is_automatic === "true",
        code: data.code,
        status: data.status,
        application_method: {
          value: data.value,
        },
      },
      {
        onSuccess: () => {
          handleSuccess()
        },
      }
    )
  })

  console.log(form.getValues())

  return (
    <RouteDrawer.Form form={form}>
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex flex-1 flex-col overflow-hidden"
      >
        <RouteDrawer.Body className="flex flex-1 flex-col gap-y-8 overflow-y-auto">
          {/* Display products/categories if any */}
          {(products && products.length > 0) || (product_categories && product_categories.length > 0) ? (
            <div className="flex flex-col gap-y-4">
              <div className="border-b pb-4">
                <Text size="small" weight="plus" className="mb-3">
                  {t("promotions.fields.appliesTo")}
                </Text>
                
                {products && products.length > 0 && (
                  <div className="mb-4">
                    <Text size="xsmall" className="text-ui-fg-subtle mb-2">
                      {t("promotions.fields.products")} ({products.length})
                    </Text>
                    <div className="flex flex-col gap-2">
                      {products.map((product) => (
                        <div 
                          key={product.id} 
                          className="flex items-center gap-3 p-2 bg-ui-bg-subtle rounded-md"
                        >
                          <Thumbnail src={product.thumbnail || undefined} size="small" />
                          <Text size="small">{product.title}</Text>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {product_categories && product_categories.length > 0 && (
                  <div>
                    <Text size="xsmall" className="text-ui-fg-subtle mb-2">
                      {t("promotions.fields.categories")} ({product_categories.length})
                    </Text>
                    <div className="flex flex-wrap gap-2">
                      {product_categories.map((category) => (
                        <Badge key={category.id} size="small">
                          {category.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          <div className="flex flex-col gap-y-8">
            <Form.Field
              control={form.control}
              name="status"
              render={({ field }) => {
                return (
                  <Form.Item>
                    <Form.Label>{t("promotions.form.status.label")}</Form.Label>
                    <Form.Control>
                      <RadioGroup
                        className="flex-col gap-y-3"
                        {...field}
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <RadioGroup.ChoiceBox
                          value={"draft"}
                          label={t("promotions.form.status.draft.title")}
                          description={t(
                            "promotions.form.status.draft.description"
                          )}
                        />

                        <RadioGroup.ChoiceBox
                          value={"active"}
                          label={t("promotions.form.status.active.title")}
                          description={t(
                            "promotions.form.status.active.description"
                          )}
                        />

                        <RadioGroup.ChoiceBox
                          value={"inactive"}
                          label={t("promotions.form.status.inactive.title")}
                          description={t(
                            "promotions.form.status.inactive.description"
                          )}
                        />
                      </RadioGroup>
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )
              }}
            />

            <Form.Field
              control={form.control}
              name="is_automatic"
              render={({ field }) => {
                return (
                  <Form.Item>
                    <Form.Label>{t("promotions.form.method.label")}</Form.Label>
                    <Form.Control>
                      <RadioGroup
                        className="flex-col gap-y-3"
                        {...field}
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <RadioGroup.ChoiceBox
                          value={"false"}
                          label={t("promotions.form.method.code.title")}
                          description={t(
                            "promotions.form.method.code.description"
                          )}
                        />
                        <RadioGroup.ChoiceBox
                          value={"true"}
                          label={t("promotions.form.method.automatic.title")}
                          description={t(
                            "promotions.form.method.automatic.description"
                          )}
                        />
                      </RadioGroup>
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )
              }}
            />

            <div className="flex flex-col gap-y-4">
              <Form.Field
                control={form.control}
                name="code"
                render={({ field }) => {
                  return (
                    <Form.Item>
                      <Form.Label>{t("promotions.form.code.title")}</Form.Label>

                      <Form.Control>
                        <Input {...field} />
                      </Form.Control>
                    </Form.Item>
                  )
                }}
              />

              <Text
                size="small"
                leading="compact"
                className="text-ui-fg-subtle"
              >
                <Trans
                  t={t}
                  i18nKey="promotions.form.code.description"
                  components={[<br key="break" />]}
                />
              </Text>
            </div>

            <Form.Field
              control={form.control}
              name="value"
              render={({ field: { onChange, ...field } }) => {
                return (
                  <Form.Item>
                    <Form.Label>{t("fields.percentage")}</Form.Label>
                    <Form.Control>
                      <DeprecatedPercentageInput
                        key="amount"
                        min={0}
                        max={100}
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => {
                          onChange(
                            e.target.value === ""
                              ? null
                              : parseInt(e.target.value)
                          )
                        }}
                      />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )
              }}
            /> 
          </div>
        </RouteDrawer.Body>

        <RouteDrawer.Footer>
          <div className="flex items-center justify-end gap-x-2">
            <RouteDrawer.Close asChild>
              <Button size="small" variant="secondary">
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>

            <Button size="small" type="submit" isLoading={isPending}>
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}