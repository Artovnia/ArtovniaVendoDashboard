# Page Builder Enhancements Implementation

## Status: In Progress

### Completed ✅
1. **Timeline Preview Layout Fix** - Preview now correctly reflects alternating, vertical, and horizontal layouts
2. **Timeline Badge/Dot Alignment Fix** - Fixed alignment issues in TimelineBlock.tsx for all three layouts
3. **Timeline Type Updates** - Added `badge_style`, `title_alignment`, and `title_italic` to TimelineBlockData

### In Progress 🔄

#### 1. Timeline Badge Styles (5 variants)
**Badge Style Options:**
- `solid` (default) - Filled background with white text
- `outline` - Border only with dark text
- `minimal` - No background, just text with subtle styling
- `pill` - Extra rounded corners
- `rounded` - Standard rounded corners (current default)

**Files to Update:**
- ✅ `apps/backend/src/modules/vendor-page/types/blocks.ts` - Type updated
- ⏳ `vendor-panel/src/routes/page-builder/components/block-forms/block-form.tsx` - Add badge style selector
- ⏳ `ArtovniaStorefront/src/components/organisms/VendorPageBlocks/blocks/TimelineBlock.tsx` - Render badge styles
- ⏳ `vendor-panel/src/routes/page-builder/components/block-preview.tsx` - Show badge styles in preview

#### 2. Header Styling for All Blocks
**Header Style Options:**
- `title_italic` - Boolean to make title italic
- `title_alignment` - 'left' | 'center' | 'right'

**Blocks Requiring Updates:**
All blocks with titles need these two properties added:
- ✅ TimelineBlockData (already added)
- ⏳ ProcessBlockData
- ⏳ FeaturedProductsBlockData
- ⏳ TeamBlockData
- ⏳ CategoriesBlockData
- ⏳ BehindScenesBlockData
- ⏳ ImageGalleryBlockData (optional title)
- ⏳ RichTextBlockData (heading field)

**Implementation Steps:**
1. Update all block type interfaces in `blocks.ts`
2. Update all block forms to include header styling controls
3. Update all frontend block components to apply header styles
4. Update all preview components to show header styles

#### 3. Block Spacing Solution
**Recommended Approach: Spacer Block**

**Rationale:**
- Clean separation of concerns
- Flexible - users can add spacing anywhere
- Follows existing block pattern
- Easy to implement and maintain
- Allows different spacing amounts

**Spacer Block Design:**
```typescript
export interface SpacerBlockData {
  type: 'spacer'
  height: 'small' | 'medium' | 'large' | 'xlarge'
  // small: 2rem (32px)
  // medium: 4rem (64px)
  // large: 6rem (96px)
  // xlarge: 8rem (128px)
}
```

**Files to Create/Update:**
- `blocks.ts` - Add SpacerBlockData type
- `block-form.tsx` - Add SpacerBlockForm (simple height selector)
- `block-preview.tsx` - Add SpacerPreview (visual height indicator)
- `TimelineBlock.tsx` - Create SpacerBlock.tsx component
- `block-editor.tsx` - Add 'spacer' to block types
- `page-builder-content.tsx` - Add spacer to block creation

### Translation Keys Needed

#### Timeline Badge Styles
```json
{
  "pagebuilder": {
    "blockForm": {
      "timeline": {
        "badgeStyle": "Badge Style",
        "badgeStyleSolid": "Solid - Filled background",
        "badgeStyleOutline": "Outline - Border only",
        "badgeStyleMinimal": "Minimal - Clean text",
        "badgeStylePill": "Pill - Extra rounded",
        "badgeStyleRounded": "Rounded - Standard corners"
      }
    }
  }
}
```

#### Header Styling (Common)
```json
{
  "pagebuilder": {
    "blockForm": {
      "common": {
        "titleAlignment": "Title Alignment",
        "titleItalic": "Italic Title",
        "alignmentLeft": "Left",
        "alignmentCenter": "Center",
        "alignmentRight": "Right"
      }
    }
  }
}
```

#### Spacer Block
```json
{
  "pagebuilder": {
    "blocks": {
      "spacer": "Spacing"
    },
    "blockForm": {
      "spacer": {
        "height": "Spacing Height",
        "heightSmall": "Small (32px)",
        "heightMedium": "Medium (64px)",
        "heightLarge": "Large (96px)",
        "heightXlarge": "Extra Large (128px)"
      }
    },
    "blockPreview": {
      "spacerHeight": "Spacing: {{height}}"
    }
  }
}
```

### Implementation Priority

**Phase 1: Timeline Enhancements** (Current)
1. ✅ Fix preview layout rendering
2. ✅ Fix badge/dot alignment
3. ⏳ Add badge style selector to form
4. ⏳ Implement badge styles in frontend
5. ⏳ Update preview to show badge styles

**Phase 2: Header Styling** (Next)
1. Update all block type definitions
2. Create reusable header styling form component
3. Update all block forms
4. Update all frontend blocks
5. Update all previews

**Phase 3: Spacing Solution** (Final)
1. Create spacer block type
2. Implement spacer form
3. Implement spacer preview
4. Implement spacer frontend component
5. Add to block selector

### Testing Checklist

#### Timeline
- [ ] Preview updates when layout changes
- [ ] Badge/dot alignment correct in all layouts
- [ ] Badge styles render correctly
- [ ] Badge style changes reflect in preview

#### Header Styling
- [ ] Italic toggle works for all blocks
- [ ] Alignment works for all blocks
- [ ] Styles persist after save
- [ ] Preview shows correct styling

#### Spacer
- [ ] Spacer appears in block selector
- [ ] Height selector works
- [ ] Spacing renders correctly on frontend
- [ ] Preview shows visual height indicator

## Next Steps

Continue with timeline badge style implementation, then move to header styling for all blocks, and finally implement the spacer block solution.
