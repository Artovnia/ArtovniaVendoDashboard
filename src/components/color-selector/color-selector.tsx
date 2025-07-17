import { useState, useEffect, useMemo } from 'react'
import { Text, Input } from "@medusajs/ui"
import { useColorTaxonomy, useSearchColors } from '../../hooks/api/colors'
import { debounce } from 'lodash'
import { MagnifyingGlass, Check } from '@medusajs/icons'

interface ColorOption {
  id: string
  name: string
  display_name: string
  hex_code?: string
  family_name?: string
}

interface ColorFamily {
  id: string
  name: string
  display_name: string
  colors?: ColorOption[]
}

interface ColorSelectorProps {
  value?: string | null
  onChange: (colorId: string | null) => void
  placeholder?: string
  disabled?: boolean
  label?: string
  showColorPreview?: boolean
}

export const ColorSelector = ({
  value,
  onChange,
  placeholder,
  disabled = false,
  label,
  showColorPreview = true,
}: ColorSelectorProps) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedColor, setSelectedColor] = useState<ColorOption | null>(null)
  
  const { data: colorTaxonomyResponse, isLoading: taxonomyLoading } = useColorTaxonomy()
  const { data: searchResults = [], isLoading: searchLoading } = useSearchColors(searchTerm)
  
  const colorFamilies = colorTaxonomyResponse?.color_families || []
  const isLoading = taxonomyLoading || searchLoading
  
  // Flatten all colors for easy access
  const allColors = useMemo(() => {
    const colors: ColorOption[] = []
    colorFamilies.forEach((family: ColorFamily) => {
      family.colors?.forEach((color: ColorOption) => {
        colors.push({
          id: color.id,
          name: color.name,
          display_name: color.display_name,
          hex_code: color.hex_code,
          family_name: family.name,
        })
      })
    })
    return colors
  }, [colorFamilies])
  
  // Update selected color when value changes
  useEffect(() => {
    if (!value) {
      setSelectedColor(null)
      return
    }
    const colorDetails = allColors.find(c => c.id === value) || null
    setSelectedColor(colorDetails)
  }, [value, allColors])
  
  // Debounced search
  const debouncedSearch = useMemo(
    () => debounce((term: string) => setSearchTerm(term), 300),
    []
  )
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value)
  }
  
  const handleColorSelect = (colorId: string) => {
    if (disabled) return
    
    // Toggle selection - if same color is clicked, deselect it
    if (value === colorId) {
      onChange(null)
    } else {
      onChange(colorId)
    }
  }
  
  // Group colors by family for better organization
  const groupedColors = useMemo(() => {
    if (searchTerm) {
      return { 'Wyniki wyszukiwania': searchResults }
    }
    
    const grouped: Record<string, ColorOption[]> = {}
    colorFamilies.forEach((family: ColorFamily) => {
      if (family.colors && family.colors.length > 0) {
        grouped[family.display_name] = family.colors.map((color: ColorOption) => ({
          ...color,
          family_name: family.name
        }))
      }
    })
    return grouped
  }, [searchTerm, searchResults, colorFamilies])
  
  return (
    <div className="w-full space-y-4">
      {label && (
        <Text size="small" weight="regular" className="block text-ui-fg-base">
          {label}
        </Text>
      )}
      
      {/* Search Input */}
      <div className="relative">
        <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-ui-fg-muted" />
        <Input
          placeholder={placeholder || "Wyszukaj kolory..."}
          className="pl-10"
          onChange={handleSearchChange}
          disabled={disabled}
        />
      </div>
      
      {/* Selected Color Display */}
      {selectedColor && (
        <div className="bg-ui-bg-subtle rounded-lg p-3 border border-ui-border-base">
          <Text size="small" weight="regular" className="mb-2 text-ui-fg-base">
            Wybrany kolor
          </Text>
          <div className="flex items-center gap-3">
            {selectedColor.hex_code && showColorPreview && (
              <div
                className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                style={{ backgroundColor: selectedColor.hex_code }}
              />
            )}
            <div>
              <Text weight="regular">{selectedColor.display_name}</Text>
              {selectedColor.family_name && (
                <Text size="small" className="text-ui-fg-muted">
                  {selectedColor.family_name}
                </Text>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Color Matrix */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="text-center py-8">
            <Text className="text-ui-fg-muted">Ładowanie kolorów...</Text>
          </div>
        ) : Object.keys(groupedColors).length === 0 ? (
          <div className="text-center py-8">
            <Text className="text-ui-fg-muted">Brak kolorów do wyświetlenia</Text>
          </div>
        ) : (
          Object.entries(groupedColors).map(([familyName, colors]) => (
            <div key={familyName} className="space-y-3">
              <Text size="small" weight="regular" className="text-ui-fg-subtle">
                {familyName} ({colors.length})
              </Text>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {colors.map((color: ColorOption) => (
                  <button
                    key={color.id}
                    type="button"
                    className={`
                      relative flex items-center gap-3 p-3 rounded-lg border transition-all
                      ${disabled 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'cursor-pointer hover:bg-ui-bg-base-hover'
                      }
                      ${value === color.id 
                        ? 'border-ui-border-interactive bg-ui-bg-base-pressed' 
                        : 'border-ui-border-base hover:border-ui-border-strong'
                      }
                    `}
                    onClick={() => handleColorSelect(color.id)}
                    disabled={disabled}
                  >
                    {/* Color Preview */}
                    <div className="flex-shrink-0">
                      {color.hex_code ? (
                        <div
                          className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                          style={{ backgroundColor: color.hex_code }}
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-ui-bg-base border-2 border-ui-border-base" />
                      )}
                    </div>
                    
                    {/* Color Info */}
                    <div className="flex-1 text-left min-w-0">
                      <Text size="small" weight="regular" className="truncate">
                        {color.display_name}
                      </Text>
                      {color.hex_code && (
                        <Text size="xsmall" className="text-ui-fg-muted uppercase">
                          {color.hex_code}
                        </Text>
                      )}
                    </div>
                    
                    {/* Selection Indicator */}
                    {value === color.id && (
                      <div className="flex-shrink-0">
                        <div className="w-5 h-5 rounded-full bg-ui-fg-interactive flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Clear Selection */}
      {value && (
        <div className="pt-2 border-t border-ui-border-base">
          <button
            type="button"
            className="text-ui-fg-muted hover:text-ui-fg-base transition-colors text-sm"
            onClick={() => onChange(null)}
            disabled={disabled}
          >
            Wyczyść wybór
          </button>
        </div>
      )}
    </div>
  )
}