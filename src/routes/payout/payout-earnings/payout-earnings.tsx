import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Container,
  Heading,
  Text,
  Badge,
} from '@medusajs/ui';
import { useTranslation } from 'react-i18next';
import { CurrencyDollar, Clock, CheckCircle, ExclamationCircle, Plus, PencilSquare } from '@medusajs/icons';

import { usePayoutOverview } from '../../../hooks/api/payouts';
import { DataTable } from '../../../components/data-table';
import { usePayoutTableColumns } from './components/use-payout-table-columns';

/**
 * PayoutEarnings component
 * Displays earnings overview, payout history, and account status
 * Integrates with existing payout system
 */
const PayoutEarnings: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const { 
    payoutAccount, 
    payouts, 
    earnings, 
    totalPaidOut, 
    availableForPayout, 
    isLoading, 
    error 
  } = usePayoutOverview();

  const columns = usePayoutTableColumns();

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
        <div className="flex items-center gap-x-2">
          {!hasPayoutAccount && (
            <Button size="small" variant="secondary" onClick={() => navigate('/payout/create')}>
              <Plus />
              {t('payout.earnings.setupAccount')}
            </Button>
          )}
          {hasPayoutAccount && (
            <Button size="small" variant="secondary" onClick={() => navigate('/payout/detail')}>
              <PencilSquare />
              {t('payout.earnings.manageAccount')}
            </Button>
          )}
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
                {formatCurrency(earnings?.total_earnings || 0, earnings?.currency_code)}
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

      {/* Payout History Table */}
      <div className="bg-ui-bg-base rounded-lg border border-ui-border-base">
        <div className="px-6 py-4 border-b border-ui-border-base">
          <Heading level="h3">{t('payout.earnings.payoutHistory')}</Heading>
          <Text className="text-ui-fg-subtle mt-1">
            {t('payout.earnings.payoutHistorySubtitle')}
          </Text>
        </div>
        
        <div className="p-6">
          <DataTable
            data={payouts || []}
            columns={columns}
            getRowId={(row) => row.id}
            rowCount={payouts?.length || 0}
            isLoading={isLoading}
            pageSize={10}
            enablePagination={true}
            enableSearch={true}
            emptyState={{
              empty: {
                heading: hasPayoutAccount 
                  ? t('payout.earnings.noPayouts') || 'No payouts yet'
                  : t('payout.earnings.noPayoutAccount') || 'No payout account',
                description: hasPayoutAccount
                  ? t('payout.earnings.noPayoutsDescription') || 'Payouts will appear here once processed'
                  : t('payout.earnings.noPayoutAccountDescription') || 'Set up a payout account to start receiving payments',
              },
              filtered: {
                heading: t('payout.earnings.noFilteredResults') || 'No results found',
                description: t('payout.earnings.noFilteredResultsDescription') || 'Try adjusting your search or filter criteria',
              }
            }}
          />
        </div>
      </div>
    </Container>
  );
};

export default PayoutEarnings;
