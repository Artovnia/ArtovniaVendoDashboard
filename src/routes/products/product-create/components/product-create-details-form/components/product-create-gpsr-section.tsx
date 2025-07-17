import { Heading, Text, Input, Textarea } from "@medusajs/ui";
import { UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Form } from "../../../../../../components/common/form";
import { ProductCreateSchemaType } from "../../../types";

type ProductGPSRSectionProps = {
  form: UseFormReturn<ProductCreateSchemaType>;
};

export const ProductCreateGPSRSection = ({ form }: ProductGPSRSectionProps) => {
  const { t } = useTranslation();
  const { control } = form;

  return (
    <div className="flex flex-col gap-y-4">
      <div>
        <Heading level="h2">{t("products.gpsr.title", "GPSR Information")}</Heading>
        <Text className="text-ui-fg-subtle">
          {t(
            "products.gpsr.description",
            "General Product Safety Regulation (GPSR) information is required for product approval."
          )}
        </Text>
      </div>
      <div className="grid grid-cols-1 gap-4">
        <Form.Field
          control={control}
          name="metadata.gpsr_origin"
          render={({ field }) => (
            <Form.Item>
              <Form.Label>
                {t("products.fields.origin.label", "Country of Origin")} *
              </Form.Label>
              <Form.Hint>
                {t(
                  "products.fields.origin.description",
                  "The country where the product was manufactured or produced"
                )}
              </Form.Hint>
              <Form.Control>
                <Input
                  {...field}
                  placeholder={t(
                    "products.fields.origin.placeholder",
                    "e.g. Germany, China, United States"
                  )}
                />
              </Form.Control>
              <Form.ErrorMessage />
            </Form.Item>
          )}
        />
        <Form.Field
          control={control}
          name="metadata.gpsr_safety_warning"
          render={({ field }) => (
            <Form.Item>
              <Form.Label>
                {t("products.fields.safety_warning.label", "Safety Warning")} *
              </Form.Label>
              <Form.Hint>
                {t(
                  "products.fields.safety_warning.description",
                  "Required safety warnings and precautions for the product"
                )}
              </Form.Hint>
              <Form.Control>
                <Textarea
                  {...field}
                  rows={3}
                  placeholder={t(
                    "products.fields.safety_warning.placeholder",
                    "e.g. Keep away from children under 3 years, contains small parts"
                  )}
                />
              </Form.Control>
              <Form.ErrorMessage />
            </Form.Item>
          )}
        />
        <Form.Field
          control={control}
          name="metadata.gpsr_compliance_cert"
          render={({ field }) => (
            <Form.Item>
              <Form.Label>
                {t("products.fields.compliance_cert.label", "Compliance Certificate")}
              </Form.Label>
              <Form.Hint>
                {t(
                  "products.fields.compliance_cert.description",
                  "Optional: Product compliance certificate information"
                )}
              </Form.Hint>
              <Form.Control>
                <Textarea
                  {...field}
                  rows={2}
                  placeholder={t(
                    "products.fields.compliance_cert.placeholder",
                    "e.g. CE certification number, ISO standard"
                  )}
                />
              </Form.Control>
              <Form.ErrorMessage />
            </Form.Item>
          )}
        />
      </div>
    </div>
  );
};
