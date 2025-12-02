import { Button, Heading, Text } from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

import { Form } from "../../../../../components/common/form"
import { ShippingProfileCombobox } from "../../../../../components/inputs/shipping-profile-combobox"
import { RouteFocusModal } from "../../../../../components/modals"

type BulkShippingProfileModalProps = {
  selectedCount: number
  onConfirm: (shippingProfileId: string | null) => void
  onCancel: () => void
}

const BulkShippingProfileSchema = z.object({
  shipping_profile_id: z.string().optional(),
})

export const BulkShippingProfileModal = ({
  selectedCount,
  onConfirm,
  onCancel,
}: BulkShippingProfileModalProps) => {
  const { t } = useTranslation()

  const form = useForm({
    defaultValues: {
      shipping_profile_id: "",
    },
    resolver: zodResolver(BulkShippingProfileSchema),
  })

  const handleSubmit = form.handleSubmit((data) => {
    const shippingProfileId = data.shipping_profile_id === "" ? null : data.shipping_profile_id
    onConfirm(shippingProfileId)
  })

  return (
    <RouteFocusModal>
      <RouteFocusModal.Header>
        <div className="flex flex-col gap-y-1">
          <Heading level="h2">
            {t("products.bulk.assignShippingProfile")}
          </Heading>
          <Text size="small" className="text-ui-fg-subtle">
            {t("products.bulk.selectProfile")}
          </Text>
        </div>
      </RouteFocusModal.Header>
      <RouteFocusModal.Body>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-y-4">
            <div className="bg-ui-bg-subtle rounded-lg p-4 mb-4">
              <Text size="small" weight="plus">
                {t("products.bulk.confirmAssign", { count: selectedCount })}
              </Text>
            </div>

            <Form.Field
              control={form.control}
              name="shipping_profile_id"
              render={({ field }) => {
                return (
                  <Form.Item>
                    <Form.Label>
                      {t("formFields.shipping_profile.label")}
                    </Form.Label>
                    <Form.Control>
                      <ShippingProfileCombobox
                        {...field}
                        allowClear
                        showValidationBadges={true}
                        showWarningMessages={true}
                      />
                    </Form.Control>
                    <Form.Hint>
                      {t("products.bulk.selectProfileHint")}
                    </Form.Hint>
                    <Form.ErrorMessage />
                  </Form.Item>
                )
              }}
            />
          </form>
        </Form>
      </RouteFocusModal.Body>
      <RouteFocusModal.Footer>
        <div className="flex items-center justify-end gap-x-2">
          <Button size="small" variant="secondary" onClick={onCancel}>
            {t("actions.cancel")}
          </Button>
          <Button
            size="small"
            variant="primary"
            onClick={handleSubmit}
          >
            {t("actions.confirm")}
          </Button>
        </div>
      </RouteFocusModal.Footer>
    </RouteFocusModal>
  )
}
