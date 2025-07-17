// C:\repo\mercur\vendor-panel\src\routes\locations\location-service-zone-shipping-option-edit\location-service-zone-shipping-option-edit.tsx
import { Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { json, useParams } from "react-router-dom"

import { RouteDrawer } from "../../../components/modals"
import { useShippingOption } from "../../../hooks/api/shipping-options"
import { EditShippingOptionForm } from "./components/edit-region-form"
import { FulfillmentSetType } from "../common/constants"

export const LocationServiceZoneShippingOptionEdit = () => {
  const { t } = useTranslation()

  const { location_id, so_id } = useParams()

  if (!so_id) {
    throw json(
      { message: "Shipping option ID is required" },
      400
    )
  }

  // Load the shipping option with all necessary fields including rules
  const { shipping_option, isPending, isFetching, isError, error } =
    useShippingOption(so_id, {
      fields: [
        "id",
        "name",
        "provider_id",
        "service_zone_id",
        "price_type",
        "type",
        "shipping_profile_id",
        "data",
        "metadata",
        "rules",
        "rules.id",
        "rules.attribute",
        "rules.operator",
        "rules.value",
        "service_zone.fulfillment_set.type"
      ].join(",")
    })

  if (!isPending && !isFetching && !shipping_option) {
    throw json(
      { message: `Shipping option with ID ${so_id} was not found` },
      404
    )
  }

  if (isError) {
    throw error
  }

  const isPickup =
    shipping_option?.service_zone?.fulfillment_set?.type ===
    FulfillmentSetType.Pickup

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <Heading>
          {t(
            `stockLocations.${isPickup ? "pickupOptions" : "shippingOptions"}.edit.header`
          )}
        </Heading>
      </RouteDrawer.Header>
      {shipping_option && (
        <EditShippingOptionForm
          shippingOption={shipping_option}
          locationId={location_id!}
          type={
            shipping_option.service_zone?.fulfillment_set?.type as FulfillmentSetType
          }
        />
      )}
    </RouteDrawer>
  )
}