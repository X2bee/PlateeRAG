// Data Table Management Hook - Handles table operations and state management
import { useState, useCallback, useMemo, useEffect } from 'react';
import { devLog } from '@/app/_common/utils/logger';

export interface TableColumn<T = any> {
    key: string;
    title: string;
    dataIndex: keyof T;
    sortable?: boolean;
    filterable?: boolean;
    render?: (value: any, record: T, index: number) => React.ReactNode;
    width?: number | string;
    fixed?: 'left' | 'right';
}

export interface SortConfig {
    sortBy: string | null;
    sortOrder: 'asc' | 'desc' | null;
}

export interface FilterConfig {
    [key: string]: any;
}

export interface PaginationConfig {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    showSizeChanger?: boolean;
    pageSizeOptions?: number[];
}

export interface SelectionConfig<T = any> {
    selectedRowKeys: string[];
    selectedRows: T[];
    selectAll: boolean;
    indeterminate: boolean;
}

export interface DataTableStateHook<T = any> {
    // Data State
    data: T[];
    originalData: T[];
    filteredData: T[];
    paginatedData: T[];
    
    // Table Configuration
    columns: TableColumn<T>[];
    
    // Pagination State
    pagination: PaginationConfig;
    
    // Sorting State
    sorting: SortConfig;
    
    // Filtering State
    filters: FilterConfig;
    searchQuery: string;
    
    // Selection State
    selection: SelectionConfig<T>;
    
    // Loading States
    loading: boolean;
    refreshing: boolean;
    
    // Error State
    error: string | null;
    
    // Data Operations
    setData: (data: T[] | ((prev: T[]) => T[])) => void;
    addRow: (row: T) => void;
    updateRow: (id: string | number, updates: Partial<T>) => void;
    deleteRow: (id: string | number) => void;
    deleteRows: (ids: (string | number)[]) => void;
    refreshData: () => Promise<void>;
    
    // Table Configuration
    setColumns: (columns: TableColumn<T>[]) => void;
    updateColumn: (key: string, updates: Partial<TableColumn<T>>) => void;
    
    // Pagination Operations
    goToPage: (page: number) => void;
    nextPage: () => void;
    prevPage: () => void;
    firstPage: () => void;
    lastPage: () => void;
    changePageSize: (pageSize: number) => void;
    setPagination: (config: Partial<PaginationConfig>) => void;
    
    // Sorting Operations
    setSortBy: (column: string) => void;
    toggleSort: (column: string) => void;
    clearSort: () => void;
    setSorting: (config: SortConfig) => void;
    
    // Filtering Operations
    setFilter: (key: string, value: any) => void;
    removeFilter: (key: string) => void;
    clearFilters: () => void;
    setFilters: (filters: FilterConfig) => void;
    setSearchQuery: (query: string) => void;
    
    // Selection Operations
    selectRow: (id: string, row?: T) => void;
    selectRows: (ids: string[], rows?: T[]) => void;
    selectAllRows: () => void;
    clearSelection: () => void;
    toggleRowSelection: (id: string, row?: T) => void;
    isRowSelected: (id: string) => boolean;
    
    // Utility Functions
    getRowKey: (row: T, index: number) => string;
    resetTableState: () => void;
    exportData: (format?: 'json' | 'csv') => string;
    
    // State Management
    setLoading: (loading: boolean) => void;
    setRefreshing: (refreshing: boolean) => void;
    setError: (error: string | null) => void;
}

export interface UseDataTableProps<T = any> {
    initialData?: T[];
    initialColumns?: TableColumn<T>[];
    initialPageSize?: number;
    enableSelection?: boolean;
    enableSearch?: boolean;
    rowKeyExtractor?: (row: T, index: number) => string;
    onDataChange?: (data: T[]) => void;
    onSelectionChange?: (selectedKeys: string[], selectedRows: T[]) => void;
    onSortChange?: (sorting: SortConfig) => void;
    onFilterChange?: (filters: FilterConfig) => void;
    onPageChange?: (page: number, pageSize: number) => void;
    onRefresh?: () => Promise<T[]>;
}

export const useDataTable = <T = any>({
    initialData = [],
    initialColumns = [],
    initialPageSize = 10,
    enableSelection = true,
    enableSearch = true,
    rowKeyExtractor,
    onDataChange,
    onSelectionChange,
    onSortChange,
    onFilterChange,
    onPageChange,
    onRefresh,
}: UseDataTableProps<T> = {}): DataTableStateHook<T> => {
    
    // Data State
    const [data, setDataState] = useState<T[]>(initialData);
    const [originalData, setOriginalData] = useState<T[]>(initialData);
    const [columns, setColumns] = useState<TableColumn<T>[]>(initialColumns);
    
    // Pagination State
    const [pagination, setPaginationState] = useState<PaginationConfig>({
        page: 1,
        pageSize: initialPageSize,
        totalItems: initialData.length,
        totalPages: Math.ceil(initialData.length / initialPageSize),
        showSizeChanger: true,
        pageSizeOptions: [10, 20, 50, 100],
    });
    
    // Sorting State
    const [sorting, setSortingState] = useState<SortConfig>({
        sortBy: null,
        sortOrder: null,
    });
    
    // Filtering State
    const [filters, setFiltersState] = useState<FilterConfig>({});
    const [searchQuery, setSearchQuery] = useState<string>('');
    
    // Selection State
    const [selection, setSelectionState] = useState<SelectionConfig<T>>({
        selectedRowKeys: [],
        selectedRows: [],
        selectAll: false,
        indeterminate: false,
    });
    
    // Loading States
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Default row key extractor
    const getRowKey = useCallback((row: T, index: number): string => {
        if (rowKeyExtractor) {
            return rowKeyExtractor(row, index);
        }
        
        // Try common key patterns
        if (row && typeof row === 'object') {
            const obj = row as any;
            if (obj.id !== undefined) return String(obj.id);
            if (obj.key !== undefined) return String(obj.key);
            if (obj._id !== undefined) return String(obj._id);
            if (obj.uuid !== undefined) return String(obj.uuid);
        }
        
        // Fallback to index
        return String(index);
    }, [rowKeyExtractor]);
    
    // Filtered data based on search and filters
    const filteredData = useMemo(() => {
        let result = [...data];
        
        // Apply search filter
        if (enableSearch && searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            result = result.filter(row => {
                if (!row || typeof row !== 'object') return false;
                
                return Object.values(row as any).some(value => {
                    if (value === null || value === undefined) return false;
                    return String(value).toLowerCase().includes(query);
                });
            });
        }
        
        // Apply column filters
        Object.entries(filters).forEach(([key, filterValue]) => {
            if (filterValue !== null && filterValue !== undefined && filterValue !== '') {
                result = result.filter(row => {
                    if (!row || typeof row !== 'object') return false;
                    const rowValue = (row as any)[key];
                    
                    if (Array.isArray(filterValue)) {
                        return filterValue.includes(rowValue);
                    }
                    
                    if (typeof filterValue === 'string') {
                        return String(rowValue).toLowerCase().includes(filterValue.toLowerCase());
                    }
                    
                    return rowValue === filterValue;
                });
            }
        });
        
        return result;
    }, [data, searchQuery, filters, enableSearch]);
    
    // Sorted data
    const sortedData = useMemo(() => {
        if (!sorting.sortBy || !sorting.sortOrder) {
            return filteredData;
        }
        
        return [...filteredData].sort((a, b) => {
            const aVal = (a as any)[sorting.sortBy!];
            const bVal = (b as any)[sorting.sortBy!];
            
            // Handle null/undefined values
            if (aVal === null || aVal === undefined) return sorting.sortOrder === 'asc' ? -1 : 1;
            if (bVal === null || bVal === undefined) return sorting.sortOrder === 'asc' ? 1 : -1;
            
            // String comparison
            if (typeof aVal === 'string' && typeof bVal === 'string') {
                const result = aVal.localeCompare(bVal);
                return sorting.sortOrder === 'asc' ? result : -result;
            }
            
            // Number comparison
            if (typeof aVal === 'number' && typeof bVal === 'number') {
                const result = aVal - bVal;
                return sorting.sortOrder === 'asc' ? result : -result;
            }
            
            // Date comparison
            if (aVal instanceof Date && bVal instanceof Date) {
                const result = aVal.getTime() - bVal.getTime();
                return sorting.sortOrder === 'asc' ? result : -result;
            }
            
            // Fallback to string comparison
            const result = String(aVal).localeCompare(String(bVal));
            return sorting.sortOrder === 'asc' ? result : -result;
        });
    }, [filteredData, sorting]);
    
    // Paginated data
    const paginatedData = useMemo(() => {
        const startIndex = (pagination.page - 1) * pagination.pageSize;
        const endIndex = startIndex + pagination.pageSize;
        return sortedData.slice(startIndex, endIndex);
    }, [sortedData, pagination.page, pagination.pageSize]);
    
    // Update pagination when data changes
    useEffect(() => {
        const totalItems = sortedData.length;
        const totalPages = Math.ceil(totalItems / pagination.pageSize);
        const currentPage = Math.min(pagination.page, Math.max(1, totalPages));
        
        setPaginationState(prev => ({
            ...prev,
            totalItems,
            totalPages,
            page: currentPage,
        }));
    }, [sortedData.length, pagination.pageSize, pagination.page]);
    
    // Data Operations
    const setData = useCallback((newData: T[] | ((prev: T[]) => T[])) => {
        const data = typeof newData === 'function' ? newData(originalData) : newData;
        setDataState(data);
        setOriginalData(data);
        
        if (onDataChange) {
            onDataChange(data);
        }
        
        devLog.log('Table data updated:', data.length, 'items');
    }, [originalData, onDataChange]);
    
    const addRow = useCallback((row: T) => {
        setData(prev => [...prev, row]);
        devLog.log('Row added to table');
    }, [setData]);
    
    const updateRow = useCallback((id: string | number, updates: Partial<T>) => {
        setData(prev => prev.map((row, index) => {
            const rowKey = getRowKey(row, index);
            return rowKey === String(id) ? { ...row, ...updates } : row;
        }));
        devLog.log('Row updated in table:', id);
    }, [setData, getRowKey]);
    
    const deleteRow = useCallback((id: string | number) => {
        setData(prev => prev.filter((row, index) => {
            const rowKey = getRowKey(row, index);
            return rowKey !== String(id);
        }));
        devLog.log('Row deleted from table:', id);
    }, [setData, getRowKey]);
    
    const deleteRows = useCallback((ids: (string | number)[]) => {
        const idsSet = new Set(ids.map(String));
        setData(prev => prev.filter((row, index) => {
            const rowKey = getRowKey(row, index);
            return !idsSet.has(rowKey);
        }));
        devLog.log('Multiple rows deleted from table:', ids.length, 'items');
    }, [setData, getRowKey]);
    
    const refreshData = useCallback(async (): Promise<void> => {
        if (!onRefresh) return;
        
        setRefreshing(true);
        setError(null);
        
        try {
            devLog.log('Refreshing table data...');
            const newData = await onRefresh();
            setData(newData);
            devLog.log('Table data refreshed successfully');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to refresh data';
            devLog.error('Failed to refresh table data:', err);
            setError(errorMessage);
            throw err;
        } finally {
            setRefreshing(false);
        }
    }, [onRefresh, setData]);
    
    // Pagination Operations
    const goToPage = useCallback((page: number) => {
        const targetPage = Math.max(1, Math.min(page, pagination.totalPages));
        setPaginationState(prev => ({ ...prev, page: targetPage }));
        
        if (onPageChange) {
            onPageChange(targetPage, pagination.pageSize);
        }
        
        devLog.log('Table page changed to:', targetPage);
    }, [pagination.totalPages, pagination.pageSize, onPageChange]);
    
    const nextPage = useCallback(() => {
        goToPage(pagination.page + 1);
    }, [goToPage, pagination.page]);
    
    const prevPage = useCallback(() => {
        goToPage(pagination.page - 1);
    }, [goToPage, pagination.page]);
    
    const firstPage = useCallback(() => {
        goToPage(1);
    }, [goToPage]);
    
    const lastPage = useCallback(() => {
        goToPage(pagination.totalPages);
    }, [goToPage, pagination.totalPages]);
    
    const changePageSize = useCallback((pageSize: number) => {
        setPaginationState(prev => ({
            ...prev,
            pageSize,
            page: 1, // Reset to first page
        }));
        
        if (onPageChange) {
            onPageChange(1, pageSize);
        }
        
        devLog.log('Table page size changed to:', pageSize);
    }, [onPageChange]);
    
    const setPagination = useCallback((config: Partial<PaginationConfig>) => {
        setPaginationState(prev => ({ ...prev, ...config }));
    }, []);
    
    // Sorting Operations
    const setSortBy = useCallback((column: string) => {
        const newSorting: SortConfig = {
            sortBy: column,
            sortOrder: 'asc',
        };
        
        setSortingState(newSorting);
        
        if (onSortChange) {
            onSortChange(newSorting);
        }
        
        devLog.log('Table sort set to:', column, 'asc');
    }, [onSortChange]);
    
    const toggleSort = useCallback((column: string) => {
        let newSorting: SortConfig;
        
        if (sorting.sortBy === column) {
            // Toggle between asc -> desc -> null
            if (sorting.sortOrder === 'asc') {
                newSorting = { sortBy: column, sortOrder: 'desc' };
            } else if (sorting.sortOrder === 'desc') {
                newSorting = { sortBy: null, sortOrder: null };
            } else {
                newSorting = { sortBy: column, sortOrder: 'asc' };
            }
        } else {
            newSorting = { sortBy: column, sortOrder: 'asc' };
        }
        
        setSortingState(newSorting);
        
        if (onSortChange) {
            onSortChange(newSorting);
        }
        
        devLog.log('Table sort toggled:', column, newSorting.sortOrder);
    }, [sorting, onSortChange]);
    
    const clearSort = useCallback(() => {
        const newSorting: SortConfig = { sortBy: null, sortOrder: null };
        setSortingState(newSorting);
        
        if (onSortChange) {
            onSortChange(newSorting);
        }
        
        devLog.log('Table sort cleared');
    }, [onSortChange]);
    
    const setSorting = useCallback((config: SortConfig) => {
        setSortingState(config);
        
        if (onSortChange) {
            onSortChange(config);
        }
    }, [onSortChange]);
    
    // Filtering Operations
    const setFilter = useCallback((key: string, value: any) => {
        const newFilters = { ...filters, [key]: value };
        setFiltersState(newFilters);
        
        // Reset to first page when filtering
        setPaginationState(prev => ({ ...prev, page: 1 }));
        
        if (onFilterChange) {
            onFilterChange(newFilters);
        }
        
        devLog.log('Table filter set:', key, value);
    }, [filters, onFilterChange]);
    
    const removeFilter = useCallback((key: string) => {
        const newFilters = { ...filters };
        delete newFilters[key];
        setFiltersState(newFilters);
        
        if (onFilterChange) {
            onFilterChange(newFilters);
        }
        
        devLog.log('Table filter removed:', key);
    }, [filters, onFilterChange]);
    
    const clearFilters = useCallback(() => {
        setFiltersState({});
        setSearchQuery('');
        
        if (onFilterChange) {
            onFilterChange({});
        }
        
        devLog.log('Table filters cleared');
    }, [onFilterChange]);
    
    const setFilters = useCallback((newFilters: FilterConfig) => {
        setFiltersState(newFilters);
        
        if (onFilterChange) {
            onFilterChange(newFilters);
        }
    }, [onFilterChange]);
    
    // Selection Operations
    const selectRow = useCallback((id: string, row?: T) => {
        if (!enableSelection) return;
        
        const isSelected = selection.selectedRowKeys.includes(id);
        let newSelectedKeys: string[];
        let newSelectedRows: T[];
        
        if (isSelected) {
            newSelectedKeys = selection.selectedRowKeys.filter(key => key !== id);
            newSelectedRows = selection.selectedRows.filter((_, index) => 
                selection.selectedRowKeys[index] !== id
            );
        } else {
            newSelectedKeys = [...selection.selectedRowKeys, id];
            if (row) {
                newSelectedRows = [...selection.selectedRows, row];
            } else {
                // Find row by id
                const foundRow = data.find((item, index) => getRowKey(item, index) === id);
                newSelectedRows = foundRow 
                    ? [...selection.selectedRows, foundRow]
                    : selection.selectedRows;
            }
        }
        
        const totalFilteredRows = filteredData.length;
        const selectAll = newSelectedKeys.length === totalFilteredRows && totalFilteredRows > 0;
        const indeterminate = newSelectedKeys.length > 0 && newSelectedKeys.length < totalFilteredRows;
        
        const newSelection: SelectionConfig<T> = {
            selectedRowKeys: newSelectedKeys,
            selectedRows: newSelectedRows,
            selectAll,
            indeterminate,
        };
        
        setSelectionState(newSelection);
        
        if (onSelectionChange) {
            onSelectionChange(newSelectedKeys, newSelectedRows);
        }
        
        devLog.log('Table row selection changed:', id, !isSelected ? 'selected' : 'deselected');
    }, [enableSelection, selection, data, filteredData.length, getRowKey, onSelectionChange]);
    
    const selectRows = useCallback((ids: string[], rows?: T[]) => {
        if (!enableSelection) return;
        
        const newSelection: SelectionConfig<T> = {
            selectedRowKeys: [...ids],
            selectedRows: rows || [],
            selectAll: ids.length === filteredData.length && filteredData.length > 0,
            indeterminate: ids.length > 0 && ids.length < filteredData.length,
        };
        
        setSelectionState(newSelection);
        
        if (onSelectionChange) {
            onSelectionChange(ids, rows || []);
        }
        
        devLog.log('Table rows selected:', ids.length, 'items');
    }, [enableSelection, filteredData.length, onSelectionChange]);
    
    const selectAllRows = useCallback(() => {
        if (!enableSelection) return;
        
        if (selection.selectAll) {
            // Deselect all
            const newSelection: SelectionConfig<T> = {
                selectedRowKeys: [],
                selectedRows: [],
                selectAll: false,
                indeterminate: false,
            };
            
            setSelectionState(newSelection);
            
            if (onSelectionChange) {
                onSelectionChange([], []);
            }
            
            devLog.log('Table all rows deselected');
        } else {
            // Select all filtered rows
            const allKeys = filteredData.map((row, index) => getRowKey(row, index));
            const newSelection: SelectionConfig<T> = {
                selectedRowKeys: allKeys,
                selectedRows: [...filteredData],
                selectAll: true,
                indeterminate: false,
            };
            
            setSelectionState(newSelection);
            
            if (onSelectionChange) {
                onSelectionChange(allKeys, filteredData);
            }
            
            devLog.log('Table all rows selected:', allKeys.length, 'items');
        }
    }, [enableSelection, selection.selectAll, filteredData, getRowKey, onSelectionChange]);
    
    const clearSelection = useCallback(() => {
        const newSelection: SelectionConfig<T> = {
            selectedRowKeys: [],
            selectedRows: [],
            selectAll: false,
            indeterminate: false,
        };
        
        setSelectionState(newSelection);
        
        if (onSelectionChange) {
            onSelectionChange([], []);
        }
        
        devLog.log('Table selection cleared');
    }, [onSelectionChange]);
    
    const toggleRowSelection = useCallback((id: string, row?: T) => {
        selectRow(id, row);
    }, [selectRow]);
    
    const isRowSelected = useCallback((id: string): boolean => {
        return selection.selectedRowKeys.includes(id);
    }, [selection.selectedRowKeys]);
    
    // Table Configuration
    const updateColumn = useCallback((key: string, updates: Partial<TableColumn<T>>) => {
        setColumns(prev => prev.map(col => 
            col.key === key ? { ...col, ...updates } : col
        ));
        devLog.log('Table column updated:', key);
    }, []);
    
    // Utility Functions
    const resetTableState = useCallback(() => {
        setDataState(originalData);
        setPaginationState({
            page: 1,
            pageSize: initialPageSize,
            totalItems: originalData.length,
            totalPages: Math.ceil(originalData.length / initialPageSize),
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50, 100],
        });
        setSortingState({ sortBy: null, sortOrder: null });
        setFiltersState({});
        setSearchQuery('');
        setSelectionState({
            selectedRowKeys: [],
            selectedRows: [],
            selectAll: false,
            indeterminate: false,
        });
        setLoading(false);
        setRefreshing(false);
        setError(null);
        
        devLog.log('Table state reset');
    }, [originalData, initialPageSize]);
    
    const exportData = useCallback((format: 'json' | 'csv' = 'json'): string => {
        const dataToExport = selection.selectedRowKeys.length > 0 
            ? selection.selectedRows 
            : filteredData;
        
        if (format === 'csv') {
            if (dataToExport.length === 0) return '';
            
            const headers = columns.map(col => col.title).join(',');
            const rows = dataToExport.map(row => 
                columns.map(col => {
                    const value = (row as any)[col.dataIndex];
                    return typeof value === 'string' && value.includes(',') 
                        ? `"${value}"` 
                        : String(value || '');
                }).join(',')
            );
            
            return [headers, ...rows].join('\n');
        }
        
        return JSON.stringify(dataToExport, null, 2);
    }, [selection, filteredData, columns]);
    
    return {
        // Data State
        data,
        originalData,
        filteredData,
        paginatedData,
        
        // Table Configuration
        columns,
        
        // Pagination State
        pagination,
        
        // Sorting State
        sorting,
        
        // Filtering State
        filters,
        searchQuery,
        
        // Selection State
        selection,
        
        // Loading States
        loading,
        refreshing,
        
        // Error State
        error,
        
        // Data Operations
        setData,
        addRow,
        updateRow,
        deleteRow,
        deleteRows,
        refreshData,
        
        // Table Configuration
        setColumns,
        updateColumn,
        
        // Pagination Operations
        goToPage,
        nextPage,
        prevPage,
        firstPage,
        lastPage,
        changePageSize,
        setPagination,
        
        // Sorting Operations
        setSortBy,
        toggleSort,
        clearSort,
        setSorting,
        
        // Filtering Operations
        setFilter,
        removeFilter,
        clearFilters,
        setFilters,
        setSearchQuery,
        
        // Selection Operations
        selectRow,
        selectRows,
        selectAllRows,
        clearSelection,
        toggleRowSelection,
        isRowSelected,
        
        // Utility Functions
        getRowKey,
        resetTableState,
        exportData,
        
        // State Management
        setLoading,
        setRefreshing,
        setError,
    };
};