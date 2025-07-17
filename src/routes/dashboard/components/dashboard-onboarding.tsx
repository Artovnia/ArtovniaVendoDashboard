import { Container, Heading, Text } from '@medusajs/ui';
import { OnboardingRow } from './onboarding-row';
import { useUpdateOnboarding } from '../../../hooks/api';
import { useEffect } from 'react';

type DashboardProps = {
  products: boolean;
  locations_shipping: boolean;
  store_information: boolean;
  stripe_connect: boolean;
};

export const DashboardOnboarding = ({
  products,
  locations_shipping,
  store_information,
  // stripe_connect,
}: DashboardProps) => {
  const { mutateAsync } = useUpdateOnboarding();

  useEffect(() => {
    mutateAsync();
  }, []);

  return (
    <Container className='divide-y p-0'>
      <div className='flex items-center justify-between px-6 py-4'>
        <div>
          <Heading>Witamy w Artovnia, Twoim bazarze sztuki i rękodzieła</Heading>
          <Text className='text-ui-fg-subtle' size='small'>
            Proszę uzupełnić te kroki, aby rozpocząć sprzedaż w 
          </Text>
        </div>
      </div>
      <div className='px-6 py-4'>
        <OnboardingRow
          label='Complete the store information'
          state={store_information}
          link='/settings/store'
          buttonLabel='Manage'
        />
        {/* <OnboardingRow
          label='Setup Stripe Connect account'
          state={stripe_connect}
          link='/stripe-connect'
          buttonLabel='Setup'
        /> */}
        <OnboardingRow
          label='Setup Locations & Shipping'
          state={locations_shipping}
          link='/settings/locations'
          buttonLabel='Setup'
        />
        <OnboardingRow
          label='Add products and start selling'
          state={products}
          link='/products/create'
          buttonLabel='Add'
        />
      </div>
    </Container>
  );
};
