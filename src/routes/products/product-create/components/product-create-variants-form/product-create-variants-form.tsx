import { HttpTypes } from '@medusajs/types';
import { useMemo } from 'react';
import { UseFormReturn, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import {
  createDataGridHelper,
  createDataGridPriceColumns,
  DataGrid,
} from '../../../../../components/data-grid';
import { useRouteModal } from '../../../../../components/modals';
import {
  ProductCreateOptionSchema,
  ProductCreateVariantSchema,
} from '../../constants';
import { ProductCreateSchemaType } from '../../types';
import { useStockLocations } from '../../../../../hooks/api/stock-locations';
import { useCommissionRule } from '../../../../../hooks/api/payouts';

type ProductCreateVariantsFormProps = {
  form: UseFormReturn<ProductCreateSchemaType>;
  regions?: HttpTypes.AdminRegion[];
  store?: HttpTypes.AdminStore;
  pricePreferences?: HttpTypes.AdminPricePreference[];
};

export const ProductCreateVariantsForm = ({
  form,
  regions,
  store,
  pricePreferences,
}: ProductCreateVariantsFormProps) => {
  const { t } = useTranslation();
  const { setCloseOnEscape } = useRouteModal();

  const currencyCodes = useMemo(
    () =>
      store?.supported_currencies?.map(
        (c) => c.currency_code
      ) || [],
    [store]
  );

  const variants = useWatch({
    control: form.control,
    name: 'variants',
    defaultValue: [],
  });

  const options = useWatch({
    control: form.control,
    name: 'options',
    defaultValue: [],
  });

  /**
   * NOTE: anything that goes to the datagrid component needs to be memoised otherwise DataGrid will rerender and inputs will loose focus
   */
  const columns = useColumns({
    options,
    currencies: currencyCodes,
    regions,
    pricePreferences,
  });

  const variantData = useMemo(() => {
    const ret: any[] = [];

    variants.forEach((v, i) => {
      if (v.should_create) {
        ret.push({ ...v, originalIndex: i });
      }
    });

    return ret;
  }, [variants]);

  return (
    <div className='flex size-full flex-col divide-y overflow-hidden'>
      {/* Mobile hint for horizontal scrolling */}
      <div className='block sm:hidden px-4 py-2 text-xs text-ui-fg-muted bg-ui-bg-subtle border-b'>
        ← {t('products.create.tabs.variants_scroll_hint')} →
      </div>
      <div className='flex-1 overflow-x-auto'>
        <DataGrid
          columns={columns}
          data={variantData}
          state={form}
          onEditingChange={(editing) =>
            setCloseOnEscape(!editing)
          }
        />
      </div>
    </div>
  );
};

const columnHelper = createDataGridHelper<
  ProductCreateVariantSchema & { originalIndex: number },
  ProductCreateSchemaType
>();

const DEFAULT_VAT_RATE = 23;

const useColumns = ({
  options,
  currencies = [],
  regions = [],
  pricePreferences = [],
}: {
  options: ProductCreateOptionSchema[];
  currencies?: string[];
  regions?: HttpTypes.AdminRegion[];
  pricePreferences?: HttpTypes.AdminPricePreference[];
}) => {
  const { t } = useTranslation();
  const { stock_locations, isLoading: isLoadingLocations } = useStockLocations();
  const { commissionRule } = useCommissionRule();

  // Use translation keys for column headers
  const headers = {
    options: t('products.create.variantHeaders.options'),
    title: t('products.create.variantHeaders.title'),
    sku: t('products.create.variantHeaders.sku'),
    ean: t('products.create.variantHeaders.ean'),
    barcode: t('products.create.variantHeaders.barcode'),
    manage_inventory: t('products.create.variantHeaders.manage_inventory'),
    allow_backorder: t('products.create.variantHeaders.allow_backorder'),
    price: t('products.create.variantHeaders.price'),
    estimatedSellerAmount: t('products.create.variantHeaders.estimatedSellerAmount'),
    stock_location: t('products.create.variantHeaders.stock_location'),
    stock_quantity: t('products.create.variantHeaders.stock_quantity'),
  };

  const commissionRate = useMemo(() => {
    const percentageRate = Number(commissionRule?.percentage_rate);
    if (Number.isFinite(percentageRate) && percentageRate > 0) {
      return Math.min(percentageRate, 100);
    }

    const rawFeeValue = String(commissionRule?.fee_value ?? '').trim();
    if (!rawFeeValue) {
      return 0;
    }

    const normalized = rawFeeValue
      .replace('%', '')
      .replace(',', '.')
      .replace(/[^0-9.-]/g, '');

    const parsed = Number(normalized);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return 0;
    }

    const percentage = parsed <= 1 ? parsed * 100 : parsed;
    return Math.min(percentage, 100);
  }, [commissionRule?.fee_value, commissionRule?.percentage_rate]);

  const priceIncludesTax = useMemo(() => {
    const defaultCurrency = (currencies[0] || '').toLowerCase();
    if (!defaultCurrency) {
      return true;
    }

    const preference = pricePreferences.find(
      (entry) =>
        entry.attribute === 'currency_code' &&
        String(entry.value).toLowerCase() === defaultCurrency
    );

    return preference?.is_tax_inclusive ?? true;
  }, [currencies, pricePreferences]);

  const effectiveCommissionRate = useMemo(() => {
    if (!commissionRate) {
      return 0;
    }

    const taxMultiplier = 1 + DEFAULT_VAT_RATE / 100;

    const commissionRateNet = commissionRule?.include_tax
      ? commissionRate / taxMultiplier
      : commissionRate;
    const commissionRateGross = commissionRule?.include_tax
      ? commissionRate
      : commissionRate * taxMultiplier;

    return Math.min(
      priceIncludesTax ? commissionRateGross : commissionRateNet,
      100
    );
  }, [commissionRate, commissionRule?.include_tax, priceIncludesTax]);

  const estimateSellerAmount = (basePrice: unknown) => {
    const numericPrice =
      typeof basePrice === 'number'
        ? basePrice
        : typeof basePrice === 'string'
          ? Number(basePrice)
          : Number.NaN;

    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      return null;
    }

    const retained = numericPrice * (1 - effectiveCommissionRate / 100);

    return retained > 0 ? retained : 0;
  };

  const formatEstimateAmount = (amount: number) => {
    const normalizedCurrency = (currencies[0] || 'pln').toUpperCase();
    return `${amount.toFixed(2)} ${normalizedCurrency}`;
  };

  // Prepare stock location options for select dropdown
  const stockLocationOptions = useMemo(
    () => {
      if (!stock_locations || stock_locations.length === 0) {
        return [];
      }
      const options = stock_locations.map((loc) => ({
        label: loc.name,
        value: loc.id,
      }));

      return options;
    },
    [stock_locations, isLoadingLocations]
  );

  return useMemo(
    () => [
      columnHelper.column({
        id: 'options',
        header: () => (
          <div className='flex size-full items-center overflow-hidden'>
            <span className='truncate'>
              {options.map((o) => o.title).join(' / ')}
            </span>
          </div>
        ),
        cell: (context) => {
          return (
            <DataGrid.ReadonlyCell context={context}>
              {options
                .map(
                  (o) =>
                    context.row.original.options[o.title]
                )
                .join(' / ')}
            </DataGrid.ReadonlyCell>
          );
        },
        disableHiding: true,
      }),
      columnHelper.column({
        id: 'title',
        name: headers.title,
        header: headers.title,
        field: (context) =>
          `variants.${context.row.original.originalIndex}.title`,
        type: 'text',
        cell: (context) => {
          return <DataGrid.TextCell context={context} />;
        },
      }),
      // SKU column - hidden from UI but still functional for form submission
      // The SKU field is auto-generated and submitted with the form data
      // columnHelper.column({
      //   id: 'sku',
      //   name: headers.sku,
      //   header: headers.sku,
      //   field: (context) =>
      //     `variants.${context.row.original.originalIndex}.sku`,
      //   type: 'text',
      //   cell: (context) => {
      //     return <DataGrid.TextCell context={context} />;
      //   },
      // }),
      // EAN column - commented out
      // columnHelper.column({
      //   id: 'ean',
      //   name: headers.ean,
      //   header: headers.ean,
      //   field: (context) =>
      //     `variants.${context.row.original.originalIndex}.ean`,
      //   type: 'text',
      //   cell: (context) => {
      //     return <DataGrid.TextCell context={context} />;
      //   },
      // }),
      // Barcode column - commented out
      // columnHelper.column({
      //   id: 'barcode',
      //   name: headers.barcode,
      //   header: headers.barcode,
      //   field: (context) =>
      //     `variants.${context.row.original.originalIndex}.barcode`,
      //   type: 'text',
      //   cell: (context) => {
      //     return <DataGrid.TextCell context={context} />;
      //   },
      // }),

      
      columnHelper.column({
        id: 'allow_backorder',
        name: headers.allow_backorder,
        header: headers.allow_backorder,
        field: (context) =>
          `variants.${context.row.original.originalIndex}.allow_backorder`,
        type: 'boolean',
        cell: (context) => {
          return <DataGrid.BooleanCell context={context} />;
        },
      }),
      columnHelper.column({
        id: 'manage_inventory',
        name: headers.manage_inventory,
        header: () => (
          <div className="flex items-center gap-x-1">
            <span>{headers.manage_inventory}</span>
            <div className="group relative">
              <span className="text-ui-fg-muted cursor-help">ⓘ</span>
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 hidden group-hover:block z-[9999] w-64 p-2 bg-ui-bg-base border border-ui-border-base rounded shadow-elevation-tooltip text-xs text-ui-fg-base">
                {t('products.create.variantHeaders.manage_inventory_description')}
              </div>
            </div>
          </div>
        ),
        field: (context) =>
          `variants.${context.row.original.originalIndex}.manage_inventory`,
        type: 'boolean',
        cell: (context) => {
          return <DataGrid.BooleanCell context={context} />;
        },
      }),
      // Stock Quantity column 
      columnHelper.column({
        id: 'stock_quantity',
        name: headers.stock_quantity,
        header: headers.stock_quantity,
        field: (context) =>
          `variants.${context.row.original.originalIndex}.stock_quantity`,
        type: 'number',
        cell: (context) => {
          return (
            <DataGrid.StockQuantityCell
              context={context}
              variantIndex={context.row.original.originalIndex}
              min={0}
              placeholder="0"
            />
          );
        },
      }),
      // Add explicit price column before the auto-generated price columns
      columnHelper.column({
        id: 'price',
        name: headers.price,
        header: headers.price,
        field: (context) =>
          `variants.${context.row.original.originalIndex}.prices.default`,
        type: 'text',
        cell: (context) => {
          // Use NumberCell instead of CurrencyCell to avoid the error
          return <DataGrid.NumberCell context={context} />;
        },
      }),
      columnHelper.column({
        id: 'estimated_seller_amount',
        name: headers.estimatedSellerAmount,
        header: headers.estimatedSellerAmount,
        cell: (context) => {
          const estimatedAmount = estimateSellerAmount(
            context.row.original.prices?.default
          );

          return (
            <DataGrid.ReadonlyCell context={context}>
              <div className='flex flex-col'>
                <span className='txt-compact-small text-ui-fg-base'>
                  {estimatedAmount === null
                    ? '-'
                    : formatEstimateAmount(estimatedAmount)}
                </span>
               
              </div>
            </DataGrid.ReadonlyCell>
          );
        },
      }),
      ...createDataGridPriceColumns<
        ProductCreateVariantSchema & { originalIndex: number },
        ProductCreateSchemaType
      >({
        currencies,
        regions,
        pricePreferences,
        getFieldName: (context, value) => {
          if (
            context.column.id?.startsWith('currency_prices')
          ) {
            return `variants.${context.row.original.originalIndex}.prices.${value}`;
          }
          return `variants.${context.row.original.originalIndex}.prices.${value}`;
        },
        t,
      }),
    ],
    [
      currencies,
      regions,
      options,
      pricePreferences,
      t,
      stockLocationOptions,
      headers.estimatedSellerAmount,
      effectiveCommissionRate,
    ]
  );
};
