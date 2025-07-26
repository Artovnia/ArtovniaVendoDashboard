import { Buildings, PencilSquare, Plus, MagnifyingGlass, EllipsisHorizontal } from '@medusajs/icons'
import { HttpTypes } from '@medusajs/types'
import { Container, Heading, Button, Input, IconButton, DropdownMenu, Table } from '@medusajs/ui'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { VariantRow } from './variant-row'
import { useState } from 'react'

type IntegratedVariantSectionProps = {
  product: HttpTypes.AdminProduct
}

export const IntegratedVariantSection = ({
  product,
}: IntegratedVariantSectionProps) => {
  const { t } = useTranslation()
  const { variants: allVariants } = product
  const [searchQuery, setSearchQuery] = useState('')
  
  // Filter variants based on search query
  const variants = searchQuery && allVariants
    ? allVariants.filter(
        variant =>
          variant.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          variant.sku?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allVariants || []

  return (
    <div className="tab-content bg-ui-bg-base rounded-lg overflow-hidden  border-2 shadow-sm ">
      <Container className="p-0 border-b border-ui-border-base last:border-b-0">
        <div className="flex items-center justify-between px-6 py-4">
          <Heading level="h2">{t('products.variants.header', 'Warianty')}</Heading>
        </div>
        
        {/* Action buttons and search bar at the top level */}
        <div className="flex justify-between items-center px-6 py-3 border-t border-b bg-ui-bg-base">
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="small"
              asChild
            >
              <Link to={`/products/${product.id}/variants/create`}>
                <Plus className="w-4 h-4 mr-1" />
                {t('actions.create', 'Utwórz')}
              </Link>
            </Button>
            
            {/* New: Three-dot menu with edit prices and edit stock options */}
            <DropdownMenu>
              <DropdownMenu.Trigger asChild>
                <IconButton variant="transparent" size="small">
                  <EllipsisHorizontal />
                </IconButton>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content>
                <DropdownMenu.Item asChild>
                  <Link to={`/products/${product.id}/prices`}>
                    <div className="flex items-center">
                      <PencilSquare className="w-4 h-4" />
                      <span className="ml-2">{t('products.editPrices', 'Edytuj ceny')}</span>
                    </div>
                  </Link>
                </DropdownMenu.Item>
                <DropdownMenu.Item asChild>
                  
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu>
          </div>
          <div className="flex gap-4 items-center">
            {/* Search bar */}
            <div className="relative w-64">
              <Input
                type="text"
                placeholder={t('general.search', 'Szukaj')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-8"
                size="small"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                <MagnifyingGlass className="w-4 h-4 text-ui-fg-subtle" />
              </div>
            </div>
          </div>
        </div>
      </Container>

      {/* Display empty state if no variants */}
      {!variants || variants.length === 0 ? (
        <Container className="p-6 text-center">
          <Heading level="h3" className="mb-2">{t('products.variants.empty.heading', 'Brak wariantów')}</Heading>
          <p className="text-ui-fg-subtle">
            {t('products.variants.empty.description', 'Nie masz jeszcze żadnych wariantów. Dodaj pierwszy wariant, aby rozpocząć.')}
          </p>
          <div className="mt-4">
            <Button
              variant="primary"
              asChild
            >
              <Link to={`/products/${product.id}/variants/create`}>
                <Plus className="w-4 h-4 mr-1" />
                {t('actions.create', 'Dodaj wariant')}
              </Link>
            </Button>
          </div>
        </Container>
      ) : (
        // Display variant rows with integrated color sections in a table-like structure
        <div className="border-t border-ui-border-base">
          {/* Table headers for better readability */}
          <div className="flex items-center px-6 py-2 bg-ui-bg-base border-b border-ui-border-base text-ui-fg-subtle text-sm font-medium">
            <div className="flex-1">{t('products.variants.variantColumn', 'Variant')}</div>
            <div className="w-20 text-right">{t('products.variants.priceColumn', 'Price')}</div>
            <div className="w-20 text-right">{t('products.variants.stockColumn', 'Stock')}</div>
            <div className="w-24 text-right">{t('products.variants.actionsColumn', 'Actions')}</div>
          </div>
          
          {variants.map((variant) => (
            <VariantRow
              key={variant.id}
              variant={variant}
              productId={product.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}
