import { HttpTypes } from '@medusajs/types';
import { Button, Checkbox, toast } from '@medusajs/ui';
import { keepPreviousData } from '@tanstack/react-query';
import {
  RowSelectionState,
  Updater,
  createColumnHelper,
} from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as zod from 'zod';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  RouteFocusModal,
  useRouteModal,
} from '../../../../../components/modals';
import { _DataTable } from '../../../../../components/table/data-table';
import { KeyboundForm } from '../../../../../components/utilities/keybound-form';
import { useFulfillmentProviders } from '../../../../../hooks/api/fulfillment-providers';
import { useUpdateStockLocationFulfillmentProviders } from '../../../../../hooks/api/stock-locations';
import { useFulfillmentProviderTableColumns } from '../../../../../hooks/table/columns/use-fulfillment-provider-table-columns';
import { useDateTableFilters } from '../../../../../hooks/table/filters';
import { useFulfillmentProvidersTableQuery } from '../../../../../hooks/table/query/use-fulfillment-providers-table-query';
import { useDataTable } from '../../../../../hooks/use-data-table';

type LocationEditFulfillmentProvidersFormProps = {
  location: HttpTypes.AdminStockLocation;
};

const EditFulfillmentProvidersFormSchema = zod.object({
  fulfillment_providers: zod.array(zod.string()).optional(),
});

const PAGE_SIZE = 50;

export const LocationEditFulfillmentProvidersForm = ({
  location,
}: LocationEditFulfillmentProvidersFormProps) => {
  const { t } = useTranslation();
  const { handleSuccess } = useRouteModal();

  const form = useForm<
    zod.infer<typeof EditFulfillmentProvidersFormSchema>
  >({
    defaultValues: {
      fulfillment_providers:
        location.fulfillment_providers?.map(
          (fp) => fp.id
        ) ?? [],
    },
    resolver: zodResolver(
      EditFulfillmentProvidersFormSchema
    ),
  });

  const { setValue } = form;

  const initialState =
    location.fulfillment_providers?.reduce((acc, curr) => {
      acc[curr.id] = true;
      return acc;
    }, {} as RowSelectionState) ?? {};

  const [rowSelection, setRowSelection] =
    useState<RowSelectionState>(initialState);

  const handleRowSelectionChange = (
    updater: Updater<RowSelectionState>
  ) => {
    const ids =
      typeof updater === 'function'
        ? updater(rowSelection)
        : updater;

    setValue('fulfillment_providers', Object.keys(ids), {
      shouldDirty: true,
      shouldTouch: true,
    });

    setRowSelection(ids);
  };

  const { raw } = useFulfillmentProvidersTableQuery({
    pageSize: PAGE_SIZE,
  });

  const { fulfillment_providers, count, isLoading } =
    useFulfillmentProviders(
      {},
      { placeholderData: keepPreviousData }
    );

  const filters = useDateTableFilters();
  const columns = useColumns();

  const { table } = useDataTable({
    data: fulfillment_providers ?? [],
    columns,
    count,
    enablePagination: true,
    enableRowSelection: true,
    rowSelection: {
      state: rowSelection,
      updater: handleRowSelectionChange,
    },
    getRowId: (row) => row.id,
    pageSize: PAGE_SIZE,
  });

  const { mutateAsync, isPending: isMutating } =
    useUpdateStockLocationFulfillmentProviders(location.id);

  const handleSubmit = form.handleSubmit(async (data) => {
    const originalIds = location.fulfillment_providers?.map(
      (sc) => sc.id
    );

    const arr = data.fulfillment_providers ?? [];

    await mutateAsync(
      {
        add: arr.filter((i) => !originalIds?.includes(i)),
        remove: originalIds?.filter(
          (i) => !arr.includes(i)
        ),
      },
      {
        onSuccess: ({ stock_location }) => {
          toast.success(
            t(
              'stockLocations.fulfillmentProviders.successToast'
            )
          );
          handleSuccess(
            `/settings/locations/${stock_location.id}`
          );
        },
        onError: (e) => {
          toast.error(e.message);
        },
      }
    );
  });

  return (
    <RouteFocusModal.Form form={form}>
      <KeyboundForm
        onSubmit={handleSubmit}
        className='flex size-full flex-col'
      >
        <RouteFocusModal.Header />
        <RouteFocusModal.Body className='flex flex-1 flex-col overflow-auto'>
          <_DataTable
            table={table}
            columns={columns}
            pageSize={PAGE_SIZE}
            isLoading={isLoading}
            count={count}
            filters={filters}
            search='autofocus'
            pagination
            orderBy={[{ key: 'id', label: t('fields.id') }]}
            queryObject={raw}
            layout='fill'
          />
        </RouteFocusModal.Body>

        <RouteFocusModal.Footer>
          <div className='flex items-center justify-end gap-x-2'>
            <RouteFocusModal.Close asChild>
              <Button
                size='small'
                variant='secondary'
                type='button'
              >
                {t('actions.cancel')}
              </Button>
            </RouteFocusModal.Close>

            <Button
              size='small'
              isLoading={isMutating}
              type='submit'
            >
              {t('actions.save')}
            </Button>
          </div>
        </RouteFocusModal.Footer>
      </KeyboundForm>
    </RouteFocusModal.Form>
  );
};

const columnHelper =
  createColumnHelper<HttpTypes.AdminFulfillmentProvider>();

const useColumns = () => {
  const columns = useFulfillmentProviderTableColumns();

  return useMemo(
    () => [
      columnHelper.display({
        id: 'select',
        header: ({ table }) => {
          return (
            <Checkbox
              checked={
                table.getIsSomePageRowsSelected()
                  ? 'indeterminate'
                  : table.getIsAllPageRowsSelected()
              }
              onCheckedChange={(value) =>
                table.toggleAllPageRowsSelected(!!value)
              }
            />
          );
        },
        cell: ({ row }) => {
          return (
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) =>
                row.toggleSelected(!!value)
              }
              onClick={(e) => {
                e.stopPropagation();
              }}
            />
          );
        },
      }),
      ...columns,
    ],
    [columns]
  );
};