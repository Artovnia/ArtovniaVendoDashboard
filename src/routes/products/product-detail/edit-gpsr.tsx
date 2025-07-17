import { useParams } from 'react-router-dom';
import { Heading } from '@medusajs/ui';
import { useProduct } from '../../../hooks/api/products';
import { ProductGPSREdit } from './components/product-gpsr-edit';
import { RouteDrawer } from '../../../components/modals';

export const EditGPSR = () => {
  const { id } = useParams();
  const { product, isLoading, isError, error } = useProduct(
    id!,
    {
      // Use specific fields instead of '*' to avoid validation errors
      fields: ['id', 'title', 'metadata', 'status', 'handle'],
    }
  );

  if (isError) {
    throw error;
  }

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <RouteDrawer.Title asChild>
          <Heading>Edytuj informacje GPSR</Heading>
        </RouteDrawer.Title>
        <RouteDrawer.Description className="sr-only">
          Edycja informacji GPSR dla produktu
        </RouteDrawer.Description>
      </RouteDrawer.Header>
      {!isLoading && product && <ProductGPSREdit />}
    </RouteDrawer>
  );
};

// Export the component as the default export for the route
export default EditGPSR;
