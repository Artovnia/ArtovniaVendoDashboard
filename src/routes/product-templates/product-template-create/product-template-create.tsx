import { Button, Container, Heading, Input, Label, Switch, Text, Textarea, toast } from "@medusajs/ui"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

import { useCreateProductTemplate, TemplateData } from "../../../hooks/api/product-templates"
import { TemplateDataEditor } from "../components/template-data-editor"

export const ProductTemplateCreate = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const createTemplate = useCreateProductTemplate()

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isDefault, setIsDefault] = useState(false)
  const [templateData, setTemplateData] = useState<TemplateData>({})

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error(t("productTemplates.nameRequired"))
      return
    }

    try {
      await createTemplate.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        template_data: templateData,
        is_default: isDefault,
      })

      toast.success(t("productTemplates.saved", { name }))
      navigate("/product-templates")
    } catch (error) {
      console.error("Failed to create template:", error)
      toast.error(t("productTemplates.saveError"))
    }
  }

  return (
    <div className="flex flex-col items-center p-4 sm:p-8 md:p-16">
      <div className="flex w-full max-w-[720px] flex-col gap-y-6">
        <div>
          <Heading level="h1">{t("productTemplates.createTemplate")}</Heading>
          <Text className="text-ui-fg-subtle" size="small">
            {t("productTemplates.description")}
          </Text>
          <Text className="text-ui-fg-muted mt-2" size="small">
            <strong>{t("productTemplates.howItWorks")}:</strong> {t("productTemplates.howItWorksDescription")}
          </Text>
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
            onClick={handleSubmit}
            isLoading={createTemplate.isPending}
          >
            {t("actions.save")}
          </Button>
        </div>
      </div>
    </div>
  )
}

export const Component = ProductTemplateCreate
