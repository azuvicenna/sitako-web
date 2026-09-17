<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useDebounceFn, onClickOutside } from '@vueuse/core';
import {
  Bars3Icon,
  MagnifyingGlassIcon,
  BookOpenIcon,
  UserIcon,
  ArrowRightIcon,
  ArrowPathIcon,
} from '@heroicons/vue/24/outline';
import Input from '@/components/common/Input.vue';
import { api } from '@/utils/axios';
import { useAuthStore } from '@/stores/auth';
import type { Book } from '@/types/book';
import type { MemberUser } from '@/types/auth';

const emit = defineEmits<{
  (e: 'toggleSidebar'): void;
}>();

const router = useRouter();
const authStore = useAuthStore();

const searchQuery = ref('');
const isDropdownOpen = ref(false);
const isLoading = ref(false);
const searchContainerRef = ref<HTMLElement | null>(null);

const matchedBooks = ref<Book[]>([]);
const matchedMembers = ref<MemberUser[]>([]);

onClickOutside(searchContainerRef, () => {
  isDropdownOpen.value = false;
});

const isLibrarian = computed(() => {
  return authStore.role !== 'Anggota';
});

const user = computed(() => authStore.user);
const userName = computed(() => user.value?.nama || 'Admin Pustakawan');
const userSubtext = computed(() => {
  if (!user.value) return 'NIP: 192308350505';
  if ('nip' in user.value && user.value.nip) return `NIP: ${user.value.nip}`;
  if ('nis' in user.value && user.value.nis) return `NIS: ${user.value.nis}`;
  return user.value.email;
});
const userRoleName = computed(() => authStore.role || 'Pustakawan');
const avatarLoadError = ref(false);

watch(
  () => user.value?.foto,
  () => {
    avatarLoadError.value = false;
  },
);

const userInitial = computed(() => {
  return userName.value.trim().charAt(0).toUpperCase() || 'U';
});

const profileRoute = computed(() => {
  return isLibrarian.value ? '/pustakawan/profil' : '/anggota/profil';
});

const isISBN = (val: string) => {
  const clean = val.replace(/[-\s]/g, '');
  return /^\d{9,13}[0-9X]?$/i.test(clean);
};

const executeSearch = useDebounceFn(async (query: string) => {
  // Anggota tidak menggunakan live search popover di header
  if (!isLibrarian.value) {
    matchedBooks.value = [];
    matchedMembers.value = [];
    isLoading.value = false;
    return;
  }

  const trimmed = query.trim();
  if (trimmed.length < 2) {
    matchedBooks.value = [];
    matchedMembers.value = [];
    isLoading.value = false;
    return;
  }

  isLoading.value = true;

  try {
    const [booksFisikRes, booksDigitalRes, membersRes] = await Promise.allSettled([
      api.get<{ data: Book[] }>(
        `/books/?bookType=Fisik&limit=4&search=${encodeURIComponent(trimmed)}`,
      ),
      api.get<{ data: Book[] }>(
        `/books/?bookType=Digital&limit=4&search=${encodeURIComponent(trimmed)}`,
      ),
      api.get<{ data: MemberUser[] }>(
        `/user/members/?statusActive=Semua&limit=4&search=${encodeURIComponent(trimmed)}`,
      ),
    ]);

    const fisikList =
      booksFisikRes.status === 'fulfilled' ? booksFisikRes.value.data.data || [] : [];
    const digitalList =
      booksDigitalRes.status === 'fulfilled' ? booksDigitalRes.value.data.data || [] : [];
    matchedBooks.value = [...fisikList, ...digitalList].slice(0, 5);

    matchedMembers.value =
      membersRes.status === 'fulfilled' ? membersRes.value.data.data || [] : [];
  } catch {
    matchedBooks.value = [];
    matchedMembers.value = [];
  } finally {
    isLoading.value = false;
  }
}, 300);

watch(searchQuery, (newVal) => {
  // Jika role adalah Anggota, jangan buka autocomplete dropdown dan jangan lakukan search di header
  if (!isLibrarian.value) {
    isDropdownOpen.value = false;
    matchedBooks.value = [];
    matchedMembers.value = [];
    return;
  }

  if (newVal.trim().length >= 2) {
    isDropdownOpen.value = true;
    executeSearch(newVal);
  } else {
    matchedBooks.value = [];
    matchedMembers.value = [];
    isDropdownOpen.value = false;
  }
});

const navigateToBook = (book: Book) => {
  isDropdownOpen.value = false;
  if (isLibrarian.value) {
    router.push({
      path: '/pustakawan/buku',
      query: {
        search: book.isbn || book.judul,
        type: book.tipeBuku,
      },
    });
  } else {
    router.push({
      path: '/anggota/katalog',
      query: {
        search: book.judul,
      },
    });
  }
};

const navigateToMember = (member: MemberUser) => {
  isDropdownOpen.value = false;
  router.push({
    path: '/pustakawan/anggota',
    query: {
      search: member.nama,
    },
  });
};

const navigateToBookSearch = (keyword: string) => {
  isDropdownOpen.value = false;
  if (isLibrarian.value) {
    router.push({
      path: '/pustakawan/buku',
      query: { search: keyword },
    });
  } else {
    router.push({
      path: '/anggota/katalog',
      query: { search: keyword },
    });
  }
};

const navigateToMemberSearch = (keyword: string) => {
  isDropdownOpen.value = false;
  router.push({
    path: '/pustakawan/anggota',
    query: { search: keyword },
  });
};

const handleEnterKey = () => {
  const query = searchQuery.value.trim();

  // Jika role adalah Anggota: tidak boleh mencari data anggota,
  // langsung diarahkan ke halaman katalog buku dan GET data di sana
  if (!isLibrarian.value) {
    isDropdownOpen.value = false;
    router.push({
      path: '/anggota/katalog',
      query: query ? { search: query } : {},
    });
    return;
  }

  if (!query) return;

  if (isISBN(query)) {
    navigateToBookSearch(query);
    return;
  }

  if (matchedMembers.value.length > 0 && matchedBooks.value.length === 0) {
    navigateToMemberSearch(query);
    return;
  }

  if (matchedBooks.value.length > 0 && matchedMembers.value.length === 0) {
    navigateToBookSearch(query);
    return;
  }

  navigateToBookSearch(query);
};
</script>

<template>
  <header
    class="h-16 border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 bg-white shrink-0"
  >
    <div ref="searchContainerRef" class="relative flex items-center gap-4 w-full max-w-xl">
      <button
        type="button"
        @click="emit('toggleSidebar')"
        class="text-charcoal hover:text-mustardHover transition-colors shrink-0 p-1 cursor-pointer"
        aria-label="Toggle Sidebar"
      >
        <Bars3Icon class="w-6 h-6" />
      </button>

      <form @submit.prevent="handleEnterKey" class="relative flex-1">
        <Input
          v-model="searchQuery"
          :icon="MagnifyingGlassIcon"
          :placeholder="
            isLibrarian
              ? 'Cari ISBN, Judul, atau Nama Anggota...'
              : 'Cari judul buku atau ISBN (tekan Enter)...'
          "
          @focus="if (isLibrarian && searchQuery.trim().length >= 2) isDropdownOpen = true;"
          @keydown.enter="handleEnterKey"
          @keydown.esc="isDropdownOpen = false"
        />

        <!-- Autocomplete Dropdown Popover (Hanya untuk Pustakawan) -->
        <div
          v-if="isLibrarian && isDropdownOpen && searchQuery.trim().length >= 2"
          class="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50 max-h-115 overflow-y-auto"
        >
          <!-- Loading State -->
          <div
            v-if="isLoading"
            class="flex items-center justify-center py-6 gap-2 text-gray-500 text-xs"
          >
            <ArrowPathIcon class="w-4 h-4 animate-spin text-mustard" />
            <span>Mencari data buku &amp; anggota...</span>
          </div>

          <!-- Empty State -->
          <div
            v-else-if="matchedBooks.length === 0 && matchedMembers.length === 0"
            class="py-5 px-4 text-center"
          >
            <p class="text-xs font-semibold text-charcoalDark">Tidak ada hasil ditemukan</p>
            <p class="text-[11px] text-gray-500 mt-0.5">
              Tidak ada data yang cocok dengan kata kunci "{{ searchQuery }}"
            </p>
            <div class="mt-3 flex items-center justify-center gap-2">
              <button
                type="button"
                @click="navigateToBookSearch(searchQuery)"
                class="text-xs font-semibold text-mustardHover hover:underline cursor-pointer"
              >
                Cari di Kelola Buku &rarr;
              </button>
              <template v-if="isLibrarian">
                <span class="text-gray-300">|</span>
                <button
                  type="button"
                  @click="navigateToMemberSearch(searchQuery)"
                  class="text-xs font-semibold text-mustardHover hover:underline cursor-pointer"
                >
                  Cari di Daftar Anggota &rarr;
                </button>
              </template>
            </div>
          </div>

          <!-- Results List -->
          <div v-else class="divide-y divide-gray-100">
            <!-- Section: Buku -->
            <div v-if="matchedBooks.length > 0" class="pb-2">
              <div
                class="px-3 pt-2 pb-1.5 flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase tracking-wider"
              >
                <div class="flex items-center gap-1.5">
                  <BookOpenIcon class="w-3.5 h-3.5 text-mustard" />
                  <span>Buku Perpustakaan</span>
                </div>
                <span class="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px]">
                  {{ matchedBooks.length }}
                </span>
              </div>
              <div class="space-y-0.5 px-1">
                <button
                  v-for="book in matchedBooks"
                  :key="book.id"
                  type="button"
                  @click="navigateToBook(book)"
                  class="w-full text-left px-2.5 py-2 hover:bg-gray-50 rounded-lg flex items-center justify-between gap-3 transition-colors cursor-pointer group"
                >
                  <div class="min-w-0 flex-1">
                    <p
                      class="text-xs font-semibold text-charcoalDark group-hover:text-mustardHover truncate"
                    >
                      {{ book.judul }}
                    </p>
                    <div class="flex items-center gap-2 text-[10px] text-gray-500 mt-0.5 truncate">
                      <span
                        v-if="book.isbn"
                        class="font-mono bg-gray-100 px-1 rounded text-gray-600"
                      >
                        ISBN: {{ book.isbn }}
                      </span>
                      <span v-if="book.penulis">Penulis: {{ book.penulis }}</span>
                    </div>
                  </div>
                  <span
                    :class="
                      book.tipeBuku === 'Digital'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    "
                    class="text-[10px] font-medium px-2 py-0.5 rounded border shrink-0"
                  >
                    {{ book.tipeBuku }}
                  </span>
                </button>
              </div>
              <div class="px-2 pt-1">
                <button
                  type="button"
                  @click="navigateToBookSearch(searchQuery)"
                  class="w-full text-left px-2.5 py-1.5 text-[11px] font-semibold text-mustardHover hover:bg-amber-50/50 rounded flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span>Lihat semua buku untuk "{{ searchQuery }}"</span>
                  <ArrowRightIcon class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <!-- Section: Anggota -->
            <div v-if="isLibrarian && matchedMembers.length > 0" class="pt-2">
              <div
                class="px-3 pb-1.5 flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase tracking-wider"
              >
                <div class="flex items-center gap-1.5">
                  <UserIcon class="w-3.5 h-3.5 text-mustard" />
                  <span>Daftar Anggota</span>
                </div>
                <span class="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px]">
                  {{ matchedMembers.length }}
                </span>
              </div>
              <div class="space-y-0.5 px-1">
                <button
                  v-for="member in matchedMembers"
                  :key="member.id"
                  type="button"
                  @click="navigateToMember(member)"
                  class="w-full text-left px-2.5 py-2 hover:bg-gray-50 rounded-lg flex items-center justify-between gap-3 transition-colors cursor-pointer group"
                >
                  <div class="flex items-center gap-2.5 min-w-0 flex-1">
                    <div
                      class="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-[11px] font-bold text-charcoal shrink-0 overflow-hidden"
                    >
                      <img
                        v-if="member.foto"
                        :src="member.foto"
                        :alt="member.nama"
                        class="w-full h-full object-cover"
                      />
                      <span v-else>{{ member.nama?.charAt(0) || 'A' }}</span>
                    </div>
                    <div class="min-w-0 flex-1">
                      <p
                        class="text-xs font-semibold text-charcoalDark group-hover:text-mustardHover truncate"
                      >
                        {{ member.nama }}
                      </p>
                      <p class="text-[10px] text-gray-500 truncate">
                        NIS: {{ member.nis || '-' }}
                        <span v-if="member.email">• {{ member.email }}</span>
                      </p>
                    </div>
                  </div>
                  <span
                    :class="
                      member.status_aktif
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-red-50 text-red-700 border-red-200'
                    "
                    class="text-[10px] font-medium px-2 py-0.5 rounded border shrink-0"
                  >
                    {{ member.status_aktif ? 'Aktif' : 'Nonaktif' }}
                  </span>
                </button>
              </div>
              <div class="px-2 pt-1">
                <button
                  type="button"
                  @click="navigateToMemberSearch(searchQuery)"
                  class="w-full text-left px-2.5 py-1.5 text-[11px] font-semibold text-mustardHover hover:bg-amber-50/50 rounded flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span>Lihat semua anggota untuk "{{ searchQuery }}"</span>
                  <ArrowRightIcon class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>

    <div class="flex items-center gap-3 sm:gap-4 ml-2 sm:ml-6 shrink-0">
      <router-link
        :to="profileRoute"
        class="flex items-center gap-3 cursor-pointer group hover:opacity-95 transition-opacity"
        title="Buka Profil Saya"
      >
        <div
          class="w-9 h-9 bg-amber-100/80 rounded-lg overflow-hidden border border-amber-200/90 flex items-center justify-center shrink-0 cursor-pointer shadow-xs"
        >
          <img
            v-if="user?.foto && !avatarLoadError"
            :src="user.foto"
            :alt="userName"
            class="w-full h-full object-cover cursor-pointer"
            @error="avatarLoadError = true"
          />
          <div
            v-else
            class="w-full h-full flex items-center justify-center font-bold text-xs text-charcoalDark bg-amber-100 cursor-pointer select-none"
          >
            {{ userInitial }}
          </div>
        </div>
        <div class="hidden md:flex flex-col justify-center h-9 text-right cursor-pointer">
          <p
            class="text-xs font-semibold text-charcoalDark leading-none group-hover:text-mustardHover transition-colors cursor-pointer"
          >
            {{ userName }}
          </p>
          <p class="text-[10px] text-gray-500 leading-none mt-1 cursor-pointer">
            {{ userSubtext }}
          </p>
          <p class="text-[9px] text-gray-400 leading-none mt-0.5 cursor-pointer">
            {{ userRoleName }}
          </p>
        </div>
      </router-link>
    </div>
  </header>
</template>
