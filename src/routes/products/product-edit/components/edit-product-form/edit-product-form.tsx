import {
  Button,
  Input,
  Select,
  Text,
  Textarea,
  toast,
} from '@medusajs/ui';
import { useTranslation } from 'react-i18next';
import * as zod from 'zod';

import { HttpTypes } from '@medusajs/types';
import { Form } from '../../../../../components/common/form';
import { SwitchBox } from '../../../../../components/common/switch-box';
import {
  RouteDrawer,
  useRouteModal,
} from '../../../../../components/modals';
import { useExtendableForm } from '../../../../../extensions/forms/hooks';
import { useUpdateProduct } from '../../../../../hooks/api/products';
import { transformNullableFormData } from '../../../../../lib/form-helpers';

import { KeyboundForm } from '../../../../../components/utilities/keybound-form';
import {
  FormExtensionZone,
  useDashboardExtension,
} from '../../../../../extensions';

type EditProductFormProps = {
  product: HttpTypes.AdminProduct;
};

const EditProductSchema = zod.object({
  status: zod.enum([
    'draft',
    'published',
    'proposed',
    'rejected',
  ]),
  title: zod.string().min(1),
  subtitle: zod.string().optional(),
  handle: zod.string().min(1),
  material: zod.string().optional(),
  description: zod.string().optional(),
  discountable: zod.boolean(),
});

export const EditProductForm = ({
  product,
}: EditProductFormProps) => {
  const { t } = useTranslation();
  const { handleSuccess } = useRouteModal();

  const { getFormFields, getFormConfigs } =
    useDashboardExtension();
  const fields = getFormFields('product', 'edit');
  const configs = getFormConfigs('product', 'edit');

  const form = useExtendableForm({
    defaultValues: {
      status: product.status,
      title: product.title,
      material: product.material || '',
      subtitle: product.subtitle || '',
      handle: product.handle || '',
      description: product.description || '',
      discountable: product.discountable,
    },
    schema: EditProductSchema,
    configs: configs,
    data: product,
  });

  // Use the hook without product ID parameter since it expects options only
  const { mutateAsync, isPending } = useUpdateProduct();

  const handleSubmit = form.handleSubmit(async (data) => {
    // Show processing toast to give user feedback
    const loadingToast = toast.loading("Przetwarzanie...");
    
    try {
      const {
        title,
        discountable,
        handle,
        status,
        ...optional
      } = data;

      const nullableData = transformNullableFormData(optional);
      
      // Prepare minimal payload with only essential fields
      const payload = {
        id: product.id, // Include product ID in the payload
        title,
        discountable,
        handle,
        status: status as HttpTypes.AdminProductStatus,
        ...nullableData,
      };
      
      // Log what we're trying to update
      console.log(`Updating product ${product.id} with data:`, payload);

      // Update the product and handle various response formats
      const result = await mutateAsync(payload, {
        onSuccess: (data) => {
          console.log('Product update success response:', data);
          
          // Handle different response formats safely
          const productData = data?.product || data;
          const productTitle = productData?.title || product.title;
          const productId = productData?.id || product.id;
          
          // Close the loading toast
          toast.dismiss(loadingToast);
          
          // Show success message
          toast.success(
            `Produkt "${productTitle}" został zaktualizowany`
          );
          
          // If response has a _synthetic flag, it means our fallback mechanism created it
          if (productData?._synthetic) {
            console.log('Using synthetic response - API update may have failed but UI will continue');
            toast.warning("Niektóre zmiany mogły nie zostać zapisane");
          }
          
          handleSuccess(`/products/${productId}`);
        },
        onError: (e) => {
          console.error('Error in update product mutation:', e);
          toast.dismiss(loadingToast);
          
          // More descriptive error message
          const errorMessage = e.message || 'An unknown error occurred';
          toast.error(
            `Aktualizacja nie powiodła się: ${errorMessage.substring(0, 100)}`
          );
        },
      });
      
      return result;
    } catch (error) {
      // This catch handles any errors not caught by the mutation error handler
      console.error('Unexpected error during product update:', error);
      toast.dismiss(loadingToast);
      
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      toast.error(`Nieoczekiwany błąd: ${errorMessage.substring(0, 100)}`);
    }
  });

  return (
    <RouteDrawer.Form form={form}>
      <KeyboundForm
        onSubmit={handleSubmit}
        className='flex flex-1 flex-col overflow-hidden'
      >
        <RouteDrawer.Body className='flex flex-1 flex-col gap-y-8 overflow-y-auto'>
          <div className='flex flex-col gap-y-8'>
            <div className='flex flex-col gap-y-4'>
              <Form.Field
                control={form.control}
                name='status'
                render={({
                  field: { onChange, ref, ...field },
                }) => {
                  return (
                    <Form.Item>
                      <Form.Label>
                        {t('fields.status')}
                      </Form.Label>
                      <Form.Control>
                        <Select
                          {...field}
                          onValueChange={onChange}
                        >
                          <Select.Trigger ref={ref}>
                            <Select.Value />
                          </Select.Trigger>
                          <Select.Content>
                            {(
                              [
                                'draft',
                                'published',
                                'proposed',
                                'rejected',
                              ] as const
                            ).map((status) => {
                              return (
                                <Select.Item
                                  key={status}
                                  value={status}
                                >
                                  {t(
                                    `products.productStatus.${status}`
                                  )}
                                </Select.Item>
                              );
                            })}
                          </Select.Content>
                        </Select>
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  );
                }}
              />
              <Form.Field
                control={form.control}
                name='title'
                render={({ field }) => {
                  return (
                    <Form.Item>
                      <Form.Label>
                        {t('fields.title')}
                      </Form.Label>
                      <Form.Control>
                        <Input {...field} />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  );
                }}
              />
              <Form.Field
                control={form.control}
                name='subtitle'
                render={({ field }) => {
                  return (
                    <Form.Item>
                      <Form.Label optional>
                        {t('fields.subtitle')}
                      </Form.Label>
                      <Form.Control>
                        <Input {...field} />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  );
                }}
              />
              <Form.Field
                control={form.control}
                name='handle'
                render={({ field }) => {
                  return (
                    <Form.Item>
                      <Form.Label>
                        {t('fields.handle')}
                      </Form.Label>
                      <Form.Control>
                        <div className='relative'>
                          <div className='absolute inset-y-0 left-0 z-10 flex w-8 items-center justify-center border-r'>
                            <Text
                              className='text-ui-fg-muted'
                              size='small'
                              leading='compact'
                              weight='plus'
                            >
                              /
                            </Text>
                          </div>
                          <Input
                            {...field}
                            className='pl-10'
                          />
                        </div>
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  );
                }}
              />
              <Form.Field
                control={form.control}
                name='material'
                render={({ field }) => {
                  return (
                    <Form.Item>
                      <Form.Label optional>
                        {t('fields.material')}
                      </Form.Label>
                      <Form.Control>
                        <Input {...field} />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  );
                }}
              />
              <Form.Field
                control={form.control}
                name='description'
                render={({ field }) => {
                  return (
                    <Form.Item>
                      <Form.Label optional>
                        {t('fields.description')}
                      </Form.Label>
                      <Form.Control>
                        <Textarea {...field} />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  );
                }}
              />
            </div>
            <SwitchBox
              control={form.control}
              name='discountable'
              label={t('fields.discountable')}
              description={t('products.discountableHint')}
            />
            <FormExtensionZone
              fields={fields}
              form={form}
            />
          </div>
        </RouteDrawer.Body>
        <RouteDrawer.Footer>
          <div className='flex items-center justify-end gap-x-2'>
            <RouteDrawer.Close asChild>
              <Button size='small' variant='secondary'>
                {t('actions.cancel')}
              </Button>
            </RouteDrawer.Close>
            <Button
              size='small'
              type='submit'
              isLoading={isPending}
            >
              {t('actions.save')}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  );
};
