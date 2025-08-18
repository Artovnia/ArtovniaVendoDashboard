import { getLinkedFields } from '../../../extensions';

// Define explicit fields we need, especially for inventory data
const variantFields = [
  'variants',
  'variants.id',
  'variants.title',
  'variants.sku',
  'variants.inventory_quantity',
  'variants.prices',
  'variants.options',
  'variants.inventory_items',
  'variants.inventory_items.inventory_item_id',
].join(',');

// Define organization fields explicitly
const organizationFields = [
  'categories',
  'categories.id',
  'categories.name',
  'categories.handle',
  'tags',
  'tags.id',
  'tags.value',
  'type_id',
  'collection_id',
  'collection',
  'collection.id',
  'collection.title',
].join(',');

// Get basic product fields from extensions and add our specific field requirements
export const PRODUCT_DETAIL_FIELDS = [
  getLinkedFields('product', ''),
  variantFields,
  organizationFields,
  'shipping_profile',
  'shipping_profile.id',
  'shipping_profile.name'
].join(',');
