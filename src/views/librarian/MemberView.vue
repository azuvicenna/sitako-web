<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import dayjs from 'dayjs';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  EnvelopeIcon,
  PhoneIcon,
} from '@heroicons/vue/24/outline';

import Button from '@/components/common/Button.vue';
import Input from '@/components/common/Input.vue';
import Badge from '@/components/common/Badge.vue';
import ConfirmModal from '@/components/common/ConfirmModal.vue';
import Table from '@/components/tables/Table.vue';
import MemberModal from './components/MemberModal.vue';
import { api } from '@/utils/axios';
import { getErrorMessage } from '@/utils/error';
import { useToast } from '@/composables/useToast';
import { usePaginationSearch } from '@/composables/usePaginationSearch';
import type { TableColumn } from '@/types/table';
import type { MemberUser } from '@/types/auth';
import type { MemberListResponse } from '@/types/user';

const queryClient = useQueryClient();
const { showToast } = useToast();

// --- STATE: FILTER & TABLE ---
const { page, search, debouncedSearch, handleSearchChange, handlePageChange } =
  usePaginationSearch();

const statusActive = ref<'Semua' | 'true' | 'false'>('Semua');

const handleStatusFilter = (status: 'Semua' | 'true' | 'false') => {
  statusActive.value = status;
  page.value = 1;
};

const { data: membersResponse, isLoading } = useQuery({
  queryKey: ['members', page, statusActive, debouncedSearch],
  queryFn: async () => {
    const params = new URLSearchParams({
      statusActive: statusActive.value,
      page: page.value.toString(),
      limit: '10',
      ...(debouncedSearch.value ? { search: debouncedSearch.value } : {}),
    });
    const res = await api.get<MemberListResponse>(`/user/members/?${params}`);
    return res.data;
  },
});

const members = computed<MemberUser[]>(() => membersResponse.value?.data || []);
const meta = computed(() => membersResponse.value?.meta || null);

const columns: TableColumn<MemberUser>[] = [
  { key: 'nama', label: 'Anggota / Siswa' },
  { key: 'kontak', label: 'Kontak' },
  { key: 'status_aktif', label: 'Status Akun', align: 'center', width: 'w-32' },
  { key: 'createdAt', label: 'Terdaftar', width: 'w-36' },
  { key: 'actions', label: 'Aksi', align: 'right', width: 'w-28' },
];

// --- MODAL FORM TAMBAH / EDIT ---
const isFormModalOpen = ref(false);
const selectedMember = ref<MemberUser | null>(null);

const openCreateModal = () => {
  selectedMember.value = null;
  isFormModalOpen.value = true;
};

const openEditModal = (member: MemberUser) => {
  selectedMember.value = member;
  isFormModalOpen.value = true;
};

// --- MODAL HAPUS ANGGOTA ---
const isDeleteModalOpen = ref(false);
const memberToDelete = ref<MemberUser | null>(null);

const openDeleteModal = (member: MemberUser) => {
  memberToDelete.value = member;
  isDeleteModalOpen.value = true;
};

const deleteMemberMutation = useMutation({
  mutationFn: async (id: string) => {
    const res = await api.delete(`/user/members/${id}`);
    return res.data;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['members'] });
    isDeleteModalOpen.value = false;
    showToast('success', 'Data anggota berhasil dihapus!');
  },
  onError: (err: unknown) => {
    showToast('danger', getErrorMessage(err, 'Gagal menghapus data anggota.'));
  },
});

const confirmDeleteMember = () => {
  if (memberToDelete.value) {
    deleteMemberMutation.mutate(memberToDelete.value.id);
  }
};
</script>

<template>
  <div class="space-y-6">
    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold text-charcoalDark">Daftar Anggota</h2>
        <p class="text-sm text-gray-500 mt-1">
          Kelola data siswa dan pengguna perpustakaan yang terdaftar di SITAKO
        </p>
      </div>
      <Button variant="primary" :icon="PlusIcon" @click="openCreateModal" class="shrink-0">
        Tambah Anggota
      </Button>
    </div>

    <!-- Filter & Search Toolbar -->
    <div
      class="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-xs"
    >
      <!-- Filter Status Pills -->
      <div class="flex items-center gap-1 bg-gray-100 p-1 rounded-lg shrink-0">
        <button
          type="button"
          @click="handleStatusFilter('Semua')"
          :class="[
            'px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer',
            statusActive === 'Semua'
              ? 'bg-mustard text-charcoalDark shadow-xs'
              : 'text-gray-600 hover:text-charcoalDark',
          ]"
        >
          Semua
        </button>
        <button
          type="button"
          @click="handleStatusFilter('true')"
          :class="[
            'px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer',
            statusActive === 'true'
              ? 'bg-mustard text-charcoalDark shadow-xs'
              : 'text-gray-600 hover:text-charcoalDark',
          ]"
        >
          Aktif
        </button>
        <button
          type="button"
          @click="handleStatusFilter('false')"
          :class="[
            'px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer',
            statusActive === 'false'
              ? 'bg-mustard text-charcoalDark shadow-xs'
              : 'text-gray-600 hover:text-charcoalDark',
          ]"
        >
          Nonaktif
        </button>
      </div>

      <!-- Search Input -->
      <div class="flex-1 max-w-md">
        <Input
          :model-value="search"
          :icon="MagnifyingGlassIcon"
          placeholder="Cari nama, NIS, email, atau telepon..."
          @update:model-value="handleSearchChange"
        />
      </div>

      <div class="text-xs font-semibold text-gray-500 ml-auto self-center">
        Total:
        <span class="text-charcoalDark font-bold">{{ meta?.totalRows ?? members.length }}</span>
        Anggota
      </div>
    </div>

    <!-- Tabel Data Anggota -->
    <Table
      :columns="columns"
      :items="members"
      :meta="meta"
      :loading="isLoading"
      empty-message="Belum ada data anggota yang terdaftar."
      @change-page="handlePageChange"
    >
      <!-- Cell Nama & NIS -->
      <template #cell-nama="{ item }">
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-full bg-gray-100 overflow-hidden border border-gray-200 shrink-0 flex items-center justify-center"
          >
            <img
              v-if="item.foto"
              :src="item.foto"
              :alt="item.nama"
              class="w-full h-full object-cover"
              @error="
                (e) =>
                  ((e.target as HTMLImageElement).src =
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(item.nama)}&background=eab308&color=1f2937`)
              "
            />
            <span v-else class="text-xs font-bold text-gray-400">
              {{ item.nama.slice(0, 2).toUpperCase() }}
            </span>
          </div>
          <div>
            <span class="font-bold text-charcoalDark text-sm block leading-tight">
              {{ item.nama }}
            </span>
            <span class="text-[11px] text-gray-500 mt-0.5 block">NIS: {{ item.nis }}</span>
          </div>
        </div>
      </template>

      <!-- Cell Kontak -->
      <template #cell-kontak="{ item }">
        <div class="space-y-0.5 text-xs text-gray-600">
          <div class="flex items-center gap-1.5">
            <EnvelopeIcon class="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span class="truncate max-w-45">{{ item.email }}</span>
          </div>
          <div class="flex items-center gap-1.5 text-gray-500">
            <PhoneIcon class="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span>{{ item.telepon }}</span>
          </div>
        </div>
      </template>

      <!-- Cell Status -->
      <template #cell-status_aktif="{ item }">
        <Badge :variant="item.status_aktif ? 'success' : 'neutral'">
          {{ item.status_aktif ? 'Aktif' : 'Nonaktif' }}
        </Badge>
      </template>

      <!-- Cell Tanggal Terdaftar -->
      <template #cell-createdAt="{ item }">
        <span class="text-xs text-gray-500">
          {{ item.createdAt ? dayjs(item.createdAt).format('DD MMM YYYY') : '-' }}
        </span>
      </template>

      <!-- Cell Aksi -->
      <template #cell-actions="{ item }">
        <div class="flex items-center justify-end gap-1">
          <button
            type="button"
            @click="openEditModal(item)"
            class="p-2 text-gray-500 hover:text-charcoalDark hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            title="Ubah Data Anggota"
          >
            <PencilSquareIcon class="w-4 h-4" />
          </button>
          <button
            type="button"
            @click="openDeleteModal(item)"
            class="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
            title="Hapus Anggota"
          >
            <TrashIcon class="w-4 h-4" />
          </button>
        </div>
      </template>
    </Table>

    <!-- MODAL FORM TAMBAH / EDIT ANGGOTA -->
    <MemberModal v-model="isFormModalOpen" :member="selectedMember" />

    <!-- MODAL KONFIRMASI HAPUS ANGGOTA -->
    <ConfirmModal
      v-model="isDeleteModalOpen"
      title="Konfirmasi Hapus Anggota"
      :description="`Apakah Anda yakin ingin menghapus anggota '${memberToDelete?.nama}' (${memberToDelete?.nis})? Riwayat keanggotaan ini akan dihapus dari sistem.`"
      confirm-text="Ya, Hapus Anggota"
      variant="danger"
      :loading="deleteMemberMutation.isPending.value"
      @confirm="confirmDeleteMember"
    />
  </div>
</template>
