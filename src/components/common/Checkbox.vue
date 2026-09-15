<script setup lang="ts">
import { computed } from 'vue'
import { CheckIcon } from '@heroicons/vue/16/solid'

interface Props {
  modelValue?: boolean | any[]
  value?: any
  label?: string
  description?: string
  disabled?: boolean
  id?: string
  name?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  value: null,
  disabled: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean | any[]): void
  (e: 'change', value: boolean | any[]): void
}>()

const isChecked = computed(() => {
  if (Array.isArray(props.modelValue)) {
    return props.modelValue.includes(props.value)
  }
  return Boolean(props.modelValue)
})

const handleChange = () => {
  if (props.disabled) return

  let newValue: boolean | any[]

  if (Array.isArray(props.modelValue)) {
    const list = [...props.modelValue]
    const idx = list.indexOf(props.value)
    if (idx === -1) {
      list.push(props.value)
    } else {
      list.splice(idx, 1)
    }
    newValue = list
  } else {
    newValue = !props.modelValue
  }

  emit('update:modelValue', newValue)
  emit('change', newValue)
}
</script>

<template>
  <label
    :class="[
      'inline-flex items-start gap-2.5 select-none',
      disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
    ]"
  >
    <div class="relative flex items-center mt-0.5">
      <input
        :id="id"
        :name="name"
        type="checkbox"
        :checked="isChecked"
        :disabled="disabled"
        @change="handleChange"
        class="sr-only peer"
      />
      <div
        :class="[
          'w-4.5 h-4.5 rounded border flex items-center justify-center transition-all duration-150',
          isChecked
            ? 'bg-mustard border-mustard text-charcoalDark'
            : 'bg-white border-gray-300 hover:border-gray-400 peer-focus-visible:ring-2 peer-focus-visible:ring-mustard/40'
        ]"
      >
        <CheckIcon
          v-if="isChecked"
          class="w-3.5 h-3.5 stroke-[2.5]"
        />
      </div>
    </div>

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
