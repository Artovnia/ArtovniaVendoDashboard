import { HolidayMode } from "./holiday-mode"
import { Container } from "@medusajs/ui"
import { SuspensionInfo } from "./components/suspension-info"

/**
 * Holiday Mode Page component for the main dashboard
 */
const HolidayModePage = () => {
  return (
    
      
      <Container className="bg-ui-bg-subtle border rounded-lg shadow-sm mb-8">
        <HolidayMode />
        <SuspensionInfo />
      </Container>
  
  )
}

export default HolidayModePage
