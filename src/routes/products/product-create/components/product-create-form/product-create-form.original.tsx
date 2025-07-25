import { HttpTypes } from '@medusajs/types';
import {
  Button,
  ProgressStatus,
  ProgressTabs,
  toast,
} from '@medusajs/ui';
import { useEffect, useMemo, useState } from 'react';
import { useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  RouteFocusModal,
  useRouteModal,
} from '../../../../../components/modals';
import { KeyboundForm } from '../../../../../components/utilities/keybound-form';
import {
  useDashboardExtension,
  useExtendableForm,
} from '../../../../../extensions';
import { useCreateProduct } from '../../../../../hooks/api/products';
import { useCreateUpdateGPSR } from '../../../../../hooks/api/gpsr';
import { useAssociateProductWithShippingProfile } from '../../../../../hooks/api/product-shipping-profile';
import { useAssignProductColors, useAssignVariantColors } from '../../../../../hooks/api/colors';
import { uploadFilesQuery } from '../../../../../lib/client';
import {
  PRODUCT_CREATE_FORM_DEFAULTS,
  ProductCreateSchema,
} from '../../constants';
import { ProductCreateDetailsForm } from '../product-create-details-form';
import { ProductCreateInventoryKitForm } from '../product-create-inventory-kit-form';
import { ProductCreateOrganizeForm } from '../product-create-organize-form';
import { ProductCreateVariantsForm } from '../product-create-variants-form';
import { useNavigate } from 'react-router-dom';
import { ProductCreateColorSchemeForm } from '../product-create-color-scheme-form/product-create-color-scheme-form';

enum Tab {
  DETAILS = 'details',
  ORGANIZE = 'organize',
  COLOR_SCHEME = 'color_scheme',
  VARIANTS = 'variants',
  INVENTORY = 'inventory',
}

type TabState = Record<Tab, ProgressStatus>;

const SAVE_DRAFT_BUTTON = 'save-draft-button';

type ProductCreateFormProps = {
  defaultChannel?: HttpTypes.AdminSalesChannel;
  store?: HttpTypes.AdminStore;
  pricePreferences?: HttpTypes.AdminPricePreference[];
};

export const ProductCreateForm = ({
  defaultChannel,
  store,
  pricePreferences,
}: ProductCreateFormProps) => {
  const [tab, setTab] = useState<Tab>(Tab.DETAILS);
  const [tabState, setTabState] = useState<TabState>({
    [Tab.DETAILS]: 'in-progress',
    [Tab.ORGANIZE]: 'not-started',
    [Tab.COLOR_SCHEME]: 'not-started',
    [Tab.VARIANTS]: 'not-started',
    [Tab.INVENTORY]: 'not-started',
  });

  const { t } = useTranslation();
  const { handleSuccess } = useRouteModal();
  const navigate = useNavigate();
  const { getFormConfigs } = useDashboardExtension();
  const configs = getFormConfigs('product', 'create');

  const form = useExtendableForm({
    defaultValues: {
      ...PRODUCT_CREATE_FORM_DEFAULTS,
      sales_channels: defaultChannel
        ? [
            {
              id: defaultChannel.id,
              name: defaultChannel.name,
            },
          ]
        : [],
    },
    schema: ProductCreateSchema,
    configs,
  });

  const { mutateAsync, isPending } = useCreateProduct();
  const { mutateAsync: mutateGPSR } = useCreateUpdateGPSR();
  const { mutateAsync: associateShippingProfile } = useAssociateProductWithShippingProfile();
  
  // Import hooks for color assignment
  const { mutateAsync: assignProductColors } = useAssignProductColors();
  const { mutateAsync: assignVariantColors } = useAssignVariantColors();

  /**
   * TODO: Important to revisit this - use variants watch so high in the tree can cause needless rerenders of the entire page
   * which is suboptimal when rerenders are caused by bulk editor changes
   */

  const watchedVariants = useWatch({
    control: form.control,
    name: 'variants',
  });

  const showInventoryTab = useMemo(
    () =>
      watchedVariants.some(
        (v) => v.manage_inventory && v.inventory_kit
      ),
    [watchedVariants]
  );

  const onSubmit = form.handleSubmit(
    async (values, e) => {
      let isDraftSubmission = false;
      if (e?.nativeEvent instanceof SubmitEvent) {
        const submitter = e.nativeEvent
          .submitter as HTMLButtonElement;
        isDraftSubmission =
          submitter.dataset.name === SAVE_DRAFT_BUTTON;
      }

      const media = values.media || [];
      // Extract color_assignments to prevent it from being sent to the API
      const { color_assignments, ...valuesWithoutColorAssignments } = values;
      const payload = { ...valuesWithoutColorAssignments, media: undefined };

      let uploadedMedia: (HttpTypes.AdminFile & {
        isThumbnail: boolean;
      })[] = [];
      try {
        if (media.length) {
          const thumbnailReq = media.find(
            (m) => m.isThumbnail
          );
          const otherMediaReq = media.filter(
            (m) => !m.isThumbnail
          );

          const fileReqs = [];
          if (thumbnailReq) {
            fileReqs.push(
              uploadFilesQuery(thumbnailReq.file).then(
                (r: any) =>
                  r.files.map((f: any) => ({
                    ...f,
                    isThumbnail: true,
                  }))
              )
            );
          }
          if (otherMediaReq?.length) {
            fileReqs.push(
              uploadFilesQuery(otherMediaReq).then(
                (r: any) =>
                  r.files.map((f: any) => ({
                    ...f,
                    isThumbnail: false,
                  }))
              )
            );
          }

          uploadedMedia = (
            await Promise.all(fileReqs)
          ).flat();
        }
      } catch (error) {
        if (error instanceof Error) {
          toast.error(error.message);
        }
      }

      await mutateAsync(
        {
          ...payload,
          status: isDraftSubmission ? 'draft' : 'published',
          images: uploadedMedia,
          weight:
            parseInt(payload.weight || '') || undefined,
          length:
            parseInt(payload.length || '') || undefined,
          height:
            parseInt(payload.height || '') || undefined,
          width: parseInt(payload.width || '') || undefined,
          // Keep the selected values for these fields
          type_id: payload.type_id || undefined,
          collection_id: payload.collection_id || undefined,
          shipping_profile_id: payload.shipping_profile_id || undefined,
          enable_variants: undefined,
          additional_data: undefined,
          // Include metadata for GPSR data and additional workflow information
          metadata: {
            ...payload.metadata && {
              gpsr_producer_name: payload.metadata.gpsr_producer_name,
              gpsr_producer_address: payload.metadata.gpsr_producer_address,
              gpsr_producer_contact: payload.metadata.gpsr_producer_contact,
              gpsr_importer_name: payload.metadata.gpsr_importer_name,
              gpsr_importer_address: payload.metadata.gpsr_importer_address,
              gpsr_importer_contact: payload.metadata.gpsr_importer_contact,
              gpsr_instructions: payload.metadata.gpsr_instructions,
              gpsr_certificates: payload.metadata.gpsr_certificates,
            },
            // Include color_assignments in metadata for the backend workflow
            // This will be handled by the product creation workflow hook
            color_assignments: color_assignments || {},
          },
          categories: payload.categories.map((cat) => ({
            id: cat,
          })),
          tags: payload.tags ? payload.tags.map((tag) => ({ id: tag })) : [],
          variants: payload.variants.map((variant, index) => ({
            ...variant,
            manage_inventory: true,
            allow_backorder: false,
            should_create: undefined,
            is_default: undefined,
            inventory_kit: undefined,
            inventory: undefined,
            // Generate a unique SKU if not provided
            sku: variant.sku || `${payload.title.substring(0, 3).toUpperCase()}-${Date.now().toString().substring(9)}-${index}`,
            // Properly format variant prices for the API
            prices: (() => {
              console.log('Debug - Processing variant prices:', variant.prices);
              
              // Helper to safely convert price values to the format Medusa expects
              const createPriceObject = (amount: number, currency: string) => ({
                amount: amount,
                currency_code: currency.toLowerCase()
              });
              
              try {
                // If we already have an array of properly formatted price objects, use them
                if (Array.isArray(variant.prices) && variant.prices.length > 0 && 
                    variant.prices[0] && typeof variant.prices[0].amount !== 'undefined') {
                  console.log('Using existing array of price objects');
                  return variant.prices;
                }
                
                // If we have a prices object with currency codes as keys
                if (variant.prices && typeof variant.prices === 'object') {
                  console.log('Converting price object to array');
                  const priceArray = [];
                  
                  // Handle default price (which is the price in PLN)
                  if (variant.prices.default) {
                    // Parse the price value safely
                    const defaultPrice = String(variant.prices.default); // Force to string
                    const amount = parseFloat(defaultPrice);
                    
                    if (!isNaN(amount)) {
                      priceArray.push(createPriceObject(amount, "pln"));
                      console.log('Added default price in PLN:', amount);
                    }
                  }
                  
                  // Handle other currency codes
                  Object.entries(variant.prices).forEach(([currency, value]) => {
                    if (currency !== 'default' && value) {
                      // Force conversion to string and parse
                      const stringValue = String(value);
                      const amount = parseFloat(stringValue);
                      
                      if (!isNaN(amount)) {
                        priceArray.push(createPriceObject(amount, currency));
                        console.log(`Added price in ${currency}:`, amount);
                      }
                    }
                  });
                  
                  return priceArray;
                }
                
                // Fallback: return empty array if we can't parse prices
                console.log('Fallback: Could not parse prices, returning empty array');
                return [];
              } catch (error) {
                console.error('Error parsing prices:', error);
                return [];
              }
            })(),
          })),
        },
        {
          onSuccess: async (data: any) => {
            try {
              console.log('Product creation response:', data);
              
              // Get the product ID, handling both direct creation and approval workflow cases
              const productId = data.product?.id;
              const isApprovalWorkflow = !productId && !!data.id;
              
              // Determine success message and navigation
              if (isApprovalWorkflow) {
                console.log('Product submitted for approval with request ID:', data.id);
                toast.success('Product submitted for approval');
                // Early return since we can't do post-processing without a product ID
                // The backend workflow will handle color assignments, shipping profile, etc.
                handleSuccess(); // Just close the modal for approval workflow
                return;
              }
              
              // Check if we have a valid product ID for direct creation workflow
              if (!productId) {
                console.warn('Product ID not found in response. Post-processing steps will be skipped.');
                toast.success(`${data.product?.title || 'Product'} has been created successfully`);
                handleSuccess(); // Just close the modal if no product ID
                return;
              }
              
              // Product created successfully with ID
              console.log(`Product created successfully with ID: ${productId}. Proceeding with post-processing...`);
              toast.success(`${data.product?.title || 'Product'} has been created successfully`);
              
              // Check if the shipping profile ID exists in the form data
              const shippingProfileId = values.shipping_profile_id || 
                (values.metadata as any)?.shipping_profile_id || 
                payload.metadata?.shipping_profile_id;
              
              // Handle GPSR data if present
              if (payload.metadata) {
                try {
                  // Process GPSR data if present and we have a product ID
                  const gpsrData = {
                    productId,
                    gpsr: {
                      producerName: payload.metadata.gpsr_producer_name || '',
                      producerAddress: payload.metadata.gpsr_producer_address || '',
                      producerContact: payload.metadata.gpsr_producer_contact || '',
                      importerName: payload.metadata.gpsr_importer_name || '',
                      importerAddress: payload.metadata.gpsr_importer_address || '',
                      importerContact: payload.metadata.gpsr_importer_contact || '',
                      instructions: payload.metadata.gpsr_instructions || '',
                      certificates: payload.metadata.gpsr_certificates || '',
                    }
                  };
                  
                  // Only submit GPSR data if at least one required field is filled
                  if (gpsrData.gpsr.producerName || gpsrData.gpsr.producerAddress || 
                      gpsrData.gpsr.producerContact || gpsrData.gpsr.instructions) {
                    console.log('Submitting GPSR data for product ID:', productId);
                    await mutateGPSR(gpsrData);
                    console.log('GPSR data submitted successfully');
                  } else {
                    console.log('No GPSR data to submit');
                  }
                } catch (gpsrError) {
                  console.error('Failed to submit GPSR data:', gpsrError);
                  // Show a more specific error message
                  toast.error('Product safety data could not be saved. Please add it on the product edit page.');
                }
              }
              
              // Handle shipping profile association if needed
              if (shippingProfileId) {
                try {
                  console.log(`Associating product with shipping profile: ${shippingProfileId}`);
                  // Associate the product with the shipping profile
                  await associateShippingProfile({
                    productId,
                    shippingProfileId
                  });
                  console.log('Successfully associated product with shipping profile');
                } catch (profileError) {
                  console.error('Failed to associate product with shipping profile:', profileError);
                  // Don't show error toast here as the product was created successfully
                }
              }
              
              console.log('Product created successfully, processing color assignments now...');
              console.log('Full response data:', data);
              
              // We already have productId from earlier, so don't redeclare it
              console.log('Proceeding with color assignments for product ID:', productId);
              if (!productId) {
                console.error('No product ID found in response - cannot assign colors');
                return;
              }
              
              // IMPORTANT: Extract color assignments correctly from the metadata
              // In a newly created product, metadata might be stored differently in the response
              const rawMetadata = data?.product?.metadata || {};
              let colorAssignments;
              
              // Try to parse color assignments - it could be stored as a string if it came from metadata
              if (typeof rawMetadata === 'object') {
                if (rawMetadata.color_assignments) {
                  if (typeof rawMetadata.color_assignments === 'string') {
                    try {
                      // If it's a string (JSON), parse it
                      colorAssignments = JSON.parse(rawMetadata.color_assignments);
                      console.log('Parsed color assignments from metadata string:', colorAssignments);
                    } catch (e) {
                      console.error('Failed to parse color assignments string:', e);
                    }
                  } else {
                    // If it's already an object
                    colorAssignments = rawMetadata.color_assignments;
                    console.log('Found color assignments directly in metadata:', colorAssignments);
                  }
                }
              }
              if (colorAssignments && typeof colorAssignments === 'object') {
                try {
                  console.log('Color assignments found, applying to product and variants:', colorAssignments);
                  
                  // First, collect all unique colors for product-level assignment
                  const allProductColors = new Set<string>();
                  
                  // Get the variants from the response
                  const variants = data.product?.variants || [];
                  
                  // Process each variant with color assignments
                  const variantColorPromises = Object.entries(colorAssignments).map(async ([variantKey, colorIds]) => {
                    // NEW: Handle array of color IDs
                    const colorIdsArray = Array.isArray(colorIds) ? colorIds : [];
                    
                    // Skip if no colors assigned
                    if (!colorIdsArray.length) return;
                    
                    console.log(`Processing variant ${variantKey} with colors:`, colorIdsArray);
                    
                    // Add all colors to product-level colors (for aggregate color assignment)
                    colorIdsArray.forEach(colorId => allProductColors.add(colorId));
                    
                    // If it's a temp ID (from form), we need to find the real variant ID
                    let variantId = variantKey;
                    
                    if (variantKey.startsWith('temp_')) {
                      // Special case for default variant
                      if (variantKey === 'temp_default') {
                        // Find the default variant (should be the first one when only one variant exists)
                        const defaultVariant = variants[0];
                        if (defaultVariant) {
                          variantId = defaultVariant.id;
                          console.log(`Mapped default variant temp ID to real ID ${variantId}`);
                        } else {
                          console.warn('Could not find default variant');
                          return; // Skip - can't assign colors without a valid variant ID
                        }
                      } else {
                        // For variants with options based on temporary ID
                        const tempIdParts = variantKey.replace('temp_', '').split('_');
                        
                        // Find the matching variant in the response
                        const matchedVariant = variants.find((v: any) => {
                          // For variants with options, try to match by option values
                          if (v.options && Array.isArray(v.options)) {
                            // Safe type assertion because we've verified Array.isArray
                            const optionValues = (v.options as Array<{value: string}>).map(o => o.value);
                            return tempIdParts.every(part => optionValues.includes(part));
                          }
                          return false;
                        });
                        
                        if (matchedVariant) {
                          variantId = matchedVariant.id;
                          console.log(`Mapped temp variant ID ${variantKey} to real ID ${variantId}`);
                        } else {
                          console.warn(`Could not find matching variant for temp ID ${variantKey}`);
                          return; // Skip this variant
                        }
                      }
                    }
                    
                    try {
                      }
                    } catch (variantError) {
                      console.error(`Failed to assign colors to variant ${variantId}:`, variantError);
                    }
                  });
                  
                  // Wait for all variant color assignments to complete
                  await Promise.all(variantColorPromises.filter(Boolean));
                  
                  // Also assign all colors at the product level using direct API call
                  if (allProductColors.size > 0) {
                    try {
                      console.log(`Making direct API call to assign colors to product: Product=${productId}`);
                      const colorIdsArray = Array.from(allProductColors);
                      
                      // Format colors as objects with required properties according to the API schema
                      const formattedColorData = colorIdsArray.map((colorId, index) => ({
                        color_id: colorId,
                        is_primary: index === 0, // First color is primary
                        color_coverage: 'primary'
                      }));
                      
                      console.log('Formatted product color data:', formattedColorData);
                      
                      // Call API directly with properly formatted data
                      const response = await fetchQuery(`/vendor/products/${productId}/colors`, {
                        method: 'POST',
                        body: {
                          colors: formattedColorData
                        },
                      });
                      
                      console.log(`API response for product color assignment:`, response);
                      console.log(`Successfully assigned ${allProductColors.size} colors to product ${productId}`);
                    } catch (productColorError) {
                      console.error('Failed to assign colors to product:', productColorError);
                    }
                  }
                } catch (colorError) {
                  console.error('Error processing color assignments:', colorError);
                  // Don't break the flow if color assignment fails
                }
              } else {
                console.log('No color assignments found for this product');
              }
              
              // Navigate to the product detail page
              handleSuccess(`../${productId}`);
              
            } catch (error) {
              console.error('Error in product creation success handler:', error);
              // Don't show error toast here as the product was created successfully
              // but still navigate away since the product was created
              handleSuccess();
            }
          },
          onError: (error: Error) => {
            toast.error(error.message);
          }
        }
      );
    }
  );

  // Handle navigation between tabs with form validation check
  const onNext = async (currentTab: Tab) => {
    const valid = await form.trigger();

    if (!valid) {
      return;
    }
    
    switch (currentTab) {
      case Tab.DETAILS:
        setTabState((prev) => ({
          ...prev,
          [Tab.DETAILS]: 'completed',
          [Tab.ORGANIZE]: 'in-progress',
        }));
        setTab(Tab.ORGANIZE);
        break;
      case Tab.ORGANIZE:
        setTabState((prev) => ({
          ...prev,
          [Tab.ORGANIZE]: 'completed',
          [Tab.COLOR_SCHEME]: 'in-progress',
        }));
        setTab(Tab.COLOR_SCHEME);
        break;
      case Tab.COLOR_SCHEME:
        setTabState((prev) => ({
          ...prev,
          [Tab.COLOR_SCHEME]: 'completed',
          [Tab.VARIANTS]: 'in-progress',
        }));
        setTab(Tab.VARIANTS);
        break;
      case Tab.VARIANTS:
        if (showInventoryTab) {
          setTabState((prev) => ({
            ...prev,
            [Tab.VARIANTS]: 'completed',
            [Tab.INVENTORY]: 'in-progress',
          }));
          setTab(Tab.INVENTORY);
        }
        break;
      default:
        break;
    }
  };
  
  useEffect(() => {
    const currentState = { ...tabState };
    if (tab === Tab.DETAILS) {
      currentState[Tab.DETAILS] = 'in-progress';
    }
    if (tab === Tab.ORGANIZE) {
      currentState[Tab.DETAILS] = 'completed';
      currentState[Tab.ORGANIZE] = 'in-progress';
    }
    if (tab === Tab.COLOR_SCHEME) { // New tab state
      currentState[Tab.DETAILS] = 'completed';
      currentState[Tab.ORGANIZE] = 'completed';
      currentState[Tab.COLOR_SCHEME] = 'in-progress';
    }
    if (tab === Tab.VARIANTS) {
      currentState[Tab.DETAILS] = 'completed';
      currentState[Tab.ORGANIZE] = 'completed';
      currentState[Tab.COLOR_SCHEME] = 'completed'; // New tab state
      currentState[Tab.VARIANTS] = 'in-progress';
    }
    if (tab === Tab.INVENTORY) {
      currentState[Tab.DETAILS] = 'completed';
      currentState[Tab.ORGANIZE] = 'completed';
      currentState[Tab.COLOR_SCHEME] = 'completed'; // New tab state
      currentState[Tab.VARIANTS] = 'completed';
      currentState[Tab.INVENTORY] = 'in-progress';
    }

    setTabState({ ...currentState });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- we only want this effect to run when the tab changes
  }, [tab]);

  // Update tab state effect - maintains the visual progress indicator

  return (
    <RouteFocusModal.Form form={form}>
      <KeyboundForm
        onKeyDown={(e) => {
          // We want to continue to the next tab on enter instead of saving as draft immediately
          if (e.key === 'Enter') {
            if (
              e.target instanceof HTMLTextAreaElement &&
              !(e.metaKey || e.ctrlKey)
            ) {
              return;
            }

            e.preventDefault();

            if (e.metaKey || e.ctrlKey) {
              if (tab !== Tab.VARIANTS) {
                e.preventDefault();
                e.stopPropagation();
                onNext(tab);

                return;
              }

              onSubmit();
            }
          }
        }}
        onSubmit={onSubmit}
        className='flex h-full flex-col'
      >
        <ProgressTabs
          value={tab}
          onValueChange={async (tab) => {
            const valid = await form.trigger();

            if (!valid) {
              return;
            }

            setTab(tab as Tab);
          }}
          className='flex h-full flex-col overflow-hidden'
        >
          <RouteFocusModal.Header>
            <div className='-my-2 w-full border-l'>
              <ProgressTabs.List className='justify-start-start flex w-full items-center'>
                <ProgressTabs.Trigger
                  status={tabState[Tab.DETAILS]}
                  value={Tab.DETAILS}
                  className='max-w-[200px] truncate'
                >
                  {t('products.create.tabs.details')}
                </ProgressTabs.Trigger>
                <ProgressTabs.Trigger
                  status={tabState[Tab.ORGANIZE]}
                  value={Tab.ORGANIZE}
                  className='max-w-[200px] truncate'
                >
                  {t('products.create.tabs.organize')}
                </ProgressTabs.Trigger>
                <ProgressTabs.Trigger
                  status={tabState[Tab.COLOR_SCHEME]}
                  value={Tab.COLOR_SCHEME}
                  className='max-w-[200px] truncate'
                >
                  {t('products.create.tabs.color_scheme', 'Schemat kolorĂłw')}
                </ProgressTabs.Trigger>
                <ProgressTabs.Trigger
                  status={tabState[Tab.VARIANTS]}
                  value={Tab.VARIANTS}
                  className='max-w-[200px] truncate'
                >
                  {t('products.create.tabs.variants')}
                </ProgressTabs.Trigger>
                {showInventoryTab && (
                  <ProgressTabs.Trigger
                    status={tabState[Tab.INVENTORY]}
                    value={Tab.INVENTORY}
                    className='max-w-[200px] truncate'
                  >
                    {t('products.create.tabs.inventory')}
                  </ProgressTabs.Trigger>
                )}
              </ProgressTabs.List>
            </div>
          </RouteFocusModal.Header>
          <RouteFocusModal.Body className='size-full overflow-hidden'>
            <ProgressTabs.Content
              className='size-full overflow-y-auto'
              value={Tab.DETAILS}
            >
              <ProductCreateDetailsForm form={form} />
            </ProgressTabs.Content>
            <ProgressTabs.Content
              className='size-full overflow-y-auto'
              value={Tab.ORGANIZE}
            >
              <ProductCreateOrganizeForm form={form} />
            </ProgressTabs.Content>
            <ProgressTabs.Content
              className='size-full overflow-y-auto'
              value={Tab.COLOR_SCHEME}
            >
              <ProductCreateColorSchemeForm form={form} />
            </ProgressTabs.Content>
            <ProgressTabs.Content
              className='size-full overflow-y-auto'
              value={Tab.VARIANTS}
            >
              <ProductCreateVariantsForm
                form={form}
                // store={store}
                // regions={regions}
                // pricePreferences={pricePreferences}
              />
            </ProgressTabs.Content>
            {showInventoryTab && (
              <ProgressTabs.Content
                className='size-full overflow-y-auto'
                value={Tab.INVENTORY}
              >
                <ProductCreateInventoryKitForm
                  form={form}
                />
              </ProgressTabs.Content>
            )}
          </RouteFocusModal.Body>
        </ProgressTabs>
        <RouteFocusModal.Footer>
          <div className='flex items-center justify-end gap-x-2'>
            <RouteFocusModal.Close asChild>
              <Button variant='secondary' size='small'>
                {t('actions.cancel')}
              </Button>
            </RouteFocusModal.Close>
            <Button
              data-name={SAVE_DRAFT_BUTTON}
              size='small'
              type='submit'
              isLoading={isPending}
              className='whitespace-nowrap'
            >
              {t('actions.saveAsDraft')}
            </Button>
            <PrimaryButton
              tab={tab}
              next={onNext}
              isLoading={isPending}
              showInventoryTab={showInventoryTab}
            />
          </div>
        </RouteFocusModal.Footer>
      </KeyboundForm>
    </RouteFocusModal.Form>
  );
};

type PrimaryButtonProps = {
  tab: Tab;
  next: (tab: Tab) => void;
  isLoading?: boolean;
  showInventoryTab: boolean;
};

const PrimaryButton = ({
  tab,
  next,
  isLoading,
  showInventoryTab,
}: PrimaryButtonProps) => {
  const { t } = useTranslation();

  if (
    (tab === Tab.VARIANTS && !showInventoryTab) ||
    (tab === Tab.INVENTORY && showInventoryTab)
  ) {
    return (
      <Button
        data-name='publish-button'
        key='submit-button'
        type='submit'
        variant='primary'
        size='small'
        isLoading={isLoading}
      >
        {t('actions.publish')}
      </Button>
    );
  }

  return (
    <Button
      key='next-button'
      type='button'
      variant='primary'
      size='small'
      onClick={() => next(tab)}
    >
      {t('actions.continue')}
    </Button>
  );
};
