import { lazy } from 'react';
import { Route, Routes } from 'react-router-dom';

const PayoutDetail = lazy(() => import('./payout-detail'));

/**
 * Main payout routing component
 * Handles routing between the different payout management views
 * Note: payout-create and payout-edit have been removed - now using Stripe onboarding
 */
const PayoutRoutes = () => {
  return (
    <Routes>
      <Route index element={<PayoutDetail />} />
      <Route path="detail" element={<PayoutDetail />} />
    </Routes>
  );
};

export default PayoutRoutes;
