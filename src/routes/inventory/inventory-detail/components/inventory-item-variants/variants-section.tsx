import { TriangleRightMini } from "@medusajs/icons"
import { Container, Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { ProductVariantDTO } from "@medusajs/types"
import { Thumbnail } from "../../../../../components/common/thumbnail"

type InventoryItemVariantsSectionProps = {
  variants: ProductVariantDTO[]
}

export const InventoryItemVariantsSection = ({
  variants,
}: InventoryItemVariantsSectionProps) => {
  const { t } = useTranslation()

  if (!variants?.length) {
    return null
  }

  return (
    <Container className="p-0">
      <div className="flex items-center justify-between px-6 py-4 ">
        <Heading level="h2">{t("inventory.associatedVariants")}</Heading>
      </div>

      <div className="txt-small flex flex-col gap-2 px-2 pb-2">
        {variants.map((variant) => {
          const link = variant.product
            ? `/products/${variant.product.id}/variants/${variant.id}`
            : null

          const Inner = (
            <div className="shadow-elevation-card-rest bg-ui-bg-component rounded-md px-4 py-2 transition-colors">
              <div className="flex items-center gap-3">
                <div className="shadow-elevation-card-rest rounded-md bg-red-500">
                  <Thumbnail src={variant.product?.thumbnail} />
                </div>
                <div className="flex flex-1 flex-col ">
                  <span className="text-ui-fg-base font-medium">
                    {variant.title}
                  </span>
                  <span className="text-ui-fg-subtle">
                    {variant.options.map((o) => o.value).join(" ⋅ ")}
                  </span>
                </div>
                <div className="size-7 flex items-center justify-center">
                  <TriangleRightMini className="text-ui-fg-muted" />
                </div>
              </div>
            </div>
          )

          if (!link) {
            return <div key={variant.id}>{Inner}</div>
          }

          return (
            <Link
              to={link}
              key={variant.id}
              className="outline-none focus-within:shadow-borders-interactive-with-focus  rounded-md [&:hover>div]:bg-ui-bg-component-hover"
            >
              {Inner}
            </Link>
          )
        })}
      </div>
    </Container>
  )
}
