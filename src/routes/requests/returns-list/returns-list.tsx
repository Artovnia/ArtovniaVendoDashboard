import { Badge, Button, Heading, Table, Text } from "@medusajs/ui"
import { useNavigate } from "react-router-dom"
import { useState, useEffect, useMemo } from "react"
import { useVendorReturnRequests } from "../../../hooks/api/return-requests"
import { useDate } from "../../../hooks/use-date"
import { fetchReturnReasons } from "../../../services/return-reasons"
import { useTranslation } from "react-i18next"

// Status badges configuration for return requests
const getStatusBadge = (status: string, t: (key: string) => string) => {
  switch (status) {
    case "pending":
      return <Badge color="orange">{t('requests.returns.status.pending')}</Badge>
    case "approved":
      return <Badge color="green">{t('requests.returns.status.approved')}</Badge>
    case "refunded":
      return <Badge color="green">{t('requests.returns.status.refunded')}</Badge>
    case "escalated":
      return <Badge color="red">{t('requests.returns.status.escalated')}</Badge>
    case "withdrawn":
      return <Badge color="grey">{t('requests.returns.status.withdrawn')}</Badge>
    default:
      return <Badge color="grey">{status}</Badge>
  }
}

export const ReturnsList = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  // State for status filtering
  const [statusFilter, setStatusFilter] = useState<string>("") 
  const { getFullDate } = useDate()
  
  // State to store return reasons mapping
  const [returnReasons, setReturnReasons] = useState<Record<string, string>>({})
  
  // Fetch return reasons
  useEffect(() => {
    const loadReturnReasons = async () => {
      try {
        const reasons = await fetchReturnReasons()
        const reasonMap: Record<string, string> = {}
        reasons.forEach((reason: any) => {
          reasonMap[reason.id] = reason.label
        })
        setReturnReasons(reasonMap)
      } catch (error) {
        console.error("Error loading return reasons:", error)
      }
    }
    
    loadReturnReasons()
  }, [])
  
  // Fetch ALL return requests without filtering
  const { return_requests: allReturnRequests, isLoading } = useVendorReturnRequests({
    filters: {}, // No filters - get all data
  })
  
  // Client-side filtering
  const return_requests = useMemo(() => {
    if (!allReturnRequests) return []
    
    if (statusFilter === "") {
      return allReturnRequests // Show all
    }
    
    if (statusFilter === "pending") {
      return allReturnRequests.filter(request => request.status === "pending")
    }
    
    if (statusFilter === "approved,refunded") {
      return allReturnRequests.filter(request => 
        request.status === "approved" || request.status === "refunded"
      )
    }
    
    return allReturnRequests.filter(request => request.status === statusFilter)
  }, [allReturnRequests, statusFilter])
  
  // Debug logging
  console.log("Status filter:", statusFilter)
  console.log("All requests:", allReturnRequests?.length || 0)
  console.log("Filtered requests:", return_requests?.length || 0)
  console.log("Status distribution:", allReturnRequests?.reduce((acc, req) => {
    acc[req.status] = (acc[req.status] || 0) + 1
    return acc
  }, {} as Record<string, number>))
  
  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Text size="base">{t('requests.returns.loading')}</Text>
      </div>
    )
  }
  
  const handleRowClick = (id: string) => {
    navigate(`/requests/returns/${id}`)
  }

  return (
    <div className="flex h-full flex-col gap-y-4 p-8">
      <div className="flex justify-between items-center">
        <Heading level="h1">{t('requests.returns.title')}</Heading>
        <div className="inline-flex rounded-md shadow-sm">
          <Button
            className="rounded-r-none"
            variant={statusFilter === "" ? "primary" : "secondary"}
            onClick={() => setStatusFilter("")}
          >
            {t('requests.returns.filter.all')}
          </Button>
          <Button
            className="rounded-none border-x-0"
            variant={statusFilter === "pending" ? "primary" : "secondary"}
            onClick={() => setStatusFilter("pending")}
          >
            {t('requests.returns.filter.pending')}
          </Button>
          <Button
            className="rounded-l-none"
            variant={statusFilter === "approved,refunded" ? "primary" : "secondary"}
            onClick={() => setStatusFilter("approved,refunded")}
          >
            {t('requests.returns.filter.approved')}
          </Button>
        </div>
      </div>
      
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>#</Table.HeaderCell>
            <Table.HeaderCell>{t('requests.returns.table.date')}</Table.HeaderCell>
            <Table.HeaderCell>{t('requests.returns.table.customer')}</Table.HeaderCell>
            <Table.HeaderCell>{t('requests.returns.table.customerNote')}</Table.HeaderCell>
            <Table.HeaderCell>{t('requests.returns.table.reason')}</Table.HeaderCell>
            <Table.HeaderCell>{t('requests.returns.table.status')}</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {return_requests && return_requests.length > 0 ? (
            return_requests.map((request, index) => (
              <Table.Row 
                key={request.id} 
                onClick={() => handleRowClick(request.id)}
                className="cursor-pointer hover:bg-ui-bg-base-hover"
              >
                <Table.Cell className="w-[50px]">
                  {index + 1}
                </Table.Cell>
                <Table.Cell>
                  {(() => {
                    if (!request.created_at) {
                      return "-"
                    }
                    
                    try {
                      const dateObj = request.created_at instanceof Date 
                        ? request.created_at 
                        : new Date(request.created_at)
                      
                      if (isNaN(dateObj.getTime())) {
                        return "-"
                      }
                      return getFullDate({ date: dateObj, includeTime: true })
                    } catch (e) {
                      console.error("Error formatting date:", e)
                      return "-"
                    }
                  })()}
                </Table.Cell>
                <Table.Cell>
                  {request.order?.customer ? `${request.order.customer.first_name} ${request.order.customer.last_name}` : "-"}
                </Table.Cell>
                <Table.Cell>
                  {request.customer_note || "-"}
                </Table.Cell>
                <Table.Cell>
                  {(() => {
                    if (!request.line_items || request.line_items.length === 0) {
                      return "-"
                    }
                    
                    // Count occurrences of each reason
                    const reasonCounts: Record<string, number> = {}
                    request.line_items.forEach((item: { reason_id?: string }) => {
                      if (item.reason_id) {
                        reasonCounts[item.reason_id] = (reasonCounts[item.reason_id] || 0) + 1
                      }
                    })
                    
                    // Find most common reason
                    let mostCommonReasonId = ""
                    let maxCount = 0
                    
                    Object.entries(reasonCounts).forEach(([reasonId, count]) => {
                      if (count > maxCount) {
                        mostCommonReasonId = reasonId
                        maxCount = count
                      }
                    })
                    
                    return mostCommonReasonId ? returnReasons[mostCommonReasonId] || 
                      `${t('requests.returns.table.reasonId')} #${mostCommonReasonId.substring(0, 8)}` : "-"
                  })()}
                </Table.Cell>
                <Table.Cell>{getStatusBadge(request.status, t)}</Table.Cell>
              </Table.Row>
            ))
          ) : (
            <Table.Row>
              <Table.Cell className="text-center" style={{ gridColumn: 'span 6 / span 6' }}>
                {t('requests.returns.noRequests')}
              </Table.Cell>
            </Table.Row>
          )}
        </Table.Body>
      </Table>
    </div>
  )
}