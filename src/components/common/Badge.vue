<script setup lang="ts">
import { computed, type Component } from 'vue';

export type BadgeVariant = 'mustard' | 'warning' | 'success' | 'danger' | 'info' | 'neutral';
export type BadgeSize = 'sm' | 'md' | 'lg';

interface Props {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  icon?: Component;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'neutral',
  size: 'md',
  dot: false,
});

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'warning':
      return {
        badge: 'bg-amber-100 text-amber-800 border-amber-200/60',
        dot: 'bg-amber-500',
      };
    case 'success':
      return {
        badge: 'bg-emerald-100 text-emerald-800 border-emerald-200/60',
        dot: 'bg-emerald-500',
      };
    case 'danger':
      return {
        badge: 'bg-rose-100 text-rose-800 border-rose-200/60',
        dot: 'bg-rose-500',
      };
    case 'info':
      return {
        badge: 'bg-sky-100 text-sky-800 border-sky-200/60',
        dot: 'bg-sky-500',
      };
    case 'mustard':
      return {
        badge: 'bg-mustard/15 text-charcoalDark border-mustard/30',
        dot: 'bg-mustard',
      };
    case 'neutral':
    default:
      return {
        badge: 'bg-gray-100 text-gray-700 border-gray-200',
        dot: 'bg-gray-400',
      };
  }
});

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'text-[11px] px-2 py-0.5 gap-1';
    case 'lg':
      return 'text-sm px-3 py-1 gap-1.5';
    case 'md':
    default:
      return 'text-xs px-2.5 py-1 gap-1.5';
  }
});
</script>

<template>
  <span
    :class="[
      'inline-flex items-center justify-center font-semibold rounded-full border',
      variantClasses.badge,
      sizeClasses,
    ]"
  >
    <span v-if="dot" :class="['w-1.5 h-1.5 rounded-full shrink-0', variantClasses.dot]" />
    <component :is="icon" v-if="icon" class="w-3.5 h-3.5 shrink-0" />
    <slot />
  </span>
</template>
