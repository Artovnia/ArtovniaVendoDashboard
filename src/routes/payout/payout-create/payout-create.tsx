import React from 'react';
import { useNavigate } from 'react-router-dom';
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

import { useCreateSimplifiedPayuAccount } from '../../../hooks/api/payu';

type PayoutFormData = {
  legalName: string;
  taxId: string; // NIP number
  email: string;
  phone: string;
  
  // Address
  street: string;
  postalCode: string;
  city: string;

  // Bank account
  accountHolderName: string;
  iban: string;
};

/**
 * Component for creating a new payout account
 * Redirects to detail view after successful submission
 */
const PayoutCreate: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PayoutFormData>();

  // Use API hook to create payout account
  const { mutateAsync: createAccount } = useCreateSimplifiedPayuAccount({
    onSuccess: () => {
      toast.success(t('payout.success.accountCreated'), {
        description: t('payout.success.accountCreatedDescription')
      });
      // Redirect to detail view after successful creation
      navigate('/payout/detail');
    },
    onError: (error) => {
      toast.error(t('payout.errors.createFailed'), {
        description: error.message || t('payout.errors.createFailedDescription')
      });
    },
  });

  const onSubmit = async (data: PayoutFormData) => {
    try {
      // Format IBAN - ensure uppercase and no spaces
      const formattedIban = data.iban.toUpperCase().replace(/\s/g, '');
      
      // Create simplified payload for direct bank transfers
      const payload = {
        // Core business details
        legalName: data.legalName,
        taxId: data.taxId,
        email: data.email,
        phone: data.phone,
        
        // Address
        address: {
          street: data.street,
          postalCode: data.postalCode,
          city: data.city,
          countryCode: 'PL', // Hardcoded for Poland
        },
        
        // Bank account details
        bankAccount: {
          number: formattedIban,
          country: 'PL',
          accountHolderName: data.accountHolderName,
        },
        
        // Currency is needed for the TypeScript type but won't be sent to backend
        currency: 'PLN'
      };
      
      // Send the account creation request
      await createAccount(payload);
    } catch (error) {
      console.error('Error creating payout account:', error);
      toast.error(t('payout.errors.createFailed'), {
        description: error instanceof Error ? error.message : t('payout.errors.unknownError')
      });
    }
  };

  return (
    <Container className="p-8 max-w-4xl mx-auto">
      <Heading className="mb-6">{t('payout.title')}</Heading>
      
      <div className="bg-ui-bg-subtle p-4 rounded-lg mb-6">
        <Text>
          {t('payout.description')}
        </Text>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-[700px]">
        <div className="bg-ui-bg-subtle p-6 rounded-lg border border-ui-border-base">
          <Heading level="h3" className="mb-4">{t('payout.companyInfo')}</Heading>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="legalName">{t('payout.legalName')}</Label>
              <Input
                id="legalName"
                placeholder={t('payout.legalNamePlaceholder')}
                {...register('legalName', { required: t('payout.validation.legalNameRequired') })}
                className={errors.legalName ? 'border-red-500' : ''}
              />
              {errors.legalName && (
                <Text className="text-red-500 mt-1 text-sm">
                  {errors.legalName.message}
                </Text>
              )}
            </div>

            <div>
              <Label htmlFor="taxId">{t('payout.taxId')}</Label>
              <Input
                id="taxId"
                placeholder={t('payout.taxIdPlaceholder')}
                {...register('taxId', { 
                  required: t('payout.validation.taxIdRequired'),
                  pattern: {
                    value: /^[0-9]{10}$/,
                    message: t('payout.validation.taxIdInvalid')
                  }
                })}
                className={errors.taxId ? 'border-red-500' : ''}
              />
              {errors.taxId && (
                <Text className="text-red-500 mt-1 text-sm">
                  {errors.taxId.message}
                </Text>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">{t('payout.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('payout.emailPlaceholder')}
                  {...register('email', { 
                    required: t('payout.validation.emailRequired'),
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: t('payout.validation.emailInvalid')
                    }
                  })}
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <Text className="text-red-500 mt-1 text-sm">
                    {errors.email.message}
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
                    {errors.phone.message}
                  </Text>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-ui-bg-subtle p-6 rounded-lg border border-ui-border-base">
          <Heading level="h3" className="mb-4">Adres</Heading>
          
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
                  {errors.street.message}
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
                    {errors.postalCode.message}
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
                    {errors.city.message}
                  </Text>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-ui-bg-subtle p-6 rounded-lg border border-ui-border-base">
          <Heading level="h3" className="mb-4">Konto Bankowe</Heading>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="accountHolderName">Właściciel Konta</Label>
              <Input
                id="accountHolderName"
                placeholder="Imię i nazwisko zgodne z kontem bankowym"
                {...register('accountHolderName', { 
                  required: 'Właściciel konta jest wymagany' 
                })}
                className={errors.accountHolderName ? 'border-red-500' : ''}
              />
              {errors.accountHolderName && (
                <Text className="text-red-500 mt-1 text-sm">
                  {errors.accountHolderName.message}
                </Text>
              )}
            </div>

            <div>
              <Label htmlFor="iban">Numer IBAN</Label>
              <Input
                id="iban"
                placeholder="PL00 0000 0000 0000 0000 0000 0000"
                {...register('iban', { 
                  required: 'Numer IBAN jest wymagany',
                  pattern: {
                    // Basic validation for Polish IBAN (PL + 26 digits)
                    value: /^PL[0-9]{26}$|^PL\s?[0-9]{2}\s?[0-9]{4}\s?[0-9]{4}\s?[0-9]{4}\s?[0-9]{4}\s?[0-9]{4}\s?[0-9]{4}$/i,
                    message: 'Proszę podać prawidłowy polski IBAN (PL z 26 cyframi)'
                  }
                })}
                className={errors.iban ? 'border-red-500' : ''}
              />
              {errors.iban && (
                <Text className="text-red-500 mt-1 text-sm">
                  {errors.iban.message}
                </Text>
              )}
              <Text className="text-xs text-ui-fg-subtle mt-1">
                Format: PL z 26 cyframi. Spacje są dozwolone.
              </Text>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button 
            variant="primary" 
            type="submit" 
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            Skonfiguruj Konto Wypłat
          </Button>
        </div>
      </form>
    </Container>
  );
};

export default PayoutCreate;
