import { Buildings, PencilSquare, Plus, Trash, Swatch, MagnifyingGlass } from '@medusajs/icons'
import { HttpTypes } from '@medusajs/types'
import { Container, Heading, Button, usePrompt, toast, Tooltip, Badge, Input, Text } from '@medusajs/ui'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { useMemo, useState, useEffect, useLayoutEffect, useRef } from 'react'
import { ActionMenu } from '../../../../../components/common/action-menu'
import { useDeleteVariantLazy } from '../../../../../hooks/api/products'
import { useVariantColors, useAssignVariantColors, Color } from '../../../../../hooks/api/colors'
import { fetchQuery } from '../../../../../lib/client'

type IntegratedVariantSectionProps = {
  product: HttpTypes.AdminProduct
}

export const IntegratedVariantSection = ({
  product,
}: IntegratedVariantSectionProps) => {
  const { t } = useTranslation()
  const { variants: allVariants } = product
  const [searchQuery, setSearchQuery] = useState('')
  
  const variants = useMemo(() => {
    if (!searchQuery || !allVariants) return allVariants || []
    return allVariants.filter(
      variant =>
        variant.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        variant.sku?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [allVariants, searchQuery])

  // Sticky horizontal scrollbar refs and state
  const scrollableRef = useRef<HTMLDivElement>(null)
  const stickyScrollRef = useRef<HTMLDivElement>(null)
  const [showStickyScroll, setShowStickyScroll] = useState(false)
  const [scrollWidth, setScrollWidth] = useState(0)
  const [clientWidth, setClientWidth] = useState(0)
  const [leftPosition, setLeftPosition] = useState(0)
  const [showStickyBorder, setShowStickyBorder] = useState(false)

  // Check if we need to show the sticky scrollbar
  useLayoutEffect(() => {
    const scrollable = scrollableRef.current
    if (!scrollable) return

    const updateState = () => {
      const rect = scrollable.getBoundingClientRect()
      const viewportHeight = window.innerHeight

      const hasHorizontalOverflow = scrollable.scrollWidth > scrollable.clientWidth
      const isBottomBelowViewport = rect.bottom > viewportHeight

      setShowStickyScroll(hasHorizontalOverflow && isBottomBelowViewport)
      setScrollWidth(scrollable.scrollWidth)
      setClientWidth(rect.width)
      setLeftPosition(rect.left)
    }

    updateState()

    window.addEventListener('scroll', updateState, { passive: true })
    window.addEventListener('resize', updateState, { passive: true })

    const resizeObserver = new ResizeObserver(updateState)
    resizeObserver.observe(scrollable)

    return () => {
      window.removeEventListener('scroll', updateState)
      window.removeEventListener('resize', updateState)
      resizeObserver.disconnect()
    }
  }, [variants])

  // Sync scroll positions between table and sticky scrollbar
  useEffect(() => {
    const scrollable = scrollableRef.current
    const stickyScroll = stickyScrollRef.current
    if (!scrollable || !stickyScroll) return

    let isSyncing = false

    const syncFromTable = () => {
      if (isSyncing) return
      isSyncing = true
      stickyScroll.scrollLeft = scrollable.scrollLeft
      requestAnimationFrame(() => {
        isSyncing = false
      })
    }

    const syncFromSticky = () => {
      if (isSyncing) return
      isSyncing = true
      scrollable.scrollLeft = stickyScroll.scrollLeft
      requestAnimationFrame(() => {
        isSyncing = false
      })
    }

    scrollable.addEventListener('scroll', syncFromTable, { passive: true })
    stickyScroll.addEventListener('scroll', syncFromSticky, { passive: true })

    return () => {
      scrollable.removeEventListener('scroll', syncFromTable)
      stickyScroll.removeEventListener('scroll', syncFromSticky)
    }
  }, [showStickyScroll])

  return (
    <Container className="divide-y p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 gap-3">
        <Heading level="h2">{t('integratedVariantSection.header')}</Heading>
        <div className="flex items-center gap-x-2">
          <Button size="small" variant="secondary" asChild>
            <Link to={`/products/${product.id}/prices`}>
              {t('integratedVariantSection.actions.editPrices')}
            </Link>
          </Button>
          <Button size="small" variant="secondary" asChild>
            <Link to={`/products/${product.id}/variants/create`}>
              <Plus className="mr-1" />
              {t('actions.create')}
            </Link>
          </Button>
        </div>
      </div>
      
      {/* Search */}
      <div className="px-6 py-3">
        <div className="relative w-full sm:w-64">
          <Input
            type="text"
            placeholder={t('integratedVariantSection.search.placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-8"
            size="small"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <MagnifyingGlass className="w-4 h-4 text-ui-fg-subtle" />
          </div>
        </div>
      </div>

      {/* Table with horizontal scroll for mobile */}
      {!variants || variants.length === 0 ? (
        <div className="p-6 text-center">
          <Heading level="h3" className="mb-2">{t('integratedVariantSection.empty.heading')}</Heading>
          <Text className="text-ui-fg-subtle mb-4">
            {t('integratedVariantSection.empty.description')}
          </Text>
          <Button variant="primary" asChild>
            <Link to={`/products/${product.id}/variants/create`}>
              <Plus className="mr-1" />
              {t('integratedVariantSection.actions.create')}
            </Link>
          </Button>
        </div>
      ) : (
        <>
          <div 
            ref={scrollableRef}
            className="overflow-x-auto" 
            style={{ WebkitOverflowScrolling: 'touch' }}
            onScroll={(e) => setShowStickyBorder(e.currentTarget.scrollLeft > 0)}
          >
            <table className="w-full min-w-[600px] table-auto">
              <thead>
                <tr className="bg-ui-bg-subtle border-b border-ui-border-base">
                  <th className="text-left px-4 py-2 text-ui-fg-subtle text-sm font-medium">
                    {t('fields.title')}
                  </th>
                  {product.options?.map((option) => (
                    <th key={option.id} className="text-left px-4 py-2 text-ui-fg-subtle text-sm font-medium">
                      {option.title}
                    </th>
                  ))}
                  <th className="text-right px-4 py-2 text-ui-fg-subtle text-sm font-medium">
                    {t('fields.inventory')}
                  </th>
                  <th className="text-right px-4 py-2 text-ui-fg-subtle text-sm font-medium">
                    {t('fields.price')}
                  </th>
                  <th 
                    className={`text-right px-4 py-2 text-ui-fg-subtle text-sm font-medium w-10 sticky  right-0 bg-ui-bg-subtle before:absolute before:inset-y-0 before:left-0 before:h-full before:w-px  before:bg-transparent before:content-[''] ${showStickyBorder ? 'before:bg-ui-border-base ' : ''}`}
                  >
                    {/* Actions */}
                  </th>
                </tr>
              </thead>
              <tbody>
                {variants.map((variant) => (
                  <VariantTableRow
                    key={variant.id}
                    variant={variant}
                    product={product}
                    showStickyBorder={showStickyBorder}
                  />
                ))}
              </tbody>
            </table>
          </div>
          {/* Sticky horizontal scrollbar */}
          {showStickyScroll && (
            <div
              ref={stickyScrollRef}
              className="fixed bottom-0 z-50 overflow-x-auto bg-ui-bg-base border-t border-ui-border-base "
              style={{
                left: leftPosition,
                width: clientWidth,
                height: 14,
              }}
            >
              <div style={{ width: scrollWidth, height: 1 }} />
            </div>
          )}
        </>
      )}
    </Container>
  )
}

const VariantTableRow = ({
  variant,
  product,
  showStickyBorder,
}: {
  variant: HttpTypes.AdminProductVariant
  product: HttpTypes.AdminProduct
  showStickyBorder: boolean
}) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const prompt = usePrompt()
  const { mutateAsync: deleteVariant } = useDeleteVariantLazy(product.id)
  const { data: variantColorsData, isLoading: isLoadingColors } = useVariantColors(product.id, variant.id)
  const colors = variantColorsData?.colors || []

  const handleDelete = async () => {
    const res = await prompt({
      title: t('general.areYouSure'),
      description: t('deleteVariantWarning', { title: variant.title }),
      confirmText: t('actions.delete'),
      cancelText: t('actions.cancel'),
    })
    if (!res) return
    try {
      await deleteVariant({ variantId: variant.id })
      toast.success(t('variant.delete.success'))
    } catch (error: any) {
      toast.error(error?.message || t('products.variant.delete.error'))
    }
  }

  const handleRowClick = () => {
    navigate(`/products/${product.id}/variants/${variant.id}`)
  }

  const formatPrice = (amount: number | null | undefined, currencyCode?: string): string => {
    if (amount === null || amount === undefined) return '-'
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: currencyCode || 'PLN',
    }).format(amount)
  }

  return (
    <>
      {/* Row 1: Main data */}
      <tr 
        className="border-b border-ui-border-base hover:bg-ui-bg-subtle-hover cursor-pointer group"
        onClick={handleRowClick}
      >
        {/* Title + SKU */}
        <td className="px-4 py-3">
          <div className="flex flex-col">
            <span className="font-medium text-ui-fg-base">{variant.title}</span>
            {variant.sku && (
              <span className="text-ui-fg-subtle text-xs">SKU: {variant.sku}</span>
            )}
          </div>
        </td>
        
        {/* Option values */}
        {product.options?.map((option) => {
          const variantOpt = variant.options?.find((opt) => opt.option_id === option.id)
          return (
            <td key={option.id} className="px-4 py-3">
              {variantOpt ? (
                <Tooltip content={variantOpt.value}>
                  <Badge size="2xsmall" className="max-w-[100px] truncate">
                    {variantOpt.value}
                  </Badge>
                </Tooltip>
              ) : (
                <span className="text-ui-fg-muted">-</span>
              )}
            </td>
          )
        })}
        
        {/* Inventory */}
        <td className="px-4 py-3 text-right">
          <InventoryCell variant={variant} />
        </td>
        
        {/* Price */}
        <td className="px-4 py-3 text-right">
          {variant.prices && variant.prices.length > 0 ? (
            <span>{formatPrice(variant.prices[0]?.amount, variant.prices[0]?.currency_code)}</span>
          ) : (
            <span className="text-ui-fg-muted">-</span>
          )}
        </td>
        
        {/* Actions */}
        <td 
          className={`px-4 py-3 text-right sticky right-0 bg-ui-bg-base group-hover:bg-ui-bg-subtle-hover before:absolute before:border-l before:border-l-ui-border-base before:inset-y-0 before:left-0 before:h-full before:w-px before:bg-transparent before:content-[''] ${showStickyBorder ? 'before:bg-ui-border-base' : ''}`}
          onClick={(e) => e.stopPropagation()}
        >
          <VariantActions
            variant={variant}
            productId={product.id}
            onDelete={handleDelete}
          />
        </td>
      </tr>
      
      {/* Row 2: Colors */}
      <tr className="border-b border-ui-border-base bg-ui-bg-subtle">
        <td colSpan={(product.options?.length || 0) + 4} className="px-4 py-2">
          <div className="flex items-center gap-2">
            <span className="text-ui-fg-subtle text-xs font-medium">
              {t('variant.colorSection.colors')}:
            </span>
            {isLoadingColors ? (
              <span className="text-ui-fg-subtle text-xs">...</span>
            ) : colors.length === 0 ? (
              <span className="text-ui-fg-muted text-xs">{t('variant.colorSection.noColors')}</span>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                {colors.map((color: Color) => (
                  <Tooltip key={color.id} content={color.display_name}>
                    <div className="flex items-center gap-1 bg-ui-bg-base border border-ui-border-base rounded px-2 py-1">
                      <div
                        className="w-3 h-3 rounded-full border border-ui-border-base flex-shrink-0"
                        style={{ backgroundColor: color.hex_code }}
                      />
                      <span className="text-xs">{color.display_name}</span>
                    </div>
                  </Tooltip>
                ))}
              </div>
            )}
          </div>
        </td>
      </tr>
    </>
  )
}

const InventoryCell = ({ variant }: { variant: HttpTypes.AdminProductVariant }) => {
  const [quantity, setQuantity] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const inventoryItemId = variant.inventory_items?.[0]?.inventory_item_id
        if (!inventoryItemId) {
          setQuantity(variant.inventory_quantity || 0)
          setIsLoading(false)
          return
        }

        const response = await fetchQuery(`/vendor/inventory-items/${inventoryItemId}/location-levels`, {
          method: 'GET',
          query: { fields: 'stocked_quantity,reserved_quantity' },
        })

        const levels = response?.location_levels || response?.inventory_item_levels || []
        if (levels.length > 0) {
          let totalStocked = 0
          let totalReserved = 0
          levels.forEach((level: any) => {
            totalStocked += Number(level.stocked_quantity || 0)
            totalReserved += Number(level.reserved_quantity || 0)
          })
          setQuantity(Math.max(0, totalStocked - totalReserved))
        } else {
          setQuantity(variant.inventory_quantity || 0)
        }
      } catch {
        setQuantity(variant.inventory_quantity || 0)
      } finally {
        setIsLoading(false)
      }
    }

    fetchInventory()
  }, [variant.id, variant.inventory_items, variant.inventory_quantity])

  if (isLoading) {
    return <span className="text-ui-fg-subtle">...</span>
  }

  if (quantity === null) {
    return <span className="text-ui-fg-muted">-</span>
  }

  return (
    <span
      className={
        quantity > 10
          ? 'text-emerald-600'
          : quantity > 0
          ? 'text-amber-500'
          : 'text-rose-500'
      }
    >
      {quantity}
    </span>
  )
}

const VariantActions = ({
  variant,
  productId,
  onDelete,
}: {
  variant: HttpTypes.AdminProductVariant
  productId: string
  onDelete: () => void
}) => {
  const { t } = useTranslation()
  const prompt = usePrompt()
  const { mutateAsync: assignColors, isPending } = useAssignVariantColors()
  const { data: variantColorsData } = useVariantColors(productId, variant.id)
  const hasColors = (variantColorsData?.colors || []).length > 0

  const inventoryItemId = variant.inventory_items?.[0]?.inventory_item_id

  const handleRemoveColors = async () => {
    const confirmed = await prompt({
      title: t('variant.colorSection.removeColors.title'),
      description: t('variant.colorSection.removeColors.description', { variantTitle: variant.title }),
      confirmText: t('variant.colorSection.removeColors.confirm'),
      cancelText: t('variant.colorSection.removeColors.cancel'),
    })

    if (confirmed) {
      try {
        await assignColors({ productId, variantId: variant.id, colorIds: [] })
        toast.success(t('variant.colorSection.removeColors.success'))
      } catch (error: any) {
        toast.error(error?.message || t('variant.colorSection.removeColors.error'))
      }
    }
  }

  return (
    <ActionMenu
      groups={[
        {
          actions: [
            {
              icon: <PencilSquare />,
              label: t('actions.edit'),
              to: `/products/${productId}/edit-variant?variant_id=${variant.id}`,
            },
            {
              icon: <PencilSquare />,
              label: t('integratedVariantSection.actions.editPrices'),
              to: `/products/${productId}/prices?variant_id=${variant.id}`,
            },
            {
              icon: <Swatch />,
              label: t('variant.colorSection.editColors'),
              to: `/product-variants/${productId}/variants/${variant.id}/colors`,
            },
          ],
        },
        {
          actions: [
            ...(inventoryItemId
              ? [
                  {
                    icon: <Buildings />,
                    label: t('integratedVariantSection.actions.goToInventory'),
                    to: `/inventory/${inventoryItemId}`,
                  },
                ]
              : []),
            ...(hasColors
              ? [
                  {
                    icon: <Trash />,
                    label: t('variant.colorSection.removeAllColors'),
                    onClick: handleRemoveColors,
                    disabled: isPending,
                  },
                ]
              : []),
          ],
        },
        {
          actions: [
            {
              icon: <Trash />,
              label: t('actions.delete'),
              onClick: onDelete,
            },
          ],
        },
      ]}
    />
  )
}
