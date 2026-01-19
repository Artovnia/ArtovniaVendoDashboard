import { useState, useEffect } from 'react'
import { Container } from '@medusajs/ui'
import { ArrowPath } from '@medusajs/icons'
import {
  useBaseLinkerConnections,
  useStatusMappings,
  useCarrierMappings,
} from '../../../../hooks/api/baselinker'
import { SetupWizard } from './components/setup-wizard'
import { Dashboard } from './components/dashboard'

/**
 * BaseLinker Integration Page
 * 
 * This page handles both the setup wizard for new connections
 * and the dashboard for existing connections.
 * 
 * Flow:
 * 1. If no active connection exists, show the setup wizard
 * 2. If connection exists but setup is incomplete (missing mappings), show warning
 * 3. User can click "Complete Setup" to return to wizard at the appropriate step
 */
export default function BaseLinkerIntegrationPage() {
  // Track if we're in setup mode - starts true if no connection exists
  const [isInSetupMode, setIsInSetupMode] = useState<boolean | null>(null)
  const [setupCompleted, setSetupCompleted] = useState(false)

  const { data: connections, isLoading } = useBaseLinkerConnections()
  const { data: statusMappingsData } = useStatusMappings()
  const { data: carrierMappingsData } = useCarrierMappings()

  const activeConnection = connections?.find((c) => c?.status === 'active') || null
  
  // Check if setup is complete (has required mappings when fulfillment sync is enabled)
  const statusMappings = statusMappingsData?.mappings || []
  const carrierMappings = carrierMappingsData?.mappings || []
  
  const needsStatusMapping = activeConnection?.fulfillment_sync_enabled && statusMappings.length === 0
  const hasCarriers = (carrierMappingsData?.carriers?.length || 0) > 0
  const needsCarrierMapping = activeConnection?.fulfillment_sync_enabled && hasCarriers && carrierMappings.length === 0

  // Initialize setup mode based on whether connection exists
  useEffect(() => {
    if (!isLoading && isInSetupMode === null) {
      // First load - determine if we should show wizard
      setIsInSetupMode(!activeConnection)
    }
  }, [isLoading, activeConnection, isInSetupMode])

  // Handle setup completion
  const handleSetupComplete = () => {
    setSetupCompleted(true)
    setIsInSetupMode(false)
  }

  // Handle starting setup wizard from dashboard
  const handleStartSetupWizard = () => {
    setSetupCompleted(false)
    setIsInSetupMode(true)
  }

  if (isLoading || isInSetupMode === null) {
    return (
      <Container className="divide-y p-0">
        <div className="flex items-center justify-center py-24">
          <ArrowPath className="animate-spin text-ui-fg-muted" />
        </div>
      </Container>
    )
  }

  // Show setup wizard when in setup mode (new connection or completing setup)
  if (isInSetupMode && !setupCompleted) {
    return (
      <SetupWizard
        activeConnection={activeConnection}
        onComplete={handleSetupComplete}
      />
    )
  }

  // Show dashboard for existing connections (activeConnection is guaranteed non-null here)
  if (!activeConnection) {
    // This shouldn't happen, but handle gracefully
    return null
  }

  return (
    <Dashboard
      activeConnection={activeConnection}
      needsStatusMapping={needsStatusMapping || false}
      needsCarrierMapping={needsCarrierMapping || false}
      onStartSetupWizard={handleStartSetupWizard}
    />
  )
}
