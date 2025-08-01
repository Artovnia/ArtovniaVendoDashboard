import { lazy } from 'react';
import { Route, Routes } from 'react-router-dom';

const PayoutDetail = lazy(() => import('./payout-detail'));
const PayoutCreate = lazy(() => import('./payout-create'));
const PayoutEdit = lazy(() => import('./payout-edit'));


/**
 * Main payout routing component
 * Handles routing between the different payout management views
 */
const PayoutRoutes = () => {
  return (
    <Routes>
      <Route index element={<PayoutDetail />} />
      <Route path="detail" element={<PayoutDetail />} />
      <Route path="create" element={<PayoutCreate />} />
      <Route path="edit/:section" element={<PayoutEdit />} />
      
    </Routes>
  );
};

export default PayoutRoutes;
