import { PencilSquare, Trash } from "@medusajs/icons"
import { HttpTypes, PromotionDTO } from "@medusajs/types"
import { Button, Container, Heading, usePrompt } from "@medusajs/ui"
import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Link, Outlet, useNavigate } from "react-router-dom"

import { ActionMenu } from "../../../../../components/common/action-menu"
import { _DataTable } from "../../../../../components/table/data-table"
import {
  useDeletePromotion,
  usePromotions,
} from "../../../../../hooks/api/promotions"
import { usePromotionTableColumns } from "../../../../../hooks/table/columns/use-promotion-table-columns"
import { usePromotionTableFilters } from "../../../../../hooks/table/filters/use-promotion-table-filters"
import { usePromotionTableQuery } from "../../../../../hooks/table/query/use-promotion-table-query"
import { useDataTable } from "../../../../../hooks/use-data-table"

const PAGE_SIZE = 20

export const PromotionListTable = () => {
  const { t } = useTranslation()

  const { raw } = usePromotionTableQuery({
    pageSize: PAGE_SIZE,
  })
  const {
    promotions: data,
    count,
    isLoading,
    isError,
    error,
  } = usePromotions({
    fields: "+status",
  })

  const promotions = data?.filter((item) => item !== null)

  const filters = usePromotionTableFilters()
  const columns = useColumns()

  const { table } = useDataTable({
    data: (promotions ?? []) as HttpTypes.AdminPromotion[],
    columns: columns as any,
    count,
    enablePagination: true,
    pageSize: PAGE_SIZE,
    getRowId: (row) => row.id,
  })

  if (isError) {
    throw error
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("promotions.domain")}</Heading>

        <Button size="small" variant="secondary" asChild>
          <Link to="create">{t("actions.create")}</Link>
        </Button>
      </div>

      <_DataTable
        table={table}
        columns={columns}
        count={count}
        pageSize={PAGE_SIZE}
        filters={filters}
        search
        pagination
        isLoading={isLoading}
        queryObject={raw}
        navigateTo={(row) => `${row.original.id}`}
        orderBy={[
          {
            key: "created_at",
            label: t("fields.createdAt"),
          },
          {
            key: "updated_at",
            label: t("fields.updatedAt"),
          },
        ]}
      />
      <Outlet />
    </Container>
  )
}

const PromotionActions = ({ promotion }: { promotion: PromotionDTO }) => {
  const { t } = useTranslation()
  const prompt = usePrompt()
  const navigate = useNavigate()
  const { mutateAsync } = useDeletePromotion(promotion.id)

  const handleDelete = async () => {
    const res = await prompt({
      title: t("general.areYouSure"),
      description: t("promotions.deleteWarning", {
        code: promotion.code!,
      }),
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
      verificationInstruction: t("general.typeToConfirm"),
      verificationText: promotion.code,
    })

    if (!res) {
      return
    }

    try {
      await mutateAsync(undefined, {
        onSuccess: () => {
          navigate("/promotions", { replace: true })
        },
      })
    } catch {
      throw new Error(
        `Promotion with code ${promotion.code} could not be deleted`
      )
    }
  }

  return (
    <ActionMenu
      groups={[
        {
          actions: [
            {
              icon: <PencilSquare />,
              label: t("actions.edit"),
              to: `/promotions/${promotion.id}/edit`,
            },
            {
              icon: <Trash />,
              label: t("actions.delete"),
              onClick: handleDelete,
            },
          ],
        },
      ]}
    />
  )
}

const columnHelper = createColumnHelper<PromotionDTO>()

const useColumns = () => {
  const base = usePromotionTableColumns()

  return useMemo(
    () => [
      ...base,
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => {
          return <PromotionActions promotion={row.original} />
        },
      }),
    ],
    [base]
  )
}