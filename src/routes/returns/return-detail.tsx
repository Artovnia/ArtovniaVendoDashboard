import { useParams, useNavigate } from "react-router-dom"
import { ReturnDetail } from "./components/return-detail"

export const Component = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  if (!id) {
    navigate("/returns")
    return null
  }

  return <ReturnDetail returnId={id} />
}

export default Component
