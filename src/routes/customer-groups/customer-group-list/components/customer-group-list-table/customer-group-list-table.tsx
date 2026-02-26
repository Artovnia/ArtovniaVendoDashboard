import { PencilSquare, Trash } from '@medusajs/icons';
import { HttpTypes } from '@medusajs/types';
import {
  Container,
  createDataTableColumnHelper,
  toast,
  usePrompt,
} from '@medusajs/ui';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { DataTable } from '../../../../../components/data-table';
import { useDataTableDateFilters } from '../../../../../components/data-table/helpers/general/use-data-table-date-filters';
import { SingleColumnPage } from '../../../../../components/layout/pages';
import { useDashboardExtension } from '../../../../../extensions';
import {
  useCustomerGroups,
  useDeleteCustomerGroupLazy,
} from '../../../../../hooks/api';
import { TextCell } from '../../../../../components/table/table-cells/common/text-cell';

const PAGE_SIZE = 10;

type CustomerGroupListItem = {
  customer_group?: HttpTypes.AdminCustomerGroup;
};

export const CustomerGroupListTable = () => {
  const { t } = useTranslation();
  const { getWidgets } = useDashboardExtension();

  const columns = useColumns();
  const filters = useFilters();

  const {
    customer_groups,
    count,
    isPending,
    isError,
    error,
  } = useCustomerGroups();

  if (isError) {
    throw error;
  }

  const groups =
    (customer_groups as CustomerGroupListItem[] | undefined)
      ?.map((item) => item.customer_group)
      .filter(
        (group): group is HttpTypes.AdminCustomerGroup =>
          Boolean(group)
      ) ?? [];

  return (
    <SingleColumnPage
      widgets={{
        before: getWidgets('customer_group.list.before'),
        after: getWidgets('customer_group.list.after'),
      }}
    >
      <Container className='overflow-hidden p-0'>
        <DataTable
          data={groups}
          columns={columns}
          filters={filters}
          heading={t('customerGroups.domain')}
          subHeading={t('customerGroups.subtitle')}
          rowCount={count}
          getRowId={(row) => row.id}
          rowHref={(row) => {
            return `/customer-groups/${row.id}`;
          }}
          action={{
            label: t('actions.create'),
            to: '/customer-groups/create',
          }}
          emptyState={{
            empty: {
              heading: t(
                'customerGroups.list.empty.heading'
              ),
              description: t(
                'customerGroups.list.empty.description'
              ),
            },
            filtered: {
              heading: t(
                'customerGroups.list.filtered.heading'
              ),
              description: t(
                'customerGroups.list.filtered.description'
              ),
            },
          }}
          pageSize={PAGE_SIZE}
          isLoading={isPending}
        />
      </Container>
    </SingleColumnPage>
  );
};

const columnHelper =
  createDataTableColumnHelper<HttpTypes.AdminCustomerGroup>();

const useColumns = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const prompt = usePrompt();

  const { mutateAsync: deleteCustomerGroup } =
    useDeleteCustomerGroupLazy();

  const handleDeleteCustomerGroup = useCallback(
    async ({ id, name }: { id: string; name: string }) => {
      const res = await prompt({
        title: t('customerGroups.delete.title'),
        description: t(
          'customerGroups.delete.description',
          {
            name,
          }
        ),
        verificationText: name,
        verificationInstruction: t('general.typeToConfirm'),
        confirmText: t('actions.delete'),
        cancelText: t('actions.cancel'),
      });

      if (!res) {
        return;
      }

      await deleteCustomerGroup(
        { id },
        {
          onSuccess: () => {
            toast.success(
              t('customerGroups.delete.successToast', {
                name,
              })
            );
          },
          onError: (e) => {
            toast.error(e.message);
          },
        }
      );
    },
    [t, prompt, deleteCustomerGroup]
  );

  return useMemo(() => {
    return [
      columnHelper.accessor('name', {
        header: t('fields.name'),
        enableSorting: true,
        sortAscLabel: t(
          'filters.sorting.alphabeticallyAsc'
        ),
        sortDescLabel: t(
          'filters.sorting.alphabeticallyDesc'
        ),
        cell: ({ row }) => {
          return (
            <TextCell
              text={row.original.name || '-'}
            />
          );
        },
      }),
      columnHelper.accessor('customers', {
        header: t('customers.domain'),
        cell: ({ row }) => {
          return <span>{row.original.customers?.length ?? 0}</span>;
        },
      }),
      columnHelper.action({
        actions: [
          [
            {
              icon: <PencilSquare />,
              label: t('actions.edit'),
              onClick: ({ row }) => {
                navigate(
                  `/customer-groups/${row.original.id}/edit`
                );
              },
            },
          ],
          [
            {
              icon: <Trash />,
              label: t('actions.delete'),
              onClick: ({ row }) => {
                handleDeleteCustomerGroup({
                  id: row.original.id,
                  name: row.original.name ?? '',
                });
              },
            },
          ],
        ],
      }),
    ];
  }, [t, navigate, handleDeleteCustomerGroup]);
};

const useFilters = () => {
  const dateFilters = useDataTableDateFilters();

  return useMemo(() => {
    return dateFilters;
  }, [dateFilters]);
};