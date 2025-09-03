import {
  Button,
  Container,
  Heading,
  Text,
} from '@medusajs/ui';
import { keepPreviousData } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Link } from 'react-router-dom';
import { _DataTable } from '../../../../../components/table/data-table';
import { useProductCategories } from '../../../../../hooks/api/categories';
import { useDataTable } from '../../../../../hooks/use-data-table';
import { useCategoryTableColumns } from './use-category-table-columns';
import { useCategoryTableQuery } from './use-category-table-query';

const PAGE_SIZE = 20;

export const CategoryListTable = () => {
  const { t } = useTranslation();

  const { raw, searchParams } = useCategoryTableQuery({
    pageSize: PAGE_SIZE,
  });

  // Fetch all categories and filter client-side for hierarchical display
  // Backend API only supports basic fields, offset, limit parameters
  const query = {
    fields: 'id,name,handle,is_active,is_internal,parent_category_id,category_children',
    // Remove pagination for client-side filtering - we need all categories to build hierarchy
    limit: 1000, // Set high limit to get all categories
    offset: 0,
    q: searchParams.q, // Keep search functionality
  };

  const {
    product_categories: allCategories,
    isLoading,
    isError,
    error,
  } = useProductCategories(
    query,
    {
      placeholderData: keepPreviousData,
    }
  );

  // Client-side hierarchical filtering - show only main categories (no parent)
  const product_categories = useMemo(() => {
    if (!allCategories) return [];
    
    // If searching, return all categories that match the search
    if (raw.q && typeof raw.q === 'string') {
      return allCategories.filter(cat => 
        cat.name.toLowerCase().includes(raw.q!.toLowerCase())
      );
    }
    
    // Show only top-level categories (no parent_category_id)
    return allCategories.filter(cat => !cat.parent_category_id);
  }, [allCategories, raw.q]);

  // Count of filtered categories for pagination
  const count = product_categories.length;

  const columns = useColumns();

  const { table } = useDataTable({
    data: product_categories || [],
    columns,
    count,
    getRowId: (original) => original.id,
    getSubRows: (original) => {
      // Return subcategories for expandable rows
      // Use category_children if available, otherwise filter by parent_category_id
      if (original.category_children && original.category_children.length > 0) {
        return original.category_children;
      }
      // Fallback: find children by parent_category_id
      return allCategories?.filter(cat => cat.parent_category_id === original.id) || [];
    },
    enableExpandableRows: true,
    pageSize: PAGE_SIZE,
  });

  if (isError) {
    throw error;
  }

  return (
    <Container className='divide-y p-0'>
      <div className='flex items-center justify-between px-6 py-4'>
        <div>
          <Heading>{t('categories.domain')}</Heading>
          <Text className='text-ui-fg-subtle' size='small'>
            {t('requests.categories.description')}
          </Text>
        </div>
        <div className='flex items-center gap-x-2'>
          <Button size='small' variant='secondary' asChild>
            <Link to='create'>{t('requests.categories.requestCategory')}</Link>
          </Button>
        </div>
      </div>
      <_DataTable
        table={table}
        columns={columns}
        count={count}
        pageSize={PAGE_SIZE}
        isLoading={isLoading}
        navigateTo={(row) => row.id}
        queryObject={raw}
        search
        pagination
      />
    </Container>
  );
};

const useColumns = () => {
  const base = useCategoryTableColumns();

  return useMemo(() => [...base], [base]);
};
