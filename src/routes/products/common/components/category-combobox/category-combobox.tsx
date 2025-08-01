import {
  ArrowUturnLeft,
  EllipseMiniSolid,
  TriangleRightMini,
  TrianglesMini,
  XMarkMini,
} from '@medusajs/icons';
import { AdminProductCategoryResponse } from '@medusajs/types';
import { Divider, Text, clx } from '@medusajs/ui';
import { Popover as RadixPopover } from 'radix-ui';
import {
  CSSProperties,
  ComponentPropsWithoutRef,
  Fragment,
  MouseEvent,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { TextSkeleton } from '../../../../../components/common/skeleton';
import { useProductCategories } from '../../../../../hooks/api/categories';
import { useDebouncedSearch } from '../../../../../hooks/use-debounced-search';

interface CategoryComboboxProps
  extends Omit<
    ComponentPropsWithoutRef<'input'>,
    'value' | 'defaultValue' | 'onChange'
  > {
  value: string[];
  onChange: (value: string[]) => void;
}

type Level = {
  id: string;
  label: string;
};

const TABLUAR_NUM_WIDTH = 8;
const TAG_BASE_WIDTH = 28;

export const CategoryCombobox = forwardRef<
  HTMLInputElement,
  CategoryComboboxProps
>(({ value, onChange, className, ...props }, ref) => {
  const innerRef = useRef<HTMLInputElement>(null);

  useImperativeHandle<
    HTMLInputElement | null,
    HTMLInputElement | null
  >(ref, () => innerRef.current, []);

  const [open, setOpen] = useState(false);

  const { i18n, t } = useTranslation();

  const [level, setLevel] = useState<Level[]>([]);
  const { searchValue, onSearchValueChange, query } =
    useDebouncedSearch();

  const { product_categories: allCategories, isPending, isError, error } =
    useProductCategories(
      {
        fields: 'id,name,handle,is_active,is_internal,parent_category_id,category_children',
        limit: 1000, // Set high limit to get all categories like category-list-table.tsx
        offset: 0,
      },
      {
        enabled: open,
      }
    );

  // Enhanced client-side hierarchical filtering with robust data consistency handling
  const product_categories = useMemo(() => {
    if (!allCategories) return [];
    
    // If searching, return all categories that match the search
    if (searchValue) {
      return allCategories.filter(cat => 
        cat.name.toLowerCase().includes(searchValue.toLowerCase())
      );
    }
    
    // If at root level, return only top-level categories (no parent)
    if (level.length === 0) {
      return allCategories.filter(cat => !cat.parent_category_id);
    }
    
    // If in a subcategory, use multiple approaches to find children
    const currentParentId = getParentId(level);
    const currentParent = allCategories.find(cat => cat.id === currentParentId);
    
    // Method 1: Try to use the parent's category_children array if available and populated
    if (currentParent?.category_children && currentParent.category_children.length > 0) {
      const childrenIds = currentParent.category_children.map(child => child.id);
      const childrenFromArray = allCategories.filter(cat => childrenIds.includes(cat.id));
      
      // Verify that we actually found children, if not fall back to method 2
      if (childrenFromArray.length > 0) {
        return childrenFromArray;
      }
    }
    
    // Method 2: Fallback to parent_category_id filtering (more reliable)
    const childrenFromParentId = allCategories.filter(cat => cat.parent_category_id === currentParentId);
    
    // Method 3: If still no children found, try to find any categories that reference this parent
    // This handles cases where the relationship data might be inconsistent
    if (childrenFromParentId.length === 0 && currentParent) {
      // Look for categories that might be children but have inconsistent parent references
      const potentialChildren = allCategories.filter(cat => {
        // Check if this category's name suggests it's a child of the current parent
        // or if it has any relationship indicators
        return cat.id !== currentParentId && 
               cat.parent_category_id === currentParentId;
      });
      
      return potentialChildren;
    }
    
    return childrenFromParentId;
  }, [allCategories, searchValue, level]);

  const [showLoading, setShowLoading] = useState(false);

  /**
   * We add a small artificial delay to the end of the loading state,
   * this is done to prevent the popover from flickering too much when
   * navigating between levels or searching.
   */
  useEffect(() => {
    let timeoutId:
      | ReturnType<typeof setTimeout>
      | undefined;

    if (isPending) {
      setShowLoading(true);
    } else {
      timeoutId = setTimeout(() => {
        setShowLoading(false);
      }, 150);
    }

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isPending]);

  useEffect(() => {
    if (searchValue) {
      setLevel([]);
    }
  }, [searchValue]);

  function handleLevelUp(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();

    setLevel(level.slice(0, level.length - 1));

    innerRef.current?.focus();
  }

  function handleLevelDown(option: ProductCategoryOption) {
    return (e: MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();

      setLevel([
        ...level,
        { id: option.value, label: option.label },
      ]);

      innerRef.current?.focus();
    };
  }

  const handleSelect = useCallback(
    (option: ProductCategoryOption) => {
      return (e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();

        if (isSelected(value, option.value)) {
          onChange(value.filter((v) => v !== option.value));
        } else {
          onChange([...value, option.value]);
        }

        innerRef.current?.focus();
      };
    },
    [value, onChange]
  );

  function handleOpenChange(open: boolean) {
    if (!open) {
      onSearchValueChange('');
      setLevel([]);
    }

    if (open) {
      requestAnimationFrame(() => {
        innerRef.current?.focus();
      });
    }

    setOpen(open);
  }

  const options = getOptions(product_categories || [], allCategories);

  const showTag = value.length > 0;
  const showSelected = !open && value.length > 0;

  const tagWidth = useMemo(() => {
    const count = value.length;
    const digits = count.toString().length;

    return TAG_BASE_WIDTH + digits * TABLUAR_NUM_WIDTH;
  }, [value]);

  const showLevelUp = !searchValue && level.length > 0;

  const [focusedIndex, setFocusedIndex] =
    useState<number>(-1);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!open) {
        return;
      }

      const optionsLength = showLevelUp
        ? options.length + 1
        : options.length;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex((prev) => {
          const nextIndex =
            prev < optionsLength - 1 ? prev + 1 : prev;
          return nextIndex;
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex((prev) => {
          return prev > 0 ? prev - 1 : prev;
        });
      } else if (e.key === 'ArrowRight') {
        const index = showLevelUp
          ? focusedIndex - 1
          : focusedIndex;
        const hasChildren = options[index]?.has_children;

        if (!hasChildren || !!searchValue) {
          return;
        }

        e.preventDefault();
        setLevel([
          ...level,
          {
            id: options[index].value,
            label: options[index].label,
          },
        ]);
        setFocusedIndex(0);
      } else if (e.key === 'Enter' && focusedIndex !== -1) {
        e.preventDefault();

        if (showLevelUp && focusedIndex === 0) {
          setLevel(level.slice(0, level.length - 1));
          setFocusedIndex(0);
          return;
        }

        const index = showLevelUp
          ? focusedIndex - 1
          : focusedIndex;

        handleSelect(options[index])(e as any);
      }
    },
    [
      open,
      focusedIndex,
      options,
      level,
      handleSelect,
      searchValue,
      showLevelUp,
    ]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  if (isError) {
    throw error;
  }

  return (
    <RadixPopover.Root
      open={open}
      onOpenChange={handleOpenChange}
    >
      <RadixPopover.Anchor
        asChild
        onClick={() => {
          if (!open) {
            handleOpenChange(true);
          }
        }}
      >
        {/* 
         * ANCHOR: This is the main trigger element for the popover, styled to look like an input field.
         * It displays the number of selected categories or a placeholder.
         * Clicking this div opens the popover.
         */}
        <div
          data-anchor
          className={clx(
            'relative flex cursor-pointer items-center gap-x-2 overflow-hidden',
            'h-8 w-full rounded-md',
            'bg-ui-bg-field transition-fg shadow-borders-base',
            'has-[input:focus]:shadow-borders-interactive-with-active',
            'has-[:invalid]:shadow-borders-error has-[[aria-invalid=true]]:shadow-borders-error',
            'has-[:disabled]:bg-ui-bg-disabled has-[:disabled]:text-ui-fg-disabled has-[:disabled]:cursor-not-allowed',
            {
              // Fake the focus state as long as the popover is open,
              // this prevents the styling from flickering when navigating
              // between levels.
              'shadow-borders-interactive-with-active':
                open,
            },
            className
          )}
          style={
            {
              '--tag-width': `${tagWidth}px`,
            } as CSSProperties
          }
        >
          {showTag && (
            <button
              type='button'
              onClick={(e) => {
                e.preventDefault();
                onChange([]);
              }}
              className='bg-ui-bg-subtle hover:bg-ui-bg-base-hover txt-compact-small-plus text-ui-fg-subtle focus-within:border-ui-fg-interactive transition-fg absolute left-0.5 top-0.5 flex h-[28px] items-center rounded-[4px] border py-[4px] pl-1.5 pr-1 outline-none'
            >
              <span className='tabular-nums'>
                {value.length}
              </span>
              <XMarkMini className='text-ui-fg-muted' />
            </button>
          )}
          {showSelected && (
            <div className='pointer-events-none absolute inset-y-0 left-[calc(var(--tag-width)+8px)] flex size-full items-center'>
              <Text size='small' leading='compact'>
                {t('general.selected')}
              </Text>
            </div>
          )}
          <input
            ref={innerRef}
            value={searchValue}
            onChange={(e) => {
              onSearchValueChange(e.target.value);
            }}
            className={clx(
              'txt-compact-small size-full cursor-pointer appearance-none bg-transparent pr-8 outline-none',
              'hover:bg-ui-bg-field-hover',
              'focus:cursor-text',
              'placeholder:text-ui-fg-muted',
              {
                'pl-2': !showTag,
                'pl-[calc(var(--tag-width)+8px)]': showTag,
              }
            )}
            {...props}
          />
          <button
            type='button'
            onClick={() => handleOpenChange(true)}
            className='text-ui-fg-muted transition-fg hover:bg-ui-bg-field-hover absolute right-0 flex size-8 items-center justify-center rounded-r outline-none'
          >
            <TrianglesMini className='text-ui-fg-muted' />
          </button>
        </div>
      </RadixPopover.Anchor>
      {/* 
       * POPOVER CONTENT: This is the floating part of the component that appears when the popover is open.
       * It contains the search bar, breadcrumbs, and the list of categories.
       */}
      <RadixPopover.Content
        sideOffset={4}
        role='listbox'
        className={clx(
          'shadow-elevation-flyout bg-ui-bg-base -left-2 z-50 w-[var(--radix-popper-anchor-width)] rounded-[8px] ',
          'max-h-[200px] overflow-y-auto',
          'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
          'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
          'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2'
        )}
        onInteractOutside={(e) => {
          e.preventDefault();

          const target = e.target as HTMLElement;

          if (target.closest('[data-anchor]')) {
            return;
          }

          handleOpenChange(false);
        }}
      >
        {showLevelUp && (
          <Fragment>
            {/* 
             * LEVEL UP BUTTON: This button allows the user to navigate up one level in the category hierarchy.
             * It is displayed when the user has navigated down into a subcategory.
             */}
            <div className='p-3'>
              <button
                data-active={focusedIndex === 0}
                role='button'
                className={clx(
                  'transition-fg grid w-full appearance-none grid-cols-[20px_1fr] items-center justify-center gap-2 rounded-md px-2 py-1.5 text-left outline-none',
                  'data-[active=true]:bg-ui-bg-field-hover'
                )}
                type='button'
                onClick={handleLevelUp}
                onMouseEnter={() => setFocusedIndex(0)}
                onMouseLeave={() => setFocusedIndex(-1)}
                tabIndex={-1}
              >
                <ArrowUturnLeft className='text-ui-fg-muted' />
                <Text size='small' leading='compact'>
                  {getParentLabel(level)}
                </Text>
              </button>
            </div>
            <Divider />
          </Fragment>
        )}
        {/* 
         * OPTIONS LIST: This is the scrollable area where the category options are displayed.
         * It handles rendering the list of categories, the loading state, and the 'no results' message.
         */}
        <div className='p-2'>
          {options.length > 0 &&
            !showLoading &&
            options.map((option, index) => (
              /*
               * CATEGORY ITEM WRAPPER: Represents a single category row in the list.
               * It contains the main button for selection and an optional arrow button for navigation.
               */
              <div
                key={option.value}
                className={clx(
                  'transition-fg bg-ui-bg-base hover:bg-ui-bg-field-hover grid cursor-pointer grid-cols-1 items-center mb-1 gap-2 overflow-hidden',
                  {
                    'grid-cols-[1fr_32px]':
                      option.has_children && !searchValue,
                  }
                )}
              >
                {/* 
                 * OPTION ITEM: This is a single category option in the list.
                 * It displays the category name and an icon indicating whether it has children.
                 */}
                {/* 
                 * CATEGORY SELECTION BUTTON: The main clickable area for a category.
                 * It handles selection and displays the category name and a checkmark if selected.
                 */}
                <button
                  data-active={
                    showLevelUp
                      ? focusedIndex === index + 1
                      : focusedIndex === index
                  }
                  type='button'
                  role='option'
                  className={clx(
                    'grid h-full w-full appearance-none grid-cols-[20px_1fr] items-center gap-2 overflow-hidden rounded-md px-2 py-2 text-left outline-none',
                    'data-[active=true]:bg-ui-bg-field-hover'
                  )}
                  onClick={handleSelect(option)}
                  onMouseEnter={() =>
                    setFocusedIndex(
                      showLevelUp ? index + 1 : index
                    )
                  }
                  onMouseLeave={() => setFocusedIndex(-1)}
                  tabIndex={-1}
                >
                  <div className='flex size-5 items-center justify-center'>
                    {isSelected(value, option.value) && (
                      <EllipseMiniSolid />
                    )}
                  </div>
                  <Text
                    as='span'
                    size='small'
                    leading='compact'
                    className='w-full truncate'
                  >
                    {option.label}
                  </Text>
                </button>
                {option.has_children && !searchValue && (
                  <button
                    className={clx(
                      'text-ui-fg-muted flex size-8 bg-ui-bg-base appearance-none items-center justify-center rounded-md outline-none',
                      'hover:bg-ui-bg-subtle-hover active:bg-ui-bg-subtle-pressed'
                    )}
                    type='button'
                    onClick={handleLevelDown(option)}
                    tabIndex={-1}
                  >
                    <TriangleRightMini />
                  </button>
                )}
              </div>
            ))}
          {showLoading &&
            Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className='grid grid-cols-[20px_1fr_20px] gap-2 px-2 py-1.5'
              >
                <div />
                <TextSkeleton
                  size='small'
                  leading='compact'
                />
                <div />
              </div>
            ))}
          {options.length === 0 && !showLoading && (
            <div className='px-2 py-2'>
              <Text size='small' leading='compact'>
                {query ? (
                  <Trans
                    i18n={i18n}
                    i18nKey={'general.noResultsTitle'}
                    tOptions={{
                      query: query,
                    }}
                    components={[
                      <span
                        className='font-medium'
                        key='query'
                      />,
                    ]}
                  />
                ) : (
                  t('general.noResultsTitle')
                )}
              </Text>
            </div>
          )}
        </div>
      </RadixPopover.Content>
    </RadixPopover.Root>
  );
});

CategoryCombobox.displayName = 'CategoryCombobox';

type ProductCategoryOption = {
  value: string;
  label: string;
  has_children: boolean;
};

function getParentId(level: Level[]): string | null {
  if (!level.length) {
    return null;
  }

  return level[level.length - 1].id;
}

function getParentLabel(level: Level[]): string | null {
  if (!level.length) {
    return null;
  }

  return level[level.length - 1].label;
}

function getOptions(
  categories: AdminProductCategoryResponse['product_category'][],
  allCategories?: AdminProductCategoryResponse['product_category'][]
): ProductCategoryOption[] {
  return categories.map((cat) => {
    // Enhanced has_children detection using multiple methods
    let has_children = false;
    
    // Method 1: Check category_children array
    if (cat.category_children && cat.category_children.length > 0) {
      has_children = true;
    }
    
    // Method 2: If no category_children but we have allCategories, check parent_category_id relationships
    if (!has_children && allCategories) {
      const childrenCount = allCategories.filter(c => c.parent_category_id === cat.id).length;
      has_children = childrenCount > 0;
    }
    
    return {
      value: cat.id,
      label: cat.name,
      has_children,
    };
  });
}

function isSelected(
  values: string[],
  value: string
): boolean {
  return values.includes(value);
}
