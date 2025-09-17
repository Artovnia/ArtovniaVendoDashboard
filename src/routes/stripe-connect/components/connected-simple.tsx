import { CheckCircleSolid, ExclamationCircle } from '@medusajs/icons';
import { Button, Heading, Text } from '@medusajs/ui';
import { useTranslation } from 'react-i18next';
import { useCreateStripeOnboarding } from '../../../hooks/api';

export const Connected = ({ status }: { status: string }) => {
  const { t } = useTranslation();
  const { mutateAsync, isPending } = useCreateStripeOnboarding();

  const handleOnboarding = () => {
    mutateAsync({
      context: {
        country: 'PL',
        refresh_url: window.location.href,
        return_url: window.location.href,
      },
    });
  };

  if (status === 'connected' || status === 'active') {
    return (
      <div className='flex items-center justify-center text-center my-32 flex-col'>
        <CheckCircleSolid className='text-ui-tag-green-text' />
        <Heading level='h2' className='mt-4'>
          {t('stripeConnect.connected.title')}
        </Heading>
        <Text className='text-ui-fg-subtle' size='small'>
          {t('stripeConnect.connected.description')}
        </Text>
        <div className='flex gap-3 mt-4'>
          <Button
            variant='secondary'
            onClick={handleOnboarding}
          >
            {t('stripeConnect.actions.manageAccount')}
          </Button>
          <a
            href='https://dashboard.stripe.com/express/accounts'
            target='_blank'
            rel='noopener noreferrer'
          >
            <Button variant='secondary'>
              {t('stripeConnect.actions.viewDashboard')}
            </Button>
          </a>
        </div>
      </div>
    );
  }
  
  if (status === 'pending' || status === 'restricted') {
    return (
      <div className='flex items-center justify-center text-center my-32 flex-col'>
        <ExclamationCircle />
        <Heading level='h2' className='mt-4'>
          {t('stripeConnect.pending.title')}
        </Heading>
        <Text className='text-ui-fg-subtle' size='small'>
          {t('stripeConnect.pending.description')}
        </Text>
        <Button
          isLoading={isPending}
          className='mt-4'
          onClick={handleOnboarding}
        >
          {t('stripeConnect.actions.continueOnboarding')}
        </Button>
      </div>
    );
  }
  
  return (
    <div className='flex items-center justify-center text-center my-32 flex-col'>
      <ExclamationCircle />
      <Heading level='h2' className='mt-4'>
        {t('stripeConnect.unknown.title')}
      </Heading>
      <Text className='text-ui-fg-subtle' size='small'>
        Status: {status}
      </Text>
    </div>
  );
};
