import { ExclamationCircle } from '@medusajs/icons';
import { Button, Heading, Text } from '@medusajs/ui';
import { useCreatePayuAccount } from '../../../hooks/api/payu';

export const NotConnected = () => {
  const { mutateAsync, isPending } = useCreatePayuAccount();

  const handleOnboarding = async () => {
    try {
      const { payout_account } = await mutateAsync({
        context: {
          country: 'PL',
          external_account: {
            object: 'bank_account',
            country: 'PL',
            currency: 'pln',
            account_number: '', // Numer konta
            iban: '', // IBAN, jeśli wymagane
          },
        },
      });
      if (payout_account?.onboarding?.data?.url) {
        window.location.replace(payout_account.onboarding.data.url);
      }
    } catch {
      alert('Błąd połączenia z PayU!');
    }
  };

  return (
    <div className='flex items-center justify-center text-center my-32 flex-col'>
      <ExclamationCircle />
      <Heading level='h2' className='mt-4'>
        Nie połączono z PayU
      </Heading>
      <Text className='text-ui-fg-subtle' size='small'>
        Przejdź do rejestracji PayU, aby połączyć konto i otrzymywać wypłaty.
      </Text>
      <Button
        isLoading={isPending}
        className='mt-4'
        onClick={handleOnboarding}
      >
        Rejestracja PayU
      </Button>
    </div>
  );
};
