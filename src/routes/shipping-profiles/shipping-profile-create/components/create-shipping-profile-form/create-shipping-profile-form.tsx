import { zodResolver } from "@hookform/resolvers/zod"
import { Button, Heading, Input, Select, Text, toast, Switch } from "@medusajs/ui"
import { useForm, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import * as zod from "zod"
import { useState, useEffect } from "react"

import { Form } from "../../../../../components/common/form"
import {
  RouteFocusModal,
  useRouteModal,
} from "../../../../../components/modals"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import { useCreateShippingProfile } from "../../../../../hooks/api/shipping-profiles"
import { translateShippingProfileKey } from "../../../../../lib/shipping-profile-i18n"

const CreateShippingOptionsSchema = zod.object({
  name: zod.string().min(1, "Name is required"),
  type: zod.string().min(1, "Type is required"),
  isCustom: zod.boolean().optional(),
})

// Define shipping profile categories and options using unified keys
// These keys are language-independent and will be translated via i18n
type ShippingProfileOptionsType = {
  [key: string]: string[];
};

// Unified shipping profile structure (language-independent keys)
const shippingProfileOptions: ShippingProfileOptionsType = {
  "letters_postal": [
    "regular_letter",
    "registered_letter",
    "document_shipment"
  ],
  "standard_parcels": [
    "mini_parcel",
    "small_parcel",
    "medium_parcel",
    "large_parcel",
  ],
  "nonstandard_parcels": [
    "irregular_shape",
    "protruding_elements",
    "fragile_breakable",
    "additional_protection"
  ],
  "oversized_items": [
    "furniture",
    "appliances_electronics",
    "bicycles_scooters_strollers",
    "delivery_inside"
  ],
  "pallets_heavy": [
    "euro_pallet",
    "industrial_pallet",
    "nonstandard_pallet",
    "semiheavy_pallet",
    "stacked_wrapped_pallet"
  ],
  "specialized_transport": [
    "furniture_assembly",
    "adr_dangerous",
    "refrigerated_goods",
    "medical_laboratory",
    "air_cargo",
    "sea_container",
    "machinery_vehicles"
  ],
};

export function CreateShippingProfileForm() {
  const { t, i18n } = useTranslation()
  const { handleSuccess } = useRouteModal()
  const [availableNames, setAvailableNames] = useState<string[]>([])

  const form = useForm<zod.infer<typeof CreateShippingOptionsSchema>>({
    defaultValues: {
      name: "",
      type: "",
      isCustom: false,
    },
    resolver: zodResolver(CreateShippingOptionsSchema),
  })

  const { mutateAsync, isPending } = useCreateShippingProfile()
  
  // Watch for changes in the selected type and custom toggle
  const selectedType = useWatch({
    control: form.control,
    name: "type"
  });
  
  const isCustom = useWatch({
    control: form.control,
    name: "isCustom"
  });
  
  // Update available names when type changes
  useEffect(() => {
    if (selectedType && shippingProfileOptions[selectedType]) {
      setAvailableNames(shippingProfileOptions[selectedType])
      
      // Reset name field if current value isn't valid for the new type
      const currentName = form.getValues("name")
      if (!shippingProfileOptions[selectedType].includes(currentName)) {
        form.setValue("name", "")
      }
    } else {
      setAvailableNames([])
    }
  }, [selectedType, form, shippingProfileOptions])
  
  // Reset fields when custom toggle changes
  useEffect(() => {
    if (isCustom) {
      form.setValue("type", "")
      form.setValue("name", "")
    }
  }, [isCustom, form])

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await mutateAsync(
        {
          name: values.name,
          type: values.type,
        },
        {
          onSuccess: (response) => {
            // Safely check if shipping_profile exists in response
            const shipping_profile = response?.shipping_profile;
            if (shipping_profile) {
              toast.success(
                t("shippingProfile.create.successToast", {
                  name: shipping_profile.name || values.name, // Fall back to form value if needed
                })
              );

              handleSuccess(
                `/settings/locations/shipping-profiles`
              );
            } else {
              // This would be strange but handle it gracefully
              console.error("Missing shipping_profile in success response:", response);
              toast.error(
                t("shippingProfile.create.errorMissingData")
              );
            }
          },
          onError: (error) => {
            // Enhanced error handling
            console.error("Error creating shipping profile:", error);
            
            // Check if error contains info about duplicate profile
            if (error?.message?.includes("already exists") || 
                error?.message?.includes("You already have")) {
              toast.error(
                t("shippingProfile.create.duplicateError", { 
                  name: values.name 
                })
              );
            } else {
              toast.error(
                error.message || 
                t("shippingProfile.create.genericError")
              );
            }
          },
        }
      );
    } catch (unexpectedError) {
      // Catch any unexpected errors that might occur
      console.error("Unexpected error in shipping profile creation:", unexpectedError);
      toast.error(
        t("shippingProfile.create.unexpectedError")
      );
    }
  })

  return (
    <RouteFocusModal.Form form={form}>
      <KeyboundForm onSubmit={handleSubmit}>
        <RouteFocusModal.Header>
          <RouteFocusModal.Title>
            {t("shippingProfile.create.header")}
          </RouteFocusModal.Title>
          <RouteFocusModal.Description>
            {t("shippingProfile.create.description")}
          </RouteFocusModal.Description>
        </RouteFocusModal.Header>
        <RouteFocusModal.Body className="flex flex-col gap-y-8 overflow-y-auto">
          <div className="flex flex-1 flex-col items-center overflow-y-auto">
            <div className="mx-auto flex w-full max-w-[720px] flex-col gap-y-8 px-2 py-16">
              <div>
                <Heading className="capitalize">
                  {t("shippingProfile.create.header")}
                </Heading>
                <Text size="small" className="text-ui-fg-subtle">
                  {t("shippingProfile.create.hint")}
                </Text>
              </div>
              {/* Custom Profile Toggle - More Prominent */}
              <Form.Field
                control={form.control}
                name="isCustom"
                render={({ field: { value, onChange, ...field } }) => {
                  return (
                    <Form.Item>
                      <div className={`rounded-lg border-2 p-4 transition-colors ${
                        value 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' 
                          : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/20'
                      }`}>
                        <div className="flex items-start gap-x-4">
                          <Form.Control>
                            <Switch
                              checked={value}
                              onCheckedChange={onChange}
                              {...field}
                              className="mt-1"
                            />
                          </Form.Control>
                          <div className="flex flex-1 flex-col gap-y-2">
                            <Form.Label className="!mt-0 text-base font-semibold">
                              {t("shippingProfile.create.customProfile")}
                            </Form.Label>
                            <Form.Hint className="!mt-0 text-sm">
                              {t("shippingProfile.create.customProfileHint")}
                            </Form.Hint>
                          </div>
                        </div>
                      </div>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )
                }}
              />

              {/* Conditional rendering based on isCustom */}
              {isCustom ? (
                // Custom profile - requires both name and type
                <div className="grid grid-cols-1 gap-4">
                  <Form.Field
                    control={form.control}
                    name="name"
                    render={({ field }) => {
                      return (
                        <Form.Item>
                          <Form.Label>{t("fields.name")}</Form.Label>
                          <Form.Control>
                            <Input
                              {...field}
                              placeholder={t("shippingProfile.create.customNamePlaceholder")}
                            />
                          </Form.Control>
                          <Form.Hint>
                            {t("shippingProfile.create.customNameHint")}
                          </Form.Hint>
                          <Form.ErrorMessage />
                        </Form.Item>
                      )
                    }}
                  />
                  <Form.Field
                    control={form.control}
                    name="type"
                    render={({ field }) => {
                      return (
                        <Form.Item>
                          <Form.Label tooltip={t("shippingProfile.tooltip.type")}>
                            {t("fields.type")}
                          </Form.Label>
                          <Form.Control>
                            <Select
                              {...field}
                              onValueChange={field.onChange}
                            >
                              <Select.Trigger>
                                <Select.Value placeholder={t("shippingProfile.create.typePlaceholder")} />
                              </Select.Trigger>
                              <Select.Content>
                                {Object.keys(shippingProfileOptions).map((typeKey) => (
                                  <Select.Item key={typeKey} value={typeKey}>
                                    {translateShippingProfileKey(typeKey, true, t)}
                                  </Select.Item>
                                ))}
                              </Select.Content>
                            </Select>
                          </Form.Control>
                          <Form.Hint>
                            {t("shippingProfile.create.customTypeHint")}
                          </Form.Hint>
                          <Form.ErrorMessage />
                        </Form.Item>
                      )
                    }}
                  />
                </div>
              ) : (
                // Standard dropdowns
                <div className="grid grid-cols-2 gap-4">
                  <Form.Field
                    control={form.control}
                    name="name"
                    render={({ field }) => {
                      return (
                        <Form.Item>
                          <Form.Label>{t("fields.name")}</Form.Label>
                          <Form.Control>
                            <Select
                              {...field}
                              onValueChange={field.onChange}
                              disabled={!selectedType}
                            >
                              <Select.Trigger>
                                <Select.Value placeholder={t("shippingProfile.create.namePlaceholder")} />
                              </Select.Trigger>
                              <Select.Content>
                                {availableNames.map((nameKey) => (
                                  <Select.Item key={nameKey} value={nameKey}>
                                    {translateShippingProfileKey(nameKey, false, t)}
                                  </Select.Item>
                                ))}
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
                    name="type"
                    render={({ field }) => {
                      return (
                        <Form.Item>
                          <Form.Label tooltip={t("shippingProfile.tooltip.type")}>
                            {t("fields.type")}
                          </Form.Label>
                          <Form.Control>
                            <Select
                              {...field}
                              onValueChange={field.onChange}
                            >
                              <Select.Trigger>
                                <Select.Value placeholder={t("shippingProfile.create.typePlaceholder")} />
                              </Select.Trigger>
                              <Select.Content>
                                {Object.keys(shippingProfileOptions).map((typeKey) => (
                                  <Select.Item key={typeKey} value={typeKey}>
                                    {translateShippingProfileKey(typeKey, true, t)}
                                  </Select.Item>
                                ))}
                              </Select.Content>
                            </Select>
                          </Form.Control>
                          <Form.ErrorMessage />
                        </Form.Item>
                      )
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </RouteFocusModal.Body>
        <RouteFocusModal.Footer>
          <div className="flex items-center justify-end gap-x-2">
            <RouteFocusModal.Close asChild>
              <Button size="small" variant="secondary">
                {t("actions.cancel")}
              </Button>
            </RouteFocusModal.Close>
            <Button type="submit" size="small" isLoading={isPending}>
              {t("actions.save")}
            </Button>
          </div>
        </RouteFocusModal.Footer>
      </KeyboundForm>
    </RouteFocusModal.Form>
  )
}
