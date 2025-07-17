import { forwardRef, useState, useRef, useEffect } from "react"
import { clx } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { countries } from "../../../lib/data/countries"
import { ChevronDown } from "@medusajs/icons"

type CountrySelectProps = {
  placeholder?: string
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  className?: string
  disabled?: boolean
  label?: string
  required?: boolean
}

export const CountrySelect = forwardRef<HTMLButtonElement, CountrySelectProps>(
  (
    { placeholder, value, defaultValue, onChange, className, disabled, label, required, ...props },
    ref
  ) => {
    const { t } = useTranslation()
    const [isOpen, setIsOpen] = useState(false)
    const [selectedValue, setSelectedValue] = useState(value || defaultValue || "")
    const [searchString, setSearchString] = useState("") 
    const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const buttonRef = useRef<HTMLButtonElement>(null)
    const listRef = useRef<HTMLDivElement>(null)
    const itemsRef = useRef<Map<string, HTMLDivElement>>(new Map())
    
    // Handle outside click to close dropdown
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
            buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
          setIsOpen(false)
        }
      }
      
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }, [])
    
    // Update internal state when value prop changes
    useEffect(() => {
      if (value !== undefined) {
        setSelectedValue(value)
      }
    }, [value])
    
    // Handle keyboard navigation
    useEffect(() => {
      if (!isOpen) return
      
      const handleKeyDown = (e: KeyboardEvent) => {
        if (!isOpen) return
        
        // Handle letter keys for quick navigation
        if (e.key.length === 1 && e.key.match(/[a-z]/i)) {
          e.preventDefault()
          
          // Clear previous timeout
          if (searchTimeout) {
            clearTimeout(searchTimeout)
          }
          
          // Update search string
          const newSearchString = searchString + e.key.toLowerCase()
          setSearchString(newSearchString)
          
          // Find the first country that starts with the search string
          const matchingCountry = countries.find(country => 
            country.display_name.toLowerCase().startsWith(newSearchString)
          )
          
          if (matchingCountry) {
            // Scroll to the matching country
            const element = itemsRef.current.get(matchingCountry.iso_2)
            if (element && listRef.current) {
              element.scrollIntoView({ block: 'nearest' })
            }
          }
          
          // Clear search string after 1.5 seconds of inactivity
          const timeout = setTimeout(() => {
            setSearchString("")
          }, 1500)
          
          setSearchTimeout(timeout)
        } else if (e.key === 'Escape') {
          setIsOpen(false)
        } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault()
          
          // Get all countries
          const countryElements = Array.from(itemsRef.current.values())
          if (countryElements.length === 0) return
          
          // Find the currently focused country or the first one
          const currentIndex = countryElements.findIndex(el => 
            el.classList.contains('bg-ui-bg-field')
          )
          
          let nextIndex
          if (e.key === 'ArrowDown') {
            nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % countryElements.length
          } else {
            nextIndex = currentIndex < 0 ? countryElements.length - 1 : 
              (currentIndex - 1 + countryElements.length) % countryElements.length
          }
          
          // Scroll to the next country
          const nextElement = countryElements[nextIndex]
          if (nextElement && listRef.current) {
            nextElement.scrollIntoView({ block: 'nearest' })
            
            // Find the country code from the element
            const countryCode = Array.from(itemsRef.current.entries())
              .find(([_, el]) => el === nextElement)?.[0]
              
            if (countryCode) {
              // Highlight but don't select yet
              countryElements.forEach(el => {
                el.classList.remove('bg-ui-bg-field')
              })
              nextElement.classList.add('bg-ui-bg-field')
            }
          }
        } else if (e.key === 'Enter') {
          // Select the highlighted country
          const highlightedElement = Array.from(itemsRef.current.values())
            .find(el => el.classList.contains('bg-ui-bg-field'))
            
          if (highlightedElement) {
            const countryCode = Array.from(itemsRef.current.entries())
              .find(([_, el]) => el === highlightedElement)?.[0]
              
            if (countryCode) {
              handleSelect(countryCode.toLowerCase())
            }
          }
        }
      }
      
      window.addEventListener('keydown', handleKeyDown)
      return () => {
        window.removeEventListener('keydown', handleKeyDown)
        if (searchTimeout) {
          clearTimeout(searchTimeout)
        }
      }
    }, [isOpen, searchString, searchTimeout])
    
    // Reset refs when dropdown opens/closes
    useEffect(() => {
      if (isOpen) {
        // Reset refs
        itemsRef.current = new Map()
      }
    }, [isOpen])
    
    const handleSelect = (countryCode: string) => {
      setSelectedValue(countryCode)
      setIsOpen(false)
      if (onChange) {
        onChange(countryCode)
      }
    }
    
    const displayValue = selectedValue ? 
      countries.find(c => c.iso_2.toLowerCase() === selectedValue)?.display_name : 
      placeholder || t("fields.selectCountry")
      
    // If search is active, show a visual indicator
    const searchActive = searchString.length > 0
    
    return (
      <div className="relative">
        {label && (
          <label className="text-sm font-medium mb-1 block">
            {label} {required && '*'}
          </label>
        )}
        <button
          type="button"
          ref={buttonRef}
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={clx(
            "bg-ui-bg-field shadow-buttons-neutral transition-fg txt-compact-small flex w-full select-none appearance-none items-center justify-between rounded-md px-2 py-1.5 outline-none",
            "placeholder:text-ui-fg-muted text-ui-fg-base",
            "hover:bg-ui-bg-field-hover",
            "focus-visible:shadow-borders-interactive-with-active",
            "aria-[invalid=true]:border-ui-border-error aria-[invalid=true]:shadow-borders-error",
            "invalid::border-ui-border-error invalid:shadow-borders-error",
            "disabled:!bg-ui-bg-disabled disabled:!text-ui-fg-disabled",
            className
          )}
          {...props}
        >
          <span className={!selectedValue ? "text-ui-fg-muted" : ""}>{displayValue}</span>
          <ChevronDown className="text-ui-fg-muted" />
        </button>
        
        {isOpen && (
          <div 
            ref={dropdownRef}
            className="absolute z-50 w-full mt-1 bg-ui-bg-base border border-ui-border-base rounded-md shadow-lg"
          >
            {searchActive && (
              <div className="p-1 text-xs bg-ui-bg-field-hover text-ui-fg-interactive">
                Searching: {searchString}
              </div>
            )}
            <div className="p-1 text-ui-fg-muted">
              {placeholder || t("fields.selectCountry")}
            </div>
            <div 
              ref={listRef}
              className="overflow-y-auto"
              style={{ maxHeight: '240px' }}
              tabIndex={0}
            >
              {countries.map((country) => (
                <div
                  key={country.iso_2}
                  ref={(el) => {
                    if (el) {
                      itemsRef.current.set(country.iso_2, el)
                    }
                  }}
                  className={clx(
                    "px-2 py-1.5 cursor-pointer text-ui-fg-base",
                    "hover:bg-ui-bg-field-hover",
                    selectedValue === country.iso_2.toLowerCase() && "bg-ui-bg-field"
                  )}
                  onClick={() => handleSelect(country.iso_2.toLowerCase())}
                  data-country-code={country.iso_2.toLowerCase()}
                >
                  {country.display_name}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }
)

CountrySelect.displayName = "CountrySelect"