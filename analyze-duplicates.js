const fs = require('fs');
const path = require('path');

// Read the Polish translation file
const plJsonPath = path.join(__dirname, 'src/i18n/translations/pl.json');
const plContent = fs.readFileSync(plJsonPath, 'utf-8');

// Parse JSON
let plJson;
try {
  plJson = JSON.parse(plContent);
} catch (error) {
  console.error('Error parsing pl.json:', error.message);
  process.exit(1);
}

// Function to find duplicate keys at any level
function findDuplicateKeys(obj, path = '', duplicates = new Map()) {
  const keys = Object.keys(obj);
  const keyCount = {};
  
  // Count occurrences of each key at this level
  keys.forEach(key => {
    keyCount[key] = (keyCount[key] || 0) + 1;
  });
  
  // Report duplicates at this level
  Object.entries(keyCount).forEach(([key, count]) => {
    if (count > 1) {
      const fullPath = path ? `${path}.${key}` : key;
      if (!duplicates.has(fullPath)) {
        duplicates.set(fullPath, []);
      }
      duplicates.get(fullPath).push({
        path: fullPath,
        count: count,
        level: path.split('.').length
      });
    }
  });
  
  // Recursively check nested objects
  keys.forEach(key => {
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      const newPath = path ? `${path}.${key}` : key;
      findDuplicateKeys(obj[key], newPath, duplicates);
    }
  });
  
  return duplicates;
}

// Analyze for duplicates
console.log('Analyzing pl.json for duplicate keys...\n');
const duplicates = findDuplicateKeys(plJson);

if (duplicates.size === 0) {
  console.log('✅ No duplicate keys found in pl.json');
} else {
  console.log('❌ Found duplicate keys:');
  duplicates.forEach((info, key) => {
    console.log(`\n🔴 Duplicate key: "${key}"`);
    info.forEach(item => {
      console.log(`   - Path: ${item.path} (appears ${item.count} times)`);
    });
  });
}

// Also check for specific patterns that might cause issues
console.log('\n\n=== Checking for specific problematic patterns ===');

// Check for multiple "products" keys at root level
const rootKeys = Object.keys(plJson);
const productsCount = rootKeys.filter(key => key === 'products').length;
console.log(`Root level "products" keys: ${productsCount}`);

// Check for nested products keys
function findNestedProducts(obj, path = '') {
  const results = [];
  Object.entries(obj).forEach(([key, value]) => {
    if (key === 'products') {
      results.push(path ? `${path}.${key}` : key);
    }
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const newPath = path ? `${path}.${key}` : key;
      results.push(...findNestedProducts(value, newPath));
    }
  });
  return results;
}

const allProductsKeys = findNestedProducts(plJson);
console.log('\nAll "products" keys found:');
allProductsKeys.forEach((path, index) => {
  console.log(`${index + 1}. ${path}`);
});

console.log('\n=== Analysis complete ===');
