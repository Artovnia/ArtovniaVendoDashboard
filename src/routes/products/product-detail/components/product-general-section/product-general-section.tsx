import { PencilSquare, Trash } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { Container, Heading, StatusBadge, usePrompt, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'

import { ActionMenu } from "../../../../../components/common/action-menu"
import { SectionRow } from "../../../../../components/common/section"
import { useDashboardExtension } from "../../../../../extensions"
import { useDeleteProduct } from "../../../../../hooks/api/products"

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

      {/* Description with formatted Markdown rendering */}
      <div className="text-ui-fg-subtle grid w-full grid-cols-2 items-start gap-4 px-6 py-4">
        <Text size="small" weight="plus" leading="compact">
          {t("fields.description")}
        </Text>
        <div className="prose prose-sm max-w-none text-ui-fg-subtle">
          {product.description ? (
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkBreaks]}
              components={{
                // Paragraphs
                p: ({node, ...props}) => <p className="mb-2 text-sm leading-relaxed" {...props} />,
                
                // Inline formatting - explicit font-weight
                strong: ({node, ...props}) => <strong className="font-semibold" style={{ fontWeight: 600 }} {...props} />,
                b: ({node, ...props}) => <strong className="font-semibold" style={{ fontWeight: 600 }} {...props} />,
                em: ({node, ...props}) => <em className="italic" {...props} />,
                i: ({node, ...props}) => <em className="italic" {...props} />,
                
                // Headings - compact sizes for admin panel
                h1: ({node, ...props}) => <h1 className="text-lg font-semibold mb-2 mt-3" style={{ fontWeight: 600 }} {...props} />,
                h2: ({node, ...props}) => <h2 className="text-base font-semibold mb-2 mt-3" style={{ fontWeight: 600 }} {...props} />,
                h3: ({node, ...props}) => <h3 className="text-sm font-semibold mb-1 mt-2" style={{ fontWeight: 600 }} {...props} />,
                h4: ({node, ...props}) => <h4 className="text-sm font-semibold mb-1 mt-2" style={{ fontWeight: 600 }} {...props} />,
                h5: ({node, ...props}) => <h5 className="text-xs font-semibold mb-1 mt-2" style={{ fontWeight: 600 }} {...props} />,
                h6: ({node, ...props}) => <h6 className="text-xs font-semibold mb-1 mt-1" style={{ fontWeight: 600 }} {...props} />,
                
                // Lists - compact spacing
                ul: ({node, ...props}) => <ul className="list-disc ml-4 mb-2 space-y-0.5 text-sm" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal ml-4 mb-2 space-y-0.5 text-sm" {...props} />,
                li: ({node, ...props}) => <li className="text-sm leading-relaxed" {...props} />,
                
                // Links
                a: ({node, ...props}) => <a className="text-ui-fg-interactive hover:underline" {...props} />,
                
                // Code
                code: ({node, ...props}) => <code className="bg-ui-bg-subtle px-1 py-0.5 rounded text-xs font-mono" {...props} />,
                
                // Blockquotes
                blockquote: ({node, ...props}) => (
                  <blockquote className="border-l-2 border-ui-border-base pl-3 italic my-2 text-ui-fg-muted text-sm" {...props} />
                ),
                
                // Tables - compact
                table: ({node, ...props}) => (
                  <div className="overflow-x-auto my-2">
                    <table className="min-w-full border-collapse border border-ui-border-base text-sm" {...props} />
                  </div>
                ),
                thead: ({node, ...props}) => <thead className="bg-ui-bg-subtle" {...props} />,
                th: ({node, ...props}) => (
                  <th className="border border-ui-border-base px-2 py-1 text-left font-semibold text-xs" {...props} />
                ),
                td: ({node, ...props}) => (
                  <td className="border border-ui-border-base px-2 py-1 text-xs" {...props} />
                ),
                
                // Strikethrough
                del: ({node, ...props}) => <del className="text-ui-fg-muted" {...props} />,
              }}
            >
              {product.description}
            </ReactMarkdown>
          ) : (
            <Text size="small" leading="compact" className="text-ui-fg-muted">
              -
            </Text>
          )}
        </div>
      </div>
      <SectionRow title={t("fields.subtitle")} value={product.subtitle} />
      <SectionRow title={t("fields.handle")} value={`/${product.handle}`} />
      <SectionRow
        title={t("fields.discountable")}
        value={product.discountable ? t("fields.true") : t("fields.false")}
      />
      {displays.map((Component, index) => {
        return <Component key={index} data={product} />
      })}
    </Container>
  )
}
