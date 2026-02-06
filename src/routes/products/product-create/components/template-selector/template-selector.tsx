import { UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useState } from "react"
import { Button, Text, toast, Select, Badge } from "@medusajs/ui"
import { BookOpen, Plus } from "@medusajs/icons"

import { useProductTemplates, useCreateProductTemplate, ProductTemplate } from "../../../../../hooks/api/product-templates"
import { applyTemplate, extractTemplateFromForm } from "../../../../../lib/template-utils"
import { ProductCreateSchemaType } from "../../types"

type TemplateSelectorProps = {
  form: UseFormReturn<ProductCreateSchemaType>
}

export const TemplateSelector = ({ form }: TemplateSelectorProps) => {
  const { t } = useTranslation()
  const { product_templates, isLoading } = useProductTemplates()
  const createTemplate = useCreateProductTemplate()
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [templateName, setTemplateName] = useState("")
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("")

  const handleApplyTemplate = (templateId: string) => {
    const template = product_templates.find((t) => t.id === templateId)
    if (!template) return

    try {
      applyTemplate(template.template_data, form)
      setSelectedTemplateId(templateId)
      toast.success(
        t("productTemplates.applied", {
          name: template.name,
          defaultValue: `Template "${template.name}" applied`,
        })
      )
    } catch (error) {
      console.error("Failed to apply template:", error)
      toast.error(
        t("productTemplates.applyError", {
          defaultValue: "Failed to apply template",
        })
      )
    }
  }

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      toast.error(
        t("productTemplates.nameRequired", {
          defaultValue: "Template name is required",
        })
      )
      return
    }

    try {
      const templateData = extractTemplateFromForm(form)

      await createTemplate.mutateAsync({
        name: templateName.trim(),
        template_data: templateData,
      })

      toast.success(
        t("productTemplates.saved", {
          name: templateName,
          defaultValue: `Template "${templateName}" saved`,
        })
      )
      setTemplateName("")
      setShowSaveDialog(false)
    } catch (error) {
      console.error("Failed to save template:", error)
      toast.error(
        t("productTemplates.saveError", {
          defaultValue: "Failed to save template",
        })
      )
    }
  }

  const getTemplateDescription = (template: ProductTemplate) => {
    const parts: string[] = []
    const data = template.template_data

    if (data.options && data.options.length > 0) {
      const nonDefault = data.options.filter(
        (o) => o.title !== "Default option"
      )
      if (nonDefault.length > 0) {
        parts.push(
          t("productTemplates.optionsCount", { count: nonDefault.length, defaultValue: `${nonDefault.length} options` })
        )
      }
    }

    if (data.gpsr && Object.keys(data.gpsr).length > 0) {
      parts.push("GPSR")
    }

    if (data.default_prices && Object.keys(data.default_prices).length > 0) {
      parts.push(
        t("productTemplates.withPrices", { defaultValue: "prices" })
      )
    }

    if (data.categories && data.categories.length > 0) {
      parts.push(
        t("productTemplates.categoriesCount", { count: data.categories.length, defaultValue: `${data.categories.length} categories` })
      )
    }

    return parts.length > 0 ? parts.join(" · ") : ""
  }

  return (
    <div className="flex flex-col gap-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-x-2">
          <BookOpen className="text-ui-fg-muted" />
          <Text size="small" weight="plus" className="text-ui-fg-subtle">
            {t("productTemplates.title", {
              defaultValue: "Product Template",
            })}
          </Text>
        </div>
        <Button
          variant="transparent"
          size="small"
          type="button"
          onClick={() => setShowSaveDialog(!showSaveDialog)}
        >
          <Plus className="mr-1" />
          {t("productTemplates.saveAsCurrent", {
            defaultValue: "Save current as template",
          })}
        </Button>
      </div>

      {/* Template selector */}
      {product_templates.length > 0 && (
        <div className="flex items-center gap-x-2">
          <div className="flex-1">
            <Select
              value={selectedTemplateId}
              onValueChange={handleApplyTemplate}
            >
              <Select.Trigger>
                <Select.Value
                  placeholder={t("productTemplates.selectPlaceholder", {
                    defaultValue: "Select a template to prefill the form...",
                  })}
                />
              </Select.Trigger>
              <Select.Content>
                {product_templates.map((template) => (
                  <Select.Item key={template.id} value={template.id}>
                    <div className="flex items-center gap-x-2">
                      <span>{template.name}</span>
                      {template.is_default && (
                        <Badge size="2xsmall" color="green">
                          {t("productTemplates.default", {
                            defaultValue: "Default",
                          })}
                        </Badge>
                      )}
                      {getTemplateDescription(template) && (
                        <span className="text-ui-fg-muted text-xs">
                          ({getTemplateDescription(template)})
                        </span>
                      )}
                    </div>
                  </Select.Item>
                ))}
              </Select.Content>
            </Select>
          </div>
        </div>
      )}

      {isLoading && (
        <Text size="small" className="text-ui-fg-muted">
          {t("productTemplates.loading", {
            defaultValue: "Loading templates...",
          })}
        </Text>
      )}

      {!isLoading && product_templates.length === 0 && (
        <Text size="small" className="text-ui-fg-muted">
          {t("productTemplates.noTemplates", {
            defaultValue:
              "No templates yet. Fill in the form and save it as a template for future use.",
          })}
        </Text>
      )}

      {/* Save template dialog */}
      {showSaveDialog && (
        <div className="flex items-center gap-x-2 rounded-lg border border-ui-border-base bg-ui-bg-subtle p-3">
          <input
            type="text"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder={t("productTemplates.namePlaceholder", {
              defaultValue: "Template name...",
            })}
            className="flex-1 rounded-md border border-ui-border-base bg-ui-bg-field px-3 py-1.5 text-sm outline-none focus:border-ui-border-interactive"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                handleSaveTemplate()
              }
              if (e.key === "Escape") {
                setShowSaveDialog(false)
                setTemplateName("")
              }
            }}
            autoFocus
          />
          <Button
            variant="primary"
            size="small"
            type="button"
            onClick={handleSaveTemplate}
            isLoading={createTemplate.isPending}
          >
            {t("actions.save", { defaultValue: "Save" })}
          </Button>
          <Button
            variant="transparent"
            size="small"
            type="button"
            onClick={() => {
              setShowSaveDialog(false)
              setTemplateName("")
            }}
          >
            {t("actions.cancel", { defaultValue: "Cancel" })}
          </Button>
        </div>
      )}
    </div>
  )
}
