import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Button,
  Label,
  Text,
  Badge,
  Select,
  toast,
} from '@medusajs/ui'
import { PlusMini, Pencil, Trash } from '@medusajs/icons'
import {
  useVariantTemplates,
  useCreateVariantTemplate,
  useUpdateVariantTemplate,
  useDeleteVariantTemplate,
  type VariantTemplate,
  type VariantTemplateOption,
} from '../../../../../../hooks/api/baselinker'
import { VariantTemplateModal } from './variant-template-modal'

interface VariantTemplateSelectorProps {
  onSelectTemplate: (options: Array<{ title: string; values: string[] }>) => void
}

export function VariantTemplateSelector({ onSelectTemplate }: VariantTemplateSelectorProps) {
  const { t } = useTranslation()
  
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<VariantTemplate | null>(null)
  
  const { data: templates, isLoading } = useVariantTemplates()
  const createTemplate = useCreateVariantTemplate()
  const updateTemplate = useUpdateVariantTemplate()
  const deleteTemplate = useDeleteVariantTemplate()
  
  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId)
    const template = templates?.find(t => t.id === templateId)
    if (template) {
      onSelectTemplate(template.options)
      toast.success(t('baselinker.templates.applied', { 
        defaultValue: `Zastosowano szablon "${template.name}"` 
      }))
    }
  }
  
  const handleCreateTemplate = () => {
    setEditingTemplate(null)
    setIsModalOpen(true)
  }
  
  const handleEditTemplate = (template: VariantTemplate) => {
    setEditingTemplate(template)
    setIsModalOpen(true)
  }
  
  const handleDeleteTemplate = async (template: VariantTemplate) => {
    if (!confirm(t('baselinker.templates.confirmDelete', { 
      defaultValue: `Czy na pewno chcesz usunąć szablon "${template.name}"?` 
    }))) {
      return
    }
    
    try {
      await deleteTemplate.mutateAsync(template.id)
      toast.success(t('baselinker.templates.deleted', { defaultValue: 'Szablon usunięty' }))
      if (selectedTemplateId === template.id) {
        setSelectedTemplateId('')
      }
    } catch (error: any) {
      toast.error(error.message || t('baselinker.templates.deleteError', { defaultValue: 'Błąd usuwania szablonu' }))
    }
  }
  
  const handleSaveTemplate = async (data: { name: string; description?: string; options: VariantTemplateOption[] }) => {
    try {
      if (editingTemplate) {
        await updateTemplate.mutateAsync({
          id: editingTemplate.id,
          ...data,
        })
        toast.success(t('baselinker.templates.updated', { defaultValue: 'Szablon zaktualizowany' }))
      } else {
        await createTemplate.mutateAsync(data)
        toast.success(t('baselinker.templates.created', { defaultValue: 'Szablon utworzony' }))
      }
      setIsModalOpen(false)
      setEditingTemplate(null)
    } catch (error: any) {
      toast.error(error.message || t('baselinker.templates.saveError', { defaultValue: 'Błąd zapisywania szablonu' }))
    }
  }
  
  const selectedTemplate = templates?.find(t => t.id === selectedTemplateId)
  
  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label weight="plus" className="text-base">
            {t('baselinker.templates.title', { defaultValue: 'Szablony wariantów' })}
          </Label>
          <Text className="text-sm text-ui-fg-subtle mt-1">
            {t('baselinker.templates.subtitle', { 
              defaultValue: 'Wybierz szablon, aby szybko wypełnić opcje wariantów' 
            })}
          </Text>
        </div>
        <Button
          size="small"
          variant="secondary"
          onClick={handleCreateTemplate}
        >
          <PlusMini className="mr-1" />
          {t('baselinker.templates.new', { defaultValue: 'Nowy szablon' })}
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <svg 
            className="h-5 w-5 animate-spin text-ui-fg-muted" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : templates && templates.length > 0 ? (
        <div className="flex flex-col gap-y-3">
          {/* Template selector dropdown */}
          <Select value={selectedTemplateId} onValueChange={handleSelectTemplate}>
            <Select.Trigger>
              <Select.Value placeholder={t('baselinker.templates.selectPlaceholder', { defaultValue: 'Wybierz szablon...' })} />
            </Select.Trigger>
            <Select.Content>
              {templates.map((template) => (
                <Select.Item key={template.id} value={template.id}>
                  <div className="flex items-center gap-2">
                    <span>{template.name}</span>
                    <Badge size="2xsmall" color="grey">
                      {template.options.length} {template.options.length === 1 ? 'opcja' : 'opcji'}
                    </Badge>
                  </div>
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
          
          {/* Selected template preview */}
          {selectedTemplate && (
            <div className="bg-ui-bg-subtle rounded-lg p-3 border border-ui-border-base">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <Text className="font-medium">{selectedTemplate.name}</Text>
                  {selectedTemplate.description && (
                    <Text className="text-sm text-ui-fg-subtle">{selectedTemplate.description}</Text>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="small"
                    variant="transparent"
                    onClick={() => handleEditTemplate(selectedTemplate)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="small"
                    variant="transparent"
                    onClick={() => handleDeleteTemplate(selectedTemplate)}
                  >
                    <Trash className="h-4 w-4 text-ui-fg-error" />
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedTemplate.options.map((option, index) => (
                  <div key={index} className="text-sm">
                    <span className="font-medium">{option.title}:</span>{' '}
                    <span className="text-ui-fg-subtle">{option.values.join(', ')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Template list for management */}
          <details className="mt-2">
            <summary className="text-sm text-ui-fg-subtle cursor-pointer hover:text-ui-fg-base">
              {t('baselinker.templates.manageAll', { defaultValue: 'Zarządzaj wszystkimi szablonami' })} ({templates.length})
            </summary>
            <div className="mt-2 flex flex-col gap-y-2">
              {templates.map((template) => (
                <div 
                  key={template.id} 
                  className="flex items-center justify-between p-2 bg-ui-bg-component rounded-lg border border-ui-border-base"
                >
                  <div className="flex items-center gap-2">
                    <Text className="font-medium">{template.name}</Text>
                    <Badge size="2xsmall" color="grey">
                      {template.options.length} opcji
                    </Badge>
                    {template.usage_count > 0 && (
                      <Badge size="2xsmall" color="blue">
                        użyto {template.usage_count}x
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="small"
                      variant="transparent"
                      onClick={() => handleEditTemplate(template)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="small"
                      variant="transparent"
                      onClick={() => handleDeleteTemplate(template)}
                    >
                      <Trash className="h-4 w-4 text-ui-fg-error" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </details>
        </div>
      ) : (
        <div className="text-center py-4 bg-ui-bg-subtle rounded-lg border border-ui-border-base">
          <Text className="text-ui-fg-muted mb-2">
            {t('baselinker.templates.noTemplates', { defaultValue: 'Brak szablonów wariantów' })}
          </Text>
          <Text className="text-sm text-ui-fg-subtle">
            {t('baselinker.templates.createFirst', { 
              defaultValue: 'Utwórz szablon, aby szybko przypisywać opcje wariantów do produktów' 
            })}
          </Text>
        </div>
      )}
      
      {/* Template Modal */}
      <VariantTemplateModal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingTemplate(null)
        }}
        onSave={handleSaveTemplate}
        template={editingTemplate}
        isSaving={createTemplate.isPending || updateTemplate.isPending}
      />
    </div>
  )
}
