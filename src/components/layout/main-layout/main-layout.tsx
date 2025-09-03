import {
  Buildings,
  ChevronDownMini,
  CogSixTooth,
  CurrencyDollar,
  MagnifyingGlass,
  MinusMini,
  ReceiptPercent,
  ShoppingCart,
  Tag,
  Users,
  Component,
  Star,
  ListCheckbox,
  ChatBubbleLeftRight,
  Calendar,
} from '@medusajs/icons';
import { Divider, Text, clx } from '@medusajs/ui';
import { Collapsible as RadixCollapsible } from 'radix-ui';
import { useTranslation } from 'react-i18next';

import { Skeleton } from '../../common/skeleton';
import { INavItem, NavItem } from '../../layout/nav-item';
import { Shell } from '../../layout/shell';

import { useLocation } from 'react-router-dom';
import { useMe } from '../../../hooks/api';
import { useUnreadMessages } from '../../../hooks/api/useUnreadMessages';

import { useSearch } from '../../../providers/search-provider';
import { NotificationBadge } from '../../common/notification-badge';
import { UserMenu } from '../user-menu';
import { StripeIcon } from '../../../assets/icons/Stripe';

export const MainLayout = () => {
  return (
    <Shell>
      <MainSidebar />
    </Shell>
  );
};

const MainSidebar = () => {
  return (
    <aside className='flex flex-1 flex-col justify-between overflow-y-auto'>
      <div className='flex flex-1 flex-col'>
        <div className='bg-ui-bg-subtle sticky top-0'>
          <Header />
          <div className='px-3'>
            <Divider variant='dashed' />
          </div>
        </div>
        <div className='flex flex-1 flex-col justify-between'>
          <div className='flex flex-1 flex-col'>
            <CoreRouteSection />
            <ExtensionRouteSection />
          </div>
          <UtilitySection />
        </div>
        <div className='bg-ui-bg-subtle sticky bottom-0'>
          <UserSection />
        </div>
      </div>
    </aside>
  );
};

const Header = () => {
  const { seller } = useMe();

  const name = seller?.name || '';
  const fallback = seller?.photo || 'M';

  return (
    <div className='bg-ui-bg-subtle grid grid-cols-[24px_1fr_15px] items-center gap-x-3 w-full p-3 pr-2'>
      {fallback ? (
        <div className='w-6 h-6'>
          <img src={seller?.photo || '/logo.svg'} />
        </div>
      ) : (
        <Skeleton className='h-6 w-6 rounded-md' />
      )}
      <div className='block overflow-hidden text-left'>
        {name ? (
          <Text
            size='small'
            weight='plus'
            leading='compact'
            className='truncate'
          >
            {name}
          </Text>
        ) : (
          <Skeleton className='h-[9px] w-[120px]' />
        )}
      </div>
    </div>
  );
};

const useCoreRoutes = (): Omit<INavItem, 'pathname'>[] => {
  const { t } = useTranslation('translation', { useSuspense: false });
  const { data: unreadMessagesData } = useUnreadMessages();
  const unreadCount = unreadMessagesData?.unreadCount || 0;

  return [
    {
      icon: <Component />,
      label: t('navigation.dashboard'),
      to: '/dashboard',
    },
    {
      icon: <ShoppingCart />,
      label: t('orders.domain'),
      to: '/orders',
      items: [
        // TODO: Enable when domin is introduced
        // {
        //   label: t("draftOrders.domain"),
        //   to: "/draft-orders",
        // },
      ],
    },
    {
      icon: <Tag />,
      label: t('products.domain'),
      to: '/products',
      items: [
        {
          label: t('collections.domain'),
          to: '/collections',
        },
        {
          label: t('categories.domain'),
          to: '/categories',
        },
        // TODO: Enable when domin is introduced
        // {
        //   label: t("giftCards.domain"),
        //   to: "/gift-cards",
        // },
      ],
    },
    {
      icon: <Buildings />,
      label: t('inventory.domain'),
      to: '/inventory',
      items: [
        {
          label: t('reservations.domain'),
          to: '/reservations',
        },
      ],
    },
    {
      icon: <Users />,
      label: t('customers.domain'),
      to: '/customers',
      items: [
        {
          label: t('customerGroups.domain'),
          to: '/customer-groups',
        },
      ],
    },
    {
      icon: <ReceiptPercent />,
      label: t('promotions.domain'),
      to: '/promotions',
      items: [
        {
          label: t('campaigns.domain'),
          to: '/campaigns',
        },
      ],
    },
    {
      icon: <CurrencyDollar />,
      label: t('priceLists.domain'),
      to: '/price-lists',
    },
    {
      icon: <Star />,
      label: t('navigation.reviews', 'Reviews'),
      to: '/reviews',
    },
    {
      icon: <ChatBubbleLeftRight />,
      label: t('navigation.messages', 'Messages'),
      to: '/messages',
      endIcon: unreadCount > 0 ? <NotificationBadge count={unreadCount} showCount className="ml-2"/> : undefined,
    },
    {
      icon: <ListCheckbox />,
      label: t('navigation.requests', 'Requests'),
      to: '/requests',
    },
    {
      icon: <Calendar />,
      label: t('navigation.holidayMode', 'Holiday Mode'),
      to: '/holiday-mode',
    },
  ];
};

const useExtensionRoutes = (): Omit<
  INavItem,
  'pathname'
>[] => {
  const { t } = useTranslation('translation', { useSuspense: false });
  return [
    {
      icon: <CurrencyDollar />,
      label: t('navigation.payoutAccount', 'Payout Account'),
      to: '/payout-provider-select',
    },
    {
      icon: <ReceiptPercent />,
      label: t('navigation.earnings', 'Zarobki i Wypłaty'),
      to: '/payout/earnings',
    },
  ];
};

const Searchbar = () => {
  const { t } = useTranslation();
  const { toggleSearch } = useSearch();

  return (
    <div className='px-3'>
      <button
        onClick={toggleSearch}
        className={clx(
          'bg-ui-bg-subtle text-ui-fg-subtle flex w-full items-center gap-x-2.5 rounded-md px-2 py-1 outline-none',
          'hover:bg-ui-bg-subtle-hover',
          'focus-visible:shadow-borders-focus'
        )}
      >
        <MagnifyingGlass />
        <div className='flex-1 text-left'>
          <Text
            size='small'
            leading='compact'
            weight='plus'
          >
            {t('app.search.label')}
          </Text>
        </div>
        <Text
          size='small'
          leading='compact'
          className='text-ui-fg-muted'
        >
          ⌘K
        </Text>
      </button>
    </div>
  );
};

const CoreRouteSection = () => {
  const coreRoutes = useCoreRoutes();

  return (
    <nav className='flex flex-col gap-y-1 py-3'>
      <Searchbar />
      {coreRoutes.map((route) => {
        return <NavItem key={route.to} {...route} />;
      })}
    </nav>
  );
};

const ExtensionRouteSection = () => {
  const extensionRoutes = useExtensionRoutes();
  const { t } = useTranslation();

  if (!extensionRoutes.length) return null;

  return (
    <div>
      <div className='px-3'>
        <Divider variant='dashed' />
      </div>
      <div className='flex flex-col gap-y-1 py-3'>
        <RadixCollapsible.Root defaultOpen>
          <div className='px-4'>
            <RadixCollapsible.Trigger
              asChild
              className='group/trigger'
            >
              <button className='text-ui-fg-subtle flex w-full items-center justify-between px-2'>
                <Text
                  size='xsmall'
                  weight='plus'
                  leading='compact'
                >
                  {t('app.nav.common.extensions')}
                </Text>
                <div className='text-ui-fg-muted'>
                  <ChevronDownMini className='group-data-[state=open]/trigger:hidden' />
                  <MinusMini className='group-data-[state=closed]/trigger:hidden' />
                </div>
              </button>
            </RadixCollapsible.Trigger>
          </div>
          <RadixCollapsible.Content>
            <nav className='flex flex-col gap-y-0.5 py-1 pb-4'>
              {extensionRoutes.map((route) => {
                return (
                  <NavItem key={route.to} {...route} />
                );
              })}
            </nav>
          </RadixCollapsible.Content>
        </RadixCollapsible.Root>
      </div>
    </div>
  );
};

const UtilitySection = () => {
  const location = useLocation();
  const { t } = useTranslation();

  return (
    <div className='flex flex-col gap-y-0.5 py-3'>
      <NavItem
        label={t('app.nav.settings.header')}
        to='/settings'
        from={location.pathname}
        icon={<CogSixTooth />}
      />
    </div>
  );
};

const UserSection = () => {
  return (
    <div>
      <div className='px-3'>
        <Divider variant='dashed' />
      </div>
      <UserMenu />
    </div>
  );
};
