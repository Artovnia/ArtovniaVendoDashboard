import { CheckCircleSolid, ExclamationCircle, ClockSolid, ExclamationCircleSolid, CurrencyDollar, ArrowRight } from '@medusajs/icons';
import { Button, Text, Container } from '@medusajs/ui';
import { useCreateStripeOnboarding, useStripeAccount } from '../../../hooks/api';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatusCell } from '../../../components/table/table-cells/common/status-cell';
import { useOnboardingContext } from '../../../providers/onboarding-provider';

// TypeScript interfaces for better type safety
interface StripeRequirements {
  currently_due?: string[];
  past_due?: string[];
  eventually_due?: string[];
  pending_verification?: string[];
  disabled_reason?: string | null;
  current_deadline?: number;
  errors?: Array<{
    requirement: string;
    code: string;
    reason: string;
  }>;
}

interface StripeAccountData {
  charges_enabled: boolean;
  payouts_enabled: boolean;
  requirements?: StripeRequirements;
  business_type?: string;
  default_currency?: string;
  country?: string;
}

interface PayoutAccountContext {
  business_type?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  country?: string;
  [key: string]: any;
}

interface PayoutAccount {
  id: string;
  reference_id?: string;
  status: string;
  data?: StripeAccountData;
  context?: PayoutAccountContext;
  onboarding?: any;
}

interface StatusConfig {
  icon: React.ReactElement;
  title: string;
  description: string;
  variant: 'success' | 'warning' | 'error' | 'default';
  color: 'green' | 'red' | 'blue' | 'orange' | 'grey' | 'purple';
  showOnboardingButton?: boolean;
  showDashboardLink?: boolean;
  showSupportLink?: boolean;
}

interface ConnectedProps {
  status: string;
}

export const Connected = ({ status }: ConnectedProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { mutateAsync, isPending } = useCreateStripeOnboarding();
  const { payout_account } = useStripeAccount() as { payout_account?: PayoutAccount };
  const { isOnboarding } = useOnboardingContext();
  const [error, setError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Environment detection for production safety
  const isProduction = process.env.NODE_ENV === 'production';
  const isTestMode = payout_account?.reference_id?.startsWith('acct_test_') || 
                   payout_account?.reference_id?.includes('test');

  // Helper function to translate Stripe requirement codes
  const getRequirementDescription = (requirement: string): string => {
    const polishDescriptions: Record<string, string> = {
      'business_profile.mcc': 'Kod branży (MCC) - przypisywany automatycznie na podstawie nazwy branży',
      'business_profile.url': 'Strona internetowa lub nazwa sprzedawanych produktów',
      'business_type': 'Typ działalności',
      'external_account': 'Konto bankowe do wypłat',
      'individual.address.city': 'Miasto w adresie',
      'individual.address.line1': 'Adres zamieszkania',
      'individual.address.postal_code': 'Kod pocztowy',
      'individual.dob.day': 'Dzień urodzenia',
      'individual.dob.month': 'Miesiąc urodzenia', 
      'individual.dob.year': 'Rok urodzenia',
      'individual.email': 'Adres email',
      'individual.first_name': 'Imię',
      'individual.last_name': 'Nazwisko',
      'individual.phone': 'Numer telefonu',
      'individual.verification.document': 'Dokument tożsamości (ID)',
      'individual.id_number': 'Numer PESEL',
      'tos_acceptance.date': 'Akceptacja regulaminu',
      'tos_acceptance.ip': 'Potwierdzenie akceptacji regulaminu',
      'representative.address.city': 'Miasto przedstawiciela',
      'representative.address.line1': 'Adres przedstawiciela',
      'representative.address.postal_code': 'Kod pocztowy przedstawiciela',
      'representative.dob.day': 'Dzień urodzenia przedstawiciela',
      'representative.dob.month': 'Miesiąc urodzenia przedstawiciela',
      'representative.dob.year': 'Rok urodzenia przedstawiciela',
      'representative.email': 'Email przedstawiciela',
      'representative.first_name': 'Imię przedstawiciela',
      'representative.last_name': 'Nazwisko przedstawiciela',
      'representative.phone': 'Telefon przedstawiciela',
      'representative.nationality': 'Narodowość przedstawiciela',
      'requirements.past_due': 'Wymagane dodatkowe dane',
      'requirements.pending_verification': 'Dane oczekują na weryfikację'
    };

    const englishDescriptions: Record<string, string> = {
      'business_profile.mcc': 'Industry Code (MCC) - assigned automatically based on industry name',
      'business_profile.url': 'Website or product description',
      'business_type': 'Business Type',
      'external_account': 'Bank Account for Payouts',
      'individual.address.city': 'City in Address',
      'individual.address.line1': 'Residential Address',
      'individual.address.postal_code': 'Postal Code',
      'individual.dob.day': 'Date of Birth - Day',
      'individual.dob.month': 'Date of Birth - Month', 
      'individual.dob.year': 'Date of Birth - Year',
      'individual.email': 'Email Address',
      'individual.first_name': 'First Name',
      'individual.last_name': 'Last Name',
      'individual.phone': 'Phone Number',
      'individual.verification.document': 'Identity Document (ID)',
      'individual.id_number': 'ID Number',
      'tos_acceptance.date': 'Terms of Service Acceptance',
      'tos_acceptance.ip': 'Terms of Service Confirmation',
      'representative.address.city': 'Representative City',
      'representative.address.line1': 'Representative Address',
      'representative.address.postal_code': 'Representative Postal Code',
      'representative.dob.day': 'Representative Date of Birth - Day',
      'representative.dob.month': 'Representative Date of Birth - Month',
      'representative.dob.year': 'Representative Date of Birth - Year',
      'representative.email': 'Representative Email',
      'representative.first_name': 'Representative First Name',
      'representative.last_name': 'Representative Last Name',
      'representative.phone': 'Representative Phone',
      'representative.nationality': 'Representative Nationality',
      'requirements.past_due': 'Required more information',
      'requirements.pending_verification': 'Information pending verification'
    };
    
    // Use Polish if current language is Polish, otherwise English
    const currentLang = t('general.ascending') === 'Rosnąco' ? 'pl' : 'en';
    const descriptions = currentLang === 'pl' ? polishDescriptions : englishDescriptions;
    
    return descriptions[requirement] || requirement;
  };

  const handleOnboarding = async () => {
    if (isRedirecting) return; // Prevent double clicks
    
    setError(null);
    setIsRedirecting(true);
    
    try {
      const response = await mutateAsync({
        context: {
          country: 'PL',
          refresh_url: window.location.href,
          return_url: window.location.href,
        },
      });
      
      if (!isProduction) {
        console.log('[Stripe][Frontend] Onboarding response:', response);
      }
      
      // Check if response contains onboarding data with URL
      const onboardingUrl = response?.payout_account?.onboarding?.data?.url || 
                           response?.onboarding?.data?.url;
      
      if (onboardingUrl && typeof onboardingUrl === 'string') {
        // Use window.location.assign for better browser compatibility
        window.location.assign(onboardingUrl);
      } else {
        throw new Error('No onboarding URL received from server');
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Wystąpił błąd podczas inicjalizacji rejestracji.';
      setError(errorMessage);
      
      if (!isProduction) {
        console.error('[Stripe][Frontend] Onboarding error:', error);
      }
    } finally {
      setIsRedirecting(false);
    }
  };


  const getStatusConfig = (status: string): StatusConfig => {
    switch (status) {
      case 'connected':
      case 'active':
        return {
          icon: <CheckCircleSolid className='text-ui-tag-green-text' />,
          title: t('stripeConnect.connected.title'),
          description: t('stripeConnect.connected.description'),
          variant: 'success' as const,
          color: 'green' as const,
          showDashboardLink: true
        };
      case 'pending':
        return {
          icon: <ClockSolid className='text-ui-tag-orange-text' />,
          title: t('stripeConnect.pending.title'),
          description: t('stripeConnect.pending.description'),
          variant: 'warning' as const,
          color: 'orange' as const,
          showOnboardingButton: true
        };
      case 'restricted':
        return {
          icon: <ExclamationCircleSolid className='text-ui-tag-red-text' />,
          title: t('stripeConnect.restricted.title'),
          description: t('stripeConnect.restricted.description'),
          variant: 'error' as const,
          color: 'red' as const,
          showOnboardingButton: true
        };
      case 'restricted_soon':
        return {
          icon: <ExclamationCircleSolid className='text-ui-tag-orange-text' />,
          title: t('stripeConnect.restrictedSoon.title'),
          description: t('stripeConnect.restrictedSoon.description'),
          variant: 'warning' as const,
          color: 'orange' as const,
          showOnboardingButton: true
        };
      case 'rejected':
        return {
          icon: <ExclamationCircleSolid className='text-ui-tag-red-text' />,
          title: t('stripeConnect.rejected.title'),
          description: t('stripeConnect.rejected.description'),
          variant: 'error' as const,
          color: 'red' as const,
          showSupportLink: true
        };
      default:
        return {
          icon: <ExclamationCircle className='text-ui-fg-muted' />,
          title: t('stripeConnect.unknown.title'),
          description: t('stripeConnect.unknown.description'),
          variant: 'default' as const,
          color: 'grey' as const
        };
    }
  };

  const statusConfig = getStatusConfig(status);

  return (
    <div className='flex items-center justify-center text-center my-16 flex-col max-w-lg mx-auto'>
      <div className='mb-6 flex justify-center'>
      
      </div>
      
      <Text className='text-ui-fg-subtle mb-6 max-w-md'>
        {String(statusConfig.description)}
      </Text>

      {/* Error Display */}
      {error && (
        <div className='w-full mb-6 p-4 border border-ui-border-error rounded-lg bg-ui-bg-error'>
          <Text size='small' weight='plus' className='text-ui-fg-error mb-2'>
            {t('stripeConnect.requirements.error')}:
          </Text>
          <Text size='small' className='text-ui-fg-error'>
            {error}
          </Text>
        </div>
      )}

      {/* Requirements Information - Consolidated and deduplicated */}
      {payout_account?.data?.requirements && (() => {
        // Combine all requirements into a single deduplicated list
        const allRequirements = new Set<string>([
          ...(payout_account.data.requirements.past_due || []),
          ...(payout_account.data.requirements.currently_due || []),
          ...(payout_account.data.requirements.eventually_due || [])
        ]);
        
        const hasRequirements = allRequirements.size > 0;
        const hasPendingVerification = payout_account.data.requirements.pending_verification && 
                                      payout_account.data.requirements.pending_verification.length > 0;
        const hasErrors = payout_account.data.requirements.errors && 
                         payout_account.data.requirements.errors.length > 0;
        const hasDeadline = payout_account.data.requirements.current_deadline;
        const isBlocked = payout_account.data.requirements.disabled_reason;

        return (
          <div className='w-full mb-6'>
            {/* Disabled Reason */}
            {isBlocked && (
              <div className='mb-4 p-4 bg-ui-bg-error-subtle rounded-lg border border-ui-border-error'>
                <Text size='small' weight='plus' className='text-ui-fg-error mb-2'>
                  {t('stripeConnect.requirements.accountBlocked')}:
                </Text>
                <Text size='small' className='text-ui-fg-error'>
                  {getRequirementDescription(payout_account.data.requirements.disabled_reason || 'unknown')}
                </Text>
              </div>
            )}

            {/* Consolidated Required Information */}
            {hasRequirements && (
              <div className='p-4 border border-ui-border-error rounded-lg bg-ui-bg-subtle mb-4'>
                <Text size='small' weight='plus' className='text-ui-fg-error mb-2'>
                  {t('stripeConnect.requirements.requiredData')}:
                </Text>
                <ul className='text-left text-sm text-ui-fg-subtle space-y-1'>
                  {Array.from(allRequirements).map((req: string, index: number) => (
                    <li key={`req-${index}`}>• {getRequirementDescription(req)}</li>
                  ))}
                </ul>
                {hasDeadline && (
                  <Text size='xsmall' className='text-ui-fg-muted mt-2'>
                    {t('stripeConnect.requirements.deadline')}: {new Date(payout_account.data.requirements.current_deadline! * 1000).toLocaleDateString()}
                  </Text>
                )}
              </div>
            )}

            {/* Pending Verification */}
            {hasPendingVerification && (
              <div className='p-4 border border-ui-border-base rounded-lg bg-ui-bg-subtle mb-4'>
                <Text size='small' weight='plus' className='text-ui-fg-base mb-2'>
                  {t('stripeConnect.requirements.pendingVerification')}:
                </Text>
                <ul className='text-left text-sm text-ui-fg-subtle space-y-1'>
                  {payout_account.data.requirements.pending_verification!.map((req: string, index: number) => (
                    <li key={`pending-${index}`}>• {getRequirementDescription(req)}</li>
                  ))}
                </ul>
                <Text size='xsmall' className='text-ui-fg-muted mt-2'>
                  {t('stripeConnect.requirements.verificationInProgress')}
                </Text>
              </div>
            )}

            {/* Verification Errors */}
            {hasErrors && (
              <div className='p-4 border border-ui-border-error rounded-lg bg-ui-bg-error mb-4'>
                <Text size='small' weight='plus' className='text-ui-fg-error mb-2'>
                  {t('stripeConnect.requirements.verificationErrors')}:
                </Text>
                <ul className='text-left text-sm text-ui-fg-error space-y-2'>
                  {payout_account.data.requirements.errors!.map((error: any, index: number) => (
                    <li key={`error-${index}`}>
                      <Text size='small' weight='plus' className='text-ui-fg-error'>
                        {getRequirementDescription(error.requirement)}:
                      </Text>
                      <Text size='small' className='text-ui-fg-error ml-2'>
                        {error.reason || error.code}
                      </Text>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      })()}

      {/* Account Details Card */}
      {payout_account && status === 'connected' && (
        <div className='w-full mb-6 p-4 border rounded-lg bg-ui-bg-subtle'>
          <div className='grid grid-cols-2 gap-4 text-left'>
            <div>
              <Text size='xsmall' className='text-ui-fg-muted mb-1'>
                {t('stripeConnect.details.accountType')}
              </Text>
              <Text size='small' weight='plus'>
                {(() => {
                  const businessType = payout_account.context?.business_type || payout_account.data?.business_type;
                  
                  return businessType === 'individual'
                    ? t('stripeConnect.accountType.individual')
                    : t('stripeConnect.accountType.company');
                })()}
              </Text>
            </div>
            <div>
              <Text size='xsmall' className='text-ui-fg-muted mb-1'>
                {t('stripeConnect.details.country')}
              </Text>
              <Text size='small' weight='plus'>
                {payout_account.data?.country || payout_account.context?.country || 'PL'}
              </Text>
            </div>
            {payout_account.data?.default_currency && (
              <div>
                <Text size='xsmall' className='text-ui-fg-muted mb-1'>
                  {t('stripeConnect.details.currency')}
                </Text>
                <Text size='small' weight='plus'>
                  {payout_account.data.default_currency.toUpperCase()}
                </Text>
              </div>
            )}
            {payout_account.data?.charges_enabled && (
              <div>
                <Text size='xsmall' className='text-ui-fg-muted mb-1'>
                  {t('stripeConnect.details.status')}
                </Text>
                <StatusCell color="green">
                  {t('stripeConnect.details.active')}
                </StatusCell>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className='flex flex-col gap-3 w-full'>
        {statusConfig.showOnboardingButton && (
          <Button
            isLoading={isPending || isRedirecting}
            onClick={handleOnboarding}
            size='large'
            className='w-full'
            disabled={isRedirecting}
          >
            {isRedirecting 
              ? 'Przekierowywanie...' 
              : t('stripeConnect.actions.continueOnboarding')
            }
          </Button>
        )}

        {statusConfig.showDashboardLink && (
          <>
            {/* Only show Next Step button during onboarding */}
            {isOnboarding && (
              <Button
                variant='primary'
                onClick={() => navigate('/onboarding')}
                size='large'
                className='w-full'
              >
                {t('stripeConnect.actions.nextStep')}
                <ArrowRight className='ml-2' />
              </Button>
            )}
            <div className='flex gap-3'>
              <Button
                variant='secondary'
                onClick={handleOnboarding}
                className='flex-1'
              >
                {t('stripeConnect.actions.manageAccount')}
              </Button>
              <a
                href={`https://dashboard.stripe.com/${isTestMode ? 'test/' : ''}connect/accounts/${payout_account?.reference_id || ''}`}
                target='_blank'
                rel='noopener noreferrer'
                className='flex-1'
              >
                <Button variant='secondary' className='w-full'>
                  <CurrencyDollar className='mr-2' />
                  {t('stripeConnect.actions.viewDashboard')}
                </Button>
              </a>
            </div>
          </>
        )}
        
        {statusConfig.showSupportLink && (
          <a
            href='mailto:sayuri.platform@gmail.com'
            className='w-full'
          >
            <Button variant='secondary' className='w-full'>
              {t('stripeConnect.actions.contactSupport')}
            </Button>
          </a>
        )}
      </div>
      
      <Text size='xsmall' className='text-ui-fg-muted mt-6 text-center'>
        {t('stripeConnect.notes.poweredBy')}
      </Text>
    </div>
  );
};
