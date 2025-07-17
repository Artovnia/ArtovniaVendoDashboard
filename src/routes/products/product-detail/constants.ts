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

// Get basic product fields from extensions and add our specific field requirements
export const PRODUCT_DETAIL_FIELDS = [
  getLinkedFields('product', ''),
  variantFields
].join(',');
