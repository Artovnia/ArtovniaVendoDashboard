import { Divider, Heading } from "@medusajs/ui"
import { UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"

import {
  FormExtensionZone,
  useDashboardExtension,
} from "../../../../../extensions"
import { ProductCreateSchemaType } from "../../types"
import { ProductCreateGeneralSection } from "./components/product-create-details-general-section"
import { ProductCreateGPSRSection } from "./components/product-create-gpsr-section-new"
import { ProductCreateMediaSection } from "./components/product-create-details-media-section"
import { ProductCreateVariantsSection } from "./components/product-create-details-variant-section"

type ProductAttributesProps = {
  form: UseFormReturn<ProductCreateSchemaType>
}

export const ProductCreateDetailsForm = ({ form }: ProductAttributesProps) => {
  const { getFormFields } = useDashboardExtension()
  const fields = getFormFields("product", "create", "general")

  return (
    <div className="flex flex-col items-center p-4 sm:p-8 md:p-16">
      <div className="flex w-full max-w-[720px] flex-col gap-y-6 sm:gap-y-8">
        <Header />
        <div className="flex flex-col gap-y-6">
          <div className="flex flex-col gap-y-8 divide-y">
            <ProductCreateGeneralSection form={form} />
            <FormExtensionZone fields={fields} form={form} />
            <div className="pt-8">
              <ProductCreateMediaSection form={form} />
            </div>
          </div>
          <Divider />
          {/* Variant creation moved above GPSR section for better UX flow */}
          <ProductCreateVariantsSection form={form} />
          <Divider />
          <ProductCreateGPSRSection form={form} />
        </div>
      </div>
    </div>
  )
}

const Header = () => {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col">
      <Heading>{t("products.create.header")}</Heading>
    </div>
  )
}
