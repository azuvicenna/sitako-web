<script setup lang="ts">
export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

interface Props {
  modelValue?: string | number;
  options?: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
}

withDefaults(defineProps<Props>(), {
  modelValue: '',
  options: () => [],
  placeholder: '',
  disabled: false,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const onChange = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  emit('update:modelValue', target.value);
};
</script>

<template>
  <div class="relative w-full">
    <select
      :id="id"
      :name="name"
      :value="modelValue"
      :disabled="disabled"
      @change="onChange"
      class="block w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-charcoal focus:outline-none focus:border-mustard focus:ring-1 focus:ring-mustard transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
    >
      <option v-if="placeholder" value="" disabled>
        {{ placeholder }}
      </option>
      <slot>
        <option
          v-for="opt in options"
          :key="String(opt.value)"
          :value="opt.value"
          :disabled="opt.disabled"
        >
          {{ opt.label }}
        </option>
      </slot>
    </select>
  </div>
</template>
