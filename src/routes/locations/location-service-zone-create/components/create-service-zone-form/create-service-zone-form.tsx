import { zodResolver } from "@hookform/resolvers/zod"
import { HttpTypes } from "@medusajs/types"
import { Button, Heading, InlineTip, Input, toast } from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { Form } from "../../../../../components/common/form"
import {
  RouteFocusModal,
  StackedFocusModal,
  useRouteModal,
} from "../../../../../components/modals"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import { useCreateFulfillmentSetServiceZone } from "../../../../../hooks/api/fulfillment-sets"
import { GeoZoneForm } from "../../../common/components/geo-zone-form"
import {
  FulfillmentSetType,
  GEO_ZONE_STACKED_MODAL_ID,
} from "../../../common/constants"

const CreateServiceZoneSchema = z.object({
  name: z.string().min(1),
  countries: z
    .array(z.object({ iso_2: z.string().min(2), display_name: z.string() }))
    .min(1),
})

type CreateServiceZoneFormProps = {
  fulfillmentSet: HttpTypes.AdminFulfillmentSet
  type: FulfillmentSetType
  location: HttpTypes.AdminStockLocation
}

export function CreateServiceZoneForm({
  fulfillmentSet,
  type,
  location,
}: CreateServiceZoneFormProps) {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const form = useForm<z.infer<typeof CreateServiceZoneSchema>>({
    defaultValues: {
      name: "",
      countries: [],
    },
    resolver: zodResolver(CreateServiceZoneSchema),
  })

  const { mutateAsync, isPending } = useCreateFulfillmentSetServiceZone(
    fulfillmentSet.id
  )

  const handleSubmit = form.handleSubmit(async (data) => {
    await mutateAsync(
      {
        name: data.name,
        geo_zones: data.countries.map(({ iso_2 }) => ({
          country_code: iso_2,
          type: "country",
        })),
      },
      {
        onSuccess: () => {
          toast.success(
            t("stockLocations.serviceZones.create.successToast", {
              name: data.name,
            })
          )

          handleSuccess(`/settings/locations/${location.id}`)
        },
        onError: (e) => {
          toast.error(e.message)
        },
      }
    )
  })

  return (
    <RouteFocusModal.Form form={form}>
      <KeyboundForm
        className="flex h-full flex-col overflow-hidden"
        onSubmit={handleSubmit}
      >
        <RouteFocusModal.Header />
        <RouteFocusModal.Body className="flex flex-1 flex-col items-center overflow-auto">
          <StackedFocusModal id={GEO_ZONE_STACKED_MODAL_ID}>
            <div className="flex flex-1 flex-col items-center">
              <div className="flex w-full max-w-[720px] flex-col gap-y-8 px-2 py-16">
                <Heading>
                  {type === FulfillmentSetType.Pickup
                    ? t("stockLocations.serviceZones.create.headerPickup", {
                        location: location.name,
                      })
                    : t("stockLocations.serviceZones.create.headerShipping", {
                        location: location.name,
                      })}
                </Heading>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Form.Field
                    control={form.control}
                    name="name"
                    render={({ field }) => {
                      return (
                        <Form.Item>
                          <Form.Label>{t("fields.name")}</Form.Label>
                          <Form.Control>
                            <Input {...field} />
                          </Form.Control>
                          <Form.ErrorMessage />
                        </Form.Item>
                      )
                    }}
                  />
                </div>

                <InlineTip label={t("general.tip")}>
                  {t("stockLocations.serviceZones.fields.tip")}
                </InlineTip>

                <GeoZoneForm form={form} />
              </div>
            </div>
            <GeoZoneForm.AreaDrawer form={form} />
          </StackedFocusModal>
        </RouteFocusModal.Body>

        <RouteFocusModal.Footer>
          <div className="flex items-center justify-end gap-x-2">
            <RouteFocusModal.Close asChild>
              <Button variant="secondary" size="small">
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