import { RuleAttributeOptionsResponse, StoreDTO } from "@medusajs/types"
import { Input, Select } from "@medusajs/ui"
import { useWatch } from "react-hook-form"
import { Form } from "../../../../../../components/common/form"
import { Combobox } from "../../../../../../components/inputs/combobox"
import { usePromotionRuleValues } from "../../../../../../hooks/api/promotions"
import { useStore } from "../../../../../../hooks/api/store"
import { CategoryRuleSelector } from "./category-rule-selector"

type RuleValueFormFieldType = {
  form: any
  identifier: string
  scope:
    | "application_method.buy_rules"
    | "rules"
    | "application_method.target_rules"
  name: string
  operator: string
  fieldRule: any
  attributes: RuleAttributeOptionsResponse[]
  ruleType: "rules" | "target-rules" | "buy-rules"
}

const buildFilters = (attribute?: string, store?: StoreDTO) => {
  if (!attribute || !store) {
    return {}
  }

  if (attribute === "currency_code") {
    return {
      value: store.supported_currencies?.map((c) => c.currency_code),
    }
  }

  return {}
}

export const RuleValueFormField = ({
  form,
  identifier,
  scope,
  name,
  operator,
  fieldRule,
  attributes,
  ruleType,
}: RuleValueFormFieldType) => {
  const attribute = attributes?.find(
    (attr) => (attr as any).value === fieldRule.attribute
  )

  const { store, isLoading: isStoreLoading } = useStore()
  const { values: options = [] } = usePromotionRuleValues(
    ruleType,
    (attribute as any)?.id!,
    buildFilters((attribute as any)?.id, store as any),
    {
      enabled:
        !!(attribute as any)?.id &&
        ["select", "multiselect"].includes((attribute as any)?.field_type) &&
        !isStoreLoading,
    }
  )

  const watchOperator = useWatch({
    control: form.control,
    name: operator,
  })

  return (
    <Form.Field
      key={`${identifier}.${scope}.${name}-${fieldRule.attribute}`}
      name={name}
      render={({ field: { onChange, ref, ...field } }) => {
        // Special handling for category attribute
        if (fieldRule.attribute === 'category') {
          return (
            <Form.Item className="basis-1/2">
              <Form.Control>
                <CategoryRuleSelector
                  value={Array.isArray(field.value) ? field.value : field.value ? [field.value] : []}
                  onChange={(values) => onChange(values)}
                  disabled={!fieldRule.attribute}
                />
              </Form.Control>
              <Form.ErrorMessage />
            </Form.Item>
          )
        }

        if ((attribute as any)?.field_type === "number") {
          return (
            <Form.Item className="basis-1/2">
              <Form.Control>
                <Input
                  {...field}
                  type="number"
                  onChange={onChange}
                  className="bg-ui-bg-base"
                  ref={ref}
                  min={1}
                  disabled={!fieldRule.attribute}
                />
              </Form.Control>
              <Form.ErrorMessage />
            </Form.Item>
          )
        } else if ((attribute as any)?.field_type === "text") {
          return (
            <Form.Item className="basis-1/2">
              <Form.Control>
                <Input
                  {...field}
                  ref={ref}
                  onChange={onChange}
                  className="bg-ui-bg-base"
                  disabled={!fieldRule.attribute}
                />
              </Form.Control>
              <Form.ErrorMessage />
            </Form.Item>
          )
        } else if (watchOperator === "eq") {
          return (
            <Form.Item className="basis-1/2">
              <Form.Control>
                <Select
                  {...field}
                  value={
                    Array.isArray(field.value) ? field.value[0] : field.value
                  }
                  onValueChange={onChange}
                  disabled={!fieldRule.attribute}
                >
                  <Select.Trigger ref={ref} className="bg-ui-bg-base">
                    <Select.Value placeholder="Select Value" />
                  </Select.Trigger>

                  <Select.Content>
                    {options?.map((option, i) => (
                      <Select.Item
                        key={`${identifier}-value-option-${i}`}
                        value={option.value}
                      >
                        <span className="text-ui-fg-subtle">
                          {option.label}
                        </span>
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select>
              </Form.Control>
              <Form.ErrorMessage />
            </Form.Item>
          )
        } else {
          return (
            <Form.Item className="basis-1/2">
              <Form.Control>
                <Combobox
                  {...field}
                  ref={ref}
                  placeholder="Select Values"
                  options={options}
                  onChange={onChange}
                  className="bg-ui-bg-base"
                  disabled={!fieldRule.attribute}
                />
              </Form.Control>

              <Form.ErrorMessage />
            </Form.Item>
          )
        }
      }}
    />
  )
}
