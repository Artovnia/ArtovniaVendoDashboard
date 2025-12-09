import { Heading, Input, Switch, Text, Alert } from '@medusajs/ui';
import { UseFormReturn, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { HttpTypes } from '@medusajs/types';
import { useNavigate } from 'react-router-dom';

import { Form } from '../../../../../components/common/form';
import { Combobox } from '../../../../../components/inputs/combobox';
import { CreateProductVariantSchema } from './constants';
import { useStockLocations } from '../../../../../hooks/api/stock-locations';

type DetailsTabProps = {
  product: HttpTypes.AdminProduct;
  form: UseFormReturn<
    z.infer<typeof CreateProductVariantSchema>
  >;
};

function DetailsTab({ form, product }: DetailsTabProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // Watch manage_inventory to show/hide stock fields
  const manageInventory = useWatch({
    control: form.control,
    name: 'manage_inventory',
  });
  
  // Fetch stock locations for the dropdown
  const { stock_locations, isLoading: isLoadingLocations } = useStockLocations({
    limit: 100,
  });
  
  // Check if product has options
  const hasOptions = product.options && product.options.length > 0;
  
  // Get default stock location
  const defaultLocation = stock_locations?.find((loc: any) => loc.is_default) || stock_locations?.[0];

  return (
    <div className='flex flex-1 flex-col items-center overflow-y-auto'>
      <div className='flex w-full max-w-[720px] flex-col gap-y-8 px-8 py-16'>
        <Heading level='h1'>
          {t('variant.header')}
        </Heading>

        {/* Options Validation Alert */}
        {!hasOptions && (
          <Alert variant="warning" dismissible={false}>
            <div className="flex flex-col gap-y-2">
              <Text weight="plus" size="small">
                {t('fields.noOptionsTitle')}
              </Text>
              <Text size="small">
                {t('fields.noOptionsDescription')}
              </Text>
              <button
                type="button"
                onClick={() => navigate(`/products/${product.id}/options/create`)}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline text-left"
              >
                {t('fields.goToOptionsManagement')}
              </button>
            </div>
          </Alert>
        )}

        <div className='my-8 grid grid-cols-1 gap-4 md:grid-cols-2'>
          <Form.Field
            control={form.control}
            name='title'
            render={({ field }) => {
              return (
                <Form.Item>
                  <Form.Label>
                    {t('fields.title')}
                  </Form.Label>
                  <Form.Control>
                    <Input {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              );
            }}
          />

          <Form.Field
            control={form.control}
            name='sku'
            render={({ field }) => {
              return (
                <Form.Item>
                  <Form.Label optional>
                    {t('fields.sku')}
                  </Form.Label>
                  <Form.Control>
                    <Input {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              );
            }}
          />

          {(product.options || []).map((option: any) => (
            <Form.Field
              key={option.id}
              control={form.control}
              name={`options.${option.title}`}
              render={({
                field: { value, onChange, ...field },
              }) => {
                return (
                  <Form.Item>
                    <Form.Label>{option.title}</Form.Label>
                    <Form.Control>
                      <Combobox
                        value={value}
                        onChange={(v) => {
                          onChange(v);
                        }}
                        {...field}
                        options={option.values.map(
                          (v: any) => ({
                            label: v.value,
                            value: v.value,
                          })
                        )}
                      />
                    </Form.Control>
                  </Form.Item>
                );
              }}
            />
          ))}
        </div>

        {/* Inventory Management Section */}
        <div className="flex flex-col gap-y-4 border-t pt-6">
          <Heading level="h2" className="text-lg">
            {t('variant.inventory.manageInventoryLabel')}
          </Heading>
          
          {/* Manage Inventory Toggle */}
          <Form.Field
            control={form.control}
            name="manage_inventory"
            render={({ field: { value, onChange, ...field } }) => {
              return (
                <Form.Item>
                  <div className="flex items-start gap-x-3 rounded-lg border p-4">
                    <Form.Control>
                      <Switch
                        checked={value}
                        onCheckedChange={(checked) => {
                          onChange(!!checked);
                          // Set default stock location when enabling
                          if (checked && defaultLocation) {
                            form.setValue('stock_location_id', defaultLocation.id);
                          }
                        }}
                        {...field}
                      />
                    </Form.Control>
                    <div className="flex flex-col">
                      <Form.Label>
                        {t('fields.manageInventory')}
                      </Form.Label>
                      <Form.Hint>
                        {t('variant.inventory.manageInventoryHint')}
                      </Form.Hint>
                    </div>
                  </div>
                  <Form.ErrorMessage />
                </Form.Item>
              );
            }}
          />

          {/* Stock Quantity Input - Only show if manage_inventory is true */}
          {manageInventory && (
            <>
              <Form.Field
                control={form.control}
                name="stock_quantity"
                render={({ field }) => {
                  return (
                    <Form.Item>
                      <Form.Label>
                        {t('fields.stockQuantity')}
                      </Form.Label>
                      <Form.Control>
                        <Input
                          {...field}
                          type="number"
                          min="0"
                          placeholder="0"
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </Form.Control>
                      <Form.Hint>
                        {t('fields.stockQuantityHint')}
                      </Form.Hint>
                      <Form.ErrorMessage />
                    </Form.Item>
                  );
                }}
              />

              {/* Stock Location Selector */}
              <Form.Field
                control={form.control}
                name="stock_location_id"
                render={({ field: { value, onChange, ...field } }) => {
                  return (
                    <Form.Item>
                      <Form.Label>
                        {t('products.create.stockLocation')}
                      </Form.Label>
                      <Form.Control>
                        <Combobox
                          value={value || defaultLocation?.id}
                          onChange={onChange}
                          {...field}
                          disabled={isLoadingLocations || !stock_locations?.length}
                          options={(stock_locations || []).map((loc: any) => ({
                            label: `${loc.name}${loc.is_default ? ' (Default)' : ''}`,
                            value: loc.id,
                          }))}
                        />
                      </Form.Control>
                      <Form.Hint>
                        {t('products.create.stockLocationHint')}
                      </Form.Hint>
                      <Form.ErrorMessage />
                    </Form.Item>
                  );
                }}
              />

              {/* Allow Backorder Toggle */}
              <Form.Field
                control={form.control}
                name="allow_backorder"
                render={({ field: { value, onChange, ...field } }) => {
                  return (
                    <Form.Item>
                      <div className="flex items-start gap-x-3 rounded-lg border p-4">
                        <Form.Control>
                          <Switch
                            checked={value}
                            onCheckedChange={(checked) => onChange(!!checked)}
                            {...field}
                          />
                        </Form.Control>
                        <div className="flex flex-col">
                          <Form.Label>
                            {t('fields.allowBackorder')}
                          </Form.Label>
                          <Form.Hint>
                            {t('variant.inventory.allowBackordersHint')}
                          </Form.Hint>
                        </div>
                      </div>
                      <Form.ErrorMessage />
                    </Form.Item>
                  );
                }}
              />
            </>
          )}
        </div>
        {/* <div className="flex flex-col gap-y-4">
          <Form.Field
            control={form.control}
            name="inventory_kit"
            render={({ field: { value, onChange, ...field } }) => {
              return (
                <Form.Item>
                  <div className="bg-ui-bg-component shadow-elevation-card-rest flex gap-x-3 rounded-lg p-4">
                    <Form.Control>
                      <Switch
                        checked={value}
                        onCheckedChange={(checked) => onChange(!!checked)}
                        {...field}
                        disabled={!manageInventoryEnabled}
                      />
                    </Form.Control>
                    <div className="flex flex-col">
                      <Form.Label>
                        {t("products.variant.inventory.inventoryKit")}
                      </Form.Label>
                      <Form.Hint>
                        {t("products.variant.inventory.inventoryKitHint")}
                      </Form.Hint>
                    </div>
                  </div>
                  <Form.ErrorMessage />
                </Form.Item>
              )
            }}
          />
        </div> */}
      </div>
    </div>
  );
}

export default DetailsTab;
