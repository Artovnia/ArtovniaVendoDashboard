import { CheckCircleSolid, ExclamationCircle, ClockSolid, ExclamationCircleSolid, CurrencyDollar } from '@medusajs/icons';
import { Button, Heading, Text, Container } from '@medusajs/ui';
import { useCreateStripeOnboarding, useStripeAccount } from '../../../hooks/api';
import { useTranslation } from 'react-i18next';

export const Connected = ({ status }: { status: string }) => {
  const { t } = useTranslation();
  const { mutateAsync, isPending } = useCreateStripeOnboarding();
  const { payout_account } = useStripeAccount();

  const handleOnboarding = () => {
    mutateAsync({
      context: {
        country: 'PL',
        refresh_url: window.location.href,
        return_url: window.location.href,
      },
    });
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'connected':
      case 'active':
        return {
          icon: <CheckCircleSolid className='text-ui-tag-green-text' />,
          title: t('stripeConnect.connected.title', 'Konto Stripe połączone'),
          description: t('stripeConnect.connected.description', 'Twoje konto Stripe jest aktywne i gotowe do otrzymywania wypłat.'),
          variant: 'success' as const,
          showDashboardLink: true
        };
      case 'pending':
      case 'restricted':
        return {
          icon: <ClockSolid className='text-ui-tag-orange-text' />,
          title: t('stripeConnect.pending.title', 'Konto oczekuje na weryfikację'),
          description: t('stripeConnect.pending.description', 'Twoje konto Stripe jest w trakcie weryfikacji. Sprawdź skrzynkę mailową lub dokończ proces weryfikacji.'),
          variant: 'warning' as const,
          showOnboardingButton: true
        };
      case 'restricted_soon':
        return {
          icon: <ExclamationCircleSolid className='text-ui-tag-orange-text' />,
          title: t('stripeConnect.restrictedSoon.title', 'Wymagane dodatkowe informacje'),
          description: t('stripeConnect.restrictedSoon.description', 'Stripe wymaga dodatkowych informacji. Dokończ proces weryfikacji, aby uniknąć ograniczeń.'),
          variant: 'warning' as const,
          showOnboardingButton: true
        };
      case 'rejected':
        return {
          icon: <ExclamationCircleSolid className='text-ui-tag-red-text' />,
          title: t('stripeConnect.rejected.title', 'Konto odrzucone'),
          description: t('stripeConnect.rejected.description', 'Twoje konto Stripe zostało odrzucone. Skontaktuj się z obsługą klienta.'),
          variant: 'error' as const,
          showSupportLink: true
        };
      default:
        return {
          icon: <ExclamationCircle className='text-ui-fg-muted' />,
          title: t('stripeConnect.unknown.title', 'Nieznany status'),
          description: t('stripeConnect.unknown.description', 'Status konta jest nieznany. Spróbuj odświeżyć stronę.'),
          variant: 'default' as const
        };
    }
  };

  const statusConfig = getStatusConfig(status);

  return (
    <div className='flex items-center justify-center text-center my-16 flex-col max-w-lg mx-auto'>
      <div className='mb-6'>
        {statusConfig.icon}
      </div>
      
      <Heading level='h2' className='mb-3'>
        {String(statusConfig.title)}
      </Heading>
      
      <Text className='text-ui-fg-subtle mb-6' size='small'>
        {String(statusConfig.description)}
      </Text>

      {/* Account Details Card */}
      {payout_account && status === 'connected' && (
        <div className='w-full mb-6 p-4 border rounded-lg bg-ui-bg-subtle'>
          <div className='grid grid-cols-2 gap-4 text-left'>
            <div>
              <Text size='xsmall' className='text-ui-fg-muted mb-1'>
                {t('stripeConnect.details.accountType', 'Typ konta')}
              </Text>
              <Text size='small' weight='plus'>
                {payout_account.business_type === 'individual' 
                  ? t('stripeConnect.accountType.individual', 'Osoba fizyczna')
                  : t('stripeConnect.accountType.company', 'Firma')
                }
              </Text>
            </div>
            <div>
              <Text size='xsmall' className='text-ui-fg-muted mb-1'>
                {t('stripeConnect.details.country', 'Kraj')}
              </Text>
              <Text size='small' weight='plus'>
                {payout_account.country || 'PL'}
              </Text>
            </div>
            {payout_account.default_currency && (
              <div>
                <Text size='xsmall' className='text-ui-fg-muted mb-1'>
                  {t('stripeConnect.details.currency', 'Waluta')}
                </Text>
                <Text size='small' weight='plus'>
                  {payout_account.default_currency.toUpperCase()}
                </Text>
              </div>
            )}
            {payout_account.charges_enabled && (
              <div>
                <Text size='xsmall' className='text-ui-fg-muted mb-1'>
                  {t('stripeConnect.details.status', 'Status płatności')}
                </Text>
                <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-ui-tag-green-bg text-ui-tag-green-text'>
                  {t('stripeConnect.details.active', 'Aktywne')}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className='flex flex-col gap-3 w-full'>
        {statusConfig.showOnboardingButton && (
          <Button
            isLoading={isPending}
            onClick={handleOnboarding}
            size='large'
            className='w-full'
          >
            {t('stripeConnect.continueOnboarding', 'Dokończ rejestrację')}
          </Button>
        )}
        
        {statusConfig.showDashboardLink && (
          <div className='flex gap-3'>
            <Button
              variant='secondary'
              onClick={handleOnboarding}
              className='flex-1'
            >
              {t('stripeConnect.manageAccount', 'Zarządzaj kontem')}
            </Button>
            <a
              href='https://dashboard.stripe.com/express/accounts'
              target='_blank'
              rel='noopener noreferrer'
              className='flex-1'
            >
              <Button variant='secondary' className='w-full'>
                <CurrencyDollar className='mr-2' />
                {t('stripeConnect.viewDashboard', 'Panel Stripe')}
              </Button>
            </a>
          </div>
        )}
        
        {statusConfig.showSupportLink && (
          <a
            href='mailto:support@artovnia.com'
            className='w-full'
          >
            <Button variant='secondary' className='w-full'>
              {t('stripeConnect.contactSupport', 'Skontaktuj się z obsługą')}
            </Button>
          </a>
        )}
      </div>
      
      <Text size='xsmall' className='text-ui-fg-muted mt-6 text-center'>
        {t('stripeConnect.poweredBy', 'Obsługiwane przez Stripe Connect')}
      </Text>
    </div>
  );
};
