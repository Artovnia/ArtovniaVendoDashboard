import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button, Input, Textarea } from '@medusajs/ui';

import { RouteDrawer } from '../../../../../components/modals';
import { Form } from '../../../../../components/common/form';
import { useGPSRData, GPSRData } from '../../../../../hooks/api/gpsr';
import { useUpdateGPSRData } from '../../../../../hooks/api/gpsr-update';
import { KeyboundForm } from '../../../../../components/utilities/keybound-form';

type EditProductGPSRProps = {
  productId: string;
};

const GPSRSchema = z.object({
  complianceCert: z.string().min(1, 'Compliance certificate is required'),
  safetyWarning: z.string().min(1, 'Safety warning is required'),
  origin: z.string().min(1, 'Country of origin is required'),
});

export const EditProductGPSR = ({ productId }: EditProductGPSRProps) => {
  const { t } = useTranslation();
  const { gpsr, isLoading, refetch } = useGPSRData(productId);
  const { mutateAsync } = useUpdateGPSRData();

  const form = useForm<GPSRData>({
    resolver: zodResolver(GPSRSchema),
    defaultValues: {
      complianceCert: '',
      safetyWarning: '',
      origin: '',
    },
  });

  useEffect(() => {
    if (gpsr) {
      form.reset({
        complianceCert: gpsr.complianceCert || '',
        safetyWarning: gpsr.safetyWarning || '',
        origin: gpsr.origin || '',
      });
    }
  }, [gpsr, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    await mutateAsync({
      productId,
      gpsr: values,
    });
    
    refetch();
  });

  return (
    <RouteDrawer.Content>
      <div className="flex flex-col gap-y-8">
        <KeyboundForm form={form} onSubmit={onSubmit}>
          <div className="flex flex-col gap-y-4">
            <Form.Field
              control={form.control}
              name="complianceCert"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>
                    {t('gpsr.fields.compliance_cert.label', 'Compliance Certificate')}
                  </Form.Label>
                  <Form.Control>
                    <Input {...field} placeholder="e.g., CE-12345" />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />

            <Form.Field
              control={form.control}
              name="safetyWarning"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>
                    {t('gpsr.fields.safety_warning.label', 'Safety Warning')}
                  </Form.Label>
                  <Form.Control>
                    <Textarea
                      {...field}
                      placeholder="e.g., Keep away from children under 3 years"
                      rows={3}
                    />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />

            <Form.Field
              control={form.control}
              name="origin"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>
                    {t('gpsr.fields.origin.label', 'Country of Origin')}
                  </Form.Label>
                  <Form.Control>
                    <Input {...field} placeholder="e.g., Poland" />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
          </div>

          <div className="mt-8">
            <Button
              type="submit"
              className="w-full"
              isLoading={form.formState.isSubmitting}
              disabled={!form.formState.isDirty || form.formState.isSubmitting}
            >
              {t('actions.save', 'Save')}
            </Button>
          </div>
        </KeyboundForm>
      </div>
    </RouteDrawer.Content>
  );
};
