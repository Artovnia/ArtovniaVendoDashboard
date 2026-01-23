import { Heading, Text, Input, Textarea, Button, Badge } from "@medusajs/ui"
import { UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { SparklesSolid } from "@medusajs/icons"

import { Form } from "../../../../../../../components/common/form"
import { ProductCreateSchemaType } from "../../../../types"
import { useGPSRAutofill } from "../../../../../../../hooks/use-gpsr-autofill"

type ProductGPSRSectionProps = {
  form: UseFormReturn<ProductCreateSchemaType>
}

export const ProductCreateGPSRSection = ({ form }: ProductGPSRSectionProps) => {
  const { t } = useTranslation()
  const { control } = form

  // Initialize GPSR auto-fill hook
  const { hasStoredData, loadDefaults, isAutoFilled } = useGPSRAutofill({
    form,
    autoFillOnMount: true, // Automatically fill on mount if data exists
  })

  return (
    <div className="flex flex-col gap-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Heading level="h2">{t("products.gpsr.title")}</Heading>
            {isAutoFilled && (
              <Badge size="small" color="green">
                <SparklesSolid className="mr-1" />
                {t("products.gpsr.autoFilled", "Auto-filled")}
              </Badge>
            )}
          </div>
          <Text className="text-ui-fg-subtle text-sm sm:text-base">
            {t("products.gpsr.description")}
          </Text>
        </div>
        {hasStoredData && !isAutoFilled && (
          <Button
            type="button"
            variant="secondary"
            size="small"
            onClick={loadDefaults}
            className="w-full sm:w-auto"
          >
            <SparklesSolid className="mr-1" />
            {t("products.gpsr.useSavedData", "Use saved data")}
          </Button>
        )}
      </div>

      {/* Producer Information - Required */}
      <div className="border-b pb-4 ">
        <Heading level="h3" className="mb-2">{t("products.gpsr.sections.producer")}</Heading>
        
        <Form.Field
          control={control}
          name="metadata.gpsr_producer_name"
          render={({ field }) => (
            <Form.Item>
              <Form.Label>
                {t("products.gpsr.fields.producerName")} *
              </Form.Label>
              <Form.Hint>
                {t("products.gpsr.producer.name.description")}
              </Form.Hint>
              <Form.Control>
                <Input {...field} value={field.value ?? ""} placeholder={t("products.gpsr.producer.name.placeholder")} />
              </Form.Control>
              <Form.ErrorMessage />
            </Form.Item>
          )}
        />

        <Form.Field
          control={control}
          name="metadata.gpsr_producer_address"
          render={({ field }) => (
            <Form.Item>
              <Form.Label>
                {t("products.gpsr.fields.producerAddress")} *
              </Form.Label>
              <Form.Hint>
                {t("products.gpsr.producer.address.description")}
              </Form.Hint>
              <Form.Control>
                <Textarea 
                  {...field} 
                  value={field.value ?? ""}
                  placeholder={t("products.gpsr.producer.address.placeholder")}
                  rows={2}
                />
              </Form.Control>
              <Form.ErrorMessage />
            </Form.Item>
          )}
        />

        <Form.Field
          control={control}
          name="metadata.gpsr_producer_contact"
          render={({ field }) => (
            <Form.Item>
              <Form.Label>
                {t("products.gpsr.fields.producerContact")} *
              </Form.Label>
              <Form.Hint>
                {t("products.gpsr.producer.contact.description")}
              </Form.Hint>
              <Form.Control>
                <Input 
                  {...field} 
                  value={field.value ?? ""}
                  placeholder={t("products.gpsr.producer.contact.placeholder")}
                />
              </Form.Control>
              <Form.ErrorMessage />
            </Form.Item>
          )}
        />
      </div>

      {/* Importer Information - Optional */}
      <div className="border-b pb-4">
        <Heading level="h3" className="mb-2 ">{t("products.gpsr.sections.importer")}</Heading>
        
        <Form.Field
          control={control}
          name="metadata.gpsr_importer_name"
          render={({ field }) => (
            <Form.Item>
              <Form.Label>
                {t("products.gpsr.fields.importerName")}
              </Form.Label>
              <Form.Hint>
                {t("products.gpsr.importer.name.description")}
              </Form.Hint>
              <Form.Control>
                <Input {...field} value={field.value ?? ""} placeholder={t("products.gpsr.importer.name.placeholder")} />
              </Form.Control>
              <Form.ErrorMessage />
            </Form.Item>
          )}
        />

        <Form.Field
          control={control}
          name="metadata.gpsr_importer_address"
          render={({ field }) => (
            <Form.Item>
              <Form.Label>
                {t("products.gpsr.fields.importerAddress")}
              </Form.Label>
              <Form.Hint>
                {t("products.gpsr.importer.address.description")}
              </Form.Hint>
              <Form.Control>
                <Textarea 
                  {...field} 
                  value={field.value ?? ""}
                  placeholder={t("products.gpsr.importer.address.placeholder")}
                  rows={2}
                />
              </Form.Control>
              <Form.ErrorMessage />
            </Form.Item>
          )}
        />

        <Form.Field
          control={control}
          name="metadata.gpsr_importer_contact"
          render={({ field }) => (
            <Form.Item>
              <Form.Label>
                {t("products.gpsr.fields.importerContact")}
              </Form.Label>
              <Form.Hint>
                {t("products.gpsr.importer.contact.description")}
              </Form.Hint>
              <Form.Control>
                <Input 
                  {...field} 
                  value={field.value ?? ""}
                  placeholder={t("products.gpsr.importer.contact.placeholder")}
                />
              </Form.Control>
              <Form.ErrorMessage />
            </Form.Item>
          )}
        />
      </div>

      {/* Instructions/Warnings - Required */}
      <Form.Field
        control={control}
        name="metadata.gpsr_instructions"
        render={({ field }) => (
          <Form.Item>
            <Form.Label>
              {t("products.gpsr.fields.instructions")} *
            </Form.Label>
            <Form.Hint>
              {t("products.gpsr.instructions.description")}
            </Form.Hint>
            <Form.Control>
              <Textarea 
                {...field} 
                value={field.value ?? ""}
                placeholder={t("products.gpsr.instructions.placeholder")}
                rows={4}
              />
            </Form.Control>
            <Form.ErrorMessage />
          </Form.Item>
        )}
      />

      {/* Certificates - Optional */}
      <Form.Field
        control={control}
        name="metadata.gpsr_certificates"
        render={({ field }) => (
          <Form.Item>
            <Form.Label>{t("products.gpsr.fields.certificates")}</Form.Label>
            <Form.Hint>
              {t("products.gpsr.certificates.description")}
            </Form.Hint>
            <Form.Control>
              <Input 
                {...field} 
                value={field.value ?? ""}
                placeholder={t("products.gpsr.certificates.placeholder")}
              />
            </Form.Control>
            <Form.ErrorMessage />
          </Form.Item>
        )}
      />
    </div>
  )
}
