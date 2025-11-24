import { Suspense } from "react"
import { TicketsList } from "./components/tickets-list"

export const Component = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TicketsList />
    </Suspense>
  )
}

export default Component
