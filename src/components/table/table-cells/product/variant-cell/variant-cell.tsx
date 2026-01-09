import { memo } from "react"

import { PlaceholderCell } from "../../common/placeholder-cell"
import { HttpTypes } from "@medusajs/types"

type VariantCellProps = {
  variants?: HttpTypes.AdminProductVariant[] | null
}

export const VariantCell = memo(({ variants }: VariantCellProps) => {

  if (!variants || !variants.length) {
    return <PlaceholderCell />
  }

  return (
    <div className="flex h-full w-full items-center overflow-hidden">
      <span className="truncate">
        Warianty: {variants.length}
      </span>
    </div>
  )
}, (prevProps, nextProps) => {
  // Only re-render if variant count changed
  return prevProps.variants?.length === nextProps.variants?.length
})

export const VariantHeader = () => {
  return (
    <div className="flex h-full w-full items-center">
      <span>Warianty</span>
    </div>
  )
}
