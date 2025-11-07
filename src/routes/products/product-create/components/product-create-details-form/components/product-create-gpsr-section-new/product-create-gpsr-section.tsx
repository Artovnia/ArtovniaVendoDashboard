import { Heading, Text, Input, Textarea } from "@medusajs/ui"
import { UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { Form } from "../../../../../../../components/common/form"
import { ProductCreateSchemaType } from "../../../../types"

type ProductGPSRSectionProps = {
  form: UseFormReturn<ProductCreateSchemaType>
}

export const ProductCreateGPSRSection = ({ form }: ProductGPSRSectionProps) => {
  const { t } = useTranslation()
  const { control } = form

  return (
    <div className="flex flex-col gap-y-6">
      <div>
        <Heading level="h2">{t("products.gpsr.title")}</Heading>
        <Text className="text-ui-fg-subtle">
          {t("products.gpsr.description")}
        </Text>
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
                <Input {...field} placeholder={t("products.gpsr.producer.name.placeholder")} />
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
                <Input {...field} placeholder={t("products.gpsr.importer.name.placeholder")} />
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
