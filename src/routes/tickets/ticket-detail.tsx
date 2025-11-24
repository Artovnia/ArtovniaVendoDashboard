import { useParams, useNavigate } from "react-router-dom"
import { TicketDetail } from "./components/ticket-detail"

export const Component = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  if (!id) {
    navigate("/tickets")
    return null
  }

  return <TicketDetail ticketId={id} />
}

export default Component
