import i18n from 'i18next'

const commonHiddenFields = [
  'type',
  'application_method.type',
  'application_method.allocation',
];

export const getTemplates = () => [
  // {
  //   id: "amount_off_products",
  //   type: "standard",
  //   titleKey: "promotions.templates.amount_off_products.title",
  //   descriptionKey: "promotions.templates.amount_off_products.description",
  //   hiddenFields: [...commonHiddenFields],
  //   defaults: {
  //     is_automatic: "false",
  //     type: "standard",
  //     application_method: {
  //       allocation: "each",
  //       target_type: "items",
  //       type: "fixed",
  //     },
  //   },
  // },
  // {
  //   id: "amount_off_order",
  //   type: "standard",
  //   titleKey: "promotions.templates.amount_off_order.title",
  //   descriptionKey: "promotions.templates.amount_off_order.description",
  //   hiddenFields: [...commonHiddenFields],
  //   defaults: {
  //     is_automatic: "false",
  //     type: "standard",
  //     application_method: {
  //       allocation: "across",
  //       target_type: "order",
  //       type: "fixed",
  //     },
  //   },
  // },
  {
    id: 'percentage_off_product',
    type: 'standard',
    title: i18n.t('promotions.templates.percentage_off_product.title'),
    description: i18n.t('promotions.templates.percentage_off_product.description'),
    hiddenFields: [...commonHiddenFields],
    defaults: {
      is_automatic: 'false',
      type: 'standard',
      application_method: {
        allocation: 'each',
        target_type: 'items',
        type: 'percentage',
      },
    },
  },
  {
    id: 'percentage_off_order',
    type: 'standard',
    title: i18n.t('promotions.templates.percentage_off_order.title'),
    description: i18n.t('promotions.templates.percentage_off_order.description'),
    hiddenFields: [...commonHiddenFields],
    defaults: {
      is_automatic: 'false',
      type: 'standard',
      application_method: {
        allocation: 'across',
        target_type: 'order',
        type: 'percentage',
      },
    },
  },
  {
    id: 'buy_get',
    type: 'buy_get',
    title: i18n.t('promotions.templates.buy_get.title'),
    description: i18n.t('promotions.templates.buy_get.description'),
    hiddenFields: [
      ...commonHiddenFields,
      'application_method.value',
    ],
    defaults: {
      is_automatic: 'false',
      type: 'buyget',
      application_method: {
        type: 'percentage',
        value: 100,
        apply_to_quantity: 1,
        max_quantity: 1,
      },
    },
  },
];
