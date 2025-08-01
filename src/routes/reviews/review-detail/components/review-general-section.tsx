import {
  Badge,
  Button,
  Container,
  Heading,
} from '@medusajs/ui';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { StarsRating } from '../../../../components/common/stars-rating/stars-rating';
import { StatusCell } from '../../../../components/table/table-cells/review/status-cell';
import { ActionMenu } from '../../../../components/common/action-menu';
import { ExclamationCircle } from '@medusajs/icons';
import { Link } from 'react-router-dom';

export const ReviewGeneralSection = ({
  review,
}: {
  review: any;
}) => {
  const { t } = useTranslation('translation', { useSuspense: false });
  return (
    <Container className='divide-y p-0'>
      <div className='flex items-center justify-between px-6 py-4'>
        <Heading>{t('reviews.detail.review')}</Heading>
        <div className='flex items-center gap-4'>
          <Badge>
            <StatusCell status={review.seller_note} />
          </Badge>
          <ActionMenu
            groups={[
              {
                actions: [
                  {
                    label: t('reviews.actions.reportReview'),
                    to: `/reviews/${review.id}/report`,
                    icon: <ExclamationCircle />,
                  },
                ],
              },
            ]}
          />
        </div>
      </div>
      <div className='px-6 py-4 grid grid-cols-2'>
        <div>{t('reviews.detail.stars')}</div>
        <div>
          <StarsRating rate={review.rating} />
        </div>
      </div>
      <div className='px-6 py-4 grid grid-cols-2'>
        <div>{t('reviews.detail.reviewContent')}</div>
        <div>{review.customer_note}</div>
      </div>
      <div className='px-6 py-4 grid grid-cols-2'>
        <div>{t('reviews.detail.reply')}</div>
        <div>{review.seller_note || '-'}</div>
      </div>
      <div className='px-6 py-4 grid grid-cols-2'>
        <div>{t('reviews.detail.added')}</div>
        <div>
          {format(review.created_at, 'dd MMM yyyy')}
        </div>
      </div>
      <div className='px-6 py-4 flex justify-end'>
        <Link to={`/reviews/${review.id}/reply`}>
          <Button className='px-6'>
            {review.seller_note ? t('reviews.detail.editReplyButton') : t('reviews.detail.replyButton')}
          </Button>
        </Link>
      </div>
    </Container>
  );
};
