import { PencilSquare, ShoppingBag } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { Container, Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import { fetchQuery } from "../../../../../lib/client"

import { ActionMenu } from "../../../../../components/common/action-menu"

type ProductShippingProfileSectionProps = {
  product: HttpTypes.AdminProduct & {
    shipping_profile?: HttpTypes.AdminShippingProfile
  }
}

export const ProductShippingProfileSection = ({
  product,
}: ProductShippingProfileSectionProps) => {
  const { t } = useTranslation()

  // Fetch shipping profiles from vendor API to get current assignment
  const { data: shippingProfilesData } = useQuery({
    queryKey: ['shipping_profiles'],
    queryFn: async () => {
      return fetchQuery('/vendor/shipping-profiles', {
        method: 'GET',
        query: {},
      })
    },
  });

  // Find the currently assigned shipping profile - only use relationship table
  const currentShippingProfile = useMemo(() => {
    if (!shippingProfilesData?.shipping_profiles) {
      return null;
    }
    
    // ONLY use the direct relationship - no metadata fallback
    // This ensures single source of truth from the link table
    const profileId = product.shipping_profile?.id;
    
    
    if (!profileId) {
      return null;
    }
    
    const foundProfile = shippingProfilesData.shipping_profiles.find((profile: any) => 
      profile.id === profileId
    );

    return foundProfile;
  }, [shippingProfilesData, product.shipping_profile?.id]);

  const shippingProfile = currentShippingProfile

  return (
    <Container className="p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("products.shippingProfile.header")}</Heading>
        <ActionMenu
          groups={[
            {
              actions: [
                {
                  label: t("actions.edit"),
                  to: "shipping-profile",
                  icon: <PencilSquare />,
                },
              ],
            },
          ]}
        />
      </div>

      <div className="txt-small flex flex-col gap-2 px-2 pb-2">
        {shippingProfile ? (
          <div className="shadow-elevation-card-rest bg-ui-bg-component rounded-md px-4 py-2 transition-colors">
            <div className="flex items-center gap-3">
              <div className="size-10 flex items-center justify-center rounded-md bg-ui-bg-subtle">
                <ShoppingBag className="text-ui-fg-muted" />
              </div>
              <div className="flex flex-1 flex-col">
                <span className="text-ui-fg-base font-medium">
                  {shippingProfile.name || `Profile ${shippingProfile.id}`}
                </span>
                <span className="text-ui-fg-subtle">
                  Obecnie przypisany
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="shadow-elevation-card-rest bg-ui-bg-subtle rounded-md px-4 py-2">
            <div className="flex items-center gap-3">
              <div className="size-10 flex items-center justify-center rounded-md bg-ui-bg-base border border-dashed border-ui-border-base">
                <ShoppingBag className="text-ui-fg-muted" />
              </div>
              <div className="flex flex-1 flex-col">
                <span className="text-ui-fg-muted font-medium">
                  No shipping profile assigned
                </span>
                <span className="text-ui-fg-subtle">
                  This product has no shipping profile
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Container>
  )
}
