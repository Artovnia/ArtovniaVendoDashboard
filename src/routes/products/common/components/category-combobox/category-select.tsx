import { Check, TrianglesMini, TriangleRightMini, ArrowUturnLeft } from '@medusajs/icons';
import { AdminProductCategoryResponse } from '@medusajs/types';
import { Text, clx } from '@medusajs/ui';
import { Select } from 'radix-ui';
import {
  CSSProperties,
  ComponentPropsWithoutRef,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';

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

export const CategorySelect = forwardRef<
  HTMLInputElement,
  CategoryComboboxProps
>(({ value, onChange, className }, ref) => {
  const innerRef = useRef<HTMLInputElement>(null);

  useImperativeHandle<
    HTMLInputElement | null,
    HTMLInputElement | null
  >(ref, () => innerRef.current, []);

  const [open, setOpen] = useState(false);

  const [level, setLevel] = useState<Level[]>([]);
  const { searchValue } = useDebouncedSearch();

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

  function handleLevelUp(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();

    setLevel(level.slice(0, level.length - 1));
    innerRef.current?.focus();
  }

  function handleLevelDown(option: ProductCategoryOption) {
    return (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();

      setLevel([
        ...level,
        { id: option.value, label: option.label },
      ]);

      innerRef.current?.focus();
    };
  }

  const handleSelect = (option: string) => {
    if (value.includes(option)) {
      onChange([]);
    } else {
      onChange([option]);
    }

    innerRef.current?.focus();
    setOpen(false);
  };

  const options = getOptions(product_categories || [], allCategories);

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

        handleSelect(options[index].value);
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

  // We'll let Radix UI manage the open state entirely
  // No need for custom trigger click handler

  if (isError) {
    throw error;
  }

  return (
    <Select.Root 
      onValueChange={handleSelect}
      onOpenChange={setOpen}
    >
      <Select.Trigger
        className={clx(
          'relative flex cursor-pointer items-center mt-2 gap-x-2 overflow-hidden px-2',
          'h-8 w-full rounded-lg',
          'bg-ui-bg-field transition-fg shadow-borders-base',
          'has-[input:focus]:shadow-borders-interactive-with-active',
          'has-[:invalid]:shadow-borders-error has-[[aria-invalid=true]]:shadow-borders-error',
          'has-[:disabled]:bg-ui-bg-disabled has-[:disabled]:text-ui-fg-disabled has-[:disabled]:cursor-not-allowed',
          {
            'shadow-borders-interactive-with-active': open,
          },
          className
        )}
        style={
          {
            '--tag-width': `${tagWidth}px`,
          } as CSSProperties
        }
      >
        <Select.Value aria-label={value[0]} />
        <Select.Icon className='ml-auto'>
          <TrianglesMini className='text-ui-fg-muted' />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content 
          className='relative mt-2 border shadow-lg rounded-lg bg-ui-bg-base z-50 w-[var(--radix-select-trigger-width)]'
          position="popper"
          sideOffset={4}
          side="bottom"
          avoidCollisions
        >
          <Select.Viewport className='p-2'>
            {showLevelUp && (
              <button
                data-active={focusedIndex === 0}
                type='button'
                className={clx(
                  'grid h-full w-full appearance-none grid-cols-[20px_1fr] items-center gap-2 overflow-hidden rounded-md px-2 py-1.5 text-left outline-none mb-2',
                  'data-[active=true]:bg-ui-bg-field-hover'
                )}
                onClick={handleLevelUp}
                onMouseEnter={() => setFocusedIndex(0)}
                onMouseLeave={() => setFocusedIndex(-1)}
                tabIndex={-1}
              >
                <div className='flex size-5 items-center justify-center'>
                  <ArrowUturnLeft />
                </div>
                <Text
                  as='span'
                  size='small'
                  leading='compact'
                  className='w-full truncate'
                >
                  {getParentLabel(level)}
                </Text>
              </button>
            )}
            {options.length > 0 &&
              !showLoading &&
              options.map((option, index) => (
                <div
                  key={option.value}
                  className='grid grid-cols-[1fr_auto] items-center gap-2'
                >
                  <SelectItem
                    value={option.value}
                  >
                    <button
                      data-active={
                        showLevelUp
                          ? focusedIndex === index + 1
                          : focusedIndex === index
                      }
                      type='button'
                      role='option'
                      className={clx(
                        'grid h-full w-full appearance-none grid-cols-[20px_1fr] items-center gap-2 overflow-hidden rounded-md px-2 py-1.5 text-left outline-none',
                        'data-[active=true]:bg-ui-bg-field-hover'
                      )}
                      onClick={() => handleSelect(option.value)}
                      onMouseEnter={() =>
                        setFocusedIndex(
                          showLevelUp ? index + 1 : index
                        )
                      }
                      onMouseLeave={() => setFocusedIndex(-1)}
                      tabIndex={-1}
                    >
                      <div className='flex size-5 items-center justify-center'>
                        {value.includes(option.value) && (
                          <Check className='size-4' />
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
                  </SelectItem>
                  {option.has_children && !searchValue && (
                    <button
                      className={clx(
                        'text-ui-fg-muted flex size-8 appearance-none items-center justify-center rounded-md outline-none',
                        'hover:bg-ui-bg-base-hover active:bg-ui-bg-base-pressed'
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
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
});

CategorySelect.displayName = 'CategorySelect';

type ProductCategoryOption = {
  value: string;
  label: string;
  has_children: boolean;
};

const SelectItem = ({
  value,
  children,
}: {
  value: string;
  children: React.ReactNode;
}) => {
  return (
    <Select.Item
      value={value}
      className={clx(
        'transition-fg bg-ui-bg-base flex cursor-pointer items-center gap-2 overflow-hidden hover:bg-ui-bg-field-hover'
      )}
    >
      <Select.ItemText>{children}</Select.ItemText>
      <Select.ItemIndicator className='ml-auto'>
        <Check />
      </Select.ItemIndicator>
    </Select.Item>
  );
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