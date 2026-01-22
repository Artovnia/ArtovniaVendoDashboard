import { Component, PencilSquare, Trash } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { Badge, Container, Heading, usePrompt } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

import { ActionMenu } from "../../../../../components/common/action-menu"
import { SectionRow } from "../../../../../components/common/section"
import { useDeleteVariant } from "../../../../../hooks/api/products"

type VariantGeneralSectionProps = {
  variant: HttpTypes.AdminProductVariant
}

export function VariantGeneralSection({ variant }: VariantGeneralSectionProps) {
  const { t } = useTranslation()
  const prompt = usePrompt()
  const navigate = useNavigate()

  const hasInventoryKit = (variant as any).inventory_items?.length > 1

  const { mutateAsync } = useDeleteVariant(variant.product_id!, variant.id)

  const handleDelete = async () => {
    const res = await prompt({
      title: t("general.areYouSure"),
      description: t("products.variant.deleteWarning", {
        title: variant.title,
      }),
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
    })

    if (!res) {
      return
    }

    await mutateAsync(undefined, {
      onSuccess: () => {
        navigate("..", { replace: true })
      },
    })
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <div className="flex items-center gap-2">
            <Heading>{variant.title}</Heading>
            {hasInventoryKit && (
              <span className="text-ui-fg-muted font-normal">
                <Component />
              </span>
            )}
          </div>
          <span className="text-ui-fg-subtle txt-small mt-2">
            {t("labels.productVariant")}
          </span>
        </div>
        <div className="flex items-center gap-x-4">
          <ActionMenu
            groups={[
              {
                actions: [
                  {
                    label: t("actions.edit"),
                    to: "edit",
                    icon: <PencilSquare />,
                  },
                ],
              },
              {
                actions: [
                  {
                    label: t("actions.delete"),
                    onClick: handleDelete,
                    icon: <Trash />,
                  },
                ],
              },
            ]}
          />
        </div>
      </div>

      <SectionRow title={t("fields.sku")} value={variant.sku} />
      
      {/* Display variant options */}
      {variant.options && variant.options.length > 0 && (
        <div className="px-6 py-4 border-t border-ui-border-base">
          <div className="text-ui-fg-subtle text-sm font-medium mb-2">
            {t("products.create.variantHeaders.options")}
          </div>
          <div className="flex flex-wrap gap-2">
            {variant.options.map((o) => (
              <div key={o.id} className="flex items-center gap-2">
                <span className="text-ui-fg-muted text-sm">{o.option?.title}:</span>
                <Badge size="2xsmall">{o.value}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </Container>
  )
}
