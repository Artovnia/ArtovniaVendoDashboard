import { Input } from "@medusajs/ui"
import { UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { Form } from "../../../../../../../components/common/form"
import { HandleInput } from "../../../../../../../components/inputs/handle-input"
import { RichTextEditor } from "../../../../../../../components/rich-text-editor"
import { ProductCreateSchemaType } from "../../../../types"

type ProductCreateGeneralSectionProps = {
  form: UseFormReturn<ProductCreateSchemaType>
}

const DESCRIPTION_EMAIL_REGEX = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi
const DESCRIPTION_URL_REGEX = /\b(?:https?:\/\/|www\.)[^\s<]+|\b[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+\b(?:\/[^\s<]*)?/gi
const DESCRIPTION_LINK_TAG_REGEX = /<a\s+[^>]*href\s*=\s*["'][^"']+["'][^>]*>(.*?)<\/a>/gi

const stripBlockedDescriptionContent = (value: string) => {
  const withoutAnchorTags = value.replace(DESCRIPTION_LINK_TAG_REGEX, '$1')

  return withoutAnchorTags
    .replace(DESCRIPTION_EMAIL_REGEX, '')
    .replace(DESCRIPTION_URL_REGEX, '')
}

export const ProductCreateGeneralSection = ({
  form,
}: ProductCreateGeneralSectionProps) => {
  const { t } = useTranslation()
  const blockedContentMessage = 'Description cannot contain email addresses or website links.'

  return (
    <div id="general" className="flex flex-col gap-y-6">
      <div className="flex flex-col gap-y-2">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Form.Field
            control={form.control}
            name="title"
            render={({ field }) => {
              return (
                <Form.Item>
                  <Form.Label>{t("products.fields.title.label")}</Form.Label>
                  <Form.Control>
                    <Input 
                      {...field} 
                      placeholder="Kurtka zimowa"
                      onChange={(e) => {
                        const value = e.target.value
                        // Auto-capitalize first letter
                        const capitalized = value.charAt(0).toUpperCase() + value.slice(1)
                        field.onChange(capitalized)
                      }}
                    />
                  </Form.Control>
                </Form.Item>
              )
            }}
          />
          <Form.Field
            control={form.control}
            name="subtitle"
            render={({ field }) => {
              return (
                <Form.Item>
                  <Form.Label optional>
                    {t("products.fields.subtitle.label")}
                  </Form.Label>
                  <Form.Control>
                    <Input {...field} placeholder="Ciepła i wygodna" />
                  </Form.Control>
                </Form.Item>
              )
            }}
          />
          <Form.Field
            control={form.control}
            name="handle"
            render={({ field }) => {
              return (
                <Form.Item>
                  <Form.Label
                    tooltip={t("products.fields.handle.tooltip")}
                    optional
                  >
                    {t("fields.handle")}
                  </Form.Label>
                  <Form.Control>
                    <HandleInput {...field} placeholder="kurtka-zimowa" />
                  </Form.Control>
                </Form.Item>
              )
            }}
          />
        </div>
      </div>
      <Form.Field
        control={form.control}
        name="description"
        render={({ field, fieldState }) => {
          const transformDescriptionValue = (nextValue: string) => {
            const sanitizedValue = stripBlockedDescriptionContent(nextValue)
            const hadBlockedContent = sanitizedValue !== nextValue

            if (hadBlockedContent) {
              form.setError('description', {
                type: 'manual',
                message: blockedContentMessage,
              })
            } else if (form.formState.errors.description?.type === 'manual') {
              form.clearErrors('description')
            }

            return sanitizedValue
          }

          return (
            <Form.Item>
              <RichTextEditor
                value={field.value || ''}
                onChange={field.onChange}
                transformValue={transformDescriptionValue}
                label={t("products.fields.description.label")}
                placeholder="Ciepła i wygodna kurtka zimowa z wysokiej jakości materiałów..."
                optional
                error={fieldState.error?.message || (form.formState.errors.description?.message as string | undefined)}
              />
            </Form.Item>
          )
        }}
      />
    </div>
  )
}
