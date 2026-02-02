import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Button,
  Heading,
  Input,
  Label,
  Text,
  Badge,
  IconButton,
  FocusModal,
  Hint,
  clx,
} from '@medusajs/ui'
import { XMarkMini } from '@medusajs/icons'
import { ChipInput } from '../../../../../../components/inputs/chip-input'
import type { VariantGroup } from '../../../../../../types/baselinker'

interface VariantGroupingModalProps {
  open: boolean
  onClose: () => void
  group: VariantGroup
  onSave: (updatedGroup: VariantGroup) => void
}

export function VariantGroupingModal({
  open,
  onClose,
  group,
  onSave,
}: VariantGroupingModalProps) {
  const { t } = useTranslation()
  
  // Local state for editing - matches product-create-details-variant-section pattern
  const [options, setOptions] = useState<Array<{ title: string; values: string[] }>>([])
  const [memberOptionValues, setMemberOptionValues] = useState<Record<string, Record<string, string>>>({})
  
  // Initialize state when group changes
  useEffect(() => {
    if (group) {
      // Initialize options - if group has options, use them; otherwise create empty first option
      if (group.options && group.options.length > 0) {
        setOptions([...group.options])
      } else {
        setOptions([{ title: '', values: [] }])
      }
      
      // Initialize member option values
      const initialValues: Record<string, Record<string, string>> = {}
      group.members.forEach((member) => {
        initialValues[member.product.id] = { ...member.optionValues }
      })
      setMemberOptionValues(initialValues)
    }
  }, [group])
  
  // Add new option
  const addOption = () => {
    setOptions([...options, { title: '', values: [] }])
  }
  
  // Remove option by index
  const removeOption = (index: number) => {
    if (index === 0) return // Can't remove first option
    
    const removedTitle = options[index].title
    const newOptions = options.filter((_, i) => i !== index)
    setOptions(newOptions)
    
    // Remove this option from all member values
    if (removedTitle) {
      const newMemberValues = { ...memberOptionValues }
      Object.keys(newMemberValues).forEach((productId) => {
        const { [removedTitle]: _, ...rest } = newMemberValues[productId]
        newMemberValues[productId] = rest
      })
      setMemberOptionValues(newMemberValues)
    }
  }
  
  // Update option title
  const updateOptionTitle = (index: number, newTitle: string) => {
    const oldTitle = options[index].title
    const newOptions = [...options]
    newOptions[index] = { ...newOptions[index], title: newTitle }
    setOptions(newOptions)
    
    // Update member values to use new option title
    if (oldTitle && oldTitle !== newTitle) {
      const newMemberValues = { ...memberOptionValues }
      Object.keys(newMemberValues).forEach((productId) => {
        if (newMemberValues[productId][oldTitle] !== undefined) {
          newMemberValues[productId][newTitle] = newMemberValues[productId][oldTitle]
          delete newMemberValues[productId][oldTitle]
        }
      })
      setMemberOptionValues(newMemberValues)
    }
  }
  
  // Handle option values change via ChipInput - this is the key pattern from product-create
  const handleOptionValuesChange = (index: number, values: string[]) => {
    const newOptions = [...options]
    newOptions[index] = { ...newOptions[index], values }
    setOptions(newOptions)
  }
  
  // Update member's option value (for the variant assignment table)
  const updateMemberOptionValue = (productId: string, optionTitle: string, value: string) => {
    setMemberOptionValues((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [optionTitle]: value,
      },
    }))
    
    // Also add to option's values array if new
    const optionIndex = options.findIndex((o) => o.title === optionTitle)
    if (optionIndex !== -1 && value && !options[optionIndex].values.includes(value)) {
      const newOptions = [...options]
      newOptions[optionIndex] = {
        ...newOptions[optionIndex],
        values: [...newOptions[optionIndex].values, value],
      }
      setOptions(newOptions)
    }
  }
  
  // Check for duplicate option value combinations
  const getDuplicateVariants = () => {
    const variantCombinations = new Map<string, string[]>()
    
    group.members.forEach((member) => {
      const values = memberOptionValues[member.product.id] || {}
      const optionValues = options
        .filter((o) => o.title && values[o.title])
        .map((o) => `${o.title}:${values[o.title]}`)
        .sort()
        .join('|')
      
      if (optionValues) {
        if (!variantCombinations.has(optionValues)) {
          variantCombinations.set(optionValues, [])
        }
        variantCombinations.get(optionValues)!.push(member.product.id)
      }
    })
    
    // Return product IDs that have duplicate combinations
    const duplicates = new Set<string>()
    variantCombinations.forEach((productIds) => {
      if (productIds.length > 1) {
        productIds.forEach((id) => duplicates.add(id))
      }
    })
    
    return duplicates
  }
  
  const duplicateVariants = getDuplicateVariants()
  
  // Save configuration
  const handleSave = () => {
    // Check for duplicates before saving
    if (duplicateVariants.size > 0) {
      return // Don't save if there are duplicates
    }
    
    // Collect all unique values for each option from member assignments
    const finalOptions = options.map((option) => {
      const allValues = new Set<string>(option.values)
      Object.values(memberOptionValues).forEach((values) => {
        if (values[option.title]) {
          allValues.add(values[option.title])
        }
      })
      return {
        title: option.title,
        values: Array.from(allValues),
      }
    }).filter((o) => o.title && o.values.length > 0)
    
    // Build updated members with option values
    const updatedMembers = group.members.map((member) => ({
      ...member,
      optionValues: memberOptionValues[member.product.id] || {},
    }))
    
    // Check if all members have values for all options
    const isConfigured = finalOptions.length > 0 && updatedMembers.every((member) =>
      finalOptions.every((option) => member.optionValues[option.title])
    )
    
    onSave({
      ...group,
      options: finalOptions,
      members: updatedMembers,
      isConfigured,
    })
    
    onClose()
  }
  
  // Get variant name preview
  const getVariantNamePreview = (productId: string) => {
    const values = memberOptionValues[productId] || {}
    const optionValues = options
      .filter((o) => o.title && values[o.title])
      .map((o) => values[o.title])
    
    if (optionValues.length === 0) return null
    return optionValues.join(' / ')
  }
  
  // Check if configuration is valid
  const hasValidOptions = options.some((o) => o.title && o.values.length > 0)
  const hasDuplicates = duplicateVariants.size > 0
  
  if (!group) return null
  
  return (
    <FocusModal open={open} onOpenChange={(isOpen: boolean) => !isOpen && onClose()}>
      <FocusModal.Content className="max-w-6xl w-[95vw]">
        <FocusModal.Header>
          <div className="flex flex-col">
            <Heading level="h1">
              {t('baselinker.import.configureVariants', { defaultValue: 'Konfiguruj warianty produktu' })}
            </Heading>
            <Text className="text-ui-fg-subtle mt-1">
              {group.name}
            </Text>
          </div>
        </FocusModal.Header>
        
        <FocusModal.Body className="flex flex-col gap-y-8 p-4 md:p-6 overflow-y-auto">
          {/* Section 1: Product Options - matching product-create-details-variant-section style */}
          <div className="flex flex-col gap-y-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex flex-col">
                <Label weight="plus" className="text-base">
                  {t('baselinker.import.productOptions', { defaultValue: 'Opcje produktu' })}
                </Label>
                <Hint className="mt-1">
                  {t('baselinker.import.optionsHint', { 
                    defaultValue: 'Zdefiniuj opcje (np. Rozmiar, Kolor) i ich możliwe wartości. Następnie przypisz wartości do każdego produktu.' 
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
            
            {/* Options list - matching product-create style */}
            <ul className="flex flex-col gap-y-4">
              {options.map((option, index) => (
                <li
                  key={index}
                  className="bg-ui-bg-component shadow-elevation-card-rest grid grid-cols-1 md:grid-cols-[1fr_28px] items-center gap-1.5 rounded-xl p-1.5"
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
                    disabled={index === 0}
                    onClick={() => removeOption(index)}
                  >
                    <XMarkMini />
                  </IconButton>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Section 2: Variant Assignment */}
          <div className="flex flex-col gap-y-6">
            <div className="flex flex-col">
              <Label weight="plus" className="text-base">
                {t('baselinker.import.assignVariants', { defaultValue: 'Przypisz warianty' })}
              </Label>
              <Hint className="mt-1">
                {t('baselinker.import.assignVariantsHint', { 
                  defaultValue: 'Dla każdego produktu z BaseLinker wybierz wartość opcji. Produkty zostaną zaimportowane jako warianty jednego produktu.' 
                })}
              </Hint>
            </div>
            
            {/* Products list - card-based for mobile */}
            <div className="flex flex-col gap-y-3">
              {group.members.map((member, memberIndex) => (
                <div
                  key={member.product.id}
                  className={clx(
                    "bg-ui-bg-component rounded-xl border border-ui-border-base p-4",
                    memberIndex % 2 === 0 ? "bg-ui-bg-base" : "bg-ui-bg-subtle"
                  )}
                >
                  {/* Product info - full width, no truncation */}
                  <div className="flex flex-col md:flex-row md:items-start gap-4 mb-4">
                    <div className="flex-1 min-w-0">
                      <Text className="font-medium text-ui-fg-base break-words">
                        {member.product.name}
                      </Text>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                        <Text className="text-sm text-ui-fg-subtle">
                          SKU: <span className="font-mono">{member.product.sku || '-'}</span>
                        </Text>
                        <Text className="text-sm text-ui-fg-subtle">
                          {t('baselinker.import.price', { defaultValue: 'Cena' })}: <span className="font-medium text-ui-fg-base">{member.product.price.toFixed(2)} zł</span>
                        </Text>
                        <Text className="text-sm text-ui-fg-subtle">
                          {t('baselinker.import.stock', { defaultValue: 'Stan' })}: <span className="font-medium text-ui-fg-base">{member.product.quantity || 0}</span>
                        </Text>
                      </div>
                    </div>
                    
                    {/* Variant name preview */}
                    {getVariantNamePreview(member.product.id) && (
                      <Badge color="green" className="shrink-0">
                        {getVariantNamePreview(member.product.id)}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Option value inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {options.filter((o) => o.title).map((option, optionIndex) => (
                      <div key={optionIndex} className="flex flex-col gap-1">
                        <Label size="xsmall" className="text-ui-fg-subtle">
                          {option.title}
                        </Label>
                        {option.values.length > 0 ? (
                          <select
                            className={clx(
                              "border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2",
                              duplicateVariants.has(member.product.id)
                                ? "border-red-500 focus:ring-red-500 bg-ui-bg-error"
                                : "border-ui-border-base focus:ring-ui-fg-interactive"
                            )}
                            value={memberOptionValues[member.product.id]?.[option.title] || ''}
                            onChange={(e) => updateMemberOptionValue(member.product.id, option.title, e.target.value)}
                          >
                            <option value="">
                              {t('baselinker.import.selectValue', { defaultValue: 'Wybierz wartość...' })}
                            </option>
                            {option.values.map((value, valueIndex) => (
                              <option key={valueIndex} value={value}>
                                {value}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <Input
                            size="small"
                            placeholder={t('baselinker.import.enterValue', { defaultValue: 'Wpisz wartość...' })}
                            value={memberOptionValues[member.product.id]?.[option.title] || ''}
                            onChange={(e) => updateMemberOptionValue(member.product.id, option.title, e.target.value)}
                            className={clx(
                              duplicateVariants.has(member.product.id) && "border-red-500 focus:ring-red-500 bg-ui-bg-error"
                            )}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* Duplicate warning for this variant */}
                  {duplicateVariants.has(member.product.id) && (
                    <div className="mt-2 p-2 bg-ui-bg-error border border-ui-border-error rounded-lg">
                      <Text className="text-sm text-red-600">
                        ⚠️ {t('baselinker.import.duplicateVariantWarning', { 
                          defaultValue: 'Ta kombinacja opcji jest już użyta w innym wariancie. Każdy wariant musi mieć unikalną kombinację wartości.' 
                        })}
                      </Text>
                    </div>
                  )}
                  
                  {/* Show message if no options defined yet */}
                  {options.filter((o) => o.title).length === 0 && (
                    <Text className="text-sm text-ui-fg-muted italic">
                      {t('baselinker.import.defineOptionsFirst', { defaultValue: 'Najpierw zdefiniuj opcje produktu powyżej' })}
                    </Text>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Duplicate variants error */}
          {hasDuplicates && (
            <div className="bg-ui-bg-error rounded-lg p-4 border border-ui-border-error">
              <Text className="font-medium text-red-600 mb-2">
                ⚠️ {t('baselinker.import.duplicateVariantsError', { 
                  defaultValue: 'Znaleziono duplikaty kombinacji opcji' 
                })}
              </Text>
              <Text className="text-sm text-red-600">
                {t('baselinker.import.duplicateVariantsErrorDesc', { 
                  defaultValue: 'Każdy wariant musi mieć unikalną kombinację wartości opcji. Popraw zaznaczone warianty przed zapisaniem.' 
                })}
              </Text>
            </div>
          )}
          
          {/* Info tip */}
          <div className="bg-ui-bg-subtle rounded-lg p-4 border border-ui-border-base">
            <Text className="font-medium text-ui-fg-base mb-2">
              💡 {t('baselinker.import.howItWorks', { defaultValue: 'Jak to działa' })}
            </Text>
            <ul className="text-sm text-ui-fg-subtle space-y-1 list-disc list-inside">
              <li>{t('baselinker.import.tip1', { defaultValue: 'Produkty zostaną zaimportowane jako jeden produkt z wariantami' })}</li>
              <li>{t('baselinker.import.tip2', { defaultValue: 'Każdy wariant zachowa swoją cenę, stan magazynowy i SKU' })}</li>
              <li>{t('baselinker.import.tip3', { defaultValue: 'Zdjęcia ze wszystkich produktów zostaną połączone' })}</li>
              <li>{t('baselinker.import.tip4', { defaultValue: 'Opis zostanie pobrany z pierwszego produktu w grupie' })}</li>
              <li className="font-medium text-ui-fg-base">{t('baselinker.import.tip5', { defaultValue: 'Każdy wariant musi mieć unikalną kombinację wartości opcji' })}</li>
            </ul>
          </div>
        </FocusModal.Body>
        
        <FocusModal.Footer>
          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 w-full">
            <Button variant="secondary" onClick={onClose} className="w-full sm:w-auto">
              {t('actions.cancel', { defaultValue: 'Anuluj' })}
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!hasValidOptions || hasDuplicates}
              className="w-full sm:w-auto"
            >
              {t('actions.save', { defaultValue: 'Zapisz konfigurację' })}
            </Button>
          </div>
        </FocusModal.Footer>
      </FocusModal.Content>
    </FocusModal>
  )
}
