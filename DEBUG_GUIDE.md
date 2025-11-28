# 🔍 Debug Guide - GPSR Auto-fill & Variant Title

## 🎯 Purpose
This guide helps you debug and verify that both features are working correctly with detailed console logging.

---

## 📋 Testing Checklist

### **Before Testing:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Clear console (Ctrl+L or click 🚫 icon)
4. Keep console open during all tests

---

## 🧪 Test 1: GPSR Auto-fill - First Product Creation

### **Steps:**
1. **Clear existing data** (if any):
   ```javascript
   localStorage.removeItem('vendor_gpsr_defaults');
   console.log('Cleared localStorage');
   ```

2. **Navigate to product creation**
3. **Fill in product details**:
   - Title: "Test Product 1"
   - Other required fields

4. **Fill in GPSR data**:
   - Producer Name: "Test Producer"
   - Producer Address: "123 Test Street"
   - Producer Contact: "test@example.com"
   - Instructions: "Test instructions"

5. **Submit the product**

### **Expected Console Output:**
```
📤 Submitting GPSR data to API: {productId: "...", gpsr: {...}}
✅ GPSR data submitted to API successfully
💾 Saving GPSR data to localStorage...
💾 Attempting to save GPSR data: {producerName: "Test Producer", ...}
✅ GPSR defaults saved to localStorage: {producerName: "Test Producer", ...}
🔑 Storage key: vendor_gpsr_defaults
✔️ Verification - data in storage: YES
💾 GPSR save result: SUCCESS
```

### **Verify in DevTools:**
1. Go to **Application** tab
2. Expand **Local Storage**
3. Click your domain
4. Find key: `vendor_gpsr_defaults`
5. Should show JSON with your GPSR data

### **If NOT working:**
- ❌ No console logs? → Check if file was saved correctly
- ❌ "localStorage is not available"? → Check browser settings
- ❌ Data not in localStorage? → Check console for errors

---

## 🧪 Test 2: GPSR Auto-fill - Second Product Creation

### **Steps:**
1. **Navigate to new product creation** (new form)
2. **Watch console immediately**

### **Expected Console Output (on form load):**
```
🔍 GPSR auto-fill hook mounted
📦 Has stored GPSR data: true
📦 Retrieved GPSR data: {producerName: "Test Producer", ...}
📝 Current producer name in form: ""
✨ Triggering auto-fill...
✅ GPSR data auto-filled from localStorage
```

### **Expected UI:**
- ✅ All GPSR fields should be pre-filled
- ✅ Green "Auto-filled" badge should appear
- ✅ Producer Name: "Test Producer"
- ✅ Producer Address: "123 Test Street"
- ✅ Producer Contact: "test@example.com"
- ✅ Instructions: "Test instructions"

### **If NOT working:**

#### **Scenario A: No console logs at all**
```
Problem: Hook not mounting
Solution: Check if component is rendering
```

#### **Scenario B: "No stored GPSR data found"**
```
Problem: Data not in localStorage
Solution: 
1. Check localStorage in DevTools
2. Re-run Test 1
3. Verify data was saved
```

#### **Scenario C: "Skipping auto-fill - form already has data"**
```
Problem: Form has non-empty values
Solution: This is expected if you edited the form before
```

#### **Scenario D: Hook mounted but no auto-fill**
```
Problem: Check the console output:
- If "Current producer name in form: [some value]" → Form already has data
- If no "Triggering auto-fill" → Check conditions
```

---

## 🧪 Test 3: Variant Title Sync

### **Steps:**
1. **Open new product creation**
2. **Enter product title**: "My Test Product"
3. **Watch console**
4. **Navigate to Variants tab**

### **Expected Console Output:**
```
🔍 Variant sync check: {
  variantsEnabled: false,
  variantCount: 1,
  isDefault: true,
  currentVariantTitle: "",
  productTitle: "My Test Product"
}
✨ Updating variant title from: "" to: "My Test Product"
✅ Default variant title updated to: My Test Product
🔄 Secondary sync check - variant title: "" product title: "My Test Product"
✨ Secondary sync - updating variant title
✅ Synced variant title with product title: My Test Product
```

### **Expected UI:**
- ✅ Variant title in grid shows: "My Test Product"

### **If NOT working:**

#### **Scenario A: No console logs**
```
Problem: Component not rendering or useEffect not firing
Solution: Check if you're on the Details tab
```

#### **Scenario B: "Skipping variant title update - already has custom title"**
```
Problem: Variant already has a title
Solution: This is expected if you manually set variant title
```

#### **Scenario C: Console shows sync but UI doesn't update**
```
Problem: Form value set but UI not reflecting
Solution: Check if DataGrid is reading the correct field
```

---

## 🔧 Manual Debug Commands

### **Check localStorage:**
```javascript
// View all localStorage
console.table(Object.entries(localStorage));

// View GPSR data
const gpsrData = localStorage.getItem('vendor_gpsr_defaults');
console.log('GPSR Data:', JSON.parse(gpsrData));

// Clear GPSR data
localStorage.removeItem('vendor_gpsr_defaults');
console.log('Cleared GPSR data');
```

### **Check form values (when form is mounted):**
```javascript
// In React DevTools, select the form component, then in console:

// Check GPSR fields
console.log('Producer Name:', $r.props.form.getValues('metadata.gpsr_producer_name'));
console.log('Producer Address:', $r.props.form.getValues('metadata.gpsr_producer_address'));
console.log('All metadata:', $r.props.form.getValues('metadata'));

// Check variant title
console.log('Variant title:', $r.props.form.getValues('variants.0.title'));
console.log('Product title:', $r.props.form.getValues('title'));
console.log('All variants:', $r.props.form.getValues('variants'));
```

### **Force auto-fill (when GPSR component is selected in React DevTools):**
```javascript
// In console:
$r.loadDefaults();
console.log('Forced auto-fill');
```

---

## 📊 Console Log Legend

| Icon | Meaning |
|------|---------|
| 🔍 | Inspection/Check |
| 📦 | Data retrieval |
| 📝 | Form value check |
| ✨ | Action triggered |
| ✅ | Success |
| ❌ | Error |
| ⏭️ | Skipped |
| 💾 | Storage operation |
| 🔑 | Storage key |
| ✔️ | Verification |
| 📤 | API call |
| 🔄 | Secondary check |

---

## 🐛 Common Issues & Solutions

### **Issue 1: "localStorage is not available"**
**Causes:**
- Incognito/Private mode
- Browser settings blocking localStorage
- SSR environment

**Solutions:**
- Use normal browser window
- Check browser settings
- Ensure client-side rendering

---

### **Issue 2: Data saves but doesn't auto-fill**
**Causes:**
- Form initializes with non-empty values
- Hook mounts before form is ready
- Component re-renders clearing state

**Debug:**
```javascript
// Check form values when component mounts
console.log('Form values on mount:', $r.props.form.getValues());
```

**Solutions:**
- Check if form has default values
- Verify hook dependencies
- Check component lifecycle

---

### **Issue 3: Variant title doesn't sync**
**Causes:**
- Variants enabled (custom variants)
- Variant already has custom title
- useEffect not triggering

**Debug:**
```javascript
// Check variant state
console.log('Variants enabled:', $r.props.form.getValues('enable_variants'));
console.log('Variant data:', $r.props.form.getValues('variants'));
```

**Solutions:**
- Ensure variants are NOT enabled
- Check if variant title is empty
- Verify useEffect dependencies

---

### **Issue 4: Console logs appear but UI doesn't update**
**Causes:**
- Form.setValue not triggering re-render
- Input component not reading form value
- DataGrid not updating

**Debug:**
```javascript
// Force form to show current values
console.log('Current form state:', $r.props.form.getValues());

// Check if form is dirty
console.log('Form dirty:', $r.props.form.formState.isDirty);
```

**Solutions:**
- Add `shouldDirty: true` to setValue
- Check if input is controlled
- Verify DataGrid data binding

---

## ✅ Success Criteria

### **GPSR Auto-fill:**
- [x] Console shows save logs on first product creation
- [x] localStorage contains GPSR data
- [x] Console shows auto-fill logs on second product creation
- [x] Form fields are pre-filled
- [x] Green "Auto-filled" badge appears

### **Variant Title:**
- [x] Console shows sync logs when product title changes
- [x] Variant title updates in Variants tab
- [x] Title matches product title
- [x] Works consistently on every product creation

---

## 📞 Next Steps If Still Not Working

1. **Capture full console output** from:
   - Product creation (with GPSR data)
   - Opening new product form
   - Navigating to Variants tab

2. **Check localStorage** in DevTools:
   - Application → Local Storage → Your domain
   - Screenshot the `vendor_gpsr_defaults` entry

3. **Check React DevTools**:
   - Find ProductCreateGPSRSection component
   - Check props and state
   - Screenshot component tree

4. **Provide information**:
   - Browser version
   - Any console errors
   - Screenshots of console logs
   - localStorage contents

---

## 🎯 Quick Test Script

Run this in console after creating first product:

```javascript
// Test script
console.log('=== GPSR Auto-fill Test ===');

// 1. Check localStorage
const data = localStorage.getItem('vendor_gpsr_defaults');
console.log('1. Data in localStorage:', data ? 'YES ✅' : 'NO ❌');

if (data) {
  const parsed = JSON.parse(data);
  console.log('2. Producer Name:', parsed.producerName || 'MISSING ❌');
  console.log('3. Producer Address:', parsed.producerAddress || 'MISSING ❌');
  console.log('4. Instructions:', parsed.instructions || 'MISSING ❌');
  console.log('5. Last Updated:', parsed.lastUpdated);
}

console.log('\n=== Next: Open new product form and check console ===');
```

Expected output:
```
=== GPSR Auto-fill Test ===
1. Data in localStorage: YES ✅
2. Producer Name: Test Producer
3. Producer Address: 123 Test Street
4. Instructions: Test instructions
5. Last Updated: 2025-11-28T10:53:00.000Z

=== Next: Open new product form and check console ===
```
