import React, { useState, useMemo, useEffect } from "react"
import { HttpTypes } from "@medusajs/types"
import { Button, Heading, Input, Label, Switch, Text, Textarea, toast } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import * as zod from "zod"

import { Form } from '../../../../../components/common/form';
import { SwitchBox } from '../../../../../components/common/switch-box';
import {
  RouteDrawer,
  useRouteModal,
} from '../../../../../components/modals';
import { useExtendableForm } from '../../../../../extensions/forms/hooks';
import { useUpdateProduct } from '../../../../../hooks/api/products';
import { fetchQuery } from '../../../../../lib/client';
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
    'proposed',
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
  
  // Add reference to track when form needs to be refreshed
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);

  const { getFormFields, getFormConfigs } =
    useDashboardExtension();
  const fields = getFormFields('product', 'edit');
  const configs = getFormConfigs('product', 'edit');

  // Show loading state if product is not available
  if (!product) {
    return (
      <RouteDrawer.Body>
        <div className="flex h-full items-center justify-center">
          <Text>Loading product data...</Text>
        </div>
      </RouteDrawer.Body>
    );
  }

  // Setup form with product data
  const form = useExtendableForm({
    defaultValues: {
      status: product?.status === 'draft' || product?.status === 'proposed' ? product.status : 'draft',
      title: product?.title || '',
      material: product?.material || '',
      subtitle: product?.subtitle || '',
      handle: product?.handle || '',
      description: product?.description || '',
      discountable: product?.discountable ?? true,
    },
    schema: EditProductSchema,
    configs: configs,
    data: product,
  });

  // Reset form when product data changes
  useEffect(() => {
    if (!product) return;
    
    
    form.reset({
      status: product.status === 'draft' || product.status === 'proposed' ? product.status : 'draft',
      title: product.title || '',
      material: product.material || '',
      subtitle: product.subtitle || '',
      handle: product.handle || '',
      description: product.description || '',
      discountable: product.discountable ?? true,
    });
  }, [product, form]);

  // Use the hook without product ID parameter since it expects options only
  const { mutateAsync, isPending } = useUpdateProduct({
    onSuccess: () => {
      // Update the lastUpdatedAt timestamp when a successful update occurs
      setLastUpdatedAt(new Date().toISOString());
    },
  });

  // Handler for submitting product for review
  const handleSubmitForReview = async () => {
    const loadingToast = toast.loading("Przekazywanie do weryfikacji...");
    
    try {
      await fetchQuery(`/vendor/products/${product.id}/status`, {
        method: 'POST',
        body: { status: 'proposed' }
      });
      
      toast.dismiss(loadingToast);
      toast.success(`Produkt "${product.title}" został przekazany do weryfikacji`);
      
      // Update the lastUpdatedAt timestamp to track successful updates
      setLastUpdatedAt(new Date().toISOString());
      
      // Force refresh product data to show updated status immediately
      window.location.reload();
    } catch (e: any) {
      console.error('Error submitting product for review:', e);
      toast.dismiss(loadingToast);
      toast.error(`Nie udało się przekazać produktu do weryfikacji: ${e.message}`);
    }
  };

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
      
      // Prepare payload with only fields accepted by the vendor API
      // Note: 'status' field is excluded as it's rejected by the vendor API
      const payload = {
        id: product.id, // Include product ID in the payload
        title,
        discountable,
        handle,
        // status field removed - not supported in vendor API
        ...nullableData,
      };
      
    

      // Update the product and handle various response formats
      const result = await mutateAsync(payload, {
        onSuccess: (data) => {
          
          // Handle different response formats safely
          const productData = data?.product || data;
          const productTitle = productData?.title || product.title;
          const productId = productData?.id || product.id;
          
          // Update the lastUpdatedAt timestamp to track successful updates
          setLastUpdatedAt(new Date().toISOString());
          
          // Close the loading toast
          toast.dismiss(loadingToast);
          
          // Show success message
          toast.success(
            `Produkt "${productTitle}" został zaktualizowany`
          );
          
          // If response has a _synthetic flag, it means our fallback mechanism created it
          if ((productData as any)?._synthetic) {
           
            toast.warning("Niektóre zmiany mogły nie zostać zapisane");
          }
          
          // Force refresh product data when navigating back to product list
          handleSuccess(`/products/${productId}`);
        },
        onError: (e) => {
          console.error('Error in update product mutation:', e);
          
          // Close loading toast
          toast.dismiss(loadingToast);
          
          // Show error message
          toast.error(
            `Nie udało się zaktualizować produktu: ${e.message}`
          );
        },
      });
      
      return result;
    } catch (e) {
      console.error('Error in update product submit handler:', e);
      
      // Show error message for unexpected errors
      toast.error(
        `Wystąpił nieoczekiwany błąd: ${e instanceof Error ? e.message : 'Unknown error'}`
      );
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
              {/* Read-only status display */}
              <div className="flex flex-col gap-y-2">
                <label className="text-sm font-medium text-ui-fg-base">
                  {t('fields.status')}
                </label>
                <div className="flex items-center gap-x-2 p-3 border border-ui-border-base rounded-md bg-ui-bg-field">
                  <div className={`w-2 h-2 rounded-full ${
                    product.status === 'draft' ? 'bg-yellow-500' :
                    product.status === 'proposed' ? 'bg-blue-500' :
                    product.status === 'published' ? 'bg-green-500' :
                    product.status === 'rejected' ? 'bg-red-500' :
                    'bg-gray-500'
                  }`} />
                  <span className="text-sm text-ui-fg-base">
                    {/* CRITICAL FIX: Handle undefined/null status values with proper typing */}
                    {(() => {
                      const status = product.status as string | undefined;
                      return status && status.trim() !== ''
                        ? t(`productStatus.${status}`, status)
                        : 'Unknown Status';
                    })()}
                  </span>
                </div>
              </div>
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
              description="Określa czy produkt może być objęty promocjami"
            />
            <FormExtensionZone
              fields={fields}
              form={form}
            />
          </div>
        </RouteDrawer.Body>
        <RouteDrawer.Footer>
          <div className='flex items-center justify-between gap-x-2'>
            {product?.status === 'draft' && (
              <Button
                size='small'
                variant='secondary'
                onClick={handleSubmitForReview}
                type='button'
              >
                Przekaż do weryfikacji
              </Button>
            )}
            <div className='flex items-center justify-end gap-x-2 ml-auto'>
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
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  );
};
