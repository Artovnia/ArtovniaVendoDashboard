/**
 * Component: BatchShippingSetupForm
 * 
 * One-click shipping setup for vendors
 */

import { Button, Input, Label, Heading, RadioGroup, Table } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { useBatchShippingSetup } from "../../../../hooks/api/batch-shipping/use-batch-shipping-setup"
import { useNavigate } from "react-router-dom"
import { useState } from "react"
import { CountrySelect } from "../../../../components/inputs/country-select"
import { useOnboarding } from "../../../../hooks/api/users"
import { 
  CheckCircleSolid,
  BuildingStorefront,
  MapPin,
  TruckFast,
  CogSixTooth,
  ExclamationCircle,
  Spinner
} from "@medusajs/icons"

type ShippingZoneOption = "poland_only" | "poland_and_eu"

export const BatchShippingSetupForm = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [showDetails, setShowDetails] = useState(false)
  const [countryCode, setCountryCode] = useState("pl")
  const [locationName, setLocationName] = useState("")
  const [zoneOption, setZoneOption] = useState<ShippingZoneOption>("poland_and_eu")
  const { onboarding } = useOnboarding()
  
  const { mutate, isPending, isSuccess, data, error } = useBatchShippingSetup({
    onSuccess: (data) => {
      toast.success(t("shipping.batch_setup.success.title"), {
        description: t("shipping.batch_setup.success.description"),
        duration: 5000,
      })
    },
    onError: (error: any) => {
      if (error.type === "incomplete_profile") {
        toast.error(t("shipping.batch_setup.error.incomplete_profile"), {
          description: t("shipping.batch_setup.error.complete_profile_first"),
          action: {
            label: t("shipping.batch_setup.error.go_to_profile"),
            onClick: () => navigate("/settings/store"),
          },
          duration: 10000,
        })
      } else {
        toast.error(t("shipping.batch_setup.error.generic"), {
          description: error.message,
          duration: 5000,
        })
      }
    },
  })

  const handleSetup = () => {
    if (!countryCode) {
      toast.error(t("shipping.batch_setup.error.country_required"))
      return
    }
    
    mutate({
      use_custom_location: true,
      location_name: locationName || t("shipping.batch_setup.default_location_name"),
      location_address: {
        address_1: "-", // Will be filled from seller profile or set as placeholder
        city: "-",
        country_code: countryCode,
      },
      create_eu_zone: zoneOption === "poland_and_eu"
    })
  }

  if (isSuccess && data) {
    return (
      <div className="flex flex-col gap-6">
        {/* Success State */}
        <div className="bg-ui-bg-success-subtle border border-ui-border-success rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <CheckCircleSolid className="text-ui-fg-success w-6 h-6" />
            </div>
            <div className="flex-1">
              <Heading level="h2" className="text-ui-fg-success mb-2">
                {t("shipping.batch_setup.success.title")}
              </Heading>
              <p className="text-ui-fg-success text-sm mb-4">
                {t("shipping.batch_setup.success.description")}
              </p>
              
              {/* Disclaimer */}
              <div className="bg-ui-bg-base border border-ui-border-base rounded-md p-4 mb-4">
                <p className="text-sm text-ui-fg-subtle mb-2">
                  {t("shipping.batch_setup.success.disclaimer")}
                </p>
                <ul className="text-xs text-ui-fg-muted space-y-1 list-disc list-inside">
                  <li>{t("shipping.batch_setup.success.disclaimer_prices")}</li>
                  <li>{t("shipping.batch_setup.success.disclaimer_carriers")}</li>
                </ul>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="bg-ui-bg-base rounded-md p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="w-4 h-4 text-ui-fg-muted" />
                    <span className="text-xs text-ui-fg-muted">
                      {t("shipping.batch_setup.summary.location")}
                    </span>
                  </div>
                  <p className="text-lg font-semibold">1</p>
                </div>
                
                <div className="bg-ui-bg-base rounded-md p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <BuildingStorefront className="w-4 h-4 text-ui-fg-muted" />
                    <span className="text-xs text-ui-fg-muted">
                      {t("shipping.batch_setup.summary.profiles")}
                    </span>
                  </div>
                  <p className="text-lg font-semibold">{data?.data?.summary?.total_profiles || 0}</p>
                </div>
                
                <div className="bg-ui-bg-base rounded-md p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <TruckFast className="w-4 h-4 text-ui-fg-muted" />
                    <span className="text-xs text-ui-fg-muted">
                      {t("shipping.batch_setup.summary.options")}
                    </span>
                  </div>
                  <p className="text-lg font-semibold">{data?.data?.summary?.total_options || 0}</p>
                </div>
                
                <div className="bg-ui-bg-base rounded-md p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <CogSixTooth className="w-4 h-4 text-ui-fg-muted" />
                    <span className="text-xs text-ui-fg-muted">
                      {t("shipping.batch_setup.summary.zones")}
                    </span>
                  </div>
                  <p className="text-lg font-semibold">{data?.data?.summary?.zones?.length || 0}</p>
                </div>
              </div>

              {/* Details Toggle */}
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-sm text-ui-fg-interactive hover:underline mt-4"
              >
                {showDetails 
                  ? t("shipping.batch_setup.hide_details")
                  : t("shipping.batch_setup.show_details")
                }
              </button>

              {showDetails && (
                <div className="mt-4 space-y-3 text-sm">
                  <div className="bg-ui-bg-base rounded-md p-3">
                    <p className="font-medium mb-1">{t("shipping.batch_setup.details.location")}</p>
                    <p className="text-ui-fg-subtle">{data?.data?.stock_location?.name || ''}</p>
                  </div>
                  
                  <div className="bg-ui-bg-base rounded-md p-3">
                    <p className="font-medium mb-1">{t("shipping.batch_setup.details.zones")}</p>
                    <ul className="text-ui-fg-subtle space-y-1">
                      <li>• {data?.data?.service_zones?.poland?.name || ''} ({data?.data?.service_zones?.poland?.countries || 0} {t("shipping.batch_setup.details.country")})</li>
                      <li>• {data?.data?.service_zones?.eu?.name || ''} ({data?.data?.service_zones?.eu?.countries || 0} {t("shipping.batch_setup.details.countries")})</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {/* ⚠️ ONBOARDING: Commented out during onboarding - vendors should proceed to next step */}
          {/* <Button
            variant="secondary"
            onClick={() => navigate("/settings/locations")}
          >
            {t("shipping.batch_setup.view_locations")}
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate("/settings/locations/shipping-profiles")}
          >
            {t("shipping.batch_setup.view_profiles")}
          </Button> */}
          <Button
            onClick={() => navigate("/onboarding")}
            className="w-full"
          >
            {t("shipping.batch_setup.back_to_dashboard")}
          </Button>
        </div>
      </div>
    )
  }

  // Check if batch setup is already completed
  const isAlreadyCompleted = onboarding?.locations_shipping === true

  return (
    <div className="flex flex-col gap-6">
      {/* Already Completed Warning */}
      {isAlreadyCompleted && (
        <div className="bg-ui-bg-base border border-ui-border-base rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <CheckCircleSolid className="text-ui-fg-interactive w-6 h-6" />
            </div>
            <div className="flex-1">
              <Heading level="h2">
                {t("shipping.batch_setup.already_completed.title")}
              </Heading>
              <p className="text-ui-fg-subtle text-sm mb-4">
                {t("shipping.batch_setup.already_completed.description")}
              </p>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => navigate("/settings/locations")}
                >
                  {t("shipping.batch_setup.view_locations")}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => navigate("/settings/locations/shipping-profiles")}
                >
                  {t("shipping.batch_setup.view_profiles")}
                </Button>
                <Button
                  onClick={() => navigate("/dashboard")}
                >
                  {t("shipping.batch_setup.back_to_dashboard")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Card */}
      <div className="bg-ui-bg-subtle border border-ui-border-base rounded-lg p-6">
        <Heading level="h2" className="mb-3">
          {t("shipping.batch_setup.title")}
        </Heading>
        <p className="text-ui-fg-subtle text-sm mb-4">
          {t("shipping.batch_setup.description")}
        </p>

        {/* Pricing Table */}
        <div className="space-y-4 mb-6">
          <div>
            <p className="text-sm font-medium mb-2">{t("shipping.batch_setup.pricing_table.title")}</p>
            <p className="text-xs text-ui-fg-subtle mb-4">{t("shipping.batch_setup.pricing_table.description")}</p>
          </div>

          {/* Poland Pricing */}
          <div>
            <p className="text-sm font-semibold mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {t("shipping.batch_setup.pricing_table.poland_zone")}
            </p>
            <div className="overflow-x-auto">
              <Table>
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell>{t("shipping.batch_setup.pricing_table.carrier")}</Table.HeaderCell>
                    <Table.HeaderCell className="text-right">{t("shipping.batch_setup.pricing_table.mini")}</Table.HeaderCell>
                    <Table.HeaderCell className="text-right">{t("shipping.batch_setup.pricing_table.small")}</Table.HeaderCell>
                    <Table.HeaderCell className="text-right">{t("shipping.batch_setup.pricing_table.medium")}</Table.HeaderCell>
                    <Table.HeaderCell className="text-right">{t("shipping.batch_setup.pricing_table.big")}</Table.HeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  <Table.Row>
                    <Table.Cell className="font-medium">InPost Paczkomat</Table.Cell>
                    <Table.Cell className="text-right">11.99 PLN</Table.Cell>
                    <Table.Cell className="text-right">16.99 PLN</Table.Cell>
                    <Table.Cell className="text-right">18.99 PLN</Table.Cell>
                    <Table.Cell className="text-right">20.99 PLN</Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell className="font-medium">InPost Kurier</Table.Cell>
                    <Table.Cell className="text-right">14.99 PLN</Table.Cell>
                    <Table.Cell className="text-right">19.99 PLN</Table.Cell>
                    <Table.Cell className="text-right">20.99 PLN</Table.Cell>
                    <Table.Cell className="text-right">25.99 PLN</Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell className="font-medium">DPD</Table.Cell>
                    <Table.Cell className="text-right">25.00 PLN</Table.Cell>
                    <Table.Cell className="text-right">25.00 PLN</Table.Cell>
                    <Table.Cell className="text-right">25.00 PLN</Table.Cell>
                    <Table.Cell className="text-right">40.00 PLN</Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell className="font-medium">Fedex</Table.Cell>
                    <Table.Cell className="text-right">23.00 PLN</Table.Cell>
                    <Table.Cell className="text-right">23.00 PLN</Table.Cell>
                    <Table.Cell className="text-right">25.00 PLN</Table.Cell>
                    <Table.Cell className="text-right">50.00 PLN</Table.Cell>
                  </Table.Row>
                  {zoneOption === "poland_and_eu" && (
                    <Table.Row className="bg-ui-bg-subtle">
                      <Table.Cell className="font-medium">Fedex (EU)</Table.Cell>
                      <Table.Cell className="text-right">75.00 PLN</Table.Cell>
                      <Table.Cell className="text-right">75.00 PLN</Table.Cell>
                      <Table.Cell className="text-right">120.00 PLN</Table.Cell>
                      <Table.Cell className="text-right">140.00 PLN</Table.Cell>
                    </Table.Row>
                  )}
                </Table.Body>
              </Table>
            </div>
          </div>

          {/* Summary Info */}
          <div className="bg-ui-bg-base border border-ui-border-base rounded-md p-3">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-ui-fg-muted mb-1">{t("shipping.batch_setup.pricing_table.total_profiles")}</p>
                <p className="font-semibold">4 {t("shipping.batch_setup.pricing_table.profiles")}</p>
              </div>
              <div>
                <p className="text-ui-fg-muted mb-1">{t("shipping.batch_setup.pricing_table.total_options")}</p>
                <p className="font-semibold">{zoneOption === "poland_and_eu" ? "20" : "16"} {t("shipping.batch_setup.pricing_table.options")}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Warning */}
        <div className="bg-ui-bg-base border border-ui-border-base rounded-md p-4 flex items-start gap-3">
          <ExclamationCircle className="w-5 h-5 text-ui-fg-muted flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium mb-1">{t("shipping.batch_setup.requirements.title")}</p>
            <p className="text-ui-fg-subtle">{t("shipping.batch_setup.requirements.description")}</p>
          </div>
        </div>
      </div>

      {/* Location Configuration */}
      <div className="bg-ui-bg-base border border-ui-border-base rounded-lg p-6">
        <Heading level="h2" className="mb-3">
          {t("shipping.batch_setup.location_config.title")}
        </Heading> 
        
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="location-name" className="text-sm font-medium">
              {t("shipping.batch_setup.location_config.location_name")}
              <span className="text-ui-fg-muted ml-1">({t("fields.optional")})</span>
            </Label>
            <Input
              id="location-name"
              placeholder={t("shipping.batch_setup.location_config.location_name_placeholder")}
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              disabled={isPending}
            />
            <p className="text-xs text-ui-fg-subtle">
              {t("shipping.batch_setup.location_config.location_name_hint")}
            </p>
            
          </div>

          <div className="grid gap-2">
            <Label htmlFor="country-select" className="text-sm font-medium">
              {t("shipping.batch_setup.location_config.country")}
              <span className="text-ui-fg-error ml-1">*</span>
            </Label>
            <CountrySelect
              value={countryCode}
              onChange={setCountryCode}
              disabled={isPending}
            />
            <p className="text-xs text-ui-fg-subtle">
              {t("shipping.batch_setup.location_config.country_hint")}
            </p>
          </div>

          {/* Shipping Zones Selection */}
          <div className="grid gap-2">
            <Label className="text-sm font-medium">
              {t("shipping.batch_setup.zone_config.title")}
              <span className="text-ui-fg-error ml-1">*</span>
            </Label>
            <RadioGroup
              value={zoneOption}
              onValueChange={(value) => setZoneOption(value as ShippingZoneOption)}
              className="gap-3"
            >
              <div className="flex items-start gap-3 rounded-md border border-ui-border-base p-3 hover:bg-ui-bg-subtle-hover cursor-pointer">
                <RadioGroup.Item value="poland_only" id="poland-only" className="mt-0.5" />
                <div className="flex-1">
                  <Label htmlFor="poland-only" className="text-sm font-medium cursor-pointer">
                    {t("shipping.batch_setup.zone_config.poland_only.title")}
                  </Label>
                  <p className="text-xs text-ui-fg-subtle mt-1">
                    {t("shipping.batch_setup.zone_config.poland_only.description")}
                  </p>
                  <p className="text-xs text-ui-fg-muted mt-1">
                    {t("shipping.batch_setup.zone_config.poland_only.carriers")}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-md border border-ui-border-base p-3 hover:bg-ui-bg-subtle-hover cursor-pointer">
                <RadioGroup.Item value="poland_and_eu" id="poland-and-eu" className="mt-0.5" />
                <div className="flex-1">
                  <Label htmlFor="poland-and-eu" className="text-sm font-medium cursor-pointer">
                    {t("shipping.batch_setup.zone_config.poland_and_eu.title")}
                  </Label>
                  <p className="text-xs text-ui-fg-subtle mt-1">
                    {t("shipping.batch_setup.zone_config.poland_and_eu.description")}
                  </p>
                  <p className="text-xs text-ui-fg-muted mt-1">
                    {t("shipping.batch_setup.zone_config.poland_and_eu.carriers")}
                  </p>
                </div>
              </div>
            </RadioGroup>
            
            {zoneOption === "poland_only" && (
              <div className="bg-ui-bg-base border border-ui-border-base rounded-md p-3 flex items-start gap-2 mt-2">
                <ExclamationCircle className="w-4 h-4 text-ui-fg-muted flex-shrink-0 mt-0.5" />
                <p className="text-xs text-ui-fg-subtle">
                  {t("shipping.batch_setup.zone_config.poland_only.note")}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-ui-bg-error-subtle border border-ui-border-error rounded-lg p-4">
          <div className="flex items-start gap-3">
            <ExclamationCircle className="w-5 h-5 text-ui-fg-error flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-ui-fg-error font-medium text-sm mb-1">
                {(error as any).type === "incomplete_profile" 
                  ? t("shipping.batch_setup.error.incomplete_profile")
                  : t("shipping.batch_setup.error.generic")
                }
              </p>
              <p className="text-ui-fg-error text-xs">{error.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Action Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSetup}
          disabled={isPending || isAlreadyCompleted}
          size="large"
        >
          {isPending ? (
            <>
              <Spinner className="w-4 h-4 animate-spin mr-2" />
              {t("shipping.batch_setup.creating")}
            </>
          ) : isAlreadyCompleted ? (
            t("shipping.batch_setup.already_completed.button")
          ) : (
            t("shipping.batch_setup.create_button")
          )}
        </Button>
      </div>
    </div>
  )
}
