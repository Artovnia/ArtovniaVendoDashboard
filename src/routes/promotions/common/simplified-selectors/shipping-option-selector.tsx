import { Checkbox, Select, Text } from '@medusajs/ui'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useShippingOptions } from '../../../../hooks/api/shipping-options'
import { useShippingProfiles } from '../../../../hooks/api/shipping-profiles'
import { translateShippingProfileKey } from '../../../../lib/shipping-profile-i18n'

type ShippingOptionWithProfile = {
  id?: string | null
  name?: string | null
  shipping_profile_id?: string | null
  shipping_profile?: {
    id?: string | null
    name?: string | null
  } | null
}

type ShippingOptionSelectorProps = {
  selectedShippingOptionIds: string[]
  onChange: (shippingOptionIds: string[]) => void
  disabled?: boolean
}

const isCustomerShippingValue = (value?: string | null) => {
  if (!value) {
    return false
  }

  const normalized = value.toLowerCase()
  return normalized.includes('customer-shipping') || normalized.includes('customer_shipping')
}

const toSafeString = (value?: string | null) => value || ''

export const ShippingOptionSelector = memo(({
  selectedShippingOptionIds,
  onChange,
  disabled = false
}: ShippingOptionSelectorProps) => {
  const { t } = useTranslation()
  const [selectedProfileId, setSelectedProfileId] = useState<string>('all')

  const translateShippingNameValue = (rawValue: string): string => {
    const lastSegment = rawValue.includes(':')
      ? rawValue.split(':').pop() || rawValue
      : rawValue

    const translatedName = String(translateShippingProfileKey(lastSegment, false, t))

    if (translatedName !== lastSegment) {
      return translatedName
    }

    return String(translateShippingProfileKey(lastSegment, true, t))
  }

  const getShippingProfileId = (option: ShippingOptionWithProfile) => {
    return option.shipping_profile_id || option.shipping_profile?.id || null
  }

  const getShippingProfileName = (
    option: ShippingOptionWithProfile,
    shippingProfileId: string
  ) => {
    const rawProfileName =
      shippingProfileNameById.get(shippingProfileId) ||
      option.shipping_profile?.name ||
      shippingProfileId

    return translateShippingNameValue(rawProfileName)
  }

  const { shipping_options = [], isLoading } = useShippingOptions({
    limit: 999,
    fields: 'id,name,shipping_profile_id,+shipping_profile.id,+shipping_profile.name'
  })

  const { shipping_profiles = [] } = useShippingProfiles({
    limit: 999,
    fields: 'id,name'
  })

  const shippingProfileNameById = useMemo(() => {
    const map = new Map<string, string>()

    for (const profile of shipping_profiles || []) {
      if (!profile?.id) {
        continue
      }

      map.set(profile.id, profile.name || profile.id)
    }

    return map
  }, [shipping_profiles])

  const selectedSet = useMemo(
    () => new Set(selectedShippingOptionIds),
    [selectedShippingOptionIds]
  )

  const promotionEligibleShippingOptions = useMemo(() => {
    return (shipping_options || [])
      .filter((option) => !!option?.id)
      .filter((option) => {
        const optionWithProfile = option as ShippingOptionWithProfile
        const profileId = getShippingProfileId(optionWithProfile)
        const profileName = profileId
          ? shippingProfileNameById.get(profileId) || optionWithProfile.shipping_profile?.name || ''
          : optionWithProfile.shipping_profile?.name || ''

        return !(
          isCustomerShippingValue(profileId) ||
          isCustomerShippingValue(profileName) ||
          isCustomerShippingValue(optionWithProfile.name || null)
        )
      })
      .map((option) => option as ShippingOptionWithProfile)
  }, [shipping_options, shippingProfileNameById])

  useEffect(() => {
    if (!selectedShippingOptionIds.length) {
      return
    }

    const eligibleIdSet = new Set(
      promotionEligibleShippingOptions
        .map((option) => option.id)
        .filter((id): id is string => typeof id === 'string' && id.length > 0)
    )
    const sanitizedSelection = selectedShippingOptionIds.filter((id) => eligibleIdSet.has(id))

    if (sanitizedSelection.length !== selectedShippingOptionIds.length) {
      onChange(sanitizedSelection)
    }
  }, [onChange, promotionEligibleShippingOptions, selectedShippingOptionIds])

  const profileOptions = useMemo(() => {
    const options = new Map<string, string>()

    for (const option of promotionEligibleShippingOptions) {
      const profileId = getShippingProfileId(option)

      if (!profileId) {
        continue
      }

      const profileName = getShippingProfileName(option, profileId)
      options.set(profileId, profileName)
    }

    return Array.from(options.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'pl', { sensitivity: 'base' }))
  }, [promotionEligibleShippingOptions, shippingProfileNameById, t])

  const sortedAndFilteredShippingOptions = useMemo(() => {
    return promotionEligibleShippingOptions
      .filter((option) => {
        if (selectedProfileId === 'all') {
          return true
        }

        return getShippingProfileId(option) === selectedProfileId
      })
      .sort((a, b) => {
        const profileIdA = getShippingProfileId(a)
        const profileIdB = getShippingProfileId(b)

        const profileNameA: string = profileIdA
          ? getShippingProfileName(a, profileIdA)
          : String(t('promotions.fields.withoutProfile', { defaultValue: 'Bez profilu' }))
        const profileNameB: string = profileIdB
          ? getShippingProfileName(b, profileIdB)
          : String(t('promotions.fields.withoutProfile', { defaultValue: 'Bez profilu' }))

        const profileCompare = profileNameA.localeCompare(profileNameB, 'pl', {
          sensitivity: 'base',
        })

        if (profileCompare !== 0) {
          return profileCompare
        }

        const optionNameA = translateShippingNameValue(toSafeString(a.name || a.id))
        const optionNameB = translateShippingNameValue(toSafeString(b.name || b.id))

        return optionNameA.localeCompare(optionNameB, 'pl', { sensitivity: 'base' })
      })
  }, [promotionEligibleShippingOptions, selectedProfileId, shippingProfileNameById, t])

  const handleToggle = useCallback(
    (shippingOptionId: string) => {
      if (selectedSet.has(shippingOptionId)) {
        onChange(selectedShippingOptionIds.filter((id) => id !== shippingOptionId))
      } else {
        onChange([...selectedShippingOptionIds, shippingOptionId])
      }
    },
    [onChange, selectedSet, selectedShippingOptionIds]
  )

  return (
    <div className="flex flex-col gap-3">
      <Text size="small" weight="plus">
        {t('promotions.fields.selectShippingMethods')} ({selectedShippingOptionIds.length}{' '}
        {t('promotions.fields.selected')})
      </Text>

      <div className="w-full max-w-xs">
        <Select value={selectedProfileId} onValueChange={setSelectedProfileId}>
          <Select.Trigger>
            <Select.Value
              placeholder={t('promotions.fields.filterByProfile', {
                defaultValue: 'Filtruj po profilu',
              })}
            />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="all">
              {t('promotions.fields.allProfiles', { defaultValue: 'Wszystkie profile' })}
            </Select.Item>
            {profileOptions.map((profile) => (
              <Select.Item key={profile.id} value={profile.id}>
                {profile.name}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
      </div>

      {isLoading ? (
        <div className="rounded-md border border-ui-border-base px-3 py-6">
          <Text size="small" className="text-ui-fg-subtle">
            Loading...
          </Text>
        </div>
      ) : (
        <div className="rounded-md border border-ui-border-base overflow-hidden">
          {sortedAndFilteredShippingOptions.length > 0 ? (
            <div className="flex flex-col divide-y divide-ui-border-base">
              {sortedAndFilteredShippingOptions.map((option) => {
                  const optionId = option.id

                  if (!optionId) {
                    return null
                  }

                  const shippingProfileId = getShippingProfileId(option)
                  const shippingProfileName = shippingProfileId
                    ? getShippingProfileName(option, shippingProfileId)
                    : null
                  const translatedOptionName = translateShippingNameValue(
                    toSafeString(option.name || option.id)
                  )

                  return (
                    <label
                      key={optionId}
                    className="flex items-center gap-3 px-3 py-2.5 bg-ui-bg-base hover:bg-ui-bg-subtle-hover transition-colors"
                    >
                      <Checkbox
                        checked={selectedSet.has(optionId)}
                        onCheckedChange={() => handleToggle(optionId)}
                        disabled={disabled}
                      />
                      <Text size="small" weight="plus" className="truncate">
                        {translatedOptionName}
                        {shippingProfileName ? ` - ${shippingProfileName}` : ''}
                      </Text>
                    </label>
                  )
              })}
            </div>
          ) : (
            <div className="px-3 py-6">
              <Text size="small" className="text-ui-fg-subtle">
                {selectedProfileId === 'all'
                  ? t('promotions.fields.noShippingMethods')
                  : t('promotions.fields.noShippingMethodsForProfile', {
                      defaultValue: 'Brak metod wysyłki dla wybranego profilu',
                    })}
              </Text>
            </div>
          )}
        </div>
      )}
    </div>
  )
})
