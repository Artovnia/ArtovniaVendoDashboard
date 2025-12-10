# Onboarding Enforcement System

## Overview
This system enforces step-by-step onboarding completion for new vendors before they can access the main dashboard and other features.

## Architecture

### 1. **OnboardingGuard** (`src/components/authentication/onboarding-guard/`)
Route guard that checks onboarding completion status and blocks access to restricted routes.

**Allowed routes during onboarding:**
- `/onboarding` - The wizard itself
- `/settings/store` - Step 1: Store Information
- `/settings/locations/batch-setup` - Step 2: Locations & Shipping
- `/stripe-connect` - Step 3: Stripe Connect
- `/products/create` - Step 4: Add Products
- `/logout` - Allow logout

**Behavior:**
- If onboarding incomplete → Redirect to `/onboarding`
- If onboarding complete and on `/onboarding` → Redirect to `/`
- Otherwise → Allow access

### 2. **OnboardingWizard** (`src/routes/onboarding/`)
Fullscreen step-by-step wizard that guides vendors through onboarding.

**Features:**
- **Language Switcher** - Switch between English and Polish anytime
- **Logout Button** - Exit onboarding and test with different accounts
- Visual progress indicator (4 steps)
- Sequential step unlocking (must complete step 1 before step 2, etc.)
- Completion status tracking
- Direct navigation to each step's configuration page
- Completion celebration screen
- Persistent top bar with language and logout controls

**Steps:**
1. **Store Information** (`/settings/store`)
   - Company name, description, contact info
   - Required first

2. **Locations & Shipping** (`/settings/locations/batch-setup`)
   - Batch setup for locations and shipping methods
   - Unlocks after step 1

3. **Stripe Connect** (`/stripe-connect`)
   - Payment account setup
   - Unlocks after step 2

4. **Add Products** (`/products/create`)
   - First product creation
   - Unlocks after step 3

### 3. **ProtectedRoute** (`src/components/authentication/protected-route/`)
Updated to include `OnboardingGuard` after authentication check.

**Flow:**
```
User Request
    ↓
ProtectedRoute (Check auth)
    ↓
OnboardingGuard (Check onboarding)
    ↓
MainLayout / Route Component
```

## API Integration

### Backend Endpoint
`GET /vendor/sellers/me/onboarding`

Returns:
```typescript
{
  onboarding: {
    store_information: boolean
    locations_shipping: boolean
    stripe_connect: boolean
    products: boolean
  }
}
```

### Recalculation
`POST /vendor/sellers/me/onboarding`

Triggers onboarding status recalculation based on:
- Seller profile completeness
- Location and shipping method existence
- Stripe account connection
- Product count > 0

## User Experience

### New Vendor Flow
1. **Login** → Authenticated
2. **Redirect to `/onboarding`** → Wizard appears
3. **Complete Step 1** → Store Information form
4. **Return to wizard** → Step 2 unlocked
5. **Complete Step 2** → Batch shipping setup
6. **Return to wizard** → Step 3 unlocked
7. **Complete Step 3** → Stripe Connect
8. **Return to wizard** → Step 4 unlocked
9. **Complete Step 4** → Add first product
10. **Completion screen** → "Przejdź do panelu" button
11. **Access granted** → Full dashboard access

### Existing Vendor (Onboarding Complete)
- Direct access to dashboard
- No wizard shown
- All routes accessible

### Partial Completion
- Wizard shows current progress
- Can edit completed steps
- Cannot skip ahead to locked steps
- Cannot access restricted routes (products list, orders, etc.)

## Benefits

### ✅ Enforced Completion
- Vendors cannot bypass onboarding
- Ensures all critical setup is complete
- Prevents incomplete seller profiles

### ✅ Clear Progress
- Visual progress indicator
- Step-by-step guidance
- Clear next actions

### ✅ Sequential Flow
- Logical order (store → shipping → payment → products)
- Each step builds on previous
- No confusion about what to do next

### ✅ Flexible Navigation
- Can return to wizard anytime
- Can edit completed steps
- Can logout during onboarding

## Technical Details

### State Management
- Uses `useOnboarding()` hook to fetch status
- Recalculates on wizard mount via `useUpdateOnboarding()`
- Real-time status updates after each step

### Route Protection
- Implemented at router level (not component level)
- Blocks navigation before component render
- Prevents unauthorized access via URL manipulation

### Performance
- Lazy-loaded wizard component
- Minimal re-renders
- Efficient status checks

## Testing Scenarios

### Test Case 1: New Vendor
1. Create new vendor account
2. Login
3. Verify redirect to `/onboarding`
4. Verify steps 2-4 are disabled
5. Complete step 1
6. Verify step 2 unlocked
7. Try accessing `/products` → Should redirect to `/onboarding`
8. Complete all steps
9. Verify redirect to dashboard
10. Verify full access granted

### Test Case 2: Partial Completion
1. Login with vendor who completed steps 1-2
2. Verify redirect to `/onboarding`
3. Verify steps 1-2 marked complete
4. Verify step 3 unlocked, step 4 locked
5. Try accessing `/orders` → Should redirect to `/onboarding`

### Test Case 3: Complete Vendor
1. Login with fully onboarded vendor
2. Verify direct access to dashboard
3. Verify no redirect to `/onboarding`
4. Try accessing `/onboarding` → Should redirect to `/`

## Customization

### Adding New Steps
1. Update backend onboarding calculation
2. Add step to `steps` array in `onboarding-wizard.tsx`
3. Add route to `allowedOnboardingRoutes` in `onboarding-guard.tsx`
4. Update `isOnboardingComplete` check

### Changing Step Order
1. Reorder `steps` array in wizard
2. Update `disabled` logic for dependencies
3. Update translations

### Skipping Steps (Not Recommended)
To allow skipping certain steps:
1. Remove from `isOnboardingComplete` check
2. Remove `disabled` dependency in wizard
3. Keep in `allowedOnboardingRoutes` for access

## Translations

Required translation keys:
```
dashboard.onboarding.wizard.title          // "Store Setup" / "Konfiguracja sklepu"
dashboard.onboarding.wizard.heading        // "Welcome to Artovnia!" / "Witaj w Artovnia!"
dashboard.onboarding.wizard.description    // Step description
dashboard.onboarding.steps.storeInfo
dashboard.onboarding.steps.locationsShipping
dashboard.onboarding.steps.stripeConnect
dashboard.onboarding.steps.addProducts
dashboard.onboarding.buttons.setup
dashboard.onboarding.buttons.edit
dashboard.onboarding.buttons.add
dashboard.onboarding.buttons.manage
dashboard.onboarding.complete.title        // "Congratulations!" / "Gratulacje!"
dashboard.onboarding.complete.description
dashboard.onboarding.complete.button       // "Go to Dashboard" / "Przejdź do panelu"
app.menus.actions.logout                   // "Logout" / "Wyloguj"
```

**Translation files updated:**
- `src/i18n/translations/en.json`
- `src/i18n/translations/pl.json`
- `src/i18n/translations/$schema.json`

## Troubleshooting

### Vendor Stuck in Onboarding
1. Check backend onboarding status: `GET /vendor/sellers/me/onboarding`
2. Verify data completeness (locations, products, stripe account)
3. Trigger recalculation: `POST /vendor/sellers/me/onboarding`
4. Check browser console for errors

### Wizard Not Showing
1. Verify `OnboardingGuard` is in `ProtectedRoute`
2. Check `/onboarding` route in `route-map.tsx`
3. Verify `useOnboarding()` hook returns data
4. Check for JavaScript errors

### Steps Not Unlocking
1. Verify backend returns correct status
2. Check `disabled` logic in wizard
3. Ensure previous step is marked complete
4. Trigger status recalculation

## Future Enhancements

### Potential Improvements
- [ ] Add step validation before marking complete
- [ ] Add "Skip for now" option with warnings
- [ ] Add onboarding analytics (time per step, completion rate)
- [ ] Add tooltips/help text for each step
- [ ] Add video tutorials embedded in wizard
- [ ] Add email notifications for incomplete onboarding
- [ ] Add admin dashboard to view vendor onboarding status
- [ ] Add ability to reset onboarding for testing

## Related Files

### Frontend
- `src/components/authentication/onboarding-guard/onboarding-guard.tsx`
- `src/components/authentication/protected-route/protected-route.tsx`
- `src/routes/onboarding/onboarding-wizard.tsx`
- `src/routes/dashboard/dashboard.tsx`
- `src/routes/dashboard/components/dashboard-onboarding.tsx`
- `src/providers/router-provider/route-map.tsx`

### Backend
- `apps/backend/src/api/vendor/sellers/me/onboarding/route.ts`
- `apps/backend/src/workflows/seller/workflows/recalculate-onboarding.ts`

### Hooks
- `src/hooks/api/onboarding.ts` (useOnboarding, useUpdateOnboarding)
