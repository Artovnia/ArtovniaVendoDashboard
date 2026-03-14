import { useParams } from "react-router-dom"
import { RouteFocusModal } from "../../../components/modals"
import { VisuallyHidden } from "../../../components/utilities/visually-hidden"
import { useCampaign } from "../../../hooks/api/campaigns"
import { AddCampaignPromotionsForm } from "./components"

export const AddCampaignPromotions = () => {
  const { id } = useParams()
  const { campaign, isError, error } = useCampaign(id!)

  if (isError) {
    throw error
  }

  return (
    <RouteFocusModal>
      <RouteFocusModal.Header>
        <RouteFocusModal.Title asChild>
          <VisuallyHidden>Add promotions to campaign</VisuallyHidden>
        </RouteFocusModal.Title>
        <RouteFocusModal.Description asChild>
          <VisuallyHidden>Select promotions to attach to this campaign.</VisuallyHidden>
        </RouteFocusModal.Description>
      </RouteFocusModal.Header>
      {campaign && <AddCampaignPromotionsForm campaign={campaign} />}
    </RouteFocusModal>
  )
}
