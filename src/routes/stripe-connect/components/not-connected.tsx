import { ExclamationCircle, Buildings, User } from '@medusajs/icons';
import { Button, Heading, Text, Select, Label, Input } from '@medusajs/ui';
import { useState } from 'react';
import { useCreateStripeAccount } from '../../../hooks/api';
import { useTranslation } from 'react-i18next';

interface IndividualFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  iban: string;
  address1: string;
  city: string;
  postal_code: string;
  country: string;
}

interface CompanyFormData {
  company_name: string;
  tax_id: string;
  email: string;
  phone?: string;
  iban: string;
  address1: string;
  city: string;
  postal_code: string;
  country: string;
  representative_first_name: string;
  representative_last_name: string;
}

export const NotConnected = () => {
  const { t } = useTranslation();
  const { mutateAsync, isPending } = useCreateStripeAccount();
  const [accountType, setAccountType] = useState<'individual' | 'company'>('individual');
  const [showForm, setShowForm] = useState(false);
  
  const [individualFormData, setIndividualFormData] = useState<IndividualFormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    iban: '',
    address1: '',
    city: '',
    postal_code: '',
    country: 'PL'
  });
  
  const [companyFormData, setCompanyFormData] = useState<CompanyFormData>({
    company_name: '',
    tax_id: '',
    email: '',
    phone: '',
    iban: '',
    address1: '',
    city: '',
    postal_code: '',
    country: 'PL',
    representative_first_name: '',
    representative_last_name: ''
  });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formDataToSubmit = accountType === 'individual' ? {
      business_type: 'individual',
      ...individualFormData,
      country: 'PL'
    } : {
      business_type: 'company', 
      ...companyFormData,
      country: 'PL'
    };
    
    mutateAsync({
      context: formDataToSubmit,
    });
  };

  const handleIndividualInputChange = (field: keyof IndividualFormData, value: string) => {
    setIndividualFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCompanyInputChange = (field: keyof CompanyFormData, value: string) => {
    setCompanyFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!showForm) {
    return (
      <div className='flex items-center justify-center text-center my-16 flex-col max-w-md mx-auto'>
        <ExclamationCircle className='text-ui-fg-muted mb-4' />
        <Heading level='h2' className='mt-4 mb-2'>
          {t('stripeConnect.notConnected.title')}
        </Heading>
        <Text className='text-ui-fg-subtle mb-6' size='small'>
          {t('stripeConnect.notConnected.description')}
        </Text>
        
        <div className='w-full mb-6'>
          <Label className='mb-3 block text-left'>
            {t('stripeConnect.accountType.label')}
          </Label>
          <div className='grid grid-cols-2 gap-3'>
            <button
              type='button'
              onClick={() => setAccountType('individual')}
              className={`p-4 border rounded-lg flex flex-col items-center gap-2 transition-colors ${
                accountType === 'individual'
                  ? 'border-ui-border-interactive bg-ui-bg-subtle'
                  : 'border-ui-border-base hover:border-ui-border-strong'
              }`}
            >
              <User className='text-ui-fg-muted' />
              <div className='text-center'>
                <Text size='small' weight='plus'>
                  {t('stripeConnect.accountType.individual')}
                </Text>
                <Text size='xsmall' className='text-ui-fg-subtle mt-1'>
                  {t('stripeConnect.accountType.individualDesc')}
                </Text>
              </div>
            </button>
            
            <button
              type='button'
              onClick={() => setAccountType('company')}
              className={`p-4 border rounded-lg flex flex-col items-center gap-2 transition-colors ${
                accountType === 'company'
                  ? 'border-ui-border-interactive bg-ui-bg-subtle'
                  : 'border-ui-border-base hover:border-ui-border-strong'
              }`}
            >
              <Buildings className='text-ui-fg-muted' />
              <div className='text-center'>
                <Text size='small' weight='plus'>
                  {t('stripeConnect.accountType.company')}
                </Text>
                <Text size='xsmall' className='text-ui-fg-subtle mt-1'>
                  {t('stripeConnect.accountType.companyDesc')}
                </Text>
              </div>
            </button>
          </div>
        </div>

        <div className='bg-ui-bg-subtle p-4 rounded-lg mb-6 w-full'>
          <Text size='xsmall' className='text-ui-fg-subtle text-left'>
            {accountType === 'individual' 
              ? t('stripeConnect.requirements.individual')
              : t('stripeConnect.requirements.company')
            }
          </Text>
        </div>

        <Button
          className='w-full'
          onClick={() => setShowForm(true)}
          size='large'
        >
          {t('stripeConnect.actions.connect')}
        </Button>
        
        <Text size='xsmall' className='text-ui-fg-muted mt-4 text-center'>
          {t('stripeConnect.notes.secureNote')}
        </Text>
      </div>
    );
  }

  return (
    <div className='max-w-2xl mx-auto my-8'>
      <div className='mb-6 text-center'>
        <Heading level='h2' className='mb-2'>
          {t('stripeConnect.form.title')}
        </Heading>
        <Text className='text-ui-fg-subtle' size='small'>
          {t('stripeConnect.form.subtitle')}
        </Text>
      </div>

      <form onSubmit={handleFormSubmit} className='space-y-6'>
        {accountType === 'individual' ? (
          // Individual Account Form
          <>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='first_name'>{t('stripeConnect.form.firstName')} *</Label>
                <Input
                  id='first_name'
                  value={individualFormData.first_name}
                  onChange={(e) => handleIndividualInputChange('first_name', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor='last_name'>{t('stripeConnect.form.lastName')} *</Label>
                <Input
                  id='last_name'
                  value={individualFormData.last_name}
                  onChange={(e) => handleIndividualInputChange('last_name', e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor='email'>{t('stripeConnect.form.email')} *</Label>
              <Input
                id='email'
                type='email'
                value={individualFormData.email}
                onChange={(e) => handleIndividualInputChange('email', e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor='phone'>{t('stripeConnect.form.phone')}</Label>
              <Input
                id='phone'
                type='tel'
                value={individualFormData.phone || ''}
                onChange={(e) => handleIndividualInputChange('phone', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor='address1'>{t('stripeConnect.form.address')} *</Label>
              <Input
                id='address1'
                value={individualFormData.address1}
                onChange={(e) => handleIndividualInputChange('address1', e.target.value)}
                required
              />
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='city'>{t('stripeConnect.form.city')} *</Label>
                <Input
                  id='city'
                  value={individualFormData.city}
                  onChange={(e) => handleIndividualInputChange('city', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor='postal_code'>{t('stripeConnect.form.postalCode')} *</Label>
                <Input
                  id='postal_code'
                  value={individualFormData.postal_code}
                  onChange={(e) => handleIndividualInputChange('postal_code', e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor='iban'>{t('stripeConnect.form.iban')} *</Label>
              <Input
                id='iban'
                value={individualFormData.iban}
                onChange={(e) => handleIndividualInputChange('iban', e.target.value)}
                placeholder={t('stripeConnect.form.ibanPlaceholder')}
                required
              />
            </div>
          </>
        ) : (
          // Company Account Form
          <>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='company_name'>{t('stripeConnect.form.companyName')} *</Label>
                <Input
                  id='company_name'
                  value={companyFormData.company_name}
                  onChange={(e) => handleCompanyInputChange('company_name', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor='tax_id'>{t('stripeConnect.form.taxId')} *</Label>
                <Input
                  id='tax_id'
                  value={companyFormData.tax_id}
                  onChange={(e) => handleCompanyInputChange('tax_id', e.target.value)}
                  placeholder="NIP"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor='email'>{t('stripeConnect.form.email')} *</Label>
              <Input
                id='email'
                type='email'
                value={companyFormData.email}
                onChange={(e) => handleCompanyInputChange('email', e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor='phone'>{t('stripeConnect.form.phone')}</Label>
              <Input
                id='phone'
                type='tel'
                value={companyFormData.phone || ''}
                onChange={(e) => handleCompanyInputChange('phone', e.target.value)}
              />
            </div>

            <div className='bg-ui-bg-subtle p-4 rounded-lg'>
              <Text size='small' className='font-medium mb-3'>
                {t('stripeConnect.form.representativeInfo')}
              </Text>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <Label htmlFor='representative_first_name'>{t('stripeConnect.form.firstName')} *</Label>
                  <Input
                    id='representative_first_name'
                    value={companyFormData.representative_first_name}
                    onChange={(e) => handleCompanyInputChange('representative_first_name', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor='representative_last_name'>{t('stripeConnect.form.lastName')} *</Label>
                  <Input
                    id='representative_last_name'
                    value={companyFormData.representative_last_name}
                    onChange={(e) => handleCompanyInputChange('representative_last_name', e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor='address1'>{t('stripeConnect.form.address')} *</Label>
              <Input
                id='address1'
                value={companyFormData.address1}
                onChange={(e) => handleCompanyInputChange('address1', e.target.value)}
                required
              />
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='city'>{t('stripeConnect.form.city')} *</Label>
                <Input
                  id='city'
                  value={companyFormData.city}
                  onChange={(e) => handleCompanyInputChange('city', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor='postal_code'>{t('stripeConnect.form.postalCode')} *</Label>
                <Input
                  id='postal_code'
                  value={companyFormData.postal_code}
                  onChange={(e) => handleCompanyInputChange('postal_code', e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor='iban'>{t('stripeConnect.form.iban')} *</Label>
              <Input
                id='iban'
                value={companyFormData.iban}
                onChange={(e) => handleCompanyInputChange('iban', e.target.value)}
                placeholder={t('stripeConnect.form.ibanPlaceholder')}
                required
              />
            </div>
          </>
        )}

        <div className='bg-ui-bg-subtle p-4 rounded-lg'>
          <Text size='xsmall' className='text-ui-fg-subtle'>
            {t('stripeConnect.notes.secureNote')}
          </Text>
        </div>

        <div className='flex gap-3'>
          <Button
            type='button'
            variant='secondary'
            onClick={() => setShowForm(false)}
            className='flex-1'
          >
            {t('stripeConnect.form.back')}
          </Button>
          <Button
            type='submit'
            isLoading={isPending}
            className='flex-1'
          >
            {t('stripeConnect.form.submit')}
          </Button>
        </div>
      </form>
    </div>
  );
};