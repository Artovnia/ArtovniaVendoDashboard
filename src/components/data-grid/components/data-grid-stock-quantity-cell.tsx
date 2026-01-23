import { clx } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { Controller, ControllerRenderProps, useFormContext } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useCombinedRefs } from "../../../hooks/use-combined-refs"
import { useDataGridCell, useDataGridCellError } from "../hooks"
import { DataGridCellProps, InputProps } from "../types"
import { DataGridCellContainer } from "./data-grid-cell-container"

export const DataGridStockQuantityCell = <TData, TValue = any>({
  context,
  variantIndex,
  ...rest
}: DataGridCellProps<TData, TValue> & {
  min?: number
  max?: number
  placeholder?: string
  variantIndex: number
}) => {
  const { field, control, renderProps } = useDataGridCell({
    context,
  })
  const errorProps = useDataGridCellError({ context })

  const { container, input } = renderProps

  return (
    <Controller
      control={control}
      name={field}
      render={({ field }) => {
        return (
          <DataGridCellContainer {...container} {...errorProps}>
            <Inner field={field} inputProps={input} variantIndex={variantIndex} {...rest} />
          </DataGridCellContainer>
        )
      }}
    />
  )
}

const Inner = ({
  field,
  inputProps,
  variantIndex,
  ...props
}: {
  field: ControllerRenderProps<any, string>
  inputProps: InputProps
  variantIndex: number
  min?: number
  max?: number
  placeholder?: string
}) => {
  const { t } = useTranslation()
  const { setValue, getValues } = useFormContext()
  const { ref, value, onChange: _, onBlur, ...fieldProps } = field
  const {
    ref: inputRef,
    onChange,
    onBlur: onInputBlur,
    onFocus,
    ...attributes
  } = inputProps

  // Use empty string as fallback to prevent controlled/uncontrolled input warning
  const [localValue, setLocalValue] = useState(value ?? "")
  const [showTooltip, setShowTooltip] = useState(false)

  useEffect(() => {
    setLocalValue(value ?? "")
  }, [value])

  const combinedRefs = useCombinedRefs(inputRef, ref)

  const handleBlur = () => {
    onBlur()
    onInputBlur()

    // We propagate the change to the field only when the input is blurred
    onChange(localValue, value)

    // Auto-mark manage_inventory checkbox if quantity is entered
    const quantity = parseFloat(localValue)
    if (!isNaN(quantity) && quantity > 0) {
      const manageInventoryFieldName = `variants.${variantIndex}.manage_inventory`
      const currentManageInventory = getValues(manageInventoryFieldName)
      
      // Only auto-mark if not already marked
      if (!currentManageInventory) {
        setValue(manageInventoryFieldName, true, { shouldDirty: true })
        
        // Show tooltip for 3 seconds
        setShowTooltip(true)
        setTimeout(() => {
          setShowTooltip(false)
        }, 3000)
      }
    }
  }

  return (
    <div className="relative size-full">
      <input
        ref={combinedRefs}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        onFocus={onFocus}
        type="number"
        inputMode="decimal"
        className={clx(
          "txt-compact-small size-full bg-transparent outline-none",
          "placeholder:text-ui-fg-muted"
        )}
        tabIndex={-1}
        {...props}
        {...fieldProps}
        {...attributes}
      />
      {showTooltip && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-[9999] w-64 p-3 bg-ui-bg-component border border-ui-border-base rounded shadow-elevation-tooltip text-xs text-ui-fg-base animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-start gap-2">
            <span className="text-ui-fg-interactive">✓</span>
            <span>{t('products.create.variantHeaders.inventory_auto_enabled')}</span>
          </div>
        </div>
      )}
    </div>
  )
}
