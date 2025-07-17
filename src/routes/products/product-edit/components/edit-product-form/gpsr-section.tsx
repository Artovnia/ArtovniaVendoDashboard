import { Button, Heading, Input, Text, toast } from '@medusajs/ui'
import { useEffect, useState } from 'react'
import { useGPSRData, GPSRData } from '../../../../../hooks/api/gpsr'
import { useUpdateGPSRData } from '../../../../../hooks/api/gpsr-update'

type GPSRSectionProps = {
  productId: string
}

// Define default empty values to avoid uncontrolled to controlled warnings
const DEFAULT_GPSR_DATA: GPSRData = {
  complianceCert: '',
  safetyWarning: '',
  origin: ''
}

export const GPSRSection = ({ productId }: GPSRSectionProps) => {
  // Initialize with default empty values to avoid uncontrolled inputs
  const [gpsrData, setGpsrData] = useState<GPSRData>(DEFAULT_GPSR_DATA)
  
  // Use the existing hooks for fetching and updating GPSR data
  const result = useGPSRData(productId)
  const { isLoading, refetch } = result
  const gpsrApiData = result?.data || {}
  
  const { mutateAsync: updateGPSR, isPending: isSaving } = useUpdateGPSRData()

  // Load GPSR data when component mounts or data changes
  useEffect(() => {
    if (gpsrApiData?.gpsr) {
      // Ensure we have all fields filled with at least empty strings
      setGpsrData({
        complianceCert: gpsrApiData.gpsr.complianceCert || '',
        safetyWarning: gpsrApiData.gpsr.safetyWarning || '',
        origin: gpsrApiData.gpsr.origin || ''
      })
    }
  }, [gpsrApiData])

  const handleInputChange = (field: keyof GPSRData, value: string) => {
    setGpsrData(prev => ({
      ...prev,
      [field]: value || '' // Ensure the value is never undefined
    }))
  }

  const handleSubmit = async () => {
    try {
      // Ensure all fields are at least empty strings before submitting
      const dataToSubmit = {
        complianceCert: gpsrData.complianceCert || '',
        safetyWarning: gpsrData.safetyWarning || '',
        origin: gpsrData.origin || ''
      }
      
      await updateGPSR({ productId, gpsr: dataToSubmit })
      refetch() // Refetch data after update
      toast.success('GPSR data saved successfully')
    } catch (error) {
      console.error('Error saving GPSR data:', error)
      toast.error('Failed to save GPSR data')
    }
  }

  if (isLoading) {
    return <div>Loading GPSR data...</div>
  }

  return (
    <div className="bg-white p-4 rounded border border-ui-border-base">
      <Heading level="h2" className="text-ui-fg-base mb-4">
        General Product Safety Regulation (GPSR)
      </Heading>
      <Text className="text-ui-fg-subtle mb-4">
        Provide required safety information for your product according to EU regulations.
      </Text>

      <div className="space-y-4">
        <div>
          <Text className="text-ui-fg-base font-medium mb-1">Compliance Certificate</Text>
          <Input
            placeholder="Enter compliance certificate identifier"
            value={gpsrData.complianceCert}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('complianceCert', e.target.value)}
          />
        </div>

        <div>
          <Text className="text-ui-fg-base font-medium mb-1">Safety Warning</Text>
          <Input
            placeholder="Enter safety warnings for this product"
            value={gpsrData.safetyWarning}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('safetyWarning', e.target.value)}
          />
        </div>

        <div>
          <Text className="text-ui-fg-base font-medium mb-1">Country of Origin</Text>
          <Input
            placeholder="Enter country of origin"
            value={gpsrData.origin}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('origin', e.target.value)}
          />
        </div>

        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={isSaving}
          isLoading={isSaving}
        >
          Save GPSR Data
        </Button>
      </div>
    </div>
  )
}
