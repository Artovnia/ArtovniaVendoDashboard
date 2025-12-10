import { useLoaderData, useNavigate } from "react-router-dom"
import { Button } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { ArrowRight } from "@medusajs/icons"

import { useStore } from "../../../hooks/api/store.tsx"
import { StoreGeneralSection } from "./components/store-general-section/index.ts"
import { storeLoader } from "./loader.ts"

import { SingleColumnPageSkeleton } from "../../../components/common/skeleton/skeleton.tsx"
import { SingleColumnPage } from "../../../components/layout/pages/index.ts"
import { useDashboardExtension } from "../../../extensions/index.ts"
import { CompanySection } from "./components/company-section/company-section.tsx"
import { useMe } from "../../../hooks/api/users.tsx"
import { useOnboardingContext } from "../../../providers/onboarding-provider"

export const StoreDetail = () => {
  const initialData = useLoaderData() as Awaited<ReturnType<typeof storeLoader>>
  const navigate = useNavigate()
  const { t } = useTranslation()

  const { store, isPending, isError, error } = useStore(undefined, {
    initialData,
  })

  const { seller, isPending: sellerPending, isError: sellerError } = useMe()
  const { isOnboarding } = useOnboardingContext()

  const { getWidgets } = useDashboardExtension()

  if (isPending || sellerPending || !store || !seller) {
    return <SingleColumnPageSkeleton sections={2} />
  }

  if (isError || sellerError) {
    throw error
  }

  return (
    <SingleColumnPage
      widgets={{
        before: getWidgets("store.details.before"),
        after: getWidgets("store.details.after"),
      }}
      data={store}
      hasOutlet
    >
      <StoreGeneralSection seller={seller} />
      <CompanySection seller={seller} />
      
      {/* Back to Onboarding Wizard Button - Only show during onboarding */}
      {isOnboarding && (
        <div className="flex justify-center mt-6 mb-4">
          <Button
            variant="primary"
            onClick={() => navigate("/onboarding")}
            size="large"
          >
             {t("store.backToDashboard")}
            <ArrowRight className="mr-2" />
          
          </Button>
        </div>
      )}
    </SingleColumnPage>
  )
}