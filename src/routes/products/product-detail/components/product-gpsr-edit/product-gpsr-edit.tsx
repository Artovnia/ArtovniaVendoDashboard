import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Container, Input, Textarea, toast } from '@medusajs/ui';
import { useTranslation } from 'react-i18next';

import { Form } from '../../../../../components/common/form';
import { useProduct, useUpdateProduct } from '../../../../../hooks/api/products';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Define the schema for GPSR data
const GPSRSchema = (t: any) => z.object({
  producerName: z.string().min(1, { message: t('products.gpsr.validation.producerNameRequired') }),
  producerAddress: z.string().min(1, { message: t('products.gpsr.validation.producerAddressRequired') }),
  producerContact: z.string().min(1, { message: t('products.gpsr.validation.producerContactRequired') }),
  importerName: z.string().optional(),
  importerAddress: z.string().optional(),
  importerContact: z.string().optional(),
  instructions: z.string().min(1, { message: t('products.gpsr.validation.instructionsRequired') }),
  certificates: z.string().optional(),
});

type GPSRFormValues = z.infer<ReturnType<typeof GPSRSchema>>;

export const ProductGPSREdit = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [formInitialized, setFormInitialized] = useState(false);

  // Fetch product data directly with specific fields
  const { product, isLoading } = useProduct(
    id || '',
    {
      fields: ['id', 'title', 'metadata', 'status', 'handle'],
    }
  );
  
  const { mutateAsync: updateProduct } = useUpdateProduct();

  // Extract GPSR data from product metadata
  const gpsrData = product?.metadata ? {
    producerName: product.metadata.gpsr_producer_name || '',
    producerAddress: product.metadata.gpsr_producer_address || '',
    producerContact: product.metadata.gpsr_producer_contact || '',
    importerName: product.metadata.gpsr_importer_name || '',
    importerAddress: product.metadata.gpsr_importer_address || '',
    importerContact: product.metadata.gpsr_importer_contact || '',
    instructions: product.metadata.gpsr_instructions || '',
    certificates: product.metadata.gpsr_certificates || '',
  } : {
    producerName: '',
    producerAddress: '',
    producerContact: '',
    importerName: '',
    importerAddress: '',
    importerContact: '',
    instructions: '',
    certificates: '',
  };

  // Initialize form with existing GPSR data
  const form = useForm<GPSRFormValues>({
    resolver: zodResolver(GPSRSchema(t)),
    defaultValues: gpsrData,
  });

  // Update form values when product data is loaded
  useEffect(() => {
    if (product?.metadata && !formInitialized) {
      form.reset(gpsrData);
      setFormInitialized(true);
    }
  }, [product, formInitialized]);

  const { control, handleSubmit, formState: { isDirty } } = form;

  const onSubmit = async (data: GPSRFormValues) => {
    if (!id || !product) return;

    setIsSaving(true);
    try {
      // Update product metadata directly
      const updatedMetadata = {
        ...(product.metadata || {}),
        gpsr_producer_name: data.producerName,
        gpsr_producer_address: data.producerAddress,
        gpsr_producer_contact: data.producerContact,
        gpsr_importer_name: data.importerName || '',
        gpsr_importer_address: data.importerAddress || '',
        gpsr_importer_contact: data.importerContact || '',
        gpsr_instructions: data.instructions,
        gpsr_certificates: data.certificates || '',
      };

      // Pass the id in the payload for the updated hook
      await updateProduct({
        id,
        metadata: updatedMetadata,
      });

      toast.success(t('products.gpsr.messages.updateSuccess'));
      navigate(`/products/${id}`);
    } catch (error) {
      console.error('Error updating GPSR data:', error);
      toast.error(t('products.gpsr.messages.updateError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/products/${id}`);
  };

  if (isLoading) {
    return null;
  }

  return (
    <Container className="max-w-[720px] my-8">
      <FormProvider {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-y-8">
          {/* Producer Information - Required */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-medium mb-4">{t('products.gpsr.sections.producer')}</h3>
            
            <Form.Field
              control={control}
              name="producerName"
              render={({ field }) => {
                return (
                  <Form.Item>
                    <Form.Label required>
                      {t('products.gpsr.fields.producerName')}
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
              control={control}
              name="producerAddress"
              render={({ field }) => {
                return (
                  <Form.Item>
                    <Form.Label required>
                      {t('products.gpsr.fields.producerAddress')}
                    </Form.Label>
                    <Form.Control>
                      <Textarea 
                        {...field} 
                        rows={2}
                        placeholder={t('products.gpsr.placeholders.producerAddress')}
                      />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                );
              }}
            />
            
            <Form.Field
              control={control}
              name="producerContact"
              render={({ field }) => {
                return (
                  <Form.Item>
                    <Form.Label required>
                      {t('products.gpsr.fields.producerContact')}
                    </Form.Label>
                    <Form.Control>
                      <Input 
                        {...field} 
                        placeholder={t('products.gpsr.placeholders.producerContact')}
                      />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                );
              }}
            />
          </div>
          
          {/* Importer Information - Optional */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-medium mb-4">{t('products.gpsr.sections.importer')}</h3>
            
            <Form.Field
              control={control}
              name="importerName"
              render={({ field }) => {
                return (
                  <Form.Item>
                    <Form.Label>
                      {t('products.gpsr.fields.importerName')}
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
              control={control}
              name="importerAddress"
              render={({ field }) => {
                return (
                  <Form.Item>
                    <Form.Label>
                      {t('products.gpsr.fields.importerAddress')}
                    </Form.Label>
                    <Form.Control>
                      <Textarea 
                        {...field} 
                        rows={2}
                        placeholder={t('products.gpsr.placeholders.importerAddress')}
                      />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                );
              }}
            />
            
            <Form.Field
              control={control}
              name="importerContact"
              render={({ field }) => {
                return (
                  <Form.Item>
                    <Form.Label>
                      {t('products.gpsr.fields.importerContact')}
                    </Form.Label>
                    <Form.Control>
                      <Input 
                        {...field} 
                        placeholder={t('products.gpsr.placeholders.importerContact')}
                      />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                );
              }}
            />
          </div>

          {/* Additional Information */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-medium mb-4">{t('products.gpsr.sections.additional')}</h3>
            
            <Form.Field
              control={control}
              name="instructions"
              render={({ field }) => {
                return (
                  <Form.Item>
                    <Form.Label required>
                      {t('products.gpsr.fields.instructions')}
                    </Form.Label>
                    <Form.Control>
                      <Textarea 
                        {...field} 
                        rows={4}
                        placeholder={t('products.gpsr.placeholders.instructions')}
                      />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                );
              }}
            />
            
            <Form.Field
              control={control}
              name="certificates"
              render={({ field }) => {
                return (
                  <Form.Item>
                    <Form.Label>
                      {t('products.gpsr.fields.certificates')}
                    </Form.Label>
                    <Form.Control>
                      <Textarea 
                        {...field} 
                        rows={2}
                        placeholder={t('products.gpsr.placeholders.certificates')}
                      />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                );
              }}
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-x-2">
            <Button
              variant="secondary"
              onClick={handleCancel}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isSaving || !isDirty}
              isLoading={isSaving}
            >
              {t('common.save')}
            </Button>
          </div>
        </form>
      </FormProvider>
    </Container>
  );
};
