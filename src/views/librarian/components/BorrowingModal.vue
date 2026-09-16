<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import { useMutation, useQueryClient } from '@tanstack/vue-query';
import dayjs from 'dayjs';
import { ArrowUpCircleIcon } from '@heroicons/vue/24/outline';

import Modal from '@/components/common/Modal.vue';
import Button from '@/components/common/Button.vue';
import Input from '@/components/common/Input.vue';
import Select from '@/components/common/Select.vue';
import FormField from '@/components/common/FormField.vue';
import { api } from '@/utils/axios';
import { getErrorMessage } from '@/utils/error';
import { useToast } from '@/composables/useToast';
import { useAuthStore } from '@/stores/auth';
import {
  createTransactionSchema,
  updateTransactionSchema,
} from '@/validations/librarian/transaction.schema';
import type { Book } from '@/types/book';
import type { MemberUser } from '@/types/auth';
import type { Transaction, TransactionStatus } from '@/types/transaction';

interface Props {
  modelValue: boolean;
  mode: 'create' | 'edit';
  transaction?: Transaction | null;
  availableBooks?: Book[];
  availableMembers?: MemberUser[];
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  mode: 'create',
  transaction: null,
  availableBooks: () => [],
  availableMembers: () => [],
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'success'): void;
}>();

const authStore = useAuthStore();
const queryClient = useQueryClient();
const { showToast } = useToast();

const form = reactive({
  id: '',
  bukuId: '',
  anggotaId: '',
  tglPinjam: dayjs().format('YYYY-MM-DD'),
  tglKembali: dayjs().add(7, 'day').format('YYYY-MM-DD'),
  status: 'Dipinjam' as TransactionStatus,
});

const formErrors = ref<Record<string, string | undefined>>({});

const resetForm = () => {
  if (props.mode === 'edit' && props.transaction) {
    form.id = props.transaction.id;
    form.bukuId = props.transaction.bukuId || '';
    form.anggotaId = props.transaction.anggotaId || '';
    form.tglPinjam = dayjs(props.transaction.tglPinjam).format('YYYY-MM-DD');
    form.tglKembali = dayjs(props.transaction.tglKembali).format('YYYY-MM-DD');
    form.status = props.transaction.status;
  } else {
    form.id = '';
    form.bukuId = '';
    form.anggotaId = '';
    form.tglPinjam = dayjs().format('YYYY-MM-DD');
    form.tglKembali = dayjs().add(7, 'day').format('YYYY-MM-DD');
    form.status = 'Dipinjam';
  }
  formErrors.value = {};
};

watch(
  () => [props.modelValue, props.transaction],
  ([isOpen]) => {
    if (isOpen) {
      resetForm();
    }
  },
  { immediate: true },
);

const transactionMutation = useMutation({
  mutationFn: async (payload: typeof form) => {
    if (props.mode === 'create') {
      const res = await api.post('/transactions/', {
        bukuId: payload.bukuId,
        anggotaId: payload.anggotaId,
        pustakawanId: authStore.user?.id,
        tglPinjam: new Date(payload.tglPinjam).toISOString(),
        tglKembali: new Date(payload.tglKembali).toISOString(),
        status: payload.status,
      });
      return res.data;
    } else {
      const res = await api.put(`/transactions/${payload.id}`, {
        status: payload.status,
        tglKembali: new Date(payload.tglKembali).toISOString(),
      });
      return res.data;
    }
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['librarian-borrowing'] });
    emit('update:modelValue', false);
    emit('success');
    showToast(
      'success',
      props.mode === 'create'
        ? 'Transaksi peminjaman baru berhasil dibuat!'
        : 'Data transaksi berhasil diperbarui!',
    );
  },
  onError: (err: unknown) => {
    showToast('danger', getErrorMessage(err, 'Gagal memproses transaksi peminjaman.'));
  },
});

const submitForm = () => {
  formErrors.value = {};

  if (props.mode === 'create') {
    const validation = createTransactionSchema.safeParse({
      bukuId: form.bukuId,
      anggotaId: form.anggotaId,
      pustakawanId: authStore.user?.id,
      tglPinjam: new Date(form.tglPinjam),
      tglKembali: new Date(form.tglKembali),
      status: form.status,
    });

    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      formErrors.value = {
        bukuId: errors.bukuId?.[0],
        anggotaId: errors.anggotaId?.[0],
        tglPinjam: errors.tglPinjam?.[0],
        tglKembali: errors.tglKembali?.[0],
      };
      return;
    }
  } else {
    const validation = updateTransactionSchema.safeParse({
      status: form.status,
      tglKembali: new Date(form.tglKembali),
    });

    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      formErrors.value = {
        status: errors.status?.[0],
        tglKembali: errors.tglKembali?.[0],
      };
      return;
    }
  }

  transactionMutation.mutate(form);
};
</script>

<template>
  <Modal
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    :title="mode === 'create' ? 'Pencatatan Peminjaman Buku' : 'Ubah Status Transaksi'"
    :description="
      mode === 'create'
        ? 'Catat transaksi sirkulasi peminjaman buku fisik secara langsung di meja perpustakaan.'
        : 'Perbarui status sirkulasi atau perpanjang masa waktu pengembalian buku.'
    "
    :icon="ArrowUpCircleIcon"
    size="lg"
  >
    <form @submit.prevent="submitForm" class="space-y-4 pt-1">
      <FormField
        v-if="mode === 'create'"
        label="Koleksi Buku Fisik"
        required
        :error="formErrors.bukuId"
      >
        <Select
          v-model="form.bukuId"
          :disabled="transactionMutation.isPending.value"
          placeholder="-- Pilih Buku Fisik --"
          :options="
            availableBooks.map((buku) => ({
              label: `${buku.judul} (${buku.isbn || 'No ISBN'}) - Stok: ${buku.jumlahStok || 0}`,
              value: buku.id,
              disabled: (buku.jumlahStok || 0) <= 0,
            }))
          "
        />
      </FormField>

      <FormField
        v-if="mode === 'create'"
        label="Anggota / Siswa Peminjam"
        required
        :error="formErrors.anggotaId"
      >
        <Select
          v-model="form.anggotaId"
          :disabled="transactionMutation.isPending.value"
          placeholder="-- Pilih Anggota Aktif --"
          :options="
            availableMembers.map((mem) => ({
              label: `${mem.nama} (${mem.nis})`,
              value: mem.id,
            }))
          "
        />
      </FormField>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Tanggal Pinjam" required :error="formErrors.tglPinjam">
          <Input
            type="date"
            v-model="form.tglPinjam"
            :disabled="mode === 'edit' || transactionMutation.isPending.value"
          />
        </FormField>

        <FormField label="Batas Tanggal Kembali" required :error="formErrors.tglKembali">
          <Input
            type="date"
            v-model="form.tglKembali"
            :disabled="transactionMutation.isPending.value"
          />
        </FormField>
      </div>

      <FormField label="Status Sirkulasi" required :error="formErrors.status">
        <Select
          v-model="form.status"
          :disabled="transactionMutation.isPending.value"
          :options="[
            { label: 'Menunggu Persetujuan', value: 'Menunggu Persetujuan' },
            { label: 'Menunggu Diambil', value: 'Menunggu Diambil' },
            { label: 'Sedang Dipinjam', value: 'Dipinjam' },
            { label: 'Sudah Dikembalikan', value: 'Dikembalikan' },
            { label: 'Terlambat Dikembalikan', value: 'Terlambat' },
            { label: 'Tidak Mengembalikan (Hilang)', value: 'Tidak Mengembalikan' },
            { label: 'Dibatalkan', value: 'Dibatalkan' },
          ]"
        />
      </FormField>
    </form>

    <template #footer="{ close }">
      <Button variant="secondary" @click="close" :disabled="transactionMutation.isPending.value">
        Batal
      </Button>
      <Button variant="primary" @click="submitForm" :disabled="transactionMutation.isPending.value">
        {{ transactionMutation.isPending.value ? 'Menyimpan...' : 'Simpan Transaksi' }}
      </Button>
    </template>
  </Modal>
</template>
