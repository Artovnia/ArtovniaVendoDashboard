import { ArrowUturnLeft, MinusMini } from '@medusajs/icons';
import {
  clx,
  Divider,
  IconButton,
  Text,
} from '@medusajs/ui';
import { Collapsible as RadixCollapsible } from 'radix-ui';
import {
  Fragment,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';

import { INavItem, NavItem } from '../nav-item';
import { Shell } from '../shell';

import { useDashboardExtension } from '../../../extensions';
import { UserMenu } from '../user-menu';

export const SettingsLayout = () => {
  return (
    <Shell>
      <SettingsSidebar />
    </Shell>
  );
};

const useSettingRoutes = (): INavItem[] => {
  const { t } = useTranslation();

  return useMemo(
    () => [
      {
        label: t('store.domain'),
        to: '/settings/store',
      },
      {
        label: 'Team',
        to: '/settings/users',
      },
      {
        label: t('productTypes.domain'),
        to: '/settings/product-types',
      },
      {
        label: t('productTags.domain'),
        to: '/settings/product-tags',
      },
      {
        label: t('stockLocations.domain'),
        to: '/settings/locations',
      },
      
    ],
    [t]
  );
};

const useDeveloperRoutes = (): INavItem[] => {
  const { t } = useTranslation();

  return useMemo(
    () => [
      {
        label: t('apiKeyManagement.domain.secret'),
        to: '/settings/secret-api-keys',
      },
    ],
    [t]
  );
};

const useMyAccountRoutes = (): INavItem[] => {
  const { t } = useTranslation();

  return useMemo(
    () => [
      {
        label: t('profile.domain'),
        to: '/settings/profile',
      },
    ],
    [t]
  );
};

/**
 * Ensure that the `from` prop is not another settings route, to avoid
 * the user getting stuck in a navigation loop.
 */
const getSafeFromValue = (from: string) => {
  if (from.startsWith('/settings')) {
    return '/orders';
  }

  return from;
};

const SettingsSidebar = () => {
  const { getMenu } = useDashboardExtension();

  const routes = useSettingRoutes();
  const developerRoutes = useDeveloperRoutes();
  const myAccountRoutes = useMyAccountRoutes();
  const extensionRoutes = getMenu('settingsExtensions');

  const { t } = useTranslation();

  return (
    <aside className='relative flex flex-1 flex-col justify-between overflow-y-auto'>
      <div className='bg-ui-bg-subtle sticky top-0'>
        <Header />
        <div className='flex items-center justify-center px-3'>
          <Divider variant='dashed' />
        </div>
      </div>
      <div className='flex flex-1 flex-col'>
        <div className='flex flex-1 flex-col overflow-y-auto'>
          <RadixCollapsibleSection
            label={t('app.nav.settings.general')}
            items={routes}
          />
          <div className='flex items-center justify-center px-3'>
            <Divider variant='dashed' />
          </div>
          <RadixCollapsibleSection
            label={t('app.nav.settings.developer')}
            items={developerRoutes}
          />
          <div className='flex items-center justify-center px-3'>
            <Divider variant='dashed' />
          </div>
          <RadixCollapsibleSection
            label={t('app.nav.settings.myAccount')}
            items={myAccountRoutes}
          />
          {extensionRoutes.length > 0 && (
            <Fragment>
              <div className='flex items-center justify-center px-3'>
                <Divider variant='dashed' />
              </div>
              <RadixCollapsibleSection
                label={t('app.nav.common.extensions')}
                items={extensionRoutes}
              />
            </Fragment>
          )}
        </div>
        <div className='bg-ui-bg-subtle sticky bottom-0'>
          <UserSection />
        </div>
      </div>
    </aside>
  );
};

const Header = () => {
  const [from, setFrom] = useState('/orders');

  const { t } = useTranslation();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.from) {
      setFrom(getSafeFromValue(location.state.from));
    }
  }, [location]);

  return (
    <div className='bg-ui-bg-subtle p-3'>
      <Link
        to={from}
        replace
        className={clx(
          'bg-ui-bg-subtle transition-fg flex items-center rounded-md outline-none',
          'hover:bg-ui-bg-subtle-hover',
          'focus-visible:shadow-borders-focus'
        )}
      >
        <div className='flex items-center gap-x-2.5 px-2 py-1'>
          <div className='flex items-center justify-center'>
            <ArrowUturnLeft className='text-ui-fg-subtle' />
          </div>
          <Text
            leading='compact'
            weight='plus'
            size='small'
          >
            {t('app.nav.settings.header')}
          </Text>
        </div>
      </Link>
    </div>
  );
};

const RadixCollapsibleSection = ({
  label,
  items,
}: {
  label: string;
  items: INavItem[];
}) => {
  return (
    <RadixCollapsible.Root defaultOpen className='py-3'>
      <div className='px-3'>
        <div className='text-ui-fg-muted flex h-7 items-center justify-between px-2'>
          <Text size='small' leading='compact'>
            {label}
          </Text>
          <RadixCollapsible.Trigger asChild>
            <IconButton
              size='2xsmall'
              variant='transparent'
              className='static'
            >
              <MinusMini className='text-ui-fg-muted' />
            </IconButton>
          </RadixCollapsible.Trigger>
        </div>
      </div>
      <RadixCollapsible.Content>
        <div className='pt-0.5'>
          <nav className='flex flex-col gap-y-0.5'>
            {items.map((setting) => (
              <NavItem
                key={setting.to}
                type='setting'
                {...setting}
              />
            ))}
          </nav>
        </div>
      </RadixCollapsible.Content>
    </RadixCollapsible.Root>
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
