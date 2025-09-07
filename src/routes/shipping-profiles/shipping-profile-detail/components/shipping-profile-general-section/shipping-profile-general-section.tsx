import { Trash } from "@medusajs/icons"
import { Container, Heading, toast, usePrompt } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { ActionMenu } from "../../../../../components/common/action-menu"
import { SectionRow } from "../../../../../components/common/section"
import { useDeleteShippingProfile } from "../../../../../hooks/api/shipping-profiles"

/**
 * Extracts the user-friendly name from a shipping profile name with seller ID suffix
 * Format: "sel_code:Mała paczka" -> "Mała paczka"
 * @param shippingProfileName - The shipping profile name (potentially with suffix)
 * @returns The user-friendly shipping profile name
 */
const extractUserFriendlyShippingProfileName = (shippingProfileName: string): string => {
  // Handle format: "sel_code:Mała paczka"
  const colonIndex = shippingProfileName.indexOf(':')
  if (colonIndex !== -1 && shippingProfileName.startsWith('sel_')) {
    return shippingProfileName.substring(colonIndex + 1)
  }
  
  // Return original name if no pattern matches
  return shippingProfileName
}

type ShippingProfileGeneralSectionProps = {
  profile: any // Using any temporarily to handle different data structures
}

export const ShippingProfileGeneralSection = ({
  profile,
}: ShippingProfileGeneralSectionProps) => {
  console.log('Shipping profile in component:', profile);
  const { t } = useTranslation()
  const prompt = usePrompt()
  const navigate = useNavigate()

  // Extract clean profile name for display
  const cleanProfileName = extractUserFriendlyShippingProfileName(profile.name || '')

  const { mutateAsync } = useDeleteShippingProfile(profile.id)

  const handleDelete = async () => {
    const res = await prompt({
      title: t("shippingProfile.delete.title"),
      description: t("shippingProfile.delete.description", {
        name: cleanProfileName,
      }),
      verificationText: cleanProfileName,
      verificationInstruction: t("general.typeToConfirm"),
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
    })

    if (!res) {
      return
    }

    await mutateAsync(undefined, {
      onSuccess: () => {
        toast.success(
          t("shippingProfile.delete.successToast", {
            name: cleanProfileName,
          })
        )

        navigate("/settings/locations/shipping-profiles", { replace: true })
      },
      onError: (error) => {
        toast.error(error.message)
      },
    })
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading>{cleanProfileName}</Heading>
        <ActionMenu
          groups={[
            {
              actions: [
                {
                  icon: <Trash />,
                  label: t("actions.delete"),
                  onClick: handleDelete,
                },
              ],
            },
          ]}
        />
      </div>
      <SectionRow title={t("fields.type")} value={profile.type} />
    </Container>
  )
}
