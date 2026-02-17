import { PencilSquare, Trash, Plus, EllipsisHorizontal } from "@medusajs/icons"
import {
  Badge,
  Button,
  Container,
  Heading,
  Table,
  Text,
  toast,
  usePrompt,
  DropdownMenu,
  IconButton,
} from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

import { SingleColumnPage } from "../../../components/layout/pages"
import {
  useProductTemplates,
  useDeleteProductTemplate,
  ProductTemplate,
} from "../../../hooks/api/product-templates"

export const ProductTemplateList = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { product_templates, isLoading } = useProductTemplates()

  return (
    <SingleColumnPage
      widgets={{
        before: [],
        after: [],
      }}
    >
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <Heading level="h2">
              {t("productTemplates.title")}
            </Heading>
            <Text className="text-ui-fg-subtle" size="small">
              {t("productTemplates.subtitle")}
            </Text>
          </div>
          <Button
            variant="secondary"
            size="small"
            onClick={() => navigate("/product-templates/create")}
          >
            <Plus className="mr-1" />
            {t("productTemplates.createTemplate")}
          </Button>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-10">
            <Text className="text-ui-fg-muted">
              {t("productTemplates.loading")}
            </Text>
          </div>
        )}

        {!isLoading && product_templates.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-y-2 py-10">
            <Text className="text-ui-fg-muted">
              {t("productTemplates.noTemplates")}
            </Text>
          </div>
        )}

        {!isLoading && product_templates.length > 0 && (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>
                  {t("productTemplates.templateName")}
                </Table.HeaderCell>
                <Table.HeaderCell>
                  {t("productTemplates.templateDescription")}
                </Table.HeaderCell>
                <Table.HeaderCell>
                  {t("productTemplates.templateData")}
                </Table.HeaderCell>
                <Table.HeaderCell className="w-[60px]" />
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {product_templates.map((template) => (
                <TemplateRow key={template.id} template={template} />
              ))}
            </Table.Body>
          </Table>
        )}
      </Container>
    </SingleColumnPage>
  )
}

const TemplateRow = ({ template }: { template: ProductTemplate }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const prompt = usePrompt()
  const deleteTemplate = useDeleteProductTemplate(template.id)

  const handleDelete = async () => {
    const confirmed = await prompt({
      title: t("productTemplates.deleteTemplate"),
      description: t("productTemplates.deleteConfirm"),
    })

    if (!confirmed) return

    try {
      await deleteTemplate.mutateAsync()
      toast.success(t("productTemplates.deleteSuccess"))
    } catch (error) {
      console.error("Failed to delete template:", error)
      toast.error(
        t("productTemplates.saveError", {
          defaultValue: "Failed to delete template",
        })
      )
    }
  }

  const getTemplateBadges = () => {
    const badges: { label: string; color: "grey" | "green" | "blue" | "orange" | "purple" }[] = []
    const data = template.template_data

    if (data.options && data.options.length > 0) {
      const nonDefault = data.options.filter((o) => o.title !== "Default option")
      if (nonDefault.length > 0) {
        badges.push({
          label: t("productTemplates.optionsCount", { count: nonDefault.length }),
          color: "blue",
        })
      }
    }

    if (data.gpsr && Object.keys(data.gpsr).length > 0) {
      badges.push({ label: t("productTemplates.withGpsr"), color: "purple" })
    }

    if (data.default_prices && Object.keys(data.default_prices).length > 0) {
      badges.push({ label: t("productTemplates.withPrices"), color: "green" })
    }

    if (data.categories && data.categories.length > 0) {
      badges.push({
        label: t("productTemplates.categoriesCount", { count: data.categories.length }),
        color: "orange",
      })
    }

    if (data.dimensions && Object.keys(data.dimensions).length > 0) {
      badges.push({ label: t("productTemplates.withDimensions"), color: "grey" })
    }

    return badges
  }

  return (
    <Table.Row className="cursor-pointer" onClick={() => navigate(`/product-templates/${template.id}`)}>
      <Table.Cell>
        <div className="flex items-center gap-x-2">
          <Text size="small" weight="plus">
            {template.name}
          </Text>
          {template.is_default && (
            <Badge size="2xsmall" color="green">
              {t("productTemplates.default")}
            </Badge>
          )}
        </div>
      </Table.Cell>
      <Table.Cell>
        <Text size="small" className="text-ui-fg-subtle truncate max-w-[200px]">
          {template.description || "—"}
        </Text>
      </Table.Cell>
      <Table.Cell>
        <div className="flex flex-wrap gap-1">
          {getTemplateBadges().map((badge, i) => (
            <Badge key={i} size="2xsmall" color={badge.color}>
              {badge.label}
            </Badge>
          ))}
        </div>
      </Table.Cell>
      <Table.Cell>
        <DropdownMenu>
          <DropdownMenu.Trigger asChild>
            <IconButton
              size="small"
              variant="transparent"
              onClick={(e) => e.stopPropagation()}
            >
              <EllipsisHorizontal />
            </IconButton>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content>
            <DropdownMenu.Item
              onClick={(e) => {
                e.stopPropagation()
                navigate(`/product-templates/${template.id}`)
              }}
            >
              <PencilSquare className="mr-2" />
              {t("productTemplates.editTemplate")}
            </DropdownMenu.Item>
            <DropdownMenu.Separator />
            <DropdownMenu.Item
              onClick={(e) => {
                e.stopPropagation()
                handleDelete()
              }}
              className="text-ui-fg-error"
            >
              <Trash className="mr-2" />
              {t("productTemplates.deleteTemplate")}
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu>
      </Table.Cell>
    </Table.Row>
  )
}

export const Component = ProductTemplateList
