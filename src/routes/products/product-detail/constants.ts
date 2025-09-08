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
  '*categories', // CRITICAL FIX: Use asterisk format like detail view to get all category fields
  '*tags', // Also fix tags to match detail view format
  'type_id',
  'collection_id',
  '*collection', // Also fix collection to get all fields
].join(',');

// Define basic product fields that are always needed
const basicProductFields = [
  'id',
  'title',
  'subtitle', 
  'description',
  'handle',
  'status',
  'thumbnail',
  'material',
  'discountable',
  'created_at',
  'updated_at',
  'deleted_at',
  'metadata'
].join(',');

// Get basic product fields from extensions and add our specific field requirements
export const PRODUCT_DETAIL_FIELDS = [
  getLinkedFields('product', basicProductFields),
  variantFields,
  organizationFields,
  '*shipping_profile'
].join(',');
