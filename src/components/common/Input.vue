<script setup lang="ts">
import type { Component } from 'vue';

interface Props {
  modelValue?: string | number;
  type?: string;
  placeholder?: string;
  icon?: Component;
  iconRight?: Component;
  disabled?: boolean;
  id?: string;
  name?: string;
}

withDefaults(defineProps<Props>(), {
  modelValue: '',
  type: 'text',
  placeholder: '',
  disabled: false,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'keydown', event: KeyboardEvent): void;
  (e: 'focus', event: FocusEvent): void;
  (e: 'blur', event: FocusEvent): void;
}>();

const onInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.value);
};
</script>

<template>
  <div class="relative w-full">
    <div
      v-if="icon || $slots.icon"
      class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
    >
      <slot name="icon">
        <component :is="icon" v-if="icon" class="w-5 h-5 text-gray-500 shrink-0" />
      </slot>
    </div>
    <input
      :id="id"
      :name="name"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      @input="onInput"
      @keydown="emit('keydown', $event)"
      @focus="emit('focus', $event)"
      @blur="emit('blur', $event)"
      :class="[
        'block w-full py-2 bg-gray-50 border border-gray-200 rounded-md text-sm placeholder-gray-500 focus:outline-none focus:border-mustard focus:ring-1 focus:ring-mustard transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        icon || $slots.icon ? 'pl-10' : 'pl-3',
        iconRight || $slots.iconRight ? 'pr-10' : 'pr-3',
      ]"
    />
    <div
      v-if="iconRight || $slots.iconRight"
      class="absolute inset-y-0 right-0 pr-3 flex items-center"
    >
      <slot name="iconRight">
        <component
          :is="iconRight"
          v-if="iconRight"
          class="w-5 h-5 text-gray-500 shrink-0 pointer-events-none"
        />
      </slot>
    </div>
  </div>
</template>
