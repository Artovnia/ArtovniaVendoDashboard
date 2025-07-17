import { useState, useMemo } from 'react'
import {
  Button,
  Checkbox,
  Text,
  Divider,
  FocusModal,
  Heading
} from '@medusajs/ui'
import { useColorTaxonomy, useSearchColors, ColorFamily } from '../../../../../hooks/api/colors'
import { debounce } from 'lodash'
import { Plus, XMark, Swatch } from '@medusajs/icons'

interface ColorOption {
  id: string
  name: string
  display_name: string
  hex_code?: string
  family_name?: string
}

export interface MultiColorSelectorProps {
  selectedColors: string[]
  onChange: (colorIds: string[]) => void
}

export const MultiColorSelector = ({
  selectedColors,
  onChange,
}: MultiColorSelectorProps) => {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  const { data: taxonomyData, isLoading: taxonomyLoading } = useColorTaxonomy()
  const { data: searchResults = [], isLoading: searchLoading } = useSearchColors(searchQuery)
  
  // Extract color_families from the response
  const colorFamilies = taxonomyData?.color_families || []
  
  const isLoading = taxonomyLoading || searchLoading
  
  // Flatten color taxonomy for easier access
  const allColors = useMemo(() => {
    const colors: ColorOption[] = []
    
    colorFamilies.forEach((family) => {
      if (family.colors) {
        family.colors.forEach((color) => {
          colors.push({
            id: color.id,
            name: color.name,
            display_name: color.display_name,
            hex_code: color.hex_code,
            family_name: family.name,
          })
        })
      }
    })
    
    return colors
  }, [colorFamilies])
  
  // Selected color details
  const selectedColorDetails = useMemo(() => {
    return allColors.filter(color => selectedColors.includes(color.id))
  }, [selectedColors, allColors])
  
  // Handle search debounce
  const handleSearchChange = debounce((term: string) => {
    setSearchQuery(term)
  }, 300)
  
  const handleToggleColor = (colorId: string) => {
    if (selectedColors.includes(colorId)) {
      onChange(selectedColors.filter(id => id !== colorId))
    } else {
      onChange([...selectedColors, colorId])
    }
  }
  
  const handleRemoveColor = (colorId: string) => {
    onChange(selectedColors.filter(id => id !== colorId))
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Text weight="plus">Wybierz kolory</Text>
        
        <FocusModal open={open} onOpenChange={setOpen}>
          <Button
            variant="secondary"
            size="small"
            className="gap-2"
            onClick={() => setOpen(true)}
          >
            <Plus className="text-ui-fg-subtle" />
            Dodaj kolor
          </Button>
          <FocusModal.Content>
            <FocusModal.Header>
              <FocusModal.Title>
                <Heading>Wybierz kolory</Heading>
              </FocusModal.Title>
              <Text className="text-ui-fg-subtle" size="small">
                Wybierz kolory z listy
              </Text>
            </FocusModal.Header>
            <FocusModal.Body className="flex flex-col">
            <div className="flex flex-col">
              <div className="flex items-center p-2 border-b border-ui-border-base">
                <input 
                  className="w-full px-2 py-1 text-sm focus:outline-none" 
                  placeholder="Szukaj" 
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearchChange(e.target.value)} 
                />
              </div>
              <div className="max-h-[300px] overflow-auto p-1">
                {isLoading ? (
                  <div className="p-2">Ładowanie...</div>
                ) : searchResults.length === 0 && searchQuery ? (
                  <div className="p-2">Brak wyników</div>
                ) : searchQuery ? (
                  <div>
                    {searchResults.map((color: ColorOption) => (
                      <div
                        key={color.id}
                        className="flex items-center gap-2 p-2 cursor-pointer hover:bg-ui-bg-base-hover rounded"
                        onClick={() => handleToggleColor(color.id)}
                      >
                        <Checkbox 
                          checked={selectedColors.includes(color.id)} 
                          onCheckedChange={() => handleToggleColor(color.id)}
                        />
                        {color.hex_code ? (
                          <div 
                            className="w-4 h-4 rounded-full border border-ui-border-base" 
                            style={{ backgroundColor: color.hex_code }}
                          />
                        ) : (
                          <Swatch className="w-4 h-4 text-ui-fg-subtle" />
                        )}
                        <span>{color.display_name}</span>
                        {color.family_name && (
                          <span className="text-ui-fg-subtle text-xs">
                            ({color.family_name})
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  // Group by color family when not searching
                  <div>
                    {colorFamilies.map((family: ColorFamily, index: number) => (
                      <div key={family.id} className="mb-2">
                        {index > 0 && <Divider className="my-1" />}
                        <div>
                          <Text className="px-2 py-1 text-xs font-medium">
                            {family.display_name}
                          </Text>
                          <div>
                            {family.colors?.map((color: ColorOption) => (
                              <div
                                key={color.id}
                                className="flex items-center gap-2 p-2 cursor-pointer hover:bg-ui-bg-base-hover rounded"
                                onClick={() => handleToggleColor(color.id)}
                              >
                                <Checkbox 
                                  checked={selectedColors.includes(color.id)} 
                                  onCheckedChange={() => handleToggleColor(color.id)}
                                />
                                {color.hex_code ? (
                                  <div 
                                    className="w-4 h-4 rounded-full border border-ui-border-base" 
                                    style={{ backgroundColor: color.hex_code }}
                                  />
                                ) : (
                                  <Swatch className="w-4 h-4 text-ui-fg-subtle" />
                                )}
                                <span>{color.display_name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            </FocusModal.Body>
          </FocusModal.Content>
        </FocusModal>
      </div>
      
      {selectedColorDetails.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selectedColorDetails.map(color => (
            <div 
              key={color.id} 
              className="flex items-center gap-2 border rounded px-2 py-1"
            >
              {color.hex_code ? (
                <div 
                  className="w-3 h-3 rounded-full border border-ui-border-base" 
                  style={{ backgroundColor: color.hex_code }}
                />
              ) : (
                <Swatch className="w-3 h-3 text-ui-fg-subtle" />
              )}
              <Text size="small">{color.display_name}</Text>
              <Button
                variant="transparent" 
                size="small"
                onClick={() => handleRemoveColor(color.id)}
                className="p-0 h-auto"
              >
                <XMark className="w-4 h-4 text-ui-fg-subtle" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <Text className="text-ui-fg-subtle">Nie wybrano kolorów</Text>
      )}
    </div>
  )
}
