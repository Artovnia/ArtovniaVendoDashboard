import { Button, Container, Heading, Input, Label, Switch, Text, Textarea, toast, usePrompt } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router-dom"

import {
  useProductTemplate,
  useUpdateProductTemplate,
  useDeleteProductTemplate,
  TemplateData,
} from "../../../hooks/api/product-templates"
import { TemplateDataEditor } from "../components/template-data-editor"

export const ProductTemplateDetail = () => {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const prompt = usePrompt()

  const { product_template, isLoading } = useProductTemplate(id!)
  const updateTemplate = useUpdateProductTemplate(id!)
  const deleteTemplate = useDeleteProductTemplate(id!)

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isDefault, setIsDefault] = useState(false)
  const [templateData, setTemplateData] = useState<TemplateData>({})
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (product_template && !initialized) {
      setName(product_template.name)
      setDescription(product_template.description || "")
      setIsDefault(product_template.is_default)
      setTemplateData(product_template.template_data || {})
      setInitialized(true)
    }
  }, [product_template, initialized])

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error(t("productTemplates.nameRequired"))
      return
    }

    try {
      await updateTemplate.mutateAsync({
        name: name.trim(),
        description: description.trim() || null,
        template_data: templateData,
        is_default: isDefault,
      })

      toast.success(t("productTemplates.saved", { name }))
    } catch (error) {
      console.error("Failed to update template:", error)
      toast.error(t("productTemplates.saveError"))
    }
  }

  const handleDelete = async () => {
    const confirmed = await prompt({
      title: t("productTemplates.deleteTemplate"),
      description: t("productTemplates.deleteConfirm"),
    })

    if (!confirmed) return

    try {
      await deleteTemplate.mutateAsync()
      toast.success(t("productTemplates.deleteSuccess"))
      navigate("/product-templates")
    } catch (error) {
      console.error("Failed to delete template:", error)
      toast.error(t("productTemplates.saveError"))
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Text className="text-ui-fg-muted">{t("productTemplates.loading")}</Text>
      </div>
    )
  }

  if (!product_template) {
    return (
      <div className="flex items-center justify-center py-20">
        <Text className="text-ui-fg-muted">Template not found</Text>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center p-4 sm:p-8 md:p-16">
      <div className="flex w-full max-w-[720px] flex-col gap-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Heading level="h1">{t("productTemplates.editTemplate")}</Heading>
            <Text className="text-ui-fg-subtle" size="small">
              {product_template.name}
            </Text>
          </div>
          <Button
            variant="danger"
            size="small"
            onClick={handleDelete}
            isLoading={deleteTemplate.isPending}
          >
            {t("productTemplates.deleteTemplate")}
          </Button>
        </div>

        <Container className="flex flex-col gap-y-4 p-6">
          <div className="flex flex-col gap-y-2">
            <Label htmlFor="template-name" size="small">
              {t("productTemplates.templateName")} *
            </Label>
            <Input
              id="template-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("productTemplates.namePlaceholder")}
            />
          </div>

          <div className="flex flex-col gap-y-2">
            <Label htmlFor="template-description" size="small">
              {t("productTemplates.templateDescription")}
            </Label>
            <Textarea
              id="template-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("productTemplates.templateDescription")}
              rows={3}
            />
          </div>

          <div className="flex items-center gap-x-3">
            <Switch
              id="template-default"
              checked={isDefault}
              onCheckedChange={setIsDefault}
            />
            <Label htmlFor="template-default" size="small">
              {t("productTemplates.isDefault")}
            </Label>
          </div>
        </Container>

        <TemplateDataEditor
          templateData={templateData}
          onChange={setTemplateData}
        />

        <div className="flex items-center justify-end gap-x-2">
          <Button
            variant="secondary"
            size="small"
            onClick={() => navigate("/product-templates")}
          >
            {t("actions.cancel")}
          </Button>
          <Button
            variant="primary"
            size="small"
            onClick={handleSave}
            isLoading={updateTemplate.isPending}
          >
            {t("actions.save")}
          </Button>
        </div>
      </div>
    </div>
  )
}

export const Component = ProductTemplateDetail
