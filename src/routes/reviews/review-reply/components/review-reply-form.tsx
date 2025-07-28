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
  Textarea,
  toast,
} from '@medusajs/ui';
import { useParams } from 'react-router-dom';
import {
  useReview,
  useUpdateReview,
} from '../../../../hooks/api/review';

const ReviewReplySchema = z.object({
  seller_note: z.string().min(1),
});

export const ReviewReplyForm = () => {
  const { handleSuccess } = useRouteModal();
  const { id } = useParams();
  const { t } = useTranslation('translation', { useSuspense: false });

  const { review } = useReview(id!);

  const form = useForm<z.infer<typeof ReviewReplySchema>>({
    defaultValues: {
      seller_note: review.seller_note || '',
    },
    resolver: zodResolver(ReviewReplySchema),
  });

  const { mutateAsync, isPending } = useUpdateReview(id!);
  const handleSubmit = form.handleSubmit(async (data) => {
    await mutateAsync(
      {
        seller_note: data.seller_note,
      },
      {
        onSuccess: () => {
          toast.success(t('reviews.reply.success'));
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
          <Heading>
            {review.seller_note ? t('reviews.reply.editTitle') : t('reviews.reply.title')}
          </Heading>
        </RouteDrawer.Title>
        <RouteDrawer.Description>
          {review.seller_note
            ? t('reviews.reply.editDescription')
            : t('reviews.reply.description')}
        </RouteDrawer.Description>
      </RouteDrawer.Header>
      <RouteDrawer.Form form={form}>
        <RouteDrawer.Body>
          <Form.Field
            control={form.control}
            name='seller_note'
            render={({ field }) => {
              return (
                <Form.Item>
                  <Form.Label>{t('reviews.reply.comment')}</Form.Label>
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
        {review.seller_note && (
          <Button className='px-6' variant='secondary'>
            {t('reviews.reply.deleteReply')}
          </Button>
        )}
        <Button
          onClick={handleSubmit}
          className='px-6'
          isLoading={isPending}
        >
          {review.seller_note ? t('reviews.reply.save') : t('reviews.reply.reply')}
        </Button>
      </RouteDrawer.Footer>
    </RouteDrawer>
  );
};
