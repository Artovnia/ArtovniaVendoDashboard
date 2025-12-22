import { useForm } from 'react-hook-form';
import {
  RouteDrawer,
  useRouteModal,
} from '../../../../components/modals';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { StoreVendor } from '../../../../types/user';
import { KeyboundForm } from '../../../../components/utilities/keybound-form';
import { Form } from '../../../../components/common/form';
import { Button, Input, toast } from '@medusajs/ui';
import { useUpdateMe } from '../../../../hooks/api';

const EditStoreSchema = z.object({
  address_line: z.string().min(1, 'Address is required'),
  postal_code: z.string().min(1, 'Postal code is required'),
  city: z.string().min(1, 'City is required'),
  country_code: z.string().min(1, 'Country is required'),
  tax_id: z.string().optional(), // Tax ID remains optional
});

export const EditStoreCompanyForm = ({
  seller,
}: {
  seller: StoreVendor;
}) => {
  const { handleSuccess } = useRouteModal();
  const { t } = useTranslation();

  // Safety check: Prevent crash if seller data is incomplete
  if (!seller) {
    return (
      <RouteDrawer.Body className='flex-1 overflow-y-auto'>
        <div className='flex items-center justify-center p-8'>
          <p className='text-ui-fg-subtle'>{t('store.company.edit.noData', 'Ładowanie danych...')}</p>
        </div>
      </RouteDrawer.Body>
    )
  }

  const form = useForm<z.infer<typeof EditStoreSchema>>({
    defaultValues: {
      address_line: seller?.address_line || '',
      postal_code: seller?.postal_code || '',
      city: seller?.city || '',
      country_code: seller?.country_code || '',
      tax_id: seller?.tax_id || '',
    },
    resolver: zodResolver(EditStoreSchema),
  });

  const { mutateAsync, isPending } = useUpdateMe();

  const handleSubmit = form.handleSubmit(async (values) => {
    await mutateAsync(
      {
        ...values,
      },
      {
        onSuccess: () => {
          toast.success(t('store.toast.storeUpdated'));
          handleSuccess();
        },
        onError: (error) => {
          toast.error(error.message);
        },
      }
    );
  });

  return (
    <RouteDrawer.Form form={form}>
      <KeyboundForm
        onSubmit={handleSubmit}
        className='flex h-full flex-col overflow-hidden'
      >
        <RouteDrawer.Body className='flex-1 overflow-y-auto'>
          <div className='flex flex-col gap-y-8'>
            <Form.Field
              name='address_line'
              control={form.control}
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>
                    {t('store.company.fields.address')} <span className="text-ui-fg-error">*</span>
                  </Form.Label>
                  <Form.Control>
                    <Input {...field} placeholder="ul. Przykładowa 123" />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            <Form.Field
              name='postal_code'
              control={form.control}
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>
                    {t('store.company.fields.postalCode')} <span className="text-ui-fg-error">*</span>
                  </Form.Label>
                  <Form.Control>
                    <Input {...field} placeholder="00-000" />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            <Form.Field
              name='city'
              control={form.control}
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>
                    {t('store.company.fields.city')} <span className="text-ui-fg-error">*</span>
                  </Form.Label>
                  <Form.Control>
                    <Input {...field} placeholder="Warszawa" />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            <Form.Field
              name='country_code'
              control={form.control}
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>
                    {t('store.company.fields.country')} <span className="text-ui-fg-error">*</span>
                  </Form.Label>
                  <Form.Control>
                    <Input {...field} placeholder="PL" />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            <Form.Field
              name='tax_id'
              control={form.control}
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>{t('store.company.fields.taxId')}</Form.Label>
                  <Form.Control>
                    <Input {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
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
            <Button size='small' type='submit' isLoading={isPending}>
              {t('actions.save')}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  );
};
