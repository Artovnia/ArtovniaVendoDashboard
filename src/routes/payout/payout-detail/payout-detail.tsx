import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Container,
  Heading,
  Text,
  Tooltip,
  Label,
  Badge,
} from '@medusajs/ui';
import { useTranslation } from 'react-i18next';
import { usePayuAccount } from '../../../hooks/api/payu';
import { useCommissionRule } from '../../../hooks/api/payouts';
import { PencilSquare } from '@medusajs/icons';

/**
 * PayoutDetail component
 * Displays the existing payout account configuration information
 * with options to edit specific sections
 */
const PayoutDetail: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // Fetch the payout account data with explicit refetch capability
  const { data: payoutAccount, isLoading, error, refetch } = usePayuAccount();
  
  // Fetch commission rule for this seller
  const { commissionRule, isLoading: commissionLoading } = useCommissionRule();
  
  // Force a refresh when component mounts - useful after navigation
  React.useEffect(() => {
    // This ensures we get fresh data after an update operation
    refetch();
  }, [refetch]);
  


  // Display loading state
  if (isLoading) {
    return (
      <Container className="p-8 max-w-4xl mx-auto">
        <Text>{t('payout.detail.loading')}</Text>
      </Container>
    );
  }

  // Handle error or missing account data
  if (error || !payoutAccount) {
    return (
      <Container className="p-8 max-w-4xl mx-auto">
        <Heading className="mb-6">{t('payout.detail.title')}</Heading>
        <div className="bg-ui-bg-subtle p-4 rounded-lg mb-6">
          <Text className="text-ui-fg-error">
            {t('payout.errors.loadFailed')}
            {error?.message && ` ${t('fields.reason')}: ${error.message}`}
          </Text>
          <Button 
            variant="secondary" 
            className="mt-4"
            onClick={() => navigate('/payout/create')}
          >
            {t('payout.detail.setupAccount')}
          </Button>
        </div>
      </Container>
    );
  }

  // Data is available at this point
  // Extract data from the context field where it's stored by the backend
  const context = payoutAccount?.context || {};
  const bankAccountData = payoutAccount?.bank_account_data || {};
  

  // Map the properties to our component
  const legalName = context.company_name;
  const taxId = context.tax_id;
  const email = context.email;
  const phone = context.phone;
  
  // Address handling
  const address = {
    street: context.street || context.address1,
    postalCode: context.postal_code,
    city: context.city,
    countryCode: context.country_code || context.country || 'PL'
  };
  
  // Bank account handling - prioritize data from bank_account_data (from PayU account)
  // as it's now the source of truth for bank account information
  const bankAccount = {
    number: bankAccountData.iban || context.iban || context.bank_account || '',
    // Look specifically for account holder name from bank_account_data first, 
    // then fall back to context if needed
    accountHolderName: bankAccountData.account_holder_name || 
                       context.account_holder_name || 
                       `${context.first_name || ''} ${context.last_name || ''}`.trim() || ''
  };
  
 
  
  const handleEditBankAccount = () => {
    navigate('/payout/edit/bank-account');
  };
  
  const handleEditAddress = () => {
    navigate('/payout/edit/address');
  };
  
  const handleEditContactInfo = () => {
    navigate('/payout/edit/contact');
  };
  
  const handleEditCompanyInfo = () => {
    navigate('/payout/edit/company');
  };

  return (
    <Container className="p-8 max-w-4xl mx-auto">
      <Heading className="mb-6">{t('payout.detail.title')}</Heading>
      
      <div className="bg-ui-bg-subtle p-4 rounded-lg mb-6">
        <Text>
          {t('payout.detail.description')}
        </Text>
      </div>

      {/* Company Information */}
      <div className="bg-ui-bg-base p-6 rounded-lg border border-ui-border-base mb-6">
        <div className="flex justify-between items-center mb-4">
          <Heading level="h3">{t('payout.detail.companyInfo')}</Heading>
          <Tooltip content={t('payout.detail.editCompanyInfo')}>
            <Button 
              variant="secondary" 
              size="small"
              onClick={handleEditCompanyInfo}
            >
              <PencilSquare />
              <span className="ml-2">{t('payout.detail.edit')}</span>
            </Button>
          </Tooltip>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>{t('payout.legalName')}</Label>
            <Text className="mt-1">{legalName}</Text>
          </div>
          
          <div>
            <Label>{t('payout.taxId')}</Label>
            <Text className="mt-1">{taxId}</Text>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-ui-bg-base p-6 rounded-lg border border-ui-border-base mb-6">
        <div className="flex justify-between items-center mb-4">
          <Heading level="h3">{t('payout.detail.contactInfo')}</Heading>
          <Tooltip content={t('payout.detail.editContactInfo')}>
            <Button 
              variant="secondary" 
              size="small"
              onClick={handleEditContactInfo}
            >
              <PencilSquare />
              <span className="ml-2">{t('payout.detail.edit')}</span>
            </Button>
          </Tooltip>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>{t('payout.email')}</Label>
            <Text className="mt-1">{email}</Text>
          </div>
          
          <div>
            <Label>{t('payout.phone')}</Label>
            <Text className="mt-1">{phone}</Text>
          </div>
        </div>
      </div>

      {/* Address Information */}
      <div className="bg-ui-bg-base p-6 rounded-lg border border-ui-border-base mb-6">
        <div className="flex justify-between items-center mb-4">
          <Heading level="h3">{t('payout.detail.address')}</Heading>
          <Tooltip content={t('payout.detail.editAddress')}>
            <Button 
              variant="secondary" 
              size="small"
              onClick={handleEditAddress}
            >
              <PencilSquare />
              <span className="ml-2">{t('payout.detail.edit')}</span>
            </Button>
          </Tooltip>
        </div>
        
        <div className="space-y-2">
          <div>
            <Label>{t('payout.street')}</Label>
            <Text className="mt-1">{address?.street}</Text>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>{t('payout.postalCode')}</Label>
              <Text className="mt-1">{address?.postalCode}</Text>
            </div>
            
            <div>
              <Label>{t('payout.city')}</Label>
              <Text className="mt-1">{address?.city}</Text>
            </div>
          </div>
        </div>
      </div>

      {/* Bank Account Information */}
      <div className="bg-ui-bg-base p-6 rounded-lg border border-ui-border-base mb-6">
        <div className="flex justify-between items-center mb-4">
          <Heading level="h3">Konto Bankowe</Heading>
          <Tooltip content="Edytuj dane konta bankowego">
            <Button 
              variant="secondary" 
              size="small"
              onClick={handleEditBankAccount}
            >
              <PencilSquare />
              <span className="ml-2">Edytuj</span>
            </Button>
          </Tooltip>
        </div>
        
        <div className="space-y-4">
          <div>
            <Label>Właściciel Konta</Label>
            <Text className="mt-1">{bankAccount?.accountHolderName}</Text>
          </div>
          
          <div>
            <Label>Numer IBAN</Label>
            <Text className="mt-1">{bankAccount?.number}</Text>
          </div>
        </div>
      </div>

      {/* Commission Rule Information */}
      <div className="bg-ui-bg-base p-6 rounded-lg border border-ui-border-base mb-6">
        <div className="flex justify-between items-center mb-4">
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
        
        {commissionLoading ? (
          <Text className="text-ui-fg-subtle">{t('common.loading') || 'Ładowanie...'}</Text>
        ) : commissionRule ? (
          <div className="space-y-4">
            <div>
              <Label>{t('payout.detail.commissionRate') || 'Stawka prowizji'}</Label>
              <Text className="mt-1 text-lg font-semibold">{commissionRule.fee_value}</Text>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>{t('payout.detail.commissionType') || 'Typ'}</Label>
                <Text className="mt-1">
                  {commissionRule.type === 'percentage' 
                    ? (t('payout.detail.percentage') || 'Procentowa') 
                    : (t('payout.detail.flat') || 'Stała')}
                </Text>
              </div>
              
              <div>
                <Label>{t('payout.detail.includeTax') || 'Zawiera podatek'}</Label>
                <Text className="mt-1">
                  {commissionRule.include_tax 
                    ? (t('common.yes') || 'Tak') 
                    : (t('common.no') || 'Nie')}
                </Text>
              </div>
            </div>

            {!commissionRule.is_seller_specific && (
              <div className="bg-ui-bg-subtle p-4 rounded-lg mt-4">
                <Text className="text-sm text-ui-fg-subtle">
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
    </Container>
  );
};

export default PayoutDetail;
