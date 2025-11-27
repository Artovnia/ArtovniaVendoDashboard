import {
  ArchiveBox,
  CurrencyDollar,
  Map,
  PencilSquare,
  Plus,
  Trash,
  TriangleDownMini,
} from '@medusajs/icons';
import { HttpTypes } from '@medusajs/types';
import {
  Badge,
  Container,
  Divider,
  Heading,
  IconButton,
  StatusBadge,
  Text,
  toast,
  usePrompt,
  Tabs,
  Select,
} from '@medusajs/ui';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { ActionMenu } from '../../../../../components/common/action-menu';
import { NoRecords } from '../../../../../components/common/empty-table-content';
import { IconAvatar } from '../../../../../components/common/icon-avatar';
import { LinkButton } from '../../../../../components/common/link-button';
import { ListSummary } from '../../../../../components/common/list-summary';
import {
  useDeleteFulfillmentServiceZone,
  useDeleteFulfillmentSet,
} from '../../../../../hooks/api/fulfillment-sets';
import { useDeleteShippingOption } from '../../../../../hooks/api/shipping-options';
import { useShippingProfiles } from '../../../../../hooks/api/shipping-profiles';
import {
  useCreateStockLocationFulfillmentSet,
  useDeleteStockLocation,
} from '../../../../../hooks/api/stock-locations';
import { getFormattedAddress } from '../../../../../lib/addresses';
import {
  StaticCountry,
  countries as staticCountries,
} from '../../../../../lib/data/countries';
import { formatProvider } from '../../../../../lib/format-provider';
import {
  isOptionEnabledInStore,
  isReturnOption,
} from '../../../../../lib/shipping-options';
import { translateShippingProfileKey } from '../../../../../lib/shipping-profile-i18n';
import { FulfillmentSetType, ShippingOptionPriceType } from '../../../common/constants';

const STALE_TIME = 15 * 1000;

/**
 * Extracts the user-friendly name from a service zone name with seller ID suffix
 * Format: "ServiceZoneName_sellerID" -> "ServiceZoneName" (e.g., "Polska_K7AAQ537" -> "Polska")
 * Also handles legacy format: "VendorName - ServiceZoneName" -> "ServiceZoneName"
 * @param serviceName - The service zone name (potentially with suffix)
 * @returns The user-friendly service zone name
 */
const extractUserFriendlyName = (serviceName: string): string => {
  // Handle new format: "ServiceZoneName_sellerID"
  const underscoreIndex = serviceName.lastIndexOf('_')
  if (underscoreIndex !== -1) {
    const potentialSellerId = serviceName.substring(underscoreIndex + 1)
    // Check if it looks like a seller ID (8 characters, alphanumeric)
    if (potentialSellerId.length === 8 && /^[a-zA-Z0-9]+$/.test(potentialSellerId)) {
      return serviceName.substring(0, underscoreIndex)
    }
  }
  
  // Handle legacy format: "VendorName - ServiceZoneName"
  const separatorIndex = serviceName.indexOf(' - ')
  if (separatorIndex !== -1) {
    return serviceName.substring(separatorIndex + 3) // +3 to skip " - "
  }
  
  // Return original name if no pattern matches
  return serviceName
}

/**
 * Extracts the user-friendly name from a fulfillment set name with seller ID suffix
 * Format: "FulfillmentSetName_sellerID" -> "FulfillmentSetName"
 * @param fulfillmentSetName - The fulfillment set name (potentially with suffix)
 * @returns The user-friendly fulfillment set name
 */
const extractUserFriendlyFulfillmentSetName = (fulfillmentSetName: string): string => {
  // Handle format: "FulfillmentSetName_sellerID"
  const underscoreIndex = fulfillmentSetName.lastIndexOf('_')
  if (underscoreIndex !== -1) {
    const potentialSellerId = fulfillmentSetName.substring(underscoreIndex + 1)
    // Check if it looks like a seller ID (8 characters, alphanumeric)
    if (potentialSellerId.length === 8 && /^[a-zA-Z0-9]+$/.test(potentialSellerId)) {
      return fulfillmentSetName.substring(0, underscoreIndex)
    }
  }
  
  // Return original name if no pattern matches
  return fulfillmentSetName
}

/**
 * Extracts the user-friendly name from a shipping profile name with seller ID suffix
 * Format: "sel_01K4680TQ646K0V2ST2N3BXWZ3:Mała paczka" -> "Mała paczka"
 * @param shippingProfileName - The shipping profile name (potentially with suffix)
 * @returns The user-friendly shipping profile name
 */
const extractUserFriendlyShippingProfileName = (shippingProfileName: string): string => {
  // Handle format: "sel_01K4680TQ646K0V2ST2N3BXWZ3:Mała paczka"
  const colonIndex = shippingProfileName.indexOf(':')
  if (colonIndex !== -1 && shippingProfileName.startsWith('sel_')) {
    return shippingProfileName.substring(colonIndex + 1)
  }
  
  // Return original name if no pattern matches
  return shippingProfileName
}

type LocationGeneralSectionProps = {
  location: HttpTypes.AdminStockLocation;
};

export const LocationGeneralSection = ({
  location,
}: LocationGeneralSectionProps) => {
  return (
    <>
      <Container className='p-0'>
        <div className='flex items-center justify-between px-6 py-4'>
          <div>
            <Heading>{location.name}</Heading>
            <Text className='text-ui-fg-subtle txt-small'>
              {getFormattedAddress({
                address: location.address as any,
              }).join(', ')}
            </Text>
          </div>
          <Actions location={location} />
        </div>
      </Container>

      {/* Personal pickup commented out - not needed for now */}
      {/* <FulfillmentSet
        locationId={location.id}
        locationName={location.name}
        type={FulfillmentSetType.Pickup}
        fulfillmentSet={location.fulfillment_sets?.find(
          (f) => f.type === FulfillmentSetType.Pickup
        )}
      /> */}

      <FulfillmentSet
        locationId={location.id}
        locationName={location.name}
        type={FulfillmentSetType.Shipping}
        fulfillmentSet={location.fulfillment_sets?.find(
          (f) => f.type === FulfillmentSetType.Shipping
        )}
      />
    </>
  );
};

type ShippingOptionProps = {
  option: HttpTypes.AdminShippingOption;
  fulfillmentSetId: string;
  locationId: string;
};

function ShippingOption({
  option,
  fulfillmentSetId,
  locationId,
}: ShippingOptionProps) {
  const prompt = usePrompt();
  const { t } = useTranslation();

  const isStoreOption = isOptionEnabledInStore(option);
  
  // Translate carrier name if it's a known carrier key
  const getTranslatedCarrierName = (name: string) => {
    const carrierMap: Record<string, string> = {
      'customer-shipping': t('stockLocations.shippingOptions.fields.name.shippingByCustomer'),
      'Inpost Kurier': t('stockLocations.shippingOptions.fields.name.carriers.inpostKurier'),
      'Inpost paczkomat': t('stockLocations.shippingOptions.fields.name.carriers.inpostPaczkomat'),
      'DHL': t('stockLocations.shippingOptions.fields.name.carriers.dhl'),
      'Fedex': t('stockLocations.shippingOptions.fields.name.carriers.fedex'),
      'DPD': t('stockLocations.shippingOptions.fields.name.carriers.dpd'),
      'GLS': t('stockLocations.shippingOptions.fields.name.carriers.gls'),
      'UPS': t('stockLocations.shippingOptions.fields.name.carriers.ups'),
    };
    return carrierMap[name] || name;
  };

  const { mutateAsync } = useDeleteShippingOption(
    option.id
  );

  const handleDelete = async () => {
    const res = await prompt({
      title: t('general.areYouSure'),
      description: t(
        'stockLocations.shippingOptions.delete.confirmation',
        {
          name: option.name,
        }
      ),
      verificationInstruction: t('general.typeToConfirm'),
      verificationText: option.name,
      confirmText: t('actions.delete'),
      cancelText: t('actions.cancel'),
    });

    if (!res) {
      return;
    }

    await mutateAsync(undefined, {
      onSuccess: () => {
        toast.success(
          t(
            'stockLocations.shippingOptions.delete.successToast',
            {
              name: option.name,
            }
          )
        );
      },
      onError: (e) => {
        toast.error(e.message);
      },
    });
  };

  return (
    <div className='flex items-center justify-between px-3 py-2'>
      <div className='flex-1'>
        <Text size='small' weight='plus'>
          {getTranslatedCarrierName(option.name) || 'Unnamed Option'}{' '}
          {option?.shipping_profile?.name && `- ${translateShippingProfileKey(extractUserFriendlyShippingProfileName(option.shipping_profile.name), false, t)}`}{' '}
          ({formatProvider(option.provider_id || 'manual')})
        </Text>
      </div>
      <Badge
        className='mr-4'
        color={isStoreOption ? 'grey' : 'purple'}
        size='2xsmall'
        rounded='full'
      >
        {isStoreOption
          ? t('general.store')
          : t('general.admin')}
      </Badge>
      <ActionMenu
        groups={[
          {
            actions: [
              {
                icon: <PencilSquare />,
                label: t(
                  'stockLocations.shippingOptions.edit.action'
                ),
                to: `/settings/locations/${locationId}/fulfillment-set/${fulfillmentSetId}/service-zone/${option.service_zone_id}/shipping-option/${option.id}/edit`,
              },
              {
                label: t(
                  'stockLocations.shippingOptions.pricing.action'
                ),
                icon: <CurrencyDollar />,
                disabled:
                  option.price_type ===
                  ShippingOptionPriceType.Calculated,
                to: `/settings/locations/${locationId}/fulfillment-set/${fulfillmentSetId}/service-zone/${option.service_zone_id}/shipping-option/${option.id}/pricing`,
              },
            ],
          },
          {
            actions: [
              {
                label: t('actions.delete'),
                icon: <Trash />,
                onClick: handleDelete,
              },
            ],
          },
        ]}
      />
    </div>
  );
}

type ServiceZoneOptionsProps = {
  zone: HttpTypes.AdminServiceZone;
  locationId: string;
  fulfillmentSetId: string;
  type: FulfillmentSetType;
  selectedProfileId?: string;
};

function ServiceZoneOptions({
  zone,
  locationId,
  fulfillmentSetId,
  type,
  selectedProfileId,
}: ServiceZoneOptionsProps) {
  const { t } = useTranslation();

  const [shippingOptions, returnOptions] = useMemo(() => {
    const options = zone?.shipping_options || [];
    
    const regularOptions: HttpTypes.AdminShippingOption[] = [];
    const returnOpts: HttpTypes.AdminShippingOption[] = [];
    
    options.forEach(option => {
      const isReturn = isReturnOption(option, 'ServiceZoneOptions');
      
      // Filter by shipping profile if selected
      if (selectedProfileId && selectedProfileId !== 'all') {
        if (option.shipping_profile?.id !== selectedProfileId) {
          return; // Skip this option
        }
      }
      
      if (isReturn) {
        returnOpts.push(option);
      } else {
        regularOptions.push(option);
      }
    });
      
    return [regularOptions, returnOpts];
  }, [zone?.shipping_options, selectedProfileId]);

  return (
    <div>
      <Divider variant='dashed' />
      <div className='flex flex-col gap-y-4 px-6 py-4'>
        <div className='item-center flex justify-between'>
          <span className='text-ui-fg-subtle txt-small self-center font-medium'>
            {t(
              `stockLocations.shippingOptions.create.${type}.label`
            )}
          </span>
          <LinkButton
            to={`/settings/locations/${locationId}/fulfillment-set/${fulfillmentSetId}/service-zone/${zone.id}/shipping-option/create`}
          >
            {t(
              'stockLocations.shippingOptions.create.action'
            )}
          </LinkButton>
        </div>

        {!!shippingOptions?.length && (
          <div className='shadow-elevation-card-rest bg-ui-bg-subtle grid divide-y rounded-md'>
            {shippingOptions.map((o) => (
              <ShippingOption
                key={`regular-${o.id}`}
                option={o}
                locationId={locationId}
                fulfillmentSetId={fulfillmentSetId}
              />
            ))}
          </div>
        )}
      </div>

      <Divider variant='dashed' />

      <div className='flex flex-col gap-y-4 px-6 py-4'>
        <div className='item-center flex justify-between'>
          <span className='text-ui-fg-subtle txt-small self-center font-medium'>
            {t(
              'stockLocations.shippingOptions.create.returns.label'
            )}
          </span>
          <LinkButton
            to={`/settings/locations/${locationId}/fulfillment-set/${fulfillmentSetId}/service-zone/${zone.id}/shipping-option/create?is_return`}
          >
            {t(
              'stockLocations.shippingOptions.create.action'
            )}
          </LinkButton>
        </div>

        {!!returnOptions?.length && (
          <div className='shadow-elevation-card-rest bg-ui-bg-subtle grid divide-y rounded-md'>
            {returnOptions.map((o) => (
              <ShippingOption
                key={o.id}
                option={o}
                locationId={locationId}
                fulfillmentSetId={fulfillmentSetId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

type ServiceZoneTabContentProps = {
  zone: HttpTypes.AdminServiceZone;
  locationId: string;
  fulfillmentSetId: string;
  type: FulfillmentSetType;
  selectedProfileId?: string;
};

function ServiceZoneTabContent({
  zone,
  locationId,
  fulfillmentSetId,
  type,
  selectedProfileId,
}: ServiceZoneTabContentProps) {
  const { t } = useTranslation();
  const prompt = usePrompt();

  const { mutateAsync: deleteZone } =
    useDeleteFulfillmentServiceZone(
      fulfillmentSetId,
      zone.id
    );

  const handleDelete = async () => {
    const res = await prompt({
      title: t('general.areYouSure'),
      description: t(
        'stockLocations.serviceZones.delete.confirmation',
        {
          name: zone.name,
        }
      ),
      confirmText: t('actions.delete'),
      cancelText: t('actions.cancel'),
    });

    if (!res) {
      return;
    }

    await deleteZone(undefined, {
      onError: (e) => {
        toast.error(e.message);
      },
      onSuccess: () => {
        toast.success(
          t(
            'stockLocations.serviceZones.delete.successToast',
            {
              name: zone.name,
            }
          )
        );
      },
    });
  };

  const countries = useMemo(() => {
    // Check if geo_zones exists before filtering
    const countryGeoZones = zone.geo_zones?.filter(
      (g) => g.type === 'country'
    ) || [];

    const countries = countryGeoZones
      .map(({ country_code }) =>
        staticCountries.find(
          (c) => c.iso_2 === country_code
        )
      )
      .filter((c) => !!c) as StaticCountry[];

    return countries.sort((c1, c2) =>
      c1.name.localeCompare(c2.name)
    );
  }, [zone.geo_zones]);

  const [shippingOptionsCount, returnOptionsCount] =
    useMemo(() => {
      const options = zone?.shipping_options || [];
      
      // Use typed arrays to ensure consistent typing
      const regularOptions: HttpTypes.AdminShippingOption[] = [];
      const returnOptions: HttpTypes.AdminShippingOption[] = [];
      
      // Use the same approach as ServiceZoneOptions component
      options.forEach(option => {
        // Use the proper isReturnOption function without any overrides
        const isReturn = isReturnOption(option, 'ServiceZone');
        
        if (isReturn) {
          returnOptions.push(option);
        } else {
          regularOptions.push(option);
        }
      });
      
      return [regularOptions.length, returnOptions.length];
    }, [zone?.shipping_options]);

  return (
    <div className='flex flex-col'>
      <div className='flex flex-row items-center justify-between gap-x-4 py-4'>
        <IconAvatar>
          <Map />
        </IconAvatar>

        <div className='grow-1 flex flex-1 flex-col'>
          <Text
            size='small'
            leading='compact'
            weight='plus'
          >
            {extractUserFriendlyName(zone.name)}
          </Text>
          <div className='flex items-center gap-2'>
            <ListSummary
              variant='base'
              list={countries.map((c) => c.display_name)}
              inline
              n={1}
            />
            <span>·</span>
            <Text className='text-ui-fg-subtle txt-small'>
              {type === 'shipping' 
                ? t('stockLocations.shippingOptions.fields.count.shipping_one', { count: shippingOptionsCount })
                : t('stockLocations.shippingOptions.fields.count.pickup_one', { count: shippingOptionsCount })
              }
            </Text>
            <span>·</span>
            <Text className='text-ui-fg-subtle txt-small'>
              {t('stockLocations.shippingOptions.fields.count.returns_one', { count: returnOptionsCount })}
            </Text>
          </div>
        </div>

        <div className='flex grow-0 items-center gap-4'>
          <ActionMenu
            groups={[
              {
                actions: [
                  {
                    label: t('actions.edit'),
                    icon: <PencilSquare />,
                    to: `/settings/locations/${locationId}/fulfillment-set/${fulfillmentSetId}/service-zone/${zone.id}/edit`,
                  },
                  {
                    label: t(
                      'stockLocations.serviceZones.manageAreas.action'
                    ),
                    icon: <Map />,
                    to: `/settings/locations/${locationId}/fulfillment-set/${fulfillmentSetId}/service-zone/${zone.id}/areas`,
                  },
                ],
              },
              {
                actions: [
                  {
                    label: t('actions.delete'),
                    icon: <Trash />,
                    onClick: handleDelete,
                  },
                ],
              },
            ]}
          />
        </div>
      </div>
      <ServiceZoneOptions
        fulfillmentSetId={fulfillmentSetId}
        locationId={locationId}
        type={type}
        zone={zone}
        selectedProfileId={selectedProfileId}
      />
    </div>
  );
}

type FulfillmentSetProps = {
  fulfillmentSet?: HttpTypes.AdminFulfillmentSet;
  locationName: string;
  locationId: string;
  type: FulfillmentSetType;
};

function FulfillmentSet(props: FulfillmentSetProps) {
  const { t } = useTranslation();
  const prompt = usePrompt();

  const { fulfillmentSet, locationName, locationId, type } =
    props;

  const fulfillmentSetExists = !!fulfillmentSet;

  const hasServiceZones =
    !!fulfillmentSet?.service_zones?.length;

  // State for active service zone tab
  const [activeZoneTab, setActiveZoneTab] = useState<string>('0');
  
  // State for shipping profile filter
  const [selectedProfileId, setSelectedProfileId] = useState<string>('all');

  // Fetch shipping profiles for filtering
  const { shipping_profiles = [] } = useShippingProfiles(
    {},
    { enabled: hasServiceZones }
  );

  // Get unique shipping profiles from current service zone's options
  const availableProfiles = useMemo(() => {
    if (!fulfillmentSet?.service_zones?.length) return [];
    
    const zoneIndex = parseInt(activeZoneTab);
    const currentZone = fulfillmentSet.service_zones[zoneIndex];
    
    if (!currentZone?.shipping_options) return [];
    
    const profileIds = new Set<string>();
    currentZone.shipping_options.forEach(option => {
      if (option.shipping_profile?.id) {
        profileIds.add(option.shipping_profile.id);
      }
    });
    
    return shipping_profiles.filter((profile: any) => 
      profileIds.has(profile.id)
    );
  }, [fulfillmentSet?.service_zones, activeZoneTab, shipping_profiles]);

  const { mutateAsync: createFulfillmentSet } =
    useCreateStockLocationFulfillmentSet(locationId);

  const { mutateAsync: deleteFulfillmentSet } =
    useDeleteFulfillmentSet(fulfillmentSet?.id!);

  const handleCreate = async () => {
    await createFulfillmentSet(
      {
        name: `${locationName} ${
          type === FulfillmentSetType.Pickup
            ? 'pick up'
            : type
        }`,
        type,
      },
      {
        onSuccess: () => {
          toast.success(
            t(
              `stockLocations.fulfillmentSets.enable.${type}`
            )
          );
        },
        onError: (e) => {
          toast.error(e.message);
        },
      }
    );
  };

  const handleDelete = async () => {
    const res = await prompt({
      title: t('general.areYouSure'),
      description: t(
        `stockLocations.fulfillmentSets.disable.confirmation`,
        {
          name: extractUserFriendlyFulfillmentSetName(fulfillmentSet?.name || ''),
        }
      ),
      confirmText: t('actions.disable'),
      cancelText: t('actions.cancel'),
    });

    if (!res) {
      return;
    }

    await deleteFulfillmentSet(undefined, {
      onSuccess: () => {
        toast.success(
          t(
            `stockLocations.fulfillmentSets.disable.${type}`
          )
        );
      },
      onError: (e) => {
        toast.error(e.message);
      },
    });
  };

  const groups = fulfillmentSet
    ? [
        {
          actions: [
            {
              icon: <Plus />,
              label: t(
                'stockLocations.serviceZones.create.action'
              ),
              to: `/settings/locations/${locationId}/fulfillment-set/${fulfillmentSet.id}/service-zones/create`,
            },
          ],
        },
        {
          actions: [
            {
              icon: <Trash />,
              label: t('actions.disable'),
              onClick: handleDelete,
            },
          ],
        },
      ]
    : [
        {
          actions: [
            {
              icon: <Plus />,
              label: t('actions.enable'),
              onClick: handleCreate,
            },
          ],
        },
      ];

  return (
    <Container className='p-0'>
      <div className='flex flex-col divide-y'>
        <div className='flex items-center justify-between px-6 py-4'>
          <Heading level='h2'>
            {t(
              `stockLocations.fulfillmentSets.${type}.header`
            )}
          </Heading>
          <div className='flex items-center gap-4'>
            <StatusBadge
              color={
                fulfillmentSetExists ? 'green' : 'grey'
              }
            >
              {t(
                fulfillmentSetExists
                  ? 'statuses.enabled'
                  : 'statuses.disabled'
              )}
            </StatusBadge>

            <ActionMenu groups={groups} />
          </div>
        </div>

        {fulfillmentSetExists && !hasServiceZones && (
          <div className='flex items-center justify-center py-8 pt-6'>
            <NoRecords
              message={t(
                'stockLocations.serviceZones.fields.noRecords'
              )}
              className='h-fit'
              action={{
                to: `/settings/locations/${locationId}/fulfillment-set/${fulfillmentSet.id}/service-zones/create`,
                label: t(
                  'stockLocations.serviceZones.create.action'
                ),
              }}
            />
          </div>
        )}

        {hasServiceZones && (
          <div className='px-6 py-4'>
            <Tabs value={activeZoneTab} onValueChange={setActiveZoneTab}>
              <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4'>
                <div className='flex items-center gap-3'>
                  <Text size='small' weight='plus' className='text-ui-fg-subtle'>
                    {t('stockLocations.serviceZones.label')}
                  </Text>
                  <Tabs.List>
                    {fulfillmentSet?.service_zones.map((zone, index) => (
                      <Tabs.Trigger key={zone.id} value={index.toString()}>
                        {extractUserFriendlyName(zone.name)}
                      </Tabs.Trigger>
                    ))}
                  </Tabs.List>
                </div>
                
                {availableProfiles.length > 0 && (
                  <div className='flex items-center gap-2'>
                    <Text size='small' className='text-ui-fg-subtle'>
                      {t('stockLocations.shippingOptions.fields.filterByProfile')}
                    </Text>
                    <Select
                      value={selectedProfileId}
                      onValueChange={setSelectedProfileId}
                      size='small'
                    >
                      <Select.Trigger>
                        <Select.Value />
                      </Select.Trigger>
                      <Select.Content>
                        <Select.Item value='all'>
                          {t('stockLocations.shippingOptions.fields.allProfiles')}
                        </Select.Item>
                        {availableProfiles.map((profile: any) => (
                          <Select.Item key={profile.id} value={profile.id}>
                            {translateShippingProfileKey(extractUserFriendlyShippingProfileName(profile.name), false, t)}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select>
                  </div>
                )}
              </div>

              {fulfillmentSet?.service_zones.map((zone, index) => (
                <Tabs.Content key={zone.id} value={index.toString()}>
                  <ServiceZoneTabContent
                    zone={zone}
                    type={type}
                    locationId={locationId}
                    fulfillmentSetId={fulfillmentSet.id}
                    selectedProfileId={selectedProfileId}
                  />
                </Tabs.Content>
              ))}
            </Tabs>
          </div>
        )}
      </div>
    </Container>
  );
}

const Actions = ({
  location,
}: {
  location: HttpTypes.AdminStockLocation;
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { mutateAsync } = useDeleteStockLocation(
    location.id
  );
  const prompt = usePrompt();

  const handleDelete = async () => {
    const res = await prompt({
      title: t('general.areYouSure'),
      description: t('stockLocations.delete.confirmation', {
        name: location.name,
      }),
      verificationText: location.name,
      verificationInstruction: t('general.typeToConfirm'),
      confirmText: t('actions.delete'),
      cancelText: t('actions.cancel'),
    });

    if (!res) {
      return;
    }

    await mutateAsync(undefined, {
      onSuccess: () => {
        toast.success(
          t('stockLocations.create.successToast', {
            name: location.name,
          })
        );
        navigate('/settings/locations', { replace: true });
      },
      onError: (e) => {
        toast.error(e.message);
      },
    });
  };

  return (
    <ActionMenu
      groups={[
        {
          actions: [
            {
              icon: <PencilSquare />,
              label: t('actions.edit'),
              to: `edit`,
            },
            {
              icon: <ArchiveBox />,
              label: t('stockLocations.edit.viewInventory'),
              to: `/inventory?location_id=${location.id}`,
            },
          ],
        },
        {
          actions: [
            {
              icon: <Trash />,
              label: t('actions.delete'),
              onClick: handleDelete,
            },
          ],
        },
      ]}
    />
  );
};