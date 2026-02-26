import { useMemo, useState } from "react"
import { PencilSquare, Trash, Facebook } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { Container, Heading, StatusBadge, usePrompt, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

import { ActionMenu } from "../../../../../components/common/action-menu"
import { SectionRow } from "../../../../../components/common/section"
import { descriptionToHtml } from "../../../../../components/rich-text-editor/format-converter"
import { useDashboardExtension } from "../../../../../extensions"
import { useDeleteProduct } from "../../../../../hooks/api/products"
import { useMe } from "../../../../../hooks/api/users"
import { FacebookPromoteModal } from "../../../common/facebook-promote-modal"

const productStatusColor = (status: string) => {
  switch (status) {
    case "draft":
      return "grey"
    case "proposed":
      return "orange"
    case "published":
      return "green"
    case "rejected":
      return "red"
    default:
      return "grey"
  }
}

type ProductGeneralSectionProps = {
  product: HttpTypes.AdminProduct
}

export const ProductGeneralSection = ({
  product,
}: ProductGeneralSectionProps) => {
  const { t } = useTranslation()
  const prompt = usePrompt()
  const navigate = useNavigate()
  const { getDisplays } = useDashboardExtension()
  const { seller } = useMe()
  const [showFbPromote, setShowFbPromote] = useState(false)

  const displays = getDisplays("product", "general")

  const { mutateAsync } = useDeleteProduct(product.id)

  const handleDelete = async () => {
    const res = await prompt({
      title: t("general.areYouSure"),
      description: t("deleteWarning", {
        title: product.title,
      }),
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
    })

    if (!res) {
      return
    }

    await mutateAsync(undefined, {
      onSuccess: () => {
        navigate("..")
      },
    })
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading>{product.title}</Heading>
        <div className="flex items-center gap-x-4">
          <StatusBadge color={productStatusColor(product.status)}>
            {t(`productStatus.${product.status}`)}
          </StatusBadge>
          <ActionMenu
            groups={[
              {
                actions: [
                  {
                    label: t("actions.edit"),
                    to: "edit",
                    icon: <PencilSquare />,
                  },
                  {
                    label: t("fbPromote.menuAction", "Promuj na Facebooku"),
                    onClick: () => setShowFbPromote(true),
                    icon: <Facebook />,
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

      {/* Description — renders HTML (new products) or converts legacy markdown */}
      <ProductDescriptionRow
        label={t("fields.description")}
        description={product.description}
      />
      <SectionRow title={t("fields.subtitle")} value={product.subtitle} />
      <SectionRow title={t("fields.handle")} value={`/${product.handle}`} />
      <SectionRow
        title={t("fields.discountable")}
        value={product.discountable ? t("fields.true") : t("fields.false")}
      />
      {displays.map((Component, index) => {
        return <Component key={index} data={product} />
      })}

      {/* Facebook Promote Modal */}
      {showFbPromote && (
        <FacebookPromoteModal
          open={showFbPromote}
          onClose={() => setShowFbPromote(false)}
          productId={product.id}
          vendorName={seller?.name}
          vendorId={seller?.id}
          initialProductHandle={product.handle || undefined}
          initialProductTitle={product.title || undefined}
          initialProductThumbnail={product.thumbnail || null}
          initialProductStatus={product.status}
        />
      )}
    </Container>
  )
}

/**
 * Renders product description as HTML.
 * Handles both new HTML content and legacy markdown via descriptionToHtml().
 * Styled with inline CSS to match the vendor panel design system.
 */
const ProductDescriptionRow = ({
  label,
  description,
}: {
  label: string
  description?: string | null
}) => {
  const html = useMemo(
    () => (description ? descriptionToHtml(description) : ""),
    [description]
  )

  return (
    <div className="text-ui-fg-subtle grid w-full grid-cols-2 items-start gap-4 px-6 py-4">
      <Text size="small" weight="plus" leading="compact">
        {label}
      </Text>
      <div className="max-w-none text-ui-fg-subtle">
        {html ? (
          <div
            className="vendor-description-html text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <Text size="small" leading="compact" className="text-ui-fg-muted">
            -
          </Text>
        )}
      </div>
      <style>{`
        .vendor-description-html p { margin-bottom: 0.5rem; }
        .vendor-description-html strong { font-weight: 600; }
        .vendor-description-html em { font-style: italic; }
        .vendor-description-html u { text-decoration: underline; }
        .vendor-description-html s,
        .vendor-description-html del { text-decoration: line-through; color: var(--ui-fg-muted); }
        .vendor-description-html h1 { font-size: 1.125rem; font-weight: 600; margin: 0.75rem 0 0.5rem; }
        .vendor-description-html h2 { font-size: 1rem; font-weight: 600; margin: 0.75rem 0 0.5rem; }
        .vendor-description-html h3 { font-size: 0.875rem; font-weight: 600; margin: 0.5rem 0 0.25rem; }
        .vendor-description-html h4 { font-size: 0.875rem; font-weight: 600; margin: 0.5rem 0 0.25rem; }
        .vendor-description-html ul { list-style-type: disc; margin-left: 1rem; margin-bottom: 0.5rem; }
        .vendor-description-html ol { list-style-type: decimal; margin-left: 1rem; margin-bottom: 0.5rem; }
        .vendor-description-html li { margin-bottom: 0.125rem; }
        .vendor-description-html a { color: var(--ui-fg-interactive); text-decoration: underline; }
        .vendor-description-html a:hover { text-decoration: none; }
        .vendor-description-html code { background: var(--ui-bg-subtle); padding: 0.1rem 0.25rem; border-radius: 0.2rem; font-size: 0.75rem; font-family: monospace; }
        .vendor-description-html blockquote { border-left: 2px solid var(--ui-border-base); padding-left: 0.75rem; font-style: italic; margin: 0.5rem 0; color: var(--ui-fg-muted); }
        .vendor-description-html table { min-width: 100%; border-collapse: collapse; margin: 0.5rem 0; }
        .vendor-description-html th { border: 1px solid var(--ui-border-base); padding: 0.25rem 0.5rem; text-align: left; font-weight: 600; font-size: 0.75rem; background: var(--ui-bg-subtle); }
        .vendor-description-html td { border: 1px solid var(--ui-border-base); padding: 0.25rem 0.5rem; font-size: 0.75rem; }
      `}</style>
    </div>
  )
}
