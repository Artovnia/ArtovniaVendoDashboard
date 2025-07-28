import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { 
  Button, 
  Container,
  Heading, 
  Input, 
  Label, 
  Text,
  toast 
} from '@medusajs/ui';
import { useTranslation } from 'react-i18next';
import { usePayuAccount, useUpdatePayuAccount } from '../../../hooks/api/payu';

/**
 * PayoutEdit component - handles editing specific sections of the payout account
 * Supports editing bank account, address and contact information
 */
const PayoutEdit: React.FC = () => {
  const { t } = useTranslation();
  const { section } = useParams<{ section: string }>();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  
  const { data: payoutAccount, isLoading } = usePayuAccount();
  
  const { mutateAsync: updateAccount, isPending: isUpdating } = useUpdatePayuAccount({
    onSuccess: () => {
      toast.success(t('payout.success.dataUpdated'), {
        description: t('payout.success.dataUpdatedDescription')
      });
      navigate('/payout/detail');
    },
    onError: (error) => {
      toast.error(t('payout.errors.updateFailed'), {
        description: error.message || t('payout.errors.tryAgain')
      });
    },
  });
  
  // Set up form based on section being edited
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm();
  
  // Load current data into form when available
  useEffect(() => {
    if (payoutAccount && section) {
      setIsEditing(true);
      
      // Extract data from all available sources
      const context = payoutAccount.context || {};
      const bankAccountData = payoutAccount.bank_account_data || {};
      
      console.log('Form initialization with data:', { payoutAccount, context });
      
      // Initialize form values based on the section being edited
      switch (section) {
        case 'bank-account':
          reset({
            accountHolderName: payoutAccount.bankAccount?.accountHolderName || 
                             context.account_holder_name || 
                             bankAccountData.account_holder_name || 
                             '',
            iban: payoutAccount.bankAccount?.number || 
                  context.iban || 
                  context.bank_account || 
                  ''
          });
          console.log('Bank account form reset with:', {
            accountHolderName: payoutAccount.bankAccount?.accountHolderName || context.account_holder_name || bankAccountData.account_holder_name,
            iban: payoutAccount.bankAccount?.number || context.iban || context.bank_account
          });
          break;
          
        case 'address':
          reset({
            street: payoutAccount.address?.street || context.street || context.address1 || '',
            postalCode: payoutAccount.address?.postalCode || context.postal_code || '',
            city: payoutAccount.address?.city || context.city || ''
          });
          console.log('Address form reset with:', {
            street: payoutAccount.address?.street || context.street || context.address1,
            postalCode: payoutAccount.address?.postalCode || context.postal_code,
            city: payoutAccount.address?.city || context.city
          });
          break;
          
        case 'contact':
          reset({
            email: payoutAccount.email || context.email || '',
            phone: payoutAccount.phone || context.phone || ''
          });
          console.log('Contact form reset with:', {
            email: payoutAccount.email || context.email,
            phone: payoutAccount.phone || context.phone
          });
          break;
          
        case 'company':
          // Initialize company information form
          reset({
            companyName: payoutAccount.company_name || context.company_name || '',
            taxId: payoutAccount.tax_id || context.tax_id || ''
          });
          console.log('Company form reset with:', {
            companyName: payoutAccount.company_name || context.company_name,
            taxId: payoutAccount.tax_id || context.tax_id
          });
          break;
          
        default:
          console.log('Unknown section:', section);
          navigate('/payout/detail');
      }
    }
  }, [payoutAccount, section, reset]);
  
  if (isLoading) {
    return (
      <Container className="p-8 max-w-4xl mx-auto">
        <Text>Ładowanie danych konta wypłat...</Text>
      </Container>
    );
  }
  
  if (!payoutAccount || !section) {
    return (
      <Container className="p-8 max-w-4xl mx-auto">
        <Text>Nie znaleziono danych konta wypłat.</Text>
        <Button 
          variant="secondary" 
          className="mt-4"
          onClick={() => navigate('/payout/create')}
        >
          Utwórz konto wypłat
        </Button>
      </Container>
    );
  }
  
  const onSubmit = async (data: any) => {
    try {
      const updateData: any = { ...payoutAccount };
      
      // Update only the section being edited
      switch (section) {
        case 'bank-account':
          const formattedIban = data.iban.toUpperCase().replace(/\s/g, '');
          updateData.bankAccount = {
            ...updateData.bankAccount,
            accountHolderName: data.accountHolderName,
            number: formattedIban
          };
          break;
        case 'address':
          updateData.address = {
            ...updateData.address,
            street: data.street,
            postalCode: data.postalCode,
            city: data.city
          };
          break;
        case 'contact':
          updateData.email = data.email;
          updateData.phone = data.phone;
          break;
        case 'company':
          // Handle company information update
          // Make sure we update both the top-level and context properties
          // This ensures the data is available in both locations for different parts of the system
          
          // First, store it in the top-level properties
          updateData.company_name = data.companyName;
          updateData.tax_id = data.taxId;
          
          // Ensure context exists
          if (!updateData.context) {
            updateData.context = {};
          }
          
          // Update in context object for backend compatibility
          updateData.context = {
            ...updateData.context,
            company_name: data.companyName,
            tax_id: data.taxId
          };
          break;
      }
      
      await updateAccount(updateData);
    } catch (error) {
      console.error(`Error updating ${section}:`, error);
      toast.error("Nie udało się zaktualizować danych", {
        description: error instanceof Error ? error.message : "Wystąpił nieznany błąd"
      });
    }
  };
  
  // Different forms based on section
  const renderForm = () => {
    switch (section) {
      case 'bank-account':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="accountHolderName">{t('payout.accountHolderName')}</Label>
              <Input
                id="accountHolderName"
                placeholder={t('payout.placeholders.accountHolderName')}
                {...register('accountHolderName', { required: t('payout.validation.accountHolderNameRequired') })}
                className={errors.accountHolderName ? 'border-red-500' : ''}
              />
              {errors.accountHolderName && (
                <Text className="text-red-500 mt-1 text-sm">
                  {errors.accountHolderName.message as string}
                </Text>
              )}
            </div>

            <div>
              <Label htmlFor="iban">{t('payout.iban')}</Label>
              <Input
                id="iban"
                placeholder={t('payout.placeholders.iban')}
                {...register('iban', { 
                  required: t('payout.validation.ibanRequired'),
                  pattern: {
                    // Basic validation for Polish IBAN (PL + 26 digits)
                    value: /^PL[0-9]{26}$|^PL\s?[0-9]{2}\s?[0-9]{4}\s?[0-9]{4}\s?[0-9]{4}\s?[0-9]{4}\s?[0-9]{4}\s?[0-9]{4}$/i,
                    message: t('payout.validation.ibanInvalid')
                  }
                })}
                className={errors.iban ? 'border-red-500' : ''}
              />
              {errors.iban && (
                <Text className="text-red-500 mt-1 text-sm">
                  {errors.iban.message as string}
                </Text>
              )}
              <Text className="text-xs text-ui-fg-subtle mt-1">
                {t('payout.validation.ibanFormat')}
              </Text>
            </div>
          </div>
        );
      
      case 'address':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="street">Ulica</Label>
              <Input
                id="street"
                placeholder="np. Nowa 123/45"
                {...register('street', { required: 'Ulica jest wymagana' })}
                className={errors.street ? 'border-red-500' : ''}
              />
              {errors.street && (
                <Text className="text-red-500 mt-1 text-sm">
                  {errors.street.message as string}
                </Text>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="postalCode">Kod Pocztowy</Label>
                <Input
                  id="postalCode"
                  placeholder="np. 00-001"
                  {...register('postalCode', { 
                    required: 'Kod pocztowy jest wymagany',
                    pattern: {
                      value: /^\d{2}-\d{3}$/,
                      message: 'Proszę podać prawidłowy polski kod pocztowy (XX-XXX)'
                    }
                  })}
                  className={errors.postalCode ? 'border-red-500' : ''}
                />
                {errors.postalCode && (
                  <Text className="text-red-500 mt-1 text-sm">
                    {errors.postalCode.message as string}
                  </Text>
                )}
              </div>
              
              <div>
                <Label htmlFor="city">Miasto</Label>
                <Input
                  id="city"
                  placeholder="np. Warszawa"
                  {...register('city', { required: 'Miasto jest wymagane' })}
                  className={errors.city ? 'border-red-500' : ''}
                />
                {errors.city && (
                  <Text className="text-red-500 mt-1 text-sm">
                    {errors.city.message as string}
                  </Text>
                )}
              </div>
            </div>
          </div>
        );
      
      case 'contact':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                placeholder="firma@example.com"
                {...register('email', { 
                  required: 'Email jest wymagany',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Proszę podać prawidłowy adres email'
                  }
                })}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <Text className="text-red-500 mt-1 text-sm">
                  {errors.email.message as string}
                </Text>
              )}
            </div>
            
            <div>
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                placeholder="np. +48123456789"
                {...register('phone', { 
                  required: 'Numer telefonu jest wymagany',
                  pattern: {
                    value: /^\+?[0-9\s-]{9,15}$/,
                    message: 'Proszę podać prawidłowy numer telefonu'
                  }
                })}
                className={errors.phone ? 'border-red-500' : ''}
              />
              {errors.phone && (
                <Text className="text-red-500 mt-1 text-sm">
                  {errors.phone.message as string}
                </Text>
              )}
            </div>
          </div>
        );
      
      case 'company':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="companyName">Nazwa Prawna</Label>
              <Input
                id="companyName"
                placeholder="Nazwa firmy"
                {...register('companyName', { 
                  required: 'Nazwa firmy jest wymagana'
                })}
                className={errors.companyName ? 'border-red-500' : ''}
              />
              {errors.companyName && (
                <Text className="text-red-500 mt-1 text-sm">
                  {errors.companyName.message as string}
                </Text>
              )}
            </div>
            
            <div>
              <Label htmlFor="taxId">Numer NIP</Label>
              <Input
                id="taxId"
                placeholder="np. 1234567890"
                {...register('taxId', { 
                  required: 'NIP jest wymagany',
                  pattern: {
                    value: /^[0-9]{10}$/,
                    message: 'NIP powinien składać się z 10 cyfr bez myślników i spacji'
                  }
                })}
                className={errors.taxId ? 'border-red-500' : ''}
              />
              {errors.taxId && (
                <Text className="text-red-500 mt-1 text-sm">
                  {errors.taxId.message as string}
                </Text>
              )}
            </div>
          </div>
        );
      
      default:
        return <Text>{t('payout.edit.selectSection')}</Text>;
    }
  };

  const getSectionTitle = () => {
    switch (section) {
      case 'bank-account': return t('payout.edit.bankAccount');
      case 'address': return t('payout.edit.address');
      case 'contact': return t('payout.edit.contact');
      case 'company': return t('payout.edit.company');
      default: return t('payout.edit.title');
    }
  };

  return (
    <Container className="p-8 max-w-4xl mx-auto">
      <Heading className="mb-6">{getSectionTitle()}</Heading>
      
      <div className="bg-ui-bg-subtle p-4 rounded-lg mb-6">
        <Text>
          {t('payout.edit.description')}
        </Text>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-[700px]">
        <div className="bg-ui-bg-subtle p-6 rounded-lg border border-ui-border-base">
          {renderForm()}
        </div>

        <div className="flex justify-end space-x-4 pt-4">
          <Button 
            variant="secondary" 
            onClick={() => navigate('/payout/detail')}
            disabled={isUpdating}
          >
            {t('actions.cancel')}
          </Button>
          <Button 
            variant="primary" 
            type="submit" 
            isLoading={isUpdating}
            disabled={isUpdating || !isEditing}
          >
            {t('payout.edit.saveChanges')}
          </Button>
        </div>
      </form>
    </Container>
  );
};

export default PayoutEdit;
