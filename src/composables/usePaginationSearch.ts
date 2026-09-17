import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useDebounceFn } from '@vueuse/core';

export interface UsePaginationSearchOptions {
  debounceMs?: number;
  initialPage?: number;
  syncWithRouteQuery?: boolean;
}

export function usePaginationSearch(options: UsePaginationSearchOptions = {}) {
  const { debounceMs = 300, initialPage = 1, syncWithRouteQuery = true } = options;

  let initialSearch = '';
  let route: ReturnType<typeof useRoute> | null = null;

  try {
    if (syncWithRouteQuery) {
      route = useRoute();
      if (route && typeof route.query?.search === 'string') {
        initialSearch = route.query.search;
      }
    }
  } catch {
    // Gracefully handle environments without vue-router
  }

  const page = ref(initialPage);
  const search = ref(initialSearch);
  const debouncedSearch = ref(initialSearch);

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

  if (syncWithRouteQuery && route) {
    watch(
      () => route?.query?.search,
      (newSearch) => {
        const queryStr = typeof newSearch === 'string' ? newSearch : '';
        if (queryStr !== search.value) {
          search.value = queryStr;
          debouncedSearch.value = queryStr;
          page.value = 1;
        }
      },
    );
  }

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
