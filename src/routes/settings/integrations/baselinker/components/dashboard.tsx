import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  Button,
  Container,
  Heading,
  Text,
  toast,
  Badge,
  Prompt,
} from '@medusajs/ui'
import {
  PencilSquare,
  Trash,
  ArrowPath,
  ArrowUpRightOnBox,
  ExclamationCircle,
  LockClosedSolid,
} from '@medusajs/icons'
import {
  useUpdateBaseLinkerConnection,
  useDeleteBaseLinkerConnection,
  useSyncStock,
  useManualPollOrderStatus,
  BaseLinkerConnection,
} from '../../../../../hooks/api/baselinker'
import { StatusMappingSection } from './status-mapping'
import { CarrierMappingSection } from './carrier-mapping'
import { SettingToggle } from './setting-toggle'
import { SectionCard } from './section-card'
import { SyncActionCard } from './sync-action-card'
import { ConnectionStatusBadge } from './connection-status-badge'

interface DashboardProps {
  activeConnection: BaseLinkerConnection
  needsStatusMapping: boolean
  needsCarrierMapping: boolean
  onStartSetupWizard: () => void
}

export function Dashboard({
  activeConnection,
  needsStatusMapping,
  needsCarrierMapping,
  onStartSetupWizard,
}: DashboardProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [isEditing, setIsEditing] = useState(false)
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false)

  const updateConnection = useUpdateBaseLinkerConnection()
  const deleteConnection = useDeleteBaseLinkerConnection()
  const syncStock = useSyncStock()
  const manualPoll = useManualPollOrderStatus()

  const setupIncomplete = needsStatusMapping || needsCarrierMapping

  // Form state for editing
  const [formData, setFormData] = useState({
    product_sync_enabled: activeConnection.product_sync_enabled,
    stock_sync_enabled: activeConnection.stock_sync_enabled,
    order_sync_enabled: activeConnection.order_sync_enabled,
    fulfillment_sync_enabled: activeConnection.fulfillment_sync_enabled || false,
  })

  const initializeForm = () => {
    setFormData({
      product_sync_enabled: activeConnection.product_sync_enabled,
      stock_sync_enabled: activeConnection.stock_sync_enabled,
      order_sync_enabled: activeConnection.order_sync_enabled,
      fulfillment_sync_enabled: activeConnection.fulfillment_sync_enabled || false,
    })
  }

  const handleUpdateConnection = async () => {
    try {
      await updateConnection.mutateAsync({
        id: activeConnection.id,
        data: formData,
      })
      toast.success(t('baselinker.settingsUpdated', { defaultValue: 'Settings updated successfully' }))
      setIsEditing(false)
    } catch (error: any) {
      toast.error(t('baselinker.settingsError', { defaultValue: 'Failed to update settings' }))
    }
  }

  const handleDeleteConnection = async () => {
    setShowDisconnectConfirm(true)
  }

  const handleConfirmDisconnect = async () => {
    setShowDisconnectConfirm(false)
    try {
      await deleteConnection.mutateAsync(activeConnection.id)
      toast.success(t('baselinker.disconnectSuccess', { defaultValue: 'BaseLinker disconnected successfully' }))
    } catch (error: any) {
      toast.error(t('baselinker.disconnectError', { defaultValue: 'Failed to disconnect BaseLinker' }))
    }
  }

  const handleSyncStock = async (direction: 'to_baselinker' | 'from_baselinker') => {
    try {
      const result = await syncStock.mutateAsync({ direction })
      toast.success(
        t('baselinker.syncSuccess', { defaultValue: 'Stock synced successfully' }) +
          ` - ${result.updated_count}/${result.total_items}`
      )
    } catch (error: any) {
      toast.error(t('baselinker.syncError', { defaultValue: 'Failed to sync stock' }))
    }
  }

  const handleManualPoll = async () => {
    try {
      const result = await manualPoll.mutateAsync()
      toast.success(result.message || t('baselinker.pollSuccess', { defaultValue: 'Order status poll completed' }))
    } catch (error: any) {
      toast.error(t('baselinker.pollError', { defaultValue: 'Failed to poll order statuses' }))
    }
  }

  return (
    <Container className="divide-y p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 py-4">
        <div>
          <Heading level="h1" className="text-lg sm:text-xl">{t('baselinker.title', { defaultValue: 'BaseLinker Integration' })}</Heading>
          <Text className="text-ui-fg-subtle text-sm sm:text-base">
            {t('baselinker.description', {
              defaultValue: 'Connect your BaseLinker account to import products and sync stock automatically',
            })}
          </Text>
        </div>
        <ConnectionStatusBadge isConnected={true} />
      </div>

      {/* Setup Incomplete Warning */}
      {setupIncomplete && (
        <div className="px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <ExclamationCircle className="w-6 h-6 flex-shrink-0 text-ui-fg-muted hidden sm:block" />
            <div className="flex-1">
              <Text className="font-medium text-sm sm:text-base">
                {t('baselinker.setupIncomplete.title', { defaultValue: 'Setup Incomplete' })}
              </Text>
              <Text className="text-xs sm:text-sm text-ui-fg-subtle">
                {needsStatusMapping && t('baselinker.setupIncomplete.statusMapping', { defaultValue: 'Status mapping is required for fulfillment sync to work. ' })}
                {needsCarrierMapping && t('baselinker.setupIncomplete.carrierMapping', { defaultValue: 'Carrier mapping is recommended for proper tracking. ' })}
              </Text>
            </div>
            <Button size="small" onClick={onStartSetupWizard} className="w-full sm:w-auto">
              {t('baselinker.setupIncomplete.complete', { defaultValue: 'Complete Setup' })}
            </Button>
          </div>
        </div>
      )}

      {/* Connection Section */}
      <div className="px-4 sm:px-6 py-4 sm:py-6">
        <SectionCard
          title={t('baselinker.connectionDetails', { defaultValue: 'Connection Details' })}
          description={t('baselinker.connectedTo', {
            defaultValue: `Connected to inventory ID: ${activeConnection.inventory_id}`,
            id: activeConnection.inventory_id,
          })}
          action={
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="secondary"
                size="small"
                onClick={() => {
                  initializeForm()
                  setIsEditing(true)
                }}
              >
                <PencilSquare className="mr-1" />
                {t('actions.edit', { defaultValue: 'Edit' })}
              </Button>
              <Button variant="secondary" size="small" onClick={handleDeleteConnection}>
                <Trash className="mr-1" />
                {t('baselinker.disconnect', { defaultValue: 'Disconnect' })}
              </Button>
            </div>
          }
        >
          {/* Masked API Token Display */}
          <div className="mb-4 pb-4 border-b border-ui-border-base">
            <Text className="text-xs sm:text-sm text-ui-fg-subtle mb-2">{t('baselinker.apiToken', { defaultValue: 'API Token' })}</Text>
            <div className="flex items-center gap-2 p-2 sm:p-3 bg-ui-bg-subtle border border-ui-border-base rounded-lg">
              <LockClosedSolid className="w-4 h-4 text-ui-fg-muted flex-shrink-0" />
              <Text className="font-mono text-xs sm:text-sm text-ui-fg-muted truncate">••••••••••••••••••••••••</Text>
              <Badge color="green" size="small" className="ml-auto flex-shrink-0">
                {t('baselinker.tokenConfigured', { defaultValue: 'Configured' })}
              </Badge>
            </div>
          </div>

          {isEditing ? (
            <div className="space-y-6">
              <div className="space-y-1 divide-y divide-ui-border-base">
                <SettingToggle
                  label={t('baselinker.productSync', { defaultValue: 'Product Sync' })}
                  description={t('baselinker.productSyncDescription', { defaultValue: 'Enable importing products from BaseLinker' })}
                  checked={formData.product_sync_enabled}
                  onChange={(checked) => setFormData({ ...formData, product_sync_enabled: checked })}
                />
                <SettingToggle
                  label={t('baselinker.stockSync', { defaultValue: 'Stock Sync (Bidirectional)' })}
                  description={t('baselinker.stockSyncDescription', { defaultValue: 'Sync stock quantities both ways between Medusa and BaseLinker' })}
                  checked={formData.stock_sync_enabled}
                  onChange={(checked) => setFormData({ ...formData, stock_sync_enabled: checked })}
                />
                <SettingToggle
                  label={t('baselinker.orderSync', { defaultValue: 'Order Sync' })}
                  description={t('baselinker.orderSyncDescription', { defaultValue: 'Sync orders from Medusa to BaseLinker' })}
                  checked={formData.order_sync_enabled}
                  onChange={(checked) => setFormData({ ...formData, order_sync_enabled: checked })}
                />
                <SettingToggle
                  label={t('baselinker.fulfillmentSync', { defaultValue: 'Fulfillment Sync' })}
                  description={t('baselinker.fulfillmentSyncDescription', { defaultValue: 'Sync fulfillment status changes from BaseLinker back to Medusa' })}
                  checked={formData.fulfillment_sync_enabled}
                  onChange={(checked) => setFormData({ ...formData, fulfillment_sync_enabled: checked })}
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
                <Button variant="secondary" onClick={() => setIsEditing(false)} className="w-full sm:w-auto">
                  {t('actions.cancel', { defaultValue: 'Cancel' })}
                </Button>
                <Button onClick={handleUpdateConnection} isLoading={updateConnection.isPending} className="w-full sm:w-auto">
                  {t('actions.save', { defaultValue: 'Save' })}
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
              <div className="flex items-center justify-between sm:justify-start gap-2">
                <Text className="text-ui-fg-subtle text-xs sm:text-sm">{t('baselinker.productSync', { defaultValue: 'Product Sync' })}:</Text>
                <Badge color={activeConnection.product_sync_enabled ? 'green' : 'grey'} size="small">
                  {activeConnection.product_sync_enabled ? t('baselinker.enabled', { defaultValue: 'Enabled' }) : t('baselinker.disabled', { defaultValue: 'Disabled' })}
                </Badge>
              </div>
              <div className="flex items-center justify-between sm:justify-start gap-2">
                <Text className="text-ui-fg-subtle text-xs sm:text-sm">{t('baselinker.stockSync', { defaultValue: 'Stock Sync' })}:</Text>
                <Badge color={activeConnection.stock_sync_enabled ? 'green' : 'grey'} size="small">
                  {activeConnection.stock_sync_enabled ? t('baselinker.enabled', { defaultValue: 'Enabled' }) : t('baselinker.disabled', { defaultValue: 'Disabled' })}
                </Badge>
              </div>
              <div className="flex items-center justify-between sm:justify-start gap-2">
                <Text className="text-ui-fg-subtle text-xs sm:text-sm">{t('baselinker.orderSync', { defaultValue: 'Order Sync' })}:</Text>
                <Badge color={activeConnection.order_sync_enabled ? 'green' : 'grey'} size="small">
                  {activeConnection.order_sync_enabled ? t('baselinker.enabled', { defaultValue: 'Enabled' }) : t('baselinker.disabled', { defaultValue: 'Disabled' })}
                </Badge>
              </div>
              <div className="flex items-center justify-between sm:justify-start gap-2">
                <Text className="text-ui-fg-subtle text-xs sm:text-sm">{t('baselinker.fulfillmentSync', { defaultValue: 'Fulfillment Sync' })}:</Text>
                <Badge color={activeConnection.fulfillment_sync_enabled ? 'green' : 'grey'} size="small">
                  {activeConnection.fulfillment_sync_enabled ? t('baselinker.enabled', { defaultValue: 'Enabled' }) : t('baselinker.disabled', { defaultValue: 'Disabled' })}
                </Badge>
              </div>
            </div>
          )}
        </SectionCard>
      </div>

      {/* Quick Actions */}
      <div className="px-4 sm:px-6 py-4 sm:py-6">
        <SectionCard
          title={t('baselinker.quickActions', { defaultValue: 'Quick Actions' })}
          description={t('baselinker.quickActionsDescription', { defaultValue: 'Import products and sync data' })}
        >
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
            <SyncActionCard
              title={t('baselinker.importProducts', { defaultValue: 'Import Products' })}
              description={t('baselinker.importProductsDescription', { defaultValue: 'Import products from BaseLinker' })}
              buttonText={t('baselinker.importProducts', { defaultValue: 'Import Products' })}
              onClick={() => navigate('/settings/integrations/baselinker/import')}
              icon={<ArrowUpRightOnBox className="mr-1" />}
            />
            <SyncActionCard
              title={t('baselinker.syncToBaselinker', { defaultValue: 'Sync Stock to BaseLinker' })}
              description={t('baselinker.syncToBaselinkerDescription', { defaultValue: 'Push stock levels to BaseLinker' })}
              buttonText={t('baselinker.sync', { defaultValue: 'Sync' })}
              onClick={() => handleSyncStock('to_baselinker')}
              isLoading={syncStock.isPending}
              icon={<ArrowPath className="mr-1" />}
            />
            <SyncActionCard
              title={t('baselinker.syncFromBaselinker', { defaultValue: 'Sync Stock from BaseLinker' })}
              description={t('baselinker.syncFromBaselinkerDescription', { defaultValue: 'Pull stock levels from BaseLinker' })}
              buttonText={t('baselinker.sync', { defaultValue: 'Sync' })}
              onClick={() => handleSyncStock('from_baselinker')}
              isLoading={syncStock.isPending}
              icon={<ArrowPath className="mr-1" />}
            />
            <SyncActionCard
              title={t('baselinker.pollOrders', { defaultValue: 'Poll Order Statuses' })}
              description={t('baselinker.pollOrdersDescription', { defaultValue: 'Check BaseLinker for order status updates' })}
              buttonText={t('baselinker.poll', { defaultValue: 'Poll' })}
              onClick={handleManualPoll}
              isLoading={manualPoll.isPending}
              icon={<ArrowPath className="mr-1" />}
            />
          </div>
        </SectionCard>
      </div>

      {/* Status Mappings */}
      <div className="px-4 sm:px-6 py-4 sm:py-6">
        <StatusMappingSection />
      </div>

      {/* Carrier Mappings */}
      <div className="px-4 sm:px-6 py-4 sm:py-6">
        <CarrierMappingSection />
      </div>

      {/* Disconnect Confirmation Modal */}
      <Prompt open={showDisconnectConfirm}>
        <Prompt.Content>
          <Prompt.Header>
            <Prompt.Title>
              {t('baselinker.confirmDisconnectTitle', { defaultValue: 'Disconnect BaseLinker' })}
            </Prompt.Title>
            <Prompt.Description>
              {t('baselinker.confirmDeleteMessage', {
                defaultValue: 'Are you sure you want to disconnect BaseLinker? This action cannot be undone.',
              })}
            </Prompt.Description>
          </Prompt.Header>
          <Prompt.Footer>
            <Prompt.Cancel onClick={() => setShowDisconnectConfirm(false)}>
              {t('actions.cancel', { defaultValue: 'Cancel' })}
            </Prompt.Cancel>
            <Prompt.Action onClick={handleConfirmDisconnect}>
              {t('baselinker.disconnect', { defaultValue: 'Disconnect' })}
            </Prompt.Action>
          </Prompt.Footer>
        </Prompt.Content>
      </Prompt>
    </Container>
  )
}

export default Dashboard
