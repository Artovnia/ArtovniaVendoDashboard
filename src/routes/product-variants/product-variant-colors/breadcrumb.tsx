import { useTranslation } from "react-i18next"

// Make sure this component always uses hooks in the same order
export const ProductVariantColorsBreadcrumb = () => {
  // Always call useTranslation first, unconditionally
  const { t } = useTranslation()
  
  // Return the breadcrumb text
  return <span>{t("products.variant.colors.breadcrumb", "Edit Variant Colors")}</span>
}
