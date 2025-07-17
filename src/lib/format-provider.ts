/**
 * Providers only have an ID to identify them. This function formats the ID
 * into a human-readable string.
 *
 * Format example: pp_stripe-blik_dkk
 *
 * @param id - The ID of the provider
 * @returns A formatted string
 */
export const formatProvider = (id?: string) => {
  if (!id) return "Unknown Provider";
  
  const parts = id.split("_");
  if (parts.length < 2) return id; // Return the original ID if it doesn't match expected format
  
  const [_, name, type] = parts;
  if (!name) return id;
  
  return (
    name
      .split("-")
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(" ") + (type ? ` (${type.toUpperCase()})` : "")
  )
}
