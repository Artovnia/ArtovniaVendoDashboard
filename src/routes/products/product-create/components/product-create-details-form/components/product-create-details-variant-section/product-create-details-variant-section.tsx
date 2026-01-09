import { XMarkMini } from "@medusajs/icons"
import {
  Alert,
  Button,
  Checkbox,
  Heading,
  Hint,
  IconButton,
  InlineTip,
  Input,
  Label,
  Text,
  clx,
} from "@medusajs/ui"
import {
  Controller,
  FieldArrayWithId,
  UseFormReturn,
  useFieldArray,
  useWatch,
} from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useEffect } from "react"

import { Form } from "../../../../../../../components/common/form"
import { SortableList } from "../../../../../../../components/common/sortable-list"
import { SwitchBox } from "../../../../../../../components/common/switch-box"
import { ChipInput } from "../../../../../../../components/inputs/chip-input"
import { ProductCreateSchemaType } from "../../../../types"
import { decorateVariantsWithDefaultValues } from "../../../../utils"

type ProductCreateVariantsSectionProps = {
  form: UseFormReturn<ProductCreateSchemaType>
}

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

const getVariantName = (options: Record<string, string>, productTitle?: string) => {
  const optionValues = Object.values(options).join(" / ")
  
  // If product title is provided and variant has meaningful options (not default)
  if (productTitle && optionValues && optionValues !== "Default option value") {
    return `${productTitle} - ${optionValues}`
  }
  
  // For default variant or when no product title, return just option values or product title
  return optionValues || productTitle || "Default variant"
}

export const ProductCreateVariantsSection = ({
  form,
}: ProductCreateVariantsSectionProps) => {
  const { t } = useTranslation()

  const options = useFieldArray({
    control: form.control,
    name: "options",
  })

  const variants = useFieldArray({
    control: form.control,
    name: "variants",
  })

  const watchedAreVariantsEnabled = useWatch({
    control: form.control,
    name: "enable_variants",
    defaultValue: false,
  })

  const watchedOptions = useWatch({
    control: form.control,
    name: "options",
    defaultValue: [],
  })

  const watchedVariants = useWatch({
    control: form.control,
    name: "variants",
    defaultValue: [],
  })

  // Watch product title for syncing with default variant
  const productTitle = useWatch({
    control: form.control,
    name: "title",
    defaultValue: "",
  })

  // Update default variant title when product title changes (only if variants are NOT enabled)
  // Using useEffect with useWatch for reliable, consistent updates
  useEffect(() => {
    // Only sync if:
    // 1. Variants are NOT enabled (single default variant mode)
    // 2. Product title has a value
    if (!watchedAreVariantsEnabled && productTitle) {
      // Get fresh variant data directly from form to avoid stale closure issues
      const currentVariants = form.getValues("variants");
      
      // Check if we have exactly one default variant
      if (currentVariants && currentVariants.length === 1 && currentVariants[0]?.is_default) {
        const currentVariantTitle = currentVariants[0].title || "";
        
        // Only sync if variant title is empty, default, or starts with the product title
        // This prevents overwriting user's manual edits while allowing real-time sync
        const isDefaultOrEmpty = !currentVariantTitle || currentVariantTitle === "Default variant";
        const startsWithProductTitle = currentVariantTitle.startsWith(productTitle.substring(0, Math.max(1, productTitle.length - 1)));
        
        if (isDefaultOrEmpty || startsWithProductTitle || currentVariantTitle === productTitle) {
          form.setValue("variants.0.title", productTitle, { 
            shouldDirty: false, 
            shouldValidate: false,
            shouldTouch: false 
          });
        }
      }
    }
  }, [productTitle, watchedAreVariantsEnabled, form])

  const showInvalidOptionsMessage = !!form.formState.errors.options?.length
  const showInvalidVariantsMessage =
    form.formState.errors.variants?.root?.message === "invalid_length"

  const handleOptionValueUpdate = (index: number, value: string[]) => {
    const { isTouched: hasUserSelectedVariants } =
      form.getFieldState("variants")

    const newOptions = [...watchedOptions]
    newOptions[index].values = value

    const permutations = getPermutations(newOptions)
    const oldVariants = [...watchedVariants]

    // CRITICAL FIX: Create mapping of old option titles to new option titles
    // This handles cases where user changes option title after creating variants
    const optionTitleMapping = new Map<string, string>()
    watchedOptions.forEach((oldOption, idx) => {
      const newOption = newOptions[idx]
      if (oldOption.title !== newOption.title) {
        optionTitleMapping.set(oldOption.title, newOption.title)
      }
    })

    const findMatchingPermutation = (options: Record<string, string>) => {
      // Update option keys to match current option titles
      const updatedOptions: Record<string, string> = {}
      Object.entries(options).forEach(([key, value]) => {
        const newKey = optionTitleMapping.get(key) || key
        updatedOptions[newKey] = value
      })
      
      return permutations.find((permutation) =>
        Object.keys(updatedOptions).every((key) => updatedOptions[key] === permutation[key])
      )
    }

    // Get product title for variant naming
    const productTitle = form.getValues("title") || ""

    const newVariants = oldVariants.reduce((variants, variant) => {
      const match = findMatchingPermutation(variant.options)

      if (match) {
        variants.push({
          ...variant,
          title: getVariantName(match, productTitle),
          options: match,
        })
      }

      return variants
    }, [] as typeof oldVariants)

    const usedPermutations = new Set(
      newVariants.map((variant) => variant.options)
    )
    const unusedPermutations = permutations.filter(
      (permutation) => !usedPermutations.has(permutation)
    )

    unusedPermutations.forEach((permutation) => {
      newVariants.push({
        title: getVariantName(permutation, productTitle),
        options: permutation,
        should_create: hasUserSelectedVariants ? false : true,
        variant_rank: newVariants.length,
        // NOTE - prepare inventory array here for now so we prevent rendering issue if we append the items later
        inventory: [{ inventory_item_id: "", required_quantity: "" }],
      })
    })

    form.setValue("variants", newVariants)
  }

  const handleRemoveOption = (index: number) => {
    if (index === 0) {
      return
    }

    options.remove(index)

    const newOptions = [...watchedOptions]
    newOptions.splice(index, 1)

    const permutations = getPermutations(newOptions)
    const oldVariants = [...watchedVariants]

    const findMatchingPermutation = (options: Record<string, string>) => {
      return permutations.find((permutation) =>
        Object.keys(options).every((key) => options[key] === permutation[key])
      )
    }

    // Get product title for variant naming
    const productTitle = form.getValues("title") || ""

    const newVariants = oldVariants.reduce((variants, variant) => {
      const match = findMatchingPermutation(variant.options)

      if (match) {
        variants.push({
          ...variant,
          title: getVariantName(match, productTitle),
          options: match,
        })
      }

      return variants
    }, [] as typeof oldVariants)

    const usedPermutations = new Set(
      newVariants.map((variant) => variant.options)
    )
    const unusedPermutations = permutations.filter(
      (permutation) => !usedPermutations.has(permutation)
    )

    unusedPermutations.forEach((permutation) => {
      newVariants.push({
        title: getVariantName(permutation, productTitle),
        options: permutation,
        should_create: false,
        variant_rank: newVariants.length,
      })
    })

    form.setValue("variants", newVariants)
  }

  const handleRankChange = (
    items: FieldArrayWithId<ProductCreateSchemaType, "variants">[]
  ) => {
    // Items in the SortableList are memorised, so we need to find the current
    // value to preserve any changes that have been made to `should_create`.
    const update = items.map((item, index) => {
      const variant = watchedVariants.find((v) => v.title === item.title)

      return {
        id: item.id,
        ...(variant || item),
        variant_rank: index,
      }
    })

    variants.replace(update)
  }

  const getCheckboxState = (variants: ProductCreateSchemaType["variants"]) => {
    if (variants.every((variant) => variant.should_create)) {
      return true
    }

    if (variants.some((variant) => variant.should_create)) {
      return "indeterminate"
    }

    return false
  }

  const onCheckboxChange = (value: boolean | "indeterminate") => {
    switch (value) {
      case true: {
        const update = watchedVariants.map((variant) => {
          return {
            ...variant,
            should_create: true,
          }
        })

        form.setValue("variants", update)
        break
      }
      case false: {
        const update = watchedVariants.map((variant) => {
          return {
            ...variant,
            should_create: false,
          }
        })

        form.setValue("variants", decorateVariantsWithDefaultValues(update))
        break
      }
      case "indeterminate":
        break
    }
  }

  const createDefaultOptionAndVariant = () => {
    // Get the product title from the form to use as variant name
    const productTitle = form.getValues("title") || ""
    const defaultOptions = {
      "Default option": "Default option value",
    }
    
    form.setValue("options", [
      {
        title: "Default option",
        values: ["Default option value"],
      },
    ])
    form.setValue(
      "variants",
      decorateVariantsWithDefaultValues([
        {
          title: getVariantName(defaultOptions, productTitle), // Use consistent naming function
          should_create: true,
          variant_rank: 0,
          options: defaultOptions,
          inventory: [{ inventory_item_id: "", required_quantity: "" }],
          is_default: true,
        },
      ])
    )
  }

  return (
    <div id="variants" className="flex flex-col gap-y-8">
      <div className="flex flex-col gap-y-6">
        <Heading level="h2">{t("products.create.variants.header")}</Heading>
        <SwitchBox
          control={form.control}
          name="enable_variants"
          label={t("products.create.variants.subHeadingTitle")}
          description={t("products.create.variants.subHeadingDescription")}
          onCheckedChange={(checked) => {
            if (checked) {
              form.setValue("options", [
                {
                  title: "",
                  values: [],
                },
              ])
              form.setValue("variants", [])
            } else {
              createDefaultOptionAndVariant()
            }
          }}
        />
      </div>
      {watchedAreVariantsEnabled && (
        <>
          <div className="flex flex-col gap-y-6">
            <Form.Field
              control={form.control}
              name="options"
              render={() => {
                return (
                  <Form.Item>
                    <div className="flex flex-col gap-y-6">
                      <div className="flex items-start justify-between gap-x-4">
                        <div className="flex flex-col">
                          <Form.Label>
                            {t("products.create.variants.productOptions.label")}
                          </Form.Label>
                          <Form.Hint>
                            {t("products.create.variants.productOptions.hint")}
                          </Form.Hint>
                        </div>
                        <Button
                          size="small"
                          variant="secondary"
                          type="button"
                          onClick={() => {
                            options.append({
                              title: "",
                              values: [],
                            })
                          }}
                        >
                          {t("actions.add")}
                        </Button>
                      </div>
                      {showInvalidOptionsMessage && (
                        <Alert dismissible variant="error">
                          {t("products.create.errors.options")}
                        </Alert>
                      )}
                      <ul className="flex flex-col gap-y-4">
                        {options.fields.map((option, index) => {
                          return (
                            <li
                              key={option.id}
                              className="bg-ui-bg-component shadow-elevation-card-rest grid grid-cols-[1fr_28px] items-center gap-1.5 rounded-xl p-1.5"
                            >
                              <div className="grid grid-cols-[min-content,1fr] items-center gap-1.5">
                                <div className="flex items-center px-2 py-1.5">
                                  <Label
                                    size="xsmall"
                                    weight="plus"
                                    className="text-ui-fg-subtle"
                                    htmlFor={`options.${index}.title`}
                                  >
                                    {t("fields.title")}
                                  </Label>
                                </div>
                                <Input
                                  className="bg-ui-bg-field-component hover:bg-ui-bg-field-component-hover"
                                  {...form.register(
                                    `options.${index}.title` as const
                                  )}
                                  placeholder={t(
                                    "products.fields.options.optionTitlePlaceholder"
                                  )}
                                />
                                <div className="flex items-center px-2 py-1.5">
                                  <Label
                                    size="xsmall"
                                    weight="plus"
                                    className="text-ui-fg-subtle"
                                    htmlFor={`options.${index}.values`}
                                  >
                                    {t("fields.values")}
                                  </Label>
                                </div>
                                <Controller
                                  control={form.control}
                                  name={`options.${index}.values` as const}
                                  render={({
                                    field: { onChange, ...field },
                                  }) => {
                                    const handleValueChange = (
                                      value: string[]
                                    ) => {
                                      handleOptionValueUpdate(index, value)
                                      onChange(value)
                                    }

                                    return (
                                      <ChipInput
                                        {...field}
                                        variant="contrast"
                                        onChange={handleValueChange}
                                        placeholder={t(
                                          "products.fields.options.variantionsPlaceholder"
                                        )}
                                      />
                                    )
                                  }}
                                />
                              </div>
                              <IconButton
                                type="button"
                                size="small"
                                variant="transparent"
                                className="text-ui-fg-muted"
                                disabled={index === 0}
                                onClick={() => handleRemoveOption(index)}
                              >
                                <XMarkMini />
                              </IconButton>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  </Form.Item>
                )
              }}
            />
          </div>
          <div className="grid grid-cols-1 gap-x-4 gap-y-8">
            <div className="flex flex-col gap-y-6">
              <div className="flex flex-col">
                <Label weight="plus">
                  {t("products.create.variants.productVariants.label")}
                </Label>
                <Hint>
                  {t("products.create.variants.productVariants.hint")}
                </Hint>
              </div>
              {!showInvalidOptionsMessage && showInvalidVariantsMessage && (
                <Alert dismissible variant="error">
                  {t("products.create.errors.variants")}
                </Alert>
              )}
              {variants.fields.length > 0 ? (
                <div className="overflow-hidden rounded-xl border">
                  <div
                    className="bg-ui-bg-component text-ui-fg-subtle grid items-center gap-3 border-b px-6 py-2.5"
                    style={{
                      gridTemplateColumns: `20px 28px repeat(${watchedOptions.length}, 1fr)`,
                    }}
                  >
                    <div>
                      <Checkbox
                        className="relative"
                        checked={getCheckboxState(watchedVariants)}
                        onCheckedChange={onCheckboxChange}
                      />
                    </div>
                    <div />
                    {watchedOptions.map((option, index) => (
                      <div key={index}>
                        <Text size="small" leading="compact" weight="plus">
                          {option.title}
                        </Text>
                      </div>
                    ))}
                  </div>
                  <SortableList
                    items={variants.fields}
                    onChange={handleRankChange}
                    renderItem={(item, index) => {
                      return (
                        <SortableList.Item
                          id={item.id}
                          className={clx("bg-ui-bg-base border-b", {
                            "border-b-0": index === variants.fields.length - 1,
                          })}
                        >
                          <div
                            className="text-ui-fg-subtle grid w-full items-center gap-3 px-6 py-2.5"
                            style={{
                              gridTemplateColumns: `20px 28px repeat(${watchedOptions.length}, 1fr)`,
                            }}
                          >
                            <Form.Field
                              control={form.control}
                              name={`variants.${index}.should_create` as const}
                              render={({
                                field: { value, onChange, ...field },
                              }) => {
                                return (
                                  <Form.Item>
                                    <Form.Control>
                                      <Checkbox
                                        className="relative"
                                        {...field}
                                        checked={value}
                                        onCheckedChange={onChange}
                                      />
                                    </Form.Control>
                                  </Form.Item>
                                )
                              }}
                            />
                            <SortableList.DragHandle />
                            {Object.values(item.options).map((value, index) => (
                              <Text key={index} size="small" leading="compact">
                                {value}
                              </Text>
                            ))}
                          </div>
                        </SortableList.Item>
                      )
                    }}
                  />
                </div>
              ) : (
                <Alert>
                  {t("products.create.variants.productVariants.alert")}
                </Alert>
              )}
              {variants.fields.length > 0 && (
                <InlineTip label={t("general.tip")}>
                  {t("products.create.variants.productVariants.tip")}
                </InlineTip>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
