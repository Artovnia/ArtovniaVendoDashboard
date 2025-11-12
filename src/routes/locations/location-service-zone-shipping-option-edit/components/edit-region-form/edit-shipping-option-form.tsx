// C:\repo\mercur\vendor-panel\src\routes\locations\location-service-zone-shipping-option-edit\components\edit-region-form\edit-shipping-option-form.tsx
import { zodResolver } from "@hookform/resolvers/zod"
import { HttpTypes } from "@medusajs/types"
import { Button, Divider, RadioGroup, Select, toast } from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import * as zod from "zod"

import { Form } from "../../../../../components/common/form"
import { SwitchBox } from "../../../../../components/common/switch-box"
import { Combobox } from "../../../../../components/inputs/combobox"
import { RouteDrawer, useRouteModal } from "../../../../../components/modals"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import { useUpdateShippingOptions } from "../../../../../hooks/api/shipping-options"
import { useShippingProfiles } from "../../../../../hooks/api/shipping-profiles"
import { isOptionEnabledInStore } from "../../../../../lib/shipping-options"
import { translateShippingProfileKey } from "../../../../../lib/shipping-profile-i18n"
import {
  FulfillmentSetType,
  ShippingOptionPriceType,
} from "../../../common/constants"

type EditShippingOptionFormProps = {
  locationId: string
  shippingOption: HttpTypes.AdminShippingOption
  type: FulfillmentSetType
}

const EditShippingOptionSchema = zod.object({
  name: zod.string().min(1, { message: "Name is required" }),
  price_type: zod.nativeEnum(ShippingOptionPriceType, { errorMap: () => ({ message: "Price type is required" }) }),
  enabled_in_store: zod.boolean(),
  shipping_profile_id: zod.string().min(1, { message: "Shipping profile is required" }),
})

export const EditShippingOptionForm = ({
  locationId,
  shippingOption,
  type,
}: EditShippingOptionFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const isPickup = type === FulfillmentSetType.Pickup
  
  // Determine if this is a return option by checking the rules
  const isReturn = shippingOption.rules?.some(
    rule => rule.attribute === "is_return" && rule.value === "true"
  ) || false

  const { shipping_profiles = [], isLoading: isLoadingProfiles } = useShippingProfiles()
  
  const shippingProfileOptions = (shipping_profiles || []).map(profile => ({
    label: translateShippingProfileKey(profile.name, false, t),
    value: profile.id,
  }))

  const isEnabled = Boolean(isOptionEnabledInStore(shippingOption))
  
  const form = useForm<zod.infer<typeof EditShippingOptionSchema>>({
    defaultValues: {
      name: shippingOption.name,
      price_type: shippingOption.price_type as ShippingOptionPriceType,
      enabled_in_store: isEnabled,
      shipping_profile_id: shippingOption.shipping_profile_id,
    },
    resolver: zodResolver(EditShippingOptionSchema),
  })

  const { mutateAsync, isPending: isLoading } = useUpdateShippingOptions(
    shippingOption.id
  )

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      const existingRules = shippingOption.rules || []
      
      // Build new rules array, preserving all existing rules except enabled_in_store
      // Filter out rules with null values and don't include the id field
      const preservedRules = existingRules
        .filter(rule => rule.attribute !== "enabled_in_store" && rule.value !== null)
        .map(rule => ({
          attribute: rule.attribute,
          operator: rule.operator,
          value: rule.value as string | string[], // Safe cast since we filtered out null values
        }))
      
      // Add the updated enabled_in_store rule
      const updatedRules: (HttpTypes.AdminUpdateShippingOptionRule | HttpTypes.AdminCreateShippingOptionRule)[] = [
        ...preservedRules,
        {
          attribute: "enabled_in_store",
          operator: "eq" as const,
          value: values.enabled_in_store ? "true" : "false"
        }
      ]
      
      await mutateAsync({
        name: values.name,
        shipping_profile_id: values.shipping_profile_id,
        rules: updatedRules,
      })
      
      toast.success(
        t("stockLocations.shippingOptions.edit.successToast", {
          name: values.name,
        })
      )
      handleSuccess(`/settings/locations/${locationId}`)
      
    } catch (error) {
      console.error("Update failed:", error)
      
      // Better error handling
      let errorMessage = "Failed to update shipping option"
      if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = (error as any).message
      } else if (error && typeof error === 'string') {
        errorMessage = error
      }
      
      toast.error(errorMessage)
    }
  })

  return (
    <RouteDrawer.Form form={form}>
      <KeyboundForm onSubmit={handleSubmit} className="flex flex-1 flex-col">
        <RouteDrawer.Body>
          <div className="flex flex-col gap-y-8">
            <div className="flex flex-col gap-y-8">
              {!isPickup && (
                <Form.Field
                  control={form.control}
                  name="price_type"
                  render={({ field }) => {
                    return (
                      <Form.Item>
                        <Form.Label>
                          {t(
                            "stockLocations.shippingOptions.fields.priceType.label"
                          )}
                        </Form.Label>
                        <Form.Control>
                          <RadioGroup {...field} onValueChange={field.onChange}>
                            <RadioGroup.ChoiceBox
                              className="flex-1"
                              value={ShippingOptionPriceType.FlatRate}
                              label={t(
                                "stockLocations.shippingOptions.fields.priceType.options.fixed.label"
                              )}
                              description={t(
                                "stockLocations.shippingOptions.fields.priceType.options.fixed.hint"
                              )}
                            />
                            <RadioGroup.ChoiceBox
                              className="flex-1"
                              value={ShippingOptionPriceType.Calculated}
                              label={t(
                                "stockLocations.shippingOptions.fields.priceType.options.calculated.label"
                              )}
                              description={t(
                                "stockLocations.shippingOptions.fields.priceType.options.calculated.hint"
                              )}
                            />
                          </RadioGroup>
                        </Form.Control>
                        <Form.ErrorMessage />
                      </Form.Item>
                    )
                  }}
                />
              )}

              <div className="grid gap-y-4">
                <Form.Field
                  control={form.control}
                  name="name"
                  render={({ field }) => {
                    return (
                      <Form.Item>
                        <Form.Label>
                          {t(isReturn
                            ? 'stockLocations.shippingOptions.fields.name.label'
                            : 'fields.name'
                          )}
                        </Form.Label>
                        <Form.Control>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <Select.Trigger>
                              <Select.Value />
                            </Select.Trigger>
                            <Select.Content>
                              {isReturn ? (
                                <Select.Item value="customer-shipping">
                                  {t('stockLocations.shippingOptions.fields.name.shippingByCustomer')}
                                </Select.Item>
                              ) : (
                                <>
                                  <Select.Item value="Inpost Kurier">
                                    {t('stockLocations.shippingOptions.fields.name.carriers.inpostKurier')}
                                  </Select.Item>
                                  <Select.Item value="Inpost paczkomat">
                                    {t('stockLocations.shippingOptions.fields.name.carriers.inpostPaczkomat')}
                                  </Select.Item>
                                  <Select.Item value="DHL">
                                    {t('stockLocations.shippingOptions.fields.name.carriers.dhl')}
                                  </Select.Item>
                                  <Select.Item value="Fedex">
                                    {t('stockLocations.shippingOptions.fields.name.carriers.fedex')}
                                  </Select.Item>
                                  <Select.Item value="DPD">
                                    {t('stockLocations.shippingOptions.fields.name.carriers.dpd')}
                                  </Select.Item>
                                  <Select.Item value="GLS">
                                    {t('stockLocations.shippingOptions.fields.name.carriers.gls')}
                                  </Select.Item>
                                  <Select.Item value="UPS">
                                    {t('stockLocations.shippingOptions.fields.name.carriers.ups')}
                                  </Select.Item>
                                </>
                              )}
                            </Select.Content>
                          </Select>
                        </Form.Control>
                        <Form.ErrorMessage />
                      </Form.Item>
                    )
                  }}
                />

                <Form.Field
                  control={form.control}
                  name="shipping_profile_id"
                  render={({ field }) => {
                    return (
                      <Form.Item>
                        <Form.Label>
                          {t("stockLocations.shippingOptions.fields.profile")}
                        </Form.Label>
                        <Form.Control>
                          <Combobox
                            {...field}
                            options={shippingProfileOptions}
                            disabled={isLoadingProfiles}
                            placeholder="Select shipping profile"
                          />
                        </Form.Control>
                        <Form.ErrorMessage />
                      </Form.Item>
                    )
                  }}
                />
              </div>

              <Divider />
              <SwitchBox
                control={form.control}
                name="enabled_in_store"
                label={t(
                  "stockLocations.shippingOptions.fields.enableInStore.label"
                )}
                description={t(
                  "stockLocations.shippingOptions.fields.enableInStore.hint"
                )}
              />
            </div>
          </div>
        </RouteDrawer.Body>
        <RouteDrawer.Footer>
          <div className="flex items-center gap-x-2">
            <RouteDrawer.Close asChild>
              <Button size="small" variant="secondary">
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button size="small" type="submit" isLoading={isLoading}>
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}