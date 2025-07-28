import { useForm } from 'react-hook-form';
import { Form } from '../../../../components/common/form';
import { useTranslation } from 'react-i18next';
import {
  RouteDrawer,
  useRouteModal,
} from '../../../../components/modals';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  Heading,
  Select,
  Textarea,
  toast,
} from '@medusajs/ui';
import { useParams } from 'react-router-dom';
import { useCreateVendorRequest } from '../../../../hooks/api';

const ReviewReplySchema = z.object({
  reason: z
    .string()
    .min(1, { message: 'Please select a reason' }),
  comment: z.string().optional(),
});

export const ReviewReportForm = () => {
  const { handleSuccess } = useRouteModal();
  const { id } = useParams();
  const { t } = useTranslation('translation', { useSuspense: false });
  
  const reasonList = [
    t('reviews.report.reasons.notTrue'),
    t('reviews.report.reasons.insulting'),
    t('reviews.report.reasons.offensive'),
    t('reviews.report.reasons.other'),
  ];



  const form = useForm<z.infer<typeof ReviewReplySchema>>({
    defaultValues: {
      reason: '',
      comment: '',
    },
    resolver: zodResolver(ReviewReplySchema),
  });

  const { mutateAsync, isPending } =
    useCreateVendorRequest();

  const handleSubmit = form.handleSubmit(async (data) => {
    await mutateAsync(
      {
        request: {
          type: 'review_remove',
          data: {
            review_id: id,
            reason: data.reason,
            comment: data.comment,
          },
        },
      },
      {
        onSuccess: () => {
          toast.success(t('reviews.report.success'), {
            description: t('reviews.report.successDescription'),
          });
          handleSuccess(`/reviews/${id}`);
        },
        onError: (error) => {
          toast.error(error.message);
        },
      }
    );
  });

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <RouteDrawer.Title asChild>
          <Heading>{t('reviews.report.title')}</Heading>
        </RouteDrawer.Title>
        <RouteDrawer.Description>
          {t('reviews.report.description')}
        </RouteDrawer.Description>
      </RouteDrawer.Header>
      <RouteDrawer.Form form={form}>
        <RouteDrawer.Body>
          <Form.Field
            control={form.control}
            name='reason'
            render={({
              field: { ref, onChange, ...field },
            }) => {
              return (
                <Form.Item className='mt-4'>
                  <Form.Label>{t('reviews.report.reason')}</Form.Label>
                  <Form.Control>
                    <Select
                      {...field}
                      onValueChange={onChange}
                    >
                      <Select.Trigger ref={ref}>
                        <Select.Value />
                      </Select.Trigger>
                      <Select.Content>
                        {reasonList.map((reason, index) => (
                          <Select.Item
                            key={`select-option-${index}`}
                            value={reason}
                          >
                            {reason}
                          </Select.Item>
                        ))}
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
            name='comment'
            render={({ field }) => {
              return (
                <Form.Item className='mt-8'>
                  <Form.Label>{t('reviews.report.comment')}</Form.Label>
                  <Form.Control>
                    <Textarea
                      autoComplete='off'
                      {...field}
                    />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              );
            }}
          />
        </RouteDrawer.Body>
      </RouteDrawer.Form>
      <RouteDrawer.Footer>
        <Button
          onClick={handleSubmit}
          className='px-6'
          isLoading={isPending}
        >
          {t('reviews.report.reportButton')}
        </Button>
      </RouteDrawer.Footer>
    </RouteDrawer>
  );
};
