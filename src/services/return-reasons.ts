import { fetchQuery } from "../lib/client"

/**
 * Fetches all return reasons from the API
 * 
 * @returns An array of return reason objects with id, value, and label
 */
export const fetchReturnReasons = async () => {
  try {
    const { return_reasons } = await fetchQuery("/store/return-reasons", {
      method: "GET",
    })
    
    console.log("Fetched return reasons:", return_reasons)
    return return_reasons || []
  } catch (error) {
    console.error("Error fetching return reasons:", error)
    return []
  }
}
