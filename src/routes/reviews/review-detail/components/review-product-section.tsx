import { Container, Heading } from '@medusajs/ui';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export const ReviewProductSection = ({
  product,
}: {
  product?: any;
}) => {
  const { t } = useTranslation('translation', { useSuspense: false });
  return (
    <Container className='divide-y p-0'>
      <div className='flex items-center justify-between px-6 py-4'>
        <Heading>{t('reviews.detail.productSection')}</Heading>
      </div>
      {product ? (
        <>
          <div className='px-6 py-4 flex items-center gap-4'>
            {product.thumbnail && (
              <img
                src={product.thumbnail}
                alt={product.title}
                className='w-16 h-16 object-cover rounded'
              />
            )}
            <div className='flex-1'>
              <Link 
                to={`/products/${product.id}`}
                className='text-ui-fg-base hover:text-ui-fg-subtle transition-colors'
              >
                <p className='font-medium'>{product.title}</p>
              </Link>
              <p className='text-sm text-ui-fg-subtle'>ID: {product.id}</p>
            </div>
          </div>
        </>
      ) : (
        <div className='px-6 py-4'>
          <p className='text-ui-fg-subtle'>-</p>
        </div>
      )}
    </Container>
  );
};
