import { ExclamationCircle } from '@medusajs/icons'
import { Text } from '@medusajs/ui'
import { forwardRef, ComponentPropsWithoutRef } from 'react'
import { useTranslation } from 'react-i18next'

import { Combobox } from './combobox'
import { useShippingProfilesWithValidation } from '../../hooks/api/shipping-profile-validation'

// Define the props interface based on the Combobox component
interface ShippingProfileComboboxProps extends Omit<ComponentPropsWithoutRef<typeof Combobox>, 'options'> {
  showValidationBadges?: boolean
  showWarningMessages?: boolean
}

export const ShippingProfileCombobox = forwardRef<
  HTMLInputElement,
  ShippingProfileComboboxProps
>(({ showValidationBadges = true, showWarningMessages = true, ...props }, ref) => {
  const { t } = useTranslation()
  const { shipping_profiles, isLoading } = useShippingProfilesWithValidation()

  // Convert profiles to combobox options with validation indicators
  const options = shipping_profiles.map((profile) => {
    let label = profile.name
    
    if (showValidationBadges) {
      // Add shipping options count and validation status to label
      const optionsCount = profile.shipping_options_count || 0
      const statusIndicator = profile.isValid ? '✅' : '⚠️'
      const statusText = profile.isValid ? t('stockLocations.fulfillmentSets.shipping.profile.valid') : t('stockLocations.fulfillmentSets.shipping.profile.needsOptions')
      
   label = `${statusIndicator} ${profile.name} (${optionsCount} ${optionsCount === 1 ? 'opcja' : 'opcji'}) - ${statusText}`
    }

    return {
      label,
      value: profile.id
    }
  })

  return (
    <div className="space-y-2">
      <Combobox
        {...props}
        ref={ref}
        options={options}
        disabled={isLoading || props.disabled}
      />
      
      {showWarningMessages && props.value && (
        <ShippingProfileWarning profileId={props.value as string} />
      )}
    </div>
  )
})

ShippingProfileCombobox.displayName = 'ShippingProfileCombobox'

// Warning component for selected profile
const ShippingProfileWarning = ({ profileId }: { profileId: string }) => {
  const { t } = useTranslation()
  const { shipping_profiles } = useShippingProfilesWithValidation()
  
  const profile = shipping_profiles.find(p => p.id === profileId)
  
  if (!profile || profile.isValid) return null

  return (
    <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-md">
      <ExclamationCircle className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
      <div className="space-y-1">
        <Text size="small" className="font-medium text-orange-800">
          {t('stockLocations.fulfillmentSets.shipping.profile.warning.title')}
        </Text>
        <Text size="xsmall" className="text-orange-700">
          {profile.validationMessage}
        </Text>
        <Text size="xsmall" className="text-orange-600">
          {t('stockLocations.fulfillmentSets.shipping.profile.warning.action')}
        </Text>
      </div>
    </div>
  )
}
