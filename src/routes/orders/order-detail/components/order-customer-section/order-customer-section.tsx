import { Container, Heading, Text, Badge } from '@medusajs/ui';
import { useTranslation } from 'react-i18next';
import { CustomerInfo } from '../../../../../components/common/customer-info';
import { HttpTypes } from '@medusajs/types';

// Define interface for parcel machine data
interface ParcelMachineData {
  id?: string;
  name?: string;
  address?: string;
  postal_code?: string;
  postCode?: string;
  city?: string;
  building_number?: string;
  buildingNumber?: string;
  street?: string;
}

// Define interface for shipping method data
interface ShippingMethodData {
  parcel_machine?: ParcelMachineData;
  parcelMachine?: ParcelMachineData;
  inpost_point?: ParcelMachineData;
  inpostPoint?: ParcelMachineData;
  point_id?: string;
  pointId?: string;
  display_address?: string;
  description?: string;
  type?: string;
  provider?: string;
}

type OrderCustomerSectionProps = {
  order: HttpTypes.AdminOrder;
};

export const OrderCustomerSection = ({
  order,
}: OrderCustomerSectionProps) => {
  return (
    <Container className='divide-y p-0'>
      <Header />
      <CustomerInfo.ID data={order} />
      <CustomerInfo.Contact data={order} />
      <CustomerInfo.Company data={order} />
      <CustomerInfo.Addresses data={order} />
      <ParcelMachineInfo order={order} />
    </Container>
  );
};

const Header = () => {
  const { t } = useTranslation();

  return (
    <div className='flex items-center justify-between px-6 py-4'>
      <Heading level='h2'>{t('fields.customer')}</Heading>
    </div>
  );
};

const ParcelMachineInfo = ({ order }: { order: HttpTypes.AdminOrder }) => {
  const { t } = useTranslation();
  
  // Check if there are shipping methods with data field containing parcel information
  const parcelShippingMethod = order.shipping_methods?.find(method => 
    method.data && (
      method.data.parcel_machine ||
      method.data.parcelMachine ||
      method.data.inpost_point ||
      method.data.inpostPoint ||
      method.data.point_id ||
      method.data.pointId ||
      method.data.display_address
    )
  );

  // If no shipping method with parcel data is found, return null
  if (!parcelShippingMethod || !parcelShippingMethod.data) {
    return null;
  }

  // Extract parcel machine data from the shipping method
  const data = parcelShippingMethod.data as ShippingMethodData;
  
  // Use display_address if available
  const displayAddress = data.display_address;
  
  // Extract parcel machine data as fallback
  const parcelMachine: ParcelMachineData = 
    data.parcel_machine || 
    data.parcelMachine || 
    data.inpost_point || 
    data.inpostPoint || 
    {};
  
  // Extract point ID
  const pointId = 
    data.point_id || 
    data.pointId || 
    (parcelMachine.id || '');
    
  // Extract point name
  const pointName = (parcelMachine.name || pointId || '');
  
  // If no point data and no display address is available, return null
  if ((!pointId && !pointName) && !displayAddress) {
    return null;
  }

  // Get shipping display name from available properties
  // AdminOrderShippingMethod has name, but not shipping_method or shipping_option
  const shippingMethodName = parcelShippingMethod.name || ''; // The name property often contains the shipping method name
  const shippingOptionId = parcelShippingMethod.shipping_option_id || '';
  
  // Use name if available, otherwise format the shipping option ID
  const shippingOptionName = shippingMethodName || 
    (shippingOptionId ? `${t('fields.shipping_option', 'Option')}: ${shippingOptionId.split('_').pop()}` : undefined);

  // Format address string when display_address not available
  const formatFallbackAddress = () => {
    if (!parcelMachine.address) {
      return t('fields.address_unavailable', 'Address information unavailable');
    }
    
    const addressParts = [
      parcelMachine.address,
      parcelMachine.postal_code || parcelMachine.postCode,
      parcelMachine.city,
    ].filter(Boolean);
    
    return addressParts.length > 0 ? 
      addressParts.join(', ') : 
      t('fields.address_unavailable', 'Address information unavailable');
  };

  return (
    <div className='flex flex-col gap-y-2 px-6 py-4'>
      <div className='flex items-center justify-between'>
        <Text size='base' className='font-medium'>
          {t('fields.parcel_machine_info', 'Informacje o paczkomacie')}
        </Text>
        {shippingOptionName && (
          <Badge size='small'>
            {shippingOptionName}
          </Badge>
        )}
      </div>
      
      {/* Display the parcel machine code/name */}
      {pointId && (
        <div className='flex flex-col gap-y-1 mt-2'>
          <Text size='small' className='text-ui-fg-subtle'>
            {t('fields.point_code', 'Kod paczkomatu')}:
          </Text>
          <Text size='base'>{pointId}</Text>
        </div>
      )}
      
      {/* Display the address using display_address if available */}
      <div className='flex flex-col gap-y-1 mt-1'>
        <Text size='small' className='text-ui-fg-subtle'>
          {t('fields.address', 'Address')}:
        </Text>
        <Text size='base'>
          {displayAddress || formatFallbackAddress()}
        </Text>
      </div>
      
      {/* Display any additional info if available */}
      {data.description && (
        <div className='flex flex-col gap-y-1 mt-1'>
          <Text size='small' className='text-ui-fg-subtle'>
            {t('fields.description', 'Description')}:
          </Text>
          <Text size='base'>{data.description}</Text>
        </div>
      )}
    </div>
  );
};
