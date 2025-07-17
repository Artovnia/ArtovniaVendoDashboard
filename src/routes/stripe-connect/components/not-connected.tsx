import { ExclamationCircle } from '@medusajs/icons';
import { Button, Heading, Text } from '@medusajs/ui';
import { useCreateStripeAccount } from '../../../hooks/api';

export const NotConnected = () => {
  const { mutateAsync, isPending } =
    useCreateStripeAccount();

  return (
    <div className='flex items-center justify-center text-center my-32 flex-col'>
      <ExclamationCircle />
      <Heading level='h2' className='mt-4'>
        Not connected
      </Heading>
      <Text className='text-ui-fg-subtle' size='small'>
        No stripe connection
      </Text>
      <Button
        isLoading={isPending}
        className='mt-4'
        onClick={() =>
          mutateAsync({
            context: {
              country: 'PL',
              //external_account: {
                //object: 'bank_account',
               // country: 'PL', // Kod kraju banku np. "PL" dla Polski
              //  currency: 'pln', // Waluta konta bankowego np. "pln"
              //  account_number: '000123456789', // Numer konta
              //  routing_number: '110000000', // Kod banku (dla USA - routing number, dla Europy - IBAN)
              //},
            },
          })
        }
      >
        Connect Stripe
      </Button>
    </div>
  );
};
  