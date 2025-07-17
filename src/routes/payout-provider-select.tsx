import { useNavigate } from 'react-router-dom';
import { Button, Heading, Text, Container } from '@medusajs/ui';
import { usePayuAccount } from '../hooks/api/payu';
import { useEffect } from 'react';

const providers = [
  // Commented out Stripe provider
  /*{
    key: 'stripe',
    name: 'Stripe',
    description: 'Połącz swoje konto Stripe do wypłat.',
    route: '/stripe-connect',
  },*/
  {
    key: 'payu',
    name: 'PayU',
    description: 'Skonfiguruj wypłaty w walucie PLN.',
    route: '/payout/simplified-payout',
  },
];

export const PayoutProviderSelect = () => {
  const navigate = useNavigate();
  
  // Check if user already has a payout account
  const { data: payoutAccount, isLoading, error } = usePayuAccount();
  
  // Log for debugging
  console.log('[DEBUG] PayoutProviderSelect - Account check:', { 
    hasAccount: !!payoutAccount, 
    isLoading, 
    error: error?.message 
  });
  
  // Redirect to payout detail page if account exists
  useEffect(() => {
    if (payoutAccount && !isLoading) {
      console.log('[DEBUG] Existing payout account found, redirecting to detail page');
      // Looking at the route map, we can see there's a direct path to the payout detail component
      // This should avoid the dynamic import issue with the index route
      navigate('/payout/detail');
    }
  }, [payoutAccount, isLoading, navigate]);
  
  // Show loading state
  if (isLoading) {
    return (
      <Container className="p-8 max-w-4xl mx-auto">
        <Text>Sprawdzanie konfiguracji konta wypłat...</Text>
      </Container>
    );
  }
  
  // Only show provider selection if no account exists
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Heading level="h2" className="mb-6">Wybierz dostawcę przelewów</Heading>
      <div className="grid gap-6 grid-cols-1 md:grid-cols-1">
        {providers.map((provider) => (
          <div
            key={provider.key}
            className="rounded-lg border shadow-md p-6 flex flex-col items-center text-center "
          >
            <Text className="font-bold text-lg mb-2">{provider.name}</Text>
            <Text className="mb-4 text-ui-fg-subtle">{provider.description}</Text>
            <Button onClick={() => navigate(provider.route)}>
              Połącz {provider.name}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PayoutProviderSelect;
