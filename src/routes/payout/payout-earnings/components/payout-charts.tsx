import { CalendarMini } from "@medusajs/icons"
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  Button,
  Container,
  DateRange,
  Heading,
  Popover,
  Text,
} from "@medusajs/ui"
import { useSearchParams } from "react-router-dom"
import { ChartSkeleton } from "../../../dashboard/components/chart-skeleton"
import { useState, useRef, useCallback, useEffect } from "react"
import { addDays, differenceInDays, format, subDays } from "date-fns"
import { pl, enUS } from "date-fns/locale"
import { Calendar } from "../../../../components/common/calendar/calendar"
import { useTranslation } from "react-i18next"
import { Plus, Minus, ArrowPath } from "@medusajs/icons"
import { languages } from "../../../../i18n/languages"

const colorPicker = (line: string) => {
  switch (line) {
    case "earnings":
      return "#10b981" // green
    case "payouts":
      return "#3b82f6" // blue
    default:
      return ""
  }
}

const generateChartData = ({
  range,
  earnings,
  payouts,
}: {
  range: DateRange | undefined
  earnings: { date: string; amount: string }[]
  payouts: { date: string; amount: string }[]
}) => {
  const res = [
    ...Array(
      differenceInDays(
        range?.to || addDays(new Date(), +1),
        range?.from || addDays(new Date(), -7)
      ) + 1
    ).keys(),
  ].map((index) => ({
    date: format(
      subDays(range?.from || addDays(new Date(), index), -index),
      "yyyy-MM-dd"
    ),
    earnings: parseFloat(
      earnings?.find(
        (item) =>
          format(item.date, "yyyy-MM-dd") ===
          format(
            subDays(range?.from || addDays(new Date(), index), -index),
            "yyyy-MM-dd"
          )
      )?.amount || "0"
    ),
    payouts: parseFloat(
      payouts?.find(
        (item) =>
          format(item.date, "yyyy-MM-dd") ===
          format(
            subDays(range?.from || addDays(new Date(), index), -index),
            "yyyy-MM-dd"
          )
      )?.amount || "0"
    ),
  }))

  return res
}

export const PayoutCharts = ({
  earningsData,
  payoutsData,
  totalEarnings,
  totalPayouts,
  isPending,
  refetch,
}: {
  earningsData: { date: string; amount: string }[]
  payoutsData: { date: string; amount: string }[]
  totalEarnings: number
  totalPayouts: number
  isPending: boolean
  refetch: () => void
}) => {
  const { t, i18n } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()

  // Get date locale based on current language
  const dateLocale = languages.find((l) => l.code === i18n.language)?.date_locale || enUS

  const [filters, setFilters] = useState<string[]>(["earnings", "payouts"])

  const from = (searchParams.get("from") ||
    format(addDays(new Date(), -7), "yyyy-MM-dd")) as unknown as Date
  const to = (searchParams.get("to") ||
    format(new Date(), "yyyy-MM-dd")) as unknown as Date

  const updateDateRange = async (newFrom: string, newTo: string) => {
    const newSearchParams = new URLSearchParams(searchParams)
    newSearchParams.set("from", format(newFrom, "yyyy-MM-dd"))
    newSearchParams.set("to", format(newTo, "yyyy-MM-dd"))
    await setSearchParams(newSearchParams)
    refetch()
  }

  const chartData = generateChartData({
    range: { from, to },
    earnings: earningsData,
    payouts: payoutsData,
  })

  // Zoom state
  const [zoom, setZoom] = useState<{ startIndex: number; endIndex: number }>({
    startIndex: 0,
    endIndex: Math.max(0, chartData.length - 1),
  })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState(0)
  const chartRef = useRef<HTMLDivElement>(null)

  // Update zoom when chartData changes
  useEffect(() => {
    setZoom({ startIndex: 0, endIndex: Math.max(0, chartData.length - 1) })
  }, [chartData.length])

  const totals = {
    earnings: totalEarnings,
    payouts: totalPayouts,
  }

  // Handle mouse wheel zoom
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    
    if (chartData.length === 0) return
    
    const delta = e.deltaY > 0 ? 1 : -1 // zoom in/out
    const zoomFactor = 0.1
    const currentRange = zoom.endIndex - zoom.startIndex
    const newRange = Math.max(5, Math.min(chartData.length, currentRange + delta * currentRange * zoomFactor))
    
    // Calculate new indices centered on mouse position
    const rect = chartRef.current?.getBoundingClientRect()
    if (!rect) return
    
    const mousePercent = (e.clientX - rect.left) / rect.width
    const centerIndex = zoom.startIndex + currentRange * mousePercent
    
    const newStart = Math.max(0, Math.floor(centerIndex - newRange * mousePercent))
    const newEnd = Math.min(chartData.length - 1, Math.floor(newStart + newRange))
    
    setZoom({ startIndex: newStart, endIndex: newEnd })
  }, [zoom, chartData.length])

  // Handle drag to pan
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart(e.clientX)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || chartData.length === 0) return
    
    const delta = e.clientX - dragStart
    const rect = chartRef.current?.getBoundingClientRect()
    if (!rect) return
    
    const pixelsPerIndex = rect.width / (zoom.endIndex - zoom.startIndex)
    const indexDelta = Math.round(delta / pixelsPerIndex)
    
    if (indexDelta !== 0) {
      const newStart = Math.max(0, zoom.startIndex - indexDelta)
      const newEnd = Math.min(chartData.length - 1, zoom.endIndex - indexDelta)
      
      if (newEnd - newStart === zoom.endIndex - zoom.startIndex) {
        setZoom({ startIndex: newStart, endIndex: newEnd })
        setDragStart(e.clientX)
      }
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Zoom controls
  const zoomIn = () => {
    if (chartData.length === 0) return
    const range = zoom.endIndex - zoom.startIndex
    const newRange = Math.max(5, Math.floor(range * 0.7))
    const center = (zoom.startIndex + zoom.endIndex) / 2
    setZoom({
      startIndex: Math.max(0, Math.floor(center - newRange / 2)),
      endIndex: Math.min(chartData.length - 1, Math.floor(center + newRange / 2))
    })
  }

  const zoomOut = () => {
    if (chartData.length === 0) return
    const range = zoom.endIndex - zoom.startIndex
    const newRange = Math.min(chartData.length, Math.floor(range * 1.3))
    const center = (zoom.startIndex + zoom.endIndex) / 2
    setZoom({
      startIndex: Math.max(0, Math.floor(center - newRange / 2)),
      endIndex: Math.min(chartData.length - 1, Math.floor(center + newRange / 2))
    })
  }

  const resetZoom = () => {
    setZoom({ startIndex: 0, endIndex: Math.max(0, chartData.length - 1) })
  }

  // Attach wheel event listener
  useEffect(() => {
    const chartElement = chartRef.current
    if (!chartElement) return

    chartElement.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      chartElement.removeEventListener('wheel', handleWheel)
    }
  }, [handleWheel])

  // Get visible data slice
  const visibleData = chartData.slice(zoom.startIndex, zoom.endIndex + 1)

  const handleFilter = (label: string) => {
    if (filters.find((item) => item === label)) {
      setFilters(filters.filter((item) => item !== label))
    } else {
      setFilters([...filters, label])
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
    }).format(amount)
  }

  return (
    <Container className="divide-y p-0 mt-2">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading>{t('payout.earnings.charts.title')}</Heading>
          <Text className="text-ui-fg-subtle" size="small">
            {t('payout.earnings.charts.description')}
          </Text>
        </div>
        <div>
          <Popover>
            <Popover.Trigger asChild>
              <Button variant="secondary">
                <CalendarMini />
                {from ? (
                  to ? (
                    <>
                      {format(from, "LLL dd, y", { locale: dateLocale })} - {format(to, "LLL dd, y", { locale: dateLocale })}
                    </>
                  ) : (
                    format(from, "LLL dd, y", { locale: dateLocale })
                  )
                ) : (
                  <span>{t('payout.earnings.charts.selectDateRange')}</span>
                )}
              </Button>
            </Popover.Trigger>
            <Popover.Content>
              <Calendar
                mode="range"
                selected={{ from, to }}
                onSelect={(range) =>
                  range && updateDateRange(`${range.from}`, `${range.to}`)
                }
                numberOfMonths={2}
                defaultMonth={from}
                locale={dateLocale}
              />
            </Popover.Content>
          </Popover>
        </div>
      </div>
      <div className="px-6 py-2 flex items-center gap-2 border-b border-ui-border-base">
        <Button size="small" variant="secondary" onClick={zoomIn}>
          <Plus />
          {t('payout.earnings.charts.zoomIn')}
        </Button>
        <Button size="small" variant="secondary" onClick={zoomOut}>
          <Minus />
          {t('payout.earnings.charts.zoomOut')}
        </Button>
        <Button size="small" variant="secondary" onClick={resetZoom}>
          <ArrowPath />
          {t('payout.earnings.charts.resetZoom')}
        </Button>
        <Text size="xsmall" className="text-ui-fg-subtle ml-auto">
          {t('payout.earnings.charts.zoomHint')}
        </Text>
      </div>
      <div className="relative px-6 py-4 grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div 
          ref={chartRef}
          className="col-span-3 relative h-[150px] md:h-[300px] w-[calc(100%-2rem)]"
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {isPending ? (
            <ChartSkeleton />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={visibleData}>
                <XAxis dataKey="date" />
                <YAxis />
                <CartesianGrid stroke="#333" vertical={false} />
                <Tooltip content={<CustomTooltip />} />
                {filters.map((item) => (
                  <Line
                    key={item}
                    type="monotone"
                    dataKey={item}
                    stroke={colorPicker(item)}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:block gap-4">
          {isPending ? (
            <ChartSkeleton />
          ) : (
            <>
              <Button
                variant="secondary"
                className="p-4 border rounded-lg w-full flex-col items-start my-2"
                onClick={() => handleFilter("earnings")}
              >
                <Heading level="h3">{t('payout.earnings.charts.earnings')}</Heading>
                <div className="flex gap-2 items-center mt-2">
                  <div
                    className="h-8 w-1"
                    style={{
                      backgroundColor: filters.find(
                        (item) => item === "earnings"
                      )
                        ? colorPicker("earnings")
                        : "gray",
                    }}
                  />
                  <Text className="text-ui-fg-subtle">{formatCurrency(totals.earnings)}</Text>
                </div>
              </Button>
              <Button
                variant="secondary"
                className="p-4 border rounded-lg w-full flex-col items-start my-2"
                onClick={() => handleFilter("payouts")}
              >
                <Heading level="h3">{t('payout.earnings.charts.payouts')}</Heading>
                <div className="flex gap-2 items-center mt-2">
                  <div
                    className="h-8 w-1"
                    style={{
                      backgroundColor: filters.find(
                        (item) => item === "payouts"
                      )
                        ? colorPicker("payouts")
                        : "gray",
                    }}
                  />
                  <Text className="text-ui-fg-subtle">
                    {formatCurrency(totals.payouts)}
                  </Text>
                </div>
              </Button>
            </>
          )}
        </div>
      </div>
    </Container>
  )
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean
  label?: string
  payload?: {
    dataKey: string
    name: string
    stroke: string
    value: number
  }[]
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
    }).format(amount)
  }

  if (active && payload && payload.length) {
    return (
      <div className="bg-ui-bg-component p-4 rounded-lg border border-ui-border-base">
        <p className="font-bold">{`${label}`}</p>
        <ul>
          {payload.map((item) => (
            <li key={item.dataKey} className="flex gap-2 items-center">
              <span className="capitalize" style={{ color: item.stroke }}>
                {item.name}:
              </span>
              <span>{formatCurrency(item.value)}</span>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return null
}
