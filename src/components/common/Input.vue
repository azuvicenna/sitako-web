<script setup lang="ts">
import type { Component } from 'vue'

interface Props {
  modelValue?: string | number
  type?: string
  placeholder?: string
  icon?: Component
  disabled?: boolean
  id?: string
  name?: string
}

withDefaults(defineProps<Props>(), {
  modelValue: '',
  type: 'text',
  placeholder: '',
  disabled: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const onInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}
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
      :class="[
        'block w-full pr-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm placeholder-gray-500 focus:outline-none focus:border-mustard focus:ring-1 focus:ring-mustard transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        icon || $slots.icon ? 'pl-10' : 'pl-3',
      ]"
    />
  </div>
</template>
