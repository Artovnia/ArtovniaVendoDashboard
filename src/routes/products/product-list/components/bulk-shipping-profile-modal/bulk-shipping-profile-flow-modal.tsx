import { Button, Heading, Text } from "@medusajs/ui"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

import { Form } from "../../../../../components/common/form"
import { ShippingProfileCombobox } from "../../../../../components/inputs/shipping-profile-combobox"
import { RouteFocusModal } from "../../../../../components/modals"
import { BulkShippingProfileAssignmentModal } from "./bulk-shipping-profile-assignment-modal"

type BulkShippingProfileFlowModalProps = {
  onClose: () => void
}

const BulkShippingProfileSchema = z.object({
  shipping_profile_id: z.string().min(1, "Please select a shipping profile"),
})

export const BulkShippingProfileFlowModal = ({
  onClose,
}: BulkShippingProfileFlowModalProps) => {
  const { t } = useTranslation()
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null)

  const form = useForm({
    defaultValues: {
      shipping_profile_id: "",
    },
    resolver: zodResolver(BulkShippingProfileSchema),
  })

  const handleSubmit = form.handleSubmit(async (data) => {
    setSelectedProfileId(data.shipping_profile_id)
  })

  // If profile is selected, show product selection modal
  if (selectedProfileId) {
    return (
      <BulkShippingProfileAssignmentModal
        onClose={onClose}
        selectedShippingProfileId={selectedProfileId}
      />
    )
  }

  // First step: Select shipping profile
  return (
    <RouteFocusModal>
      <RouteFocusModal.Header>
        <div className="flex flex-col gap-y-1">
          <Heading level="h2">
            {t("products.bulk.assignShippingProfile")}
          </Heading>
          <Text size="small" className="text-ui-fg-subtle">
            {t("products.bulk.selectProfileFirst")}
          </Text>
        </div>
      </RouteFocusModal.Header>
      
      <RouteFocusModal.Body className="flex flex-col gap-y-6 p-6">
        <Form {...form}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-y-6">
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
                        showValidationBadges={true}
                        showWarningMessages={true}
                      />
                    </Form.Control>
                    <Form.Hint>
                      {t("products.bulk.selectProfileToAssign")}
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
          <Button size="small" variant="secondary" onClick={onClose}>
            {t("actions.cancel")}
          </Button>
          <Button
            size="small"
            variant="primary"
            onClick={handleSubmit}
          >
            {t("actions.continue")}
          </Button>
        </div>
      </RouteFocusModal.Footer>
    </RouteFocusModal>
  )
}
