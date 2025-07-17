import { HolidayMode } from "./holiday-mode"
import { Container } from "@medusajs/ui"
import { SuspensionInfo } from "./components/suspension-info"

/**
 * Holiday Mode Page component for the main dashboard
 */
const HolidayModePage = () => {
  return (
    <div className="flex flex-col gap-y-8 pb-16">
      <div>
        <div className="flex flex-col gap-y-2">
          <h1 className="text-2xl font-semibold text-ui-fg-base">
            Wakacje i zawieszenia
          </h1>
          <p className="text-ui-fg-subtle">
            Zarządzaj dostępnością Twojego sklepu podczas urlopu lub przerwy w działalności.
          </p>
        </div>
      </div>
      
      <Container className="bg-ui-bg-subtle border rounded-lg shadow-sm mb-8">
        <HolidayMode />
        <SuspensionInfo />
      </Container>
    </div>
  )
}

export default HolidayModePage
