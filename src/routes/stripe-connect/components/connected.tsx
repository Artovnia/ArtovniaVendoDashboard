import { ExclamationCircle } from '@medusajs/icons';
import { Button, Heading, Text, toast } from '@medusajs/ui';
import { useCreateStripeOnboarding } from '../../../hooks/api';
import { Link } from 'react-router-dom';

export const Connected = ({ status }: { status: 'connected' | 'pending' | 'not connected' }) => {
  const { mutateAsync, isPending } = useCreateStripeOnboarding();
  const hostname = window.location.href;

  const handleOnboarding = async () => {
    try {
      const { payout_account } = await mutateAsync({
        context: {
          refresh_url: hostname,
          return_url: hostname,
        },
      });
      window.location.replace(payout_account.onboarding.data.url);
    } catch {
      toast.error('Błąd połączenia ze Stripe!');
    }
  };

  if (status === 'connected') {
    return (
      <div className='flex items-center justify-center text-center my-32 flex-col'>
        <Heading level='h2' className='mt-4'>
          Twoje konto Stripe jest gotowe
        </Heading>
        <Link
          to='https://dashboard.stripe.com/payments'
          target='_blank'
        >
          <Button className='mt-4'>Idź do Stripe</Button>
        </Link>
      </div>
    );
  }
  if (status === 'pending') {
    return (
      <div className='flex items-center justify-center text-center my-32 flex-col'>
        <ExclamationCircle />
        <Heading level='h2' className='mt-4'>
          Konto Stripe oczekuje na weryfikację
        </Heading>
        <Text className='text-ui-fg-subtle' size='small'>
          Twoje konto Stripe jest w trakcie weryfikacji. Proszę sprawdzić skrzynkę mailową lub panel Stripe.
        </Text>
        <Button
          isLoading={isPending}
          className='mt-4'
          onClick={handleOnboarding}
        >
          Rejestracja Stripe
        </Button>
      </div>
    );
  }
  return null;
};

