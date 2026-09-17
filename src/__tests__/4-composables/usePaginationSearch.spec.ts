import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import { defineComponent } from 'vue';
import { usePaginationSearch } from '@/composables/usePaginationSearch';

describe('usePaginationSearch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes with default values', () => {
    const { page, search, debouncedSearch } = usePaginationSearch({
      syncWithRouteQuery: false,
    });

    expect(page.value).toBe(1);
    expect(search.value).toBe('');
    expect(debouncedSearch.value).toBe('');
  });

  it('initializes with custom initialPage', () => {
    const { page } = usePaginationSearch({
      initialPage: 4,
      syncWithRouteQuery: false,
    });

    expect(page.value).toBe(4);
  });

  it('updates page via handlePageChange', () => {
    const { page, handlePageChange } = usePaginationSearch({
      syncWithRouteQuery: false,
    });

    handlePageChange(5);
    expect(page.value).toBe(5);

    handlePageChange(2);
    expect(page.value).toBe(2);
  });

  it('debounces search input and resets page to 1 on search change', () => {
    const { page, search, debouncedSearch, handleSearchChange, handlePageChange } =
      usePaginationSearch({
        debounceMs: 300,
        syncWithRouteQuery: false,
      });

    // Move to page 3 first
    handlePageChange(3);
    expect(page.value).toBe(3);

    // Enter search text
    handleSearchChange('pemrograman');

    // Immediate state
    expect(search.value).toBe('pemrograman');
    expect(debouncedSearch.value).toBe('');
    expect(page.value).toBe(3);

    // Fast-forward 200ms (not yet debounced)
    vi.advanceTimersByTime(200);
    expect(debouncedSearch.value).toBe('');
    expect(page.value).toBe(3);

    // Fast-forward remaining 100ms
    vi.advanceTimersByTime(100);
    expect(debouncedSearch.value).toBe('pemrograman');
    expect(page.value).toBe(1);
  });

  it('handles number input by converting to string', () => {
    const { search, debouncedSearch, handleSearchChange } = usePaginationSearch({
      debounceMs: 200,
      syncWithRouteQuery: false,
    });

    handleSearchChange(2026);
    expect(search.value).toBe('2026');

    vi.advanceTimersByTime(200);
    expect(debouncedSearch.value).toBe('2026');
  });

  it('resets state to initial values on reset()', () => {
    const { page, search, debouncedSearch, handleSearchChange, handlePageChange, reset } =
      usePaginationSearch({
        initialPage: 2,
        syncWithRouteQuery: false,
      });

    handlePageChange(8);
    handleSearchChange('algoritma');
    vi.advanceTimersByTime(300);

    expect(page.value).toBe(1);
    expect(search.value).toBe('algoritma');
    expect(debouncedSearch.value).toBe('algoritma');

    reset();

    expect(page.value).toBe(2);
    expect(search.value).toBe('');
    expect(debouncedSearch.value).toBe('');
  });

  it('synchronizes initial search and reacts to route query changes', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: { template: '<div></div>' } }],
    });

    await router.push({ path: '/', query: { search: 'buku-langka' } });

    let searchHook!: ReturnType<typeof usePaginationSearch>;
    const TestHost = defineComponent({
      setup() {
        searchHook = usePaginationSearch({ syncWithRouteQuery: true });
        return () => null;
      },
    });

    mount(TestHost, {
      global: {
        plugins: [router],
      },
    });

    expect(searchHook.search.value).toBe('buku-langka');
    expect(searchHook.debouncedSearch.value).toBe('buku-langka');

    await router.push({ path: '/', query: { search: 'majalah' } });

    expect(searchHook.search.value).toBe('majalah');
    expect(searchHook.debouncedSearch.value).toBe('majalah');
    expect(searchHook.page.value).toBe(1);
  });
});
