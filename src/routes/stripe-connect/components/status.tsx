import { useStripeAccount } from '../../../hooks/api/stripe';
import { Connected } from './connected';
import { NotConnected } from './not-connected';

export const Status = () => {
  const { payout_account, isLoading } = useStripeAccount();

  if (isLoading) return <div>Ładowanie...</div>;
  if (!payout_account || payout_account.status === 'not connected') {
    return <NotConnected />;
  }
  return <Connected status={payout_account.status} />;
};

