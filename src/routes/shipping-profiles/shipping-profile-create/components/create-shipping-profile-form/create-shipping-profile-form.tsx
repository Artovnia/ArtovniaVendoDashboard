import { zodResolver } from "@hookform/resolvers/zod"
import { Button, Heading, Input, Select, Text, toast } from "@medusajs/ui"
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

const CreateShippingOptionsSchema = zod.object({
  name: zod.string().min(1),
  type: zod.string().min(1),
})

// Define shipping profile categories and options
// Define a type to help with TypeScript indexing
type ShippingProfileOptionsType = {
  [key: string]: string[];
};

const shippingProfileOptions: ShippingProfileOptionsType = {
  "Listy i przesyłki pocztowe": [
    "List zwykły",
    "List polecony",
    "Przesyłka dokumentowa"
  ],
  "Paczki standardowe": [
    "Mała paczka",
    "Średnia paczka",
    "Duża paczka",
    "Paczkomaty – gabaryt A",
    "Paczkomaty – gabaryt B",
    "Paczkomaty – gabaryt C"
  ],
  "Paczki niestandardowe": [
    "Kształt nieregularny",
    "Z wystającymi elementami",
    "Delikatne lub łatwo tłukące się",
    "Z dodatkowym zabezpieczeniem"
  ],
  "Towary gabarytowe / wielkogabarytowe": [
    "Meble",
    "Sprzęt AGD/RTV",
    "Rowery, hulajnogi, wózki dziecięce",
    "Zamówienia internetowe z wniesieniem"
  ],
  "Palety (transport ciężki)": [
    "Paleta EURO",
    "Paleta przemysłowa",
    "Paleta niestandardowa",
    "Paleta półciężka",
    "Paleta piętrowana / stretchowana"
  ],
  "Transport nietypowy i specjalistyczny": [
    "Transport mebli z montażem",
    "Towary ADR (niebezpieczne)",
    "Towary chłodnicze",
    "Transport sprzętu medycznego, laboratoryjnego",
    "Przesyłki lotnicze (Air cargo)",
    "Morski kontenerowy (FCL/LCL)",
    "Maszyny, pojazdy, konstrukcje stalowe"
  ],
};

export function CreateShippingProfileForm() {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()
  const [availableNames, setAvailableNames] = useState<string[]>([])

  const form = useForm<zod.infer<typeof CreateShippingOptionsSchema>>({
    defaultValues: {
      name: "",
      type: "",
    },
    resolver: zodResolver(CreateShippingOptionsSchema),
  })

  const { mutateAsync, isPending } = useCreateShippingProfile()
  
  // Watch for changes in the selected type
  const selectedType = useWatch({
    control: form.control,
    name: "type"
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
  }, [selectedType, form])

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
                `/settings/locations/shipping-profiles/${shipping_profile.id}`
              );
            } else {
              // This would be strange but handle it gracefully
              console.error("Missing shipping_profile in success response:", response);
              toast.error(
                t("shippingProfile.create.errorMissingData", { 
                  defaultValue: "Error creating shipping profile: Missing data in response" 
                })
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
                  defaultValue: `A shipping profile named "${values.name}" already exists.`,
                  name: values.name 
                })
              );
            } else {
              toast.error(
                error.message || 
                t("shippingProfile.create.genericError", { 
                  defaultValue: "Error creating shipping profile" 
                })
              );
            }
          },
        }
      );
    } catch (unexpectedError) {
      // Catch any unexpected errors that might occur
      console.error("Unexpected error in shipping profile creation:", unexpectedError);
      toast.error(
        t("shippingProfile.create.unexpectedError", { 
          defaultValue: "An unexpected error occurred" 
        })
      );
    }
  })

  return (
    <RouteFocusModal.Form form={form}>
      <KeyboundForm onSubmit={handleSubmit}>
        <RouteFocusModal.Header>
          <RouteFocusModal.Title>
            {t("shippingProfile.create.title", { defaultValue: "Stworz profil wysyłki" })}
          </RouteFocusModal.Title>
          <RouteFocusModal.Description>
            {t("shippingProfile.create.description", { defaultValue: "Stworz nowy profil wysyłki" })}
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
                              <Select.Value placeholder="opcja transportu" />
                            </Select.Trigger>
                            <Select.Content>
                              {availableNames.map((name) => (
                                <Select.Item key={name} value={name}>{name}</Select.Item>
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
                              <Select.Value placeholder="typ transportu" />
                            </Select.Trigger>
                            <Select.Content>
                              {Object.keys(shippingProfileOptions).map((type) => (
                                <Select.Item key={type} value={type}>{type}</Select.Item>
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
