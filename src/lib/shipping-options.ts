import { HttpTypes } from "@medusajs/types"

/**
 * Determines if a shipping option is a return option based on its rules
 * 
 * @param shippingOption The shipping option object to check
 * @returns true if the shipping option is a return option, false otherwise
 */
export function isReturnOption(shippingOption: HttpTypes.AdminShippingOption): boolean {
  if (!shippingOption?.rules || !Array.isArray(shippingOption.rules)) {
    return false;
  }
  
  const returnRule = shippingOption.rules.find(r => r.attribute === "is_return" && r.operator === "eq");
  return returnRule ? returnRule.value === "true" : false;
}

export function isOptionEnabledInStore(shippingOption: HttpTypes.AdminShippingOption): boolean {
  if (!shippingOption?.rules || !Array.isArray(shippingOption.rules)) {
    return false;
  }
  
  const enabledRule = shippingOption.rules.find(r => r.attribute === "enabled_in_store" && r.operator === "eq");
  return enabledRule ? enabledRule.value === "true" : false;
}

export function getShippingProfileName(name: string): string {
  return name.split(":")[1];
}