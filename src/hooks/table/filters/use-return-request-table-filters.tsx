import { useTranslation } from "react-i18next"

export const useReturnRequestTableFilters = () => {
  const { t } = useTranslation()

  return [
    {
      key: "status",
      label: t("fields.status"),
      type: "select" as const,
      multiple: true,
      options: [
        {
          label: t("requests.returns.status.pending"),
          value: "pending",
        },
        {
          label: t("requests.returns.status.approved"),
          value: "approved",
        },
        {
          label: t("requests.returns.status.refunded"),
          value: "refunded",
        },
        {
          label: t("requests.returns.status.escalated"),
          value: "escalated",
        },
        {
          label: t("requests.returns.status.withdrawn"),
          value: "withdrawn",
        },
      ],
    },
  ]
}
