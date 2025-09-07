import { HttpTypes } from "@medusajs/types"
import { Button, toast } from "@medusajs/ui"
import { useRouteModal } from "../../../../../components/modals"
import { Form } from "../../../../../components/common/form"
import { Combobox } from "../../../../../components/inputs/combobox"
import { RouteDrawer } from "../../../../../components/modals"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import { useQuery } from "@tanstack/react-query"
import { useMemo, useEffect, useState } from "react"
import { fetchQuery } from "../../../../../lib/client"
import { useAssociateProductWithShippingProfile, useRemoveProductShippingProfile } from "../../../../../hooks/api/product-shipping-profile"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"
import * as z from "zod"

type ProductShippingProfileFormProps = {
  product: HttpTypes.AdminProduct & {
    shipping_profile?: HttpTypes.AdminShippingProfile
  }
  isLoading?: boolean
  isFetching?: boolean
}

const ProductShippingProfileSchema = z.object({
  shipping_profile_id: z.string().optional(),
})

export const ProductShippingProfileForm = ({
  product,
  isLoading = false,
  isFetching = false,
}: ProductShippingProfileFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  // Fetch shipping profiles from vendor API using useQuery instead of useComboboxData to avoid pagination issues
  const { data: shippingProfilesData } = useQuery({
    queryKey: ['shipping_profiles'],
    queryFn: async () => {
      return fetchQuery('/vendor/shipping-profiles', {
        method: 'GET',
        query: {},
      })
    },
  });

  // Convert shipping profiles data to options format for the combobox
  const shippingProfileOptions = useMemo(() => {
    if (!shippingProfilesData?.shipping_profiles) return [];
    return shippingProfilesData.shipping_profiles.map((profile: any) => ({
      label: profile.name,
      value: profile.id,
    }));
  }, [shippingProfilesData]);

  // Create a compatible interface to replace useComboboxData
  const shippingProfiles = {
    options: shippingProfileOptions,
    searchValue: '',
    onSearchValueChange: () => {},
    disabled: false,
    fetchNextPage: () => {},
    hasNextPage: false,
    isPending: false,
  }

  const form = useForm({
    defaultValues: {
      shipping_profile_id: "",
    },
    resolver: zodResolver(ProductShippingProfileSchema),
  })

  // We don't need to watch the shipping profile as we're using the form's submit handler
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { mutateAsync: associateShippingProfile } = useAssociateProductWithShippingProfile()
  const { mutateAsync: removeShippingProfile } = useRemoveProductShippingProfile()

  const handleSubmit = form.handleSubmit(async (data) => {
    setIsSubmitting(true);
    const shippingProfileId = data.shipping_profile_id === "" ? undefined : data.shipping_profile_id;
    
    try {
      if (shippingProfileId) {
        // If a shipping profile is selected, associate the product with it
        await associateShippingProfile({
          productId: product.id,
          shippingProfileId: shippingProfileId
        });
      } else {
        // If no shipping profile is selected, remove any existing association
        await removeShippingProfile({
          productId: product.id
        });
      }
      
      // Show success message
      toast.success(
        t("products.shippingProfile.edit.toasts.success") || "Shipping profile updated successfully"
      );
      handleSuccess();
    } catch (error: any) {
      console.error('Error updating shipping profile:', error);
      toast.error(error?.message || 'Failed to update shipping profile');
    } finally {
      setIsSubmitting(false);
    }
  })

  // Reset form when product data changes
  useEffect(() => {
    // CRITICAL FIX: Only reset form when product data is stable (not loading/fetching)
    if (!product || isLoading || isFetching) return;
    
    
    // ONLY use the direct relationship - no metadata fallback
    // This ensures single source of truth from the link table
    const profileId = product.shipping_profile?.id || "";
    const currentFormValue = form.getValues('shipping_profile_id');
    
    // Only reset if the value actually changed to prevent unnecessary resets
    if (currentFormValue !== profileId) {
      form.reset({
        shipping_profile_id: profileId as string
      });
    }
  }, [form, product, product?.shipping_profile?.id, isLoading, isFetching]);

  return (
    <RouteDrawer.Form form={form}>
      <KeyboundForm onSubmit={handleSubmit} className="flex h-full flex-col">
        <RouteDrawer.Body>
          <div className="flex h-full flex-col gap-y-4">
            <Form.Field
              control={form.control}
              name="shipping_profile_id"
              render={({ field }) => {
                return (
                  <Form.Item>
                    <Form.Label>
                      {t("formFields.shipping_profile.label")}
                    </Form.Label>
                    <Form.Control>
                      <Combobox
                        {...field}
                        allowClear
                        options={shippingProfiles.options}
                        searchValue={shippingProfiles.searchValue}
                        onSearchValueChange={
                          shippingProfiles.onSearchValueChange
                        }
                        fetchNextPage={shippingProfiles.fetchNextPage}
                      />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )
              }}
            />

            {/* <FormExtensionZone fields={fields} form={form} /> */}
          </div>
        </RouteDrawer.Body>
        <RouteDrawer.Footer>
          <div className="flex items-center justify-end gap-x-2">
            <RouteDrawer.Close asChild>
              <Button size="small" variant="secondary">
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button
              size="small"
              variant="primary"
              type="submit"
              isLoading={isSubmitting}
              className="ml-2"
            >
               {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}
