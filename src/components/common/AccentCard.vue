<script setup lang="ts">
interface Props {
  accentColor?: string;
}

withDefaults(defineProps<Props>(), {
  accentColor: 'border-t-mustard',
});
</script>

<template>
  <div
    :class="['bg-white p-5 rounded-xl border border-gray-200 shadow-sm border-t-4', accentColor]"
  >
    <slot />
  </div>
</template>
