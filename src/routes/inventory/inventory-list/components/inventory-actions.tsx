import { PencilSquare, Trash } from "@medusajs/icons"

import { ActionMenu } from "../../../../components/common/action-menu"
import { InventoryItemDTO } from "@medusajs/types"
import { useDeleteInventoryItem } from "../../../../hooks/api/inventory"
import { usePrompt, toast } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

export const InventoryActions = ({ item }: { item: InventoryItemDTO }) => {
  const { t } = useTranslation()
  const prompt = usePrompt()
  const { mutateAsync } = useDeleteInventoryItem(item.id)

  const handleDelete = async () => {
    const res = await prompt({
      title: t("general.areYouSure"),
      description: t("inventory.deleteWarning"),
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
    })

    if (!res) {
      return
    }

    try {
      await mutateAsync()
      toast.success(t("inventory.deleteSuccess"))
    } catch (error: any) {
      // Check if error is about inventory levels
      if (error.message?.includes("inventory level")) {
        toast.error(t("inventory.deleteErrorHasLevels"))
      } else {
        toast.error(error.message || t("inventory.deleteError"))
      }
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
              to: `${item.id}/edit`,
            },
          ],
        },
        {
          actions: [
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
