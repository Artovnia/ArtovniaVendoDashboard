import { Container, Heading, Text } from '@medusajs/ui';
import { useTranslation } from 'react-i18next';
import { NotConnected } from './components/not-connected';
import { useStripeAccount } from '../../hooks/api';
import { Status } from './components/status';
import { Connected } from './components/connected';

const getStatus = (payout_account: any) => {
  if (!payout_account) {
    return 'not connected';
  }

  // Use the actual Stripe account data from API
  const stripeData = payout_account.data;
  if (!stripeData) {
    return 'pending';
  }

  // Extract actual Stripe account status indicators
  const isChargesEnabled = stripeData.charges_enabled;
  const isPayoutsEnabled = stripeData.payouts_enabled;
  const requirements = stripeData.requirements || {};
  const currentlyDue = requirements.currently_due || [];
  const pastDue = requirements.past_due || [];
  const eventuallyDue = requirements.eventually_due || [];
  const disabledReason = requirements.disabled_reason;
  const pendingVerification = requirements.pending_verification || [];

  // Follow Stripe's official status determination logic
  // 1. Check for disabled reasons first
  if (disabledReason) {
    return 'restricted';
  }

  // 2. Check for past due requirements (account is restricted)
  if (pastDue.length > 0) {
    return 'restricted';
  }

  // 3. Check for currently due requirements (action needed)
  if (currentlyDue.length > 0) {
    return 'pending';
  }

  // 4. Check if verification is pending
  if (pendingVerification.length > 0) {
    return 'pending';
  }

  // 5. Check if account is fully functional
  if (isChargesEnabled && isPayoutsEnabled) {
    return 'connected';
  }

  // 6. If eventually_due requirements exist but no immediate action needed
  if (eventuallyDue.length > 0) {
    return 'restricted_soon';
  }

  // 7. Default case - account exists but not fully enabled
  return 'pending';
};

export const StripeConnect = () => {
  const { t } = useTranslation();
  const { payout_account } = useStripeAccount();

  return (
    <Container className='divide-y p-0'>
      <div className='flex items-center justify-between px-6 py-4'>
        <div>
          <Heading>{t('stripeConnect.title')}</Heading>
          <Text className='text-ui-fg-subtle' size='small'>
            {t('stripeConnect.description')}
          </Text>
        </div>
        <div>
          <Status status={getStatus(payout_account)} />
        </div>
      </div>
      <div className='px-6 py-4'>
        {!payout_account ? (
          <NotConnected />
        ) : (
          <Connected status={getStatus(payout_account)} />
        )}
      </div>
    </Container>
  );
};
