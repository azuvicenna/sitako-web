<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import { useMutation, useQueryClient } from '@tanstack/vue-query';
import { ArchiveBoxIcon } from '@heroicons/vue/24/outline';

import Modal from '@/components/common/Modal.vue';
import Button from '@/components/common/Button.vue';
import Input from '@/components/common/Input.vue';
import FormField from '@/components/common/FormField.vue';
import { api } from '@/utils/axios';
import { getErrorMessage } from '@/utils/error';
import { useToast } from '@/composables/useToast';
import { createShelfSchema } from '@/validations/librarian/shelf.schema';
import type { Shelf } from '@/types/shelf';

interface Props {
  modelValue: boolean;
  mode: 'create' | 'edit';
  shelf?: Shelf | null;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  mode: 'create',
  shelf: null,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'success'): void;
}>();

const queryClient = useQueryClient();
const { showToast } = useToast();

const form = reactive({
  id: '',
  namaRak: '',
});

const errors = ref<{ namaRak?: string }>({});

const resetForm = () => {
  if (props.mode === 'edit' && props.shelf) {
    form.id = props.shelf.id;
    form.namaRak = props.shelf.namaRak;
  } else {
    form.id = '';
    form.namaRak = '';
  }
  errors.value = {};
};

watch(
  () => [props.modelValue, props.shelf],
  ([isOpen]) => {
    if (isOpen) {
      resetForm();
    }
  },
  { immediate: true },
);

const shelfMutation = useMutation({
  mutationFn: async (payload: { id?: string; namaRak: string }) => {
    if (props.mode === 'create') {
      const res = await api.post('/shelves/', { namaRak: payload.namaRak });
      return res.data;
    } else {
      const res = await api.put(`/shelves/${payload.id}`, { namaRak: payload.namaRak });
      return res.data;
    }
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['shelves'] });
    emit('update:modelValue', false);
    emit('success');
    showToast(
      'success',
      props.mode === 'create'
        ? 'Rak buku berhasil ditambahkan!'
        : 'Data rak buku berhasil diperbarui!',
    );
  },
  onError: (err: unknown) => {
    showToast('danger', getErrorMessage(err, 'Gagal memproses data rak.'));
  },
});

const submitForm = () => {
  errors.value = {};
  const validation = createShelfSchema.safeParse({ namaRak: form.namaRak });

  if (!validation.success) {
    errors.value = {
      namaRak: validation.error.flatten().fieldErrors.namaRak?.[0],
    };
    return;
  }

  shelfMutation.mutate({
    id: props.mode === 'edit' ? form.id : undefined,
    namaRak: form.namaRak,
  });
};
</script>

<template>
  <Modal
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    :title="mode === 'create' ? 'Tambah Rak Buku' : 'Ubah Nama Rak'"
    :description="
      mode === 'create'
        ? 'Tambahkan identitas rak baru untuk mengelompokkan lokasi buku fisik.'
        : 'Perbarui nama identitas rak perpustakaan.'
    "
    :icon="ArchiveBoxIcon"
    size="md"
  >
    <form @submit.prevent="submitForm" class="space-y-4 pt-1">
      <FormField label="Nama Rak Buku" required :error="errors.namaRak">
        <Input
          v-model="form.namaRak"
          placeholder="Contoh: Rak A1 - Sains & Matematika"
          :disabled="shelfMutation.isPending.value"
        />
      </FormField>
    </form>

    <template #footer="{ close }">
      <Button variant="secondary" @click="close" :disabled="shelfMutation.isPending.value">
        Batal
      </Button>
      <Button variant="primary" @click="submitForm" :disabled="shelfMutation.isPending.value">
        {{ shelfMutation.isPending.value ? 'Menyimpan...' : 'Simpan Rak' }}
      </Button>
    </template>
  </Modal>
</template>
