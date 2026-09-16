<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import { useMutation, useQueryClient } from '@tanstack/vue-query';
import dayjs from 'dayjs';
import { BanknotesIcon } from '@heroicons/vue/24/outline';

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
  createFinePaymentSchema,
  updateFinePaymentSchema,
} from '@/validations/librarian/fine-payment.schema';
import type { FinePayment } from '@/types/fine';
import type { MemberUser } from '@/types/auth';
import type { Transaction } from '@/types/transaction';

interface Props {
  modelValue: boolean;
  mode: 'create' | 'edit';
  payment?: FinePayment | null;
  availableTransactions?: Transaction[];
  availableMembers?: MemberUser[];
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  mode: 'create',
  payment: null,
  availableTransactions: () => [],
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
  transaksiId: '',
  anggotaId: '',
  pustakawanId: '',
  hargaDenda: 1000,
  totalDenda: 1000,
  metodePembayaran: 'Tunai' as 'Tunai' | 'Non-Tunai',
  paymentStatus: 'PAID' as 'UNPAID' | 'PAID' | 'EXPIRED' | 'FAILED',
  tglBayar: dayjs().format('YYYY-MM-DD'),
});

const errors = ref<Record<string, string | undefined>>({});

const resetForm = () => {
  if (props.mode === 'edit' && props.payment) {
    form.id = props.payment.id;
    form.transaksiId = props.payment.transaksiId || '';
    form.anggotaId = props.payment.anggotaId || '';
    form.pustakawanId = props.payment.pustakawanId || authStore.user?.id || '';
    form.hargaDenda = props.payment.hargaDenda;
    form.totalDenda = props.payment.totalDenda;
    form.metodePembayaran = props.payment.metodePembayaran;
    form.paymentStatus = props.payment.paymentStatus || 'PAID';
    form.tglBayar = props.payment.tglBayar
      ? dayjs(props.payment.tglBayar).format('YYYY-MM-DD')
      : dayjs().format('YYYY-MM-DD');
  } else {
    form.id = '';
    form.transaksiId = '';
    form.anggotaId = '';
    form.pustakawanId = authStore.user?.id || '';
    form.hargaDenda = 1000;
    form.totalDenda = 1000;
    form.metodePembayaran = 'Tunai';
    form.paymentStatus = 'PAID';
    form.tglBayar = dayjs().format('YYYY-MM-DD');
  }
  errors.value = {};
};

watch(
  () => [props.modelValue, props.payment],
  ([isOpen]) => {
    if (isOpen) {
      resetForm();
    }
  },
  { immediate: true },
);

const paymentMutation = useMutation({
  mutationFn: async (payload: typeof form) => {
    if (props.mode === 'create') {
      const res = await api.post('/fine-payments/', {
        transaksiId: payload.transaksiId,
        anggotaId: payload.anggotaId,
        pustakawanId: payload.pustakawanId || authStore.user?.id,
        hargaDenda: Number(payload.hargaDenda),
        totalDenda: Number(payload.totalDenda),
        metodePembayaran: payload.metodePembayaran,
        tglBayar: new Date(payload.tglBayar).toISOString(),
      });
      return res.data;
    } else {
      const res = await api.put(`/fine-payments/${payload.id}`, {
        totalDenda: Number(payload.totalDenda),
        metodePembayaran: payload.metodePembayaran,
        paymentStatus: payload.paymentStatus,
      });
      return res.data;
    }
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['fine-payments'] });
    emit('update:modelValue', false);
    emit('success');
    showToast(
      'success',
      props.mode === 'create'
        ? 'Pembayaran denda berhasil dicatat!'
        : 'Data pembayaran denda berhasil diperbarui!',
    );
  },
  onError: (err: unknown) => {
    showToast('danger', getErrorMessage(err, 'Gagal menyimpan pembayaran denda.'));
  },
});

const submitForm = () => {
  errors.value = {};

  if (props.mode === 'create') {
    const validation = createFinePaymentSchema.safeParse({
      pustakawanId: form.pustakawanId || authStore.user?.id,
      anggotaId: form.anggotaId,
      transaksiId: form.transaksiId,
      hargaDenda: Number(form.hargaDenda),
      totalDenda: Number(form.totalDenda),
      metodePembayaran: form.metodePembayaran,
      tglBayar: new Date(form.tglBayar),
    });

    if (!validation.success) {
      const fieldErrors = validation.error.flatten().fieldErrors;
      errors.value = {
        transaksiId: fieldErrors.transaksiId?.[0],
        anggotaId: fieldErrors.anggotaId?.[0],
        totalDenda: fieldErrors.totalDenda?.[0],
        hargaDenda: fieldErrors.hargaDenda?.[0],
      };
      return;
    }
  } else {
    const validation = updateFinePaymentSchema.safeParse({
      totalDenda: Number(form.totalDenda),
      metodePembayaran: form.metodePembayaran,
      paymentStatus: form.paymentStatus,
    });

    if (!validation.success) {
      const fieldErrors = validation.error.flatten().fieldErrors;
      errors.value = {
        totalDenda: fieldErrors.totalDenda?.[0],
      };
      return;
    }
  }

  paymentMutation.mutate(form);
};
</script>

<template>
  <Modal
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    :title="mode === 'create' ? 'Catat Pembayaran Denda Tunai' : 'Ubah Data Pembayaran Denda'"
    :description="
      mode === 'create'
        ? 'Catat pembayaran denda secara langsung (tunai) di meja sirkulasi perpustakaan.'
        : 'Perbarui rincian atau status verifikasi pembayaran denda.'
    "
    :icon="BanknotesIcon"
    size="lg"
  >
    <form @submit.prevent="submitForm" class="space-y-4 pt-1">
      <!-- Transaksi Terkait (Create Only) -->
      <FormField
        v-if="mode === 'create'"
        label="Pilih Transaksi Sirkulasi"
        required
        :error="errors.transaksiId"
      >
        <Select
          v-model="form.transaksiId"
          :disabled="paymentMutation.isPending.value"
          placeholder="-- Pilih Transaksi --"
          :options="
            availableTransactions.map((trx) => ({
              label: `${trx.kdTransaksi} - ${trx.namaAnggota} (${trx.judulBuku})`,
              value: trx.id,
            }))
          "
        />
      </FormField>

      <!-- Anggota Terkait (Create Only) -->
      <FormField
        v-if="mode === 'create'"
        label="Anggota / Siswa"
        required
        :error="errors.anggotaId"
      >
        <Select
          v-model="form.anggotaId"
          :disabled="paymentMutation.isPending.value"
          placeholder="-- Pilih Anggota --"
          :options="
            availableMembers.map((mem) => ({
              label: `${mem.nama} (NIS: ${mem.nis})`,
              value: mem.id,
            }))
          "
        />
      </FormField>

      <!-- Grid Nominal -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Tarif Dasar Denda (Rp)" required :error="errors.hargaDenda">
          <Input
            type="number"
            v-model="form.hargaDenda"
            placeholder="1000"
            :disabled="paymentMutation.isPending.value"
          />
        </FormField>

        <FormField label="Total Denda Diterima (Rp)" required :error="errors.totalDenda">
          <Input
            type="number"
            v-model="form.totalDenda"
            placeholder="1000"
            :disabled="paymentMutation.isPending.value"
          />
        </FormField>
      </div>

      <!-- Grid Metode & Status / Tanggal -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Metode Pembayaran">
          <Select
            v-model="form.metodePembayaran"
            :disabled="paymentMutation.isPending.value"
            :options="[
              { label: 'Tunai (Di Perpustakaan)', value: 'Tunai' },
              { label: 'Non-Tunai (Tripay Gateway)', value: 'Non-Tunai' },
            ]"
          />
        </FormField>

        <FormField v-if="mode === 'edit'" label="Status Pembayaran">
          <Select
            v-model="form.paymentStatus"
            :disabled="paymentMutation.isPending.value"
            :options="[
              { label: 'Lunas (PAID)', value: 'PAID' },
              { label: 'Belum Dibayar (UNPAID)', value: 'UNPAID' },
              { label: 'Kedaluwarsa (EXPIRED)', value: 'EXPIRED' },
              { label: 'Gagal (FAILED)', value: 'FAILED' },
            ]"
          />
        </FormField>

        <FormField v-else label="Tanggal Pembayaran">
          <Input type="date" v-model="form.tglBayar" :disabled="paymentMutation.isPending.value" />
        </FormField>
      </div>
    </form>

    <template #footer="{ close }">
      <Button variant="secondary" @click="close" :disabled="paymentMutation.isPending.value">
        Batal
      </Button>
      <Button variant="primary" @click="submitForm" :disabled="paymentMutation.isPending.value">
        {{ paymentMutation.isPending.value ? 'Menyimpan...' : 'Simpan Pembayaran' }}
      </Button>
    </template>
  </Modal>
</template>
