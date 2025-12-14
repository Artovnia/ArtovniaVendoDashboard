import { zodResolver } from "@hookform/resolvers/zod"
import { Button, Container, Heading, Input, Text, toast } from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import * as z from "zod"

import { Form } from "../../../components/common/form"
import { useChangePassword } from "../../../hooks/api/auth"

const createChangePasswordSchema = (t: any) => z
  .object({
    current_password: z.string().min(1, t("passwordChange.validation.currentPasswordRequired")),
    new_password: z.string().min(8, t("passwordChange.validation.newPasswordMinLength")),
    confirm_password: z.string().min(1, t("passwordChange.validation.confirmPasswordRequired")),
  })
  .superRefine(({ new_password, confirm_password }, ctx) => {
    if (new_password !== confirm_password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: t("passwordChange.validation.passwordMismatch"),
        path: ["confirm_password"],
      })
    }
  })

export const ChangePassword = () => {
  const { t } = useTranslation()
  
  const ChangePasswordSchema = createChangePasswordSchema(t)
  type ChangePasswordFormValues = z.infer<typeof ChangePasswordSchema>

  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(ChangePasswordSchema),
    defaultValues: {
      current_password: "",
      new_password: "",
      confirm_password: "",
    },
  })

  const { mutateAsync, isPending } = useChangePassword()

  const handleSubmit = form.handleSubmit(
    async ({ current_password, new_password }) => {
      try {
        await mutateAsync(
          {
            current_password,
            new_password,
          },
          {
            onSuccess: (data) => {
              toast.success(data.message || t("passwordChange.toast.success"))
              form.reset()
            },
            onError: (error) => {
              toast.error(error.message || t("passwordChange.toast.error"))
            },
          }
        )
      } catch (error) {
        // Error already handled in onError
      }
    }
  )

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">{t("passwordChange.title")}</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            {t("passwordChange.subtitle")}
          </Text>
        </div>
      </div>

      <div className="px-6 py-4">
        <Form {...form}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-y-4">
            {/* Hidden username field for accessibility */}
            <input
              type="text"
              name="username"
              autoComplete="username"
              style={{ display: 'none' }}
              tabIndex={-1}
              aria-hidden="true"
            />
            
            <Form.Field
              control={form.control}
              name="current_password"
              render={({ field }) => {
                return (
                  <Form.Item>
                    <Form.Label>{t("passwordChange.currentPassword")}</Form.Label>
                    <Form.Control>
                      <Input
                        type="password"
                        autoComplete="current-password"
                        {...field}
                        placeholder={t("passwordChange.currentPasswordPlaceholder")}
                      />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )
              }}
            />

            <Form.Field
              control={form.control}
              name="new_password"
              render={({ field }) => {
                return (
                  <Form.Item>
                    <Form.Label>{t("passwordChange.newPassword")}</Form.Label>
                    <Form.Control>
                      <Input
                        type="password"
                        autoComplete="new-password"
                        {...field}
                        placeholder={t("passwordChange.newPasswordPlaceholder")}
                      />
                    </Form.Control>
                    <Form.ErrorMessage />
                    <Form.Hint>
                      {t("passwordChange.passwordHint")}
                    </Form.Hint>
                  </Form.Item>
                )
              }}
            />

            <Form.Field
              control={form.control}
              name="confirm_password"
              render={({ field }) => {
                return (
                  <Form.Item>
                    <Form.Label>{t("passwordChange.confirmPassword")}</Form.Label>
                    <Form.Control>
                      <Input
                        type="password"
                        autoComplete="new-password"
                        {...field}
                        placeholder={t("passwordChange.confirmPasswordPlaceholder")}
                      />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )
              }}
            />

            <div className="flex items-center justify-end gap-x-2 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => form.reset()}
                disabled={isPending}
              >
                {t("passwordChange.cancel")}
              </Button>
              <Button type="submit" isLoading={isPending}>
                {t("passwordChange.submit")}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </Container>
  )
}
