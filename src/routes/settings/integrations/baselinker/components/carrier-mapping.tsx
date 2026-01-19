import { useState, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Heading, Text, Badge, toast } from '@medusajs/ui'
import { Trash } from '@medusajs/icons'
import {
  useCarrierMappings,
  useCreateCarrierMapping,
  useDeleteCarrierMapping,
  CarrierMapping,
  CommonCarrier,
  ShippingOption,
} from '../../../../../hooks/api/baselinker'

// Common tracking URL templates
const TRACKING_URL_TEMPLATES: Record<string, string> = {
  inpost: 'https://inpost.pl/sledzenie-przesylek?number={tracking_number}',
  inpost_paczkomat: 'https://inpost.pl/sledzenie-przesylek?number={tracking_number}',
  inpost_kurier: 'https://inpost.pl/sledzenie-przesylek?number={tracking_number}',
  dpd: 'https://tracktrace.dpd.com.pl/parcelDetails?p1={tracking_number}',
  dhl: 'https://www.dhl.com/pl-pl/home/tracking.html?tracking-id={tracking_number}',
  ups: 'https://www.ups.com/track?tracknum={tracking_number}',
  fedex: 'https://www.fedex.com/fedextrack/?trknbr={tracking_number}',
  poczta_polska: 'https://emonitoring.poczta-polska.pl/?numer={tracking_number}',
  gls: 'https://gls-group.eu/PL/pl/sledzenie-paczek?match={tracking_number}',
  orlen: 'https://nadaj.orlenpaczka.pl/tracking?number={tracking_number}',
}

// Helper to extract carrier name from shipping option name
// e.g., "InPost paczkomat" -> "inpost_paczkomat", "InPost Kurier" -> "inpost_kurier"
// Order matters - more specific patterns should come first
function extractCarrierFromName(name: string): { code: string; displayName: string } | null {
  const carrierPatterns = [
    // InPost - distinguish between Paczkomaty and Kurier (important for BaseLinker)
    { pattern: /inpost.*paczkomat/i, code: 'inpost_paczkomat', displayName: 'InPost Paczkomaty' },
    { pattern: /inpost.*kurier/i, code: 'inpost_kurier', displayName: 'InPost Kurier' },
    { pattern: /inpost/i, code: 'inpost', displayName: 'InPost' }, // fallback for generic InPost
    // Other carriers
    { pattern: /dpd/i, code: 'dpd', displayName: 'DPD' },
    { pattern: /dhl/i, code: 'dhl', displayName: 'DHL' },
    { pattern: /ups/i, code: 'ups', displayName: 'UPS' },
    { pattern: /fedex/i, code: 'fedex', displayName: 'FedEx' },
    { pattern: /poczta|pocztex/i, code: 'poczta_polska', displayName: 'Poczta Polska' },
    { pattern: /gls/i, code: 'gls', displayName: 'GLS' },
    { pattern: /orlen/i, code: 'orlen', displayName: 'Orlen Paczka' },
  ]
  
  for (const { pattern, code, displayName } of carrierPatterns) {
    if (pattern.test(name)) {
      return { code, displayName }
    }
  }
  return null
}

// Group shipping options by detected carrier
interface ShippingOptionGroup {
  carrierCode: string | null
  carrierName: string
  options: ShippingOption[]
}

function groupShippingOptions(options: ShippingOption[], _carriers: CommonCarrier[]): ShippingOptionGroup[] {
  const groups: Map<string, ShippingOptionGroup> = new Map()
  const otherOptions: ShippingOption[] = []
  
  for (const option of options) {
    const detected = extractCarrierFromName(option.name)
    
    if (detected) {
      if (!groups.has(detected.code)) {
        groups.set(detected.code, {
          carrierCode: detected.code,
          carrierName: detected.displayName,
          options: []
        })
      }
      groups.get(detected.code)!.options.push(option)
    } else {
      otherOptions.push(option)
    }
  }
  
  const result = Array.from(groups.values())
  
  // Add "Other" group for unrecognized carriers
  if (otherOptions.length > 0) {
    result.push({
      carrierCode: null,
      carrierName: 'Other',
      options: otherOptions
    })
  }
  
  return result.sort((a, b) => a.carrierName.localeCompare(b.carrierName))
}

interface CarrierGroupRowProps {
  group: ShippingOptionGroup
  carriers: CommonCarrier[]
  existingMappings: CarrierMapping[]
  onMapGroup: (carrierCode: string, optionIds: string[]) => void
  onDeleteGroup: (optionIds: string[]) => void
  isMapping: boolean
}

function CarrierGroupRow({ group, carriers, existingMappings, onMapGroup, onDeleteGroup, isMapping }: CarrierGroupRowProps) {
  const { t } = useTranslation()
  const [selectedCarrier, setSelectedCarrier] = useState(group.carrierCode || '')
  
  // Check which options in this group are already mapped
  const mappedOptionIds = new Set(existingMappings.map(m => m.medusa_shipping_option_id))
  const mappedOptions = group.options.filter(o => mappedOptionIds.has(o.id))
  const unmappedOptions = group.options.filter(o => !mappedOptionIds.has(o.id))
  
  const isMapped = mappedOptions.length === group.options.length
  const isPartiallyMapped = mappedOptions.length > 0 && mappedOptions.length < group.options.length
  
  // Get the carrier this group is mapped to (if any)
  const mappedCarrier = mappedOptions.length > 0 
    ? existingMappings.find(m => m.medusa_shipping_option_id === mappedOptions[0].id)?.bl_carrier_code
    : null
  
  const handleMap = () => {
    if (!selectedCarrier || unmappedOptions.length === 0) return
    onMapGroup(selectedCarrier, unmappedOptions.map(o => o.id))
  }
  
  const handleDelete = () => {
    if (mappedOptions.length === 0) return
    const confirmMsg = t('baselinker.carrierMapping.confirmDeleteGroup', {
      defaultValue: `Delete all ${mappedOptions.length} mappings for ${group.carrierName}?`
    })
    if (confirm(confirmMsg)) {
      onDeleteGroup(mappedOptions.map(o => o.id))
    }
  }

  return (
    <tr className="border-b border-ui-border-base">
      <td className="py-3 px-4">
        <div>
          <Text className="font-medium">{group.carrierName}</Text>
          <Text className="text-xs text-ui-fg-muted">
            {t('baselinker.carrierMapping.optionsCount', {
              count: group.options.length,
              defaultValue: `${group.options.length} shipping option(s)`
            })}
          </Text>
        </div>
      </td>
      <td className="py-3 px-4">
        {isMapped ? (
          <div>
            <Text className="font-medium">
              {carriers.find(c => c.code === mappedCarrier)?.name || mappedCarrier}
            </Text>
          </div>
        ) : (
          <select
            value={selectedCarrier}
            onChange={(e) => setSelectedCarrier(e.target.value)}
            className="w-full rounded-md border border-ui-border-base px-2 py-1 text-sm"
            disabled={isMapping}
          >
            <option value="">{t('baselinker.carrierMapping.selectCarrier', { defaultValue: 'Select carrier...' })}</option>
            {carriers.map((carrier) => (
              <option key={carrier.code} value={carrier.code}>
                {carrier.name}
              </option>
            ))}
          </select>
        )}
      </td>
      <td className="py-3 px-4">
        {isMapped ? (
          <Badge color="green">{t('baselinker.carrierMapping.mapped', { defaultValue: 'Mapped' })}</Badge>
        ) : isPartiallyMapped ? (
          <Badge color="orange">{t('baselinker.carrierMapping.partial', { defaultValue: 'Partial' })}</Badge>
        ) : (
          <Badge color="grey">{t('baselinker.carrierMapping.notMapped', { defaultValue: 'Not mapped' })}</Badge>
        )}
      </td>
      <td className="py-3 px-4">
        <div className="flex gap-2">
          {!isMapped && unmappedOptions.length > 0 && (
            <Button
              size="small"
              onClick={handleMap}
              disabled={!selectedCarrier || isMapping}
              isLoading={isMapping}
            >
              {t('baselinker.carrierMapping.map', { defaultValue: 'Map' })}
            </Button>
          )}
          {mappedOptions.length > 0 && (
            <Button
              size="small"
              variant="secondary"
              onClick={handleDelete}
            >
              <Trash className="w-4 h-4" />
            </Button>
          )}
        </div>
      </td>
    </tr>
  )
}

export function CarrierMappingSection() {
  const { t } = useTranslation()
  const [isMapping, setIsMapping] = useState(false)
  
  const { data, isLoading, refetch } = useCarrierMappings()
  const createMapping = useCreateCarrierMapping()
  const deleteMapping = useDeleteCarrierMapping()

  // Refetch on mount to ensure we have fresh data after connection creation
  useEffect(() => {
    refetch()
  }, [refetch])

  const mappings = data?.mappings || []
  const carriers = data?.carriers || []
  const shippingOptions = data?.shipping_options || []

  // Group shipping options by detected carrier
  const groups = useMemo(() => 
    groupShippingOptions(shippingOptions, carriers),
    [shippingOptions, carriers]
  )

  // Handle batch mapping for a group
  const handleMapGroup = async (carrierCode: string, optionIds: string[]) => {
    setIsMapping(true)
    const carrier = carriers.find(c => c.code === carrierCode)
    const trackingUrl = TRACKING_URL_TEMPLATES[carrierCode] || undefined
    
    try {
      // Create mappings for all options in the group
      for (const optionId of optionIds) {
        await createMapping.mutateAsync({
          bl_carrier_code: carrierCode,
          bl_carrier_name: carrier?.name || carrierCode,
          medusa_shipping_option_id: optionId,
          tracking_url_template: trackingUrl,
        })
      }
      toast.success(t('baselinker.carrierMapping.mappingCreated', {
        count: optionIds.length,
        defaultValue: `${optionIds.length} mapping(s) created`
      }))
    } catch (error: any) {
      toast.error(t('baselinker.carrierMapping.mappingFailed', {
        defaultValue: 'Failed to create mapping: '
      }) + error.message)
    } finally {
      setIsMapping(false)
    }
  }

  // Handle batch delete for a group
  const handleDeleteGroup = async (optionIds: string[]) => {
    try {
      // Find mapping IDs for these options
      const mappingIds = mappings
        .filter(m => optionIds.includes(m.medusa_shipping_option_id || ''))
        .map(m => m.id)
      
      for (const id of mappingIds) {
        await deleteMapping.mutateAsync(id)
      }
      toast.success(t('baselinker.carrierMapping.mappingDeleted', {
        count: mappingIds.length,
        defaultValue: `${mappingIds.length} mapping(s) deleted`
      }))
    } catch (error: any) {
      toast.error(t('baselinker.carrierMapping.deleteFailed', {
        defaultValue: 'Failed to delete mapping: '
      }) + error.message)
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border border-ui-border-base p-6">
        <Text>{t('baselinker.carrierMapping.loading', { defaultValue: 'Loading carrier mappings...' })}</Text>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-ui-border-base p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <Heading level="h3">{t('baselinker.carrierMapping.title', { defaultValue: 'Carrier Mappings' })}</Heading>
          <Text className="text-sm text-ui-fg-subtle">
            {t('baselinker.carrierMapping.description', { defaultValue: 'Map your shipping options to BaseLinker carriers' })}
          </Text>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-8 bg-ui-bg-subtle rounded-lg">
          <Text className="text-ui-fg-muted">
            {t('baselinker.carrierMapping.noOptions', { defaultValue: 'No shipping options found' })}
          </Text>
          <Text className="text-sm text-ui-fg-muted mt-1">
            {t('baselinker.carrierMapping.noOptionsHint', { defaultValue: 'Create shipping options in your stock locations first' })}
          </Text>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-ui-border-base bg-ui-bg-subtle">
                <th className="text-left py-2 px-4 text-sm font-medium">
                  {t('baselinker.carrierMapping.shippingGroup', { defaultValue: 'Shipping Group' })}
                </th>
                <th className="text-left py-2 px-4 text-sm font-medium">
                  {t('baselinker.carrierMapping.baselinkerCarrier', { defaultValue: 'BaseLinker Carrier' })}
                </th>
                <th className="text-left py-2 px-4 text-sm font-medium">
                  {t('baselinker.carrierMapping.status', { defaultValue: 'Status' })}
                </th>
                <th className="text-left py-2 px-4 text-sm font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <CarrierGroupRow
                  key={group.carrierCode || 'other'}
                  group={group}
                  carriers={carriers}
                  existingMappings={mappings}
                  onMapGroup={handleMapGroup}
                  onDeleteGroup={handleDeleteGroup}
                  isMapping={isMapping}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 p-4 bg-ui-bg-subtle rounded-lg">
        <Text className="text-sm font-medium mb-2">
          {t('baselinker.carrierMapping.howItWorks', { defaultValue: 'How it works:' })}
        </Text>
        <ul className="text-sm text-ui-fg-subtle space-y-1">
          <li>• {t('baselinker.carrierMapping.hint1', { defaultValue: 'Shipping options are grouped by detected carrier name' })}</li>
          <li>• {t('baselinker.carrierMapping.hint2', { defaultValue: 'Map all options in a group with one click' })}</li>
          <li>• {t('baselinker.carrierMapping.hint3', { defaultValue: 'Tracking URLs are generated automatically when shipments are created' })}</li>
        </ul>
      </div>
    </div>
  )
}

export default CarrierMappingSection
