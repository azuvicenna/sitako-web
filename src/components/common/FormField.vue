<script setup lang="ts">
interface Props {
  label?: string;
  required?: boolean;
  error?: string;
  hint?: string;
}

withDefaults(defineProps<Props>(), {
  required: false,
});
</script>

<template>
  <div class="space-y-1 w-full">
    <label v-if="label" class="block text-xs font-bold text-charcoalDark">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>

    <slot />

    <p v-if="hint && !error" class="text-[11px] text-gray-400">
      {{ hint }}
    </p>

    <p v-if="error" class="text-xs text-red-500 font-medium mt-0.5">
      {{ error }}
    </p>
  </div>
</template>
