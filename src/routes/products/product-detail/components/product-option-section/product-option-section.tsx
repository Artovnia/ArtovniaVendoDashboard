import { PencilSquare, Plus, Trash } from "@medusajs/icons"
import { Badge, Container, Heading, usePrompt, Button, toast } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { ActionMenu } from "../../../../../components/common/action-menu"
import { SectionRow } from "../../../../../components/common/section"
import { useDeleteProductOption, useAddColorOption } from "../../../../../hooks/api/products"
import { HttpTypes } from "@medusajs/types"

const OptionActions = ({
  product,
  option,
}: {
  product: HttpTypes.AdminProduct
  option: HttpTypes.AdminProductOption
}) => {
  const { t } = useTranslation()
  const { mutateAsync } = useDeleteProductOption(product.id, option.id)
  const prompt = usePrompt()

  const handleDelete = async () => {
    const res = await prompt({
      title: t("general.areYouSure"),
      description: t("products.options.deleteWarning", {
        title: option.title,
      }),
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
    })

    if (!res) {
      return
    }

    await mutateAsync()
  }

  return (
    <ActionMenu
      groups={[
        {
          actions: [
            {
              label: t("actions.edit"),
              to: `options/${option.id}/edit`,
              icon: <PencilSquare />,
            },
          ],
        },
        {
          actions: [
            {
              label: t("actions.delete"),
              onClick: handleDelete,
              icon: <Trash />,
            },
          ],
        },
      ]}
    />
  )
}

type ProductOptionSectionProps = {
  product: HttpTypes.AdminProduct
}

export const ProductOptionSection = ({
  product,
}: ProductOptionSectionProps) => {
  const { t } = useTranslation()
  const { mutateAsync: addColorOption, isPending: isAddingColor } = useAddColorOption();

  // Check if the product already has a color option
  const hasColorOption = product.options?.some(
    (option) => option.title.toLowerCase() === "kolor"
  );

  const handleAddColorOption = async () => {
    try {
      await addColorOption(product.id);
      toast.success(t("products.options.colorOptionAdded", "Opcja koloru została dodana pomyślnie"));
    } catch (error) {
      console.error("Error adding color option:", error);
      toast.error(t("products.options.colorOptionError", "Nie udało się dodać opcji koloru"));
    }
  };

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("products.options.header")}</Heading>
        <div className="flex items-center gap-2">
          {!hasColorOption && (
            <Button
              variant="secondary"
              size="small"
              onClick={handleAddColorOption}
              isLoading={isAddingColor}
            >
              <Plus className="text-ui-fg-subtle" />
              <span className="ml-1">{t("products.options.addColorOption", "Dodaj opcję koloru")}</span>
              
            </Button>
          )}
          <ActionMenu
            groups={[
              {
                actions: [
                  {
                    label: t("actions.create"),
                    to: "options/create",
                    icon: <Plus />,
                  },
                ],
              },
            ]}
          />
        </div>
      </div>

      {product.options?.map((option) => {
        return (
          <SectionRow
            title={option.title}
            key={option.id}
            value={option.values?.map((val) => {
              return (
                <Badge
                  key={val.value}
                  size="2xsmall"
                  className="flex min-w-[20px] items-center justify-center"
                >
                  {val.value}
                </Badge>
              )
            })}
            actions={<OptionActions product={product} option={option} />}
          />
        )
      })}
    </Container>
  )
}
