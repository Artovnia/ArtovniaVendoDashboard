import { Suspense } from "react"
import { ReturnsList } from "./components/returns-list"

export const Component = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ReturnsList />
    </Suspense>
  )
}

export default Component
