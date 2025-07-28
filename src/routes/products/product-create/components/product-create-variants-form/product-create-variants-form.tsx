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

  // Polish translations for column headers
  const polishHeaders = {
    options: 'Opcje',
    title: 'Nazwa',
    sku: 'SKU',
    ean: 'EAN',
    barcode: 'Kod kreskowy',
    manage_inventory: 'Zarządzaj zapasami',
    allow_backorder: 'Zezwalaj na zamówienia oczekujące',
    price: 'Cena (PLN)',
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
        name: polishHeaders.title,
        header: polishHeaders.title,
        field: (context) =>
          `variants.${context.row.original.originalIndex}.title`,
        type: 'text',
        cell: (context) => {
          return <DataGrid.TextCell context={context} />;
        },
      }),
      columnHelper.column({
        id: 'sku',
        name: polishHeaders.sku,
        header: polishHeaders.sku,
        field: (context) =>
          `variants.${context.row.original.originalIndex}.sku`,
        type: 'text',
        cell: (context) => {
          return <DataGrid.TextCell context={context} />;
        },
      }),
      columnHelper.column({
        id: 'ean',
        name: polishHeaders.ean,
        header: polishHeaders.ean,
        field: (context) =>
          `variants.${context.row.original.originalIndex}.ean`,
        type: 'text',
        cell: (context) => {
          return <DataGrid.TextCell context={context} />;
        },
      }),
      columnHelper.column({
        id: 'barcode',
        name: polishHeaders.barcode,
        header: polishHeaders.barcode,
        field: (context) =>
          `variants.${context.row.original.originalIndex}.barcode`,
        type: 'text',
        cell: (context) => {
          return <DataGrid.TextCell context={context} />;
        },
      }),

      columnHelper.column({
        id: 'manage_inventory',
        name: polishHeaders.manage_inventory,
        header: polishHeaders.manage_inventory,
        field: (context) =>
          `variants.${context.row.original.originalIndex}.manage_inventory`,
        type: 'boolean',
        cell: (context) => {
          return <DataGrid.BooleanCell context={context} />;
        },
      }),
      columnHelper.column({
        id: 'allow_backorder',
        name: polishHeaders.allow_backorder,
        header: polishHeaders.allow_backorder,
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
        name: polishHeaders.price,
        header: polishHeaders.price,
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
