/**
 * Batch Shipping Setup Page
 * 
 * One-click shipping configuration for vendors
 */

import { Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { BatchShippingSetupForm } from "./components"

export const BatchShippingSetup = () => {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-y-2">
      <div>
        <Heading level="h1">{t("shipping.batch_setup.page_title")}</Heading>
        <p className="text-ui-fg-subtle text-sm mt-1">
          {t("shipping.batch_setup.page_description")}
        </p>
      </div>

      <BatchShippingSetupForm />
    </div>
  )
}
