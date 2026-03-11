import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import {
  Badge,
  Button,
  Container,
  Heading,
  Input,
  Label,
  Select,
  Switch,
  Tabs,
  Text,
  toast,
} from "@medusajs/ui";

import {
  ChevronDownMini,
  CogSixTooth,
  ClockSolidMini,
  
  ShoppingCart,
} from "@medusajs/icons";

import { SingleColumnPage } from "../../components/layout/pages";
import { useDashboardExtension } from "../../extensions";
import {
  AbandonedCartDiscountType,
  AbandonedCartSettings,
  SendAbandonedCartDiscountPayload,
  VendorAbandonedCart,
  useAbandonedCarts,
  useAbandonedCartSettings,
  useSendAbandonedCartDiscount,
  useUpdateAbandonedCartSettings,
} from "../../hooks/api/abandoned-carts";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type DiscountDraft = {
  discount_type: AbandonedCartDiscountType;
  discount_value: number;
  currency_code: string;
};

type CartTab = "not_sent" | "sent";
type CartSort =
  | "updated_desc"
  | "updated_asc"
  | "created_desc"
  | "created_asc";

type DisplayedCart = VendorAbandonedCart & {
  discountDraft: DiscountDraft;
};

type AbandonedCartDiscountPreview = {
  cart_id: string;
  currency_code: string;
  discount_type: AbandonedCartDiscountType;
  discount_value: number;
  base_item_total: number;
  base_tax_total: number;
  base_total: number;
  preview_item_total: number;
  preview_tax_total: number;
  preview_total: number;
  estimated_discount_total: number;
  line_breakdown: Array<{
    line_item_id: string;
    product_title: string | null;
    quantity: number;
    original_total: number;
    discount_share: number;
    preview_total: number;
  }>;
  estimation_mode: "client_side_vendor_items";
};

/* ------------------------------------------------------------------ */
/*  Defaults                                                           */
/* ------------------------------------------------------------------ */

const defaultDraft = (
  currencyCode?: string | null
): DiscountDraft => ({
  discount_type: "percentage",
  discount_value: 10,
  currency_code: currencyCode || "pln",
});

const defaultSettings: AbandonedCartSettings = {
  abandoned_cart_discount_enabled: false,
  abandoned_cart_discount_mode: "manual",
  abandoned_cart_discount_type: null,
  abandoned_cart_discount_value: null,
  abandoned_cart_discount_currency_code: null,
  abandoned_cart_discount_delay_hours: 24,
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const formatAmount = (
  amount?: number | null,
  currencyCode?: string | null
) => {
  if (amount === null || amount === undefined) return "–";
  try {
    return new Intl.NumberFormat("pl-PL", {
      style: "currency",
      currency: (currencyCode || "pln").toUpperCase(),
    }).format(amount);
  } catch {
    return amount.toString();
  }
};

const relativeTime = (date: string) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

const round2 = (value: number) => Math.round(value * 100) / 100;

const getDisplayLineTotal = (item: VendorAbandonedCart["vendor_items"][number]) => {
  if (typeof item.subtotal === "number") {
    const subtotal = Number(item.subtotal);
    const discountTotal = Number(item.discount_total || 0);
    return round2(Math.max(0, subtotal - discountTotal));
  }

  if (typeof item.total === "number") {
    return Number(item.total);
  }

  return Number(item.unit_price || 0) * Number(item.quantity || 0);
};

const getDisplayUnitPrice = (item: VendorAbandonedCart["vendor_items"][number]) => {
  const qty = Number(item.quantity || 0);
  const lineTotal = getDisplayLineTotal(item);

  if (qty > 0) {
    return round2(lineTotal / qty);
  }

  return Number(item.unit_price || 0);
};

const simulateDiscountPreview = (
  cart: VendorAbandonedCart,
  payload: SendAbandonedCartDiscountPayload
): AbandonedCartDiscountPreview => {
  const currency =
    (payload.currency_code || cart.currency_code || "pln").toLowerCase();

  const lineBreakdownBase = cart.vendor_items.map((item) => {
    const original_total = getDisplayLineTotal(item);

    return {
      line_item_id: item.id,
      product_title:
        item.variant?.product?.title || item.title || null,
      quantity: Number(item.quantity || 0),
      original_total,
    };
  });

  const baseItemTotal = round2(
    lineBreakdownBase.reduce((sum, line) => sum + line.original_total, 0)
  );
  const baseTaxTotal = 0;

  const rawDiscount =
    payload.discount_type === "percentage"
      ? (baseItemTotal * payload.discount_value) / 100
      : payload.discount_value;
  const discountAmount = round2(Math.max(0, Math.min(baseItemTotal, rawDiscount)));
  const previewItemTotal = round2(Math.max(0, baseItemTotal - discountAmount));

  const previewTaxTotal = 0;
  const previewTotal = previewItemTotal;

  const line_breakdown = lineBreakdownBase.map((line) => {
    const discountShare =
      baseItemTotal > 0
        ? round2((line.original_total / baseItemTotal) * discountAmount)
        : 0;

    return {
      ...line,
      discount_share: discountShare,
      preview_total: round2(Math.max(0, line.original_total - discountShare)),
    };
  });

  return {
    cart_id: cart.id,
    currency_code: currency,
    discount_type: payload.discount_type,
    discount_value: payload.discount_value,
    base_item_total: baseItemTotal,
    base_tax_total: baseTaxTotal,
    base_total: round2(baseItemTotal + baseTaxTotal),
    preview_item_total: previewItemTotal,
    preview_tax_total: previewTaxTotal,
    preview_total: previewTotal,
    estimated_discount_total: discountAmount,
    line_breakdown,
    estimation_mode: "client_side_vendor_items",
  };
};

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function SettingsSection({
  settingsForm,
  setSettingsForm,
  isSettingsLoading,
  isSettingsError,
  settingsError,
  isPending,
  onSave,
  t,
}: {
  settingsForm: AbandonedCartSettings;
  setSettingsForm: Dispatch<SetStateAction<AbandonedCartSettings>>;
  isSettingsLoading: boolean;
  isSettingsError: boolean;
  settingsError: Error | null;
  isPending: boolean;
  onSave: () => void;
  t: TFunction;
}) {
  const disabled = isSettingsLoading || isPending;
  const isAutomatic =
    settingsForm.abandoned_cart_discount_mode === "automatic";
  const isEnabled = settingsForm.abandoned_cart_discount_enabled;
  const isFixed =
    settingsForm.abandoned_cart_discount_type === "fixed";

  if (isSettingsError) {
    return (
      <div className="rounded-lg border border-ui-tag-red-border bg-ui-tag-red-bg px-4 py-3">
        <Text className="text-ui-fg-error text-sm">
          {settingsError?.message ||
            t(
              "abandonedCart.settings.error",
              "Failed to load settings"
            )}
        </Text>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 rounded-lg border border-ui-border-base bg-ui-bg-subtle px-4 py-3">
        <div className="min-w-0">
          <Text weight="plus" className="text-sm">
            {t(
              "abandonedCart.settings.enabled",
              "Enable abandoned-cart discounts"
            )}
          </Text>
          <Text className="text-ui-fg-subtle mt-0.5 text-xs">
            {t(
              "abandonedCart.settings.enabledHelp",
              "Turn this on to manage manual or automatic discount behavior for abandoned carts."
            )}
          </Text>
        </div>
        <Switch
          checked={isEnabled}
          onCheckedChange={(v) =>
            setSettingsForm((p) => ({
              ...p,
              abandoned_cart_discount_enabled: Boolean(v),
            }))
          }
          disabled={disabled}
        />
      </div>

      {isEnabled && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="ac-mode" className="text-xs">
              {t("abandonedCart.settings.mode", "Mode")}
            </Label>
            <Select
              value={settingsForm.abandoned_cart_discount_mode}
              onValueChange={(v) =>
                setSettingsForm((p) => ({
                  ...p,
                  abandoned_cart_discount_mode: v as
                    | "manual"
                    | "automatic",
                  abandoned_cart_discount_type:
                    v === "automatic"
                      ? p.abandoned_cart_discount_type || "percentage"
                      : p.abandoned_cart_discount_type,
                }))
              }
              disabled={disabled}
            >
              <Select.Trigger id="ac-mode" className="w-full">
                <Select.Value />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="manual">
                  {t(
                    "abandonedCart.settings.manual",
                    "Manual per cart"
                  )}
                </Select.Item>
                <Select.Item value="automatic">
                  {t(
                    "abandonedCart.settings.automatic",
                    "Automatic rules"
                  )}
                </Select.Item>
              </Select.Content>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ac-delay" className="text-xs">
              {t(
                "abandonedCart.settings.delayHours",
                "Delay before recovery (hours)"
              )}
            </Label>
            <Input
              id="ac-delay"
              type="number"
              min={1}
              max={720}
              value={
                settingsForm.abandoned_cart_discount_delay_hours
              }
              onChange={(e) =>
                setSettingsForm((p) => ({
                  ...p,
                  abandoned_cart_discount_delay_hours: Number(
                    e.target.value || 24
                  ),
                }))
              }
              disabled={disabled}
            />
          </div>

          {isAutomatic && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="ac-type" className="text-xs">
                  {t(
                    "abandonedCart.settings.discountType",
                    "Discount type"
                  )}
                </Label>
                <Select
                  value={
                    settingsForm.abandoned_cart_discount_type ||
                    "percentage"
                  }
                  onValueChange={(v) =>
                    setSettingsForm((p) => ({
                      ...p,
                      abandoned_cart_discount_type:
                        v as AbandonedCartDiscountType,
                    }))
                  }
                  disabled={disabled}
                >
                  <Select.Trigger
                    id="ac-type"
                    className="w-full"
                  >
                    <Select.Value />
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value="percentage">
                      {t(
                        "abandonedCart.discount.percentage",
                        "Percentage"
                      )}
                    </Select.Item>
                    <Select.Item value="fixed">
                      {t(
                        "abandonedCart.discount.fixed",
                        "Fixed amount"
                      )}
                    </Select.Item>
                  </Select.Content>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ac-value" className="text-xs">
                  {t(
                    "abandonedCart.settings.discountValue",
                    "Discount value"
                  )}
                </Label>
                <Input
                  id="ac-value"
                  type="number"
                  min={0.01}
                  step={0.01}
                  value={
                    settingsForm.abandoned_cart_discount_value || ""
                  }
                  onChange={(e) =>
                    setSettingsForm((p) => ({
                      ...p,
                      abandoned_cart_discount_value: Number(
                        e.target.value || 0
                      ),
                    }))
                  }
                  disabled={disabled}
                />
              </div>

              {isFixed && (
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="ac-currency" className="text-xs">
                    {t(
                      "abandonedCart.settings.currencyCode",
                      "Currency code"
                    )}
                  </Label>
                  <Input
                    id="ac-currency"
                    value={
                      settingsForm.abandoned_cart_discount_currency_code ||
                      ""
                    }
                    onChange={(e) =>
                      setSettingsForm((p) => ({
                        ...p,
                        abandoned_cart_discount_currency_code:
                          e.target.value.trim().toLowerCase(),
                      }))
                    }
                    placeholder="pln"
                    disabled={disabled}
                  />
                </div>
              )}
            </>
          )}

          <div className="flex items-end sm:col-span-2">
            <Button
              size="small"
              onClick={onSave}
              isLoading={isPending}
            >
              {t("actions.save", "Save settings")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---- Cart card --------------------------------------------------- */

function CartCard({
  cart,
  onUpdateDraft,
  onRequestPreview,
  preview,
  isPreviewLoading,
  onSendDiscount,
  isSending,
  t,
}: {
  cart: DisplayedCart;
  onUpdateDraft: (
    cartId: string,
    patch: Partial<SendAbandonedCartDiscountPayload>
  ) => void;
  onRequestPreview: (
    cartId: string,
    payload: SendAbandonedCartDiscountPayload
  ) => void;
  preview?: AbandonedCartDiscountPreview;
  isPreviewLoading: boolean;
  onSendDiscount: (cart: VendorAbandonedCart) => void;
  isSending: boolean;
  t: TFunction;
}) {
  const [open, setOpen] = useState(false);
  const isSent = Boolean(cart.discount_sent);
  const isFixed = cart.discountDraft.discount_type === "fixed";
  const lastPreviewSignatureRef = useRef<string | null>(null);

  useEffect(() => {
    if (!open || isSent) {
      return;
    }

    const normalizedCurrency = isFixed
      ? cart.discountDraft.currency_code.toLowerCase()
      : "";
    const previewSignature = [
      cart.id,
      cart.discountDraft.discount_type,
      cart.discountDraft.discount_value,
      normalizedCurrency,
    ].join("|");

    if (lastPreviewSignatureRef.current === previewSignature) {
      return;
    }

    lastPreviewSignatureRef.current = previewSignature;

    const timeout = window.setTimeout(() => {
      onRequestPreview(cart.id, {
        discount_type: cart.discountDraft.discount_type,
        discount_value: cart.discountDraft.discount_value,
        currency_code: isFixed
          ? cart.discountDraft.currency_code.toLowerCase()
          : undefined,
      });
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [
    open,
    isSent,
    cart.id,
    cart.discountDraft.discount_type,
    cart.discountDraft.discount_value,
    cart.discountDraft.currency_code,
    isFixed,
    onRequestPreview,
  ]);

  return (
    <div className="rounded-lg border border-ui-border-base bg-ui-bg-base shadow-elevation-card-rest transition-shadow hover:shadow-elevation-card-hover">
      {/* header */}
      <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-0.5">
          <div className="flex items-center gap-2">
            <Text weight="plus" className="truncate text-sm">
              {cart.email || "—"}
            </Text>
            {isSent ? (
              <Badge color="green" size="2xsmall">
                {t("abandonedCart.discount.sentStatus", "Sent")}
              </Badge>
            ) : cart.can_send_discount ? (
              <Badge color="orange" size="2xsmall">
                {t("abandonedCart.discount.ready", "Ready")}
              </Badge>
            ) : (
              <Badge color="grey" size="2xsmall">
                <ClockSolidMini className="mr-0.5 inline" />
                {t(
                  "abandonedCart.discount.waiting",
                  "Waiting"
                )}
              </Badge>
            )}
          </div>

          <div className="text-ui-fg-muted flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
            <span>
              {t("abandonedCart.list.active", "Active")} {" "}
              {relativeTime(cart.updated_at)}
            </span>
            <span>
              {cart.vendor_items.length}/{cart.all_items_count}{" "}
              {t("abandonedCart.list.vendorItems", "items yours")}
            </span>
            {isSent && cart.discount_sent && (
              <span className="text-ui-fg-interactive font-medium">
                {t("abandonedCart.discount.code", "Code")}:{" "}
                {cart.discount_sent.promotion_code}
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="text-ui-fg-muted hover:text-ui-fg-base flex items-center gap-1 self-start text-xs transition-colors sm:self-center"
        >
          {open
            ? t("abandonedCart.list.hide", "Hide")
            : t("abandonedCart.list.details", "Details")}
          <ChevronDownMini
            className={`transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {/* expanded body */}
      {open && (
        <div className="border-t border-ui-border-base">
          <div className="divide-y divide-ui-border-base">
            {cart.vendor_items.map((item) => (
              <div key={item.id} className="flex gap-3 px-4 py-3">
                {item.variant?.product?.thumbnail ? (
                  <img
                    src={item.variant.product.thumbnail}
                    alt={
                      item.variant?.product?.title ||
                      item.title ||
                      ""
                    }
                    className="h-12 w-12 flex-shrink-0 rounded-md border border-ui-border-base object-cover"
                  />
                ) : (
                  <div className="bg-ui-bg-subtle flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md border border-ui-border-base">
                    <ShoppingCart className="text-ui-fg-muted" />
                  </div>
                )}

                <div className="flex min-w-0 flex-1 flex-col justify-between gap-1 sm:flex-row sm:items-center">
                  <div className="min-w-0">
                    <Text className="truncate text-sm font-medium">
                      {item.variant?.product?.title ||
                        item.title ||
                        t(
                          "abandonedCart.list.unknownItem",
                          "Unnamed item"
                        )}
                    </Text>
                    {item.variant?.title && (
                      <Text className="text-ui-fg-subtle text-xs">
                        {item.variant.title}
                      </Text>
                    )}
                  </div>

                  <div className="text-ui-fg-subtle flex flex-wrap gap-x-3 text-xs sm:text-right">
                    <span>×{item.quantity}</span>
                    <span>
                      {formatAmount(
                        getDisplayUnitPrice(item),
                        cart.currency_code
                      )}
                    </span>
                    <span className="font-medium">
                      {formatAmount(
                        getDisplayLineTotal(item),
                        cart.currency_code
                      )}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* discount form */}
          {!isSent && (
            <div className="border-t border-ui-border-base bg-ui-bg-subtle px-4 py-3">
              <Text
                weight="plus"
                className="text-ui-fg-subtle mb-2 text-xs uppercase tracking-wide"
              >
                {t(
                  "abandonedCart.discount.sendTitle",
                  "Send recovery discount"
                )}
              </Text>

              <div className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
                <div className="space-y-1">
                  <Label className="text-xs">
                    {t("abandonedCart.discount.type", "Type")}
                  </Label>
                  <Select
                    value={cart.discountDraft.discount_type}
                    onValueChange={(v) =>
                      onUpdateDraft(cart.id, {
                        discount_type:
                          v as AbandonedCartDiscountType,
                      })
                    }
                  >
                    <Select.Trigger className="w-full">
                      <Select.Value />
                    </Select.Trigger>
                    <Select.Content>
                      <Select.Item value="percentage">
                        %
                      </Select.Item>
                      <Select.Item value="fixed">
                        {t(
                          "abandonedCart.discount.fixed",
                          "Fixed"
                        )}
                      </Select.Item>
                    </Select.Content>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">
                    {t("abandonedCart.discount.value", "Value")}
                  </Label>
                  <Input
                    type="number"
                    min={0.01}
                    step={0.01}
                    value={
                      cart.discountDraft.discount_value === 0
                        ? ""
                        : cart.discountDraft.discount_value
                    }
                    onChange={(e) => {
                      const rawValue = e.target.value;

                      if (rawValue === "") {
                        onUpdateDraft(cart.id, {
                          discount_value: 0,
                        });
                        return;
                      }

                      const parsed = Number(rawValue);
                      if (!Number.isNaN(parsed)) {
                        onUpdateDraft(cart.id, {
                          discount_value: parsed,
                        });
                      }
                    }}
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">
                    {t(
                      "abandonedCart.discount.currency",
                      "Currency"
                    )}
                  </Label>
                  <Input
                    value={cart.discountDraft.currency_code}
                    onChange={(e) =>
                      onUpdateDraft(cart.id, {
                        currency_code:
                          e.target.value.toLowerCase(),
                      })
                    }
                    disabled={!isFixed}
                    className={!isFixed ? "opacity-50" : ""}
                  />
                </div>

                <div className="flex flex-col justify-end">
                  {!cart.can_send_discount && (
                    <Text className="text-ui-fg-muted mb-1 text-[10px] leading-tight">
                      {t(
                        "abandonedCart.discount.availableAfter",
                        "Available"
                      )}{" "}
                      {new Date(
                        cart.discount_available_at
                      ).toLocaleDateString()}
                    </Text>
                  )}
                  <Button
                    size="small"
                    variant="secondary"
                    onClick={() => onSendDiscount(cart)}
                    isLoading={isSending}
                    disabled={!cart.can_send_discount}
                    className="w-full sm:w-auto"
                  >
             
                    {t("abandonedCart.discount.send", "Send")}
                  </Button>
                </div>
              </div>

              <div className="mt-3 rounded-md border border-ui-border-base bg-ui-bg-base px-3 py-2">
                <Text className="text-ui-fg-subtle text-[11px] uppercase tracking-wide">
                  {t("abandonedCart.discount.preview", "Live preview")}
                </Text>
                {isPreviewLoading && !preview ? (
                  <Text className="text-ui-fg-muted mt-1 text-xs">
                    {t("abandonedCart.discount.previewLoading", "Calculating preview...")}
                  </Text>
                ) : preview ? (
                  <div className="mt-1 space-y-1">
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                      <Text className="text-ui-fg-subtle">
                        {t("abandonedCart.discount.previewItemTotal", "Items")}: {" "}
                        <span className="text-ui-fg-base font-medium">
                          {formatAmount(preview.preview_item_total, preview.currency_code)}
                        </span>
                      </Text>
                      <Text className="text-ui-fg-subtle">
                        {t("abandonedCart.discount.previewTaxTotal", "Tax")}: {" "}
                        <span className="text-ui-fg-base font-medium">
                          {formatAmount(preview.preview_tax_total, preview.currency_code)}
                        </span>
                      </Text>
                      <Text className="text-ui-fg-subtle">
                        {t("abandonedCart.discount.previewTotal", "Total")}: {" "}
                        <span className="text-ui-fg-base font-medium">
                          {formatAmount(preview.preview_total, preview.currency_code)}
                        </span>
                      </Text>
                    </div>

                    <div className="pt-1">
                      <Text className="text-ui-fg-muted text-[11px]">
                        {t("abandonedCart.discount.previewDiscount", "Estimated discount")}: {" "}
                        {formatAmount(preview.estimated_discount_total, preview.currency_code)}
                      </Text>
                      {preview.line_breakdown?.length > 0 && (
                        <div className="mt-1 space-y-0.5">
                          {preview.line_breakdown.slice(0, 3).map((line) => (
                            <Text key={line.line_item_id} className="text-ui-fg-subtle text-[11px]">
                              {line.product_title || t("abandonedCart.list.unknownItem", "Unnamed item")}:{" "}
                              {formatAmount(line.preview_total, preview.currency_code)}
                            </Text>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <Text className="text-ui-fg-muted mt-1 text-xs">
                    {t("abandonedCart.discount.previewMissing", "Enter discount values to preview final totals.")}
                  </Text>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

export const AbandonedCartsPage = () => {
  const { t } = useTranslation();
  const { getWidgets } = useDashboardExtension();

  const {
    abandoned_carts: abandonedCarts,
    count,
    isLoading: isCartsLoading,
    isError: isCartsError,
    error: cartsError,
  } = useAbandonedCarts();

  const {
    settings,
    isLoading: isSettingsLoading,
    isError: isSettingsError,
    error: settingsError,
  } = useAbandonedCartSettings();

  const updateSettingsMutation = useUpdateAbandonedCartSettings({
    onSuccess: () =>
      toast.success(
        t(
          "abandonedCart.settings.saved",
          "Abandoned cart settings saved"
        )
      ),
  });

  const sendDiscountMutation = useSendAbandonedCartDiscount({
    onSuccess: (data) =>
      toast.success(
        t(
          "abandonedCart.discount.sent",
          `Discount sent. Promotion code: ${data.promotion_code}`
        )
      ),
  });

  const [settingsForm, setSettingsForm] =
    useState<AbandonedCartSettings>(defaultSettings);
  const [drafts, setDrafts] = useState<
    Record<string, DiscountDraft>
  >({});
  const [activeCartTab, setActiveCartTab] =
    useState<CartTab>("not_sent");
  const [cartSort, setCartSort] =
    useState<CartSort>("updated_desc");
  const [cartSearch, setCartSearch] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [previewByCartId, setPreviewByCartId] = useState<
    Record<string, AbandonedCartDiscountPreview>
  >({});

  const tabCounts = useMemo(
    () => ({
      notSent: abandonedCarts.filter((c) => !c.discount_sent)
        .length,
      sent: abandonedCarts.filter((c) =>
        Boolean(c.discount_sent)
      ).length,
    }),
    [abandonedCarts]
  );

  useEffect(() => {
    if (settings) setSettingsForm(settings);
  }, [settings]);

  const displayedCarts: DisplayedCart[] = useMemo(() => {
    const q = cartSearch.trim().toLowerCase();

    return abandonedCarts
      .map((cart) => ({
        ...cart,
        discountDraft:
          drafts[cart.id] || defaultDraft(cart.currency_code),
      }))
      .filter((cart) => {
        if (q) {
          const match =
            cart.id.toLowerCase().includes(q) ||
            (cart.email || "").toLowerCase().includes(q);
          if (!match) return false;
        }
        return activeCartTab === "sent"
          ? Boolean(cart.discount_sent)
          : !cart.discount_sent;
      })
      .sort((a, b) => {
        const aU = new Date(a.updated_at).getTime();
        const bU = new Date(b.updated_at).getTime();
        const aC = new Date(a.created_at).getTime();
        const bC = new Date(b.created_at).getTime();
        switch (cartSort) {
          case "updated_asc":
            return aU - bU;
          case "created_desc":
            return bC - aC;
          case "created_asc":
            return aC - bC;
          default:
            return bU - aU;
        }
      });
  }, [
    abandonedCarts,
    drafts,
    activeCartTab,
    cartSort,
    cartSearch,
  ]);

  const updateDraft = (
    cartId: string,
    patch: Partial<SendAbandonedCartDiscountPayload>
  ) => {
    setDrafts((prev) => {
      const cur = prev[cartId] || defaultDraft();
      return {
        ...prev,
        [cartId]: {
          ...cur,
          ...patch,
          currency_code:
            patch.currency_code !== undefined
              ? patch.currency_code
              : cur.currency_code,
        },
      };
    });
  };

  const requestDiscountPreview = useCallback((
    cartId: string,
    payload: SendAbandonedCartDiscountPayload
  ) => {
    if (!payload.discount_value || payload.discount_value <= 0) {
      setPreviewByCartId((prev) => {
        const next = { ...prev };
        delete next[cartId];
        return next;
      });
      return;
    }

    if (payload.discount_type === "fixed" && !payload.currency_code?.trim()) {
      setPreviewByCartId((prev) => {
        const next = { ...prev };
        delete next[cartId];
        return next;
      });
      return;
    }

    const cart = abandonedCarts.find((entry) => entry.id === cartId);
    if (!cart) {
      return;
    }

    const preview = simulateDiscountPreview(cart, payload);
    setPreviewByCartId((prev) => ({
      ...prev,
      [cartId]: preview,
    }));
  }, [abandonedCarts]);

  const submitSettings = async () => {
    const f = settingsForm;
    const normalizedDiscountType =
      f.abandoned_cart_discount_type ?? "percentage";
    const normalizedDiscountValue = Number(
      f.abandoned_cart_discount_value
    );

    if (
      f.abandoned_cart_discount_enabled &&
      f.abandoned_cart_discount_mode === "automatic"
    ) {
      if (
        !normalizedDiscountType ||
        !Number.isFinite(normalizedDiscountValue) ||
        normalizedDiscountValue <= 0
      ) {
        toast.error(
          t(
            "abandonedCart.settings.validation.requiredAutomaticValues",
            "Automatic mode requires discount type and value"
          )
        );
        return;
      }
      if (
        normalizedDiscountType === "fixed" &&
        !f.abandoned_cart_discount_currency_code
      ) {
        toast.error(
          t(
            "abandonedCart.settings.validation.requiredFixedCurrency",
            "Fixed automatic discount requires currency code"
          )
        );
        return;
      }
    }

    const payload: AbandonedCartSettings = {
      ...f,
      abandoned_cart_discount_type:
        f.abandoned_cart_discount_mode === "automatic"
          ? normalizedDiscountType
          : f.abandoned_cart_discount_type,
      abandoned_cart_discount_value:
        f.abandoned_cart_discount_mode === "automatic"
          ? normalizedDiscountValue
          : f.abandoned_cart_discount_value,
    };

    await updateSettingsMutation.mutateAsync(payload);
  };

  const sendDiscount = async (cart: VendorAbandonedCart) => {
    if (!cart.can_send_discount) {
      toast.error(
        t(
          "abandonedCart.discount.validation.notEligibleYet",
          "Discount can be sent only after 48 h of inactivity."
        )
      );
      return;
    }
    const draft =
      drafts[cart.id] || defaultDraft(cart.currency_code);
    if (
      draft.discount_type === "fixed" &&
      !draft.currency_code?.trim()
    ) {
      toast.error(
        t(
          "abandonedCart.discount.validation.currencyRequired",
          "Currency code is required for fixed discount"
        )
      );
      return;
    }
    await sendDiscountMutation.mutateAsync({
      cartId: cart.id,
      payload: {
        discount_type: draft.discount_type,
        discount_value: draft.discount_value,
        currency_code:
          draft.discount_type === "fixed"
            ? draft.currency_code.toLowerCase()
            : undefined,
      },
    });
  };

  return (
    <SingleColumnPage
      widgets={{
        before: getWidgets("promotion.list.before"),
        after: getWidgets("promotion.list.after"),
      }}
      hasOutlet={false}
    >
      {/* page header — inside Container */}
      <Container className="mb-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShoppingCart className="text-ui-fg-muted" />
              <Heading level="h1">
                {t("abandonedCart.domain", "Abandoned Carts")}
              </Heading>
              <Badge size="2xsmall" color="grey">
                {count}
              </Badge>
            </div>
            <Text className="text-ui-fg-subtle text-sm">
              {t(
                "abandonedCart.subtitle",
                "Send recovery discounts and configure automatic rules — all in one place."
              )}
            </Text>
          </div>
        </div>
      </Container>

      {/* settings (collapsible) */}
      <Container className="mb-4 p-0">
        <button
          type="button"
          onClick={() => setSettingsOpen((o) => !o)}
          className="flex w-full items-center justify-between px-4 py-3 text-left"
        >
          <div className="flex items-center gap-2">
            <CogSixTooth className="text-ui-fg-muted" />
            <Text weight="plus" className="text-sm">
              {t(
                "abandonedCart.settings.title",
                "Discount Settings"
              )}
            </Text>
            {settingsForm.abandoned_cart_discount_enabled && (
              <Badge size="2xsmall" color="green">
                {settingsForm.abandoned_cart_discount_mode ===
                "automatic"
                  ? t(
                      "abandonedCart.settings.automatic",
                      "Automatic"
                    )
                  : t(
                      "abandonedCart.settings.manual",
                      "Manual"
                    )}
              </Badge>
            )}
          </div>
          <ChevronDownMini
            className={`text-ui-fg-muted transition-transform ${
              settingsOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {settingsOpen && (
          <div className="border-t border-ui-border-base px-4 py-4">
            <SettingsSection
              settingsForm={settingsForm}
              setSettingsForm={setSettingsForm}
              isSettingsLoading={isSettingsLoading}
              isSettingsError={isSettingsError}
              settingsError={settingsError}
              isPending={updateSettingsMutation.isPending}
              onSave={submitSettings}
              t={t}
            />
          </div>
        )}
      </Container>

      {/* cart list */}
      <Container className="p-0">
        <div className="space-y-3 px-4 py-3">
          <Tabs
            value={activeCartTab}
            onValueChange={(v) =>
              setActiveCartTab(v as CartTab)
            }
          >
            <Tabs.List className="w-full">
              <Tabs.Trigger value="not_sent" className="flex-1">
                {t(
                  "abandonedCart.tabs.notSent",
                  "Not sent yet"
                )}{" "}
                ({tabCounts.notSent})
              </Tabs.Trigger>
              <Tabs.Trigger value="sent" className="flex-1">
                {t("abandonedCart.tabs.sent", "Sent")}{" "}
                ({tabCounts.sent})
              </Tabs.Trigger>
            </Tabs.List>
          </Tabs>

          <div className="grid gap-2 sm:grid-cols-2 ">
            <Input
              placeholder={t(
                "abandonedCart.list.searchPlaceholder",
                "Search by cart ID or email…"
              )}
              className="py-4"
              value={cartSearch}
              onChange={(e) => setCartSearch(e.target.value)}
              size="small"
            />
            <Select
              value={cartSort}
              onValueChange={(v) =>
                setCartSort(v as CartSort)
              }
            >
              <Select.Trigger className="w-full">
                <Select.Value />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="updated_desc">
                  {t(
                    "abandonedCart.list.sortUpdatedDesc",
                    "Last active ↓"
                  )}
                </Select.Item>
                <Select.Item value="updated_asc">
                  {t(
                    "abandonedCart.list.sortUpdatedAsc",
                    "Last active ↑"
                  )}
                </Select.Item>
                <Select.Item value="created_desc">
                  {t(
                    "abandonedCart.list.sortCreatedDesc",
                    "Created ↓"
                  )}
                </Select.Item>
                <Select.Item value="created_asc">
                  {t(
                    "abandonedCart.list.sortCreatedAsc",
                    "Created ↑"
                  )}
                </Select.Item>
              </Select.Content>
            </Select>
          </div>
        </div>

        <div className="border-t border-ui-border-base px-4 py-4">
          {isCartsError ? (
            <div className="rounded-lg border border-ui-tag-red-border bg-ui-tag-red-bg px-4 py-3 text-center">
              <Text className="text-ui-fg-error text-sm">
                {cartsError?.message ||
                  t(
                    "abandonedCart.list.error",
                    "Failed to load abandoned carts"
                  )}
              </Text>
            </div>
          ) : isCartsLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="bg-ui-bg-subtle animate-pulse rounded-lg border border-ui-border-base p-4"
                >
                  <div className="bg-ui-bg-base mb-2 h-4 w-1/3 rounded" />
                  <div className="bg-ui-bg-base h-3 w-1/2 rounded" />
                </div>
              ))}
            </div>
          ) : displayedCarts.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <ShoppingCart className="text-ui-fg-muted h-8 w-8" />
              <Text className="text-ui-fg-subtle text-sm">
                {activeCartTab === "sent"
                  ? t(
                      "abandonedCart.list.emptySent",
                      "No discounts have been sent yet."
                    )
                  : t(
                      "abandonedCart.list.empty",
                      "No abandoned carts matched your store products."
                    )}
              </Text>
            </div>
          ) : (
            <div className="space-y-2">
              {displayedCarts.map((cart) => (
                <CartCard
                  key={cart.id}
                  cart={cart}
                  onUpdateDraft={updateDraft}
                  onRequestPreview={requestDiscountPreview}
                  preview={previewByCartId[cart.id]}
                  isPreviewLoading={false}
                  onSendDiscount={sendDiscount}
                  isSending={sendDiscountMutation.isPending}
                  t={t}
                />
              ))}
            </div>
          )}
        </div>
      </Container>
    </SingleColumnPage>
  );
};