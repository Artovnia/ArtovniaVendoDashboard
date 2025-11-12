# Conditional Carrier Options - Shipping vs Return Options

## Overview
This document describes the implementation of conditional rendering for carrier/shipping method selection in the shipping option creation form. The form is used for both **shipping options** and **return options**, and the available carrier choices differ based on the context.

## Business Requirements

### Shipping Options
When creating a **shipping option**, vendors should see all available carrier options:
- Inpost Kurier
- Inpost paczkomat
- DHL
- Fedex
- DPD
- GLS
- UPS

### Return Options
When creating a **return option**, vendors should only see:
- **Polish**: "Wysyłka przez klienta"
- **English**: "Shipping by customer"

This is because returns are handled by the customer, not by the vendor's preferred carrier.

## Implementation Details

### File Location
```
F:\StronyInternetowe\mercur\vendor-panel\src\routes\locations\location-service-zone-shipping-option-create\components\create-shipping-options-form\create-shipping-option-details-form.tsx
```

### Current Implementation (Lines 181-214)
The carrier selection field currently shows hardcoded shipping carriers:

```tsx
<Form.Field
  control={form.control}
  name='name'
  render={({ field }) => {
    return (
      <Form.Item>
        <Form.Label>
          {t('fields.name')}
        </Form.Label>
        <Form.Control>
          <Select
            {...field}
            onValueChange={field.onChange}
          >
            <Select.Trigger ref={field.ref}>
              <Select.Value />
            </Select.Trigger>

            <Select.Content>
              <Select.Item value="Inpost Kurier">Inpost Kurier</Select.Item>
              <Select.Item value="Inpost paczkomat">Inpost paczkomat</Select.Item>
              <Select.Item value="DHL">DHL</Select.Item>
              <Select.Item value="Fedex">Fedex</Select.Item>
              <Select.Item value="DPD">DPD</Select.Item>
              <Select.Item value="GLS">GLS</Select.Item>
              <Select.Item value="UPS">UPS</Select.Item>
            </Select.Content>
          </Select>
        </Form.Control>
        <Form.ErrorMessage />
      </Form.Item>
    );
  }}
/>
```

### Required Changes

#### 1. Add Translation Keys

**English (`en.json`)** - Add to `stockLocations.shippingOptions.fields`:
```json
"name": {
  "label": "Carrier",
  "shippingByCustomer": "Shipping by customer"
}
```

**Polish (`pl.json`)** - Add to `stockLocations.shippingOptions.fields`:
```json
"name": {
  "label": "Przewoźnik",
  "shippingByCustomer": "Wysyłka przez klienta"
}
```

#### 2. Update Component Logic

Replace the current Select.Content section with conditional rendering:

```tsx
<Select.Content>
  {isReturn ? (
    // Return option: Only show "Shipping by customer"
    <Select.Item value="customer-shipping">
      {t('stockLocations.shippingOptions.fields.name.shippingByCustomer')}
    </Select.Item>
  ) : (
    // Shipping option: Show all carriers
    <>
      <Select.Item value="Inpost Kurier">Inpost Kurier</Select.Item>
      <Select.Item value="Inpost paczkomat">Inpost paczkomat</Select.Item>
      <Select.Item value="DHL">DHL</Select.Item>
      <Select.Item value="Fedex">Fedex</Select.Item>
      <Select.Item value="DPD">DPD</Select.Item>
      <Select.Item value="GLS">GLS</Select.Item>
      <Select.Item value="UPS">UPS</Select.Item>
    </>
  )}
</Select.Content>
```

#### 3. Update Form Label (Optional)

You can also update the label to be more descriptive:

```tsx
<Form.Label>
  {t(isReturn 
    ? 'stockLocations.shippingOptions.fields.name.label' 
    : 'fields.name'
  )}
</Form.Label>
```

### Component Props Context

The component already receives the `isReturn` prop:

```tsx
type CreateShippingOptionDetailsFormProps = {
  form: UseFormReturn<CreateShippingOptionSchema>;
  isReturn?: boolean;  // ✅ Already available
  zone: HttpTypes.AdminServiceZone;
  locationId: string;
  fulfillmentProviderOptions: HttpTypes.AdminFulfillmentProviderOption[];
  selectedProviderId?: string;
  type: FulfillmentSetType;
};
```

This prop is set based on the route context and determines whether the form is being used for shipping or return option creation.

## Testing Checklist

### Shipping Option Creation
- [ ] Navigate to shipping option creation
- [ ] Verify all 7 carrier options are visible
- [ ] Verify options are in Polish when locale is `pl`
- [ ] Verify options are in English when locale is `en`
- [ ] Verify carrier selection works correctly

### Return Option Creation
- [ ] Navigate to return option creation
- [ ] Verify only "Wysyłka przez klienta" (PL) or "Shipping by customer" (EN) is visible
- [ ] Verify the option is automatically selected (since it's the only one)
- [ ] Verify form submission works correctly with this value

### Edge Cases
- [ ] Test language switching between PL and EN
- [ ] Verify form validation still works
- [ ] Test with existing shipping/return options
- [ ] Verify the value is correctly saved to the database

## Database Considerations

### Value Storage
The `name` field value will be stored as:
- **Shipping options**: Original carrier names (e.g., "Inpost Kurier", "DHL")
- **Return options**: `"customer-shipping"` (internal value)

### Display Logic
When displaying return options in lists or details:
- Use the translation key `stockLocations.shippingOptions.fields.name.shippingByCustomer`
- Check if value equals `"customer-shipping"` to determine if it's a customer-handled return

## Related Files

### Translation Files
- `F:\StronyInternetowe\mercur\vendor-panel\src\i18n\translations\en.json`
- `F:\StronyInternetowe\mercur\vendor-panel\src\i18n\translations\pl.json`

### Component Files
- `F:\StronyInternetowe\mercur\vendor-panel\src\routes\locations\location-service-zone-shipping-option-create\components\create-shipping-options-form\create-shipping-option-details-form.tsx`

### Schema Files
- `F:\StronyInternetowe\mercur\vendor-panel\src\routes\locations\location-service-zone-shipping-option-create\components\create-shipping-options-form\schema.ts`

## Future Enhancements

### Dynamic Carrier List
Consider moving carrier options to a configuration file or database table:
```typescript
const SHIPPING_CARRIERS = [
  { value: 'inpost-kurier', label: 'Inpost Kurier' },
  { value: 'inpost-paczkomat', label: 'Inpost paczkomat' },
  { value: 'dhl', label: 'DHL' },
  { value: 'fedex', label: 'Fedex' },
  { value: 'dpd', label: 'DPD' },
  { value: 'gls', label: 'GLS' },
  { value: 'ups', label: 'UPS' },
];
```

### Carrier-Specific Settings
Different carriers may require different configuration options (e.g., parcel locker selection for Inpost paczkomat). Consider adding conditional fields based on selected carrier.

### Return Shipping Labels
For future implementation, consider integrating with carrier APIs to generate return shipping labels when customers initiate returns.

## Notes

- The `isReturn` prop is already being used in the component for other conditional rendering (lines 107-109, 119-125)
- The form already has proper i18n support via `useTranslation` hook
- The component follows Medusa UI patterns and should maintain consistency
- Consider adding a default value for return options since there's only one choice

## Additional Feature: Zero-Price Auto-Fill for Return Options

### Implementation in Pricing Form

**File**: `create-shipping-options-prices-form.tsx`

When creating return options, the pricing form automatically:
1. **Fills all prices with 0** - Returns are paid by customers, not sellers
2. **Disables price editing** - Visual indication that prices cannot be changed
3. **Applies to all currencies and regions** - Comprehensive zero-price coverage

**Technical Implementation**:
```typescript
// Props updated to include isReturn
type PricingPricesFormProps = {
  form: UseFormReturn<CreateShippingOptionSchema>
  type: FulfillmentSetType
  isReturn?: boolean  // ✅ Added
}

// useEffect automatically fills prices with 0
useEffect(() => {
  if (!isLoading && (isPickup || isReturn)) {
    if (currencies.length > 0) {
      currencies.forEach((currency) => {
        form.setValue(`currency_prices.${currency}`, "0")
      })
    }
    if (regions.length > 0) {
      regions.forEach((region) => {
        form.setValue(`region_prices.${region.id}`, "0")
      })
    }
  }
}, [isLoading, isPickup, isReturn, currencies, regions, form])

// DataGrid disabled for return options
<DataGrid
  disableInteractions={isReturn || getIsOpen(CONDITIONAL_PRICES_STACKED_MODAL_ID)}
/>
```

**User Experience**:
- Return option pricing tab shows all prices as 0
- Price fields are visually disabled (grayed out)
- Users cannot edit prices for return options
- Clear indication that customer pays for return shipping

## Additional Feature: Carrier Name Translations

### Implementation in Details Form

**File**: `create-shipping-option-details-form.tsx`

All carrier names now support i18n:
- **English**: "Inpost Courier", "Inpost Parcel Locker", "DHL", "Fedex", "DPD", "GLS", "UPS"
- **Polish**: "Inpost Kurier", "Inpost Paczkomat", "DHL", "Fedex", "DPD", "GLS", "UPS"

**Translation Keys Added**:
```json
"stockLocations.shippingOptions.fields.name.carriers": {
  "inpostKurier": "Inpost Courier" / "Inpost Kurier",
  "inpostPaczkomat": "Inpost Parcel Locker" / "Inpost Paczkomat",
  "dhl": "DHL",
  "fedex": "Fedex",
  "dpd": "DPD",
  "gls": "GLS",
  "ups": "UPS"
}
```

## Simplified Pricing: Currency-Only Model

### Rationale
Service zones are created per country/region, making region-specific pricing redundant. The pricing form now only displays currency-based prices, simplifying the UX.

### Changes in `create-shipping-options-prices-form.tsx`
1. **Removed region price columns** - `regions: []` passed to `useShippingOptionPriceColumns`
2. **Simplified data grid** - Only currency data displayed
3. **Removed region auto-fill** - Only currency prices are set to 0 for returns/pickups

**Benefits**:
- Cleaner UI with fewer fields
- Reduced confusion (no duplicate region/currency pricing)
- Matches business logic (zones are already region-specific)
- Simpler form validation

## Implementation Priority

**Priority**: Medium  
**Complexity**: Low  
**Estimated Time**: 30 minutes

### Steps:
1. ✅ Add translation keys (5 min) - **COMPLETED**
2. ✅ Update component logic (10 min) - **COMPLETED**
3. ✅ Add pricing auto-fill (10 min) - **COMPLETED**
4. ✅ Add carrier name translations (5 min) - **COMPLETED**
5. ✅ Remove region-specific pricing (10 min) - **COMPLETED**
6. Test both scenarios (10 min)
7. Update documentation (5 min)
