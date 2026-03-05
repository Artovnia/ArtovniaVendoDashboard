import { clx } from "@medusajs/ui"
import { getStylizedAmount } from "../../../../../lib/money-amount-helpers"
import { PlaceholderCell } from "../placeholder-cell"

type MoneyAmountCellProps = {
  currencyCode: string
  amount?: number | null
  align?: "left" | "right"
  className?: string
  isStruckThrough?: boolean
}

export const MoneyAmountCell = ({
  currencyCode,
  amount,
  align = "left",
  className,
  isStruckThrough = false,
}: MoneyAmountCellProps) => {
  if (typeof amount === "undefined" || amount === null) {
    return <PlaceholderCell />
  }

  const formatted = getStylizedAmount(amount, currencyCode)

  return (
    <div
      className={clx(
        "flex h-full w-full items-center overflow-hidden",
        {
          "justify-start text-left": align === "left",
          "justify-end text-right": align === "right",
        },
        className
      )}
    >
      <span
        className={clx("truncate", {
          "line-through text-ui-fg-muted": isStruckThrough,
        })}
      >
        {formatted}
      </span>
    </div>
  )
}
