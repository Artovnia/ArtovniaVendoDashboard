import { zodResolver } from '@hookform/resolvers/zod';
import { HttpTypes } from '@medusajs/types';
import {
  Button,
  ProgressStatus,
  ProgressTabs,
  toast,
} from '@medusajs/ui';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useState, useEffect, useMemo } from 'react';
import {
  RouteFocusModal,
  useRouteModal,
} from '../../../../../components/modals';
import { KeyboundForm } from '../../../../../components/utilities/keybound-form';
import { useCreateShippingOptions } from '../../../../../hooks/api/shipping-options';
import { castNumber } from '../../../../../lib/cast-number';
import {
  FulfillmentSetType,
  ShippingOptionPriceType,
} from '../../../common/constants';
import { CreateShippingOptionDetailsForm } from './create-shipping-option-details-form';
import { CreateShippingOptionsPricesForm } from './create-shipping-options-prices-form';
import {
  CreateShippingOptionDetailsSchema,
  CreateShippingOptionSchema,
} from './schema';
import { useFulfillmentProviderOptions, useFulfillmentProviders } from '../../../../../hooks/api';
import { useShippingProfiles } from '../../../../../hooks/api/shipping-profiles';


enum Tab {
  DETAILS = 'details',
  PRICING = 'pricing',
}

type CreateShippingOptionFormProps = {
  zone: HttpTypes.AdminServiceZone;
  locationId: string;
  isReturn?: boolean;
  type: FulfillmentSetType;
};

export function CreateShippingOptionsForm({
  zone,
  isReturn,
  locationId,
  type,
}: CreateShippingOptionFormProps) {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.DETAILS);
  const [validDetails, setValidDetails] = useState(false);

  const { t } = useTranslation();
  const { handleSuccess } = useRouteModal();

  const { shipping_profiles = [], isLoading: isLoadingProfiles } = useShippingProfiles();

  const form = useForm<CreateShippingOptionSchema>({
    defaultValues: {
      name: '',
      price_type: ShippingOptionPriceType.FlatRate,
      enabled_in_store: true,
      shipping_profile_id: '',
      provider_id: '', // Will be set dynamically once providers are loaded
      fulfillment_option_id: '',
      region_prices: {},
      currency_prices: {},
      conditional_region_prices: {},
      conditional_currency_prices: {},
    },
    resolver: zodResolver(CreateShippingOptionSchema),
  });

  // Declare selectedProviderId after form
  const selectedProviderId = useWatch({
    control: form.control,
    name: 'provider_id',
  });
  
  // Fetch fulfillment provider options based on the selected provider ID
  const { fulfillment_options = [], isError: isOptionsError } = useFulfillmentProviderOptions(
    selectedProviderId || '',
    {
      enabled: !!selectedProviderId,
      // Don't retry too many times if the endpoint doesn't exist
      retry: 1
      // Note: onError is not supported in the options type for this hook
    }
  );
  
  // Log errors separately since onError is not supported in the options
  useEffect(() => {
    if (isOptionsError) {
      console.error('Error fetching fulfillment options:', isOptionsError);
    }
  }, [isOptionsError]);
  
  // Create default options if the API fails or returns empty
  const effectiveOptions = useMemo(() => {
    // If there are API options, check if they have any with is_return matching our isReturn value
    if (fulfillment_options.length > 0) {
      // If we have at least one option matching our isReturn value, use the API options
      const matchingOptions = fulfillment_options.filter(option => !!option.is_return === !!isReturn);
      if (matchingOptions.length > 0) {
        return fulfillment_options;
      }
    }
    
    // If API failed or didn't return matching options, create appropriate defaults
    if (isOptionsError || fulfillment_options.length === 0 || true) {
      // Provide default options for both regular and return fulfillment
      if (selectedProviderId?.includes('manual')) {
       
        // Create both a regular and return option
        return [{
          id: isReturn ? 'manual-return' : 'manual',
          name: isReturn ? 'Manual Return Fulfillment' : 'Manual Fulfillment',
          is_return: !!isReturn
        }];
      }
    }
    
    return fulfillment_options;
  }, [fulfillment_options, isOptionsError, selectedProviderId, isReturn]);

  const { fulfillment_providers = [] } = useFulfillmentProviders();



  useEffect(() => {
    if (!selectedProviderId && fulfillment_providers.length > 0) {
      // Look for manual provider first, otherwise use the first available provider
      const manualProvider = fulfillment_providers.find(p => p.id.includes('manual'));
      form.setValue('provider_id', manualProvider?.id || fulfillment_providers[0].id);
      
    }
  }, [fulfillment_providers, form, selectedProviderId]);
  


  useEffect(() => {
    if (shipping_profiles.length > 0) {
      form.setValue('shipping_profile_id', shipping_profiles[0].id);
    }
  }, [shipping_profiles, form]);

  // We're already using effectiveOptions from above, so we don't need this duplicate hook call

  const isCalculatedPriceType =
    form.watch('price_type') === ShippingOptionPriceType.Calculated;

  const { mutateAsync, isPending: isLoading } = useCreateShippingOptions();

  const handleSubmit = form.handleSubmit(async (data) => {
    const currencyPrices = Object.entries(data.currency_prices)
      .map(([code, value]) => {
        if (!value) return undefined;
        return {
          currency_code: code,
          amount: castNumber(value),
        };
      })
      .filter(
        (p): p is { currency_code: string; amount: number } => !!p
      );

    
    // Create shipping option with data for the admin workflow to process
    const shippingOptionPayload = {
      name: data.name,
      service_zone_id: zone.id,
      shipping_profile_id: data.shipping_profile_id,
      provider_id: data.provider_id,
      prices: currencyPrices,
      // Include data with the return flag for the fulfillment provider
      data: {
        id: data.fulfillment_option_id || (isReturn ? 'manual-return' : 'manual'),
        is_return: isReturn // Pass isReturn flag to the fulfillment provider
      },
      // Include rules for filtering by is_return
      rules: [
        {
          attribute: "is_return",
          operator: "eq",
          value: isReturn ? "true" : "false"
        },
        {
          attribute: "enabled_in_store",
          operator: "eq",
          value: data.enabled_in_store ? "true" : "false"
        }
      ],
      // Add type as required by the API
      type: {
        label: isReturn ? 'Return Option' : 'Shipping Option',
        description: isReturn ? 'Option for returning items' : 'Option for shipping items',
        code: isReturn ? 'return-option' : 'shipping-option'
      }
    };
    
    
    
    // Pass the payload to the API using type assertion to bypass TypeScript constraints
    await mutateAsync(
      // Use type assertion to tell TypeScript to trust our object structure
      shippingOptionPayload as any,
      {
        onSuccess: ({ shipping_option }) => {
          toast.success(
            t(
              `stockLocations.shippingOptions.create.${isReturn ? 'returns' : 'shipping'}.successToast`,
              { name: shipping_option?.name }
            )
          );
          handleSuccess(`/settings/locations/${locationId}`);
        },
        onError: (e) => {
          toast.error(e.message);
        },
      }
    );
  });

  const onTabChange = (tab: Tab) => {
    if (tab === Tab.PRICING) {
      form.clearErrors();

      const result = CreateShippingOptionDetailsSchema.safeParse({
        ...form.getValues(),
      });

      if (!result.success) {
        const [firstError, ...rest] = result.error.errors;

        for (const error of rest) {
          const _path = error.path.join('.') as keyof CreateShippingOptionSchema;

          form.setError(_path, {
            message: error.message,
            type: error.code,
          });
        }

        form.setError(firstError.path.join('.') as keyof CreateShippingOptionSchema, {
          message: firstError.message,
          type: firstError.code,
        }, {
          shouldFocus: true,
        });

        setValidDetails(false);
        return;
      }

      setValidDetails(true);
    }

    setActiveTab(tab);
  };

  const pricesStatus: ProgressStatus =
    form.getFieldState('currency_prices')?.isDirty ||
    form.getFieldState('region_prices')?.isDirty ||
    activeTab === Tab.PRICING
      ? 'in-progress'
      : 'not-started';

  const detailsStatus: ProgressStatus = validDetails
    ? 'completed'
    : 'in-progress';

  return (
    <RouteFocusModal.Form form={form}>
      <KeyboundForm
        className='flex h-full flex-col'
        onSubmit={handleSubmit}
        onKeyDown={(e) => {
          const isEnterKey = e.key === 'Enter';
          const isModifierPressed = e.metaKey || e.ctrlKey;
          const shouldContinueToPricing = activeTab !== Tab.PRICING && !isCalculatedPriceType;

          if (!isEnterKey) return;
          e.preventDefault();

          if (!isModifierPressed) return;

          if (shouldContinueToPricing) {
            e.stopPropagation();
            onTabChange(Tab.PRICING);
            return;
          }

          handleSubmit();
        }}
      >
        <ProgressTabs
          value={activeTab}
          className='flex h-full flex-col overflow-hidden'
          onValueChange={(tab) => onTabChange(tab as Tab)}
        >
          <RouteFocusModal.Header>
            {/* Add Title component to fix accessibility warnings */}
            <RouteFocusModal.Title className="sr-only">
              {t('stockLocations.shippingOptions.title')}
            </RouteFocusModal.Title>
            <RouteFocusModal.Description className="sr-only">
              {t('stockLocations.shippingOptions.create.description', {
                defaultValue: 'Create a shipping option for your service zone'
              })}
            </RouteFocusModal.Description>
            <ProgressTabs.List className='border-ui-border-base -my-2 ml-2 min-w-0 flex-1 border-l'>
              <ProgressTabs.Trigger
                value={Tab.DETAILS}
                status={detailsStatus}
                className='w-full max-w-[200px]'
              >
                <span className='w-full cursor-auto overflow-hidden text-ellipsis whitespace-nowrap'>
                  {t('stockLocations.shippingOptions.create.tabs.details')}
                </span>
              </ProgressTabs.Trigger>
              {!isCalculatedPriceType && (
                <ProgressTabs.Trigger
                  value={Tab.PRICING}
                  status={pricesStatus}
                  className='w-full max-w-[200px]'
                >
                  <span className='w-full overflow-hidden text-ellipsis whitespace-nowrap'>
                    {t('stockLocations.shippingOptions.create.tabs.prices')}
                  </span>
                </ProgressTabs.Trigger>
              )}
            </ProgressTabs.List>
          </RouteFocusModal.Header>

          <RouteFocusModal.Body className='size-full overflow-hidden'>
            <ProgressTabs.Content
              value={Tab.DETAILS}
              className='size-full overflow-y-auto'
            >
              <CreateShippingOptionDetailsForm
                form={form}
                zone={zone}
                isReturn={isReturn}
                type={type}
                locationId={locationId}
                fulfillmentProviderOptions={effectiveOptions || []}
                selectedProviderId={selectedProviderId}
              />
            </ProgressTabs.Content>
            <ProgressTabs.Content
              value={Tab.PRICING}
              className='size-full'
            >
              <CreateShippingOptionsPricesForm
                form={form}
                type={type}
                isReturn={isReturn}
              />
            </ProgressTabs.Content>
          </RouteFocusModal.Body>

          <RouteFocusModal.Footer>
            <div className='flex items-center justify-end gap-x-2'>
              <RouteFocusModal.Close asChild>
                <Button variant='secondary' size='small'>
                  {t('actions.cancel')}
                </Button>
              </RouteFocusModal.Close>
              {activeTab === Tab.PRICING || isCalculatedPriceType ? (
                <Button
                  size='small'
                  className='whitespace-nowrap'
                  isLoading={isLoading}
                  key='submit-btn'
                  type='submit'
                >
                  {t('actions.save')}
                </Button>
              ) : (
                <Button
                  size='small'
                  className='whitespace-nowrap'
                  isLoading={isLoading}
                  onClick={() => onTabChange(Tab.PRICING)}
                  key='continue-btn'
                  type='button'
                >
                  {t('actions.continue')}
                </Button>
              )}
            </div>
          </RouteFocusModal.Footer>
        </ProgressTabs>
      </KeyboundForm>
    </RouteFocusModal.Form>
  );
}