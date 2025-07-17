import { Suspense } from "react"
import { Requests } from "./requests-list/requests"
import { Text } from "@medusajs/ui"

/**
 * Main Requests page component that serves as the entry point to the requests section
 * This component is lazily loaded when users navigate to /requests
 */
const RequestsPage = () => {
  return (
    <Suspense fallback={<div className="flex h-full w-full items-center justify-center">
      <Text size="base">Loading requests...</Text>
    </div>}>
      <Requests />
    </Suspense>
  )
}

export default RequestsPage
