import { RouteDrawer } from '../../../components/modals'
import { VariantColorsEditForm } from './components/variant-colors-edit-form'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'

export const Component = () => {
  const { t } = useTranslation()
  const { product_id } = useParams()
  
  return (
    <RouteDrawer prev={`/products/${product_id}`}>
      <RouteDrawer.Header>
        <RouteDrawer.Title>
          {t('products.variant.colors.title', 'Edycja kolorów wariantu')}
        </RouteDrawer.Title>
        <RouteDrawer.Description>
          {t('products.variant.colors.description', 'Wybierz kolory dla tego wariantu')}
        </RouteDrawer.Description>
      </RouteDrawer.Header>
      <RouteDrawer.Body>
        <VariantColorsEditForm />
      </RouteDrawer.Body>
    </RouteDrawer>
  )
}

export const Breadcrumb = () => {
  const { t } = useTranslation()
  return <>{t('products.variant.colors.breadcrumb', 'Edit Colors')}</>
}
