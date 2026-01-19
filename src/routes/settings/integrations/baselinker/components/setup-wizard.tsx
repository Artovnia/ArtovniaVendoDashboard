import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  Button,
  Container,
  Heading,
  Text,
  toast,
  Input,
  Label,
  ProgressStatus,
  ProgressTabs,
  Badge,
} from '@medusajs/ui'
import {
  CheckCircleSolid,
  ExclamationCircle,
  LockClosedSolid,
} from '@medusajs/icons'
import {
  useCreateBaseLinkerConnection,
  useUpdateBaseLinkerConnection,
  BaseLinkerConnection,
} from '../../../../../hooks/api/baselinker'
import { StatusMappingSection } from './status-mapping'
import { CarrierMappingSection } from './carrier-mapping'
import { SettingToggle } from './setting-toggle'

// Setup wizard tabs
export enum SetupTab {
  CONNECTION = 'connection',
  FEATURES = 'features',
  STATUS_MAPPING = 'status_mapping',
  CARRIER_MAPPING = 'carrier_mapping',
  COMPLETE = 'complete',
}

type TabState = Record<SetupTab, ProgressStatus>

interface SetupWizardProps {
  activeConnection: BaseLinkerConnection | null
  onComplete: () => void
}

export function SetupWizard({ activeConnection, onComplete }: SetupWizardProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  
  const createConnection = useCreateBaseLinkerConnection()
  const updateConnection = useUpdateBaseLinkerConnection()

  // Determine initial tab state based on whether connection exists
  const getInitialTabState = (): TabState => {
    if (activeConnection) {
      // Connection exists, start from features or status mapping
      return {
        [SetupTab.CONNECTION]: 'completed',
        [SetupTab.FEATURES]: 'completed',
        [SetupTab.STATUS_MAPPING]: 'in-progress',
        [SetupTab.CARRIER_MAPPING]: 'not-started',
        [SetupTab.COMPLETE]: 'not-started',
      }
    }
    return {
      [SetupTab.CONNECTION]: 'in-progress',
      [SetupTab.FEATURES]: 'not-started',
      [SetupTab.STATUS_MAPPING]: 'not-started',
      [SetupTab.CARRIER_MAPPING]: 'not-started',
      [SetupTab.COMPLETE]: 'not-started',
    }
  }

  const getInitialTab = (): SetupTab => {
    if (activeConnection) {
      // If connection exists, skip to status mapping
      return SetupTab.STATUS_MAPPING
    }
    return SetupTab.CONNECTION
  }

  const [setupTab, setSetupTab] = useState<SetupTab>(getInitialTab)
  const [setupTabState, setSetupTabState] = useState<TabState>(getInitialTabState)
  const [hasIntegratedCarriers, setHasIntegratedCarriers] = useState<boolean | null>(null)
  // Track if we created a connection during this wizard session (activeConnection prop won't update immediately)
  const [connectionCreatedInSession, setConnectionCreatedInSession] = useState(false)

  // Form state for connection
  const [formData, setFormData] = useState({
    api_token: '',
    inventory_id: activeConnection ? String(activeConnection.inventory_id) : '',
    product_sync_enabled: activeConnection?.product_sync_enabled ?? true,
    stock_sync_enabled: activeConnection?.stock_sync_enabled ?? true,
    order_sync_enabled: activeConnection?.order_sync_enabled ?? true,
    fulfillment_sync_enabled: activeConnection?.fulfillment_sync_enabled ?? true,
    auto_sync_stock: activeConnection?.auto_sync_stock ?? true,
    stock_sync_interval_minutes: activeConnection?.stock_sync_interval_minutes ?? 30,
    stock_sync_direction: (activeConnection?.stock_sync_direction ?? 'bidirectional') as 'to_baselinker' | 'from_baselinker' | 'bidirectional',
  })

  // Update form data when activeConnection changes
  useEffect(() => {
    if (activeConnection) {
      setFormData(prev => ({
        ...prev,
        inventory_id: String(activeConnection.inventory_id),
        product_sync_enabled: activeConnection.product_sync_enabled,
        stock_sync_enabled: activeConnection.stock_sync_enabled,
        order_sync_enabled: activeConnection.order_sync_enabled,
        fulfillment_sync_enabled: activeConnection.fulfillment_sync_enabled || false,
        auto_sync_stock: activeConnection.auto_sync_stock,
        stock_sync_interval_minutes: activeConnection.stock_sync_interval_minutes,
        stock_sync_direction: activeConnection.stock_sync_direction,
      }))
      // Update tab state to reflect existing connection
      setSetupTabState({
        [SetupTab.CONNECTION]: 'completed',
        [SetupTab.FEATURES]: 'completed',
        [SetupTab.STATUS_MAPPING]: 'in-progress',
        [SetupTab.CARRIER_MAPPING]: 'not-started',
        [SetupTab.COMPLETE]: 'not-started',
      })
      setSetupTab(SetupTab.STATUS_MAPPING)
    }
  }, [activeConnection])

  // Validate connection credentials
  const validateCredentials = (): boolean => {
    if (!formData.api_token || !formData.inventory_id) {
      toast.error(t('baselinker.validation.required', { defaultValue: 'API Token and Inventory ID are required' }))
      return false
    }
    return true
  }

  // Create connection with all collected settings (called at the end of wizard)
  const handleCreateConnection = async (): Promise<boolean> => {
    if (!formData.api_token || !formData.inventory_id) {
      toast.error(t('baselinker.validation.required', { defaultValue: 'API Token and Inventory ID are required' }))
      return false
    }

    try {
      await createConnection.mutateAsync({
        api_token: formData.api_token,
        inventory_id: parseInt(formData.inventory_id),
        product_sync_enabled: formData.product_sync_enabled,
        stock_sync_enabled: formData.stock_sync_enabled,
        order_sync_enabled: formData.order_sync_enabled,
        fulfillment_sync_enabled: formData.fulfillment_sync_enabled,
        auto_sync_stock: formData.auto_sync_stock,
        stock_sync_interval_minutes: formData.stock_sync_interval_minutes,
        stock_sync_direction: formData.stock_sync_direction,
      })
      setConnectionCreatedInSession(true)
      toast.success(t('baselinker.connectionSuccess', { defaultValue: 'BaseLinker connected successfully' }))
      return true
    } catch (error: any) {
      toast.error(t('baselinker.connectionError', { defaultValue: 'Failed to connect BaseLinker' }))
      return false
    }
  }

  const handleUpdateFeatures = async (): Promise<boolean> => {
    if (!activeConnection) return true // No connection to update yet

    try {
      await updateConnection.mutateAsync({
        id: activeConnection.id,
        data: {
          product_sync_enabled: formData.product_sync_enabled,
          stock_sync_enabled: formData.stock_sync_enabled,
          order_sync_enabled: formData.order_sync_enabled,
          fulfillment_sync_enabled: formData.fulfillment_sync_enabled,
        },
      })
      return true
    } catch (error: any) {
      toast.error(t('baselinker.settingsError', { defaultValue: 'Failed to update settings' }))
      return false
    }
  }

  // Setup wizard navigation
  const goToNextSetupTab = async () => {
    if (setupTab === SetupTab.CONNECTION) {
      // Just validate credentials, don't create connection yet
      if (!validateCredentials()) return
      
      setSetupTabState(prev => ({
        ...prev,
        [SetupTab.CONNECTION]: 'completed',
        [SetupTab.FEATURES]: 'in-progress',
      }))
      setSetupTab(SetupTab.FEATURES)
    } else if (setupTab === SetupTab.FEATURES) {
      // Create connection after Features step if it doesn't exist yet
      // This is needed because status/carrier mapping APIs require an existing connection
      if (!activeConnection) {
        const success = await handleCreateConnection()
        if (!success) return
        // Note: activeConnection won't update immediately, but the connection exists now
      } else {
        // Update features if connection already exists (resuming setup)
        const success = await handleUpdateFeatures()
        if (!success) return
      }
      
      // If fulfillment sync is enabled, require status mapping
      if (formData.fulfillment_sync_enabled) {
        setSetupTabState(prev => ({
          ...prev,
          [SetupTab.FEATURES]: 'completed',
          [SetupTab.STATUS_MAPPING]: 'in-progress',
        }))
        setSetupTab(SetupTab.STATUS_MAPPING)
      } else {
        // Skip status/carrier mapping, go to complete
        setSetupTabState(prev => ({
          ...prev,
          [SetupTab.FEATURES]: 'completed',
          [SetupTab.STATUS_MAPPING]: 'completed',
          [SetupTab.CARRIER_MAPPING]: 'completed',
          [SetupTab.COMPLETE]: 'in-progress',
        }))
        setSetupTab(SetupTab.COMPLETE)
      }
    } else if (setupTab === SetupTab.STATUS_MAPPING) {
      // Move to carrier mapping tab
      setSetupTabState(prev => ({
        ...prev,
        [SetupTab.STATUS_MAPPING]: 'completed',
        [SetupTab.CARRIER_MAPPING]: 'in-progress',
      }))
      setSetupTab(SetupTab.CARRIER_MAPPING)
    } else if (setupTab === SetupTab.CARRIER_MAPPING) {
      setSetupTabState(prev => ({
        ...prev,
        [SetupTab.CARRIER_MAPPING]: 'completed',
        [SetupTab.COMPLETE]: 'in-progress',
      }))
      setSetupTab(SetupTab.COMPLETE)
    }
  }

  // Handle skipping carrier mapping
  const handleSkipCarrierMapping = () => {
    setHasIntegratedCarriers(false)
    setSetupTabState(prev => ({
      ...prev,
      [SetupTab.CARRIER_MAPPING]: 'completed',
      [SetupTab.COMPLETE]: 'in-progress',
    }))
    setSetupTab(SetupTab.COMPLETE)
  }

  // Finalize setup - connection is already created after Features step
  const handleFinishSetup = () => {
    // Mark as complete and close wizard
    setSetupTabState(prev => ({
      ...prev,
      [SetupTab.COMPLETE]: 'completed',
    }))
    onComplete()
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h1">{t('baselinker.setup.title', { defaultValue: 'BaseLinker Setup' })}</Heading>
          <Text className="text-ui-fg-subtle">
            {t('baselinker.setup.description', { defaultValue: 'Connect and configure your BaseLinker integration' })}
          </Text>
        </div>
      </div>

      <ProgressTabs
        value={setupTab}
        onValueChange={(val) => setSetupTab(val as SetupTab)}
        className="flex flex-col"
      >
        <div className="border-b border-ui-border-base px-6">
          <ProgressTabs.List className="flex w-full items-center">
            <ProgressTabs.Trigger status={setupTabState[SetupTab.CONNECTION]} value={SetupTab.CONNECTION}>
              {t('baselinker.setup.tabs.connection', { defaultValue: 'Connection' })}
            </ProgressTabs.Trigger>
            <ProgressTabs.Trigger 
              status={setupTabState[SetupTab.FEATURES]} 
              value={SetupTab.FEATURES}
              disabled={setupTabState[SetupTab.CONNECTION] !== 'completed'}
            >
              {t('baselinker.setup.tabs.features', { defaultValue: 'Features' })}
            </ProgressTabs.Trigger>
            <ProgressTabs.Trigger 
              status={setupTabState[SetupTab.STATUS_MAPPING]} 
              value={SetupTab.STATUS_MAPPING}
              disabled={setupTabState[SetupTab.FEATURES] !== 'completed'}
            >
              {t('baselinker.setup.tabs.statusMapping', { defaultValue: 'Status Mapping' })}
            </ProgressTabs.Trigger>
            <ProgressTabs.Trigger 
              status={setupTabState[SetupTab.CARRIER_MAPPING]} 
              value={SetupTab.CARRIER_MAPPING}
              disabled={setupTabState[SetupTab.STATUS_MAPPING] !== 'completed'}
            >
              {t('baselinker.setup.tabs.carrierMapping', { defaultValue: 'Carriers' })}
            </ProgressTabs.Trigger>
            <ProgressTabs.Trigger 
              status={setupTabState[SetupTab.COMPLETE]} 
              value={SetupTab.COMPLETE}
              disabled={setupTabState[SetupTab.COMPLETE] !== 'completed'}
            >
              {t('baselinker.setup.tabs.complete', { defaultValue: 'Complete' })}
            </ProgressTabs.Trigger>
          </ProgressTabs.List>
        </div>

        {/* Connection Tab */}
        <ProgressTabs.Content value={SetupTab.CONNECTION} className="p-4 sm:p-6">
          <div className="max-w-2xl space-y-6">
            <div>
              <Heading level="h2" className="text-lg sm:text-xl">{t('baselinker.setup.connection.title', { defaultValue: 'Connect BaseLinker' })}</Heading>
              <Text className="text-ui-fg-subtle mt-1 text-sm sm:text-base">
                {t('baselinker.setup.connection.description', { defaultValue: 'Enter your BaseLinker API credentials to connect your account.' })}
              </Text>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {/* Show masked token for existing connections */}
              {activeConnection ? (
                <div>
                  <Label className="mb-2">{t('baselinker.apiToken', { defaultValue: 'API Token' })}</Label>
                  <div className="flex items-center gap-2 p-3 bg-ui-bg-subtle border border-ui-border-base rounded-lg">
                    <LockClosedSolid className="w-4 h-4 text-ui-fg-muted flex-shrink-0" />
                    <Text className="font-mono text-sm text-ui-fg-muted">••••••••••••••••••••••••</Text>
                    <Badge color="green" size="small" className="ml-auto">
                      {t('baselinker.tokenConfigured', { defaultValue: 'Configured' })}
                    </Badge>
                  </div>
                  <Text className="text-xs text-ui-fg-muted mt-1">
                    {t('baselinker.tokenSecured', { defaultValue: 'Your API token is securely stored and encrypted' })}
                  </Text>
                </div>
              ) : (
                <div>
                  <Label htmlFor="api_token" className="mb-2">{t('baselinker.apiToken', { defaultValue: 'API Token' })}</Label>
                  <Input
                    id="api_token"
                    type="password"
                    value={formData.api_token}
                    onChange={(e) => setFormData({ ...formData, api_token: e.target.value })}
                    placeholder={t('baselinker.apiTokenPlaceholder', { defaultValue: 'Enter your BaseLinker API token' })}
                  />
                  <Text className="text-xs text-ui-fg-muted mt-1">
                    {t('baselinker.apiTokenHint', { defaultValue: 'Find this in BaseLinker → Settings → API' })}
                  </Text>
                </div>
              )}
              <div>
                <Label htmlFor="inventory_id" className="mb-2">{t('baselinker.inventoryId', { defaultValue: 'Inventory ID' })}</Label>
                <Input
                  id="inventory_id"
                  type="number"
                  value={formData.inventory_id}
                  onChange={(e) => setFormData({ ...formData, inventory_id: e.target.value })}
                  placeholder={t('baselinker.inventoryIdPlaceholder', { defaultValue: 'Enter inventory ID (e.g., 1001)' })}
                  disabled={!!activeConnection}
                />
                <Text className="text-xs text-ui-fg-muted mt-1">
                  {t('baselinker.inventoryIdHint', { defaultValue: 'Find this in BaseLinker → Inventory → Settings' })}
                </Text>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={goToNextSetupTab} isLoading={createConnection.isPending}>
                {t('actions.continue', { defaultValue: 'Continue' })}
              </Button>
            </div>
          </div>
        </ProgressTabs.Content>

        {/* Features Tab */}
        <ProgressTabs.Content value={SetupTab.FEATURES} className="p-4 sm:p-6">
          <div className="max-w-2xl space-y-6">
            <div>
              <Heading level="h2" className="text-lg sm:text-xl">{t('baselinker.setup.features.title', { defaultValue: 'Enable Features' })}</Heading>
              <Text className="text-ui-fg-subtle mt-1 text-sm sm:text-base">
                {t('baselinker.setup.features.description', { defaultValue: 'Choose which sync features to enable.' })}
              </Text>
            </div>

            <div className="space-y-1 divide-y divide-ui-border-base rounded-lg border border-ui-border-base">
              <div className="p-3 sm:p-4">
                <SettingToggle
                  label={t('baselinker.productSync', { defaultValue: 'Product Sync' })}
                  description={t('baselinker.productSyncDescription', { defaultValue: 'Enable importing products from BaseLinker' })}
                  checked={formData.product_sync_enabled}
                  onChange={(checked) => setFormData({ ...formData, product_sync_enabled: checked })}
                />
              </div>
              <div className="p-3 sm:p-4">
                <SettingToggle
                  label={t('baselinker.stockSync', { defaultValue: 'Stock Sync (Bidirectional)' })}
                  description={t('baselinker.stockSyncDescription', { defaultValue: 'Sync stock quantities both ways between Medusa and BaseLinker' })}
                  checked={formData.stock_sync_enabled}
                  onChange={(checked) => setFormData({ ...formData, stock_sync_enabled: checked })}
                />
              </div>
              <div className="p-3 sm:p-4">
                <SettingToggle
                  label={t('baselinker.orderSync', { defaultValue: 'Order Sync' })}
                  description={t('baselinker.orderSyncDescription', { defaultValue: 'Sync orders from Medusa to BaseLinker' })}
                  checked={formData.order_sync_enabled}
                  onChange={(checked) => setFormData({ ...formData, order_sync_enabled: checked })}
                />
              </div>
              <div className="p-3 sm:p-4">
                <SettingToggle
                  label={t('baselinker.fulfillmentSync', { defaultValue: 'Fulfillment Sync' })}
                  description={t('baselinker.fulfillmentSyncDescription', { defaultValue: 'Sync fulfillment status changes from BaseLinker back to Medusa (packed, shipped, delivered)' })}
                  checked={formData.fulfillment_sync_enabled}
                  onChange={(checked) => setFormData({ ...formData, fulfillment_sync_enabled: checked })}
                />
                {formData.fulfillment_sync_enabled && (
                  <div className="mt-2 p-3 rounded-lg flex items-start gap-2 bg-ui-bg-subtle">
                    <ExclamationCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-ui-fg-muted" />
                    <Text className="text-sm text-ui-fg-muted">
                      {t('baselinker.fulfillmentSyncWarning', { defaultValue: 'Fulfillment sync requires status mapping. You will configure this in the next step.' })}
                    </Text>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={goToNextSetupTab} isLoading={updateConnection.isPending}>
                {t('actions.continue', { defaultValue: 'Continue' })}
              </Button>
            </div>
          </div>
        </ProgressTabs.Content>

        {/* Status Mapping Tab */}
        <ProgressTabs.Content value={SetupTab.STATUS_MAPPING} className="p-4 sm:p-6">
          <div className="space-y-6">
            <div>
              <Heading level="h2" className="text-lg sm:text-xl">{t('baselinker.setup.statusMapping.title', { defaultValue: 'Map Order Statuses' })}</Heading>
              <Text className="text-ui-fg-subtle mt-1 text-sm sm:text-base">
                {t('baselinker.setup.statusMapping.description', { defaultValue: 'Map your BaseLinker order statuses to Medusa fulfillment actions. This is required for fulfillment sync to work correctly.' })}
              </Text>
            </div>

            <div className="p-3 sm:p-4 bg-blue-800 border border-blue-200 rounded-lg">
              <Text className="text-xs sm:text-sm ">
               {t('baselinker.setup.statusMapping.hint', { defaultValue: 'Tip:' })}{' '}
                {t('baselinker.setup.statusMapping.hintText', { defaultValue: 'Map at least one status to "Create Shipment" (for when order is shipped) and one to "Mark Delivered" (for when order is delivered).' })}
              </Text>
            </div>

            <StatusMappingSection />

            <div className="flex justify-end pt-4">
              <Button onClick={goToNextSetupTab}>
                {t('actions.continue', { defaultValue: 'Continue' })}
              </Button>
            </div>
          </div>
        </ProgressTabs.Content>

        {/* Carrier Mapping Tab */}
        <ProgressTabs.Content value={SetupTab.CARRIER_MAPPING} className="p-4 sm:p-6">
          <div className="space-y-6">
            <div>
              <Heading level="h2" className="text-lg sm:text-xl">{t('baselinker.setup.carrierMapping.title', { defaultValue: 'Map Carriers' })}</Heading>
              <Text className="text-ui-fg-subtle mt-1 text-sm sm:text-base">
                {t('baselinker.setup.carrierMapping.description', { defaultValue: 'Map your BaseLinker carriers to ensure proper tracking information is synced.' })}
              </Text>
            </div>

            {/* Carrier question - ask if they want to configure carriers */}
            <div className="p-4 sm:p-6 bg-ui-bg-subtle rounded-lg border border-ui-border-base">
              <Heading level="h3" className="mb-2 text-base sm:text-lg">
                {t('baselinker.setup.carrierQuestion.title', { defaultValue: 'Do you have integrated carriers in BaseLinker?' })}
              </Heading>
              <Text className="text-ui-fg-subtle mb-4 text-sm sm:text-base">
                {t('baselinker.setup.carrierQuestion.description', { defaultValue: 'If you use carrier integrations (InPost, DPD, etc.) in BaseLinker, you should map them to ensure proper tracking.' })}
              </Text>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="secondary" onClick={() => setHasIntegratedCarriers(true)}>
                  {t('baselinker.setup.carrierQuestion.yes', { defaultValue: 'Yes, configure carriers' })}
                </Button>
                <Button variant="secondary" onClick={handleSkipCarrierMapping}>
                  {t('baselinker.setup.carrierQuestion.no', { defaultValue: 'No, skip this step' })}
                </Button>
              </div>
            </div>

            {/* Show carrier mapping only if user chose to configure */}
            {hasIntegratedCarriers && (
              <>
                <CarrierMappingSection />
                <div className="flex justify-end pt-4">
                  <Button onClick={goToNextSetupTab}>
                    {t('actions.continue', { defaultValue: 'Continue' })}
                  </Button>
                </div>
              </>
            )}
          </div>
        </ProgressTabs.Content>

        {/* Complete Tab */}
        <ProgressTabs.Content value={SetupTab.COMPLETE} className="p-4 sm:p-6">
          <div className="max-w-2xl space-y-6 text-center mx-auto">
            <CheckCircleSolid className="w-12 h-12 sm:w-16 sm:h-16 text-green-500 mx-auto" />
            <div>
              <Heading level="h2" className="text-lg sm:text-xl">
                {t('baselinker.setup.complete.title', { defaultValue: 'Setup Complete!' })}
              </Heading>
              <Text className="text-ui-fg-subtle mt-2 text-sm sm:text-base">
                {t('baselinker.setup.complete.description', { defaultValue: 'Your BaseLinker integration is now configured and ready to use.' })}
              </Text>
            </div>

            {/* Next steps */}
            <div className="grid gap-4 text-left">
              <div className="p-3 sm:p-4 bg-ui-bg-subtle rounded-lg border border-ui-border-base">
                <Text className="font-medium text-sm sm:text-base">{t('baselinker.setup.complete.nextSteps', { defaultValue: 'Next Steps:' })}</Text>
                <ul className="mt-2 space-y-1 text-xs sm:text-sm text-ui-fg-subtle">
                  <li>• {t('baselinker.setup.complete.step1', { defaultValue: 'Import products from BaseLinker' })}</li>
                  <li>• {t('baselinker.setup.complete.step2', { defaultValue: 'Sync your stock levels' })}</li>
                  <li>• {t('baselinker.setup.complete.step3', { defaultValue: 'Start receiving orders' })}</li>
                </ul>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4">
              <Button variant="secondary" onClick={handleFinishSetup} className="w-full sm:w-auto">
                {t('baselinker.setup.complete.viewDashboard', { defaultValue: 'View Dashboard' })}
              </Button>
              <Button onClick={() => navigate('/settings/integrations/baselinker/import')} className="w-full sm:w-auto">
                {t('baselinker.setup.complete.importProducts', { defaultValue: 'Import Products' })}
              </Button>
            </div>
          </div>
        </ProgressTabs.Content>
      </ProgressTabs>
    </Container>
  )
}

export default SetupWizard
