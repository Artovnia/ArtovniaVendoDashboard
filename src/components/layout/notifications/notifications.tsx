import {
  BellAlert,
  BellAlertDone,
  InformationCircleSolid,
} from '@medusajs/icons';
import { HttpTypes } from '@medusajs/types';
import {
  clx,
  Drawer,
  Heading,
  IconButton,
  Text,
} from '@medusajs/ui';
import { formatDistance } from 'date-fns';
import { TFunction } from 'i18next';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  notificationQueryKeys,
  useNotifications,
} from '../../../hooks/api';
import { sdk } from '../../../lib/client';
import { FilePreview } from '../../common/file-preview';
import { InfiniteList } from '../../common/infinite-list';

interface NotificationData {
  title: string;
  description?: string;
  file?: {
    filename?: string;
    url?: string;
    mimeType?: string;
  };
}

const LAST_READ_NOTIFICATION_KEY =
  'notificationsLastReadAt';

export const Notifications = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [hasUnread, setHasUnread] =
    useUnreadNotifications();
  // This is used to show the unread icon on the notification when the drawer is open,
  // so it should lag behind the local storage data and should only be reset on close
  const [lastReadAt, setLastReadAt] = useState(
    localStorage.getItem(LAST_READ_NOTIFICATION_KEY)
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'n' && (e.metaKey || e.ctrlKey)) {
        setOpen((prev) => !prev);
      }
    };

    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const handleOnOpen = (shouldOpen: boolean) => {
    if (shouldOpen) {
      setHasUnread(false);
      setOpen(true);
      localStorage.setItem(
        LAST_READ_NOTIFICATION_KEY,
        new Date().toISOString()
      );
    } else {
      setOpen(false);
      setLastReadAt(
        localStorage.getItem(LAST_READ_NOTIFICATION_KEY)
      );
    }
  };

  // Custom query function for vendor notifications
  const fetchVendorNotifications = async (
    params: { limit?: number; offset?: number; fields?: string[] }
  ): Promise<{ notifications: HttpTypes.AdminNotification[]; count: number; offset: number; limit: number }> => {
    const limit = params.limit || 20
    const offset = params.offset || 0
    const fields = params.fields

    try {
      // Construct query parameters
      const queryParams = new URLSearchParams()
      queryParams.append("limit", limit.toString())
      if (offset) {
        queryParams.append("offset", offset.toString())
      }
      if (fields?.length) {
        queryParams.append("fields", fields.join(","))
      }

      // Use the correct environment variable or fallback to a default
      const backendUrl = import.meta.env.VITE_MEDUSA_ADMIN_BACKEND_URL || 
                          "http://localhost:9000"
      
      // Construct the full URL
      const url = `${backendUrl}/vendor/notifications?${queryParams.toString()}`
      console.log("Fetching notifications from:", url)

      // Make the request with credentials to include authentication cookies
      const response = await fetch(url, {
        credentials: 'include', // Include cookies for authentication
      })

      if (!response.ok) {
        console.log(`Error fetching notifications: ${response.status} ${response.statusText}`)
        // Return empty notifications instead of throwing an error
        return { notifications: [], count: 0, offset, limit }
      }

      const { notifications, count } = await response.json()
      return { notifications, count, offset, limit }
    } catch (error) {
      console.log("Error fetching notifications:", error)
      // Return empty notifications instead of throwing an error
      return { notifications: [], count: 0, offset, limit }
    }
  };

  const renderNotification = (notification: HttpTypes.AdminNotification) => {
    const data = notification.data as unknown as
      | NotificationData
      | undefined;

    // We need at least the title to render a notification in the feed
    if (!data?.title) {
      return null;
    }

    return (
      <>
        <div className='relative flex items-start justify-center gap-3 border-b p-6'>
          <div className='text-ui-fg-muted flex size-5 items-center justify-center'>
            <InformationCircleSolid />
          </div>
          <div className='flex w-full flex-col gap-y-3'>
            <div className='flex flex-col'>
              <div className='flex items-center justify-between'>
                <Text
                  size='small'
                  leading='compact'
                  weight='plus'
                >
                  {data.title}
                </Text>
                <div className='align-center flex items-center justify-center gap-2'>
                  <Text
                    as={'span'}
                    className={clx('text-ui-fg-subtle', {
                      'text-ui-fg-base': Date.parse(notification.created_at) > (lastReadAt ? Date.parse(lastReadAt) : 0),
                    })}
                    size='small'
                    leading='compact'
                    weight='plus'
                  >
                    {formatDistance(
                      notification.created_at,
                      new Date(),
                      {
                        addSuffix: true,
                      }
                    )}
                  </Text>
                  {Date.parse(notification.created_at) > (lastReadAt ? Date.parse(lastReadAt) : 0) && (
                    <div
                      className='bg-ui-bg-interactive h-2 w-2 rounded'
                      role='status'
                    />
                  )}
                </div>
              </div>
              {!!data.description && (
                <Text
                  className='text-ui-fg-subtle whitespace-pre-line'
                  size='small'
                >
                  {data.description}
                </Text>
              )}
            </div>
            {!!data?.file?.url && (
              <FilePreview
                filename={data.file.filename ?? ''}
                url={data.file.url}
                hideThumbnail
              />
            )}
          </div>
        </div>
      </>
    );
  };

  return (
    <Drawer open={open} onOpenChange={handleOnOpen}>
      <Drawer.Trigger asChild>
        <IconButton
          variant='transparent'
          className='text-ui-fg-muted hover:text-ui-fg-subtle'
        >
          {hasUnread ? <BellAlertDone /> : <BellAlert />}
        </IconButton>
      </Drawer.Trigger>
      <Drawer.Content>
        <Drawer.Header>
          <Drawer.Title asChild>
            <Heading>{t('notifications.domain')}</Heading>
          </Drawer.Title>
          <Drawer.Description className='sr-only'>
            {t('notifications.accessibility.description')}
          </Drawer.Description>
        </Drawer.Header>
        <Drawer.Body className='overflow-y-auto px-0'>
          <InfiniteList<
            { notifications: HttpTypes.AdminNotification[]; count: number; offset: number; limit: number },
            HttpTypes.AdminNotification,
            { limit?: number; offset?: number; fields?: string[] }
          >
            responseKey='notifications'
            queryKey={notificationQueryKeys.all}
            queryFn={fetchVendorNotifications}
            queryOptions={{ enabled: open }}
            renderItem={renderNotification}
            renderEmpty={() => (
              <NotificationsEmptyState t={t} />
            )}
          />
        </Drawer.Body>
      </Drawer.Content>
    </Drawer>
  );
};

const NotificationsEmptyState = ({
  t,
}: {
  t: TFunction;
}) => {
  return (
    <div className='flex h-full flex-col items-center justify-center'>
      <BellAlertDone />
      <Text
        size='small'
        leading='compact'
        weight='plus'
        className='mt-3'
      >
        {t('notifications.emptyState.title')}
      </Text>
      <Text
        size='small'
        className='text-ui-fg-muted mt-1 max-w-[294px] text-center'
      >
        {t('notifications.emptyState.description')}
      </Text>
    </div>
  );
};

const useUnreadNotifications = () => {
  const [hasUnread, setHasUnread] = useState(false);
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

  return [hasUnread, setHasUnread] as const;
};
