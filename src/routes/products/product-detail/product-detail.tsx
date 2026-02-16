import { useParams } from 'react-router-dom';

import { TwoColumnPageSkeleton } from '../../../components/common/skeleton';
import { TwoColumnPage } from '../../../components/layout/pages';
import { useProduct } from '../../../hooks/api/products';
import { ProductAttributeSection } from './components/product-attribute-section';
import { ProductGeneralSection } from './components/product-general-section';
import { ProductMediaSection } from './components/product-media-section';
import { ProductOptionSection } from './components/product-option-section';
import { ProductOrganizationSection } from './components/product-organization-section';
import { IntegratedVariantSection } from './components/integrated-variant-section';
import { ProductGPSRSection } from './components/product-gpsr-section/product-gpsr-section';
import { ProductColorSection } from './components/product-color-section';
import { ProductAdditionalAttributesSection } from "./components/product-additional-attribute-section/ProductAdditionalAttributesSection"


import { useDashboardExtension } from '../../../extensions';
import { ProductShippingProfileSection } from './components/product-shipping-profile-section';
import { ProductDeliveryTimeframeSection } from './components/product-delivery-timeframe-section';

export const ProductDetail = () => {
  const { id } = useParams();
  const { product, isLoading, isError, error } = useProduct(
    id!,
    {
      fields: '*variants.inventory_items,*categories,*attribute_values,*shipping_profile',
    }
  );


  const { getWidgets } = useDashboardExtension();

  const after = getWidgets('product.details.after');
  const before = getWidgets('product.details.before');
  const sideAfter = getWidgets(
    'product.details.side.after'
  );
  const sideBefore = getWidgets(
    'product.details.side.before'
  );

  if (isLoading || !product) {
    return (
      <TwoColumnPageSkeleton
        mainSections={4}
        sidebarSections={3}
      />
    );
  }

  if (isError) {
    throw error;
  }

  return (
    <TwoColumnPage
      widgets={{
        after,
        before,
        sideAfter,
        sideBefore,
      }}
      data={product}
    >
      <TwoColumnPage.Main>
        <ProductGeneralSection product={product} />
        <ProductMediaSection product={product} />
        <ProductOptionSection product={product} />
        <IntegratedVariantSection product={product} />
      </TwoColumnPage.Main>
      <TwoColumnPage.Sidebar>
        <ProductShippingProfileSection product={{
          ...product,
          shipping_profile: product.shipping_profile || undefined
        }} />
        <ProductDeliveryTimeframeSection productId={product.id} />
        <ProductColorSection productId={product.id} productTitle={product.title} />
        <ProductGPSRSection product={product} />
        <ProductOrganizationSection product={product} />
       {/* <ProductAttributeSection product={product} /> */}
       {/* <ProductAdditionalAttributesSection product={product as any} /> */}
      </TwoColumnPage.Sidebar>
    </TwoColumnPage>
  );
};
