import {
  Text,
  usePrompt,
  Container,
  Heading,
  DropdownMenu,
} from '@medusajs/ui'
import { Swatch, PencilSquare, Trash, EllipsisHorizontal } from '@medusajs/icons'
import { useVariantColors, useAssignVariantColors } from '../../../../../hooks/api/colors'
import { Link } from 'react-router-dom'

interface VariantColorSectionProps {
  productId: string
  variantId: string
  variantTitle: string
}

export const VariantColorSection = ({ 
  productId,
  variantId,
  variantTitle,
}: VariantColorSectionProps) => {
  const prompt = usePrompt()
  const { 
    data: variantColorsData, 
    isLoading 
  } = useVariantColors(productId, variantId)
  
  const { 
    mutateAsync: assignColors,
    isPending: isAssigning
  } = useAssignVariantColors()
  
  // Get all assigned colors
  const assignedColors = variantColorsData?.colors || []

  const handleRemoveColors = async () => {
    if (assignedColors.length === 0) return
    
    try {
      const confirmed = await prompt({
        title: 'Usuń kolory',
        description: `Czy na pewno chcesz usunąć wszystkie kolory z wariantu ${variantTitle}?`,
        confirmText: 'Usuń',
        cancelText: 'Anuluj',
      })
      
      if (confirmed) {
        await assignColors({ productId, variantId, colorIds: [] })
      }
    } catch (error) {
      console.error("Error removing variant colors", error)
    }
  }
  

  
  return (
    <Container className="p-0">
      {/* Header with title and context menu */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <Swatch className="h-5 w-5" />
          <Heading level="h2">Schemat kolorów wariantu</Heading>
        </div>
        
        <div className="flex items-center gap-2">
          
          
          {/* Context menu like other components */}
          <DropdownMenu>
            <DropdownMenu.Trigger asChild>
              <button className="text-ui-fg-subtle hover:text-ui-fg-base focus:text-ui-fg-base outline-none">
                <EllipsisHorizontal />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>              
              <DropdownMenu.Item asChild>
                <Link to={`/product-variants/${productId}/variants/${variantId}/colors`}>
                  <div className="flex items-center">
                    <PencilSquare />
                    <span className="ml-2">Edytuj kolory</span>
                  </div>
                </Link>
              </DropdownMenu.Item>
              
              {assignedColors.length > 0 && (
                <DropdownMenu.Item 
                  onClick={handleRemoveColors}
                  className="text-rose-500" 
                  disabled={isAssigning}
                >
                  <Trash className="text-rose-500" />
                  <span className="ml-2">Usuń wszystkie kolory</span>
                </DropdownMenu.Item>
              )}
            </DropdownMenu.Content>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Color information displayed horizontally in a row */}
      <div className="divide-y">
        <div className="px-6 py-4">
          {isLoading ? (
            <div className="flex items-center gap-2 mt-2">
              <div className="w-4 h-4 bg-ui-bg-base rounded-full animate-pulse" />
              <Text className="text-ui-fg-subtle">Ładowanie...</Text>
            </div>
          ) : assignedColors.length > 0 ? (
            <div>
              <Text className="text-ui-fg-subtle font-medium mb-3">Kolory</Text>
              <div className="flex flex-wrap gap-3">
                {assignedColors.map(color => (
                  <div 
                    key={color.id} 
                    className="flex items-center gap-2 border border-ui-border-base rounded-md px-3 py-2 "
                  >
                    <div 
                      className="w-4 h-4 rounded-full border border-ui-border-base flex-shrink-0" 
                      style={{ backgroundColor: color.hex_code }}
                    />
                    <Text className="text-sm">{color.display_name}</Text>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <Text className="text-ui-fg-subtle ml-2 mt-2">
              Brak przypisanych kolorów dla tego wariantu.
            </Text>
          )}
        </div>
      </div>
      
      {/* Modal for Multi-Color Selection */}
      
    </Container>
  )
}
