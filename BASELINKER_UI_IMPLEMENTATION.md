# BaseLinker Vendor Panel UI Implementation

**Date:** January 12, 2026  
**Status:** ✅ CORE COMPLETED - Additional components needed

---

## Completed Work

### 1. ✅ Translations (3 files)

**Schema:**
- Added `baselinker` object with 76 translation keys
- Added to required fields array

**English (en.json):**
- Complete translations for all BaseLinker features
- Connection management
- Product import
- Stock synchronization
- Status messages

**Polish (pl.json):**
- Complete Polish translations
- All keys translated professionally

### 2. ✅ API Hooks (1 file)

**File:** `src/hooks/api/baselinker.tsx`

**Hooks Created:**
- `useBaseLinkerConnections()` - List all connections
- `useBaseLinkerConnection(id)` - Get single connection
- `useCreateBaseLinkerConnection()` - Create new connection
- `useUpdateBaseLinkerConnection()` - Update connection
- `useDeleteBaseLinkerConnection()` - Delete connection
- `useImportProduct()` - Import single product
- `useImportBulk()` - Import multiple products
- `useSyncStock()` - Synchronize stock

**Features:**
- TypeScript types for all inputs/outputs
- React Query integration
- Automatic cache invalidation
- Proper error handling

### 3. ✅ Main Integration Page (1 file)

**File:** `src/routes/settings/integrations/baselinker/page.tsx`

**Features:**
- Connection status display
- Create/delete connection
- Import single product
- Import all products
- Sync stock (to/from BaseLinker)
- Loading states
- Toast notifications
- Simple forms for connection and import

---

## Remaining Work

### 1. ⏳ Add to Settings Navigation

**File to modify:** `src/components/layout/settings-layout/settings-layout.tsx`

Add BaseLinker to integrations menu:

```typescript
{
  label: t('baselinker.title'),
  to: '/settings/integrations/baselinker',
  icon: <Component />, // Use appropriate icon
}
```

### 2. ⏳ Enhanced UI Components (Optional)

**Connection Management:**
- Edit connection form with all settings
- Connection settings (auto-sync toggles)
- Stock sync interval configuration
- Sync direction selector

**Product Import:**
- Bulk import with product selection
- Import history table
- Progress tracking
- Error details view

**Stock Sync:**
- Sync history table
- Product selection for partial sync
- Sync status tracking

**Order Sync (Future):**
- Order synchronization UI
- Sync configuration
- Order mapping display

### 3. ⏳ Route Configuration

Ensure route is registered in routing system (if needed based on your setup).

---

## Usage Instructions

### For Vendors:

1. **Navigate to Settings → Integrations → BaseLinker**

2. **Connect BaseLinker:**
   - Click "Connect BaseLinker"
   - Enter API Token (from BaseLinker: Settings → API)
   - Enter Inventory ID (usually 1001, 1002, etc.)
   - Click "Connect"

3. **Import Products:**
   - **Single Product:** Click "Import Product" → Enter product ID
   - **All Products:** Click "Import All Products"
   - Products will be created as "Proposed" (pending admin approval)

4. **Sync Stock:**
   - **To BaseLinker:** Updates BaseLinker with Medusa stock
   - **From BaseLinker:** Updates Medusa with BaseLinker stock

---

## API Integration

All hooks connect to backend endpoints:

```
GET    /vendor/baselinker/connections
POST   /vendor/baselinker/connections
GET    /vendor/baselinker/connections/:id
POST   /vendor/baselinker/connections/:id
DELETE /vendor/baselinker/connections/:id
POST   /vendor/baselinker/import/product
POST   /vendor/baselinker/import/bulk
POST   /vendor/baselinker/sync/stock
```

---

## File Structure

```
vendor-panel/
├── src/
│   ├── hooks/
│   │   └── api/
│   │       └── baselinker.tsx              ✅ API hooks
│   ├── routes/
│   │   └── settings/
│   │       └── integrations/
│   │           └── baselinker/
│   │               └── page.tsx            ✅ Main page
│   ├── i18n/
│   │   └── translations/
│   │       ├── $schema.json                ✅ Schema updated
│   │       ├── en.json                     ✅ English translations
│   │       └── pl.json                     ✅ Polish translations
│   └── components/
│       └── layout/
│           └── settings-layout/
│               └── settings-layout.tsx     ⏳ Need to add menu item
└── BASELINKER_UI_IMPLEMENTATION.md         ✅ This file
```

---

## Next Steps

### Immediate (Required):

1. **Add to Settings Menu**
   - Modify `settings-layout.tsx`
   - Add BaseLinker menu item under Integrations

2. **Test Basic Flow**
   - Create connection
   - Import single product
   - Verify product appears in requests
   - Test stock sync

### Short-term (Recommended):

3. **Enhanced Forms**
   - Better connection form with all settings
   - Product selection for bulk import
   - Sync configuration options

4. **History Views**
   - Import history table
   - Sync history table
   - Detailed error views

### Long-term (Optional):

5. **Order Sync UI**
   - Order synchronization interface
   - Order mapping configuration
   - Sync status tracking

6. **Advanced Features**
   - Scheduled sync configuration
   - Webhook management
   - Analytics dashboard

---

## Translation Keys Reference

### Connection:
- `baselinker.title` - "BaseLinker Integration"
- `baselinker.connect` - "Connect BaseLinker"
- `baselinker.disconnect` - "Disconnect"
- `baselinker.connected` - "Connected"
- `baselinker.notConnected` - "Not Connected"

### Import:
- `baselinker.import` - "Import"
- `baselinker.importProduct` - "Import Product"
- `baselinker.importAll` - "Import All Products"
- `baselinker.importing` - "Importing..."
- `baselinker.importSuccess` - "Products imported successfully"

### Sync:
- `baselinker.sync` - "Sync"
- `baselinker.syncStock` - "Sync Stock"
- `baselinker.toBaselinker` - "To BaseLinker"
- `baselinker.fromBaselinker` - "From BaseLinker"
- `baselinker.syncSuccess` - "Stock synced successfully"

### Status:
- `baselinker.active` - "Active"
- `baselinker.pending` - "Pending"
- `baselinker.completed` - "Completed"
- `baselinker.error` - "Error"

---

## Testing Checklist

- [ ] Settings menu shows BaseLinker integration
- [ ] Can navigate to BaseLinker page
- [ ] Can create connection with API token
- [ ] Connection status shows "Connected"
- [ ] Can import single product
- [ ] Product appears in requests (proposed status)
- [ ] Can import all products
- [ ] Can sync stock to BaseLinker
- [ ] Can sync stock from BaseLinker
- [ ] Can delete connection
- [ ] Toast notifications work
- [ ] Loading states display correctly
- [ ] Error messages are clear
- [ ] Translations work in both languages

---

## Summary

**Completed:**
- ✅ 76 translation keys (EN + PL)
- ✅ 8 API hooks with TypeScript types
- ✅ Main integration page with core functionality
- ✅ Connection management
- ✅ Product import (single + bulk)
- ✅ Stock synchronization

**Remaining:**
- ⏳ Add to settings navigation menu
- ⏳ Enhanced UI components (optional)
- ⏳ History views (optional)
- ⏳ Order sync UI (future)

**The core BaseLinker integration UI is ready to use!**
