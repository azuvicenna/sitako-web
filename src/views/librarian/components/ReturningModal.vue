<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import { useMutation, useQueryClient } from '@tanstack/vue-query';
import dayjs from 'dayjs';
import {
  ArrowDownCircleIcon,
  CheckCircleIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
} from '@heroicons/vue/24/outline';

import Button from '@/components/common/Button.vue';
import Input from '@/components/common/Input.vue';
import Modal from '@/components/common/Modal.vue';
import { api } from '@/utils/axios';
import { formatRupiah } from '@/utils/currency';
import { getErrorMessage } from '@/utils/error';
import { useToast } from '@/composables/useToast';
import type { Transaction, TransactionStatus } from '@/types/transaction';

interface Props {
  modelValue: boolean;
  initialTransaction?: Transaction | null;
  activeBorrowings?: Transaction[];
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  initialTransaction: null,
  activeBorrowings: () => [],
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'success'): void;
}>();

const queryClient = useQueryClient();
const { showToast } = useToast();

const selectedTransaction = ref<Transaction | null>(null);

const returnForm = reactive({
  transactionId: '',
  kondisiBuku: 'Baik' as 'Baik' | 'Hilang',
  tglKembaliAktual: dayjs().format('YYYY-MM-DD'),
});

const initForm = () => {
  if (props.initialTransaction) {
    selectedTransaction.value = props.initialTransaction;
    returnForm.transactionId = props.initialTransaction.id;
  } else {
    selectedTransaction.value = props.activeBorrowings[0] || null;
    returnForm.transactionId = props.activeBorrowings[0]?.id || '';
  }
  returnForm.kondisiBuku = 'Baik';
  returnForm.tglKembaliAktual = dayjs().format('YYYY-MM-DD');
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
  () => props.initialTransaction,
  (newVal) => {
    if (props.modelValue && newVal) {
      selectedTransaction.value = newVal;
      returnForm.transactionId = newVal.id;
    }
  },
);

const handleSelectTransactionChange = () => {
  const found = props.activeBorrowings.find((t) => t.id === returnForm.transactionId);
  selectedTransaction.value = found || null;
};

// Perhitungan Keterlambatan
const delayCalculation = computed(() => {
  if (!selectedTransaction.value) return { isOverdue: false, daysOverdue: 0, estimatedFine: 0 };

  const dueDate = dayjs(selectedTransaction.value.tglKembali).startOf('day');
  const returnDate = dayjs(returnForm.tglKembaliAktual).startOf('day');
  const diff = returnDate.diff(dueDate, 'day');

  if (diff > 0) {
    return {
      isOverdue: true,
      daysOverdue: diff,
      estimatedFine: diff * 1000, // Estimasi standar denda keterlambatan per hari
    };
  }

  return { isOverdue: false, daysOverdue: 0, estimatedFine: 0 };
});

const returnMutation = useMutation({
  mutationFn: async () => {
    if (!selectedTransaction.value) return;

    let targetStatus: TransactionStatus = 'Dikembalikan';
    if (returnForm.kondisiBuku === 'Hilang') {
      targetStatus = 'Tidak Mengembalikan';
    } else if (delayCalculation.value.isOverdue) {
      targetStatus = 'Dikembalikan';
    }

    const res = await api.put(`/transactions/${selectedTransaction.value.id}`, {
      status: targetStatus,
      tglKembali: new Date(returnForm.tglKembaliAktual).toISOString(),
    });
    return res.data;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['librarian-returning'] });
    queryClient.invalidateQueries({ queryKey: ['active-borrowings-dropdown'] });
    emit('update:modelValue', false);
    emit('success');
    showToast(
      'success',
      returnForm.kondisiBuku === 'Hilang'
        ? 'Pengembalian dicatat sebagai buku hilang. Silakan catat tagihan denda terkait.'
        : 'Buku berhasil diterima kembali ke perpustakaan!',
    );
  },
  onError: (err: unknown) => {
    showToast('danger', getErrorMessage(err, 'Gagal memproses pengembalian buku.'));
  },
});

const submitReturn = () => {
  if (!returnForm.transactionId) {
    showToast('danger', 'Silakan pilih transaksi yang akan dikembalikan.');
    return;
  }
  returnMutation.mutate();
};
</script>

<template>
  <Modal
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    title="Konfirmasi Pengembalian Buku"
    description="Verifikasi fisik buku yang diserahkan dan catat status pengembalian sirkulasi."
    :icon="ArrowDownCircleIcon"
    size="lg"
  >
    <div class="space-y-4 pt-1">
      <!-- Pilihan Transaksi jika dibuka tanpa parameter -->
      <div>
        <label class="block text-xs font-bold text-charcoalDark mb-1">
          Transaksi yang Dikembalikan <span class="text-red-500">*</span>
        </label>
        <select
          v-model="returnForm.transactionId"
          @change="handleSelectTransactionChange"
          :disabled="returnMutation.isPending.value"
          class="block w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-charcoal focus:outline-none focus:border-mustard focus:ring-1 focus:ring-mustard"
        >
          <option value="" disabled>-- Pilih Transaksi Peminjaman --</option>
          <option v-for="trx in activeBorrowings" :key="trx.id" :value="trx.id">
            {{ trx.kdTransaksi }} - {{ trx.namaAnggota }} ({{ trx.judulBuku }})
          </option>
        </select>
      </div>

      <!-- Ringkasan Transaksi Terpilih -->
      <div
        v-if="selectedTransaction"
        class="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2 text-xs"
      >
        <div class="flex justify-between items-center pb-2 border-b border-gray-200">
          <span class="text-gray-500">Judul Buku:</span>
          <span class="font-bold text-charcoalDark text-sm">
            {{ selectedTransaction.judulBuku }}
          </span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-gray-500">Peminjam:</span>
          <span class="font-semibold text-charcoalDark">
            {{ selectedTransaction.namaAnggota }}
          </span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-gray-500">Batas Tanggal Jatuh Tempo:</span>
          <span class="font-semibold text-charcoalDark">
            {{ dayjs(selectedTransaction.tglKembali).format('DD MMMM YYYY') }}
          </span>
        </div>
      </div>

      <!-- Deteksi Status Keterlambatan -->
      <div
        v-if="delayCalculation.isOverdue"
        class="p-3.5 bg-red-50 border border-red-200 rounded-xl"
      >
        <div class="flex items-start gap-2.5">
          <ExclamationTriangleIcon class="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <h4 class="font-bold text-red-900 text-xs">Peringatan Keterlambatan</h4>
            <p class="text-[11px] text-red-700 mt-0.5 leading-relaxed">
              Pengembalian melewati jatuh tempo sebanyak
              <span class="font-bold">{{ delayCalculation.daysOverdue }} hari</span>. Estimasi
              kewajiban denda:
              <span class="font-bold">{{ formatRupiah(delayCalculation.estimatedFine) }}</span
              >.
            </p>
          </div>
        </div>
      </div>

      <div
        v-else-if="selectedTransaction"
        class="p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-green-800 text-xs"
      >
        <CheckCircleIcon class="w-4 h-4 text-green-600 shrink-0" />
        <span class="font-medium">Pengembalian tepat waktu (tidak dikenakan denda).</span>
      </div>

      <!-- Pilihan Kondisi Fisik Buku -->
      <div>
        <label class="block text-xs font-bold text-charcoalDark mb-2">
          Hasil Pemeriksaan Fisik Buku <span class="text-red-500">*</span>
        </label>
        <div class="grid grid-cols-2 gap-3">
          <label
            :class="[
              'p-3 rounded-xl border flex flex-col gap-1 cursor-pointer transition-colors',
              returnForm.kondisiBuku === 'Baik'
                ? 'border-mustard bg-amber-50/50 text-charcoalDark font-bold shadow-xs'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50',
            ]"
          >
            <input
              type="radio"
              name="kondisi"
              value="Baik"
              v-model="returnForm.kondisiBuku"
              class="hidden"
            />
            <div class="flex items-center gap-1.5 text-xs">
              <CheckBadgeIcon class="w-4 h-4 text-green-600" />
              <span>Buku Baik & Lengkap</span>
            </div>
            <span class="text-[10px] text-gray-500 font-normal"
              >Buku kembali utuh siap dipinjamkan</span
            >
          </label>

          <label
            :class="[
              'p-3 rounded-xl border flex flex-col gap-1 cursor-pointer transition-colors',
              returnForm.kondisiBuku === 'Hilang'
                ? 'border-red-500 bg-red-50 text-red-900 font-bold shadow-xs'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50',
            ]"
          >
            <input
              type="radio"
              name="kondisi"
              value="Hilang"
              v-model="returnForm.kondisiBuku"
              class="hidden"
            />
            <div class="flex items-center gap-1.5 text-xs">
              <ExclamationTriangleIcon class="w-4 h-4 text-red-600" />
              <span>Buku Hilang / Rusak</span>
            </div>
            <span class="text-[10px] text-gray-500 font-normal"
              >Dikenakan denda ganti rugi buku</span
            >
          </label>
        </div>
      </div>

      <!-- Tanggal Dikembalikan -->
      <div>
        <label class="block text-xs font-bold text-charcoalDark mb-1">
          Tanggal Diterima Kembali
        </label>
        <Input
          type="date"
          v-model="returnForm.tglKembaliAktual"
          :disabled="returnMutation.isPending.value"
        />
      </div>
    </div>

    <template #footer="{ close }">
      <Button variant="secondary" @click="close" :disabled="returnMutation.isPending.value">
        Batal
      </Button>
      <Button
        variant="primary"
        @click="submitReturn"
        :disabled="returnMutation.isPending.value || !selectedTransaction"
      >
        {{ returnMutation.isPending.value ? 'Memproses...' : 'Konfirmasi Pengembalian' }}
      </Button>
    </template>
  </Modal>
</template>
