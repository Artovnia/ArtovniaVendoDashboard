/**
 * Mock data for testing combobox with large datasets
 * This file contains 100+ mock items to test scrolling behavior
 */

export const mockComboboxData = Array.from({ length: 150 }, (_, i) => ({
  value: `item-${i + 1}`,
  label: `Test Item ${i + 1} - ${generateRandomLabel()}`,
  disabled: i % 20 === 0, // Every 20th item is disabled for testing
}));

function generateRandomLabel(): string {
  const adjectives = [
    'Amazing',
    'Beautiful',
    'Creative',
    'Dynamic',
    'Elegant',
    'Fantastic',
    'Gorgeous',
    'Innovative',
    'Luxurious',
    'Modern',
  ];
  const nouns = [
    'Product',
    'Item',
    'Article',
    'Merchandise',
    'Goods',
    'Commodity',
    'Asset',
    'Resource',
    'Material',
    'Supply',
  ];

  const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];

  return `${randomAdj} ${randomNoun}`;
}

/**
 * Mock tags data specifically for product creation
 */
export const mockProductTags = Array.from({ length: 100 }, (_, i) => ({
  value: `tag-${i + 1}`,
  label: `Tag ${i + 1}: ${generateTagName()}`,
}));

function generateTagName(): string {
  const categories = [
    'Electronics',
    'Fashion',
    'Home & Garden',
    'Sports',
    'Books',
    'Toys',
    'Beauty',
    'Automotive',
    'Food',
    'Health',
  ];
  const subcategories = [
    'Premium',
    'Budget',
    'Bestseller',
    'New Arrival',
    'Limited Edition',
    'Clearance',
    'Featured',
    'Trending',
    'Popular',
    'Exclusive',
  ];

  const randomCat = categories[Math.floor(Math.random() * categories.length)];
  const randomSubcat =
    subcategories[Math.floor(Math.random() * subcategories.length)];

  return `${randomCat} - ${randomSubcat}`;
}
