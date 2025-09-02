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
      <DataGrid
        columns={columns}
        data={variantData}
        state={form}
        onEditingChange={(editing) =>
          setCloseOnEscape(!editing)
        }
      />
    </div>
  );
};

const columnHelper = createDataGridHelper<
  ProductCreateVariantSchema & { originalIndex: number },
  ProductCreateSchemaType
>();

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
  };

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
      columnHelper.column({
        id: 'sku',
        name: headers.sku,
        header: headers.sku,
        field: (context) =>
          `variants.${context.row.original.originalIndex}.sku`,
        type: 'text',
        cell: (context) => {
          return <DataGrid.TextCell context={context} />;
        },
      }),
      columnHelper.column({
        id: 'ean',
        name: headers.ean,
        header: headers.ean,
        field: (context) =>
          `variants.${context.row.original.originalIndex}.ean`,
        type: 'text',
        cell: (context) => {
          return <DataGrid.TextCell context={context} />;
        },
      }),
      columnHelper.column({
        id: 'barcode',
        name: headers.barcode,
        header: headers.barcode,
        field: (context) =>
          `variants.${context.row.original.originalIndex}.barcode`,
        type: 'text',
        cell: (context) => {
          return <DataGrid.TextCell context={context} />;
        },
      }),

      columnHelper.column({
        id: 'manage_inventory',
        name: headers.manage_inventory,
        header: headers.manage_inventory,
        field: (context) =>
          `variants.${context.row.original.originalIndex}.manage_inventory`,
        type: 'boolean',
        cell: (context) => {
          return <DataGrid.BooleanCell context={context} />;
        },
      }),
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
    [currencies, regions, options, pricePreferences, t]
  );
};
