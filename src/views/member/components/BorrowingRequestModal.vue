<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import { useQueryClient } from '@tanstack/vue-query';
import dayjs from 'dayjs';

import Button from '@/components/common/Button.vue';
import Modal from '@/components/common/Modal.vue';
import Alert from '@/components/common/Alert.vue';
import { api } from '@/utils/axios';
import { getErrorMessage } from '@/utils/error';
import { useToast } from '@/composables/useToast';
import { createMemberTransactionSchema } from '@/validations';
import type { CatalogBookItem } from '@/types/member-catalog';
import type { LibrarianUser } from '@/types/auth';

interface Props {
  modelValue: boolean;
  initialBukuId?: string;
  availableBooks?: CatalogBookItem[];
  librarians?: LibrarianUser[];
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  initialBukuId: '',
  availableBooks: () => [],
  librarians: () => [],
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'success'): void;
}>();

const queryClient = useQueryClient();
const { showToast } = useToast();

const borrowForm = reactive({
  bukuId: '',
  pustakawanId: '',
  tglPinjam: dayjs().format('YYYY-MM-DD'),
  tglKembali: dayjs().add(7, 'day').format('YYYY-MM-DD'),
});

const borrowErrors = ref<Record<string, string>>({});
const isSubmitting = ref(false);

const initForm = () => {
  borrowForm.bukuId = props.initialBukuId || '';
  borrowForm.pustakawanId = props.librarians[0]?.id || '';
  borrowForm.tglPinjam = dayjs().format('YYYY-MM-DD');
  borrowForm.tglKembali = dayjs().add(7, 'day').format('YYYY-MM-DD');
  borrowErrors.value = {};
};

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      initForm();
    }
  },
  { immediate: true },
);

watch(
  () => props.initialBukuId,
  (val) => {
    if (val) {
      borrowForm.bukuId = val;
    }
  },
);

const handleClose = () => {
  emit('update:modelValue', false);
  borrowErrors.value = {};
};

const submitBorrowForm = async () => {
  borrowErrors.value = {};

  const validation = createMemberTransactionSchema.safeParse({
    bukuId: borrowForm.bukuId,
    pustakawanId: borrowForm.pustakawanId,
    tglPinjam: borrowForm.tglPinjam ? new Date(borrowForm.tglPinjam) : undefined,
    tglKembali: borrowForm.tglKembali ? new Date(borrowForm.tglKembali) : undefined,
    status: 'Menunggu Persetujuan',
  });

  const errors: Record<string, string> = {};
  if (!validation.success) {
    const fieldErrors = validation.error.flatten().fieldErrors;
    if (fieldErrors.bukuId?.[0]) errors.bukuId = fieldErrors.bukuId[0];
    if (fieldErrors.pustakawanId?.[0]) errors.pustakawanId = fieldErrors.pustakawanId[0];
    if (fieldErrors.tglPinjam?.[0]) errors.tglPinjam = fieldErrors.tglPinjam[0];
    if (fieldErrors.tglKembali?.[0]) errors.tglKembali = fieldErrors.tglKembali[0];
  }

  if (!borrowForm.tglPinjam) {
    errors.tglPinjam = 'Tanggal pinjam wajib diisi';
  }
  if (!borrowForm.tglKembali) {
    errors.tglKembali = 'Tanggal kembali wajib diisi';
  }

  if (Object.keys(errors).length > 0) {
    borrowErrors.value = errors;
    return;
  }

  isSubmitting.value = true;
  try {
    await api.post('/member/transactions/', {
      bukuId: borrowForm.bukuId,
      pustakawanId: borrowForm.pustakawanId,
      tglPinjam: new Date(borrowForm.tglPinjam),
      tglKembali: new Date(borrowForm.tglKembali),
      status: 'Menunggu Persetujuan',
    });

    showToast('success', 'Pengajuan peminjaman berhasil dibuat! Menunggu persetujuan pustakawan.');
    queryClient.invalidateQueries({ queryKey: ['member-transactions'] });
    queryClient.invalidateQueries({ queryKey: ['member-dashboard'] });
    emit('update:modelValue', false);
    emit('success');
  } catch (error: unknown) {
    showToast('danger', getErrorMessage(error, 'Gagal mengajukan peminjaman buku'));
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <Modal
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    title="Ajukan Peminjaman Buku Mandiri"
    size="md"
  >
    <form @submit.prevent="submitBorrowForm" class="space-y-4">
      <!-- Pilihan Buku Fisik -->
      <div>
        <label class="block text-xs font-semibold text-charcoalDark mb-1">
          Buku Fisik yang Dipinjam <span class="text-rose-500">*</span>
        </label>
        <select
          v-model="borrowForm.bukuId"
          class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-mustard focus:border-mustard outline-none transition bg-white cursor-pointer"
        >
          <option value="" disabled>-- Pilih buku yang ingin dipinjam --</option>
          <option
            v-for="b in availableBooks"
            :key="b.id"
            :value="b.id"
            :disabled="b.jumlahStok <= 0"
          >
            {{ b.judul }} ({{ b.penulis }}) — Stok: {{ b.jumlahStok }}
          </option>
        </select>
        <p v-if="borrowErrors.bukuId" class="text-xs text-rose-500 mt-1">
          {{ borrowErrors.bukuId }}
        </p>
      </div>

      <!-- Pilihan Pustakawan -->
      <div>
        <label class="block text-xs font-semibold text-charcoalDark mb-1">
          Petugas Pustakawan Verifikator <span class="text-rose-500">*</span>
        </label>
        <select
          v-model="borrowForm.pustakawanId"
          class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-mustard focus:border-mustard outline-none transition bg-white cursor-pointer"
        >
          <option value="" disabled>-- Pilih petugas sirkulasi --</option>
          <option v-for="p in librarians" :key="p.id" :value="p.id">
            {{ p.nama }} (NIP: {{ p.nip }})
          </option>
        </select>
        <p v-if="borrowErrors.pustakawanId" class="text-xs text-rose-500 mt-1">
          {{ borrowErrors.pustakawanId }}
        </p>
      </div>

      <!-- Tanggal Pinjam & Batas Kembali -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-semibold text-charcoalDark mb-1">
            Tanggal Mulai Pinjam <span class="text-rose-500">*</span>
          </label>
          <input
            type="date"
            v-model="borrowForm.tglPinjam"
            class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-mustard focus:border-mustard outline-none transition"
          />
          <p v-if="borrowErrors.tglPinjam" class="text-xs text-rose-500 mt-1">
            {{ borrowErrors.tglPinjam }}
          </p>
        </div>

        <div>
          <label class="block text-xs font-semibold text-charcoalDark mb-1">
            Batas Waktu Pengembalian <span class="text-rose-500">*</span>
          </label>
          <input
            type="date"
            v-model="borrowForm.tglKembali"
            class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-mustard focus:border-mustard outline-none transition"
          />
          <p v-if="borrowErrors.tglKembali" class="text-xs text-rose-500 mt-1">
            {{ borrowErrors.tglKembali }}
          </p>
        </div>
      </div>

      <!-- Regulasi Info -->
      <Alert
        type="info"
        title="Ketentuan Sirkulasi Mandiri"
        description="Setelah pengajuan dibuat, Anda dapat mengambil buku fisik di meja sirkulasi perpustakaan dengan menunjukkan kode transaksi kepada petugas."
      />

      <div class="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
        <Button variant="secondary" size="sm" @click="handleClose"> Batal </Button>
        <Button
          variant="primary"
          size="sm"
          type="submit"
          :loading="isSubmitting"
          class="text-xs font-semibold"
        >
          Kirim Pengajuan Pinjam
        </Button>
      </div>
    </form>
  </Modal>
</template>
