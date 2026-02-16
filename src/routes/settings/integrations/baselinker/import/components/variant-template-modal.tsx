import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Button,
  Heading,
  Input,
  Label,
  Text,
  IconButton,
  FocusModal,
  Hint,
  Textarea,
} from '@medusajs/ui'
import { XMarkMini } from '@medusajs/icons'
import { ChipInput } from '../../../../../../components/inputs/chip-input'
import type { VariantTemplate, VariantTemplateOption } from '../../../../../../hooks/api/baselinker'

interface VariantTemplateModalProps {
  open: boolean
  onClose: () => void
  onSave: (data: { name: string; description?: string; options: VariantTemplateOption[] }) => void
  template?: VariantTemplate | null
  isSaving?: boolean
}

export function VariantTemplateModal({
  open,
  onClose,
  onSave,
  template,
  isSaving,
}: VariantTemplateModalProps) {
  const { t } = useTranslation()
  
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [options, setOptions] = useState<Array<{ title: string; values: string[] }>>([
    { title: '', values: [] }
  ])
  
  // Initialize state when template changes (for editing)
  useEffect(() => {
    if (template) {
      setName(template.name)
      setDescription(template.description || '')
      setOptions(template.options.length > 0 ? [...template.options] : [{ title: '', values: [] }])
    } else {
      setName('')
      setDescription('')
      setOptions([{ title: '', values: [] }])
    }
  }, [template, open])
  
  const addOption = () => {
    setOptions([...options, { title: '', values: [] }])
  }
  
  const removeOption = (index: number) => {
    if (index === 0 && options.length === 1) return
    setOptions(options.filter((_, i) => i !== index))
  }
  
  const updateOptionTitle = (index: number, title: string) => {
    const newOptions = [...options]
    newOptions[index] = { ...newOptions[index], title }
    setOptions(newOptions)
  }
  
  const handleOptionValuesChange = (index: number, values: string[]) => {
    const newOptions = [...options]
    newOptions[index] = { ...newOptions[index], values }
    setOptions(newOptions)
  }
  
  const handleSave = () => {
    const validOptions = options.filter(o => o.title && o.values.length > 0)
    if (!name || validOptions.length === 0) return
    
    onSave({
      name,
      description: description || undefined,
      options: validOptions,
    })
  }
  
  const isValid = name && options.some(o => o.title && o.values.length > 0)
  
  return (
    <FocusModal open={open} onOpenChange={(isOpen: boolean) => !isOpen && onClose()}>
      <FocusModal.Content className="max-w-2xl">
        <FocusModal.Header>
          <Heading level="h1">
            {template 
              ? t('baselinker.templates.editTemplate', { defaultValue: 'Edytuj szablon wariantów' })
              : t('baselinker.templates.createTemplate', { defaultValue: 'Utwórz szablon wariantów' })
            }
          </Heading>
        </FocusModal.Header>
        
        <FocusModal.Body className="flex flex-col gap-y-6 p-4 md:p-6 overflow-y-auto">
          {/* Template Name */}
          <div className="flex flex-col gap-y-2">
            <Label weight="plus">
              {t('baselinker.templates.name', { defaultValue: 'Nazwa szablonu' })}
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('baselinker.templates.namePlaceholder', { defaultValue: 'np. Rozmiary odzieży' })}
            />
          </div>
          
          {/* Description */}
          <div className="flex flex-col gap-y-2">
            <Label weight="plus">
              {t('baselinker.templates.description', { defaultValue: 'Opis (opcjonalnie)' })}
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('baselinker.templates.descriptionPlaceholder', { defaultValue: 'Krótki opis szablonu...' })}
              rows={2}
            />
          </div>
          
          {/* Options */}
          <div className="flex flex-col gap-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label weight="plus" className="text-base">
                  {t('baselinker.templates.options', { defaultValue: 'Opcje produktu' })}
                </Label>
                <Hint className="mt-1">
                  {t('baselinker.templates.optionsHint', { 
                    defaultValue: 'Zdefiniuj opcje (np. Rozmiar, Kolor) i ich możliwe wartości.' 
                  })}
                </Hint>
              </div>
              <Button
                size="small"
                variant="secondary"
                type="button"
                onClick={addOption}
              >
                {t('actions.add', { defaultValue: 'Dodaj' })}
              </Button>
            </div>
            
            <ul className="flex flex-col gap-y-4">
              {options.map((option, index) => (
                <li
                  key={index}
                  className="bg-ui-bg-component shadow-elevation-card-rest grid grid-cols-[1fr_28px] items-center gap-1.5 rounded-xl p-1.5"
                >
                  <div className="grid grid-cols-1 md:grid-cols-[min-content,1fr] items-center gap-1.5">
                    <div className="flex items-center px-2 py-1.5">
                      <Label
                        size="xsmall"
                        weight="plus"
                        className="text-ui-fg-subtle whitespace-nowrap"
                      >
                        {t('fields.title', { defaultValue: 'Nazwa' })}
                      </Label>
                    </div>
                    <Input
                      className="bg-ui-bg-field-component hover:bg-ui-bg-field-component-hover"
                      value={option.title}
                      onChange={(e) => updateOptionTitle(index, e.target.value)}
                      placeholder={t('baselinker.import.optionTitlePlaceholder', { defaultValue: 'np. Rozmiar, Kolor' })}
                    />
                    <div className="flex items-center px-2 py-1.5">
                      <Label
                        size="xsmall"
                        weight="plus"
                        className="text-ui-fg-subtle whitespace-nowrap"
                      >
                        {t('fields.values', { defaultValue: 'Wartości' })}
                      </Label>
                    </div>
                    <ChipInput
                      value={option.values}
                      onChange={(values) => handleOptionValuesChange(index, values)}
                      variant="contrast"
                      placeholder={t('baselinker.import.optionValuesPlaceholder', { defaultValue: 'Wpisz wartość i naciśnij Enter' })}
                    />
                  </div>
                  <IconButton
                    type="button"
                    size="small"
                    variant="transparent"
                    className="text-ui-fg-muted self-start md:self-center"
                    disabled={index === 0 && options.length === 1}
                    onClick={() => removeOption(index)}
                  >
                    <XMarkMini />
                  </IconButton>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Info tip */}
          <div className="bg-ui-bg-subtle rounded-lg p-4 border border-ui-border-base">
            <Text className="font-medium text-ui-fg-base mb-2">
              💡 {t('baselinker.templates.howItWorks', { defaultValue: 'Jak to działa' })}
            </Text>
            <ul className="text-sm text-ui-fg-subtle space-y-1 list-disc list-inside">
              <li>{t('baselinker.templates.tip1', { defaultValue: 'Szablony pozwalają szybko przypisać opcje wariantów do produktów' })}</li>
              <li>{t('baselinker.templates.tip2', { defaultValue: 'Wybierz szablon podczas importu, aby automatycznie wypełnić opcje' })}</li>
              <li>{t('baselinker.templates.tip3', { defaultValue: 'Możesz mieć wiele szablonów dla różnych typów produktów' })}</li>
            </ul>
          </div>
        </FocusModal.Body>
        
        <FocusModal.Footer>
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="secondary" onClick={onClose}>
              {t('actions.cancel', { defaultValue: 'Anuluj' })}
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!isValid || isSaving}
              isLoading={isSaving}
            >
              {template 
                ? t('actions.save', { defaultValue: 'Zapisz' })
                : t('actions.create', { defaultValue: 'Utwórz' })
              }
            </Button>
          </div>
        </FocusModal.Footer>
      </FocusModal.Content>
    </FocusModal>
  )
}
