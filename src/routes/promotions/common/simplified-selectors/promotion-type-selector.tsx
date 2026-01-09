import { RadioGroup, Text } from '@medusajs/ui'
import { memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'

type PromotionTypeSelectorProps = {
  value: 'products' | 'categories'
  onChange: (value: 'products' | 'categories') => void
  disabled?: boolean
}

export const PromotionTypeSelector = memo(({
  value,
  onChange,
  disabled = false,
}: PromotionTypeSelectorProps) => {
  const { t } = useTranslation()

  // Wrap onChange to prevent infinite loops
  const handleChange = useCallback((newValue: string) => {
    if (newValue !== value) {
      onChange(newValue as 'products' | 'categories')
    }
  }, [value, onChange])

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Text size="small" weight="plus" className="mb-2">
          {t('promotions.fields.applyTo')}
        </Text>
        <Text size="small" className="text-ui-fg-subtle mb-4">
          {t('promotions.fields.applyToDescription')}
        </Text>
      </div>

      <RadioGroup
        value={value}
        onValueChange={handleChange}
        disabled={disabled}
        className="flex gap-3"
      >
        <RadioGroup.ChoiceBox
          value="products"
          label={t('promotions.fields.specificProducts')}
          description={t('promotions.fields.specificProductsDescription')}
          className="basis-1/2"
        />
        <RadioGroup.ChoiceBox
          value="categories"
          label={t('promotions.fields.productCategories')}
          description={t('promotions.fields.productCategoriesDescription')}
          className="basis-1/2"
        />
      </RadioGroup>
    </div>
  )
})
