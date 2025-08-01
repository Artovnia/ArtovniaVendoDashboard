import {
  BellAlert,
  BellAlertDone,
  InformationCircleSolid,
} from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { clx, Drawer, Heading, IconButton, Text } from "@medusajs/ui"
import { formatDistance } from "date-fns"
import { TFunction } from "i18next"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { notificationQueryKeys, useNotifications } from "../../../hooks/api"
import { fetchQuery } from "../../../lib/client"
import { FilePreview } from "../../common/file-preview"
import { InfiniteList } from "../../common/infinite-list"

interface NotificationData {
  title: string
  description?: string
  file?: {
    filename?: string
    url?: string
    mimeType?: string
  }
}

const LAST_READ_NOTIFICATION_KEY = "notificationsLastReadAt"

export const Notifications = () => {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [hasUnread, setHasUnread] = useUnreadNotifications()
  // This is used to show the unread icon on the notification when the drawer is open,
  // so it should lag behind the local storage data and should only be reset on close
  const [lastReadAt, setLastReadAt] = useState(
    localStorage.getItem(LAST_READ_NOTIFICATION_KEY)
  )

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "n" && (e.metaKey || e.ctrlKey)) {
        setOpen((prev) => !prev)
      }
    }

    document.addEventListener("keydown", onKeyDown)

    return () => {
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [])

  const handleOnOpen = (shouldOpen: boolean) => {
    if (shouldOpen) {
      setHasUnread(false)
      setOpen(true)
      localStorage.setItem(LAST_READ_NOTIFICATION_KEY, new Date().toISOString())
    } else {
      setOpen(false)
      setLastReadAt(localStorage.getItem(LAST_READ_NOTIFICATION_KEY))
    }
  }

  return (
    <Drawer open={open} onOpenChange={handleOnOpen}>
      <Drawer.Trigger asChild>
        <IconButton
          variant="transparent"
          className="text-ui-fg-muted hover:text-ui-fg-subtle"
        >
          {hasUnread ? <BellAlertDone /> : <BellAlert />}
        </IconButton>
      </Drawer.Trigger>
      <Drawer.Content>
        <Drawer.Header>
          <Drawer.Title asChild>
            <Heading>{t("notifications.domain")}</Heading>
          </Drawer.Title>
          <Drawer.Description className="sr-only">
            {t("notifications.accessibility.description")}
          </Drawer.Description>
        </Drawer.Header>
        <Drawer.Body className="overflow-y-auto px-0">
          <InfiniteList<
            HttpTypes.AdminNotificationListResponse,
            HttpTypes.AdminNotification,
            HttpTypes.AdminNotificationListParams
          >
            responseKey="notifications"
            queryKey={notificationQueryKeys.all}
            queryFn={(params) =>
              fetchQuery("/vendor/notifications", {
                method: "GET",
                query: params as Record<string, string | number>,
              })
            }
            queryOptions={{ enabled: open }}
            renderEmpty={() => <NotificationsEmptyState t={t} />}
            renderItem={(notification) => {
              return (
                <Notification
                  key={notification.id}
                  notification={notification}
                  unread={
                    Date.parse(notification.created_at) >
                    (lastReadAt ? Date.parse(lastReadAt) : 0)
                  }
                />
              )
            }}
          />
        </Drawer.Body>
      </Drawer.Content>
    </Drawer>
  )
}

const NOTIFICATION_TEMPLATES = {
  seller_product_collection_request_accepted_notification:
    "Twoja aplikacja o stworzenie kolekcji produktów została zaakceptowana",
  seller_product_collection_request_rejected_notification:
    "Twoja aplikacja o stworzenie kolekcji produktów została odrzucona",
  seller_new_order_notification: "Masz nowe zamówienie",
  seller_product_category_request_accepted_notification:
    "Twoja aplikacja o stworzenie kategorii produktów została zaakceptowana",
  seller_product_category_request_rejected_notification:
    "Twoja aplikacja o stworzenie kategorii produktów została odrzucona",
  seller_product_tag_request_accepted_notification:
    "Twoja aplikacja o stworzenie tagów produktów została zaakceptowana",
  seller_product_tag_request_rejected_notification:
    "Twoja aplikacja o stworzenie tagów produktów została odrzucona",
  seller_product_type_request_accepted_notification:
    "Twoja aplikacja o stworzenie typów produktów została zaakceptowana",
  seller_product_type_request_rejected_notification:
    "Twoja aplikacja o stworzenie typów produktów została odrzucona",
  seller_product_request_accepted_notification:
    "Twoja aplikacja o stworzenie produktu została zaakceptowana",
  seller_product_request_rejected_notification:
    "Twoja aplikacja o stworzenie produktu została odrzucona",
}

const Notification = ({
  notification,
  unread,
}: {
  notification: HttpTypes.AdminNotification
  unread?: boolean
}) => {
  const data = notification.data as unknown as NotificationData | undefined

  // We need at least the title to render a notification in the feed
  if (!notification.template) {
    return null
  }

  return (
    <>
      <div className="relative flex items-start justify-center gap-3 border-b p-6">
        <div className="text-ui-fg-muted flex size-5 items-center justify-center">
          <InformationCircleSolid />
        </div>
        <div className="flex w-full flex-col gap-y-3">
          <div className="flex flex-col">
            <div className="flex items-center justify-between">
              <Text size="small" leading="compact" weight="plus">
                {data?.title
                  ? data.title
                  : NOTIFICATION_TEMPLATES[
                      notification.template as keyof typeof NOTIFICATION_TEMPLATES
                    ]}
              </Text>
              <div className="align-center flex items-center justify-center gap-2">
                <Text
                  as={"span"}
                  className={clx("text-ui-fg-subtle", {
                    "text-ui-fg-base": unread,
                  })}
                  size="small"
                  leading="compact"
                  weight="plus"
                >
                  {formatDistance(notification.created_at, new Date(), {
                    addSuffix: true,
                  })}
                </Text>
                {unread && (
                  <div
                    className="bg-ui-bg-interactive h-2 w-2 rounded"
                    role="status"
                  />
                )}
              </div>
            </div>
            {data?.title &&
              !!NOTIFICATION_TEMPLATES[
                notification.template as keyof typeof NOTIFICATION_TEMPLATES
              ] && (
                <Text
                  className="text-ui-fg-subtle whitespace-pre-line"
                  size="small"
                >
                  {
                    NOTIFICATION_TEMPLATES[
                      notification.template as keyof typeof NOTIFICATION_TEMPLATES
                    ]
                  }
                </Text>
              )}
          </div>
          {!!data?.file?.url && (
            <FilePreview
              filename={data.file.filename ?? ""}
              url={data.file.url}
              hideThumbnail
            />
          )}
        </div>
      </div>
    </>
  )
}

const NotificationsEmptyState = ({ t }: { t: TFunction }) => {
  return (
    <div className="flex h-full flex-col items-center justify-center">
      <BellAlertDone />
      <Text size="small" leading="compact" weight="plus" className="mt-3">
        {t("notifications.emptyState.title")}
      </Text>
      <Text
        size="small"
        className="text-ui-fg-muted mt-1 max-w-[294px] text-center"
      >
        {t("notifications.emptyState.description")}
      </Text>
    </div>
  )
}

const useUnreadNotifications = () => {
  const [hasUnread, setHasUnread] = useState(false)
  const { notifications } = useNotifications(
    { limit: 1, offset: 0, fields: "created_at" },
    { refetchInterval: 60_000 }
  )
  const lastNotification = notifications?.[0]

  useEffect(() => {
    if (!lastNotification) {
      return
    }

    const lastNotificationAsTimestamp = Date.parse(lastNotification.created_at)

    const lastReadDatetime = localStorage.getItem(LAST_READ_NOTIFICATION_KEY)
    const lastReadAsTimestamp = lastReadDatetime
      ? Date.parse(lastReadDatetime)
      : 0

    if (lastNotificationAsTimestamp > lastReadAsTimestamp) {
      setHasUnread(true)
    }
  }, [lastNotification])

  return [hasUnread, setHasUnread] as const
}