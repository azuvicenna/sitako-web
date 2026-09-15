<script setup lang="ts">
import { computed, type Component } from 'vue';

type AlertVariant = 'mustard' | 'danger' | 'success' | 'info';

interface Props {
  title?: string;
  description?: string;
  icon?: Component;
  variant?: AlertVariant;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'mustard',
});

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'danger':
      return {
        container: 'bg-red-50 border-red-200 text-red-900',
        icon: 'text-red-500',
        desc: 'text-red-700',
      };
    case 'success':
      return {
        container: 'bg-green-50 border-green-200 text-green-900',
        icon: 'text-green-500',
        desc: 'text-green-700',
      };
    case 'info':
      return {
        container: 'bg-blue-50 border-blue-200 text-blue-900',
        icon: 'text-blue-500',
        desc: 'text-blue-700',
      };
    case 'mustard':
    default:
      return {
        container: 'bg-mustard/10 border-mustard/30 text-charcoalDark',
        icon: 'text-mustardHover',
        desc: 'text-charcoal',
      };
  }
});
</script>

<template>
  <div :class="['p-5 rounded-xl border flex items-start gap-4', variantClasses.container]">
    <div v-if="icon || $slots.icon" class="mt-0.5 shrink-0">
      <slot name="icon">
        <component :is="icon" v-if="icon" :class="['w-6 h-6', variantClasses.icon]" />
      </slot>
    </div>

    <div class="flex-1">
      <slot name="title">
        <h4 v-if="title" class="font-bold text-sm leading-tight">{{ title }}</h4>
      </slot>
      <slot name="description">
        <p v-if="description" :class="['text-xs mt-1', variantClasses.desc]">{{ description }}</p>
      </slot>
      <slot />
    </div>

    <slot name="action" />
  </div>
</template>
