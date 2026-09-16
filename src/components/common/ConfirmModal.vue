<script setup lang="ts">
import { computed, type Component } from 'vue';
import { TrashIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline';
import Modal from './Modal.vue';
import Button from './Button.vue';

interface Props {
  modelValue: boolean;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  variant?: 'danger' | 'warning' | 'info';
  icon?: Component;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  title: 'Konfirmasi Hapus',
  description: 'Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.',
  confirmText: 'Ya, Hapus',
  cancelText: 'Batal',
  loading: false,
  variant: 'danger',
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'confirm'): void;
  (e: 'cancel'): void;
}>();

const modalIcon = computed(() => {
  if (props.icon) return props.icon;
  if (props.variant === 'warning') return ExclamationTriangleIcon;
  return TrashIcon;
});

const modalIconVariant = computed(() => {
  if (props.variant === 'warning') return 'mustard';
  return props.variant;
});

const handleCancel = () => {
  emit('update:modelValue', false);
  emit('cancel');
};

const handleConfirm = () => {
  emit('confirm');
};
</script>

<template>
  <Modal
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    :title="title"
    :description="description"
    :icon="modalIcon"
    :icon-variant="modalIconVariant"
    size="md"
  >
    <slot />

    <template #footer>
      <Button variant="secondary" @click="handleCancel" :disabled="loading">
        {{ cancelText }}
      </Button>
      <Button variant="dark" @click="handleConfirm" :disabled="loading">
        {{ loading ? 'Memproses...' : confirmText }}
      </Button>
    </template>
  </Modal>
</template>
