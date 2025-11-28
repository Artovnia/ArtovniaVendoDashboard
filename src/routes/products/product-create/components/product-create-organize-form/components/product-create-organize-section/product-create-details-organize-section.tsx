import { Heading } from '@medusajs/ui';
import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Form } from '../../../../../../../components/common/form';
import { SwitchBox } from '../../../../../../../components/common/switch-box';
import { Combobox } from '../../../../../../../components/inputs/combobox';
import { ShippingProfileCombobox } from '../../../../../../../components/inputs/shipping-profile-combobox';
import { useComboboxData } from '../../../../../../../hooks/use-combobox-data';
import {
  fetchQuery,
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
      <Heading>{t('formFields.shipping_profile.label')}</Heading>
      <SwitchBox
        control={form.control}
        name='discountable'
        label={t('formFields.discountable.label')}
        description={t('formFields.discountable.hint')}
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
                  {t('formFields.shipping_profile.label')}
                </Form.Label>
                <Form.Control>
                  <ShippingProfileCombobox
                    {...field}
                    showValidationBadges={true}
                    showWarningMessages={true}
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
                  {t('formFields.categories.label')}
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
                  {t('formFields.tags.label')}
                </Form.Label>
                <Form.Control>
                  <Combobox
                    {...field}
                    options={tags.options}
                    searchValue={tags.searchValue}
                    onSearchValueChange={tags.onSearchValueChange}
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
