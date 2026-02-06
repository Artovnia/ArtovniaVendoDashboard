import { Button, Container, Heading, Input, Label, Text, Textarea, Badge } from "@medusajs/ui"
import { RichTextEditor } from "../../../components/rich-text-editor/rich-text-editor"
import { Plus, Trash, XMark } from "@medusajs/icons"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { TemplateData, TemplateOption, TemplateGPSR } from "../../../hooks/api/product-templates"

type TemplateDataEditorProps = {
  templateData: TemplateData
  onChange: (data: TemplateData) => void
}

export const TemplateDataEditor = ({ templateData, onChange }: TemplateDataEditorProps) => {
  const { t } = useTranslation()

  const updateField = <K extends keyof TemplateData>(key: K, value: TemplateData[K]) => {
    onChange({ ...templateData, [key]: value })
  }

  return (
    <div className="flex flex-col gap-y-4">
      {/* Options Section */}
      <OptionsEditor
        options={templateData.options || []}
        onChange={(options) => updateField("options", options)}
      />

      {/* GPSR Section */}
      <GPSREditor
        gpsr={templateData.gpsr || {}}
        onChange={(gpsr) => updateField("gpsr", gpsr)}
      />

      {/* Description Template */}
      <Container className="flex flex-col gap-y-3 p-6">
        <Heading level="h3" className="text-sm">
          {t("formFields.description.label", { defaultValue: "Description Template" })}
        </Heading>
        <RichTextEditor
          value={templateData.description_template || ""}
          onChange={(val) => updateField("description_template", val || undefined)}
          placeholder={t("formFields.description.placeholder", { defaultValue: "Description template..." })}
        />
      </Container>

      {/* Dimensions Section */}
      <Container className="flex flex-col gap-y-3 p-6">
        <Heading level="h3" className="text-sm">
          {t("productTemplates.withDimensions", { defaultValue: "Dimensions" })}
        </Heading>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-y-1">
            <Label size="xsmall">{t("formFields.weight.label", { defaultValue: "Weight" })}</Label>
            <Input
              type="number"
              value={templateData.dimensions?.weight ?? ""}
              onChange={(e) => {
                const val = e.target.value ? Number(e.target.value) : undefined
                updateField("dimensions", {
                  ...templateData.dimensions,
                  weight: val,
                })
              }}
              placeholder="0"
            />
          </div>
          <div className="flex flex-col gap-y-1">
            <Label size="xsmall">{t("formFields.length.label", { defaultValue: "Length" })}</Label>
            <Input
              type="number"
              value={templateData.dimensions?.length ?? ""}
              onChange={(e) => {
                const val = e.target.value ? Number(e.target.value) : undefined
                updateField("dimensions", {
                  ...templateData.dimensions,
                  length: val,
                })
              }}
              placeholder="0"
            />
          </div>
          <div className="flex flex-col gap-y-1">
            <Label size="xsmall">{t("formFields.width.label", { defaultValue: "Width" })}</Label>
            <Input
              type="number"
              value={templateData.dimensions?.width ?? ""}
              onChange={(e) => {
                const val = e.target.value ? Number(e.target.value) : undefined
                updateField("dimensions", {
                  ...templateData.dimensions,
                  width: val,
                })
              }}
              placeholder="0"
            />
          </div>
          <div className="flex flex-col gap-y-1">
            <Label size="xsmall">{t("formFields.height.label", { defaultValue: "Height" })}</Label>
            <Input
              type="number"
              value={templateData.dimensions?.height ?? ""}
              onChange={(e) => {
                const val = e.target.value ? Number(e.target.value) : undefined
                updateField("dimensions", {
                  ...templateData.dimensions,
                  height: val,
                })
              }}
              placeholder="0"
            />
          </div>
        </div>
      </Container>

      {/* Material & Origin */}
      <Container className="flex flex-col gap-y-3 p-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-y-1">
            <Label size="xsmall">{t("formFields.material.label", { defaultValue: "Material" })}</Label>
            <Input
              value={templateData.material || ""}
              onChange={(e) => updateField("material", e.target.value || undefined)}
              placeholder={t("formFields.material.placeholder", { defaultValue: "e.g. Cotton, Polyester, Wool" })}
            />
          </div>
          <div className="flex flex-col gap-y-1">
            <Label size="xsmall">{t("formFields.countryOrigin.label", { defaultValue: "Country of Origin" })}</Label>
            <Input
              value={templateData.origin_country || ""}
              onChange={(e) => updateField("origin_country", e.target.value || undefined)}
              placeholder={t("formFields.countryOrigin.label", { defaultValue: "Country of Origin" })}
            />
          </div>
        </div>
      </Container>
    </div>
  )
}

/**
 * Options editor sub-component
 */
const OptionsEditor = ({
  options,
  onChange,
}: {
  options: TemplateOption[]
  onChange: (options: TemplateOption[]) => void
}) => {
  const { t } = useTranslation()
  const [newValueInputs, setNewValueInputs] = useState<Record<number, string>>({})

  const addOption = () => {
    onChange([...options, { title: "", values: [] }])
  }

  const removeOption = (index: number) => {
    onChange(options.filter((_, i) => i !== index))
  }

  const updateOptionTitle = (index: number, title: string) => {
    const next = [...options]
    next[index] = { ...next[index], title }
    onChange(next)
  }

  const addValue = (optionIndex: number) => {
    const value = (newValueInputs[optionIndex] || "").trim()
    if (!value) return

    const next = [...options]
    next[optionIndex] = {
      ...next[optionIndex],
      values: [...next[optionIndex].values, value],
    }
    onChange(next)
    setNewValueInputs({ ...newValueInputs, [optionIndex]: "" })
  }

  const updateValuePrice = (optionIndex: number, value: string, price: string) => {
    const next = [...options]
    const opt = { ...next[optionIndex] }
    const valuePrices = { ...(opt.value_prices || {}) }

    if (price === "" || price === undefined) {
      delete valuePrices[value]
    } else {
      const numPrice = parseFloat(price)
      if (!isNaN(numPrice)) {
        valuePrices[value] = { default: numPrice }
      }
    }

    opt.value_prices = Object.keys(valuePrices).length > 0 ? valuePrices : undefined
    next[optionIndex] = opt
    onChange(next)
  }

  const removeValue = (optionIndex: number, valueIndex: number) => {
    const next = [...options]
    const removedValue = next[optionIndex].values[valueIndex]
    const opt = {
      ...next[optionIndex],
      values: next[optionIndex].values.filter((_, i) => i !== valueIndex),
    }
    // Clean up value_prices for removed value
    if (opt.value_prices && removedValue && opt.value_prices[removedValue]) {
      const vp = { ...opt.value_prices }
      delete vp[removedValue]
      opt.value_prices = Object.keys(vp).length > 0 ? vp : undefined
    }
    next[optionIndex] = opt
    onChange(next)
  }

  return (
    <Container className="flex flex-col gap-y-3 p-6">
      <div className="flex items-center justify-between">
        <Heading level="h3" className="text-sm">
          {t("products.fields.options.header", { defaultValue: "Options" })}
        </Heading>
        <Button variant="primary" size="small" type="button" onClick={addOption}>
          <Plus className="mr-1" />
          {t("actions.add", { defaultValue: "Add" })}
        </Button>
      </div>

      {options.length === 0 && (
        <Text size="small" className="text-ui-fg-muted">
          {t("productTemplates.noOptionsHint", {
            defaultValue: "No options defined. Add options like Size, Color, etc.",
          })}
        </Text>
      )}

      {options.map((option, optionIndex) => (
        <div key={optionIndex} className="flex flex-col gap-y-2 rounded-lg border border-ui-border-base p-3">
          <div className="flex items-center gap-x-2">
            <Input
              value={option.title}
              onChange={(e) => updateOptionTitle(optionIndex, e.target.value)}
              placeholder={t("products.fields.options.optionTitlePlaceholder", { defaultValue: "Option name (e.g. Size)" })}
              className="flex-1"
              size="small"
            />
            <Button
              variant="primary"
              size="small"
              type="button"
              onClick={() => removeOption(optionIndex)}
            >
              <Trash />
            </Button>
          </div>

          <div className="flex flex-col gap-y-2">
            {option.values.map((value, valueIndex) => (
              <div key={valueIndex} className="flex items-center gap-x-2">
                <Badge size="small" className="flex items-center gap-x-1 shrink-0">
                  {value}
                  <button
                    type="button"
                    onClick={() => removeValue(optionIndex, valueIndex)}
                    className="ml-1 text-ui-fg-muted hover:text-ui-fg-base"
                  >
                    <XMark className="h-3 w-3" />
                  </button>
                </Badge>
                <Input
                  type="number"
                  value={option.value_prices?.[value]?.default ?? ""}
                  onChange={(e) => updateValuePrice(optionIndex, value, e.target.value)}
                  placeholder={t("productTemplates.priceForValue", { value, defaultValue: `Price for ${value}` })}
                  className="w-32"
                  size="small"
                />
              </div>
            ))}
          </div>

          <div className="flex items-center gap-x-2">
            <Input
              value={newValueInputs[optionIndex] || ""}
              onChange={(e) =>
                setNewValueInputs({ ...newValueInputs, [optionIndex]: e.target.value })
              }
              placeholder={t("products.fields.options.variantionsPlaceholder", { defaultValue: "Add value (e.g. S, M, L)" })}
              className="flex-1"
              size="small"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  addValue(optionIndex)
                }
              }}
            />
            <Button variant="primary" size="small" type="button" onClick={() => addValue(optionIndex)}>
              <Plus />
            </Button>
          </div>
        </div>
      ))}
    </Container>
  )
}

/**
 * GPSR editor sub-component
 */
const GPSREditor = ({
  gpsr,
  onChange,
}: {
  gpsr: TemplateGPSR
  onChange: (gpsr: TemplateGPSR) => void
}) => {
  const { t } = useTranslation()

  const updateField = (key: keyof TemplateGPSR, value: string) => {
    onChange({ ...gpsr, [key]: value || undefined })
  }

  return (
    <Container className="flex flex-col gap-y-3 p-6">
      <Heading level="h3" className="text-sm">
        {t("products.gpsr.title", { defaultValue: "GPSR Data" })}
      </Heading>

      <div className="grid grid-cols-1 gap-3">
        <div className="flex flex-col gap-y-1">
          <Label size="xsmall">
            {t("products.gpsr.fields.producerName", { defaultValue: "Producer Name" })}
          </Label>
          <Input
            value={gpsr.producer_name || ""}
            onChange={(e) => updateField("producer_name", e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-y-1">
          <Label size="xsmall">
            {t("products.gpsr.fields.producerAddress", { defaultValue: "Producer Address" })}
          </Label>
          <Input
            value={gpsr.producer_address || ""}
            onChange={(e) => updateField("producer_address", e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-y-1">
          <Label size="xsmall">
            {t("products.gpsr.fields.producerContact", { defaultValue: "Producer Contact" })}
          </Label>
          <Input
            value={gpsr.producer_contact || ""}
            onChange={(e) => updateField("producer_contact", e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-y-1">
          <Label size="xsmall">
            {t("products.gpsr.fields.importerName", { defaultValue: "Importer Name" })}
          </Label>
          <Input
            value={gpsr.importer_name || ""}
            onChange={(e) => updateField("importer_name", e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-y-1">
          <Label size="xsmall">
            {t("products.gpsr.fields.importerAddress", { defaultValue: "Importer Address" })}
          </Label>
          <Input
            value={gpsr.importer_address || ""}
            onChange={(e) => updateField("importer_address", e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-y-1">
          <Label size="xsmall">
            {t("products.gpsr.fields.importerContact", { defaultValue: "Importer Contact" })}
          </Label>
          <Input
            value={gpsr.importer_contact || ""}
            onChange={(e) => updateField("importer_contact", e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-y-1">
          <Label size="xsmall">
            {t("products.gpsr.fields.instructions", { defaultValue: "Safety Instructions" })}
          </Label>
          <Textarea
            value={gpsr.instructions || ""}
            onChange={(e) => updateField("instructions", e.target.value)}
            rows={3}
          />
        </div>
        <div className="flex flex-col gap-y-1">
          <Label size="xsmall">
            {t("products.gpsr.fields.certificates", { defaultValue: "Certificates" })}
          </Label>
          <Input
            value={gpsr.certificates || ""}
            onChange={(e) => updateField("certificates", e.target.value)}
          />
        </div>
      </div>
    </Container>
  )
}
