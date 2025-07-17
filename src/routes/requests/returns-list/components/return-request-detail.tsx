import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useForm } from "react-hook-form"
import { useDate } from "../../../../hooks/use-date"
import {
  Badge,
  Button,
  Heading,
  Select,
  Table,
  Text,
  Textarea,
  toast,
} from "@medusajs/ui"
import { useVendorReturnRequest, useUpdateVendorReturnRequest } from "../../../../hooks/api/return-requests"
import { RouteDrawer } from "../../../../components/modals"
import { fetchReturnReasons } from "../../../../services/return-reasons"

// Status badges configuration for return requests
const getStatusBadge = (status: string) => {
  switch (status) {
    case "pending":
      return <Badge color="orange">Oczekujący</Badge>
    case "approved":
      return <Badge color="green">Zatwierdzony</Badge>
    case "refunded":
      return <Badge color="green">Zwrócony</Badge>
    case "escalated":
      return <Badge color="red">Eskalowany</Badge>
    case "withdrawn":
      return <Badge color="grey">Odrzucony</Badge>
    default:
      return <Badge color="grey">{status}</Badge>
  }
}

// Status badges configuration for return requests

// Find proper item name from order items
const getItemName = (returnItem: any, returnRequest: any) => {
  if (returnItem.title) {
    return returnItem.title
  }
  
  // Try to find matching item in order items using line_item_id
  if (returnRequest.order?.items) {
    const orderItem = returnRequest.order.items.find(
      (item: any) => item.id === returnItem.line_item_id
    )
    
    if (orderItem) {
      // Prefer just product name instead of variant name
      if (orderItem.variant?.product?.title) {
        return orderItem.variant.product.title
      }
      return orderItem.title || `Produkt ${returnItem.line_item_id.substring(0, 8)}`
    }
  }
  
  return `Produkt ${returnItem.line_item_id.substring(0, 8)}`
}

type FormValues = {
  status: "refunded" | "withdrawn" | "escalated"
  vendor_reviewer_note: string
}

export const ReturnRequestDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getFullDate } = useDate()
  
  const form = useForm<FormValues>({
    defaultValues: {
      status: "refunded",
      vendor_reviewer_note: "",
    },
  })
  
  const { register, handleSubmit, formState: { errors } } = form
  
  const { return_request, isLoading, refetch } = useVendorReturnRequest(id || "")
  const { updateReturnRequest } = useUpdateVendorReturnRequest()
  
  // State to hold return reasons
  const [returnReasons, setReturnReasons] = useState<{id: string, value: string, label: string}[]>([])
  
  // Fetch return reasons
  useEffect(() => {
    const getReturnReasons = async () => {
      try {
        const reasons = await fetchReturnReasons()
        setReturnReasons(reasons)
      } catch (error) {
        console.error("Error fetching return reasons:", error)
      }
    }
    
    getReturnReasons()
  }, [])
  
  // Debug date values
  console.log("Detail view return_request:", return_request?.id, "created_at:", return_request?.created_at)
  if (return_request?.created_at) {
    console.log("Detail view date type:", typeof return_request.created_at, 
              "instanceof Date:", return_request.created_at instanceof Date,
              "date string:", return_request.created_at.toString())
  }
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  if (isLoading) {
    return (
      <RouteDrawer>
        <RouteDrawer.Header>
          <Heading>Szczegóły prośby o zwrot</Heading>
        </RouteDrawer.Header>
        <div className="flex h-full w-full items-center justify-center">
         
        </div>
      </RouteDrawer>
    )
  }

  if (!return_request) {
    return (
      <RouteDrawer>
        <RouteDrawer.Header>
          <Heading>Nie znaleziono prośby o zwrot</Heading>
        </RouteDrawer.Header>
        <div className="flex h-full w-full items-center justify-center">
          <Text>Żądana prośba o zwrot nie została znaleziona.</Text>
        </div>
      </RouteDrawer>
    )
  }

  // Only allow actions on pending requests
  const canUpdate = return_request.status === "pending"

  const onSubmit = async (data: FormValues) => {
    if (!id) return
    
    setIsSubmitting(true)
    
    try {
      const updateData = {
        status: data.status as "refunded" | "withdrawn" | "escalated",
        vendor_reviewer_note: data.vendor_reviewer_note
      }
      
      await updateReturnRequest(id, updateData)
      
      toast.success("Prośba o zwrot została zaktualizowana", {
        duration: 2000,
        action: {
          label: "Ok",
          onClick: () => {},
          altText: "Potwierdzenie aktualizacji",
        },
      })
      
      refetch()
      navigate("/requests/returns")
    } catch (error: any) {
      toast.error(error.message || "Nie udało się zaktualizować prośby o zwrot", {
        duration: 5000,
        action: {
          label: "Spróbuj ponownie",
          onClick: () => {},
          altText: "Spróbuj ponownie",
        },
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const hasReturnReasons = return_request.line_items && return_request.line_items.length > 0
  
  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <Heading>Prośba o zwrot #{return_request.id.substring(0, 8)}</Heading>
      </RouteDrawer.Header>
      <RouteDrawer.Body className="flex flex-col gap-y-8 p-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <Heading level="h2" className="mb-4">Informacje o kliencie</Heading>
            <div className="flex flex-col gap-y-2">
              <div>
                <Text className="text-ui-fg-subtle">Nazwa</Text>
                <Text className="font-medium">
                  {return_request.order?.customer ? `${return_request.order.customer.first_name} ${return_request.order.customer.last_name}` : "-"}
                </Text>
              </div>
              <div>
                <Text className="text-ui-fg-subtle">Email</Text>
                <Text className="font-medium">{return_request.order?.customer?.email || "-"}</Text>
              </div>
              <div>
                <Text className="text-ui-fg-subtle">Numer zamówienia</Text>
                <Text className="font-medium">
                  {return_request.order ? `#${return_request.order.display_id}` : `-`}
                </Text>
              </div>
              <div>
                <Text className="text-ui-fg-subtle">ID zamówienia</Text>
                <Text className="font-medium">{return_request.order?.id.substring(0, 8) || "-"}</Text>
              </div>
            </div>
          </div>
          <div>
            <Heading level="h2" className="mb-4">Szczegóły prośby o zwrot</Heading>
            <div className="flex flex-col gap-y-2">
              <div>
                <Text className="text-ui-fg-subtle">Status</Text>
                <div>{getStatusBadge(return_request.status)}</div>
              </div>
              <div>
                <Text className="text-ui-fg-subtle">Data utworzenia</Text>
                <Text className="font-medium">
                  {(() => {
                    console.log("About to format date in detail view:", return_request.created_at)
                    
                    // Ensure we have a valid date
                    if (!return_request.created_at) {
                      return "-"
                    }
                    
                    // If it's already a Date object, use it
                    if (return_request.created_at instanceof Date) {
                      return getFullDate({ date: return_request.created_at, includeTime: true })
                    }
                    
                    // Otherwise convert from string
                    try {
                      const dateObj = new Date(return_request.created_at)
                      if (isNaN(dateObj.getTime())) {
                        return "-"
                      }
                      return getFullDate({ date: dateObj, includeTime: true })
                    } catch (e) {
                      console.error("Error formatting date:", e)
                      return "-"
                    }
                  })()}
                </Text>
              </div>
              <div>
                <Text className="text-ui-fg-subtle">Notatka klienta</Text>
                <Text className="font-medium">{return_request.customer_note || "-"}</Text>
              </div>
            </div>
          </div>
        </div>

        {hasReturnReasons && (
          <div>
            <Heading level="h2" className="mb-4">Przedmioty prośby o zwrot</Heading>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Nazwa przedmiotu</Table.HeaderCell>
                  <Table.HeaderCell>Tytuł</Table.HeaderCell>
                  <Table.HeaderCell>Przyczyna zwrotu</Table.HeaderCell>
                  <Table.HeaderCell className="text-right">Ilość</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {return_request.line_items.map((item) => (
                  <Table.Row key={item.id}>
                    <Table.Cell>{getItemName(item, return_request)}</Table.Cell>
                    <Table.Cell>
                      {item.reason_id ? (
                        returnReasons.find(reason => reason.id === item.reason_id)?.label || 
                        `Przyczyna #${item.reason_id.substring(0, 8)}`
                      ) : "Nie podano przyczyny"}
                    </Table.Cell>
                    <Table.Cell className="text-right">{item.quantity}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </div>
        )}

        {canUpdate && (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-y-8 pt-8 border-t border-ui-border-base">
              <Heading level="h2">Odpowiedź sprzedawcy</Heading>
              
              <div className="space-y-2">
                <label htmlFor="status" className="text-sm font-medium">Status</label>
                <Select
                  onValueChange={(value) => form.setValue("status", value as "refunded" | "withdrawn" | "escalated")}
                  defaultValue={"refunded"}
                >
                  <Select.Trigger>
                    <Select.Value placeholder="Wybierz status" />
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value="refunded">Zatwierdź i zwróć</Select.Item>
                    <Select.Item value="withdrawn">Odrzuć</Select.Item>
                    <Select.Item value="escalated">Eskaluj do administracji</Select.Item>
                  </Select.Content>
                </Select>
                <input type="hidden" {...register("status", { required: true })} />
                {errors.status && (
                  <p className="text-ui-fg-error text-xs mt-1">Status jest wymagany</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="vendor_reviewer_note" className="text-sm font-medium">Komentarze</label>
                <Textarea
                  placeholder="Dodaj notatkę o tej prośbie o zwrot"
                  {...register("vendor_reviewer_note", { required: true })}
                />
                {errors.vendor_reviewer_note && (
                  <p className="text-ui-fg-error text-xs mt-1">Komentarz jest wymagany</p>
                )}
              </div>
              
              <div className="flex justify-end gap-x-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate("/requests/returns")}
                >
                  Anuluj
                </Button>
                <Button type="submit" isLoading={isSubmitting}>
                  Wyślij odpowiedź
                </Button>
              </div>
            </form>
        )}
        
        {!canUpdate && (
          <div className="flex flex-col gap-y-4 pt-8 border-t border-ui-border-base">
            <Heading level="h2">Odpowiedź sprzedawcy</Heading>
            
            <div className="flex flex-col gap-y-2">
              <div>
                <Text className="text-ui-fg-subtle">Status</Text>
                <div>{getStatusBadge(return_request.status)}</div>
              </div>
              {return_request.vendor_reviewer_note && (
                <div>
                  <Text className="text-ui-fg-subtle">Notatka sprzedawcy</Text>
                  <Text className="font-medium">{return_request.vendor_reviewer_note || "-"}</Text>
                </div>
              )}
              <div>
                <Text className="text-ui-fg-subtle">Data weryfikacji</Text>
                <Text className="font-medium">
                  {(() => {
                    console.log("About to format vendor_review_date:", return_request.vendor_review_date)
                    
                    // Ensure we have a valid date
                    if (!return_request.vendor_review_date) {
                      return "-"
                    }
                    
                    // If it's already a Date object, use it
                    if (return_request.vendor_review_date instanceof Date) {
                      return getFullDate({ date: return_request.vendor_review_date, includeTime: true })
                    }
                    
                    // Otherwise convert from string
                    try {
                      const dateObj = new Date(return_request.vendor_review_date)
                      if (isNaN(dateObj.getTime())) {
                        return "-"
                      }
                      return getFullDate({ date: dateObj, includeTime: true })
                    } catch (e) {
                      console.error("Error formatting date:", e)
                      return "-"
                    }
                  })()}
                </Text>
              </div>
            </div>
            
            <div className="flex justify-end mt-4">
              <Button
                variant="secondary"
                onClick={() => navigate("/requests/returns")}
              >
                Powrót do listy
              </Button>
            </div>
          </div>
        )}
      </RouteDrawer.Body>
    </RouteDrawer>
  )
}
