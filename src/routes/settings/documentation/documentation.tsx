import { ArrowUpRightOnBox } from "@medusajs/icons"
import { Container, Heading, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

export const Documentation = () => {
  const { t } = useTranslation()

  const DOCS = [
    {
      titleKey: "docs.guideTitle",
      descriptionKey: "docs.titleGuide",
      url: "https://annawawrzyniak.my.canva.site/przewodnik-artovnia",
    },
    {
      titleKey: "docs.baselinkerTitle",
      descriptionKey: "docs.titleBaselinker",
      url: "https://annawawrzyniak.my.canva.site/integracja-baselinker",
    },
  ]

  return (
    <div className="flex flex-col gap-y-2">
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Heading>{t("docs.title")}</Heading>
          <Text className="text-ui-fg-subtle" size="small">
            {t("docs.subtitle")}
          </Text>
        </div>
      </Container>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {DOCS.map((doc) => (
          <a
            key={doc.url}
            href={doc.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group"
          >
            <Container className="flex h-full flex-col justify-between gap-y-4 p-6 transition-colors group-hover:bg-ui-bg-base-hover">
              <div>
                <div className="flex items-center gap-x-2">
                  <Text weight="plus" size="large">
             {t(doc.titleKey)}
                  </Text>
                  <ArrowUpRightOnBox className="text-ui-fg-muted" />
                </div>
              </div>
              <Text
                className="text-ui-fg-interactive group-hover:text-ui-fg-interactive-hover"
                size="small"
                weight="plus"
              >
                {t("docs.openGuide")}
              </Text>
            </Container>
          </a>
        ))}
      </div>
    </div>
  )
}

export const Component = Documentation
