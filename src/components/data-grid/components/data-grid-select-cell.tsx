import { Select, clx } from "@medusajs/ui"
import { Controller, ControllerRenderProps } from "react-hook-form"
import { useCombinedRefs } from "../../../hooks/use-combined-refs"
import { useDataGridCell, useDataGridCellError } from "../hooks"
import { DataGridCellProps, InputProps } from "../types"
import { DataGridCellContainer } from "./data-grid-cell-container"

interface DataGridSelectCellProps<TData, TValue = any>
  extends DataGridCellProps<TData, TValue> {
  options: { label: string; value: string }[]
  placeholder?: string
}

export const DataGridSelectCell = <TData, TValue = any>({
  context,
  options,
  placeholder,
}: DataGridSelectCellProps<TData, TValue>) => {
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
            <Inner 
              field={field} 
              inputProps={input} 
              options={options}
              placeholder={placeholder}
            />
          </DataGridCellContainer>
        )
      }}
    />
  )
}

const Inner = ({
  field,
  inputProps,
  options,
  placeholder,
}: {
  field: ControllerRenderProps<any, string>
  inputProps: InputProps
  options: { label: string; value: string }[]
  placeholder?: string
}) => {
  const { ref, value, onBlur, name } = field
  const {
    ref: inputRef,
    onBlur: onInputBlur,
    onChange,
    onFocus,
    ...attributes
  } = inputProps

  const combinedRefs = useCombinedRefs(ref, inputRef)

  const handleOpenChange = (open: boolean) => {
    if (open) {
      onFocus?.()
    }
  }

  return (
    <div 
      onClick={(e) => {
        // Prevent DataGrid from capturing the click
        e.stopPropagation()
      }}
      onMouseDown={(e) => {
        // Prevent DataGrid from capturing mouse down
        e.stopPropagation()
      }}
      className="relative h-full w-full z-[3]"
    >
      <Select 
        value={value || ""} 
        onValueChange={(newValue) => {
          onChange(newValue, value)
        }}
        onOpenChange={handleOpenChange}
      >
        <Select.Trigger
          ref={combinedRefs}
          name={name}
          onFocus={onFocus}
          onBlur={() => {
            onBlur()
            onInputBlur()
          }}
          className={clx(
            "relative h-full w-full rounded-none bg-transparent px-4 py-2.5 shadow-none cursor-pointer z-[3]",
            "hover:bg-ui-bg-field-hover focus:shadow-none data-[state=open]:!shadow-none"
          )}
          tabIndex={-1}
          {...attributes}
        >
          <Select.Value placeholder={placeholder} />
        </Select.Trigger>
        <Select.Content 
          className="z-[100]"
          position="popper"
          sideOffset={5}
          align="start"
        >
          {options.map((option) => (
            <Select.Item key={option.value} value={option.value}>
              {option.label}
            </Select.Item>
          ))}
        </Select.Content>
      </Select>
    </div>
  )
}
