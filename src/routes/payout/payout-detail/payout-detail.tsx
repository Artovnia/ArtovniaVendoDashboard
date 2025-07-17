import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Container,
  Heading,
  Text,
  Tooltip,
  Label,
} from '@medusajs/ui';
import { usePayuAccount } from '../../../hooks/api/payu';
import { PencilSquare } from '@medusajs/icons';

/**
 * PayoutDetail component
 * Displays the existing payout account configuration information
 * with options to edit specific sections
 */
const PayoutDetail: React.FC = () => {
  const navigate = useNavigate();
  
  // Fetch the payout account data with explicit refetch capability
  const { data: payoutAccount, isLoading, error, refetch } = usePayuAccount();
  
  // Force a refresh when component mounts - useful after navigation
  React.useEffect(() => {
    // This ensures we get fresh data after an update operation
    refetch();
  }, [refetch]);
  
  console.log('Payout account data:', payoutAccount); // Debug log to see what data we're getting

  // Display loading state
  if (isLoading) {
    return (
      <Container className="p-8 max-w-4xl mx-auto">
        <Text>Pobieranie informacji o koncie wypłat...</Text>
      </Container>
    );
  }

  // Handle error or missing account data
  if (error || !payoutAccount) {
    return (
      <Container className="p-8 max-w-4xl mx-auto">
        <Heading className="mb-6">Dane konta wypłat</Heading>
        <div className="bg-ui-bg-subtle p-4 rounded-lg mb-6">
          <Text className="text-ui-fg-error">
            Nie można wyświetlić informacji o koncie wypłat. 
            {error?.message && ` Powód: ${error.message}`}
          </Text>
          <Button 
            variant="secondary" 
            className="mt-4"
            onClick={() => navigate('/payout/create')}
          >
            Skonfiguruj konto wypłat
          </Button>
        </div>
      </Container>
    );
  }

  // Data is available at this point
  // Extract data from the context field where it's stored by the backend
  const context = payoutAccount?.context || {};
  const bankAccountData = payoutAccount?.bank_account_data || {};
  
  console.log('Context data:', context);
  console.log('Bank account data:', bankAccountData);
  
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
  
  console.log('Extracted data:', {
    legalName,
    taxId,
    email,
    phone,
    address,
    bankAccount
  });
  
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
      <Heading className="mb-6">Dane konta wypłat</Heading>
      
      <div className="bg-ui-bg-subtle p-4 rounded-lg mb-6">
        <Text>
          Poniżej znajdują się informacje dotyczące Twojego konta wypłat.
          Możesz edytować poszczególne sekcje klikając przycisk edycji.
        </Text>
      </div>

      {/* Company Information */}
      <div className="bg-ui-bg-base p-6 rounded-lg border border-ui-border-base mb-6">
        <div className="flex justify-between items-center mb-4">
          <Heading level="h3">Informacje o Firmie</Heading>
          <Tooltip content="Edytuj informacje o firmie">
            <Button 
              variant="secondary" 
              size="small"
              onClick={handleEditCompanyInfo}
            >
              <PencilSquare />
              <span className="ml-2">Edytuj</span>
            </Button>
          </Tooltip>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Nazwa Prawna</Label>
            <Text className="mt-1">{legalName}</Text>
          </div>
          
          <div>
            <Label>Numer NIP</Label>
            <Text className="mt-1">{taxId}</Text>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-ui-bg-base p-6 rounded-lg border border-ui-border-base mb-6">
        <div className="flex justify-between items-center mb-4">
          <Heading level="h3">Informacje Kontaktowe</Heading>
          <Tooltip content="Edytuj informacje kontaktowe">
            <Button 
              variant="secondary" 
              size="small"
              onClick={handleEditContactInfo}
            >
              <PencilSquare />
              <span className="ml-2">Edytuj</span>
            </Button>
          </Tooltip>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Email</Label>
            <Text className="mt-1">{email}</Text>
          </div>
          
          <div>
            <Label>Telefon</Label>
            <Text className="mt-1">{phone}</Text>
          </div>
        </div>
      </div>

      {/* Address Information */}
      <div className="bg-ui-bg-base p-6 rounded-lg border border-ui-border-base mb-6">
        <div className="flex justify-between items-center mb-4">
          <Heading level="h3">Adres</Heading>
          <Tooltip content="Edytuj adres">
            <Button 
              variant="secondary" 
              size="small"
              onClick={handleEditAddress}
            >
              <PencilSquare />
              <span className="ml-2">Edytuj</span>
            </Button>
          </Tooltip>
        </div>
        
        <div className="space-y-2">
          <div>
            <Label>Ulica</Label>
            <Text className="mt-1">{address?.street}</Text>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Kod Pocztowy</Label>
              <Text className="mt-1">{address?.postalCode}</Text>
            </div>
            
            <div>
              <Label>Miasto</Label>
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
    </Container>
  );
};

export default PayoutDetail;
