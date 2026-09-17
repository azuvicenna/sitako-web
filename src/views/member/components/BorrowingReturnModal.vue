<script setup lang="ts">
import { ref, watch } from 'vue';
import { useQueryClient } from '@tanstack/vue-query';
import dayjs from 'dayjs';

import Button from '@/components/common/Button.vue';
import Modal from '@/components/common/Modal.vue';
import Alert from '@/components/common/Alert.vue';
import { api } from '@/utils/axios';
import { formatRupiah } from '@/utils/currency';
import { getErrorMessage } from '@/utils/error';
import { useToast } from '@/composables/useToast';
import { returnTransactionSchema } from '@/validations';
import type { MemberTransactionItem, ReturnTransactionResponse } from '@/types/member-transaction';

interface Props {
  modelValue: boolean;
  transaction: MemberTransactionItem | null;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  transaction: null,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'success'): void;
}>();

const queryClient = useQueryClient();
const { showToast } = useToast();

const isLostBook = ref(false);
const isSubmitting = ref(false);
const returnResult = ref<ReturnTransactionResponse | null>(null);

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      isLostBook.value = false;
      returnResult.value = null;
    }
  },
);

const handleClose = () => {
  emit('update:modelValue', false);
};

const submitReturn = async () => {
  if (!props.transaction) return;

  const validation = returnTransactionSchema.safeParse({
    isBukuHilang: isLostBook.value,
  });

  if (!validation.success) {
    showToast('danger', 'Data pengembalian tidak valid');
    return;
  }

  isSubmitting.value = true;
  try {
    const res = await api.post<ReturnTransactionResponse>(
      `/member/transactions/${props.transaction.id}/return`,
      validation.data,
    );

    returnResult.value = res.data;
    showToast('success', res.data.pesan || 'Pengembalian berhasil diajukan!');
    queryClient.invalidateQueries({ queryKey: ['member-transactions'] });
    queryClient.invalidateQueries({ queryKey: ['member-dashboard'] });
    emit('success');
  } catch (error: unknown) {
    showToast('danger', getErrorMessage(error, 'Gagal mengajukan pengembalian buku'));
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <Modal
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    title="Pengembalian Buku"
    size="md"
  >
    <div v-if="transaction" class="space-y-4">
      <!-- Jika ada hasil kalkulasi pengembalian -->
      <div v-if="returnResult" class="space-y-4">
        <Alert
          :type="returnResult.isTerlambat ? 'warning' : 'success'"
          :title="
            returnResult.isTerlambat
              ? 'Pengembalian Terlambat Dikenakan Denda'
              : 'Pengembalian Berhasil Diajukan'
          "
          :description="returnResult.pesan"
        />

        <div
          v-if="returnResult.denda"
          class="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2"
        >
          <h4 class="text-xs font-bold text-rose-800 uppercase tracking-wide">
            Rincian Denda Keterlambatan
          </h4>
          <div class="flex justify-between text-xs text-rose-700">
            <span>Jenis Denda:</span>
            <span class="font-semibold">{{ returnResult.denda.jenisDenda }}</span>
          </div>
          <div class="flex justify-between text-xs text-rose-700">
            <span>Keterlambatan:</span>
            <span class="font-semibold">{{ returnResult.denda.hariTerlambat }} hari</span>
          </div>
          <div
            class="flex justify-between text-sm text-rose-800 font-bold pt-2 border-t border-rose-200"
          >
            <span>Total Denda:</span>
            <span>{{ formatRupiah(returnResult.denda.totalDenda) }}</span>
          </div>
        </div>

        <div class="flex justify-end pt-2">
          <Button variant="primary" size="sm" @click="handleClose"> Selesai </Button>
        </div>
      </div>

      <!-- Form Konfirmasi Awal Pengembalian -->
      <div v-else class="space-y-4">
        <div class="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2 text-xs">
          <div class="flex justify-between">
            <span class="text-gray-500">Kode Transaksi:</span>
            <span class="font-mono font-bold text-charcoalDark">
              {{ transaction.kdTransaksi }}
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">Judul Buku:</span>
            <span class="font-semibold text-charcoalDark">
              {{ transaction.judulBuku }}
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">Batas Kembali:</span>
            <span class="font-medium text-charcoalDark">
              {{ dayjs(transaction.tglKembali).format('DD MMMM YYYY') }}
            </span>
          </div>
        </div>

        <!-- Opsi Pelaporan Buku Hilang -->
        <div class="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl">
          <label class="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              v-model="isLostBook"
              class="mt-0.5 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
            />
            <div class="text-xs">
              <span class="font-bold text-charcoalDark block"> Laporkan Buku Hilang </span>
              <span class="text-gray-500">
                Centang opsi ini hanya apabila fisik buku hilang. Tarif denda penggantian buku
                hilang akan dihitung secara flat oleh sistem.
              </span>
            </div>
          </label>
        </div>

        <p class="text-xs text-gray-500">
          Pastikan buku fisik telah dibawa dan diserahkan kepada pustakawan di meja sirkulasi untuk
          verifikasi akhir.
        </p>

        <div class="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
          <Button variant="secondary" size="sm" @click="handleClose"> Batal </Button>
          <Button
            variant="primary"
            size="sm"
            :loading="isSubmitting"
            @click="submitReturn"
            class="text-xs font-semibold bg-emerald-600! hover:bg-emerald-700! text-white!"
          >
            Konfirmasi Pengembalian
          </Button>
        </div>
      </div>
    </div>
  </Modal>
</template>
