<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import { useMutation, useQueryClient } from '@tanstack/vue-query';
import { Cog6ToothIcon } from '@heroicons/vue/24/outline';

import Modal from '@/components/common/Modal.vue';
import Button from '@/components/common/Button.vue';
import Input from '@/components/common/Input.vue';
import Select from '@/components/common/Select.vue';
import FormField from '@/components/common/FormField.vue';
import { api } from '@/utils/axios';
import { getErrorMessage } from '@/utils/error';
import { useToast } from '@/composables/useToast';
import { createFineSchema, updateFineSchema } from '@/validations/librarian/fine.schema';
import type { FineRule } from '@/types/fine';
import type { Book } from '@/types/book';

interface Props {
  modelValue: boolean;
  mode: 'create' | 'edit';
  rule?: FineRule | null;
  availableBooks?: Book[];
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  mode: 'create',
  rule: null,
  availableBooks: () => [],
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'success'): void;
}>();

const queryClient = useQueryClient();
const { showToast } = useToast();

const form = reactive({
  id: '',
  bukuId: '',
  jenisDenda: 'Terlambat' as 'Terlambat' | 'Hilang',
  hargaDenda: 1000,
  metodePerhitungan: 'Akumulasi' as 'Akumulasi' | 'Flat',
});

const errors = ref<{ bukuId?: string; hargaDenda?: string }>({});

const resetForm = () => {
  if (props.mode === 'edit' && props.rule) {
    form.id = props.rule.id;
    form.bukuId = props.rule.bukuId;
    form.jenisDenda = props.rule.jenisDenda;
    form.hargaDenda = props.rule.hargaDenda;
    form.metodePerhitungan = props.rule.metodePerhitungan;
  } else {
    form.id = '';
    form.bukuId = '';
    form.jenisDenda = 'Terlambat';
    form.hargaDenda = 1000;
    form.metodePerhitungan = 'Akumulasi';
  }
  errors.value = {};
};

watch(
  () => [props.modelValue, props.rule],
  ([isOpen]) => {
    if (isOpen) {
      resetForm();
    }
  },
  { immediate: true },
);

const ruleMutation = useMutation({
  mutationFn: async (payload: typeof form) => {
    if (props.mode === 'create') {
      const res = await api.post('/fines/', {
        bukuId: payload.bukuId,
        jenisDenda: payload.jenisDenda,
        hargaDenda: Number(payload.hargaDenda),
        metodePerhitungan: payload.metodePerhitungan,
      });
      return res.data;
    } else {
      const res = await api.put(`/fines/${payload.id}`, {
        hargaDenda: Number(payload.hargaDenda),
        metodePerhitungan: payload.metodePerhitungan,
      });
      return res.data;
    }
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['fine-rules'] });
    emit('update:modelValue', false);
    emit('success');
    showToast(
      'success',
      props.mode === 'create'
        ? 'Aturan denda baru berhasil disimpan!'
        : 'Aturan denda berhasil diperbarui!',
    );
  },
  onError: (err: unknown) => {
    showToast('danger', getErrorMessage(err, 'Gagal menyimpan aturan denda.'));
  },
});

const submitForm = () => {
  errors.value = {};

  if (props.mode === 'create') {
    const validation = createFineSchema.safeParse({
      bukuId: form.bukuId,
      jenisDenda: form.jenisDenda,
      hargaDenda: Number(form.hargaDenda),
      metodePerhitungan: form.metodePerhitungan,
    });

    if (!validation.success) {
      const fieldErrors = validation.error.flatten().fieldErrors;
      errors.value = {
        bukuId: fieldErrors.bukuId?.[0],
        hargaDenda: fieldErrors.hargaDenda?.[0],
      };
      return;
    }
  } else {
    const validation = updateFineSchema.safeParse({
      hargaDenda: Number(form.hargaDenda),
      metodePerhitungan: form.metodePerhitungan,
    });

    if (!validation.success) {
      const fieldErrors = validation.error.flatten().fieldErrors;
      errors.value = {
        hargaDenda: fieldErrors.hargaDenda?.[0],
      };
      return;
    }
  }

  ruleMutation.mutate(form);
};
</script>

<template>
  <Modal
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    :title="mode === 'create' ? 'Tambah Aturan Tarif Denda' : 'Ubah Aturan Tarif Denda'"
    :description="
      mode === 'create'
        ? 'Tentukan besaran nominal tarif denda dan metode perhitungan per buku.'
        : 'Perbarui besaran tarif denda atau metode perhitungannya.'
    "
    :icon="Cog6ToothIcon"
    size="md"
  >
    <form @submit.prevent="submitForm" class="space-y-4 pt-1">
      <FormField v-if="mode === 'create'" label="Pilih Buku" required :error="errors.bukuId">
        <Select
          v-model="form.bukuId"
          :disabled="ruleMutation.isPending.value"
          placeholder="-- Pilih Buku --"
          :options="
            availableBooks.map((buku) => ({
              label: `${buku.judul} (${buku.isbn || 'No ISBN'})`,
              value: buku.id,
            }))
          "
        />
      </FormField>

      <FormField label="Jenis Pelanggaran Denda" required>
        <Select
          v-model="form.jenisDenda"
          :disabled="ruleMutation.isPending.value"
          :options="[
            { label: 'Keterlambatan Pengembalian', value: 'Terlambat' },
            { label: 'Buku Hilang / Rusak Berat', value: 'Hilang' },
          ]"
        />
      </FormField>

      <FormField label="Nomor Tarif Denda (Rp)" required :error="errors.hargaDenda">
        <Input
          type="number"
          v-model="form.hargaDenda"
          placeholder="Contoh: 1000"
          :disabled="ruleMutation.isPending.value"
        />
      </FormField>

      <FormField label="Metode Perhitungan" required>
        <Select
          v-model="form.metodePerhitungan"
          :disabled="ruleMutation.isPending.value"
          :options="[
            { label: 'Akumulasi (Dikalikan per hari keterlambatan)', value: 'Akumulasi' },
            { label: 'Flat (Tarif tetap satu kali bayar)', value: 'Flat' },
          ]"
        />
      </FormField>
    </form>

    <template #footer="{ close }">
      <Button variant="secondary" @click="close" :disabled="ruleMutation.isPending.value">
        Batal
      </Button>
      <Button variant="primary" @click="submitForm" :disabled="ruleMutation.isPending.value">
        {{ ruleMutation.isPending.value ? 'Menyimpan...' : 'Simpan Aturan' }}
      </Button>
    </template>
  </Modal>
</template>
