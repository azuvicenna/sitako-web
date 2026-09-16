import { ref } from 'vue';
import { useDebounceFn } from '@vueuse/core';

export interface UsePaginationSearchOptions {
  debounceMs?: number;
  initialPage?: number;
}

export function usePaginationSearch(options: UsePaginationSearchOptions = {}) {
  const { debounceMs = 300, initialPage = 1 } = options;

  const page = ref(initialPage);
  const search = ref('');
  const debouncedSearch = ref('');

  const onSearchInput = useDebounceFn((val: string) => {
    debouncedSearch.value = val;
    page.value = 1;
  }, debounceMs);

  const handleSearchChange = (val: string | number) => {
    const text = String(val);
    search.value = text;
    onSearchInput(text);
  };

  const handlePageChange = (newPage: number) => {
    page.value = newPage;
  };

  const reset = () => {
    page.value = initialPage;
    search.value = '';
    debouncedSearch.value = '';
  };

  return {
    page,
    search,
    debouncedSearch,
    onSearchInput,
    handleSearchChange,
    handlePageChange,
    reset,
  };
}
