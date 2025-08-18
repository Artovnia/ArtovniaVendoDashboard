import { Heading } from '@medusajs/ui';
import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { Form } from '../../../../../../../components/common/form';
import { SwitchBox } from '../../../../../../../components/common/switch-box';
import { Combobox } from '../../../../../../../components/inputs/combobox';
import { useComboboxData } from '../../../../../../../hooks/use-combobox-data';
import {
  fetchQuery,
  sdk,
} from '../../../../../../../lib/client';
import { ProductCreateSchemaType } from '../../../../types';
import { CategorySelect } from '../../../../../common/components/category-combobox/category-select';

type ProductCreateOrganizationSectionProps = {
  form: UseFormReturn<ProductCreateSchemaType>;
};

export const ProductCreateOrganizationSection = ({
  form,
}: ProductCreateOrganizationSectionProps) => {
  const { t } = useTranslation();

  
  // Fetch shipping profiles from vendor API using useQuery instead of useComboboxData to avoid pagination issues
  const { data: shippingProfilesData } = useQuery({
    queryKey: ['shipping_profiles'],
    queryFn: async () => {
      return fetchQuery('/vendor/shipping-profiles', {
        method: 'GET',
        query: {},
      })
    },
  });

  // Convert shipping profiles data to options format for the combobox
  const shippingProfileOptions = useMemo(() => {
    if (!shippingProfilesData?.shipping_profiles) return [];
    return shippingProfilesData.shipping_profiles.map((profile: any) => ({
      label: profile.name,
      value: profile.id,
    }));
  }, [shippingProfilesData]);

  // Create a compatible interface to replace useComboboxData
  const shippingProfiles = {
    options: shippingProfileOptions,
    searchValue: '',
    onSearchValueChange: () => {},
    disabled: false,
    fetchNextPage: () => {},
    hasNextPage: false,
    isPending: false,
  };


  const tags = useComboboxData({
    queryKey: ['product_tags', 'creating'],
    queryFn: (params) =>
      fetchQuery('/store/product-tags', {
        method: 'GET',
        query: params,
      }),
    getOptions: (data) =>
      data.product_tags.map((tag: any) => ({
        label: tag.value,
        value: tag.id,
      })),
  });

  return (
    <div id='organize' className='flex flex-col gap-y-8'>
      <Heading>{t('products.organization.header')}</Heading>
      <SwitchBox
        control={form.control}
        name='discountable'
        label={t('products.fields.discountable.label')}
        description={t('products.fields.discountable.hint')}
        optional
      />
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        <Form.Field
          control={form.control}
          name='shipping_profile_id'
          render={({ field }) => {
            return (
              <Form.Item>
                <Form.Label>
                  {t('products.fields.shipping_profile.label', 'Profil wysyłki')}
                </Form.Label>
                <Form.Control>
                  <Combobox
                    {...field}
                    options={shippingProfiles.options}
                    searchValue={shippingProfiles.searchValue}
                    onSearchValueChange={shippingProfiles.onSearchValueChange}
                    fetchNextPage={shippingProfiles.fetchNextPage}
                  />
                </Form.Control>
                <Form.ErrorMessage />
              </Form.Item>
            );
          }}
        />
      </div>
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        <Form.Field
          control={form.control}
          name='categories'
          render={({ field }) => {
            return (
              <Form.Item>
                <Form.Label>
                  {t('products.fields.categories.label')}
                </Form.Label>
                <Form.Control>
                  <CategorySelect {...field} />
                </Form.Control>
                <Form.ErrorMessage />
              </Form.Item>
            );
          }}
        />
      </div>
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        <Form.Field
          control={form.control}
          name='tags'
          render={({ field }) => {
            return (
              <Form.Item>
                <Form.Label optional>
                  {t('products.fields.tags.label')}
                </Form.Label>
                <Form.Control>
                  <Combobox
                    {...field}
                    options={tags.options}
                    searchValue={tags.searchValue}
                    onSearchValueChange={
                      tags.onSearchValueChange
                    }
                    fetchNextPage={tags.fetchNextPage}
                  />
                </Form.Control>
                <Form.ErrorMessage />
              </Form.Item>
            );
          }}
        />
      </div>
    </div>
  );
};
