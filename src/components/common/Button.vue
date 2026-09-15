<script setup lang="ts">
import { computed, type Component } from 'vue'

interface Props {
  variant?: 'secondary' | 'primary' | 'dark'
  type?: 'button' | 'submit' | 'reset'
  icon?: Component
  disabled?: boolean
  href?: string
  target?: string
  rel?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'secondary',
  type: 'button',
  disabled: false,
})

const isLink = computed(() => !!props.href)

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'primary':
      return 'bg-mustard hover:bg-mustardHover text-charcoalDark border border-transparent'
    case 'dark':
      return 'bg-charcoalDark hover:bg-charcoal text-white border border-transparent'
    case 'secondary':
    default:
      return 'bg-gray-100 hover:bg-secondary text-charcoalDark border border-gray-200'
  }
})
</script>

<template>
  <component
    :is="isLink ? 'a' : 'button'"
    :href="href"
    :target="target"
    :rel="rel"
    :type="isLink ? undefined : type"
    :disabled="isLink ? undefined : disabled"
    :class="[
      'px-4 py-2 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
      variantClasses,
    ]"
  >
    <slot name="icon">
      <component :is="icon" v-if="icon" class="w-5 h-5 shrink-0" />
    </slot>
    <slot />
    <slot name="iconRight" />
  </component>
</template>
