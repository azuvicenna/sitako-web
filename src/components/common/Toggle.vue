<script setup lang="ts">
import { computed } from 'vue'

export type ToggleSize = 'sm' | 'md' | 'lg'

interface Props {
  modelValue?: boolean
  label?: string
  description?: string
  disabled?: boolean
  size?: ToggleSize
  id?: string
  name?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  disabled: false,
  size: 'md',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'change', value: boolean): void
}>()

const handleToggle = () => {
  if (props.disabled) return
  const next = !props.modelValue
  emit('update:modelValue', next)
  emit('change', next)
}

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return {
        track: 'w-7 h-4',
        thumb: 'w-3 h-3',
        translate: 'translate-x-3',
      }
    case 'lg':
      return {
        track: 'w-12 h-7',
        thumb: 'w-5 h-5',
        translate: 'translate-x-5',
      }
    case 'md':
    default:
      return {
        track: 'w-10 h-5.5',
        thumb: 'w-4 h-4',
        translate: 'translate-x-4.5',
      }
  }
})
</script>

<template>
  <label
    :class="[
      'inline-flex items-start gap-2.5 select-none',
      disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
    ]"
  >
    <button
      :id="id"
      :name="name"
      type="button"
      role="switch"
      :aria-checked="modelValue"
      :disabled="disabled"
      @click="handleToggle"
      :class="[
        'relative inline-flex items-center shrink-0 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-mustard/50 p-0.5',
        sizeClasses.track,
        modelValue ? 'bg-mustard' : 'bg-gray-300'
      ]"
    >
      <span
        :class="[
          'pointer-events-none inline-block rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ease-in-out',
          sizeClasses.thumb,
          modelValue ? sizeClasses.translate : 'translate-x-0'
        ]"
      />
    </button>

    <div v-if="label || description || $slots.default" class="flex flex-col">
      <span class="text-sm font-medium text-charcoalDark leading-tight">
        <slot>{{ label }}</slot>
      </span>
      <span v-if="description" class="text-xs text-gray-500 mt-0.5">
        {{ description }}
      </span>
    </div>
  </label>
</template>
