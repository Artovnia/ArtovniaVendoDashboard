import { Container, Heading, Text } from '@medusajs/ui';
import { OnboardingRow } from './onboarding-row';
import { useUpdateOnboarding } from '../../../hooks/api';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

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
  stripe_connect,
}: DashboardProps) => {
  const { mutateAsync } = useUpdateOnboarding();
  const { t } = useTranslation();

  useEffect(() => {
    mutateAsync();
  }, []);

  return (
    <Container className='divide-y p-0'>
      <div className='flex items-center justify-between px-6 py-4'>
        <div>
          <Heading>{t('dashboard.onboarding.welcome')}</Heading>
          <Text className='text-ui-fg-subtle' size='small'>
            {t('dashboard.onboarding.description')}
          </Text>
        </div>
      </div>
      <div className='px-6 py-4'>
        <OnboardingRow
          label={t('dashboard.onboarding.steps.storeInfo')}
          state={store_information}
          link='/settings/store'
          buttonLabel={t('dashboard.onboarding.buttons.manage')}
        />
        <OnboardingRow
          label={t('dashboard.onboarding.steps.locationsShipping')}
          state={locations_shipping}
          link='/settings/locations/batch-setup'
          buttonLabel={t('dashboard.onboarding.buttons.setup')}
          disabled={!store_information}
        />
        <OnboardingRow
          label={t('dashboard.onboarding.steps.stripeConnect')}
          state={stripe_connect}
          link='/stripe-connect'
          buttonLabel={t('dashboard.onboarding.buttons.setup')}
          disabled={!locations_shipping}
        />
        <OnboardingRow
          label={t('dashboard.onboarding.steps.addProducts')}
          state={products}
          link='/products/create'
          buttonLabel={t('dashboard.onboarding.buttons.add')}
          disabled={!stripe_connect}
        />
      </div>
    </Container>
  );
};
