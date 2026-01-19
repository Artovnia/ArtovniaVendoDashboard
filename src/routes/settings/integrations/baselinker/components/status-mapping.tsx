import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Heading, Text, Badge, toast } from '@medusajs/ui'
import { Plus, Trash, PencilSquare } from '@medusajs/icons'
import {
  useStatusMappings,
  useCreateStatusMapping,
  useUpdateStatusMapping,
  useDeleteStatusMapping,
  StatusMapping,
  BaseLinkerStatus,
} from '../../../../../hooks/api/baselinker'

// Action keys for i18n
const MEDUSA_ACTION_KEYS = [
  'none',
  'create_fulfillment',
  'create_shipment',
  'mark_delivered',
  'cancel_order',
] as const

interface StatusMappingRowProps {
  mapping: StatusMapping
  statuses: BaseLinkerStatus[]
  onUpdate: (id: string, data: any) => void
  onDelete: (id: string) => void
  isUpdating: boolean
}

function StatusMappingRow({ mapping, statuses, onUpdate, onDelete, isUpdating }: StatusMappingRowProps) {
  const { t } = useTranslation()
  const [isEditing, setIsEditing] = useState(false)
  const [action, setAction] = useState(mapping.medusa_action)
  
  const blStatus = statuses.find(s => s.id === mapping.bl_status_id)
  
  const getActionLabel = (actionKey: string): string => {
    return t(`baselinker.statusMapping.actions.${actionKey}`, { defaultValue: actionKey }) as string
  }
  
  const handleSave = () => {
    onUpdate(mapping.id, { medusa_action: action })
    setIsEditing(false)
  }

  return (
    <tr className="border-b border-ui-border-base">
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          {blStatus && (
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: blStatus.color || '#888' }}
            />
          )}
          <Text className="font-medium">
            {mapping.bl_status_name || blStatus?.name || `Status ${mapping.bl_status_id}`}
          </Text>
        </div>
        <Text className="text-xs text-ui-fg-muted">ID: {mapping.bl_status_id}</Text>
      </td>
      <td className="py-3 px-4">
        {isEditing ? (
          <select
            value={action}
            onChange={(e) => setAction(e.target.value as any)}
            className="w-full rounded-md border border-ui-border-base px-2 py-1 text-sm"
          >
            {MEDUSA_ACTION_KEYS.map((key) => (
              <option key={key} value={key}>
                {getActionLabel(key)}
              </option>
            ))}
          </select>
        ) : (
          <Badge color={mapping.medusa_action === 'none' ? 'grey' : 'green'}>
            {getActionLabel(mapping.medusa_action)}
          </Badge>
        )}
      </td>
      <td className="py-3 px-4">
        <Badge color={mapping.is_active ? 'green' : 'grey'}>
          {mapping.is_active 
            ? t('baselinker.active', { defaultValue: 'Active' }) 
            : t('baselinker.inactive', { defaultValue: 'Inactive' })}
        </Badge>
      </td>
      <td className="py-3 px-4">
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button size="small" onClick={handleSave} isLoading={isUpdating}>
                {t('actions.save', { defaultValue: 'Save' })}
              </Button>
              <Button size="small" variant="secondary" onClick={() => setIsEditing(false)}>
                {t('actions.cancel', { defaultValue: 'Cancel' })}
              </Button>
            </>
          ) : (
            <>
              <Button size="small" variant="secondary" onClick={() => setIsEditing(true)}>
                <PencilSquare className="w-4 h-4" />
              </Button>
              <Button
                size="small"
                variant="secondary"
                onClick={() => {
                  if (confirm(t('baselinker.statusMapping.confirmDelete', { defaultValue: 'Delete this mapping?' }))) {
                    onDelete(mapping.id)
                  }
                }}
              >
                <Trash className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </td>
    </tr>
  )
}

interface AddMappingFormProps {
  statuses: BaseLinkerStatus[]
  existingMappings: StatusMapping[]
  onAdd: (data: any) => void
  onCancel: () => void
  isAdding: boolean
}

function AddMappingForm({ statuses, existingMappings, onAdd, onCancel, isAdding }: AddMappingFormProps) {
  const { t } = useTranslation()
  const [selectedStatus, setSelectedStatus] = useState<number | null>(null)
  const [action, setAction] = useState('none')

  // Filter out statuses that already have mappings
  const existingStatusIds = new Set(existingMappings.map(m => m.bl_status_id))
  const availableStatuses = statuses.filter(s => !existingStatusIds.has(s.id))

  const getActionLabel = (actionKey: string): string => {
    return t(`baselinker.statusMapping.actions.${actionKey}`, { defaultValue: actionKey }) as string
  }

  const handleSubmit = () => {
    if (!selectedStatus) return
    const status = statuses.find(s => s.id === selectedStatus)
    onAdd({
      bl_status_id: selectedStatus,
      bl_status_name: status?.name,
      medusa_action: action,
    })
  }

  return (
    <div className="flex items-center gap-4 p-4 bg-ui-bg-subtle rounded-lg">
      <div className="flex-1">
        <label className="block text-sm font-medium mb-1">
          {t('baselinker.statusMapping.baselinkerStatus', { defaultValue: 'BaseLinker Status' })}
        </label>
        <select
          value={selectedStatus || ''}
          onChange={(e) => setSelectedStatus(Number(e.target.value))}
          className="w-full rounded-md border border-ui-border-base px-3 py-2"
        >
          <option value="">{t('baselinker.statusMapping.selectStatus', { defaultValue: 'Select a status...' })}</option>
          {availableStatuses.map((status) => (
            <option key={status.id} value={status.id}>
              {status.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex-1">
        <label className="block text-sm font-medium mb-1">
          {t('baselinker.statusMapping.medusaAction', { defaultValue: 'Medusa Action' })}
        </label>
        <select
          value={action}
          onChange={(e) => setAction(e.target.value)}
          className="w-full rounded-md border border-ui-border-base px-3 py-2"
        >
          {MEDUSA_ACTION_KEYS.map((key) => (
            <option key={key} value={key}>
              {getActionLabel(key)}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-2 pt-6">
        <Button onClick={handleSubmit} disabled={!selectedStatus} isLoading={isAdding}>
          {t('actions.add', { defaultValue: 'Add' })}
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          {t('actions.cancel', { defaultValue: 'Cancel' })}
        </Button>
      </div>
    </div>
  )
}

export function StatusMappingSection() {
  const { t } = useTranslation()
  const [showAddForm, setShowAddForm] = useState(false)
  
  const { data, isLoading, refetch } = useStatusMappings()
  const createMapping = useCreateStatusMapping()
  const updateMapping = useUpdateStatusMapping()
  const deleteMapping = useDeleteStatusMapping()

  // Refetch on mount to ensure we have fresh data after connection creation
  useEffect(() => {
    refetch()
  }, [refetch])

  const mappings = data?.mappings || []
  const statuses = data?.statuses || []

  const handleAdd = async (mappingData: any) => {
    try {
      await createMapping.mutateAsync(mappingData)
      toast.success(t('baselinker.statusMapping.created', { defaultValue: 'Status mapping created' }))
      setShowAddForm(false)
    } catch (error: any) {
      toast.error(t('baselinker.statusMapping.createError', { defaultValue: 'Failed to create mapping' }))
    }
  }

  const handleUpdate = async (id: string, data: any) => {
    try {
      await updateMapping.mutateAsync({ id, ...data })
      toast.success(t('baselinker.statusMapping.updated', { defaultValue: 'Status mapping updated' }))
    } catch (error: any) {
      toast.error(t('baselinker.statusMapping.updateError', { defaultValue: 'Failed to update mapping' }))
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteMapping.mutateAsync(id)
      toast.success(t('baselinker.statusMapping.deleted', { defaultValue: 'Status mapping deleted' }))
    } catch (error: any) {
      toast.error(t('baselinker.statusMapping.deleteError', { defaultValue: 'Failed to delete mapping' }))
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border border-ui-border-base p-6">
        <Text>{t('baselinker.statusMapping.loading', { defaultValue: 'Loading status mappings...' })}</Text>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-ui-border-base p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <Heading level="h3">{t('baselinker.statusMapping.title', { defaultValue: 'Status Mappings' })}</Heading>
          <Text className="text-sm text-ui-fg-subtle">
            {t('baselinker.statusMapping.description', { defaultValue: 'Map BaseLinker order statuses to Medusa fulfillment actions' })}
          </Text>
        </div>
        {!showAddForm && (
          <Button size="small" onClick={() => setShowAddForm(true)}>
            <Plus className="w-4 h-4" />
            {t('baselinker.statusMapping.addMapping', { defaultValue: 'Add Mapping' })}
          </Button>
        )}
      </div>

      {showAddForm && (
        <div className="mb-4">
          <AddMappingForm
            statuses={statuses}
            existingMappings={mappings}
            onAdd={handleAdd}
            onCancel={() => setShowAddForm(false)}
            isAdding={createMapping.isPending}
          />
        </div>
      )}

      {mappings.length === 0 ? (
        <div className="text-center py-8 bg-ui-bg-subtle rounded-lg">
          <Text className="text-ui-fg-muted">
            {t('baselinker.statusMapping.noMappings', { defaultValue: 'No status mappings configured' })}
          </Text>
          <Text className="text-sm text-ui-fg-muted mt-1">
            {t('baselinker.statusMapping.noMappingsHint', { defaultValue: 'Add mappings to automatically sync order status changes from BaseLinker' })}
          </Text>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-ui-border-base bg-ui-bg-subtle">
                <th className="text-left py-2 px-4 text-sm font-medium">
                  {t('baselinker.statusMapping.baselinkerStatus', { defaultValue: 'BaseLinker Status' })}
                </th>
                <th className="text-left py-2 px-4 text-sm font-medium">
                  {t('baselinker.statusMapping.medusaAction', { defaultValue: 'Medusa Action' })}
                </th>
                <th className="text-left py-2 px-4 text-sm font-medium">
                  {t('baselinker.status', { defaultValue: 'Status' })}
                </th>
                <th className="text-left py-2 px-4 text-sm font-medium">
                  {t('actions.title', { defaultValue: 'Actions' })}
                </th>
              </tr>
            </thead>
            <tbody>
              {mappings.map((mapping) => (
                <StatusMappingRow
                  key={mapping.id}
                  mapping={mapping}
                  statuses={statuses}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                  isUpdating={updateMapping.isPending}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 p-4 bg-ui-bg-subtle rounded-lg">
        <Text className="text-sm font-medium mb-2">
          {t('baselinker.statusMapping.howItWorks', { defaultValue: 'How it works:' })}
        </Text>
        <ul className="text-sm text-ui-fg-subtle space-y-1">
          <li>• {t('baselinker.statusMapping.hint1', { defaultValue: 'Create Fulfillment: When order is marked as packed in BaseLinker' })}</li>
          <li>• {t('baselinker.statusMapping.hint2', { defaultValue: 'Create Shipment: When order is marked as shipped in BaseLinker' })}</li>
          <li>• {t('baselinker.statusMapping.hint3', { defaultValue: 'Mark as Delivered: When order is marked as delivered in BaseLinker' })}</li>
          <li>• {t('baselinker.statusMapping.hint4', { defaultValue: 'Cancel Order: When order is canceled in BaseLinker' })}</li>
        </ul>
      </div>
    </div>
  )
}

export default StatusMappingSection
