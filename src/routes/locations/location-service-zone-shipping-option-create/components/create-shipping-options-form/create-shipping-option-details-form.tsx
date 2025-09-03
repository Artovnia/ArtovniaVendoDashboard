import {
  Divider,
  Heading,
  RadioGroup,
  Select,
  Text,
} from '@medusajs/ui';
import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useEffect, useMemo } from 'react';

import { HttpTypes } from '@medusajs/types';

// Utility function to clean service zone name by removing suffix pattern
const cleanServiceZoneName = (name: string): string => {
  // Remove pattern like "_K7AAQ537" from the end of the name
  return name.replace(/_[A-Z0-9]{8}$/, '');
};

import { Form } from '../../../../../components/common/form';
import { SwitchBox } from '../../../../../components/common/switch-box';
import { Combobox } from '../../../../../components/inputs/combobox';
import { useComboboxData } from '../../../../../hooks/use-combobox-data';
import { useShippingProfiles } from '../../../../../hooks/api/shipping-profiles';
import { useFulfillmentProviders } from '../../../../../hooks/api/fulfillment-providers';
import { sdk } from '../../../../../lib/client';
import { formatProvider } from '../../../../../lib/format-provider';
import {
  FulfillmentSetType,
  ShippingOptionPriceType,
} from '../../../common/constants';
import { CreateShippingOptionSchema } from './schema';

type CreateShippingOptionDetailsFormProps = {
  form: UseFormReturn<CreateShippingOptionSchema>;
  isReturn?: boolean;
  zone: HttpTypes.AdminServiceZone;
  locationId: string;
  fulfillmentProviderOptions: HttpTypes.AdminFulfillmentProviderOption[];
  selectedProviderId?: string;
  type: FulfillmentSetType;
};

export const CreateShippingOptionDetailsForm = ({
  form,
  isReturn = false,
  zone,
  locationId,
  fulfillmentProviderOptions,
  selectedProviderId,
  type,
}: CreateShippingOptionDetailsFormProps) => {
  const { t } = useTranslation();

  const isPickup = type === FulfillmentSetType.Pickup;

  // Use the vendor profiles instead of admin profiles
  const { shipping_profiles = [], isLoading: isProfilesLoading } = useShippingProfiles();
  
  // If there are shipping profiles and no value is selected, set the first one as default
  useEffect(() => {
    if (shipping_profiles.length > 0 && !form.watch('shipping_profile_id')) {
      form.setValue('shipping_profile_id', shipping_profiles[0].id);
    }
  }, [shipping_profiles, form]);

  // Use the vendor fulfillment providers API - don't pass stock_location_id as it's not supported
  const { fulfillment_providers = [], isLoading: isProvidersLoading } = useFulfillmentProviders();
  
  // Set a default provider when providers are loaded and none is selected
  useEffect(() => {
    if (fulfillment_providers.length > 0 && !selectedProviderId) {
      // Look for manual provider first, otherwise use the first available provider
      const manualProvider = fulfillment_providers.find(p => p.id.includes('manual'));
      form.setValue('provider_id', manualProvider?.id || fulfillment_providers[0].id);
      
      // Log available providers for debugging
      console.log('Available providers:', fulfillment_providers.map(p => p.id));
    }
  }, [fulfillment_providers, form, selectedProviderId]);

  // Create provider options for the dropdown
  const providerOptions = useMemo(() => {
    return fulfillment_providers.map(provider => ({
      label: formatProvider(provider.id),
      value: provider.id,
    }));
  }, [fulfillment_providers]);

  // Use the combobox data hook for compatibility with the UI
  const fulfillmentProviders = {
    options: providerOptions,
    searchValue: '',
    onSearchValueChange: () => {},
    disabled: isProvidersLoading,
  };

  return (
    <div className='flex flex-1 flex-col items-center overflow-y-auto'>
      <div className='flex w-full max-w-[720px] flex-col gap-y-8 px-6 py-16'>
        <div>
          <Heading>
            {t(
              `stockLocations.shippingOptions.create.${
                isPickup
                  ? 'pickup'
                  : isReturn
                    ? 'returns'
                    : 'shipping'
              }.header`,
              {
                zone: cleanServiceZoneName(zone.name),
              }
            )}
          </Heading>
          <Text size='small' className='text-ui-fg-subtle'>
            {t(
              `stockLocations.shippingOptions.create.${
                isReturn
                  ? 'returns'
                  : isPickup
                    ? 'pickup'
                    : 'shipping'
              }.hint`
            )}
          </Text>
        </div>

        {!isPickup && (
          <Form.Field
            control={form.control}
            name='price_type'
            render={({ field }) => {
              return (
                <Form.Item>
                  <Form.Label>
                    {t(
                      'stockLocations.shippingOptions.fields.priceType.label'
                    )}
                  </Form.Label>
                  <Form.Control>
                    <RadioGroup
                      className='grid grid-cols-1 gap-4 md:grid-cols-2'
                      {...field}
                      onValueChange={field.onChange}
                    >
                      <RadioGroup.ChoiceBox
                        className='flex-1'
                        value={
                          ShippingOptionPriceType.FlatRate
                        }
                        label={t(
                          'stockLocations.shippingOptions.fields.priceType.options.fixed.label'
                        )}
                        description={t(
                          'stockLocations.shippingOptions.fields.priceType.options.fixed.hint'
                        )}
                      />
                      <RadioGroup.ChoiceBox
                        className='flex-1'
                        value={
                          ShippingOptionPriceType.Calculated
                        }
                        label={t(
                          'stockLocations.shippingOptions.fields.priceType.options.calculated.label'
                        )}
                        description={t(
                          'stockLocations.shippingOptions.fields.priceType.options.calculated.hint'
                        )}
                      />
                    </RadioGroup>
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              );
            }}
          />
        )}

        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          <Form.Field
            control={form.control}
            name='name'
            render={({ field }) => {
              return (
                <Form.Item>
                  <Form.Label>
                    {t('fields.name')}
                  </Form.Label>
                  <Form.Control>
                    <Select
                      {...field}
                      onValueChange={field.onChange}
                    >
                      <Select.Trigger ref={field.ref}>
                        <Select.Value />
                      </Select.Trigger>

                      <Select.Content>
                        <Select.Item value="Inpost Kurier">Inpost Kurier</Select.Item>
                        <Select.Item value="Inpost paczkomat">Inpost paczkomat</Select.Item>
                        <Select.Item value="DHL">DHL</Select.Item>
                        <Select.Item value="Fedex">Fedex</Select.Item>
                        <Select.Item value="DPD">DPD</Select.Item>
                        <Select.Item value="GLS">GLS</Select.Item>
                        <Select.Item value="UPS">UPS</Select.Item>
                      </Select.Content>
                    </Select>
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              );
            }}
          />
           <Form.Field
            control={form.control}
            name='shipping_profile_id'
            render={({ field }) => {
              return (
                <Form.Item>
                  <Form.Label>
                    {t(
                      'stockLocations.shippingOptions.fields.profile'
                    )}
                  </Form.Label>
                  <Form.Control>
                    <Select
                      {...field}
                      onValueChange={field.onChange}
                      disabled={isProfilesLoading || shipping_profiles.length === 0}
                    >
                      <Select.Trigger ref={field.ref}>
                        <Select.Value />
                      </Select.Trigger>

                      <Select.Content>
                        {shipping_profiles.map((profile) => (
                          <Select.Item
                            value={profile.id}
                            key={profile.id}
                          >
                            {profile.name}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select>
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              );
            }}
          /> 
        </div>

         <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          <Form.Field
            control={form.control}
            name='provider_id'
            render={({ field }) => {
              return (
                <Form.Item>
                  <Form.Label
                    tooltip={t(
                      'stockLocations.fulfillmentProviders.shippingOptionsTooltip'
                    )}
                  >
                    {t(
                      'stockLocations.shippingOptions.fields.provider'
                    )}
                  </Form.Label>
                  <Form.Control>
                    <Combobox
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        form.setValue(
                          'fulfillment_option_id',
                          ''
                        );
                      }}
                      options={fulfillmentProviders.options}
                      searchValue={
                        fulfillmentProviders.searchValue
                      }
                      onSearchValueChange={
                        fulfillmentProviders.onSearchValueChange
                      }
                      disabled={
                        fulfillmentProviders.disabled
                      }
                    />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              );
            }}
          />

          <Form.Field
            control={form.control}
            name='fulfillment_option_id'
            render={({ field }) => {
              return (
                <Form.Item>
                  <Form.Label>
                    {t(
                      'stockLocations.shippingOptions.fields.fulfillmentOption'
                    )}
                  </Form.Label>
                  <Form.Control>
                    <Select
                      {...field}
                      onValueChange={field.onChange}
                      disabled={!selectedProviderId}
                      key={selectedProviderId}
                    >
                      <Select.Trigger ref={field.ref}>
                        <Select.Value />
                      </Select.Trigger>

                      <Select.Content>
                        {fulfillmentProviderOptions
                          ?.filter(
                            (fo) =>
                              !!fo.is_return === isReturn
                          )
                          .map((option) => (
                            <Select.Item
                              value={option.id}
                              key={option.id}
                            >
                              {option.id}
                            </Select.Item>
                          ))}
                      </Select.Content>
                    </Select>
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              );
            }}
          />
        </div> 

        <Divider />
        <SwitchBox
          control={form.control}
          name='enabled_in_store'
          label={t(
            'stockLocations.shippingOptions.fields.enableInStore.label'
          )}
          description={t(
            'stockLocations.shippingOptions.fields.enableInStore.hint'
          )}
        />
      </div>
    </div>
  );
};
