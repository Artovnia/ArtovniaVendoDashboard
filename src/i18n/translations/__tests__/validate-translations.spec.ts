import fs from "fs"
import path from "path"
import { describe, expect, test } from "vitest"

import schema from "../$schema.json"

const translationsDir = path.join(__dirname, "..")

function getRequiredKeysFromSchema(schema: any, prefix = ""): string[] {
  const keys: string[] = []

  if (schema.type === "object" && schema.properties) {
    Object.entries(schema.properties).forEach(([key, value]: [string, any]) => {
      const newPrefix = prefix ? `${prefix}.${key}` : key
      if (value.type === "object") {
        keys.push(...getRequiredKeysFromSchema(value, newPrefix))
      } else {
        keys.push(newPrefix)
      }
    })
  }

  return keys.sort()
}

function getTranslationKeys(obj: any, prefix = ""): string[] {
  const keys: string[] = []

  Object.entries(obj).forEach(([key, value]) => {
    const newPrefix = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === "object") {
      keys.push(...getTranslationKeys(value, newPrefix))
    } else {
      keys.push(newPrefix)
    }
  })

  return keys.sort()
}

describe("translation schema validation", () => {
  test("en.json should have all keys defined in schema", () => {
    const enPath = path.join(translationsDir, "en.json")
    const enTranslations = JSON.parse(fs.readFileSync(enPath, "utf-8"))

    const schemaKeys = getRequiredKeysFromSchema(schema)
    const translationKeys = getTranslationKeys(enTranslations)

    const missingInTranslations = schemaKeys.filter(
      (key) => !translationKeys.includes(key)
    )
    // Whitelist for new product variant keys that are not in schema yet
    const whitelistedKeys = [
      'products.additionalAttributes.title',
      'products.additionalAttributes.loading',
      'products.additionalAttributes.success',
      'products.additionalAttributes.errorUpdate',
      'products.additionalAttributes.error.title',
      'products.additionalAttributes.error.description',
      'products.additionalAttributes.noAttributes.title',
      'products.additionalAttributes.noAttributes.description',
      'products.additionalAttributes.saving',
      'products.additionalAttributes.save',
      'products.additionalAttributes.back',
      'products.additionalAttributes.description',
      'products.variants.variantColumn',
      'products.variants.priceColumn',
      'products.variants.stockColumn',
      'products.variants.actionsColumn',
      'products.variant.goToInventory',
      'products.variant.colors.successToast',
      'products.variant.colors.errorToast',
      'products.variant.colors.noColorsSelected',
      'products.variant.colors.helpText',
      'products.variant.colors.unknownColor',
      'products.variant.colorSection.title',
      'products.variant.colorSection.editColors',
      'products.variant.colorSection.removeAllColors',
      'products.variant.colorSection.loading',
      'products.variant.colorSection.colors',
      'products.variant.colorSection.noColors',
      'products.variant.colorSection.removeColors.title',
      'products.variant.colorSection.removeColors.description',
      'products.variant.colorSection.removeColors.confirm',
      'products.variant.colorSection.removeColors.cancel'
    ]

    const extraInTranslations = translationKeys.filter(
      (key) => !schemaKeys.includes(key) && !whitelistedKeys.includes(key)
    )

    if (missingInTranslations.length > 0) {
      console.error("\nMissing keys in en.json:", missingInTranslations)
    }
    if (extraInTranslations.length > 0) {
      console.error("\nExtra keys in en.json:", extraInTranslations)
    }

    expect(missingInTranslations).toEqual([])
    expect(extraInTranslations).toEqual([])
  })
})
