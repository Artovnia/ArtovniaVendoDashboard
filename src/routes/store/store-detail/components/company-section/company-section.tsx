import { Container, Heading, Text } from "@medusajs/ui"
import { StoreVendor } from "../../../../../types/user"
import { ActionMenu } from "../../../../../components/common/action-menu"
import { Pencil } from "@medusajs/icons"

export const CompanySection = ({ seller }: { seller: StoreVendor }) => {
  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading>Informacje o firmie</Heading>
          <Text size="small" className="text-ui-fg-subtle text-pretty">
            Zaktualizuj informacje o firmie
          </Text>
        </div>
        <ActionMenu
          groups={[
            {
              actions: [
                {
                  icon: <Pencil />,
                  label: "Edytuj",
                  to: "edit-company",
                },
              ],
            },
          ]}
        />
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          Adres
        </Text>
        <Text size="small" leading="compact">
          {seller.address_line || "-"}
        </Text>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          Kod pocztowy
        </Text>
        <Text size="small" leading="compact">
          {seller.postal_code || "-"}
        </Text>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          Miejscowość
        </Text>
        <Text size="small" leading="compact">
          {seller.city || "-"}
        </Text>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          Kraj
        </Text>
        <Text size="small" leading="compact">
          {seller.country_code || "-"}
        </Text>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          NIP
        </Text>
        <Text size="small" leading="compact">
          {seller.tax_id || "-"}
        </Text>
      </div>
    </Container>
  )
}