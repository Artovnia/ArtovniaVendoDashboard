import { UseFormReturn } from "react-hook-form"

import { TemplateData } from "../hooks/api/product-templates"
import { ProductCreateSchemaType } from "../routes/products/product-create/types"
import { decorateVariantsWithDefaultValues } from "../routes/products/product-create/utils"

/**
 * Generate all permutations of option values.
 * Replicates the logic from product-create-details-variant-section.tsx
 */
const getPermutations = (
  data: { title: string; values: string[] }[]
): { [key: string]: string }[] => {
  if (data.length === 0) {
    return []
  }

  if (data.length === 1) {
    return data[0].values.map((value) => ({ [data[0].title]: value }))
  }

  const toProcess = data[0]
  const rest = data.slice(1)

  return toProcess.values.flatMap((value) => {
    return getPermutations(rest).map((permutation) => {
      return {
        [toProcess.title]: value,
        ...permutation,
      }
    })
  })
}

/**
 * Generate a variant name from its options and the product title.
 * Replicates the logic from product-create-details-variant-section.tsx
 */
const getVariantName = (options: Record<string, string>, productTitle?: string) => {
  const optionValues = Object.values(options).join(" / ")
  if (productTitle && optionValues && optionValues !== "Default option value") {
    return `${productTitle} - ${optionValues}`
  }
  return optionValues || productTitle || "Default variant"
}

/**
 * Apply a product template to the product creation form.
 *
 * This sets form values for options, GPSR, shipping profile, categories,
 * dimensions, description, material, and origin_country.
 * It also generates variant permutations from the template options.
 *
 * Does NOT set: title, media, handle (always unique per product)
 */
export const applyTemplate = (
  templateData: TemplateData,
  form: UseFormReturn<ProductCreateSchemaType>
) => {
  // 1. Apply options and generate variants
  if (templateData.options && templateData.options.length > 0) {
    // Check if we have real options (not just default)
    const isDefaultOnly =
      templateData.options.length === 1 &&
      templateData.options[0].title === "Default option" &&
      templateData.options[0].values.length === 1 &&
      templateData.options[0].values[0] === "Default option value"

    const hasMultipleOptions = !isDefaultOnly

    form.setValue("enable_variants", hasMultipleOptions, { shouldDirty: true })
    form.setValue("options", templateData.options, { shouldDirty: true })

    // Generate variant permutations from options
    const permutations = getPermutations(templateData.options)
    const productTitle = form.getValues("title") || ""

    if (permutations.length > 0) {
      const variants = permutations.map((perm, index) => {
        // Determine prices for this variant based on per-value prices from options
        let prices: Record<string, string> = { default: "" }

        // Check if any option has per-value prices for this permutation
        if (templateData.options) {
          for (const opt of templateData.options) {
            if (opt.value_prices) {
              const optionValue = perm[opt.title]
              if (optionValue && opt.value_prices[optionValue]) {
                // Use per-value prices from the option
                prices = Object.entries(opt.value_prices[optionValue]).reduce(
                  (acc, [currency, amount]) => {
                    acc[currency] = String(amount)
                    return acc
                  },
                  {} as Record<string, string>
                )
                break // Use the first option that has prices
              }
            }
          }
        }

        // Fallback to global default_prices if no per-value prices found
        if (prices.default === "" && templateData.default_prices) {
          prices = Object.entries(templateData.default_prices).reduce(
            (acc, [currency, amount]) => {
              acc[currency] = String(amount)
              return acc
            },
            {} as Record<string, string>
          )
        }

        return {
          title: getVariantName(perm, productTitle),
          options: perm,
          should_create: true,
          is_default: !hasMultipleOptions && index === 0,
          variant_rank: index,
          prices,
          manage_inventory: false,
          allow_backorder: false,
          inventory_kit: false,
          stock_quantity: "" as any,
          sku: "",
          inventory: [{ inventory_item_id: "", required_quantity: "" as any }],
        }
      })

      form.setValue(
        "variants",
        decorateVariantsWithDefaultValues(variants as any),
        { shouldDirty: true }
      )
    }
  }

  // 2. Apply GPSR data
  if (templateData.gpsr) {
    const gpsr = templateData.gpsr
    if (gpsr.producer_name) {
      form.setValue("metadata.gpsr_producer_name", gpsr.producer_name, { shouldDirty: true })
    }
    if (gpsr.producer_address) {
      form.setValue("metadata.gpsr_producer_address", gpsr.producer_address, { shouldDirty: true })
    }
    if (gpsr.producer_contact) {
      form.setValue("metadata.gpsr_producer_contact", gpsr.producer_contact, { shouldDirty: true })
    }
    if (gpsr.importer_name) {
      form.setValue("metadata.gpsr_importer_name", gpsr.importer_name, { shouldDirty: true })
    }
    if (gpsr.importer_address) {
      form.setValue("metadata.gpsr_importer_address", gpsr.importer_address, { shouldDirty: true })
    }
    if (gpsr.importer_contact) {
      form.setValue("metadata.gpsr_importer_contact", gpsr.importer_contact, { shouldDirty: true })
    }
    if (gpsr.instructions) {
      form.setValue("metadata.gpsr_instructions", gpsr.instructions, { shouldDirty: true })
    }
    if (gpsr.certificates) {
      form.setValue("metadata.gpsr_certificates", gpsr.certificates, { shouldDirty: true })
    }
  }

  // 3. Apply shipping profile
  if (templateData.shipping_profile_id) {
    form.setValue("shipping_profile_id", templateData.shipping_profile_id, { shouldDirty: true })
  }

  // 4. Apply categories
  if (templateData.categories && templateData.categories.length > 0) {
    form.setValue("categories", templateData.categories, { shouldDirty: true })
  }

  // 5. Apply dimensions
  if (templateData.dimensions) {
    if (templateData.dimensions.weight !== undefined) {
      form.setValue("weight", String(templateData.dimensions.weight), { shouldDirty: true })
    }
    if (templateData.dimensions.length !== undefined) {
      form.setValue("length", String(templateData.dimensions.length), { shouldDirty: true })
    }
    if (templateData.dimensions.width !== undefined) {
      form.setValue("width", String(templateData.dimensions.width), { shouldDirty: true })
    }
    if (templateData.dimensions.height !== undefined) {
      form.setValue("height", String(templateData.dimensions.height), { shouldDirty: true })
    }
  }

  // 6. Apply description template
  if (templateData.description_template) {
    form.setValue("description", templateData.description_template, { shouldDirty: true })
  }

  // 7. Apply material
  if (templateData.material) {
    form.setValue("material", templateData.material, { shouldDirty: true })
  }

  // 8. Apply origin country
  if (templateData.origin_country) {
    form.setValue("origin_country", templateData.origin_country, { shouldDirty: true })
  }
}

/**
 * Extract template data from the current form values.
 * Used when saving a template from the product creation form.
 */
export const extractTemplateFromForm = (
  form: UseFormReturn<ProductCreateSchemaType>
): TemplateData => {
  const values = form.getValues()
  const templateData: TemplateData = {}

  // Extract options (skip if only default option)
  if (values.options && values.options.length > 0) {
    const isDefaultOnly =
      values.options.length === 1 &&
      values.options[0].title === "Default option" &&
      values.options[0].values.length === 1 &&
      values.options[0].values[0] === "Default option value"

    if (!isDefaultOnly) {
      // Build per-value price map from variants
      // For each option, map each value to the price of a variant that uses that value
      const variantPricesByOptionValue: Record<string, Record<string, Record<string, number>>> = {}

      values.options.forEach((opt) => {
        const valuePrices: Record<string, Record<string, number>> = {}

        opt.values.forEach((val) => {
          // Find a variant that has this option value
          const matchingVariant = values.variants.find(
            (v) => v.should_create && v.options[opt.title] === val
          )
          if (matchingVariant?.prices) {
            const prices: Record<string, number> = {}
            for (const [currency, amount] of Object.entries(matchingVariant.prices)) {
              if (amount !== undefined && amount !== "" && amount !== null) {
                const numVal = typeof amount === "string" ? parseFloat(amount) : amount
                if (!isNaN(numVal) && numVal > 0) {
                  prices[currency] = numVal
                }
              }
            }
            if (Object.keys(prices).length > 0) {
              valuePrices[val] = prices
            }
          }
        })

        variantPricesByOptionValue[opt.title] = valuePrices
      })

      templateData.options = values.options.map((opt) => {
        const result: { title: string; values: string[]; value_prices?: Record<string, Record<string, number>> } = {
          title: opt.title,
          values: [...opt.values],
        }
        const vp = variantPricesByOptionValue[opt.title]
        if (vp && Object.keys(vp).length > 0) {
          result.value_prices = vp
        }
        return result
      })
    }
  }

  // Extract GPSR
  if (values.metadata) {
    const gpsr: TemplateData["gpsr"] = {}
    if (values.metadata.gpsr_producer_name) gpsr.producer_name = values.metadata.gpsr_producer_name
    if (values.metadata.gpsr_producer_address) gpsr.producer_address = values.metadata.gpsr_producer_address
    if (values.metadata.gpsr_producer_contact) gpsr.producer_contact = values.metadata.gpsr_producer_contact
    if (values.metadata.gpsr_importer_name) gpsr.importer_name = values.metadata.gpsr_importer_name
    if (values.metadata.gpsr_importer_address) gpsr.importer_address = values.metadata.gpsr_importer_address
    if (values.metadata.gpsr_importer_contact) gpsr.importer_contact = values.metadata.gpsr_importer_contact
    if (values.metadata.gpsr_instructions) gpsr.instructions = values.metadata.gpsr_instructions
    if (values.metadata.gpsr_certificates) gpsr.certificates = values.metadata.gpsr_certificates

    if (Object.keys(gpsr).length > 0) {
      templateData.gpsr = gpsr
    }
  }

  // Extract shipping profile
  if (values.shipping_profile_id) {
    templateData.shipping_profile_id = values.shipping_profile_id
  }

  // Extract categories
  if (values.categories && values.categories.length > 0) {
    templateData.categories = [...values.categories]
  }

  // Extract default prices from first variant
  if (values.variants && values.variants.length > 0) {
    const firstVariant = values.variants.find((v) => v.should_create)
    if (firstVariant?.prices) {
      const prices: Record<string, number> = {}
      for (const [key, value] of Object.entries(firstVariant.prices)) {
        if (value !== undefined && value !== "" && value !== null) {
          const numValue = typeof value === "string" ? parseFloat(value) : value
          if (!isNaN(numValue) && numValue > 0) {
            prices[key] = numValue
          }
        }
      }
      if (Object.keys(prices).length > 0) {
        templateData.default_prices = prices
      }
    }
  }

  // Extract dimensions
  const dimensions: TemplateData["dimensions"] = {}
  if (values.weight) dimensions.weight = parseFloat(values.weight)
  if (values.length) dimensions.length = parseFloat(values.length)
  if (values.width) dimensions.width = parseFloat(values.width)
  if (values.height) dimensions.height = parseFloat(values.height)
  if (Object.keys(dimensions).length > 0) {
    templateData.dimensions = dimensions
  }

  // Extract description
  if (values.description) {
    templateData.description_template = values.description
  }

  // Extract material
  if (values.material) {
    templateData.material = values.material
  }

  // Extract origin country
  if (values.origin_country) {
    templateData.origin_country = values.origin_country
  }

  return templateData
}
