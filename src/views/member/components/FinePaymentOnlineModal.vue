<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import { useQueryClient } from '@tanstack/vue-query';
import { ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/outline';

import Button from '@/components/common/Button.vue';
import Modal from '@/components/common/Modal.vue';
import Alert from '@/components/common/Alert.vue';
import { api } from '@/utils/axios';
import { formatRupiah } from '@/utils/currency';
import { getErrorMessage } from '@/utils/error';
import { useToast } from '@/composables/useToast';
import { initiateOnlinePaymentSchema } from '@/validations';
import type { InitiatePaymentResponse } from '@/types/member-fine';
import type { MemberTransactionItem } from '@/types/member-transaction';

interface Props {
  modelValue: boolean;
  penaltyTransactions?: MemberTransactionItem[];
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  penaltyTransactions: () => [],
  loading: false,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'success'): void;
}>();

const queryClient = useQueryClient();
const { showToast } = useToast();

const paymentMethods = [
  { code: 'QRIS', name: 'QRIS (Gopay, OVO, Dana, LinkAja, ShopeePay)', type: 'E-Wallet / QR' },
  { code: 'BRIVA', name: 'BRI Virtual Account (BRIVA)', type: 'Virtual Account' },
  { code: 'BNIVA', name: 'BNI Virtual Account', type: 'Virtual Account' },
  { code: 'BCAVA', name: 'BCA Virtual Account', type: 'Virtual Account' },
  { code: 'MANDIRIVA', name: 'Mandiri Virtual Account', type: 'Virtual Account' },
];

const payForm = reactive({
  transaksiId: '',
  paymentMethodCode: 'QRIS',
});

const payErrors = ref<Record<string, string>>({});
const isSubmitting = ref(false);
const paymentResult = ref<InitiatePaymentResponse | null>(null);

const initForm = () => {
  payForm.transaksiId = props.penaltyTransactions[0]?.id || '';
  payForm.paymentMethodCode = 'QRIS';
  payErrors.value = {};
  paymentResult.value = null;
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
  () => props.penaltyTransactions,
  (list) => {
    if (list && list.length > 0 && !payForm.transaksiId && list[0]) {
      payForm.transaksiId = list[0].id;
    }
  },
);

const handleClose = () => {
  emit('update:modelValue', false);
  paymentResult.value = null;
};

const submitPayment = async () => {
  payErrors.value = {};

  const validation = initiateOnlinePaymentSchema.safeParse({
    transaksiId: payForm.transaksiId,
    paymentMethodCode: payForm.paymentMethodCode,
  });

  if (!validation.success) {
    const errors = validation.error.flatten().fieldErrors;
    payErrors.value = {
      transaksiId: errors.transaksiId?.[0] || '',
      paymentMethodCode: errors.paymentMethodCode?.[0] || '',
    };
    return;
  }

  isSubmitting.value = true;
  try {
    const res = await api.post<InitiatePaymentResponse>(
      '/member/fine-payments/pay',
      validation.data,
    );

    paymentResult.value = res.data;
    showToast('success', 'Tagihan pembayaran berhasil dibuat!');
    queryClient.invalidateQueries({ queryKey: ['member-fine-payments'] });
    queryClient.invalidateQueries({ queryKey: ['member-dashboard'] });
    emit('success');
  } catch (error: unknown) {
    showToast('danger', getErrorMessage(error, 'Gagal menginisiasi pembayaran denda'));
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <Modal
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    title="Bayar Denda Online (Tripay)"
    size="md"
  >
    <!-- TAMPILAN SUKSES INISIASI PEMBAYARAN -->
    <div v-if="paymentResult" class="space-y-4">
      <Alert
        type="success"
        title="Tagihan Pembayaran Berhasil Dibuat"
        description="Silakan lanjutkan ke portal pembayaran resmi Tripay untuk menyelesaikan transaksi denda Anda."
      />

      <div class="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2 text-xs">
        <div class="flex justify-between">
          <span class="text-gray-500">Nomor Referensi:</span>
          <span class="font-mono font-bold text-charcoalDark">
            {{ paymentResult.tripayReference || paymentResult.id }}
          </span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-500">Metode Bayar:</span>
          <span class="font-semibold text-charcoalDark">
            {{ paymentResult.paymentMethodCode }}
          </span>
        </div>
        <div class="flex justify-between text-sm pt-2 border-t border-gray-200 font-bold">
          <span>Total Tagihan:</span>
          <span class="text-emerald-700">
            {{ formatRupiah(paymentResult.totalDenda) }}
          </span>
        </div>
      </div>

      <div class="pt-2 flex flex-col gap-2">
        <a
          v-if="paymentResult.checkoutUrl"
          :href="paymentResult.checkoutUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition"
        >
          Buka Halaman Pembayaran Tripay
          <ArrowTopRightOnSquareIcon class="w-4 h-4" />
        </a>

        <Button variant="secondary" size="sm" @click="handleClose"> Tutup Dialog </Button>
      </div>
    </div>

    <!-- FORM INISIASI PEMBAYARAN -->
    <form v-else @submit.prevent="submitPayment" class="space-y-4">
      <!-- Pilihan Transaksi Terkena Denda -->
      <div>
        <label class="block text-xs font-semibold text-charcoalDark mb-1">
          Pilih Transaksi Denda <span class="text-rose-500">*</span>
        </label>
        <div
          v-if="loading"
          class="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-500 animate-pulse"
        >
          Memuat daftar transaksi denda...
        </div>
        <select
          v-else-if="penaltyTransactions.length > 0"
          v-model="payForm.transaksiId"
          class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-mustard focus:border-mustard outline-none transition bg-white cursor-pointer"
          :class="{ 'border-rose-500': payErrors.transaksiId }"
        >
          <option value="" disabled>-- Pilih transaksi yang terkena denda --</option>
          <option v-for="t in penaltyTransactions" :key="t.id" :value="t.id">
            {{ t.kdTransaksi }} - {{ t.judulBuku }} (Status: {{ t.status }})
          </option>
        </select>
        <div v-else class="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-500">
          Tidak ada transaksi peminjaman aktif yang berstatus terlambat saat ini.
        </div>
        <p v-if="payErrors.transaksiId" class="text-xs text-rose-500 mt-1">
          {{ payErrors.transaksiId }}
        </p>
      </div>

      <!-- Pilihan Metode Pembayaran Tripay -->
      <div>
        <label class="block text-xs font-semibold text-charcoalDark mb-1">
          Metode Pembayaran Online <span class="text-rose-500">*</span>
        </label>
        <div class="space-y-2">
          <label
            v-for="m in paymentMethods"
            :key="m.code"
            class="flex items-center justify-between p-3 border rounded-xl cursor-pointer transition"
            :class="
              payForm.paymentMethodCode === m.code
                ? 'border-mustard bg-amber-50/50 shadow-xs'
                : 'border-gray-200 hover:bg-gray-50'
            "
          >
            <div class="flex items-center gap-3">
              <input
                type="radio"
                name="paymentMethod"
                :value="m.code"
                v-model="payForm.paymentMethodCode"
                class="text-mustard focus:ring-mustard"
              />
              <div>
                <p class="text-xs font-bold text-charcoalDark">{{ m.name }}</p>
                <p class="text-[10px] text-gray-500">{{ m.type }}</p>
              </div>
            </div>
            <span class="text-xs font-mono font-semibold text-gray-400">
              {{ m.code }}
            </span>
          </label>
        </div>
        <p v-if="payErrors.paymentMethodCode" class="text-xs text-rose-500 mt-1">
          {{ payErrors.paymentMethodCode }}
        </p>
      </div>

      <div class="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
        <Button variant="secondary" size="sm" @click="handleClose"> Batal </Button>
        <Button
          variant="primary"
          size="sm"
          type="submit"
          :loading="isSubmitting"
          :disabled="penaltyTransactions.length === 0"
          class="text-xs font-semibold bg-emerald-600! hover:bg-emerald-700! text-white!"
        >
          Lanjutkan ke Pembayaran
        </Button>
      </div>
    </form>
  </Modal>
</template>
