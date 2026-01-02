import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Button,
  Container,
  Heading,
  Text,
  Badge,
  Tabs,
} from '@medusajs/ui';
import { useTranslation } from 'react-i18next';
import { CurrencyDollar, Clock, CheckCircle, ExclamationCircle, Plus, PencilSquare } from '@medusajs/icons';

import { usePayoutOverview, useOrdersWithoutPayouts, useCompletedPayouts, usePayoutStatistics, useCommissionRule } from '../../../hooks/api/payouts';
import { DataTable } from '../../../components/data-table';
import { usePayoutTableColumns } from './components/use-payout-table-columns';
import { useOrderTableColumns } from './components/use-order-table-columns';
import { PayoutCharts } from './components/payout-charts';
import { addDays, format } from 'date-fns';

/**
 * PayoutEarnings component
 * Displays earnings overview, payout history, and account status
 * Integrates with existing payout system
 */
const PayoutEarnings: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Tab state for filtering by status
  const [activeTab, setActiveTab] = useState<'all' | 'completed' | 'pending'>('all');

  // Get pagination from URL params (DataTable uses 'offset', not 'page')
  const offset = parseInt(searchParams.get('offset') || '0');
  const limit = 10; // Fixed page size

  // Fetch overview data (for 'all' tab and summary cards)
  const { 
    payoutAccount, 
    payouts: allPayouts, 
    payoutsCount: allPayoutsCount,
    earnings, 
    totalPaidOut, 
    availableForPayout, 
    isLoading: overviewLoading, 
    error: overviewError 
  } = usePayoutOverview(
    { limit, offset },
    { enabled: activeTab === 'all' } // Only fetch when 'all' tab is active
  );

  // Fetch completed payouts (for 'completed' tab)
  const {
    payouts: completedPayouts,
    payoutsCount: completedPayoutsCount,
    isLoading: completedLoading,
    error: completedError
  } = useCompletedPayouts(
    { limit, offset },
    { enabled: activeTab === 'completed' } // Only fetch when 'completed' tab is active
  );

  // Fetch orders without payouts (for 'pending' tab)
  const {
    orders: pendingOrders,
    ordersCount: pendingOrdersCount,
    isLoading: pendingLoading,
    error: pendingError
  } = useOrdersWithoutPayouts(
    { limit, offset },
    { enabled: activeTab === 'pending' } // Only fetch when pending tab is active
  );

  // Fetch payout statistics for charts
  const from = searchParams.get("from") || format(addDays(new Date(), -7), "yyyy-MM-dd");
  const to = searchParams.get("to") || format(new Date(), "yyyy-MM-dd");
  
  const {
    earnings: earningsData,
    payouts: payoutsData,
    totalEarnings: chartTotalEarnings,
    totalPayouts: chartTotalPayouts,
    isLoading: statsLoading,
    refetch: refetchStats
  } = usePayoutStatistics(
    { time_from: from, time_to: to }
  );

  // Fetch commission rule for this seller
  const { commissionRule, isLoading: commissionLoading } = useCommissionRule();

  // Determine which data to show based on active tab
  let displayData, displayCount, isLoading, error;
  
  switch (activeTab) {
    case 'completed':
      displayData = completedPayouts;
      displayCount = completedPayoutsCount;
      isLoading = completedLoading;
      error = completedError;
      break;
    case 'pending':
      displayData = pendingOrders;
      displayCount = pendingOrdersCount;
      isLoading = pendingLoading;
      error = pendingError;
      break;
    case 'all':
    default:
      displayData = allPayouts;
      displayCount = allPayoutsCount;
      isLoading = overviewLoading;
      error = overviewError;
      break;
  }


  const payoutColumns = usePayoutTableColumns();
  const orderColumns = useOrderTableColumns();
  const columns = activeTab === 'pending' ? orderColumns : payoutColumns as any;

  const formatCurrency = (amount: number, currencyCode: string = 'PLN') => {
    // Based on database analysis, amounts are stored as full currency units, not cents
    // So we don't need to divide by 100
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: currencyCode,
    }).format(amount);
  };

  const getAccountStatusColor = (status?: string) => {
    switch (status) {
      case 'active':
        return 'green'
      case 'pending':
        return 'orange'
      case 'suspended':
        return 'red'
      default:
        return 'grey'
    }
  };

  const getAccountStatusIcon = (status?: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="text-ui-fg-success" />
      case 'pending':
        return <Clock className="text-ui-fg-warning" />
      case 'suspended':
        return <ExclamationCircle className="text-ui-fg-error" />
      default:
        return <ExclamationCircle className="text-ui-fg-muted" />
    }
  };

  if (isLoading) {
    return (
      <Container className="p-8 max-w-6xl mx-auto">
        <Text>{t('payout.earnings.loading')}</Text>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="p-8 max-w-6xl mx-auto">
        <Heading className="mb-6">{t('payout.earnings.title')}</Heading>
        <div className="bg-ui-bg-subtle p-4 rounded-lg mb-6">
          <Text className="text-ui-fg-error">
            {t('payout.earnings.errorLoading')}
          </Text>
        </div>
      </Container>
    );
  }

  const hasPayoutAccount = !!payoutAccount;

  return (
    <Container className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Heading className="mb-2">{t('payout.earnings.title')}</Heading>
          <Text className="text-ui-fg-subtle">
            {t('payout.earnings.subtitle')}
          </Text>
        </div>
       
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-4 mb-8 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Earnings */}
        <div className="bg-ui-bg-base p-6 rounded-lg border border-ui-border-base">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Text size="small" className="text-ui-fg-subtle">
                {t('payout.earnings.totalEarnings')}
              </Text>
              <Text size="large" weight="plus" className="text-ui-fg-base">
                {formatCurrency(earnings?.gross_earnings || 0, earnings?.currency_code)}
              </Text>
              <Text size="xsmall" className="text-ui-fg-subtle">
                {t('payout.earnings.fromOrders', { count: earnings?.completed_orders_count || 0 })}
              </Text>
            </div>
            <CurrencyDollar className="text-ui-fg-muted" />
          </div>
        </div>

        {/* Available for Payout */}
        <div className="bg-ui-bg-base p-6 rounded-lg border border-ui-border-base">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Text size="small" className="text-ui-fg-subtle">
                {t('payout.earnings.availableForPayout')}
              </Text>
              <Text size="large" weight="plus" className="text-ui-fg-success">
                {formatCurrency(availableForPayout, earnings?.currency_code)}
              </Text>
              <Text size="xsmall" className="text-ui-fg-subtle">
                {t('payout.earnings.readyToPayout')}
              </Text>
            </div>
            <Clock className="text-ui-fg-success" />
          </div>
        </div>

        {/* Total Paid Out */}
        <div className="bg-ui-bg-base p-6 rounded-lg border border-ui-border-base">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Text size="small" className="text-ui-fg-subtle">
                {t('payout.earnings.totalPaidOut')}
              </Text>
              <Text size="large" weight="plus" className="text-ui-fg-base">
                {formatCurrency(totalPaidOut, earnings?.currency_code)}
              </Text>
              <Text size="xsmall" className="text-ui-fg-subtle">
                {t('payout.earnings.historicalPayouts')}
              </Text>
            </div>
            <CheckCircle className="text-ui-fg-muted" />
          </div>
        </div>

        {/* Payout Account Status */}
        <div className="bg-ui-bg-base p-6 rounded-lg border border-ui-border-base">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Text size="small" className="text-ui-fg-subtle">
                {t('payout.earnings.accountStatus')}
              </Text>
              <div className="flex items-center gap-2">
                <Badge color={getAccountStatusColor(payoutAccount?.status)}>
                  {payoutAccount?.status ? t(`payout.status.${payoutAccount.status}` as any) : t('payout.status.notSetup')}
                </Badge>
              </div>
              <Text size="xsmall" className="text-ui-fg-subtle">
                {payoutAccount?.bank_account_data?.iban 
                  ? `****${payoutAccount.bank_account_data.iban.slice(-4)}`
                  : t('payout.earnings.noAccountSetup')
                }
              </Text>
            </div>
            {getAccountStatusIcon(payoutAccount?.status)}
          </div>
        </div>
      </div>

      {/* Commission Rule Information */}
      <div className="bg-ui-bg-base rounded-lg border border-ui-border-base mb-8">
        <div className="px-6 py-4 border-b border-ui-border-base">
          <div className="flex justify-between items-center">
            <Heading level="h3">{t('payout.detail.commissionRule') || 'Prowizja'}</Heading>
            {commissionRule?.is_seller_specific && (
              <Badge color="blue" size="small">
                {t('payout.detail.sellerSpecific') || 'Indywidualna'}
              </Badge>
            )}
            {commissionRule && !commissionRule.is_seller_specific && (
              <Badge color="grey" size="small">
                {t('payout.detail.globalRule') || 'Globalna'}
              </Badge>
            )}
          </div>
        </div>
        
        <div className="p-6">
          {commissionLoading ? (
            <Text className="text-ui-fg-subtle">{t('common.loading') || 'Ładowanie...'}</Text>
          ) : commissionRule ? (
            <div className="space-y-4">
              <div>
                <Text size="small" className="text-ui-fg-subtle mb-1">
                  {t('payout.detail.commissionRate') || 'Stawka prowizji'}
                </Text>
                <Text size="xlarge" weight="plus" className="text-ui-fg-base">
                  {commissionRule.fee_value}
                </Text>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Text size="small" className="text-ui-fg-subtle mb-1">
                    {t('payout.detail.commissionType') || 'Typ'}
                  </Text>
                  <Text size="base">
                    {commissionRule.type === 'percentage' 
                      ? (t('payout.detail.percentage') || 'Procentowa') 
                      : (t('payout.detail.flat') || 'Stała')}
                  </Text>
                </div>
                
                <div>
                  <Text size="small" className="text-ui-fg-subtle mb-1">
                    {t('payout.detail.includeTax') || 'Zawiera podatek'}
                  </Text>
                  <Text size="base">
                    {commissionRule.include_tax 
                      ? (t('common.yes') || 'Tak') 
                      : (t('common.no') || 'Nie')}
                  </Text>
                </div>
              </div>

              {!commissionRule.is_seller_specific && (
                <div className="bg-ui-bg-subtle p-4 rounded-lg mt-4">
                  <Text size="small" className="text-ui-fg-subtle">
                    {t('payout.detail.globalRuleDescription') || 
                      'Używasz globalnej stawki prowizji. Skontaktuj się z administratorem, aby uzyskać indywidualną stawkę.'}
                  </Text>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-ui-bg-subtle p-4 rounded-lg">
              <Text className="text-ui-fg-subtle">
                {t('payout.detail.noCommissionRule') || 'Brak skonfigurowanej prowizji'}
              </Text>
            </div>
          )}
        </div>
      </div>

      {/* Payout Charts */}
      {hasPayoutAccount && (
        <PayoutCharts
          earningsData={earningsData}
          payoutsData={payoutsData}
          totalEarnings={chartTotalEarnings}
          totalPayouts={chartTotalPayouts}
          isPending={statsLoading}
          refetch={refetchStats}
        />
      )}

      {/* Payout History Table with Tabs */}
      <div className="bg-ui-bg-base rounded-lg border border-ui-border-base">
        <div className="px-6 py-4 border-b border-ui-border-base">
          <Heading level="h3">{t('payout.earnings.payoutHistory')}</Heading>
          <Text className="text-ui-fg-subtle mt-1">
            {t('payout.earnings.payoutHistorySubtitle')}
          </Text>
        </div>
        
        {/* Status Filter Tabs */}
        <div className="px-6 pt-4">
          <Tabs value={activeTab} onValueChange={(value) => {
            setActiveTab(value as 'all' | 'completed' | 'pending');
          }}>
            <Tabs.List>
              <Tabs.Trigger value="all">
                {t('payout.tabs.all') || 'All'}
              </Tabs.Trigger>
              <Tabs.Trigger value="completed">
                <CheckCircle className="mr-1" />
                {t('payout.tabs.completed') || 'Completed'}
              </Tabs.Trigger>
              <Tabs.Trigger value="pending">
                <Clock className="mr-1" />
                {t('payout.tabs.pending') || 'Pending'}
              </Tabs.Trigger>
            </Tabs.List>
          </Tabs>
        </div>
        
        <div className="p-6">
          <DataTable
            data={displayData || []}
            columns={columns}
            getRowId={(row) => row.id}
            rowCount={displayCount || 0}
            isLoading={isLoading}
            pageSize={10}
            enablePagination={true}
            enableSearch={false}
            emptyState={{
              empty: {
                heading: activeTab === 'pending'
                  ? 'No pending payouts'
                  : hasPayoutAccount 
                    ? 'No payouts yet'
                    : 'No payout account',
                description: activeTab === 'pending'
                  ? 'All orders have been paid out'
                  : hasPayoutAccount
                    ? 'Payouts will appear here once processed'
                    : 'Set up a payout account to start receiving payments',
              },
              filtered: {
                heading: 'No results found',
                description: 'Try adjusting your filter criteria',
              }
            }}
          />
        </div>
      </div>
    </Container>
  );
};

export default PayoutEarnings;
