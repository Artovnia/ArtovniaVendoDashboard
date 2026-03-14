import { HttpTypes } from "@medusajs/types"
import { i18n } from "../components/utilities/i18n"

export enum PromotionStatus {
  SCHEDULED = "SCHEDULED",
  EXPIRED = "EXPIRED",
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  DRAFT = "DRAFT",
}

export type StatusColors = "grey" | "orange" | "green" | "red" | "grey"
export type StatusMap = Record<string, [StatusColors, string]>
export const promotionStatusMap: StatusMap = {
  [PromotionStatus.ACTIVE]: ["green", i18n.t("statuses.active")],
  [PromotionStatus.INACTIVE]: ["red", i18n.t("statuses.inactive")],
  [PromotionStatus.DRAFT]: ["grey", i18n.t("statuses.draft")],
  [PromotionStatus.SCHEDULED]: [
    "orange",
    `${i18n.t("promotions.fields.campaign")} ${i18n.t("statuses.scheduled").toLowerCase()}`,
  ],
  [PromotionStatus.EXPIRED]: [
    "red",
    `${i18n.t("promotions.fields.campaign")} ${i18n.t("statuses.expired").toLowerCase()}`,
  ],
}

const resolvePromotionStatusKey = (status?: string | null) => {
  const normalizedStatus = status?.toUpperCase()

  if (normalizedStatus && promotionStatusMap[normalizedStatus]) {
    return normalizedStatus
  }

  return PromotionStatus.DRAFT
}

export const getPromotionStatus = (promotion: HttpTypes.AdminPromotion) => {
  const date = new Date()
  const campaign = promotion.campaign
  const statusKey = resolvePromotionStatusKey(promotion.status)

  if (!campaign) {
    return promotionStatusMap[statusKey]
  }

  if (campaign.starts_at && new Date(campaign.starts_at!) > date) {
    return promotionStatusMap[PromotionStatus.SCHEDULED]
  }

  const campaignBudget = campaign.budget
  const overBudget =
    campaignBudget && campaignBudget.used! > campaignBudget.limit!

  if ((campaign.ends_at && new Date(campaign.ends_at) < date) || overBudget) {
    return promotionStatusMap[PromotionStatus.EXPIRED]
  }

  return promotionStatusMap[statusKey]
}
