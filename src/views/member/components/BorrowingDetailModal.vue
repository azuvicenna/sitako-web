<script setup lang="ts">
import dayjs from 'dayjs';
import Button from '@/components/common/Button.vue';
import Modal from '@/components/common/Modal.vue';
import Badge from '@/components/common/Badge.vue';
import { getStatusBadgeVariant } from '@/utils/transaction';
import type { MemberTransactionItem } from '@/types/member-transaction';

interface Props {
  modelValue: boolean;
  transaction: MemberTransactionItem | null;
}

withDefaults(defineProps<Props>(), {
  modelValue: false,
  transaction: null,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();

const handleClose = () => {
  emit('update:modelValue', false);
};
</script>

<template>
  <Modal
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    title="Detail Transaksi Peminjaman"
    size="md"
  >
    <div v-if="transaction" class="space-y-4 text-xs">
      <div class="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
        <div class="flex justify-between items-center pb-2 border-b border-gray-200">
          <span class="text-gray-500">Status Peminjaman</span>
          <Badge :variant="getStatusBadgeVariant(transaction.status)">
            {{ transaction.status }}
          </Badge>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-500">Kode Transaksi</span>
          <span class="font-mono font-bold text-charcoalDark">
            {{ transaction.kdTransaksi }}
          </span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-500">Judul Buku</span>
          <span class="font-semibold text-charcoalDark text-right max-w-xs">
            {{ transaction.judulBuku }}
          </span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-500">Petugas Sirkulasi</span>
          <span class="font-medium text-charcoalDark">
            {{ transaction.namaPustakawan || '-' }}
          </span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-500">Tanggal Pinjam</span>
          <span class="font-medium text-charcoalDark">
            {{ dayjs(transaction.tglPinjam).format('DD MMMM YYYY') }}
          </span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-500">Batas Waktu Kembali</span>
          <span
            :class="[
              'font-bold',
              dayjs().isAfter(dayjs(transaction.tglKembali)) && transaction.status === 'Dipinjam'
                ? 'text-rose-600'
                : 'text-charcoalDark',
            ]"
          >
            {{ dayjs(transaction.tglKembali).format('DD MMMM YYYY') }}
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
