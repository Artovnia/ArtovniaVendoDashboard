import { Button, Heading, Text } from "@medusajs/ui"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { RouteFocusModal } from "../../../components/modals"
import { CreatePromotionForm } from "./components/create-promotion-form/create-promotion-form"
import { CreateSimplePromotionForm } from "./components/create-simple-promotion-form/create-simple-promotion-form"

type PromotionCreateMode = "simple" | "advanced" | null

export const PromotionCreate = () => {
  const { t } = useTranslation()
  const [mode, setMode] = useState<PromotionCreateMode>(null)

  return (
    <RouteFocusModal>
      {mode === "advanced" ? (
        <CreatePromotionForm />
      ) : mode === "simple" ? (
        <CreateSimplePromotionForm />
      ) : (
        <>
          <RouteFocusModal.Header >
            <RouteFocusModal.Title>
              {t("promotions.create.title", { defaultValue: "Utwórz promocję" })}
            </RouteFocusModal.Title>
            <RouteFocusModal.Description>
              {t("promotions.create.modeSelectDescriptionShort", {
                defaultValue:
                  "Wybierz tryb formularza dla wybranego typu promocji.",
              })}
            </RouteFocusModal.Description>
          </RouteFocusModal.Header>

          <RouteFocusModal.Body className="flex size-full flex-col items-center justify-center overflow-auto py-16">
            <div className="flex w-full max-w-[720px] flex-col gap-y-4">
              <Heading level="h2">
                {t("promotions.create.modeSelectDescription", {
                  defaultValue:
                    "Wybierz tryb formularza. Uproszczony pomaga utworzyć promocję szybciej, a zaawansowany daje pełną konfigurację.",
                })}
              </Heading>

              <button
                type="button"
                className="rounded-lg border border-ui-border-base bg-ui-bg-base p-5 text-left hover:bg-ui-bg-subtle"
                onClick={() => setMode("simple")}
              >
                <Heading level="h2">{t("promotions.create.modeSimple", { defaultValue: "Formularz uproszczony" })}</Heading>
                <Text size="small" className="mt-2 text-ui-fg-subtle">
                  {t("promotions.create.modeSimpleHint", {
                    defaultValue:
                      "Szybkie tworzenie promocji: automatyczna aplikacja, brak kampanii i minimalna liczba pól.",
                  })}
                </Text>
              </button>

              <button
                type="button"
                className="rounded-lg border border-ui-border-base bg-ui-bg-base p-5 text-left hover:bg-ui-bg-subtle"
                onClick={() => setMode("advanced")}
              >
                <Heading level="h2">{t("promotions.create.modeAdvanced", { defaultValue: "Formularz zaawansowany" })}</Heading>
                <Text size="small" className="mt-2 text-ui-fg-subtle">
                  {t("promotions.create.modeAdvancedHint", {
                    defaultValue:
                      "Pełna konfiguracja wszystkich typów promocji, warunków i kampanii.",
                  })}
                </Text>
              </button>
            </div>
          </RouteFocusModal.Body>

          <RouteFocusModal.Footer>
            <div className="flex items-center justify-end gap-x-2">
              <RouteFocusModal.Close asChild>
                <Button variant="secondary" size="small">
                  {t("actions.cancel")}
                </Button>
              </RouteFocusModal.Close>
            </div>
          </RouteFocusModal.Footer>
        </>
      )}
    </RouteFocusModal>
  )
}
