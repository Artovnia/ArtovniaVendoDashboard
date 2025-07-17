import { Heading, Text } from '@medusajs/ui';

export const Connected = ({ status }: { status: 'connected' | 'pending' | 'not connected' }) => {
  if (status === 'connected') {
    return (
      <div className='flex items-center justify-center text-center my-32 flex-col'>
        <Heading level='h2' className='mt-4'>
          Twoje konto PayU jest połączone.
        </Heading>
        <Text className='text-ui-fg-subtle' size='small'>
          Możesz teraz otrzymywać wypłaty przez PayU.
        </Text>
      </div>
    );
  }
  if (status === 'pending') {
    return (
      <div className='flex items-center justify-center text-center my-32 flex-col'>
        <Heading level='h2' className='mt-4'>
          Konto PayU oczekuje na weryfikację
        </Heading>
        <Text className='text-ui-fg-subtle' size='small'>
          Twoje konto PayU jest w trakcie weryfikacji. Proszę sprawdzić skrzynkę mailową lub panel PayU.
        </Text>
      </div>
    );
  }
  return null;
};
