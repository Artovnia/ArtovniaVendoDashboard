import { Button, Heading, Input, RadioGroup, Text, toast } from "@medusajs/ui"
import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

import {
  RouteFocusModal,
  useRouteModal,
} from "../../../../../components/modals"
import { Form } from "../../../../../components/common/form"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import { useCreatePromotion } from "../../../../../hooks/api/promotions"
import { useShippingOptions } from "../../../../../hooks/api/shipping-options"
import { useMe } from "../../../../../hooks/api/users"
import { PaginatedProductSelector } from "../../../common/simplified-selectors"
import { getTemplates } from "../create-promotion-form/templates"

type SimplePromotionTemplateId =
  | "percentage_off_product"
  | "percentage_off_order"
  | "free_shipping"

const SIMPLE_TEMPLATE_IDS: SimplePromotionTemplateId[] = [
  "percentage_off_product",
  "percentage_off_order",
  "free_shipping",
]

const generatePromotionCode = (
  sellerHandle?: string,
  sellerName?: string,
  suffixLabel = "PR"
) => {
  const base = (sellerHandle || sellerName || "seller")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 10)

  const suffix = Date.now().toString().slice(-6)

  return `${base || "SELLER"}${suffixLabel}${suffix}`
}

const CreateSimplePromotionSchema = z.object({
  code: z.string().min(1),
  value: z.coerce.number().min(1).max(100).optional(),
})

export const CreateSimplePromotionForm = () => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()
  const { seller } = useMe()

  const templates = useMemo(
    () => getTemplates().filter((template) => SIMPLE_TEMPLATE_IDS.includes(template.id as SimplePromotionTemplateId)),
    []
  )
  const [templateSelection, setTemplateSelection] =
    useState<SimplePromotionTemplateId | null>(null)
  const [selectedTemplateId, setSelectedTemplateId] =
    useState<SimplePromotionTemplateId | null>(null)
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])

  const templateId = selectedTemplateId

  const isShippingPromotion = templateId === "free_shipping"
  const isOrderPromotion = templateId === "percentage_off_order"
  const isProductPromotion = templateId === "percentage_off_product"

  const codeSuffixLabel = isShippingPromotion
    ? "FS"
    : isOrderPromotion
      ? "OR"
      : "PR"

  const form = useForm<z.infer<typeof CreateSimplePromotionSchema>>({
    defaultValues: {
      code: "",
      value: isShippingPromotion ? 100 : 10,
    },
    resolver: zodResolver(CreateSimplePromotionSchema),
  })

  const code = form.watch("code")

  const { shipping_options = [] } = useShippingOptions({
    limit: 999,
    fields: "id,name,shipping_profile_id,+shipping_profile.id,+shipping_profile.name",
  }, {
    enabled: isShippingPromotion,
  })

  const { mutateAsync: createPromotion, isPending } = useCreatePromotion()

  useEffect(() => {
    if (!templateId) {
      return
    }

    form.reset({
      code: "",
      value: templateId === "free_shipping" ? 100 : 10,
    })
    setSelectedProductIds([])
  }, [form, templateId])

  useEffect(() => {
    if (!templateId || code) {
      return
    }

    form.setValue(
      "code",
      generatePromotionCode(seller?.handle, seller?.name, codeSuffixLabel)
    )
  }, [code, codeSuffixLabel, form, seller?.handle, seller?.name, templateId])

  const allShippingOptionIds = useMemo(() => {
    return shipping_options
      .map((option) => option?.id)
      .filter((id): id is string => typeof id === "string" && id.length > 0)
  }, [shipping_options])

  const handleSubmit = form.handleSubmit(async ({ code, value }) => {
    if (!templateId) {
      return
    }

    if (isShippingPromotion && !allShippingOptionIds.length) {
      toast.error(
        t("promotions.sections.noShippingMethods", {
          defaultValue: "Brak metod wysyłki do objęcia promocją",
        })
      )
      return
    }

    if (isProductPromotion && !selectedProductIds.length) {
      toast.error(
        t("promotions.create.simpleProductsRequired", {
          defaultValue: "Wybierz przynajmniej jeden produkt",
        })
      )
      return
    }

    const discountValue = isShippingPromotion ? 100 : value || 0

    if (!isShippingPromotion && discountValue <= 0) {
      toast.error(t("promotions.errors.requiredField"))
      return
    }

    const productSelectionRules =
      selectedProductIds.length > 0
        ? [
            {
              operator: "in" as const,
              attribute: "items.product.id",
              values: selectedProductIds,
            },
          ]
        : []

    const allocation = isOrderPromotion ? "across" : "each"

    try {
      const { promotion } = await createPromotion({
        code: code.trim(),
        is_automatic: true,
        type: "standard",
        status: "active",
        rules: isShippingPromotion ? productSelectionRules : [],
        application_method: {
          allocation,
          type: "percentage",
          target_type: isShippingPromotion
            ? "shipping_methods"
            : isOrderPromotion
              ? "order"
              : "items",
          value: discountValue,
          max_quantity: allocation === "across" ? null : 1,
          target_rules: isShippingPromotion
            ? [
                {
                  operator: "in",
                  attribute: "shipping_option_id",
                  values: allShippingOptionIds,
                },
              ]
            : isProductPromotion
              ? productSelectionRules
              : [],
        },
      })

      toast.success(
        t("promotions.toasts.promotionCreateSuccess", {
          code: promotion.code,
        })
      )

      handleSuccess(`/promotions/${promotion.id}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error"
      toast.error(message)
    }
  })

  return (
    !templateId ? (
      <>
        <RouteFocusModal.Header>
          <RouteFocusModal.Title>
            {t("promotions.create.simpleTitle", {
              defaultValue: "Utwórz promocję (formularz uproszczony)",
            })}
          </RouteFocusModal.Title>
          <RouteFocusModal.Description>
            {t("promotions.create.typeSelectDescription", {
              defaultValue: "Najpierw wybierz typ promocji, który chcesz utworzyć.",
            })}
          </RouteFocusModal.Description>
        </RouteFocusModal.Header>

        <RouteFocusModal.Body className="flex size-full flex-col items-center overflow-auto py-16">
          <div className="w-full max-w-[720px]">
            <RadioGroup
              key="simple_template_id"
              className="flex-col gap-y-3"
              value={templateSelection ?? undefined}
              onValueChange={(value) =>
                setTemplateSelection(value as SimplePromotionTemplateId)
              }
            >
              {templates.map((template) => (
                <RadioGroup.ChoiceBox
                  key={template.id}
                  value={template.id!}
                  label={template.title}
                  description={template.description}
                />
              ))}
            </RadioGroup>
          </div>
        </RouteFocusModal.Body>

        <RouteFocusModal.Footer>
          <div className="flex items-center justify-end gap-x-2">
            <RouteFocusModal.Close asChild>
              <Button variant="secondary" size="small">
                {t("actions.cancel")}
              </Button>
            </RouteFocusModal.Close>
            <Button
              size="small"
              type="button"
              disabled={!templateSelection}
              onClick={() => {
                if (templateSelection) {
                  setSelectedTemplateId(templateSelection)
                }
              }}
            >
              {t("actions.continue")}
            </Button>
          </div>
        </RouteFocusModal.Footer>
      </>
    ) : (
      <RouteFocusModal.Form form={form}>
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex size-full flex-col overflow-hidden"
      >
        <RouteFocusModal.Header>
          <RouteFocusModal.Title>
            {t("promotions.create.simpleTitle", {
              defaultValue: "Utwórz promocję (uproszczony formularz)",
            })}
          </RouteFocusModal.Title>
          <RouteFocusModal.Description>
            {t("promotions.create.simpleModeDescriptionShort", {
              defaultValue:
                "Tryb uproszczony ukrywa zaawansowane pola i automatycznie ustawia aplikację promocji.",
            })}
          </RouteFocusModal.Description>
        </RouteFocusModal.Header>

        <RouteFocusModal.Body className="flex size-full flex-col items-center overflow-auto py-16">
          <div className="flex w-full max-w-[720px] flex-col gap-y-8">
            <div className="flex flex-col gap-y-2">
              <Heading level="h1">
                {isShippingPromotion
                  ? t("promotions.create.simpleShippingHeading", {
                      defaultValue: "Darmowa dostawa",
                    })
                  : isOrderPromotion
                    ? t("promotions.create.simpleOrderHeading", {
                        defaultValue: "Rabat procentowy na zamówienie",
                      })
                    : t("promotions.create.simpleProductHeading", {
                        defaultValue: "Rabat procentowy na produkty",
                      })}
              </Heading>
              <Text size="small" className="text-ui-fg-subtle">
                {isShippingPromotion
                  ? t("promotions.create.simpleShippingHint", {
                      defaultValue:
                        "Wartość rabatu to zawsze 100%, użycia są nielimitowane, a promocja działa automatycznie.",
                    })
                  : t("promotions.create.simplePercentHint", {
                      defaultValue:
                        "Ustaw tylko procent rabatu. Promocja jest automatyczna, bez kampanii i bez limitu użyć.",
                    })}
              </Text>
            </div>

            {!isShippingPromotion && (
              <div className="flex flex-col gap-y-2">
                <Text size="small" weight="plus">
                  {t("promotions.fields.discountPercentage", {
                    defaultValue: "Procent rabatu",
                  })}
                </Text>
                <Form.Field
                  control={form.control}
                  name="value"
                  render={({ field }) => (
                    <Input
                      {...field}
                      type="number"
                      min={1}
                      max={100}
                      value={field.value ?? ""}
                    />
                  )}
                />
                <Text size="xsmall" className="text-ui-fg-subtle">
                  {t("promotions.create.simplePercentValueHint", {
                    defaultValue: "Podaj wartość od 1 do 100.",
                  })}
                </Text>
              </div>
            )}

            <div className="flex flex-col gap-y-2">
              <Text size="small" weight="plus">
                {t("promotions.form.code.title", { defaultValue: "Kod" })}
              </Text>
              <Form.Field
                control={form.control}
                name="code"
                render={({ field }) => <Input {...field} />}
              />
              <Text size="xsmall" className="text-ui-fg-subtle">
                {t("promotions.create.simpleCodeAutoGeneratedHint", {
                  defaultValue: "Kod został wygenerowany automatycznie na bazie handle sprzedawcy.",
                })}
              </Text>
            </div>

            {(isProductPromotion || isShippingPromotion) && (
              <div className="flex flex-col gap-y-3">
                <Text size="small" weight="plus">
                  {t("promotions.sections.selectProducts", {
                    defaultValue: "Produkty objęte promocją",
                  })}
                </Text>
                <PaginatedProductSelector
                  selectedProductIds={selectedProductIds}
                  onChange={setSelectedProductIds}
                />
                <Text size="xsmall" className="text-ui-fg-subtle">
                  {isShippingPromotion
                    ? t("promotions.create.simpleShippingAppliedToAll", {
                        defaultValue:
                          "Wszystkie metody wysyłki kwalifikują się automatycznie. Opcjonalnie możesz ograniczyć promocję do wybranych produktów.",
                      })
                    : t("promotions.create.simpleProductsOnlyHint", {
                        defaultValue:
                          "Wybierz produkty, dla których rabat ma obowiązywać.",
                      })}
                </Text>
              </div>
            )}

            {isOrderPromotion && (
              <Text size="xsmall" className="text-ui-fg-subtle">
                {t("promotions.create.simpleOrderAppliesToAllHint", {
                  defaultValue:
                    "Ta promocja dotyczy całego zamówienia i nie wymaga wyboru produktów.",
                })}
              </Text>
            )}
          </div>
        </RouteFocusModal.Body>

        <RouteFocusModal.Footer>
          <div className="flex items-center justify-end gap-x-2">
            <Button
              variant="secondary"
              size="small"
              type="button"
              onClick={() => {
                setTemplateSelection(templateId)
                setSelectedTemplateId(null)
              }}
            >
              {t("actions.back")}
            </Button>
            <RouteFocusModal.Close asChild>
              <Button variant="secondary" size="small">
                {t("actions.cancel")}
              </Button>
            </RouteFocusModal.Close>
            <Button type="submit" size="small" isLoading={isPending}>
              {t("actions.save")}
            </Button>
          </div>
        </RouteFocusModal.Footer>
      </KeyboundForm>
      </RouteFocusModal.Form>
    )
  )
}
