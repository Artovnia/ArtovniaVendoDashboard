import { Trash } from "@medusajs/icons"
import { AdminShippingProfileResponse } from "@medusajs/types"
import { toast, usePrompt } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useState } from "react"

import { ActionMenu } from "../../../../../components/common/action-menu"
import { useDeleteShippingProfile } from "../../../../../hooks/api/shipping-profiles"

export const ShippingOptionsRowActions = ({
  profile,
}: {
  profile: AdminShippingProfileResponse["shipping_profile"]
}) => {
  const { t } = useTranslation()
  const prompt = usePrompt()
  const [isDeleting, setIsDeleting] = useState(false)

  const { mutateAsync } = useDeleteShippingProfile(profile.id)

  const handleDelete = async () => {
    if (isDeleting) return
    
    setIsDeleting(true)
    
    try {
      // STEP 1: Fetch linked products and shipping options count

      let linkedProductsCount = 0
      let shippingOptionsCount = 0
      
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000'}/vendor/shipping-profiles/${profile.id}/linked-products`,
          {
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )
        
        if (response.ok) {
          const data = await response.json()
          linkedProductsCount = data.count || 0
          shippingOptionsCount = data.shipping_options_count || 0
         
        } else {
          console.error('Failed to fetch linked products:', response.statusText)
        }
      } catch (fetchError) {
        console.error('Error fetching linked products:', fetchError)
        // Continue with deletion even if fetch fails
      }

      // STEP 2: Build warning message based on shipping options
      // NOTE: Product count is not reliable due to MikroORM limitations
      let warningMessage = ''
      
      if (shippingOptionsCount > 0) {
        // Show warning about shipping options
        const countPlural = shippingOptionsCount === 1 ? t('shippingProfile.delete.optionSingular') : t('shippingProfile.delete.optionPlural')
        warningMessage = t('shippingProfile.delete.warningWithShippingOptions', {
          count: shippingOptionsCount,
          count_plural: countPlural
        })
      }
      
      // Add base description
      const fullDescription = warningMessage 
        ? `${warningMessage}\n\n${t('shippingProfile.delete.description', { name: profile.name })}`
        : t('shippingProfile.delete.description', { name: profile.name })

      const res = await prompt({
        title: t('shippingProfile.delete.title'),
        description: fullDescription,
        verificationText: profile.name,
        verificationInstruction: t('shippingProfile.delete.confirmText', { name: profile.name }),
        confirmText: t('shippingProfile.deleteAction'),
        cancelText: t('shippingProfile.cancelAction'),
      })

      if (!res) {
        setIsDeleting(false)
        return
      }

      // STEP 3: Delete the profile (backend will unlink products automatically)
      
      await mutateAsync(undefined, {
        onSuccess: () => {
          toast.success(
            t('shippingProfile.delete.successToast', {
              name: profile.name,
            })
          )
          
        },
        onError: (error) => {
          console.error(`❌ Error deleting shipping profile:`, error)
          toast.error(
            t('shippingProfile.delete.errorToast', {
              error: error.message || t('shippingProfile.create.unexpectedError')
            })
          )
        },
      })
    } catch (error) {
      console.error('Unexpected error during deletion:', error)
      toast.error('Wystąpił nieoczekiwany błąd podczas usuwania profilu')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
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
  )
}
