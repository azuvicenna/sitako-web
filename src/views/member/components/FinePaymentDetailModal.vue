<script setup lang="ts">
import { ref, watch } from 'vue';
import dayjs from 'dayjs';

import Button from '@/components/common/Button.vue';
import Modal from '@/components/common/Modal.vue';
import Badge from '@/components/common/Badge.vue';
import { api } from '@/utils/axios';
import { formatRupiah } from '@/utils/currency';
import { getErrorMessage } from '@/utils/error';
import { useToast } from '@/composables/useToast';
import type { MemberFinePaymentDetailResponse } from '@/types/member-fine';

interface Props {
  modelValue: boolean;
  paymentId?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  paymentId: null,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();

const { showToast } = useToast();

const detailPayment = ref<MemberFinePaymentDetailResponse | null>(null);
const isLoading = ref(false);

const fetchDetail = async (id: string) => {
  isLoading.value = true;
  detailPayment.value = null;

  try {
    const res = await api.get<MemberFinePaymentDetailResponse>(
      `/member/fine-payments/detail/${id}`,
    );
    detailPayment.value = res.data;
  } catch (error: unknown) {
    showToast('danger', getErrorMessage(error, 'Gagal memuat detail pembayaran'));
    emit('update:modelValue', false);
  } finally {
    isLoading.value = false;
  }
};

watch(
  () => [props.modelValue, props.paymentId],
  ([isOpen, id]) => {
    if (isOpen && id) {
      fetchDetail(String(id));
    } else {
      detailPayment.value = null;
    }
  },
  { immediate: true },
);

const handleClose = () => {
  emit('update:modelValue', false);
};
</script>

<template>
  <Modal
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    title="Detail Pembayaran Denda"
    size="md"
  >
    <div v-if="isLoading" class="py-8 text-center animate-pulse space-y-3">
      <div class="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
      <div class="h-4 bg-gray-200 rounded w-1/3 mx-auto"></div>
    </div>

    <div v-else-if="detailPayment" class="space-y-4 text-xs">
      <div class="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
        <div class="flex justify-between items-center pb-2 border-b border-gray-200">
          <span class="text-gray-500">Status Pembayaran</span>
          <Badge variant="success" size="sm"> Lunas Terbayar </Badge>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-500">Kode Transaksi</span>
          <span class="font-mono font-bold text-charcoalDark">
            {{ detailPayment.kdTransaksi }}
          </span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-500">Judul Buku</span>
          <span class="font-semibold text-charcoalDark text-right max-w-xs">
            {{ detailPayment.judulBuku }}
          </span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-500">Periode Pinjam</span>
          <span class="font-medium text-charcoalDark">
            {{ dayjs(detailPayment.tglPinjam).format('DD/MM/YYYY') }} s/d
            {{ dayjs(detailPayment.tglKembali).format('DD/MM/YYYY') }}
          </span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-500">Metode Pembayaran</span>
          <span class="font-semibold text-charcoalDark">
            {{ detailPayment.metodePembayaran }}
          </span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-500">Waktu Bayar</span>
          <span class="font-medium text-charcoalDark">
            {{
              detailPayment.tglBayar
                ? dayjs(detailPayment.tglBayar).format('DD MMMM YYYY, HH:mm')
                : '-'
            }}
          </span>
        </div>
        <div class="flex justify-between text-sm pt-2 border-t border-gray-200 font-bold">
          <span>Total Denda:</span>
          <span class="text-emerald-700">
            {{ formatRupiah(detailPayment.totalDenda) }}
          </span>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end">
        <Button variant="secondary" size="sm" @click="handleClose"> Tutup </Button>
      </div>
    </template>
  </Modal>
</template>
