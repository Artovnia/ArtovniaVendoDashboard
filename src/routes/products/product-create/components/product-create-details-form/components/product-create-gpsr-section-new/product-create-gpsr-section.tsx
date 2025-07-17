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
        <Heading level="h2">{t("products.gpsr.title", "Informacje GPSR")}</Heading>
        <Text className="text-ui-fg-subtle">
          {t(
            "products.gpsr.description",
            "Wprowadź informacje zgodne z Ogólnym Rozporządzeniem o Bezpieczeństwie Produktów (GPSR) dla tego produktu."
          )}
        </Text>
      </div>

      {/* Producer Information - Required */}
      <div className="border-b pb-4 ">
        <Heading level="h3" className="mb-2">{t("products.gpsr.producer.section", "Dane Producenta")}</Heading>
        
        <Form.Field
          control={control}
          name="metadata.gpsr_producer_name"
          render={({ field }) => (
            <Form.Item>
              <Form.Label>
                {t("products.gpsr.producer.name.label", "Nazwa Producenta")} *
              </Form.Label>
              <Form.Hint>
                {t(
                  "products.gpsr.producer.name.description",
                  "Pełna nazwa firmy producenta."
                )}
              </Form.Hint>
              <Form.Control>
                <Input {...field} placeholder={t("products.gpsr.producer.name.placeholder", "np. Firma XYZ Sp. z o.o.")} />
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
                {t("products.gpsr.producer.address.label", "Adres Producenta")} *
              </Form.Label>
              <Form.Hint>
                {t(
                  "products.gpsr.producer.address.description",
                  "Pełny adres siedziby producenta."
                )}
              </Form.Hint>
              <Form.Control>
                <Textarea 
                  {...field} 
                  placeholder={t("products.gpsr.producer.address.placeholder", "np. ul. Przykładowa 123, 00-001 Warszawa, Polska")}
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
                {t("products.gpsr.producer.contact.label", "Kontakt do Producenta")} *
              </Form.Label>
              <Form.Hint>
                {t(
                  "products.gpsr.producer.contact.description",
                  "Email lub numer telefonu do kontaktu z producentem."
                )}
              </Form.Hint>
              <Form.Control>
                <Input 
                  {...field} 
                  placeholder={t("products.gpsr.producer.contact.placeholder", "np. kontakt@firma.pl lub +48 123 456 789")}
                />
              </Form.Control>
              <Form.ErrorMessage />
            </Form.Item>
          )}
        />
      </div>

      {/* Importer Information - Optional */}
      <div className="border-b pb-4">
        <Heading level="h3" className="mb-2 ">{t("products.gpsr.importer.section", "Dane Importera (jeśli producent spoza UE)")}</Heading>
        
        <Form.Field
          control={control}
          name="metadata.gpsr_importer_name"
          render={({ field }) => (
            <Form.Item>
              <Form.Label>
                {t("products.gpsr.importer.name.label", "Nazwa Importera")}
              </Form.Label>
              <Form.Hint>
                {t(
                  "products.gpsr.importer.name.description",
                  "Pełna nazwa firmy importera (wymagane tylko jeśli producent jest spoza UE)."
                )}
              </Form.Hint>
              <Form.Control>
                <Input {...field} placeholder={t("products.gpsr.importer.name.placeholder", "np. Import EU Sp. z o.o.")} />
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
                {t("products.gpsr.importer.address.label", "Adres Importera")}
              </Form.Label>
              <Form.Hint>
                {t(
                  "products.gpsr.importer.address.description",
                  "Pełny adres siedziby importera (wymagane tylko jeśli producent jest spoza UE)."
                )}
              </Form.Hint>
              <Form.Control>
                <Textarea 
                  {...field} 
                  placeholder={t("products.gpsr.importer.address.placeholder", "np. ul. Importowa 456, 00-002 Kraków, Polska")}
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
                {t("products.gpsr.importer.contact.label", "Kontakt do Importera")}
              </Form.Label>
              <Form.Hint>
                {t(
                  "products.gpsr.importer.contact.description",
                  "Email lub numer telefonu do kontaktu z importerem (wymagane tylko jeśli producent jest spoza UE)."
                )}
              </Form.Hint>
              <Form.Control>
                <Input 
                  {...field} 
                  placeholder={t("products.gpsr.importer.contact.placeholder", "np. import@firma.eu lub +48 987 654 321")}
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
              {t("products.gpsr.instructions.label", "Instrukcje / Ostrzeżenia")} *
            </Form.Label>
            <Form.Hint>
              {t(
                "products.gpsr.instructions.description",
                "Wszelkie instrukcje, ostrzeżenia lub środki ostrożności, które należy podjąć podczas korzystania z tego produktu."
              )}
            </Form.Hint>
            <Form.Control>
              <Textarea 
                {...field} 
                placeholder={t("products.gpsr.instructions.placeholder", "np. Przechowywać z dala od dzieci poniżej 3 lat. Produkt zawiera małe elementy.")}
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
            <Form.Label>
              {t("products.gpsr.certificates.label", "Certyfikaty")}
            </Form.Label>
            <Form.Hint>
              {t(
                "products.gpsr.certificates.description",
                "Numery referencyjne certyfikatów zgodności dla tego produktu, jeśli dotyczy."
              )}
            </Form.Hint>
            <Form.Control>
              <Input 
                {...field} 
                placeholder={t("products.gpsr.certificates.placeholder", "np. CE-12345-2023, ISO-9001")}
              />
            </Form.Control>
            <Form.ErrorMessage />
          </Form.Item>
        )}
      />
    </div>
  )
}
