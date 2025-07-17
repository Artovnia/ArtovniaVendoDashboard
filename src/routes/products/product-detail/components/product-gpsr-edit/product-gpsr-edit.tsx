import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Container, Input, Textarea, toast } from '@medusajs/ui';

import { Form } from '../../../../../components/common/form';
import { useProduct, useUpdateProduct } from '../../../../../hooks/api/products';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Define the schema for GPSR data
const GPSRSchema = z.object({
  producerName: z.string().min(1, 'Nazwa producenta jest wymagana'),
  producerAddress: z.string().min(1, 'Adres producenta jest wymagany'),
  producerContact: z.string().min(1, 'Kontakt do producenta jest wymagany'),
  importerName: z.string().optional(),
  importerAddress: z.string().optional(),
  importerContact: z.string().optional(),
  instructions: z.string().min(1, 'Instrukcje/ostrzeżenia są wymagane'),
  certificates: z.string().optional(),
});

type GPSRFormValues = z.infer<typeof GPSRSchema>;

export const ProductGPSREdit = () => {
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
    resolver: zodResolver(GPSRSchema),
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

      toast.success('Dane GPSR zostały zaktualizowane pomyślnie');
      navigate(`/products/${id}`);
    } catch (error) {
      console.error('Error updating GPSR data:', error);
      toast.error('Nie udało się zaktualizować danych GPSR');
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
            <h3 className="text-lg font-medium mb-4">Dane Producenta</h3>
            
            <Form.Field
              control={control}
              name="producerName"
              render={({ field }) => {
                return (
                  <Form.Item>
                    <Form.Label required>
                      Nazwa Producenta
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
                      Adres Producenta
                    </Form.Label>
                    <Form.Control>
                      <Textarea 
                        {...field} 
                        rows={2}
                        placeholder="np. ul. Producenta 123, 00-001 Warszawa, Polska"
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
                      Kontakt do Producenta
                    </Form.Label>
                    <Form.Control>
                      <Input 
                        {...field} 
                        placeholder="np. +48 123 456 789 lub email@example.com"
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
            <h3 className="text-lg font-medium mb-4">Dane Importera (opcjonalnie)</h3>
            
            <Form.Field
              control={control}
              name="importerName"
              render={({ field }) => {
                return (
                  <Form.Item>
                    <Form.Label>
                      Nazwa Importera
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
                      Adres Importera
                    </Form.Label>
                    <Form.Control>
                      <Textarea 
                        {...field} 
                        rows={2}
                        placeholder="np. ul. Importowa 456, 00-002 Kraków, Polska"
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
                      Kontakt do Importera
                    </Form.Label>
                    <Form.Control>
                      <Input 
                        {...field} 
                        placeholder="np. +48 987 654 321 lub kontakt@example.com"
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
            <h3 className="text-lg font-medium mb-4">Dodatkowe Informacje</h3>
            
            <Form.Field
              control={control}
              name="instructions"
              render={({ field }) => {
                return (
                  <Form.Item>
                    <Form.Label required>
                      Instrukcje/Ostrzeżenia
                    </Form.Label>
                    <Form.Control>
                      <Textarea 
                        {...field} 
                        rows={4}
                        placeholder="Instrukcje użytkowania, ostrzeżenia, informacje o bezpieczeństwie..."
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
                      Certyfikaty/Zgodność
                    </Form.Label>
                    <Form.Control>
                      <Textarea 
                        {...field} 
                        rows={2}
                        placeholder="Informacje o certyfikatach, zgodności z normami..."
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
              Anuluj
            </Button>
            <Button
              type="submit"
              disabled={isSaving || !isDirty}
              isLoading={isSaving}
            >
              Zapisz
            </Button>
          </div>
        </form>
      </FormProvider>
    </Container>
  );
};
