// src/routes/payout/payout-earnings/components/pricing-calculator.tsx

import React, { useState, useMemo } from "react";
import {
  Heading,
  Text,
  Input,
  Label,
  Button,
  Badge,
  Tooltip,
} from "@medusajs/ui";
import {
  CurrencyDollar,
  Clock,
  InformationCircle,
  Plus,
  Trash,
  SparklesSolid,
  PencilSquare,
  ChartBar,
  CheckCircleSolid,
  CircleMinusSolid,
} from "@medusajs/icons";
import { useTranslation } from "react-i18next";
import { useCommissionRule } from "../../../hooks/api/payouts";

interface MaterialItem {
  id: string;
  name: string;
  cost: number;
}

interface CalculatorState {
  materials: MaterialItem[];
  hourlyRate: number;
  hoursWorked: number;
  minutesWorked: number;
  fixedCosts: number;
  margin: number;
  productTaxRate: number;
  marginType: "fixed" | "percentage";
}

const DEFAULT_STATE: CalculatorState = {
  materials: [{ id: crypto.randomUUID(), name: "", cost: 0 }],
  hourlyRate: 35,
  hoursWorked: 2,
  minutesWorked: 0,
  fixedCosts: 10,
  margin: 30,
  productTaxRate: 23,
  marginType: "fixed",
};

export const PricingCalculator: React.FC = () => {
  const { t } = useTranslation();
  const { commissionRule, isLoading: commissionLoading } =
    useCommissionRule();

  const [state, setState] = useState<CalculatorState>(DEFAULT_STATE);
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Determine commission rate returned by backend rule
  const commissionRate = useMemo(() => {
    if (commissionRule?.type === "percentage") {
      return parseFloat(commissionRule.fee_value) || 20;
    }

    return 20;
  }, [commissionRule]);

  // All calculations
  const calculations = useMemo(() => {
    const totalMaterials = state.materials.reduce(
      (sum, m) => sum + (m.cost || 0),
      0
    );
    const totalTimeHours =
      state.hoursWorked + state.minutesWorked / 60;
    const laborCost = totalTimeHours * state.hourlyRate;
    const fixedCosts = state.fixedCosts || 0;

    const subtotal = totalMaterials + laborCost + fixedCosts;

    const marginAmount =
      state.marginType === "percentage"
        ? subtotal * ((state.margin || 0) / 100)
        : state.margin || 0;

    // Costs and creator margin are treated as net business values.
    const creatorTargetNet = subtotal + marginAmount;

    const safeTaxRate = Math.max(0, state.productTaxRate || 0);
    const taxMultiplier = 1 + safeTaxRate / 100;

    // include_tax=true means backend percentage is gross; otherwise net.
    const commissionRateNet = commissionRule?.include_tax
      ? commissionRate / taxMultiplier
      : commissionRate;
    const commissionRateGross = commissionRule?.include_tax
      ? commissionRate
      : commissionRate * taxMultiplier;

    // creatorTargetNet = saleNet - commissionNet
    // commissionNet = saleNet * commissionRateNet
    // saleNet = creatorTargetNet / (1 - commissionRateNet)
    const commissionFraction = 1 - commissionRateNet / 100;
    const finalPriceNet =
      commissionFraction > 0
        ? creatorTargetNet / commissionFraction
        : creatorTargetNet;

    const finalPriceGross = finalPriceNet * taxMultiplier;
    const platformFeeNet = finalPriceNet - creatorTargetNet;
    const platformFeeGross = finalPriceGross - creatorTargetNet * taxMultiplier;
    const productTaxAmount = finalPriceGross - finalPriceNet;

    const effectiveHourlyRate =
      totalTimeHours > 0 ? creatorTargetNet / totalTimeHours : 0;

    const profitMarginPercent =
      finalPriceNet > 0 ? (marginAmount / finalPriceNet) * 100 : 0;

    return {
      totalMaterials,
      totalTimeHours,
      laborCost,
      fixedCosts,
      subtotal,
      marginAmount,
      creatorTargetNet,
      creatorTargetGross: creatorTargetNet * taxMultiplier,
      finalPriceNet,
      finalPriceGross,
      productTaxAmount,
      platformFeeNet,
      platformFeeGross,
      commissionRate,
      commissionRateNet,
      commissionRateGross,
      effectiveHourlyRate,
      profitMarginPercent,
      productTaxRate: safeTaxRate,
    };
  }, [state, commissionRate, commissionRule?.include_tax]);

  const formatPLN = (amount: number) =>
    new Intl.NumberFormat("pl-PL", {
      style: "currency",
      currency: "PLN",
    }).format(amount);

  // Material management
  const addMaterial = () => {
    setState((prev) => ({
      ...prev,
      materials: [
        ...prev.materials,
        { id: crypto.randomUUID(), name: "", cost: 0 },
      ],
    }));
  };

  const removeMaterial = (id: string) => {
    setState((prev) => ({
      ...prev,
      materials: prev.materials.filter((m) => m.id !== id),
    }));
  };

  const updateMaterial = (
    id: string,
    field: "name" | "cost",
    value: string | number
  ) => {
    setState((prev) => ({
      ...prev,
      materials: prev.materials.map((m) =>
        m.id === id ? { ...m, [field]: value } : m
      ),
    }));
  };

  const updateField = <K extends keyof CalculatorState>(
    field: K,
    value: CalculatorState[K]
  ) => {
    setState((prev) => ({ ...prev, [field]: value }));
  };

  const resetCalculator = () => {
    setState(DEFAULT_STATE);
    setShowBreakdown(false);
  };

  return (
    <div className="bg-ui-bg-base rounded-lg border border-ui-border-base mb-8">
      {/* Header */}
      <div className="px-6 py-4 border-b border-ui-border-base">
        <div className="flex items-center gap-3">
          <SparklesSolid className="text-ui-fg-interactive" />
          <div>
            <Heading level="h3">
              {t(
                "profitCalculator.title",
                "Kalkulator wyceny rękodzieła"
              )}
            </Heading>
            <Text className="text-ui-fg-subtle mt-1">
              {t(
                "profitCalculator.subtitle",
                "Oblicz uczciwą cenę produktu, uwzględniając koszty, czas pracy i prowizję platformy"
              )}
            </Text>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Formula reminder */}
        <div className="bg-ui-bg-subtle rounded-lg p-4 mb-6 border border-ui-border-base">
          <div className="flex items-start gap-2">
            <InformationCircle className="text-ui-fg-interactive mt-0.5 shrink-0" />
            <div>
              <Text size="small" weight="plus">
                {t("profitCalculator.formula", "Formuła wyceny")}
              </Text>
              <Text
                size="small"
                className="text-ui-fg-subtle mt-1 font-mono"
              >
                {t(
                  "profitCalculator.formulaExpression",
                  "Cena = (materiały + czas × stawka + koszty stałe + marża) ÷ (1 − prowizja%)"
                )}
              </Text>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left column: Inputs */}
          <div className="space-y-6">
            {/* Materials Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CurrencyDollar className="text-ui-fg-muted" />
                  <Label weight="plus">
                    {t(
                      "profitCalculator.materials",
                      "Materiały"
                    )}
                  </Label>
                </div>
                <Button
                  variant="transparent"
                  size="small"
                  onClick={addMaterial}
                >
                  <Plus className="mr-1" />
                  {t("profitCalculator.addMaterial", "Dodaj")}
                </Button>
              </div>

              <div className="space-y-2">
                {state.materials.map((material, index) => (
                  <div
                    key={material.id}
                    className="flex items-center gap-2"
                  >
                    <Input
                      className="flex-1"
                      placeholder={t("profitCalculator.materialName", {
                        index: index + 1,
                        defaultValue: `Materiał ${index + 1}`,
                      })}
                      value={material.name}
                      onChange={(e) =>
                        updateMaterial(
                          material.id,
                          "name",
                          e.target.value
                        )
                      }
                    />
                    <div className="relative w-32">
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        placeholder="0.00"
                        value={material.cost || ""}
                        onChange={(e) =>
                          updateMaterial(
                            material.id,
                            "cost",
                            parseFloat(e.target.value) || 0
                          )
                        }
                      />
                    </div>
                    {state.materials.length > 1 && (
                      <Button
                        variant="transparent"
                        size="small"
                        onClick={() => removeMaterial(material.id)}
                      >
                        <Trash className="text-ui-fg-error" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {state.materials.length > 1 && (
                <div className="mt-2 text-right">
                  <Text size="small" className="text-ui-fg-subtle">
                    {t(
                      "profitCalculator.totalMaterials",
                      "Suma materiałów"
                    )}
                    :{" "}
                    <span className="font-semibold text-ui-fg-base">
                      {formatPLN(calculations.totalMaterials)}
                    </span>
                  </Text>
                </div>
              )}
            </div>

            {/* Time & Hourly Rate */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="text-ui-fg-muted" />
                <Label weight="plus">
                  {t(
                    "profitCalculator.laborTime",
                    "Czas pracy i stawka"
                  )}
                </Label>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-ui-fg-subtle mb-1">
                    {t("profitCalculator.hours", "Godziny")}
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    max={999}
                    value={state.hoursWorked || ""}
                    onChange={(e) =>
                      updateField(
                        "hoursWorked",
                        parseInt(e.target.value) || 0
                      )
                    }
                  />
                </div>
                <div>
                  <Label className="text-ui-fg-subtle mb-1">
                    {t("profitCalculator.minutes", "Minuty")}
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    max={59}
                    value={state.minutesWorked || ""}
                    onChange={(e) =>
                      updateField(
                        "minutesWorked",
                        parseInt(e.target.value) || 0
                      )
                    }
                  />
                </div>
                <div>
                  <Label className="text-ui-fg-subtle mb-1">
                    {t(
                      "profitCalculator.hourlyRate",
                      "Stawka zł/h"
                    )}
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    value={state.hourlyRate || ""}
                    onChange={(e) =>
                      updateField(
                        "hourlyRate",
                        parseFloat(e.target.value) || 0
                      )
                    }
                  />
                </div>
              </div>

              <Text
                size="xsmall"
                className="text-ui-fg-subtle mt-2"
              >
                {t(
                  "profitCalculator.laborTotal",
                  "Koszt pracy"
                )}
                :{" "}
                {calculations.totalTimeHours.toFixed(1)}h ×{" "}
                {formatPLN(state.hourlyRate)} ={" "}
                <span className="font-semibold">
                  {formatPLN(calculations.laborCost)}
                </span>
              </Text>
            </div>

            {/* Fixed Costs */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <PencilSquare className="text-ui-fg-muted" />
                <Label weight="plus">
                  {t(
                    "profitCalculator.fixedCosts",
                    "Koszty stałe"
                  )}
                </Label>
              </div>
              <Text
                size="xsmall"
                className="text-ui-fg-subtle mb-2"
              >
                {t(
                  "profitCalculator.fixedCostsHint",
                  "Narzędzia, energia, opakowanie, wysyłka próbek itp."
                )}
              </Text>
              <Input
                type="number"
                min={0}
                step={0.01}
                placeholder="10.00"
                value={state.fixedCosts || ""}
                onChange={(e) =>
                  updateField(
                    "fixedCosts",
                    parseFloat(e.target.value) || 0
                  )
                }
              />
            </div>

            {/* Margin */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ChartBar className="text-ui-fg-muted" />
                <Label weight="plus">
                  {t(
                    "profitCalculator.margin",
                    "Marża twórcy"
                  )}
                </Label>
              </div>
              <Text
                size="xsmall"
                className="text-ui-fg-subtle mb-2"
              >
                {t(
                  "profitCalculator.marginHint",
                  "Twój zysk ponad koszty – to wartość Twojej twórczości"
                )}
              </Text>

              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  step={
                    state.marginType === "percentage" ? 1 : 0.01
                  }
                  placeholder={
                    state.marginType === "percentage"
                      ? "25"
                      : "30.00"
                  }
                  value={state.margin || ""}
                  onChange={(e) =>
                    updateField(
                      "margin",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  className="flex-1"
                />
                <div className="flex rounded-lg border border-ui-border-base overflow-hidden shrink-0">
                  <button
                    type="button"
                    className={`px-3 py-2 text-sm transition-colors ${
                      state.marginType === "fixed"
                        ? "bg-ui-bg-interactive text-ui-fg-on-color"
                        : "bg-ui-bg-base text-ui-fg-subtle hover:bg-ui-bg-base-hover"
                    }`}
                    onClick={() =>
                      updateField("marginType", "fixed")
                    }
                  >
                    PLN
                  </button>
                  <button
                    type="button"
                    className={`px-3 py-2 text-sm transition-colors ${
                      state.marginType === "percentage"
                        ? "bg-ui-bg-interactive text-ui-fg-on-color"
                        : "bg-ui-bg-base text-ui-fg-subtle hover:bg-ui-bg-base-hover"
                    }`}
                    onClick={() =>
                      updateField("marginType", "percentage")
                    }
                  >
                    %
                  </button>
                </div>
              </div>

              {state.marginType === "percentage" && (
                <Text
                  size="xsmall"
                  className="text-ui-fg-subtle mt-1"
                >
                  {t("profitCalculator.marginAmount", "Kwota")}:{" "}
                  {formatPLN(calculations.marginAmount)}
                </Text>
              )}
            </div>

            {/* Commission Rate */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <CurrencyDollar className="text-ui-fg-muted" />
                  <Label weight="plus">
                    {t(
                      "profitCalculator.commission",
                      "Prowizja platformy"
                    )}
                  </Label>
                </div>
                {commissionRule && (
                  <Badge color="green" size="xsmall">
                    {t(
                      "profitCalculator.autoDetected",
                      "Wykryta automatycznie"
                    )}
                  </Badge>
                )}
              </div>

              {commissionLoading ? (
                <Text
                  size="small"
                  className="text-ui-fg-subtle"
                >
                  {t(
                    "profitCalculator.loadingCommission",
                    "Ładowanie prowizji..."
                  )}
                </Text>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 relative">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step={0.1}
                        value={commissionRate || ""}
                        disabled
                      />
                    </div>
                    <Text className="text-ui-fg-subtle shrink-0">
                      %
                    </Text>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    <Text size="xsmall" className="text-ui-fg-subtle">
                      {t("profitCalculator.commissionRateNet", "Stawka netto")}: {calculations.commissionRateNet.toFixed(2)}%
                    </Text>
                    <Text size="xsmall" className="text-ui-fg-subtle">
                      {t("profitCalculator.commissionRateGross", "Stawka brutto")}: {calculations.commissionRateGross.toFixed(2)}%
                    </Text>
                  </div>

                  <Text size="xsmall" className="text-ui-fg-subtle mt-1">
                    {commissionRule?.include_tax
                      ? t(
                          "profitCalculator.commissionIncludesTax",
                          "Wartość prowizji z backendu jest wartością brutto (z podatkiem)."
                        )
                      : t(
                          "profitCalculator.commissionExcludesTax",
                          "Wartość prowizji z backendu jest wartością netto (bez podatku)."
                        )}
                  </Text>

                  <Text size="xsmall" className="text-ui-fg-subtle mt-2">
                    {commissionRule?.type === "percentage"
                      ? t(
                          "profitCalculator.commissionReadOnly",
                          "Prowizja jest pobierana z aktualnych ustawień i nie może być zmieniona w kalkulatorze."
                        )
                      : t(
                          "profitCalculator.commissionFallback",
                          "Wykryto prowizję nieprocentową. Użyto wartości domyślnej 20% do estymacji."
                        )}
                  </Text>
                </>
              )}
            </div>

            {/* Product VAT */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CurrencyDollar className="text-ui-fg-muted" />
                <Label weight="plus">
                  {t("profitCalculator.productTax", "Podatek produktu (VAT)")}
                </Label>
              </div>
              <Text size="xsmall" className="text-ui-fg-subtle mb-2">
                {t(
                  "profitCalculator.productTaxHint",
                  "Np. 0, 5, 8, 23. Wpływa na przeliczenie netto/brutto ceny i prowizji."
                )}
              </Text>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={state.productTaxRate || ""}
                  onChange={(e) =>
                    updateField(
                      "productTaxRate",
                      parseFloat(e.target.value) || 0
                    )
                  }
                />
                <Text className="text-ui-fg-subtle shrink-0">%</Text>
              </div>
            </div>

            {/* Reset */}
            <div className="pt-2">
              <Button
                variant="secondary"
                size="small"
                onClick={resetCalculator}
              >
                {t(
                  "profitCalculator.reset",
                  "Wyczyść kalkulator"
                )}
              </Button>
            </div>
          </div>

          {/* Right column: Results */}
          <div className="space-y-4">
            {/* Final Price Card */}
            <div className="bg-ui-bg-subtle rounded-lg p-6 border border-ui-border-base">
              <Text
                size="small"
                className="text-ui-fg-subtle mb-1"
              >
                {t(
                  "profitCalculator.recommendedPrice",
                  "Zalecana cena dla klienta"
                )}
              </Text>
              <div className="flex items-baseline gap-2">
                <Text className="text-3xl font-bold text-ui-fg-base">
                  {formatPLN(
                    Math.ceil(calculations.finalPriceGross)
                  )}
                </Text>
              </div>
              <Text size="xsmall" className="text-ui-fg-subtle mt-1">
                {t("profitCalculator.netPrice", "Cena netto")}: {formatPLN(calculations.finalPriceNet)}
              </Text>
              <Text
                size="xsmall"
                className="text-ui-fg-subtle mt-1"
              >
                {t(
                  "profitCalculator.roundedUp",
                  "Zaokrąglono w górę do pełnych złotych"
                )}
              </Text>
            </div>

            {/* You Receive Card */}
            <div className="bg-ui-bg-highlight rounded-lg p-6 border border-ui-border-interactive">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircleSolid className="text-ui-fg-interactive" />
                <Text size="small" className="text-ui-fg-subtle">
                  {t(
                    "profitCalculator.youReceive",
                    "Ty otrzymujesz"
                  )}
                </Text>
              </div>
              <Text className="text-2xl font-bold text-ui-fg-interactive">
                {formatPLN(calculations.creatorTargetNet)}
              </Text>
              <Text size="xsmall" className="text-ui-fg-subtle mt-1">
                {t("profitCalculator.grossAmount", "Kwota brutto")}: {formatPLN(calculations.creatorTargetGross)}
              </Text>
            </div>

            {/* Platform Fee Card */}
            <div className="bg-ui-bg-subtle rounded-lg p-4 border border-ui-border-base">
              <div className="flex items-center gap-2 mb-1">
                <CircleMinusSolid className="text-ui-fg-muted" />
                <Text size="small" className="text-ui-fg-subtle">
                  {t(
                    "profitCalculator.platformFee",
                    "Prowizja platformy"
                  )}{" "}
                  ({calculations.commissionRateNet.toFixed(2)}% {t("profitCalculator.net", "netto")})
                </Text>
              </div>
              <Text className="text-lg font-semibold text-ui-fg-muted">
                {formatPLN(calculations.platformFeeNet)}
              </Text>
              <Text size="xsmall" className="text-ui-fg-subtle mt-1">
                {t("profitCalculator.grossAmount", "Kwota brutto")}: {formatPLN(calculations.platformFeeGross)}
              </Text>
            </div>

            {/* Detailed Breakdown Toggle */}
            <button
              type="button"
              className="w-full text-left"
              onClick={() => setShowBreakdown(!showBreakdown)}
            >
              <div className="flex items-center justify-between py-2">
                <Text
                  size="small"
                  weight="plus"
                  className="text-ui-fg-interactive"
                >
                  {showBreakdown
                    ? t(
                        "profitCalculator.hideBreakdown",
                        "Ukryj szczegóły"
                      )
                    : t(
                        "profitCalculator.showBreakdown",
                        "Pokaż szczegółowy rozkład"
                      )}
                </Text>
                <Text className="text-ui-fg-interactive">
                  {showBreakdown ? "▲" : "▼"}
                </Text>
              </div>
            </button>

            {showBreakdown && (
              <div className="bg-ui-bg-base rounded-lg border border-ui-border-base overflow-hidden">
                <table className="w-full">
                  <tbody>
                    <tr className="border-b border-ui-border-base">
                      <td className="px-4 py-2.5">
                        <Text size="small">
                          {t(
                            "profitCalculator.materials",
                            "Materiały"
                          )}
                        </Text>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <Text size="small" weight="plus">
                          {formatPLN(
                            calculations.totalMaterials
                          )}
                        </Text>
                      </td>
                    </tr>
                    <tr className="border-b border-ui-border-base">
                      <td className="px-4 py-2.5">
                        <Text size="small">
                          {t(
                            "profitCalculator.labor",
                            "Praca"
                          )}{" "}
                          ({calculations.totalTimeHours.toFixed(1)}
                          h × {formatPLN(state.hourlyRate)})
                        </Text>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <Text size="small" weight="plus">
                          {formatPLN(calculations.laborCost)}
                        </Text>
                      </td>
                    </tr>
                    <tr className="border-b border-ui-border-base">
                      <td className="px-4 py-2.5">
                        <Text size="small">
                          {t(
                            "profitCalculator.fixedCosts",
                            "Koszty stałe"
                          )}
                        </Text>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <Text size="small" weight="plus">
                          {formatPLN(calculations.fixedCosts)}
                        </Text>
                      </td>
                    </tr>
                    <tr className="border-b border-ui-border-base bg-ui-bg-subtle">
                      <td className="px-4 py-2.5">
                        <Text size="small" weight="plus">
                          {t(
                            "profitCalculator.subtotal",
                            "Suma kosztów"
                          )}
                        </Text>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <Text size="small" weight="plus">
                          {formatPLN(calculations.subtotal)}
                        </Text>
                      </td>
                    </tr>
                    <tr className="border-b border-ui-border-base">
                      <td className="px-4 py-2.5">
                        <Text size="small">
                          {t(
                            "profitCalculator.margin",
                            "Marża"
                          )}{" "}
                          {state.marginType === "percentage" &&
                            `(${state.margin}%)`}
                        </Text>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <Text size="small" weight="plus">
                          + {formatPLN(calculations.marginAmount)}
                        </Text>
                      </td>
                    </tr>
                    <tr className="border-b border-ui-border-base bg-ui-bg-subtle">
                      <td className="px-4 py-2.5">
                        <Text size="small" weight="plus">
                          {t(
                            "profitCalculator.targetAmount",
                            "Kwota docelowa"
                          )}
                        </Text>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <Text
                          size="small"
                          weight="plus"
                          className="text-ui-fg-interactive"
                        >
                          {formatPLN(
                            calculations.creatorTargetNet
                          )}
                        </Text>
                      </td>
                    </tr>
                    <tr className="border-b border-ui-border-base">
                      <td className="px-4 py-2.5">
                        <Text size="small">
                          {t(
                            "profitCalculator.platformCommission",
                            "Prowizja"
                          )}{" "}
                          ({calculations.commissionRateNet.toFixed(2)}% {t("profitCalculator.net", "netto")})
                        </Text>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <Text
                          size="small"
                          weight="plus"
                          className="text-ui-fg-error"
                        >
                          + {formatPLN(calculations.platformFeeNet)}
                        </Text>
                        <Text size="xsmall" className="text-ui-fg-subtle mt-0.5">
                          {t("profitCalculator.grossAmount", "Kwota brutto")}: {formatPLN(calculations.platformFeeGross)}
                        </Text>
                      </td>
                    </tr>
                    <tr className="border-b border-ui-border-base">
                      <td className="px-4 py-2.5">
                        <Text size="small">
                          {t("profitCalculator.taxAmount", "Podatek")}{" "}
                          ({calculations.productTaxRate.toFixed(1)}%)
                        </Text>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <Text size="small" weight="plus">
                          + {formatPLN(calculations.productTaxAmount)}
                        </Text>
                      </td>
                    </tr>
                    <tr className="bg-ui-bg-subtle">
                      <td className="px-4 py-3">
                        <Text weight="plus">
                          {t(
                            "profitCalculator.finalPrice",
                            "Cena końcowa"
                          )}
                        </Text>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Text weight="plus" className="text-lg">
                          {formatPLN(
                            Math.ceil(calculations.finalPriceGross)
                          )}
                        </Text>
                        <Text size="xsmall" className="text-ui-fg-subtle mt-0.5">
                          {t("profitCalculator.netPrice", "Cena netto")}: {formatPLN(calculations.finalPriceNet)}
                        </Text>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Stats badges */}
            <div className="flex flex-wrap gap-2 pt-2">
              <Tooltip
                content={t(
                  "profitCalculator.effectiveRateTooltip",
                  "Ile faktycznie zarabiasz na godzinę po uwzględnieniu wszystkich kosztów i marży"
                )}
              >
                <Badge color="blue" size="small">
                  ⏱{" "}
                  {t(
                    "profitCalculator.effectiveRate",
                    "Efektywna stawka"
                  )}
                  :{" "}
                  {formatPLN(calculations.effectiveHourlyRate)}
                  /h
                </Badge>
              </Tooltip>
              <Tooltip
                content={t(
                  "profitCalculator.profitMarginTooltip",
                  "Procent marży w cenie końcowej"
                )}
              >
                <Badge color="purple" size="small">
                  📊{" "}
                  {t(
                    "profitCalculator.profitMargin",
                    "Marża w cenie"
                  )}
                  :{" "}
                  {calculations.profitMarginPercent.toFixed(1)}%
                </Badge>
              </Tooltip>
            </div>

            {/* Helpful tip */}
            <div className="bg-ui-bg-subtle rounded-lg p-4 border border-ui-border-base mt-4">
              <div className="flex items-start gap-2">
                <SparklesSolid className="text-ui-fg-interactive mt-0.5 shrink-0" />
                <div>
                  <Text size="small" weight="plus">
                    {t(
                      "profitCalculator.tipTitle",
                      "Wskazówka"
                    )}
                  </Text>
                  <Text
                    size="small"
                    className="text-ui-fg-subtle mt-1"
                  >
                    {t(
                      "profitCalculator.tipContent",
                      "Klienci handmade szukają produktów unikatowych i są gotowi zapłacić za jakość. Nie konkurujesz z sieciówkami – Twoja cena powinna odzwierciedlać wartość ręcznej pracy i wyjątkowość produktu."
                    )}
                  </Text>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingCalculator;