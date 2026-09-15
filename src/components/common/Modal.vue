<script setup lang="ts">
import { computed, watch, onMounted, onUnmounted, type Component } from 'vue';
import { XMarkIcon } from '@heroicons/vue/24/outline';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl';
type IconVariant = 'mustard' | 'danger' | 'info' | 'success';

interface Props {
  modelValue: boolean;
  title?: string;
  description?: string;
  icon?: Component;
  iconVariant?: IconVariant;
  size?: ModalSize;
  closeOnOverlayClick?: boolean;
  showCloseButton?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  size: 'md',
  iconVariant: 'mustard',
  closeOnOverlayClick: true,
  showCloseButton: true,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'close'): void;
}>();

const close = () => {
  emit('update:modelValue', false);
  emit('close');
};

const handleOverlayClick = () => {
  if (props.closeOnOverlayClick) {
    close();
  }
};

// Size mapping
const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'max-w-sm';
    case 'lg':
      return 'max-w-lg';
    case 'xl':
      return 'max-w-xl';
    case '2xl':
      return 'max-w-2xl';
    case 'md':
    default:
      return 'max-w-md';
  }
});

// Icon variant styling
const iconVariantClasses = computed(() => {
  switch (props.iconVariant) {
    case 'danger':
      return 'bg-red-100 text-red-600';
    case 'success':
      return 'bg-green-100 text-green-600';
    case 'info':
      return 'bg-blue-100 text-blue-600';
    case 'mustard':
    default:
      return 'bg-mustard/15 text-mustardHover';
  }
});

// Escape key listener & body scroll lock
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.modelValue) {
    close();
  }
};

watch(
  () => props.modelValue,
  (val) => {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = val ? 'hidden' : '';
    }
  },
);

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
  if (typeof document !== 'undefined') {
    document.body.style.overflow = '';
  }
});
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
        role="dialog"
        aria-modal="true"
      >
        <!-- Backdrop -->
        <div
          class="fixed inset-0 bg-charcoalDark/60 backdrop-blur-xs transition-opacity"
          @click="handleOverlayClick"
        />

        <!-- Modal Dialog -->
        <div
          :class="[
            'relative w-full bg-white rounded-2xl border border-gray-200 shadow-2xl z-10 my-8 overflow-hidden transition-all',
            sizeClasses,
          ]"
        >
          <!-- Header -->
          <div class="p-6 pb-4">
            <slot name="header">
              <div class="flex items-start justify-between gap-4">
                <div class="flex items-start gap-3.5">
                  <div
                    v-if="icon || $slots.icon"
                    :class="[
                      'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                      iconVariantClasses,
                    ]"
                  >
                    <slot name="icon">
                      <component :is="icon" v-if="icon" class="w-6 h-6" />
                    </slot>
                  </div>
                  <div>
                    <h3 v-if="title" class="text-lg font-bold text-charcoalDark leading-snug">
                      {{ title }}
                    </h3>
                    <p v-if="description" class="text-xs text-gray-500 mt-1 leading-relaxed">
                      {{ description }}
                    </p>
                  </div>
                </div>

                <button
                  v-if="showCloseButton"
                  type="button"
                  @click="close"
                  class="text-gray-400 hover:text-charcoalDark p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
                >
                  <XMarkIcon class="w-5 h-5" />
                </button>
              </div>
            </slot>
          </div>

          <!-- Body (Content / Form inputs) -->
          <div v-if="$slots.default" class="px-6 py-2">
            <slot />
          </div>

          <!-- Footer (Actions) -->
          <div
            v-if="$slots.footer"
            class="px-6 py-4 bg-gray-50/80 border-t border-gray-100 flex items-center justify-end gap-3"
          >
            <slot name="footer" :close="close" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active :deep(.relative),
.modal-fade-leave-active :deep(.relative) {
  transition:
    transform 0.2s cubic-bezier(0.16, 1, 0.3, 1),
    opacity 0.2s ease;
}

.modal-fade-enter-from :deep(.relative) {
  opacity: 0;
  transform: scale(0.95);
}

.modal-fade-leave-to :deep(.relative) {
  opacity: 0;
  transform: scale(0.98);
}
</style>
