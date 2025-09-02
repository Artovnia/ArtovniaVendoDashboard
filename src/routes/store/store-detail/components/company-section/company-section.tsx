import { Container, Heading, Text } from "@medusajs/ui"
import { Pencil } from "@medusajs/icons"
import { useTranslation } from "react-i18next"
import { StoreVendor } from "../../../../../types/user"
import { ActionMenu } from "../../../../../components/common/action-menu"

export const CompanySection = ({ seller }: { seller: StoreVendor }) => {
  const { t } = useTranslation()

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading>{t("store.company.title")}</Heading>
          <Text size="small" className="text-ui-fg-subtle text-pretty">
            {t("store.company.description")}
          </Text>
        </div>
        <ActionMenu
          groups={[
            {
              actions: [
                {
                  icon: <Pencil />,
                  label: t("store.company.actions.edit"),
                  to: "edit-company",
                },
              ],
            },
          ]}
        />
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          {t("store.company.fields.address")}
        </Text>
        <Text size="small" leading="compact">
          {seller.address_line || "-"}
        </Text>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          {t("store.company.fields.postalCode")}
        </Text>
        <Text size="small" leading="compact">
          {seller.postal_code || "-"}
        </Text>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          {t("store.company.fields.city")}
        </Text>
        <Text size="small" leading="compact">
          {seller.city || "-"}
        </Text>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          {t("store.company.fields.country")}
        </Text>
        <Text size="small" leading="compact">
          {seller.country_code || "-"}
        </Text>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          {t("store.company.fields.taxId")}
        </Text>
        <Text size="small" leading="compact">
          {seller.tax_id || "-"}
        </Text>
      </div>
    </Container>
  )
}