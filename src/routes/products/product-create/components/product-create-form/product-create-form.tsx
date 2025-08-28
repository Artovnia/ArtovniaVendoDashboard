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
import { fetchQuery, uploadFilesQuery } from '../../../../../lib/client';
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
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
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
      // Set submitting state to prevent duplicate submissions
      setIsSubmitting(true);
      
      let isDraftSubmission = false;
      if (e?.nativeEvent instanceof SubmitEvent) {
        const submitter = e.nativeEvent
          .submitter as HTMLButtonElement;
        isDraftSubmission =
          submitter.dataset.name === SAVE_DRAFT_BUTTON;
      }
      
      console.log('Product create form submission values:', JSON.stringify(values, null, 2));

      // Process color assignments for metadata
      let hasColorAssignments = false;
      let originalColorAssignments = {};
      
      if (values.color_assignments && Object.keys(values.color_assignments).length > 0) {
        hasColorAssignments = true;
        originalColorAssignments = {...values.color_assignments};
        
        if (!values.metadata) {
          values.metadata = {
            gpsr_producer_name: '',
            gpsr_producer_address: '',
            gpsr_producer_contact: '',
            gpsr_instructions: '',
          };
        }
        
      
        
        // Transform temp variant IDs to be backend-compatible
        const transformedColorAssignments: Record<string, string[]> = {};
        const variants = values.variants || [];
        
        Object.entries(values.color_assignments).forEach(([tempId, colorIds]) => {
          if (!colorIds || (Array.isArray(colorIds) && colorIds.length === 0)) {
            console.log(`Skipping empty color assignment for ${tempId}`);
            return;
          }
          
          // Extract the index from tempId (temp_default_0 -> 0, temp_option_TITLE -> by title)
          if (tempId.startsWith('temp_option_')) {
            // New format: temp_option_VARIANT_TITLE
            const variantTitle = tempId.replace('temp_option_', '');
            transformedColorAssignments[tempId] = colorIds as string[];
          } else if (tempId.startsWith('temp_default_')) {
            // Legacy format: temp_default_0, temp_default_1, etc.
            const parts = tempId.split('_');
            const index = parseInt(parts[parts.length - 1] || '0', 10);
            const variant = variants[index];
            
            if (variant && variant.title) {
              const newTempId = `temp_option_${variant.title}`;
              transformedColorAssignments[newTempId] = colorIds as string[];
            } else {
              transformedColorAssignments[tempId] = colorIds as string[];
            }
          } else {
            // Keep original format
            transformedColorAssignments[tempId] = colorIds as string[];
          }
        });
        
        if (Object.keys(transformedColorAssignments).length > 0) {
          values.metadata.raw_color_assignments = transformedColorAssignments;
          values.metadata.handle_colors_via_api = true;
        }
      }

      const media = values.media || [];
      console.log(`Form has ${media.length} media files attached`);
      
      // Create a clean payload without direct color_assignments property
      const payload = { ...values, media: undefined };
      
      if ('color_assignments' in payload) {
        delete payload.color_assignments;
      }
      
      let uploadedMedia: (HttpTypes.AdminFile & {
        isThumbnail: boolean;
      })[] = [];
      
      // Validate and upload media files
      if (media.length) {
        console.log(`Starting upload of ${media.length} media files`);
        
        try {
          const thumbnailReq = media.find((m) => m.isThumbnail);
          const otherMediaReq = media.filter((m) => !m.isThumbnail);

          const fileReqs = [];
          
          if (thumbnailReq) {
            console.log('Uploading thumbnail image');
            fileReqs.push(
              uploadFilesQuery([thumbnailReq]).then(
                (r: any) =>
                  r.files.map((f: any) => ({
                    ...f,
                    isThumbnail: true,
                  }))
              )
            );
          }
          
          if (otherMediaReq?.length) {
            console.log(`Uploading ${otherMediaReq.length} additional images`);
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

          uploadedMedia = (await Promise.all(fileReqs)).flat();
          
          console.log(`Successfully uploaded ${uploadedMedia.length} files`);
          
          // Validate that we got all expected files
          if (uploadedMedia.length !== media.length) {
            throw new Error(
              `Upload validation failed: Expected ${media.length} files, but only ${uploadedMedia.length} were uploaded successfully. Please try again.`
            );
          }
          
        } catch (error) {
          setIsSubmitting(false);
          
          if (error instanceof Error) {
            // Show detailed error message to user
            toast.error(`Image upload failed: ${error.message}`);
            console.error('Image upload error:', error);
          } else {
            toast.error('Image upload failed. Please check your files and try again.');
            console.error('Unknown upload error:', error);
          }
          
          // Stop form submission if image upload fails
          return;
        }
      }

      
      
      const productOptions = payload.options?.map(option => ({
        ...option,
        title: option.title?.trim() || "model",
        values: Array.isArray(option.values) ? option.values : []
      })) || [];
      
      const variants = payload.variants?.map(variant => {
        const processedVariant = { ...variant };
        const optionsRecord: Record<string, string> = {};
        
        if (productOptions.length > 0) {
          productOptions.forEach(productOption => {
            optionsRecord[productOption.title] = variant.title || '';
          });
          processedVariant.options = optionsRecord;
          
          const variantWithMeta = processedVariant as unknown as {
            metadata?: Record<string, any>;
          };
          
          if (!variantWithMeta.metadata) {
            variantWithMeta.metadata = {};
          }
          
          variantWithMeta.metadata.option_mapping = productOptions.map((productOption: any) => ({
            option_id: productOption?.id,
            option_name: productOption.title,
            value: variant.title || ''
          }));
        }
        
        return processedVariant;
      }) || [];
      
      
      
      const apiPayload = {
        ...payload,
        options: productOptions,
        variants: variants,
        status: isDraftSubmission ? 'draft' : 'published',
        images: uploadedMedia,
      };
      
      await mutateAsync(
        {
          ...apiPayload,
          weight: parseInt(payload.weight || '') || undefined,
          length: parseInt(payload.length || '') || undefined,
          height: parseInt(payload.height || '') || undefined,
          width: parseInt(payload.width || '') || undefined,
          type_id: payload.type_id || undefined,
          collection_id: payload.collection_id || undefined,
          shipping_profile_id: payload.shipping_profile_id || undefined,
          enable_variants: undefined,
          additional_data: undefined,
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
              shipping_profile_id: payload.metadata.shipping_profile_id,
            },
            handle_colors_via_api: true,
            raw_color_assignments: originalColorAssignments,
          } as any,
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
            sku: variant.sku || `${payload.title.substring(0, 3).toUpperCase()}-${Date.now().toString().substring(9)}-${index}`,
            prices: (() => {
              
              const createPriceObject = (amount: number, currency: string) => ({
                amount: amount,
                currency_code: currency.toLowerCase()
              });
              
              try {
                if (Array.isArray(variant.prices) && variant.prices.length > 0 && 
                    variant.prices[0] && typeof variant.prices[0].amount !== 'undefined') {
                  return variant.prices;
                }
                
                if (variant.prices && typeof variant.prices === 'object') {
                  const priceArray = [];
                  
                  if (variant.prices.default) {
                    const defaultPrice = String(variant.prices.default);
                    const amount = parseFloat(defaultPrice);
                    
                    if (!isNaN(amount)) {
                      priceArray.push(createPriceObject(amount, "pln"));
                    }
                  }
                  
                  Object.entries(variant.prices).forEach(([currency, value]) => {
                    if (currency !== 'default' && value) {
                      const stringValue = String(value);
                      const amount = parseFloat(stringValue);
                      
                      if (!isNaN(amount)) {
                        priceArray.push(createPriceObject(amount, currency));
                      }
                    }
                  });
                  
                  return priceArray;
                }
                
            
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
          setIsSubmitting(false); // Reset submitting state on success
            try {
              console.log('Product creation response:', data);
              
              const productId = data.product?.id;
              const isApprovalWorkflow = !productId && !!data.id;
              
              if (isApprovalWorkflow) {
                console.log('Product submitted for approval with request ID:', data.id);
                
                try {
                  const requestId = data.id;
                  if (requestId && payload.metadata) {
                    const typedMetadata = payload.metadata as any;
                    if (typedMetadata.raw_color_assignments) {
                      console.log('Updating request metadata with color assignments for after approval');
                      
                      await fetchQuery(`/vendor/requests/${requestId}`, {
                        method: 'POST',
                        body: {
                          metadata: {
                            has_pending_color_assignments: true,
                            handle_colors_via_api: true,
                            raw_color_assignments: typedMetadata.raw_color_assignments
                          }
                        }
                      });
                      console.log('Successfully updated request metadata with color assignments');
                    }
                  }
                } catch (metadataError) {
                  console.error('Failed to update request metadata with color assignments:', metadataError);
                }
                
                toast.success('Product submitted for approval');
                handleSuccess();
                return;
              }
              
              if (!productId) {
                console.warn('Product ID not found in response. Post-processing steps will be skipped.');
                toast.success(`${data.product?.title || 'Product'} has been created successfully`);
                handleSuccess();
                return;
              }
              
              console.log(`Product created successfully with ID: ${productId}`);
              toast.success(`${data.product?.title || 'Product'} has been created successfully`);
              
              // NOTE: Color assignment processing removed - handled by backend hooks
              
              // Handle GPSR data if present
              if (payload.metadata) {
                try {
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
                  
                  if (gpsrData.gpsr.producerName || gpsrData.gpsr.producerAddress || 
                      gpsrData.gpsr.producerContact || gpsrData.gpsr.instructions) {
                    await mutateGPSR(gpsrData);
                  }
                } catch (gpsrError) {
                  console.error('Failed to submit GPSR data:', gpsrError);
                  toast.error('Product safety data could not be saved. Please add it on the product edit page.');
                }
              }
              
              // Handle shipping profile association if needed
              const shippingProfileId = values.shipping_profile_id || 
                (values.metadata as any)?.shipping_profile_id || 
                payload.metadata?.shipping_profile_id;
              
              if (shippingProfileId) {
                try {
                  await associateShippingProfile({
                    productId,
                    shippingProfileId
                  });
                } catch (profileError) {
                  console.error('Failed to associate product with shipping profile:', profileError);
                }
              }
              
              // Navigate to the product detail page
              handleSuccess(`../${productId}`);
              
            } catch (error) {
              console.error('Error in product creation success handler:', error);
              handleSuccess();
            }
          },
          onError: (error: Error) => {
          setIsSubmitting(false); // Reset submitting state on error
          toast.error(t('errors.productCreateFailed'));
        },
        }
      );
    }
  );

  const onNext = async (currentTab: Tab) => {
    // Only validate fields relevant to the current tab
    let valid = true;
    
    switch (currentTab) {
      case Tab.DETAILS:
        valid = await form.trigger(['title'] as any);
        break;
      case Tab.ORGANIZE:
        valid = await form.trigger(['shipping_profile_id', 'categories'] as any);
        break;
      case Tab.COLOR_SCHEME:
        // Color scheme is optional, always allow progression
        valid = true;
        break;
      case Tab.VARIANTS:
        valid = await form.trigger(['variants', 'options'] as any);
        break;
      case Tab.INVENTORY:
        valid = await form.trigger(['variants'] as any);
        break;
      default:
        valid = true;
    }

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
    if (tab === Tab.COLOR_SCHEME) {
      currentState[Tab.DETAILS] = 'completed';
      currentState[Tab.ORGANIZE] = 'completed';
      currentState[Tab.COLOR_SCHEME] = 'in-progress';
    }
    if (tab === Tab.VARIANTS) {
      currentState[Tab.DETAILS] = 'completed';
      currentState[Tab.ORGANIZE] = 'completed';
      currentState[Tab.COLOR_SCHEME] = 'completed';
      currentState[Tab.VARIANTS] = 'in-progress';
    }
    if (tab === Tab.INVENTORY) {
      currentState[Tab.DETAILS] = 'completed';
      currentState[Tab.ORGANIZE] = 'completed';
      currentState[Tab.COLOR_SCHEME] = 'completed';
      currentState[Tab.VARIANTS] = 'completed';
      currentState[Tab.INVENTORY] = 'in-progress';
    }

    setTabState({ ...currentState });
  }, [tab]);

  return (
    <RouteFocusModal.Form form={form}>
      <KeyboundForm
        onKeyDown={(e) => {
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
          onValueChange={async (newTab) => {
            // Only validate current tab fields when switching tabs
            let valid = true;
            
            switch (tab) {
              case Tab.DETAILS:
                valid = await form.trigger(['title'] as any);
                break;
              case Tab.ORGANIZE:
                valid = await form.trigger(['shipping_profile_id', 'categories'] as any);
                break;
              case Tab.COLOR_SCHEME:
                // Color scheme is optional, always allow progression
                valid = true;
                break;
              case Tab.VARIANTS:
                valid = await form.trigger(['variants', 'options'] as any);
                break;
              case Tab.INVENTORY:
                valid = await form.trigger(['variants'] as any);
                break;
              default:
                valid = true;
            }

            if (!valid) {
              return;
            }

            setTab(newTab as Tab);
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
                  {t('products.create.tabs.color_scheme')}
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
              <Button 
                variant='secondary' 
                size='small'
                type='button'
              >
                {t('actions.cancel')}
              </Button>
            </RouteFocusModal.Close>
            <Button
              data-name={SAVE_DRAFT_BUTTON}
              size='small'
              type='submit'
              isLoading={isPending || isSubmitting}
              className='whitespace-nowrap'
            >
              {t('actions.saveAsDraft')}
            </Button>
            <PrimaryButton
              tab={tab}
              next={onNext}
              isLoading={isPending || isSubmitting}
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