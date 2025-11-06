import { CheckCircleSolid, ExclamationCircle } from '@medusajs/icons';
import { Button, Heading, Text, toast } from '@medusajs/ui';
import { useTranslation } from 'react-i18next';
import { useCreateStripeOnboarding } from '../../../hooks/api';
import { useState } from 'react';

export const Connected = ({ status }: { status: string }) => {
  const { t } = useTranslation();
  const { mutateAsync, isPending } = useCreateStripeOnboarding();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleOnboarding = async () => {
    if (isRedirecting) return;
    
    setIsRedirecting(true);
    
    try {
      const response = await mutateAsync({
        context: {
          country: 'PL',
          refresh_url: window.location.href,
          return_url: window.location.href,
        },
      });
      
      // Extract onboarding URL from response
      const onboardingUrl = response?.payout_account?.onboarding?.data?.url || 
                           response?.onboarding?.data?.url;
      
      if (onboardingUrl && typeof onboardingUrl === 'string') {
        // Redirect to Stripe onboarding
        window.location.assign(onboardingUrl);
      } else {
        throw new Error('No onboarding URL received from server');
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to initialize registration. Please try again.';
      toast.error('Registration Error', {
        description: errorMessage,
        duration: 5000,
      });
      setIsRedirecting(false);
    }
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
          isLoading={isPending || isRedirecting}
          className='mt-4'
          onClick={handleOnboarding}
          disabled={isRedirecting}
        >
          {isRedirecting 
            ? 'Redirecting to Stripe...' 
            : t('stripeConnect.actions.continueOnboarding')
          }
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
