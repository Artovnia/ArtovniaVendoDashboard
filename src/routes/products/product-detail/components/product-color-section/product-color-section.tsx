import { Container, Heading, Text } from '@medusajs/ui'
import { Swatch } from '@medusajs/icons'
import { useProductColors } from '../../../../../hooks/api/colors'
import { useTranslation } from 'react-i18next'

interface ProductColorSectionProps {
  productId: string
}

export const ProductColorSection = ({ productId }: ProductColorSectionProps) => {
  const { t } = useTranslation()
  const {
    data: productColorsData,
    isLoading
  } = useProductColors(productId)
  
  const assignedColors = productColorsData?.colors || []
  
  return (
    <Container className="p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t('colors.header')}</Heading>
      </div>
      <div className="px-6 py-4">
        {isLoading ? (
          <Text className="text-ui-fg-subtle">{t('colors.loading')}</Text>
        ) : assignedColors.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {assignedColors.map((color: { id: string; display_name: string; hex_code?: string }) => (
              <div 
                key={color.id} 
                className="flex items-center gap-2 border rounded px-2 py-1"
              >
                <div 
                  className="w-3 h-3 rounded-full border border-ui-border-base" 
                  style={{ backgroundColor: color.hex_code }}
                />
                <Text size="small">{color.display_name}</Text>
              </div>
            ))}
          </div>
        ) : (
          <Text className="text-ui-fg-subtle">{t('colors.noColors')}</Text>
        )}
      </div>
    </Container>
  )
}
